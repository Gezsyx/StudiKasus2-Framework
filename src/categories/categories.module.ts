import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity.js';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { Category } from './entities/category.entity.js';

/**
 * MODULE = pembungkus satu fitur: mendaftarkan controller, service, dan tabel (entity) yang dipakainya.
 * Module ini didaftarkan di app.module.ts supaya Nest mengenalinya.
 */
@Module({
  // forFeature: daftarkan entity agar Repository<Category> dan Repository<Product> bisa disuntikkan ke service.
  imports: [TypeOrmModule.forFeature([Category, Product])],
  controllers: [CategoriesController], // yang menangani route /categories
  providers: [CategoriesService], // logika bisnis
})
export class CategoriesModule {}
