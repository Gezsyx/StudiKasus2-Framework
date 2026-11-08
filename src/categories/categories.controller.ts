import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiBadRequestResponse, ApiConflictResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

/**
 * CONTROLLER = pintu masuk HTTP. Tugasnya hanya: menerima request, memvalidasi input
 * (lewat DTO & pipe), memanggil SERVICE, lalu mengembalikan hasilnya sebagai response.
 * Logika bisnis dan akses database TIDAK ada di sini, melainkan di categories.service.ts.
 *
 * Semua route di class ini diawali "/categories".
 */
@ApiTags('Categories') // pengelompokan di Swagger UI
@ApiBadRequestResponse({ description: 'Input tidak valid' }) // dokumentasi Swagger: 400 bisa terjadi di semua endpoint
@Controller('categories')
export class CategoriesController {
  // Dependency Injection: Nest membuatkan CategoriesService dan menyuntikkannya otomatis.
  constructor(private readonly categoriesService: CategoriesService) {}

  // ===== CREATE ===== POST /categories -> 201 Created
  @ApiConflictResponse({ description: 'Nama kategori sudah ada' })
  @Post()
  create(@Body() dto: CreateCategoryDto) {
    // @Body() = isi JSON request, sudah divalidasi sesuai CreateCategoryDto.
    return this.categoriesService.create(dto);
  }

  // ===== READ (daftar) ===== GET /categories -> 200 OK
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // ===== READ (detail) ===== GET /categories/:id -> 200 OK, atau 404 jika tidak ada
  @ApiNotFoundResponse({ description: 'Kategori tidak ditemukan' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    // ParseIntPipe: ubah "5" menjadi angka 5; jika bukan angka (mis. "abc") otomatis 400.
    return this.categoriesService.findOne(id);
  }

  // ===== UPDATE (sebagian) ===== PATCH /categories/:id -> 200 OK
  @ApiNotFoundResponse({ description: 'Kategori tidak ditemukan' })
  @ApiConflictResponse({ description: 'Nama kategori sudah dipakai' })
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  // ===== DELETE ===== DELETE /categories/:id -> 200 OK, 404 jika tidak ada, 409 jika masih dipakai produk
  @ApiNotFoundResponse({ description: 'Kategori tidak ditemukan' })
  @ApiConflictResponse({ description: 'Kategori masih dipakai produk' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoriesService.remove(id);
  }
}
