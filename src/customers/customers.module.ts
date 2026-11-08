import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity.js';
import { CustomersController } from './customers.controller.js';
import { CustomersService } from './customers.service.js';
import { Customer } from './entities/customer.entity.js';

/** Modul fitur pelanggan. Butuh tabel Order untuk mengecek pesanan saat pelanggan akan dihapus. */
@Module({
  imports: [TypeOrmModule.forFeature([Customer, Order])],
  controllers: [CustomersController], // route /customers
  providers: [CustomersService],
})
export class CustomersModule {}
