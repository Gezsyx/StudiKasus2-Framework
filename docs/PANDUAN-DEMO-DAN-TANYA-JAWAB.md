# Panduan Demo & Tanya Jawab — E-commerce Management System

Dokumen belajar untuk sesi presentasi. Bagian 1 = persiapan, bagian 2 = skrip praktik langsung ("coba mas praktekkan"), bagian 3 = latihan tanya jawab, bagian 4 = peta kode, bagian 5 = kelemahan yang harus diakui jujur.

> Port di panduan ini mengikuti `.env` di komputer pengembang: **API `3001`**, **PostgreSQL `5436`**. Jika `.env` Anda berbeda (default `3000` / `5432`), sesuaikan.

---

## 1. Persiapan (lakukan 10 menit sebelum presentasi)

| # | Langkah | Cek berhasil |
|---|---------|--------------|
| 1 | Buka **Docker Desktop**, tunggu status *running* | Ikon Docker hijau |
| 2 | `docker compose up -d` (di folder proyek) | `docker ps` menampilkan `studikasus2-postgres ... (healthy)` |
| 3 | `npm run start:dev` | Terminal menulis `API berjalan di http://localhost:3001` |
| 4 | Buka **Swagger**: `http://localhost:3001/api-docs` | Daftar endpoint tampil |
| 5 | Buka **DBeaver**, koneksi ke `localhost:5436`, database `studikasus2uts` | Tabel terlihat di *Schemas → public → Tables* |
| 6 | Buka **Postman**, impor `postman/ecommerce.postman_collection.json`, set variabel `baseUrl` = `http://localhost:3001` | Collection muncul |

Jalankan Postman Collection **sekali** sebelum hari-H untuk memastikan semuanya hijau (76 request, 113 assertion). Collection memakai nama unik miliknya sendiri dan hanya menghapus data ujinya sendiri.

**Tidak ada login / token / API key.** Langsung *Try it out → Execute* di Swagger, atau kirim request di Postman dengan *No Auth*.

---

## 2. Skrip praktik langsung

Lakukan di Swagger (paling mudah ditunjukkan) atau Postman. Ganti `{id}` dengan ID dari response sebelumnya. **Urutan membuat data harus mengikuti relasi**: kategori → produk → pelanggan → pesanan.

### A. CREATE — membuat data (POST)

**1. Kategori** — `POST /categories` → **201**
```json
{ "name": "Peralatan Olahraga", "description": "Perlengkapan olahraga" }
```
Catat `id` kategori → `categoryId`.

**2. Produk** — `POST /products` → **201**
```json
{ "name": "Bola Futsal", "description": "Bola futsal ukuran 4", "price": 120000, "stock": 20, "categoryId": 5 }
```
Response sudah memuat objek `category` (hasil relasi). Catat `id` produk → `productId`.

**3. Pelanggan** — `POST /customers` → **201**
```json
{ "name": "Rina Marlina", "email": "rina.marlina@mail.com", "phone": "081200000000", "address": "Jl. Melati No. 3, Bandung" }
```
Catat `id` → `customerId`.

**4. Pesanan** — `POST /orders` → **201**
```json
{ "customerId": 6, "items": [ { "productId": 10, "quantity": 2 } ] }
```
Tunjukkan di response: `status: "pending"`, `totalAmount` terhitung otomatis, `items[].unitPrice` dan `subtotal`, serta `items[].product` dan `customer` (relasi). Catat `id` → `orderId`.

> Poin bicara: *klien hanya mengirim produk & jumlah. Harga, subtotal, dan total dihitung server supaya tidak bisa dimanipulasi.*

### B. READ — membaca data (GET)

| Request | Yang ditunjukkan |
|---------|------------------|
| `GET /categories` | Daftar kategori |
| `GET /categories/{id}` | Detail kategori **beserta produknya** (relasi 1→N) |
| `GET /products?categoryId={id}` | Filter produk per kategori |
| `GET /customers/{id}` | Detail pelanggan **beserta pesanannya** |
| `GET /orders/{id}` | Pesanan lengkap: pelanggan + item + produk |
| `GET /orders?status=pending` | Filter pesanan per status |
| `GET /order-items?orderId={id}` | Detail item satu pesanan |

**Buktikan stok berkurang:** `GET /products/{productId}` → stok sebelumnya 20, sekarang 18.

### C. UPDATE — mengubah data (PATCH)

1. `PATCH /products/{id}` body `{ "price": 150000 }` → **200**. Hanya field yang dikirim yang berubah.
2. **Buktikan harga snapshot:** `GET /order-items?orderId={id}` → `unitPrice` di pesanan lama **tetap 120000**, walau harga produk sudah 150000.
3. `PATCH /orders/{id}` body `{ "items": [ { "productId": 10, "quantity": 4 } ] }` → total dihitung ulang, stok disesuaikan (hanya boleh saat `pending`).
4. `PATCH /orders/{id}` body `{ "status": "paid" }` → **200**.

### D. DELETE — menghapus data

1. `DELETE /orders/{id}` pada pesanan `pending`/`cancelled` → **200** `{ "message": "Pesanan #.. dihapus" }`. Stok kembali jika pesanan masih `pending`.
2. `GET /orders/{id}` setelahnya → **404** (bukti sudah terhapus).

### E. Skenario GAGAL (bagian yang paling meyakinkan dosen)

| Skenario | Request | Hasil |
|----------|---------|-------|
| Data wajib kosong | `POST /products` body `{}` | **400** + 8 pesan validasi |
| Nilai tidak masuk akal | `POST /products` dengan `"price": -1` | **400** |
| Field asing | `POST /categories` dengan `"foo": "bar"` | **400** (`should not exist`) |
| ID tidak ada | `GET /products/999999` | **404** |
| ID bukan angka | `GET /products/abc` | **400** |
| Referensi tidak ada | `POST /products` dengan `categoryId` 999999 | **404** |
| Nama kategori ganda | `POST /categories` dengan nama yang sama | **409** |
| Email pelanggan ganda | `POST /customers` dengan email yang sama | **409** |
| **Stok tidak cukup** | `POST /orders` dengan `quantity` 9999 | **400** — stok tidak berubah |
| Hapus kategori yang masih punya produk | `DELETE /categories/{id}` | **409** |
| Hapus produk yang pernah dipesan | `DELETE /products/{id}` | **409** |
| Hapus pelanggan yang punya pesanan | `DELETE /customers/{id}` | **409** |
| Status melompat | `PATCH /orders/{id}` `{ "status": "shipped" }` dari `pending` | **409** |
| Ubah item saat sudah `paid` | `PATCH /orders/{id}` dengan `items` | **409** |
| Hapus pesanan `paid`/`shipped` | `DELETE /orders/{id}` | **409** |

### F. Bukti di database

Kembali ke **DBeaver** → klik kanan tabel → *View Data* → **F5**. Data yang baru dibuat lewat API muncul di tabel. Tunjukkan juga `order_items` (tabel penghubung) dan kolom `unitPrice`.

### G. Penutup: Postman Collection

Jalankan seluruh collection di *Collection Runner*: **76 request / 113 assertion hijau**. Bukti tertulis ada di `docs/HASIL-PENGUJIAN-POSTMAN.txt`.

---

## 3. Latihan tanya jawab

### Arsitektur & alur
**Jelaskan alur satu request sampai database.**
Request masuk ke **Controller** → `ValidationPipe` memeriksa body terhadap **DTO** (gagal = 400) → controller memanggil **Service** → service memakai **Repository/TypeORM** untuk query ke **PostgreSQL** → hasil dikembalikan sebagai JSON. Contoh nyata: `POST /orders` (lihat README bagian *Alur request hingga database*).

**Apa fungsi Module, Controller, Service?**
Module membungkus satu fitur dan mendaftarkan komponennya. Controller menangani HTTP (route, status code). Service berisi logika bisnis dan akses database. Pemisahan ini membuat kode mudah diuji dan dibaca.

**Apa itu DTO dan kenapa dipakai?**
Bentuk data yang boleh dikirim klien, beserta aturan validasinya (`class-validator`). Dengan DTO, data tidak valid ditolak sebelum menyentuh logika bisnis atau database.

**Apa itu Entity?**
Class yang merepresentasikan satu tabel. Satu objek = satu baris. Relasi antar tabel dideklarasikan dengan decorator `@OneToMany` / `@ManyToOne`.

### Database & relasi
**Ada berapa entitas dan relasi?**
5 entitas (`categories`, `products`, `customers`, `orders`, `order_items`) dan 4 relasi: kategori→produk (1:N), pelanggan→pesanan (1:N), pesanan→item (1:N), produk→item (1:N). Gabungan dua terakhir membentuk relasi **many-to-many** antara pesanan dan produk.

**Kenapa ada tabel `order_items`?**
Itu tabel penghubung. Satu pesanan berisi banyak produk, dan satu produk ada di banyak pesanan. Tabel ini juga menyimpan data milik relasinya: `quantity`, `unitPrice`, `subtotal`.

**Kenapa `unitPrice` disimpan di item, bukan mengambil dari produk?**
Harga produk bisa berubah. Kalau mengambil dari produk, total pesanan lama ikut berubah. Dengan menyalin harga saat transaksi (snapshot), riwayat tetap benar.

**Apa arti `RESTRICT` dan `CASCADE`?**
`RESTRICT`: data induk tidak boleh dihapus selama masih dipakai (kategori, pelanggan, produk). `CASCADE`: kalau pesanan dihapus, item-itemnya ikut terhapus otomatis.

**Kenapa kolom uang `numeric(12,2)`, bukan float?**
Float menyimpan pecahan secara pendekatan sehingga bisa meleset (0.1 + 0.2). `numeric` menyimpan desimal tepat, penting untuk uang.

**Apa itu primary key dan foreign key di proyek ini?**
Primary key: kolom `id` di tiap tabel. Foreign key: `products.categoryId`, `orders.customerId`, `order_items.orderId`, `order_items.productId`.

### Aturan bisnis
**Bagaimana stok dijaga agar tidak minus?**
Pengurangan stok memakai satu perintah atomik: `UPDATE products SET stock = stock - qty WHERE id = ? AND stock >= qty`. Jika tidak ada baris yang terpengaruh, stok tidak cukup → 400. Sudah diuji dengan 8 pesanan bersamaan untuk stok 1: hanya 1 berhasil.

**Apa itu transaksi dan kenapa dipakai di pesanan?**
Beberapa langkah (simpan pesanan, simpan item, kurangi stok) dijadikan satu kesatuan. Kalau satu gagal, semuanya dibatalkan (rollback), jadi tidak ada pesanan setengah jadi atau stok berkurang tanpa pesanan.

**Bagaimana alur status pesanan?**
`pending → paid → shipped → completed`. Pembatalan hanya dari `pending`/`paid` dan mengembalikan stok. Definisinya di `order-status.enum.ts`.

**Kenapa item pesanan tidak punya endpoint POST/PATCH/DELETE sendiri?**
Kalau item bisa diubah bebas, stok dan total pesanan bisa tidak sinkron. Semua perubahan item lewat `/orders` supaya selalu konsisten.

### HTTP & API
**Kenapa update memakai PATCH, bukan PUT?**
PATCH untuk update sebagian (kirim field yang berubah saja). PUT mengharuskan mengirim seluruh data.

**Arti status code yang dipakai?**
200 berhasil, 201 berhasil membuat, 400 input tidak valid, 404 data tidak ditemukan, 409 konflik (duplikat, masih dipakai, aturan status).

**Kenapa DELETE mengembalikan 200 dengan pesan, bukan 204?**
Pilihan desain agar klien mendapat konfirmasi teks. 204 (tanpa isi) juga valid; keduanya sah.

**Apa bedanya 400, 404, 409?**
400: permintaannya salah bentuk. 404: yang dicari tidak ada. 409: permintaannya benar bentuknya tetapi bertentangan dengan kondisi data saat ini.

### Swagger, Postman, dokumentasi
**Swagger vs Postman?**
Swagger mendokumentasikan API (dibuat otomatis dari kode, bisa dicoba langsung). Postman menguji API (request + assertion otomatis). Saling melengkapi.

**Bagaimana Swagger dibuat?**
`src/swagger.ts` membangun dokumen, dipasang di `main.ts` pada `/api-docs`. Plugin `@nestjs/swagger` (di `nest-cli.json`) membaca DTO; `@ApiTags` dan `@Api*Response` di controller menambahkan kelompok dan daftar error. `npm run docs:openapi` mengekspor ke `docs/openapi.json`.

### Konfigurasi & deployment
**Kenapa memakai `.env`?**
Konfigurasi dan rahasia (password database) tidak ditulis di kode. `.env` masuk `.gitignore`; yang di-commit hanya `.env.example`.

**Untuk apa Docker Compose?**
Menjalankan PostgreSQL dengan satu perintah, dengan user/password/database mengikuti `.env`. Data disimpan di volume sehingga tidak hilang saat container berhenti.

**Apa itu `synchronize` dan bagaimana soal migrasi?**
Saat aplikasi jalan (selain production), TypeORM membuat/menyesuaikan tabel otomatis dari entity. Itu yang menggantikan migrasi manual untuk development. Untuk production disarankan `DB_SYNCHRONIZE=false` dan memakai migrasi.

**Apakah ada login?**
Tidak. Soal tidak memintanya; ini backend pengelolaan toko. Jika ditambah: kolom password (hash), `POST /auth/login` mengembalikan JWT, dan guard untuk melindungi endpoint.

---

## 4. Peta kode (untuk menunjukkan "ini di mana?")

| Yang ditanya | File |
|--------------|------|
| Route & status code | `src/*/*.controller.ts` — cari penanda `===== CREATE =====`, `READ`, `UPDATE`, `DELETE` |
| Logika CRUD & aturan bisnis | `src/*/*.service.ts` |
| Aturan validasi | `src/*/dto/*.dto.ts` |
| Tabel & relasi | `src/*/entities/*.entity.ts` |
| Alur status pesanan | `src/orders/order-status.enum.ts` |
| Transaksi & stok atomik | `src/orders/orders.service.ts` (`create`, `update`, `addItems`) |
| Koneksi database & `.env` | `src/app.module.ts` |
| Validasi global & Swagger | `src/main.ts`, `src/swagger.ts` |
| ERD & aturan bisnis | `docs/DESAIN-DAN-ERD.md` |
| Spesifikasi API | `docs/API-SPEC.md`, `docs/openapi.json` |
| Postman | `postman/ecommerce.postman_collection.json` |

---

## 5. Kelemahan yang harus diakui jujur

Dosen sering menanyakan "apa kekurangannya?". Lebih baik menyebutkannya sendiri:

- **Tidak ada autentikasi/otorisasi.** Siapa pun yang tahu URL bisa mengubah data (di luar cakupan soal).
- **Tidak ada file migrasi.** Skema dibuat otomatis lewat `synchronize`; untuk production perlu migrasi TypeORM.
- **Tidak ada pagination.** `GET` daftar mengembalikan semua baris; data besar akan lambat.
- **Swagger belum memuat contoh response sukses yang lengkap.** Request, parameter, dan error terdokumentasi; detail response ada di `docs/API-SPEC.md`.
- **Pembayaran hanya berupa status.** Tidak ada integrasi pembayaran sungguhan.
- **Tidak ada unit test per service.** Pengujian berupa e2e (alur bisnis) dan Postman.

---

## 6. Tips saat demo

- Jangan menjalankan pesanan sukses berulang kali pada produk demo; stok akan menipis. Untuk skenario gagal stok, kirim `quantity` besar supaya ditolak.
- Selalu **F5** di DBeaver setelah membuat/menghapus data.
- Jika `POST` memberi **409** pada kategori/email, berarti nama/email itu sudah dipakai — ganti nilainya.
- Kalau ditanya sesuatu yang tidak Anda tahu: tunjukkan **file dan penanda komentar** tempat logikanya, lalu jelaskan alurnya dari situ.
- Reset total data (hati-hati, **menghapus semua data**): `docker compose down -v` lalu `docker compose up -d`.
