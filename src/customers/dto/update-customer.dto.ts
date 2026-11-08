import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomerDto } from './create-customer.dto.js';

/** DTO untuk PATCH /customers/:id. Semua field CreateCustomerDto menjadi opsional (update sebagian). */
export class UpdateCustomerDto extends PartialType(CreateCustomerDto) {}
