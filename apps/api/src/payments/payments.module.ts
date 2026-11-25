import { Module } from '@nestjs/common';
import { BookingsModule } from '../bookings/bookings.module.js';
import { PaymentReconcilerService } from './payment-reconciler.service.js';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { SafepayWebhookController } from './safepay-webhook.controller.js';
import { SafepayClient } from './safepay/safepay.client.js';

/** Online payment of bookings. Safepay specifics stay in ./safepay. */
@Module({
  imports: [BookingsModule],
  controllers: [PaymentsController, SafepayWebhookController],
  providers: [PaymentsService, PaymentReconcilerService, SafepayClient],
})
export class PaymentsModule {}
