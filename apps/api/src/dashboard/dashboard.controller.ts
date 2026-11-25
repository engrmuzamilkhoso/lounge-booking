import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator.js';
import { type DashboardSummary, DashboardService } from './dashboard.service.js';

@ApiTags('Admin: dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /** Laravel limited the dashboard to the Admin role; the `dashboard` permission is only granted to Admin. */
  @Get()
  @RequirePermissions('dashboard')
  getSummary(): Promise<DashboardSummary> {
    return this.dashboardService.getSummary();
  }
}
