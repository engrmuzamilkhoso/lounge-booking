import { Injectable } from '@nestjs/common';
import { recordNotFound } from '../../common/http/not-found.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { PermissionResponse, SavePermissionDto } from './permission.dto.js';

const permissionSelect = { id: true, title: true } as const;

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  /** All permissions (about 120 rows), as Laravel's admin list showed them on one page. */
  findAll(): Promise<PermissionResponse[]> {
    return this.prisma.permission.findMany({
      where: { deletedAt: null },
      select: permissionSelect,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number): Promise<PermissionResponse> {
    const permission = await this.prisma.permission.findFirst({
      where: { id, deletedAt: null },
      select: permissionSelect,
    });
    if (permission === null) {
      throw recordNotFound();
    }
    return permission;
  }

  create(dto: SavePermissionDto): Promise<PermissionResponse> {
    return this.prisma.permission.create({
      data: { title: dto.title },
      select: permissionSelect,
    });
  }

  async update(id: number, dto: SavePermissionDto): Promise<PermissionResponse> {
    await this.findOne(id);
    return this.prisma.permission.update({
      where: { id },
      data: { title: dto.title },
      select: permissionSelect,
    });
  }

  /** Soft delete, as in Laravel. Role assignments are kept but no longer grant access. */
  async softDelete(ids: number[]): Promise<void> {
    await this.prisma.permission.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
