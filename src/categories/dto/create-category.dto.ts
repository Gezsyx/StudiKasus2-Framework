import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * DTO (Data Transfer Object) = bentuk data yang BOLEH dikirim klien pada body request.
 * Decorator class-validator di bawah dijalankan otomatis oleh ValidationPipe (main.ts)
 * SEBELUM controller dipanggil. Jika ada yang melanggar -> HTTP 400 Bad Request.
 * Dipakai oleh: POST /categories
 */
export class CreateCategoryDto {
  @IsString() // harus teks
  @IsNotEmpty() // tidak boleh string kosong
  @MaxLength(100) // maksimal 100 karakter
  name: string;

  @IsOptional() // boleh tidak dikirim
  @IsString()
  description?: string;
}
