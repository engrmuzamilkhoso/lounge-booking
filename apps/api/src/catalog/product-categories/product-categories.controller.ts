import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ProductCategoryResponse } from './product-category.dto.js';
import { ProductCategoriesService } from './product-categories.service.js';

@ApiTags('Catalog')
@ApiBearerAuth()
@Controller('product-categories')
export class ProductCategoriesController {
  constructor(private readonly productCategoriesService: ProductCategoriesService) {}

  @Get()
  findAll(): Promise<ProductCategoryResponse[]> {
    return this.productCategoriesService.findAll();
  }
}
