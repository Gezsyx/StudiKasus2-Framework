import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { ApiBadRequestResponse, ApiConflictResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service.js';

/** Controller untuk produk. Semua route diawali "/products". Logika ada di products.service.ts. */
@ApiTags('Products')
@ApiBadRequestResponse({ description: 'Input tidak valid' })
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ===== CREATE ===== POST /products -> 201 Created
  @ApiNotFoundResponse({ description: 'Kategori tidak ditemukan' })
  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  // ===== READ (daftar) ===== GET /products atau GET /products?categoryId=1 (filter) -> 200 OK
  /** GET /products?categoryId=1 untuk memfilter berdasarkan kategori. */
  @Get()
  findAll(@Query('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number) {
    // @Query = parameter setelah tanda "?" di URL. `optional: true` -> boleh tidak diisi; jika diisi non-angka -> 400.
    return this.productsService.findAll(categoryId);
  }

  // ===== READ (detail) ===== GET /products/:id -> 200 OK, atau 404
  @ApiNotFoundResponse({ description: 'Produk tidak ditemukan' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  // ===== UPDATE (sebagian) ===== PATCH /products/:id -> 200 OK
  @ApiNotFoundResponse({ description: 'Produk atau kategori tidak ditemukan' })
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  // ===== DELETE ===== DELETE /products/:id -> 200 OK, 404, atau 409 jika sudah dipakai di detail pesanan
  @ApiNotFoundResponse({ description: 'Produk tidak ditemukan' })
  @ApiConflictResponse({ description: 'Produk sudah dipakai di detail pesanan' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
