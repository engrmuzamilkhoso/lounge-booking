import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AccessControlService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Permission titles granted by the given roles. Soft-deleted roles and permissions grant
   * nothing, matching Laravel's Eloquent soft-delete scopes in the AuthGates middleware.
   */
  async getPermissionTitlesForRoles(roleIds: number[]): Promise<Set<string>> {
    if (roleIds.length === 0) {
      return new Set();
    }

    const grants = await this.prisma.permissionRole.findMany({
      where: {
        roleId: { in: roleIds },
        role: { deletedAt: null },
        permission: { deletedAt: null },
      },
      select: { permission: { select: { title: true } } },
    });

    const titles = new Set<string>();
    for (const grant of grants) {
      if (grant.permission.title !== null) {
        titles.add(grant.permission.title);
      }
    }
    return titles;
  }
}
