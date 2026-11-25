import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { PaymentStatus } from '@booking/shared-types';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentsService } from './payments.service.js';
import { SafepayClient } from './safepay/safepay.client.js';

/** How often unfinished payments are re-checked with Safepay. */
const RUN_INTERVAL_MS = 2 * 60 * 1000;
/** Give the normal redirect a chance to confirm first. */
const MIN_AGE_MS = 2 * 60 * 1000;
/** Unfinished payments are re-checked for a day, which also covers an API outage. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;
/**
 * A session can be reused for 50 minutes and its checkout page lives one hour, so nothing can
 * be paid on it after about two hours. Older sessions that Safepay still reports as unpaid are
 * closed, which takes them out of the next runs.
 */
const SESSION_EXPIRY_MS = 3 * 60 * 60 * 1000;
/** Payments checked per run; the least recently checked go first. */
const BATCH_SIZE = 50;

/**
 * Safety net for payments whose confirmation never arrived: the customer paid but lost their
 * connection before Safepay sent them back, and no webhook reached us (none configured, or our
 * server was down). Every two minutes, each unfinished payment from the last day is checked
 * with Safepay's reporting API, and paid ones are confirmed exactly as a redirect would
 * (booking marked paid, confirmation email with the pass sent once).
 *
 * Several API instances may run this at once: applying a report is idempotent and row-locked.
 */
@Injectable()
export class PaymentReconcilerService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(PaymentReconcilerService.name);
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentsService: PaymentsService,
    private readonly safepayClient: SafepayClient,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.safepayClient.isConfigured) {
      return;
    }
    this.timer = setInterval(() => {
      void this.runOnce();
    }, RUN_INTERVAL_MS);
    // Do not keep the process alive just for this timer.
    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** One reconciliation pass. Returns how many payments were checked. */
  async runOnce(): Promise<number> {
    if (this.isRunning) {
      return 0;
    }
    this.isRunning = true;
    try {
      return await this.checkUnfinishedPayments();
    } catch (error) {
      this.logger.error({ err: error }, 'Payment reconciliation run failed');
      return 0;
    } finally {
      this.isRunning = false;
    }
  }

  private async checkUnfinishedPayments(): Promise<number> {
    const now = Date.now();
    const payments = await this.prisma.payment.findMany({
      where: {
        status: { in: [PaymentStatus.Pending, PaymentStatus.Failed] },
        createdAt: { gte: new Date(now - MAX_AGE_MS), lte: new Date(now - MIN_AGE_MS) },
      },
      orderBy: { updatedAt: 'asc' },
      take: BATCH_SIZE,
      select: { id: true, gatewayReference: true, createdAt: true },
    });

    for (const payment of payments) {
      try {
        const status = await this.paymentsService.reconcilePayment(
          payment.id,
          payment.gatewayReference,
        );
        if (status === PaymentStatus.Paid) {
          this.logger.log(
            { paymentId: payment.id, tracker: payment.gatewayReference },
            'Payment confirmed by reconciliation',
          );
        }
        const isExpired = now - payment.createdAt.getTime() > SESSION_EXPIRY_MS;
        if (status === PaymentStatus.Pending && isExpired) {
          await this.paymentsService.cancelIfStillPending(payment.id);
        }
      } catch (error) {
        // Safepay unreachable or a bad tracker: try again on the next run.
        this.logger.warn(
          { err: error, paymentId: payment.id },
          'Could not reconcile payment; will retry',
        );
      }
    }
    return payments.length;
  }
}
