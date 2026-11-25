import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ListProductsQueryDto, type ProductResponse } from './product.dto.js';
import { ProductsService } from './products.service.js';

/** Replaces the mobile `products/list` endpoint and the website's `get_products` fragment. */
@ApiTags('Catalog')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query() query: ListProductsQueryDto): Promise<ProductResponse[]> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductResponse> {
    return this.productsService.findOne(id);
  }
}
