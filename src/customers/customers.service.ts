import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { Customer } from './entities/customer.entity.js';

/** Logika bisnis dan akses database untuk pelanggan. */
@Injectable()
export class CustomersService {
  constructor(
    // Repository tabel customers dan orders (didaftarkan di customers.module.ts).
    @InjectRepository(Customer) private readonly customers: Repository<Customer>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  // ===== CREATE ===== (POST /customers)
  async create(dto: CreateCustomerDto) {
    // Aturan B1: email harus unik -> 409 jika sudah terdaftar.
    await this.assertEmailFree(dto.email);
    // INSERT INTO customers ...
    return this.customers.save(this.customers.create(dto));
  }

  // ===== READ (daftar) ===== (GET /customers)
  findAll() {
    return this.customers.find({ order: { id: 'ASC' } });
  }

  // ===== READ (detail) ===== (GET /customers/:id). Juga dipakai ulang oleh update() dan remove().
  async findOne(id: number) {
    // relations: { orders: true } = JOIN ke tabel orders -> detail pelanggan memuat daftar pesanannya.
    const customer = await this.customers.findOne({ where: { id }, relations: { orders: true } });
    if (!customer) throw new NotFoundException(`Pelanggan #${id} tidak ditemukan`); // 404
    return customer;
  }

  // ===== UPDATE ===== (PATCH /customers/:id)
  async update(id: number, dto: UpdateCustomerDto) {
    const customer = await this.findOne(id); // 404 jika tidak ada
    // Jika email diganti, pastikan tidak dipakai pelanggan lain (409).
    if (dto.email && dto.email !== customer.email) await this.assertEmailFree(dto.email);
    // Buang daftar `orders` agar tidak ikut disimpan, lalu gabungkan dengan perubahan.
    const { orders: _orders, ...rest } = customer;
    // UPDATE customers SET ... WHERE id = ...
    return this.customers.save({ ...rest, ...dto });
  }

  // ===== DELETE ===== (DELETE /customers/:id)
  async remove(id: number) {
    await this.findOne(id); // 404 jika tidak ada
    // Aturan B11: pelanggan yang masih punya pesanan tidak boleh dihapus.
    const used = await this.orders.count({ where: { customerId: id } });
    if (used > 0) {
      throw new ConflictException(`Pelanggan #${id} masih memiliki ${used} pesanan`); // 409
    }
    // DELETE FROM customers WHERE id = ...
    await this.customers.delete(id);
    return { message: `Pelanggan #${id} dihapus` };
  }

  // Helper: tolak (409) jika email sudah terdaftar.
  private async assertEmailFree(email: string) {
    if (await this.customers.existsBy({ email })) {
      throw new ConflictException(`Email "${email}" sudah terdaftar`);
    }
  }
}
