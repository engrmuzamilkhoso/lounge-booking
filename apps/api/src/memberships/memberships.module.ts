import { Module } from '@nestjs/common';
import { AdminMembershipsController } from './admin-memberships.controller.js';
import { MembershipsController } from './memberships.controller.js';
import { MembershipsService } from './memberships.service.js';

@Module({
  controllers: [MembershipsController, AdminMembershipsController],
  providers: [MembershipsService],
  exports: [MembershipsService],
})
export class MembershipsModule {}
