import { Injectable } from '@nestjs/common';
import { recordNotFound } from '../../common/http/not-found.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ProductCategoryResponse, SaveProductCategoryDto } from './product-category.dto.js';

const categorySelect = { id: true, name: true, description: true } as const;

@Injectable()
export class ProductCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ProductCategoryResponse[]> {
    return this.prisma.productCategory.findMany({
      where: { deletedAt: null },
      select: categorySelect,
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number): Promise<ProductCategoryResponse> {
    const category = await this.prisma.productCategory.findFirst({
      where: { id, deletedAt: null },
      select: categorySelect,
    });
    if (category === null) {
      throw recordNotFound();
    }
    return category;
  }

  create(dto: SaveProductCategoryDto): Promise<ProductCategoryResponse> {
    return this.prisma.productCategory.create({
      data: { name: dto.name, description: dto.description },
      select: categorySelect,
    });
  }

  async update(id: number, dto: SaveProductCategoryDto): Promise<ProductCategoryResponse> {
    await this.findOne(id);
    return this.prisma.productCategory.update({
      where: { id },
      data: { name: dto.name, description: dto.description },
      select: categorySelect,
    });
  }

  async softDelete(ids: number[]): Promise<void> {
    await this.prisma.productCategory.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }
}
