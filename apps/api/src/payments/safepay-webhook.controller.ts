import {
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  type RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { Request } from 'express';
import { ResponseCode } from '@booking/shared-types';
import { Public } from '../auth/decorators/public.decorator.js';
import { AppException } from '../common/http/app.exception.js';
import { PaymentsService } from './payments.service.js';
import { isValidSafepayWebhookSignature } from './safepay/safepay-webhook-signature.js';
import { SafepayClient } from './safepay/safepay.client.js';

interface SafepayWebhookBody {
  token?: unknown;
  type?: unknown;
  data?: { tracker?: unknown };
}

/**
 * Safepay webhooks (Dashboard → Developers → Endpoints): https://<api>/api/v1/payments/safepay/webhook
 *
 * - Invalid signatures are refused (not acknowledged), as Safepay recommends.
 * - Valid events are acknowledged with 200 after the payment has been re-checked with Safepay;
 *   if that check fails the error makes Safepay retry later.
 * - Processing is idempotent, so Safepay's retries and duplicate events are harmless.
 */
@ApiExcludeController()
@Public()
@SkipThrottle()
@Controller('payments/safepay/webhook')
export class SafepayWebhookController {
  private readonly logger = new Logger(SafepayWebhookController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly safepayClient: SafepayClient,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(
    @Req() request: RawBodyRequest<Request>,
    @Headers('x-sfpy-signature') signature: string | undefined,
  ): Promise<{ received: true }> {
    const body = request.body as SafepayWebhookBody;
    const isValid =
      request.rawBody !== undefined &&
      isValidSafepayWebhookSignature({
        rawBody: request.rawBody,
        parsedBody: body,
        signatureHeader: signature,
        webhookSecret: this.safepayClient.config.webhookSecret,
      });
    if (!isValid) {
      this.logger.warn('Safepay webhook with an invalid signature rejected');
      throw new AppException(ResponseCode.Unauthorized, HttpStatus.UNAUTHORIZED);
    }

    const eventType = typeof body.type === 'string' ? body.type : 'unknown';
    const tracker = body.data?.tracker;
    this.logger.log({ eventType, event: body.token, tracker }, 'Safepay webhook received');

    // Payment events carry the tracker; other event types (subscriptions) are not used here.
    if (typeof tracker === 'string' && tracker !== '') {
      await this.paymentsService.handleWebhookEvent(eventType, tracker);
    }
    return { received: true };
  }
}
