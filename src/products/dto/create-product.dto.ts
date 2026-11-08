import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/** DTO untuk POST /products (membuat produk baru). */
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 }) // angka, maksimal 2 desimal (cocok dengan numeric(12,2))
  @Min(0) // tidak boleh negatif
  price: number;

  @IsInt() // bilangan bulat (1.5 ditolak)
  @Min(0)
  stock: number;

  // Foreign key ke kategori. Keberadaan kategorinya dicek di ProductsService.assertCategoryExists().
  @IsInt()
  categoryId: number;
}
