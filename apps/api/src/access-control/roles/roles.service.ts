import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseCode } from '@booking/shared-types';
import { AppException } from '../../common/http/app.exception.js';
import { recordNotFound } from '../../common/http/not-found.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { RoleResponse, SaveRoleDto } from './role.dto.js';

const roleSelect = {
  id: true,
  title: true,
  permissions: {
    where: { permission: { deletedAt: null } },
    select: { permission: { select: { id: true, title: true } } },
    orderBy: { permissionId: 'asc' },
  },
} as const;

interface RoleRecord {
  id: number;
  title: string | null;
  permissions: { permission: { id: number; title: string | null } }[];
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<RoleResponse[]> {
    const roles = await this.prisma.role.findMany({
      where: { deletedAt: null },
      select: roleSelect,
      orderBy: { id: 'asc' },
    });
    return roles.map((role) => this.toResponse(role));
  }

  async findOne(id: number): Promise<RoleResponse> {
    const role = await this.prisma.role.findFirst({
      where: { id, deletedAt: null },
      select: roleSelect,
    });
    if (role === null) {
      throw recordNotFound();
    }
    return this.toResponse(role);
  }

  async create(dto: SaveRoleDto): Promise<RoleResponse> {
    await this.assertPermissionsExist(dto.permissionIds);
    const role = await this.prisma.role.create({
      data: {
        title: dto.title,
        permissions: { create: dto.permissionIds.map((permissionId) => ({ permissionId })) },
      },
      select: roleSelect,
    });
    return this.toResponse(role);
  }

  /** Replaces the role's permissions with the given list (Laravel's `sync`). */
  async update(id: number, dto: SaveRoleDto): Promise<RoleResponse> {
    await this.findOne(id);
    await this.assertPermissionsExist(dto.permissionIds);

    const role = await this.prisma.$transaction(async (transaction) => {
      await transaction.permissionRole.deleteMany({ where: { roleId: id } });
      return transaction.role.update({
        where: { id },
        data: {
          title: dto.title,
          permissions: { create: dto.permissionIds.map((permissionId) => ({ permissionId })) },
        },
        select: roleSelect,
      });
    });
    return this.toResponse(role);
  }

  async softDelete(ids: number[]): Promise<void> {
    await this.prisma.role.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  private async assertPermissionsExist(permissionIds: number[]): Promise<void> {
    const uniqueIds = [...new Set(permissionIds)];
    const existingCount = await this.prisma.permission.count({
      where: { id: { in: uniqueIds }, deletedAt: null },
    });
    if (existingCount !== uniqueIds.length) {
      throw new AppException(ResponseCode.InvalidData, HttpStatus.UNPROCESSABLE_ENTITY, {
        permissionIds: ['One or more permissions do not exist'],
      });
    }
  }

  private toResponse(role: RoleRecord): RoleResponse {
    return {
      id: role.id,
      title: role.title,
      permissions: role.permissions.map((grant) => grant.permission),
    };
  }
}
