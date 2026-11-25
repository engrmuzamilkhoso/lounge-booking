import { Module } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller.js';

@Module({
  controllers: [InquiriesController],
})
export class InquiriesModule {}
