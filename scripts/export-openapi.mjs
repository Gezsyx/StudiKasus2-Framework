// Mengekspor spesifikasi OpenAPI dari kode backend ke docs/openapi.json.
// Jalankan lewat: npm run docs:openapi  (otomatis build dulu)
import { mkdirSync, writeFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';

// Tidak menyentuh database asli: pakai SQLite in-memory hanya untuk membangun dokumen.
process.env.DB_TYPE = 'better-sqlite3';
process.env.DB_FILE = ':memory:';

const { AppModule } = await import('../dist/app.module.js');
const { buildOpenApiDocument } = await import('../dist/swagger.js');

const app = await NestFactory.create(AppModule, { logger: false });
await app.init();
const document = buildOpenApiDocument(app);
mkdirSync('docs', { recursive: true });
writeFileSync('docs/openapi.json', JSON.stringify(document, null, 2) + '\n');
await app.close();
console.log(`docs/openapi.json ditulis (${Object.keys(document.paths).length} path)`);
