import { Module } from '@nestjs/common';
import { AdminCardsController } from './cards/admin-cards.controller.js';
import { CardsController } from './cards/cards.controller.js';
import { CardsService } from './cards/cards.service.js';
import { AdminMembershipTypesController } from './membership-types/admin-membership-types.controller.js';
import { MembershipTypesController } from './membership-types/membership-types.controller.js';
import { MembershipTypesService } from './membership-types/membership-types.service.js';
import { AdminProductCategoriesController } from './product-categories/admin-product-categories.controller.js';
import { ProductCategoriesController } from './product-categories/product-categories.controller.js';
import { ProductCategoriesService } from './product-categories/product-categories.service.js';
import { AdminProductsController } from './products/admin-products.controller.js';
import { ProductsController } from './products/products.controller.js';
import { ProductsService } from './products/products.service.js';
import { AdminServicesController } from './services/admin-services.controller.js';
import { ServicesController } from './services/services.controller.js';
import { ServiceCatalogService } from './services/service-catalog.service.js';

/** What can be booked: services, categories, products (with prices), bank cards, plans. */
@Module({
  controllers: [
    ServicesController,
    AdminServicesController,
    ProductCategoriesController,
    AdminProductCategoriesController,
    ProductsController,
    AdminProductsController,
    CardsController,
    AdminCardsController,
    MembershipTypesController,
    AdminMembershipTypesController,
  ],
  providers: [
    ServiceCatalogService,
    ProductCategoriesService,
    ProductsService,
    CardsService,
    MembershipTypesService,
  ],
  exports: [ProductsService],
})
export class CatalogModule {}
