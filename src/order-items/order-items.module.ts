import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItem } from './entities/order-item.entity.js';
import { OrderItemsController } from './order-items.controller.js';
import { OrderItemsService } from './order-items.service.js';

/** Modul fitur detail pesanan (baca saja). */
@Module({
  imports: [TypeOrmModule.forFeature([OrderItem])],
  controllers: [OrderItemsController], // route /order-items
  providers: [OrderItemsService],
})
export class OrderItemsModule {}
