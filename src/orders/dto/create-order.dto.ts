import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, ValidateNested } from 'class-validator';
import { OrderItemInputDto } from '../../order-items/dto/order-item-input.dto.js';

/** DTO untuk POST /orders (membuat pesanan baru beserta item-itemnya sekaligus). */
export class CreateOrderDto {
  @IsInt()
  customerId: number; // pemesan; dicek ada atau tidak di OrdersService.create()

  @IsArray() // harus array
  @ArrayMinSize(1) // pesanan minimal punya 1 item
  @ValidateNested({ each: true }) // validasi juga ISI tiap elemen memakai OrderItemInputDto
  @Type(() => OrderItemInputDto) // ubah JSON mentah menjadi instance OrderItemInputDto agar bisa divalidasi
  items: OrderItemInputDto[];
}
