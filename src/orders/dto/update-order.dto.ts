import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { OrderItemInputDto } from '../../order-items/dto/order-item-input.dto.js';
import { OrderStatus } from '../order-status.enum.js';

/** DTO untuk PATCH /orders/:id. Boleh mengirim `status`, `items`, atau keduanya. */
export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus) // harus salah satu nilai enum OrderStatus; aturan perpindahannya dicek di service
  status?: OrderStatus;

  /** Mengganti seluruh item pesanan. Hanya boleh saat status pesanan masih `pending`. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items?: OrderItemInputDto[];
}
