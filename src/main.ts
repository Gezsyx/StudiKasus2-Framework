import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupSwagger } from './swagger.js';

/** TITIK AWAL aplikasi: file ini yang pertama dijalankan (npm run start:dev). */
async function bootstrap() {
  // Membuat aplikasi dari AppModule (yang memuat semua modul fitur + koneksi database).
  const app = await NestFactory.create(AppModule);
  // ValidationPipe GLOBAL: semua body request divalidasi memakai aturan di DTO sebelum sampai ke controller.
  //   whitelist: true            -> properti yang tidak ada di DTO dibuang
  //   forbidNonWhitelisted: true -> ...dan request ditolak (400) jika mengirim properti asing
  //   transform: true            -> JSON diubah menjadi instance class DTO (diperlukan oleh @Type pada item pesanan)
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  setupSwagger(app); // dokumentasi interaktif di /api-docs
  // Port dibaca dari .env (PORT), default 3000.
  const port = app.get(ConfigService).get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`API berjalan di http://localhost:${port}  |  Swagger UI: http://localhost:${port}/api-docs`);
}
await bootstrap();
