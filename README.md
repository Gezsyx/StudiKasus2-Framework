Muhammad Abdan Annur (24090104)
Amirul Madjid Ibrahim (24090101)
Fajar Abdul Aziz (24090093)
=======================================================

# Studi Kasus 2 — E-commerce Management System (NestJS)

Backend REST API untuk pengelolaan toko online: **produk, kategori, pelanggan, pesanan, dan detail pesanan**, dengan aturan bisnis stok, harga saat transaksi, dan alur status pesanan.

## Teknologi

| Komponen | Pilihan |
|----------|---------|
| Framework | NestJS 12 (TypeScript, ESM) |
| Database | PostgreSQL |
| ORM | TypeORM (driver `pg`) |
| Validasi | `class-validator` + `class-transformer` (`ValidationPipe` global) |
| Konfigurasi | `@nestjs/config` (file `.env`) |
| Dokumentasi API | `@nestjs/swagger` (Swagger UI + OpenAPI JSON) |
| Pengujian | Vitest + Supertest (e2e, SQLite in-memory), Postman/newman (terhadap PostgreSQL) |

## Dokumen yang diserahkan

| Dokumen | Lokasi |
|---------|--------|
| Source code | `src/` |
| Kebutuhan fungsional, aturan bisnis, **ERD** | [`docs/DESAIN-DAN-ERD.md`](docs/DESAIN-DAN-ERD.md) |
| **API Specification** (Markdown) | [`docs/API-SPEC.md`](docs/API-SPEC.md) |
| API Specification (OpenAPI/Swagger) | [`docs/openapi.json`](docs/openapi.json) · Swagger UI di `/api-docs` |
| **Postman Collection** | [`postman/ecommerce.postman_collection.json`](postman/ecommerce.postman_collection.json) |
| Bukti hasil pengujian Postman | [`docs/HASIL-PENGUJIAN-POSTMAN.txt`](docs/HASIL-PENGUJIAN-POSTMAN.txt) |

## Instalasi

Prasyarat: **Node.js ≥ 20**, npm, dan **PostgreSQL** yang sedang berjalan.

1. Pasang dependency:

   ```bash
   npm install
   ```

2. Siapkan PostgreSQL. **Cara termudah: Docker Compose** (buka Docker Desktop dulu). `docker-compose.yml` membaca `.env`, jadi user, password, nama database, dan port otomatis sama dengan yang dipakai aplikasi, dan database dibuat sekaligus:

   ```bash
   docker compose up -d
   ```

   Hentikan dengan `docker compose down` (data tetap tersimpan). Tambahkan `-v` untuk menghapus data.

   > **Port bentrok?** Jika muncul `port is already allocated`, ada program/container lain yang memakai port itu. Ubah `DB_PORT` (mis. `5436`) dan/atau `PORT` (mis. `3001`) di `.env`, lalu jalankan ulang. Compose, aplikasi, dan `npm run test:postman` otomatis mengikuti nilai di `.env`.

   *Alternatif tanpa Docker:* pakai PostgreSQL yang sudah terpasang, lalu buat databasenya: `psql -U postgres -c "CREATE DATABASE studikasus2uts;"`.

   Tabel dibuat otomatis saat aplikasi pertama kali dijalankan (lihat bagian *Migrasi database*).

3. (Opsional) Lihat isi database dengan **DBeaver**: *Database → New Database Connection → PostgreSQL*, isi Host `localhost`, Port `5432`, Database `studikasus2uts`, serta Username dan Password sesuai `.env` (Port mengikuti `DB_PORT`). Setelah aplikasi berjalan, tabel muncul di *Databases → studikasus2uts → Schemas → public → Tables*.

> Devdependency `better-sqlite3` hanya dipakai oleh e2e test (SQLite in-memory). Jika npm memberi peringatan *allow-scripts* dan modulnya gagal dimuat, jalankan `npm rebuild better-sqlite3`.

## Konfigurasi environment

Salin contoh konfigurasi lalu sesuaikan bila perlu:

```bash
cp .env.example .env
```

| Variabel | Default | Keterangan |
|----------|---------|------------|
| `PORT` | `3000` | Port HTTP server |
| `NODE_ENV` | — | `development` / `production` |
| `DB_HOST` | `localhost` | Host PostgreSQL |
| `DB_PORT` | `5432` | Port PostgreSQL |
| `DB_USER` | — | User PostgreSQL |
| `DB_PASSWORD` | — | Password PostgreSQL (rahasia) |
| `DB_DATABASE` | — | Nama database |
| `DB_SYNCHRONIZE` | `true` kecuali `NODE_ENV=production` | Opsional. `true` = skema dibuat/disesuaikan otomatis dari entity saat aplikasi start |

File `.env` masuk `.gitignore` sehingga password tidak ikut ter-commit; yang di-commit hanya `.env.example`.

## Migrasi database

Aplikasi ini menggunakan **sinkronisasi skema TypeORM**: saat dijalankan (selain `NODE_ENV=production`), kelima tabel (`categories`, `products`, `customers`, `orders`, `order_items`) beserta foreign key dan constraint dibuat otomatis di database `DB_DATABASE` dari entity di `src/**/entities/`. Database-nya harus sudah ada (langkah 2 di atas); tabel tidak perlu dibuat manual.

Untuk produksi, set `DB_SYNCHRONIZE=false` dan kelola perubahan skema dengan migrasi TypeORM (`typeorm migration:generate`) agar data tidak berisiko berubah otomatis.

## Menjalankan aplikasi

```bash
npm run start:dev      # development (auto-reload)
```
```bash
npm run build && npm run start:prod   # produksi
```

Setelah berjalan:
- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/api-docs`

## Pengujian

```bash
npm run test:e2e       # uji alur bisnis + relasi (SQLite in-memory, tidak menyentuh PostgreSQL)
```
```bash
npm test               # unit test
```

### Postman

1. Jalankan aplikasi (`npm run start:dev`).
2. Impor `postman/ecommerce.postman_collection.json` ke Postman. Variabel `baseUrl` default `http://localhost:3000`; ubah sesuai `PORT` di `.env` bila berbeda.
3. Jalankan seluruh collection dengan **Collection Runner** (folder berurutan, jangan diacak).

Atau lewat terminal:

```bash
npm run test:postman
```

Collection berisi **76 request / 113 assertion**: CRUD semua entitas, pembuatan & pengambilan data beserta relasinya, update & delete, input tidak valid (400), ID tidak ditemukan (404), dan konflik relasi/aturan bisnis (409). Data uji dibersihkan di folder terakhir sehingga collection bisa dijalankan berulang kali (collection ini menulis ke database yang dikonfigurasi di `.env`, lalu menghapus data ujinya sendiri). Bukti hasil run ada di `docs/HASIL-PENGUJIAN-POSTMAN.txt`.

Menghasilkan ulang `docs/openapi.json` setelah mengubah controller/DTO:

```bash
npm run docs:openapi
```

## Struktur proyek

```
src/
├── app.module.ts            # ConfigModule + TypeORM + semua modul fitur
├── main.ts                  # ValidationPipe global + Swagger
├── swagger.ts
├── categories/  products/  customers/  orders/  order-items/
│   ├── entities/            # entity TypeORM + relasi
│   ├── dto/                 # DTO + aturan validasi
│   ├── *.controller.ts      # routing HTTP, status code
│   ├── *.service.ts         # logika bisnis, akses database
│   └── *.module.ts
docs/        # ERD, API spec, OpenAPI, bukti pengujian
postman/     # Postman Collection
test/        # e2e test
```

## Alur request hingga database

Contoh `POST /orders`:

1. **Request** masuk ke `OrdersController.create()`.
2. `ValidationPipe` memvalidasi body terhadap `CreateOrderDto` (tipe, `items` minimal 1, `quantity ≥ 1`, properti asing ditolak). Gagal → **400** sebelum menyentuh service.
3. `OrdersService.create()` membuka **transaksi database** (`DataSource.transaction`).
4. Di dalam transaksi: cek pelanggan ada (404 jika tidak), simpan `Order`, lalu untuk tiap produk: cek produk ada (404), cek stok (400), simpan `OrderItem` dengan `unitPrice` hasil salinan harga produk saat itu, kurangi `products.stock`, hitung `totalAmount`.
5. Jika ada error di langkah mana pun, transaksi di-**rollback** — stok dan data tidak berubah sama sekali.
6. Sukses → pesanan dimuat ulang beserta `customer` dan `items.product` lalu dikembalikan dengan **201**.

Error dari service berupa `NotFoundException` (404), `BadRequestException` (400), atau `ConflictException` (409), yang dirender Nest menjadi `{ message, error, statusCode }`.

## Keputusan desain

- **`order_items` sebagai tabel penghubung** many-to-many antara pesanan dan produk, membawa `quantity`, `unitPrice`, `subtotal`.
- **`unitPrice` disalin saat transaksi** agar riwayat pesanan tidak berubah ketika harga produk diubah.
- **Stok dikelola di service dalam transaksi** untuk menjaga konsistensi (kurangi saat pesan, kembalikan saat batal/hapus/ubah item). Pengurangan memakai `UPDATE ... WHERE stock >= qty` yang atomik, sehingga dua pesanan bersamaan tidak membuat stok minus.
- **Kolom uang bertipe `numeric(12,2)`** (bukan float) agar perhitungan harga/total tepat.
- **`ON DELETE RESTRICT`** pada kategori→produk, pelanggan→pesanan, dan produk→item mencegah data yatim; **`CASCADE`** pada pesanan→item.
- **Item pesanan tidak punya endpoint tulis sendiri**; semua perubahan lewat `/orders` agar stok dan total tidak bisa tidak sinkron.
- **Status pesanan** dibatasi alur `pending → paid → shipped → completed` (+ `cancelled`), lihat aturan bisnis B8–B10 di dokumen desain.
