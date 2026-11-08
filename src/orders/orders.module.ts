import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

/**
 * Modul fitur pesanan. Tidak perlu forFeature karena OrdersService memakai DataSource
 * (disediakan global oleh TypeOrmModule.forRootAsync di app.module.ts) untuk membuka transaksi.
 */
@Module({
  controllers: [OrdersController], // route /orders
  providers: [OrdersService],
})
export class OrdersModule {}
