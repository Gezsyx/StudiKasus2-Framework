import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto.js';

/** DTO untuk PATCH /products/:id. Semua field CreateProductDto menjadi opsional (update sebagian). */
export class UpdateProductDto extends PartialType(CreateProductDto) {}
