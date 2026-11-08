import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { OrderStatus } from './order-status.enum.js';
import { ApiBadRequestResponse, ApiConflictResponse, ApiNotFoundResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service.js';

/**
 * Controller untuk pesanan. Semua route diawali "/orders".
 * Aturan bisnis (stok, harga, alur status) ada di orders.service.ts.
 */
@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ===== CREATE ===== POST /orders -> 201 Created
  // Membuat pesanan + item-itemnya sekaligus. Stok berkurang. 400 jika stok kurang, 404 jika pelanggan/produk tidak ada.
  @ApiBadRequestResponse({ description: 'Input tidak valid atau stok produk tidak cukup' })
  @ApiNotFoundResponse({ description: 'Pelanggan atau produk tidak ditemukan' })
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  // ===== READ (daftar) ===== GET /orders, bisa difilter: GET /orders?customerId=1&status=pending -> 200 OK
  /** GET /orders?customerId=1&status=pending */
  @ApiQuery({ name: 'customerId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiBadRequestResponse({ description: 'Query tidak valid' })
  @Get()
  findAll(
    @Query('customerId', new ParseIntPipe({ optional: true })) customerId?: number,
    // ParseEnumPipe: nilai status harus salah satu dari OrderStatus, jika tidak -> 400.
    @Query('status', new ParseEnumPipe(OrderStatus, { optional: true })) status?: OrderStatus,
  ) {
    return this.ordersService.findAll({ customerId, status });
  }

  // ===== READ (detail) ===== GET /orders/:id -> 200 OK (lengkap: pelanggan + item + produk), atau 404
  @ApiNotFoundResponse({ description: 'Pesanan tidak ditemukan' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  // ===== UPDATE ===== PATCH /orders/:id -> 200 OK
  // Mengubah item (hanya saat pending) dan/atau status (mengikuti alur status). 409 jika melanggar aturan.
  @ApiBadRequestResponse({ description: 'Input tidak valid atau stok produk tidak cukup' })
  @ApiNotFoundResponse({ description: 'Pesanan atau produk tidak ditemukan' })
  @ApiConflictResponse({ description: 'Transisi status tidak diizinkan / item tidak bisa diubah pada status ini' })
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrderDto) {
    return this.ordersService.update(id, dto);
  }

  // ===== DELETE ===== DELETE /orders/:id -> 200 OK, 404, atau 409 jika status bukan pending/cancelled
  @ApiNotFoundResponse({ description: 'Pesanan tidak ditemukan' })
  @ApiConflictResponse({ description: 'Hanya pesanan pending/cancelled yang dapat dihapus' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.remove(id);
  }
}
