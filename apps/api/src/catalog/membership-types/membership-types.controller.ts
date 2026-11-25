import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator.js';
import type { MembershipTypeResponse } from './membership-type.dto.js';
import { MembershipTypesService } from './membership-types.service.js';

@ApiTags('Catalog')
@Controller('membership-types')
export class MembershipTypesController {
  constructor(private readonly membershipTypesService: MembershipTypesService) {}

  /** Public, like Laravel's `/membership` page (viewing plans did not require login). */
  @Public()
  @Get()
  findAll(): Promise<MembershipTypeResponse[]> {
    return this.membershipTypesService.findAll();
  }
}
