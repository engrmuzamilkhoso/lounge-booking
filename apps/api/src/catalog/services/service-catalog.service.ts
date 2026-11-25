import { Injectable } from '@nestjs/common';
import { recordNotFound } from '../../common/http/not-found.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { SaveServiceDto, ServiceResponse } from './service.dto.js';

const serviceSelect = {
  id: true,
  name: true,
  appDesc: true,
  appRoute: true,
  appIcon: true,
  iconForApp: true,
} as const;

interface ServiceRecord {
  id: number;
  name: string;
  appDesc: string | null;
  appRoute: string | null;
  appIcon: string | null;
  iconForApp: string | null;
}

@Injectable()
export class ServiceCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ServiceResponse[]> {
    const services = await this.prisma.service.findMany({
      where: { deletedAt: null },
      select: serviceSelect,
      orderBy: { id: 'asc' },
    });
    return services.map(toServiceResponse);
  }

  async findOne(id: number): Promise<ServiceResponse> {
    const service = await this.prisma.service.findFirst({
      where: { id, deletedAt: null },
      select: serviceSelect,
    });
    if (service === null) {
      throw recordNotFound();
    }
    return toServiceResponse(service);
  }

  async create(dto: SaveServiceDto): Promise<ServiceResponse> {
    const service = await this.prisma.service.create({
      data: toServiceData(dto),
      select: serviceSelect,
    });
    return toServiceResponse(service);
  }

  async update(id: number, dto: SaveServiceDto): Promise<ServiceResponse> {
    await this.findOne(id);
    const service = await this.prisma.service.update({
      where: { id },
      data: toServiceData(dto),
      select: serviceSelect,
    });
    return toServiceResponse(service);
  }

  async softDelete(ids: number[]): Promise<void> {
    await this.prisma.service.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}

function toServiceData(dto: SaveServiceDto): {
  name: string;
  appDesc?: string;
  appRoute?: string;
  appIcon?: string;
  iconForApp?: string;
} {
  return {
    name: dto.name,
    appDesc: dto.appDescription,
    appRoute: dto.appRoute,
    appIcon: dto.appIcon,
    iconForApp: dto.iconForApp,
  };
}

function toServiceResponse(service: ServiceRecord): ServiceResponse {
  return {
    id: service.id,
    name: service.name,
    appDescription: service.appDesc,
    appRoute: service.appRoute,
    appIcon: service.appIcon,
    iconForApp: service.iconForApp,
  };
}
