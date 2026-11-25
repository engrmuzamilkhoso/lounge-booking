import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { type AuditActor, CurrentAuditActor } from '../audit/audit-actor.js';
import {
  ApplyForMembershipDto,
  type MembershipResponse,
  type MembershipVerificationResponse,
  VerifyMembershipDto,
} from './dto/membership.dto.js';
import { MembershipsService } from './memberships.service.js';

/** Guessing membership numbers is limited per IP. */
const VERIFY_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('Memberships')
@ApiBearerAuth()
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  /** Membership application from the website (login required, as in Laravel). */
  @Post('applications')
  apply(
    @Body() dto: ApplyForMembershipDto,
    @CurrentAuditActor() actor: AuditActor,
  ): Promise<MembershipResponse> {
    return this.membershipsService.apply(dto, actor);
  }

  /** `0013` when the number is unknown or not approved, `0014` when no visits are left. */
  @Throttle(VERIFY_LIMIT)
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verify(@Body() dto: VerifyMembershipDto): Promise<MembershipVerificationResponse> {
    return this.membershipsService.verify(dto.serialNo);
  }
}
