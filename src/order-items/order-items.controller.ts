import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiTags } from '@nestjs/swagger';
import { OrderItemsService } from './order-items.service.js';

/**
 * Controller untuk detail pesanan. Semua route diawali "/order-items".
 * HANYA membaca (READ). Create/Update/Delete item dilakukan lewat /orders agar stok dan total tetap sinkron.
 */
@ApiTags('Order Items')
@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  // ===== READ (daftar) ===== GET /order-items atau GET /order-items?orderId=1 -> 200 OK
  /** GET /order-items?orderId=1 */
  @ApiBadRequestResponse({ description: 'Query tidak valid' })
  @Get()
  findAll(@Query('orderId', new ParseIntPipe({ optional: true })) orderId?: number) {
    return this.orderItemsService.findAll(orderId);
  }

  // ===== READ (detail) ===== GET /order-items/:id -> 200 OK (beserta produk & pesanan), atau 404
  @ApiNotFoundResponse({ description: 'Detail pesanan tidak ditemukan' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.orderItemsService.findOne(id);
  }
}
