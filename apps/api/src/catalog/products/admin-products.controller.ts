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
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../auth/decorators/require-permissions.decorator.js';
import { IdListDto } from '../../common/dto/id-list.dto.js';
import { ListProductsQueryDto, type ProductResponse, SaveProductDto } from './product.dto.js';
import { ProductsService } from './products.service.js';

/**
 * Laravel had three admin product lists (all, lounge = service 2, membership = service 3);
 * here they are one list with a `serviceId` filter.
 */
@ApiTags('Admin: products')
@ApiBearerAuth()
@Controller('admin/products')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @RequirePermissions('product_access')
  findAll(@Query() query: ListProductsQueryDto): Promise<ProductResponse[]> {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('product_show')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ProductResponse> {
    return this.productsService.findOne(id);
  }

  @Post()
  @RequirePermissions('product_create')
  create(@Body() dto: SaveProductDto): Promise<ProductResponse> {
    return this.productsService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('product_edit')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveProductDto,
  ): Promise<ProductResponse> {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('product_delete')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.productsService.findOne(id);
    await this.productsService.softDelete([id]);
  }

  @Delete()
  @RequirePermissions('product_delete')
  @HttpCode(HttpStatus.OK)
  removeMany(@Body() dto: IdListDto): Promise<void> {
    return this.productsService.softDelete(dto.ids);
  }
}
