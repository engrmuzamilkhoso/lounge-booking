import { Global, Module } from '@nestjs/common';
import { AccessControlService } from './access-control.service.js';
import { AdminPermissionsController } from './permissions/admin-permissions.controller.js';
import { PermissionsService } from './permissions/permissions.service.js';
import { AdminRolesController } from './roles/admin-roles.controller.js';
import { RolesService } from './roles/roles.service.js';

@Global()
@Module({
  controllers: [AdminRolesController, AdminPermissionsController],
  providers: [AccessControlService, RolesService, PermissionsService],
  exports: [AccessControlService],
})
export class AccessControlModule {}
