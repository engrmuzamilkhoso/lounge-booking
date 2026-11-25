import { HttpStatus, Injectable } from '@nestjs/common';
import { ResponseCode } from '@booking/shared-types';
import { AppException } from '../../common/http/app.exception.js';
import { recordNotFound } from '../../common/http/not-found.js';
import { nullableDecimalToNumber } from '../../common/money.js';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ListProductsQueryDto, ProductResponse, SaveProductDto } from './product.dto.js';

const productSelect = {
  id: true,
  name: true,
  description: true,
  serviceId: true,
  categoryId: true,
  price: true,
  adultLimit: true,
  childPrice: true,
  childLimit: true,
  infantPrice: true,
  infantLimit: true,
  guestPrice: true,
  service: { select: { id: true, name: true } },
  category: { select: { id: true, name: true } },
} as const;

type ProductRecord = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Ordered by service, as in Laravel's admin product list. */
  async findAll(query: ListProductsQueryDto): Promise<ProductResponse[]> {
    const products = await this.prisma.product.findMany({
      where: {
        deletedAt: null,
        serviceId: query.serviceId,
        categoryId: query.categoryId,
      },
      select: productSelect,
      orderBy: [{ serviceId: 'asc' }, { id: 'asc' }],
    });
    return products.map(toProductResponse);
  }

  async findOne(id: number): Promise<ProductResponse> {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      select: productSelect,
    });
    if (product === null) {
      throw recordNotFound();
    }
    return toProductResponse(product);
  }

  async create(dto: SaveProductDto): Promise<ProductResponse> {
    await this.assertServiceAndCategoryExist(dto.serviceId, dto.categoryId);
    const product = await this.prisma.product.create({
      data: toProductData(dto),
      select: productSelect,
    });
    return toProductResponse(product);
  }

  async update(id: number, dto: SaveProductDto): Promise<ProductResponse> {
    await this.findOne(id);
    await this.assertServiceAndCategoryExist(dto.serviceId, dto.categoryId);
    const product = await this.prisma.product.update({
      where: { id },
      data: toProductData(dto),
      select: productSelect,
    });
    return toProductResponse(product);
  }

  async softDelete(ids: number[]): Promise<void> {
    await this.prisma.product.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  private async assertServiceAndCategoryExist(
    serviceId: number,
    categoryId: number,
  ): Promise<void> {
    const [service, category] = await Promise.all([
      this.prisma.service.findFirst({
        where: { id: serviceId, deletedAt: null },
        select: { id: true },
      }),
      this.prisma.productCategory.findFirst({
        where: { id: categoryId, deletedAt: null },
        select: { id: true },
      }),
    ]);

    const fieldErrors: Record<string, string[]> = {};
    if (service === null) {
      fieldErrors.serviceId = ['The selected service does not exist'];
    }
    if (category === null) {
      fieldErrors.categoryId = ['The selected category does not exist'];
    }
    if (Object.keys(fieldErrors).length > 0) {
      throw new AppException(
        ResponseCode.InvalidData,
        HttpStatus.UNPROCESSABLE_ENTITY,
        fieldErrors,
      );
    }
  }
}

function toProductData(dto: SaveProductDto): Prisma.ProductUncheckedCreateInput {
  return {
    name: dto.name,
    description: dto.description,
    serviceId: dto.serviceId,
    categoryId: dto.categoryId,
    price: dto.price,
    adultLimit: dto.adultLimit,
    childPrice: dto.childPrice,
    childLimit: dto.childLimit,
    infantPrice: dto.infantPrice,
    infantLimit: dto.infantLimit,
    guestPrice: dto.guestPrice ?? null,
  };
}

function toProductResponse(product: ProductRecord): ProductResponse {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    serviceId: product.serviceId,
    categoryId: product.categoryId,
    service: product.service,
    category: product.category,
    price: nullableDecimalToNumber(product.price),
    adultLimit: product.adultLimit,
    childPrice: product.childPrice,
    childLimit: product.childLimit,
    infantPrice: product.infantPrice,
    infantLimit: product.infantLimit,
    guestPrice: product.guestPrice,
  };
}
