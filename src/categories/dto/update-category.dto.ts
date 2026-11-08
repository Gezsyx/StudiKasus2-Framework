import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto.js';

/**
 * DTO untuk PATCH /categories/:id.
 * `PartialType` menyalin semua aturan validasi CreateCategoryDto tetapi menjadikan SEMUA field opsional,
 * sehingga klien cukup mengirim field yang ingin diubah (update sebagian).
 */
export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
