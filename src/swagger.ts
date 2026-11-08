import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Membangun dokumen OpenAPI dari controller + DTO. Dipakai oleh server dan skrip ekspor `docs/openapi.json`. */
export function buildOpenApiDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('E-commerce Management System API')
    .setDescription('Backend pengelolaan toko online: produk, kategori, pelanggan, pesanan, dan detail pesanan.')
    .setVersion('1.0')
    .build();
  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication) {
  SwaggerModule.setup('api-docs', app, buildOpenApiDocument(app));
}
