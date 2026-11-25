import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator.js';
import { IdListDto } from '../../common/dto/id-list.dto.js';
import { type ProductCategoryResponse, SaveProductCategoryDto } from './product-category.dto.js';
import { ProductCategoriesService } from './product-categories.service.js';

@ApiTags('Admin: product categories')
@ApiBearerAuth()
@Controller('admin/product-categories')
export class AdminProductCategoriesController {
  constructor(private readonly productCategoriesService: ProductCategoriesService) {}

  @Get()
  @RequirePermissions('product_category_access')
  findAll(): Promise<ProductCategoryResponse[]> {
    return this.productCategoriesService.findAll();
  }

  @Get(':id')
  @RequirePermissions('product_category_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductCategoryResponse> {
    return this.productCategoriesService.findOne(id);
  }

  @Post()
  @RequirePermissions('product_category_create')
  create(@Body() dto: SaveProductCategoryDto): Promise<ProductCategoryResponse> {
    return this.productCategoriesService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('product_category_edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveProductCategoryDto,
  ): Promise<ProductCategoryResponse> {
    return this.productCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('product_category_delete')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.productCategoriesService.findOne(id);
    await this.productCategoriesService.softDelete([id]);
  }

  @Delete()
  @RequirePermissions('product_category_delete')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: IdListDto): Promise<void> {
    return this.productCategoriesService.softDelete(dto.ids);
  }
}
