import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/entities/category.entity.js';
import { OrderItem } from '../order-items/entities/order-item.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { Product } from './entities/product.entity.js';

/** Logika bisnis dan akses database untuk produk. */
@Injectable()
export class ProductsService {
  constructor(
    // Repository untuk tabel yang dibutuhkan (didaftarkan di products.module.ts).
    @InjectRepository(Product) private readonly products: Repository<Product>,
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(OrderItem) private readonly orderItems: Repository<OrderItem>,
  ) {}

  // ===== CREATE ===== (POST /products)
  async create(dto: CreateProductDto) {
    // Aturan B2: produk wajib punya kategori yang benar-benar ada -> 404 jika tidak.
    await this.assertCategoryExists(dto.categoryId);
    // INSERT INTO products ...
    const saved = await this.products.save(this.products.create(dto));
    // Ambil ulang beserta data kategorinya supaya response lengkap.
    return this.findOne(saved.id);
  }

  // ===== READ (daftar) ===== (GET /products, opsional ?categoryId=)
  findAll(categoryId?: number) {
    return this.products.find({
      // Jika categoryId diberikan -> WHERE categoryId = ?, jika tidak -> semua produk.
      where: categoryId ? { categoryId } : {},
      relations: { category: true }, // JOIN ke kategori
      order: { id: 'ASC' },
    });
  }

  // ===== READ (detail) ===== (GET /products/:id). Juga dipakai ulang oleh create(), update(), remove().
  async findOne(id: number) {
    const product = await this.products.findOne({ where: { id }, relations: { category: true } });
    if (!product) throw new NotFoundException(`Produk #${id} tidak ditemukan`); // 404
    return product;
  }

  // ===== UPDATE ===== (PATCH /products/:id)
  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id); // 404 jika produk tidak ada
    // Jika kategori diganti, pastikan kategori barunya ada.
    if (dto.categoryId !== undefined) await this.assertCategoryExists(dto.categoryId);
    // UPDATE products SET (hanya field yang dikirim) WHERE id = ...
    await this.products.update(id, dto);
    return this.findOne(id); // kembalikan data terbaru
  }

  // ===== DELETE ===== (DELETE /products/:id)
  async remove(id: number) {
    await this.findOne(id); // 404 jika tidak ada
    // Aturan B11: produk yang pernah ada di detail pesanan tidak boleh dihapus (riwayat pesanan harus utuh).
    const used = await this.orderItems.count({ where: { productId: id } });
    if (used > 0) {
      throw new ConflictException(`Produk #${id} sudah dipakai di ${used} detail pesanan dan tidak dapat dihapus`); // 409
    }
    // DELETE FROM products WHERE id = ...
    await this.products.delete(id);
    return { message: `Produk #${id} dihapus` };
  }

  // Helper: pastikan kategori ada, jika tidak -> 404.
  private async assertCategoryExists(categoryId: number) {
    if (!(await this.categories.existsBy({ id: categoryId }))) {
      throw new NotFoundException(`Kategori #${categoryId} tidak ditemukan`);
    }
  }
}
