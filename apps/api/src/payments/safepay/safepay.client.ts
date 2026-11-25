import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import type { Environment } from '../../config/environment.js';
import { buildSafepayConfig, isSafepayConfigured, type SafepayConfig } from './safepay.config.js';

/**
 * Thin, typed client for the Safepay endpoints this application uses. Endpoints, headers and
 * the checkout URL format follow Safepay's documentation and its official Node SDK
 * (@sfpy/node-core 0.3.7). The SDK itself is not used: it is untyped and would add axios + qs
 * for three HTTP calls.
 *
 * Amounts are in the currency's smallest unit ("lowest denomination"): PKR 1,500 → 150000.
 */

const REQUEST_TIMEOUT_MS = 20_000;
/** Card payments through Safepay's CyberSource integration. */
const PAYMENT_INTENT = 'CYBERSOURCE';

export class SafepayError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number | null,
  ) {
    super(message);
    this.name = 'SafepayError';
  }
}

export interface CreatedTracker {
  /** Safepay's id for this payment session, e.g. "track_…". */
  token: string;
  state: string;
}

export interface PaymentReport {
  tracker: string;
  /** e.g. TRACKER_STARTED, TRACKER_ENDED (paid), TRACKER_REFUNDED. */
  state: string;
  amountMinor: number | null;
  currency: string | null;
  /** e.g. "VISA •••• 1005", when a card was used. */
  paymentMethod: string | null;
  /** Response body without anything card-sensitive beyond brand and last four digits. */
  raw: unknown;
}

const trackerResponseSchema = z.object({
  data: z.object({
    tracker: z.object({ token: z.string().min(1), state: z.string() }),
  }),
});

const passportResponseSchema = z.object({ data: z.string().min(1) });

const reportResponseSchema = z.object({
  data: z.object({
    tracker: z.object({
      token: z.string(),
      state: z.string(),
      purchase_totals: z
        .object({
          quote_amount: z.object({ amount: z.number(), currency: z.string() }).partial().optional(),
        })
        .partial()
        .optional(),
    }),
    action: z
      .object({
        payment_method: z
          .object({ card_type: z.string().optional(), last_four: z.string().optional() })
          .partial()
          .nullable()
          .optional(),
      })
      .partial()
      .nullable()
      .optional(),
  }),
});

@Injectable()
export class SafepayClient {
  private readonly logger = new Logger(SafepayClient.name);
  readonly config: SafepayConfig;

  constructor(configService: ConfigService<Environment, true>) {
    this.config = buildSafepayConfig({
      SAFEPAY_ENVIRONMENT: configService.get('SAFEPAY_ENVIRONMENT', { infer: true }),
      SAFEPAY_API_KEY: configService.get('SAFEPAY_API_KEY', { infer: true }),
      SAFEPAY_SECRET_KEY: configService.get('SAFEPAY_SECRET_KEY', { infer: true }),
      SAFEPAY_WEBHOOK_SECRET: configService.get('SAFEPAY_WEBHOOK_SECRET', { infer: true }),
    });
  }

  get isConfigured(): boolean {
    return isSafepayConfigured(this.config);
  }

  /** Step 1 — create the payment session ("tracker"): POST /order/payments/v3/ */
  async createTracker(params: {
    amountMinor: number;
    currency: string;
    orderId: string;
  }): Promise<CreatedTracker> {
    const body = await this.request('POST', '/order/payments/v3/', {
      merchant_api_key: this.config.apiKey,
      intent: PAYMENT_INTENT,
      mode: 'payment',
      currency: params.currency,
      amount: params.amountMinor,
      metadata: { order_id: params.orderId },
    });
    const parsed = trackerResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new SafepayError('Unexpected response when creating a Safepay payment', null);
    }
    return { token: parsed.data.data.tracker.token, state: parsed.data.data.tracker.state };
  }

  /** Step 2 — short-lived (1 hour) token that authorises the hosted checkout page. */
  async createCheckoutToken(): Promise<string> {
    const body = await this.request('POST', '/client/passport/v1/token');
    const parsed = passportResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new SafepayError('Unexpected response when creating a Safepay checkout token', null);
    }
    return parsed.data.data;
  }

  /** Step 3 — hosted checkout URL the customer is redirected to. */
  buildCheckoutUrl(params: {
    tracker: string;
    checkoutToken: string;
    orderId: string;
    redirectUrl: string;
    cancelUrl: string;
  }): string {
    const query = new URLSearchParams({
      environment: this.config.environment,
      tracker: params.tracker,
      tbt: params.checkoutToken,
      source: 'hosted',
      order_id: params.orderId,
      redirect_url: params.redirectUrl,
      cancel_url: params.cancelUrl,
    });
    return `${this.config.checkoutBaseUrl}?${query.toString()}`;
  }

  /** Server-side verification: GET /reporter/api/v1/payments/{tracker} */
  async fetchPayment(tracker: string): Promise<PaymentReport> {
    const body = await this.request(
      'GET',
      `/reporter/api/v1/payments/${encodeURIComponent(tracker)}`,
    );
    const parsed = reportResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new SafepayError('Unexpected response when fetching a Safepay payment', null);
    }

    const { tracker: trackerData, action } = parsed.data.data;
    const quote = trackerData.purchase_totals?.quote_amount;
    const card = action?.payment_method;
    let paymentMethod: string | null = null;
    if (card?.card_type !== undefined && card.last_four !== undefined) {
      paymentMethod = `${card.card_type} •••• ${card.last_four}`;
    }

    return {
      tracker: trackerData.token,
      state: trackerData.state,
      amountMinor: quote?.amount ?? null,
      currency: quote?.currency ?? null,
      paymentMethod,
      raw: { tracker: trackerData, paymentMethod },
    };
  }

  private async request(method: 'GET' | 'POST', path: string, body?: unknown): Promise<unknown> {
    let response: Response;
    try {
      response = await fetch(`${this.config.apiBaseUrl}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'x-sfpy-merchant-secret': this.config.secretKey,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      this.logger.error({ err: error, method, path }, 'Safepay request failed to send');
      throw new SafepayError('Safepay could not be reached', null);
    }

    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      // Safepay error bodies describe the problem; they contain no secrets.
      this.logger.error(
        { method, path, httpStatus: response.status, payload },
        'Safepay request rejected',
      );
      throw new SafepayError(`Safepay returned HTTP ${response.status}`, response.status);
    }
    return payload;
  }
}
