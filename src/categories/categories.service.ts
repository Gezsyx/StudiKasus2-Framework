import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { Category } from './entities/category.entity.js';

/**
 * SERVICE = tempat LOGIKA BISNIS dan AKSES DATABASE.
 * Controller memanggil method di sini. Akses tabel dilakukan lewat Repository TypeORM
 * (objek yang menyediakan find / save / update / delete untuk satu entity).
 * Exception seperti NotFoundException otomatis diubah Nest menjadi response HTTP (404, 409, dst.).
 */
@Injectable()
export class CategoriesService {
  constructor(
    // Repository untuk tabel categories dan products (disuntikkan oleh Nest, didaftarkan di categories.module.ts).
    @InjectRepository(Category) private readonly categories: Repository<Category>,
    @InjectRepository(Product) private readonly products: Repository<Product>,
  ) {}

  // ===== CREATE ===== (POST /categories)
  async create(dto: CreateCategoryDto) {
    // Aturan B1: nama kategori harus unik -> 409 jika sudah ada.
    await this.assertNameFree(dto.name);
    // create() membuat object entity; save() menjalankan INSERT INTO categories ... dan mengembalikan baris baru (lengkap dengan id).
    return this.categories.save(this.categories.create(dto));
  }

  // ===== READ (daftar) ===== (GET /categories)
  findAll() {
    // SELECT * FROM categories ORDER BY id ASC
    return this.categories.find({ order: { id: 'ASC' } });
  }

  // ===== READ (detail) ===== (GET /categories/:id). Juga dipakai ulang oleh update() dan remove() untuk mengecek keberadaan data.
  async findOne(id: number) {
    // `relations: { products: true }` = JOIN ke tabel products, sehingga hasilnya memuat daftar produk kategori ini.
    const category = await this.categories.findOne({ where: { id }, relations: { products: true } });
    // Tidak ada -> lempar 404 Not Found.
    if (!category) throw new NotFoundException(`Kategori #${id} tidak ditemukan`);
    return category;
  }

  // ===== UPDATE ===== (PATCH /categories/:id)
  async update(id: number, dto: UpdateCategoryDto) {
    // Pastikan datanya ada (404 jika tidak).
    const category = await this.findOne(id);
    // Jika nama diganti, pastikan tidak bentrok dengan kategori lain (409).
    if (dto.name && dto.name !== category.name) await this.assertNameFree(dto.name);
    // Buang daftar `products` dari object agar tidak ikut disimpan, lalu gabungkan dengan perubahan dari klien.
    const { products: _products, ...rest } = category;
    // save() pada object yang sudah punya id menjalankan UPDATE categories SET ... WHERE id = ...
    return this.categories.save({ ...rest, ...dto });
  }

  // ===== DELETE ===== (DELETE /categories/:id)
  async remove(id: number) {
    await this.findOne(id); // 404 jika tidak ada
    // Aturan B11: kategori yang masih punya produk tidak boleh dihapus (menjaga integritas relasi).
    const used = await this.products.count({ where: { categoryId: id } });
    if (used > 0) {
      throw new ConflictException(`Kategori #${id} masih dipakai oleh ${used} produk`); // 409
    }
    // DELETE FROM categories WHERE id = ...
    await this.categories.delete(id);
    return { message: `Kategori #${id} dihapus` };
  }

  // Helper: tolak (409) jika nama kategori sudah dipakai.
  private async assertNameFree(name: string) {
    if (await this.categories.existsBy({ name })) {
      throw new ConflictException(`Kategori "${name}" sudah ada`);
    }
  }
}
