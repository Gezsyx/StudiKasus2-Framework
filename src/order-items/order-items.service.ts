import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from './entities/order-item.entity.js';

/**
 * Detail pesanan dibuat/diubah/dihapus lewat endpoint `/orders` agar stok dan total tetap konsisten.
 * Service ini hanya untuk membaca detail item beserta informasi produknya.
 */
@Injectable()
export class OrderItemsService {
  constructor(@InjectRepository(OrderItem) private readonly items: Repository<OrderItem>) {}

  // ===== READ (daftar) ===== (GET /order-items, opsional ?orderId=)
  findAll(orderId?: number) {
    return this.items.find({
      where: orderId ? { orderId } : {}, // filter per pesanan bila orderId diberikan
      relations: { product: true }, // JOIN ke produk -> tiap item membawa informasi produknya
      order: { id: 'ASC' },
    });
  }

  // ===== READ (detail) ===== (GET /order-items/:id)
  async findOne(id: number) {
    const item = await this.items.findOne({ where: { id }, relations: { product: true, order: true } });
    if (!item) throw new NotFoundException(`Detail pesanan #${id} tidak ditemukan`); // 404
    return item;
  }
}
