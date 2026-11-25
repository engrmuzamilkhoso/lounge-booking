import { Module } from '@nestjs/common';
import { AdminNationalitiesController } from './admin-nationalities.controller.js';
import { AdminSourceRequestsController } from './admin-source-requests.controller.js';
import { AdminStatusesController } from './admin-statuses.controller.js';
import { NationalitiesController } from './nationalities.controller.js';
import { NationalitiesService } from './nationalities.service.js';
import { SourceRequestsService } from './source-requests.service.js';
import { StatusesService } from './statuses.service.js';

/** Simple named lists maintained by staff: nationalities, statuses, booking sources. */
@Module({
  controllers: [
    NationalitiesController,
    AdminNationalitiesController,
    AdminStatusesController,
    AdminSourceRequestsController,
  ],
  providers: [NationalitiesService, StatusesService, SourceRequestsService],
})
export class LookupsModule {}
