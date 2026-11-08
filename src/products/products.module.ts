import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/entities/category.entity.js';
import { OrderItem } from '../order-items/entities/order-item.entity.js';
import { Product } from './entities/product.entity.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

/** Modul fitur produk. Butuh tabel Category (cek kategori) dan OrderItem (cek pemakaian saat hapus). */
@Module({
  imports: [TypeOrmModule.forFeature([Product, Category, OrderItem])],
  controllers: [ProductsController], // route /products
  providers: [ProductsService],
})
export class ProductsModule {}
