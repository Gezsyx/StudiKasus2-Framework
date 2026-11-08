# API Specification — E-commerce Management System

- **Base URL:** `http://localhost:3000` (port diatur lewat `PORT` di `.env`)
- **Format:** JSON (`Content-Type: application/json`), tanpa autentikasi
- **Swagger UI interaktif:** `http://localhost:3000/api-docs`
- **OpenAPI (mesin-baca):** [`openapi.json`](./openapi.json) — dibuat dengan `npm run docs:openapi`
- **Postman Collection:** [`../postman/ecommerce.postman_collection.json`](../postman/ecommerce.postman_collection.json)

Dokumen ini ditulis sesuai implementasi dan diverifikasi oleh Postman Collection (tiap endpoint, termasuk skenario error, punya assertion otomatis).

## Ringkasan Endpoint

| Method | Path | Deskripsi | Sukses |
|--------|------|-----------|--------|
| POST | `/categories` | Tambah kategori | 201 |
| GET | `/categories` | Daftar kategori | 200 |
| GET | `/categories/:id` | Detail kategori + produknya | 200 |
| PATCH | `/categories/:id` | Ubah kategori | 200 |
| DELETE | `/categories/:id` | Hapus kategori | 200 |
| POST | `/products` | Tambah produk | 201 |
| GET | `/products?categoryId=` | Daftar produk (filter kategori opsional) | 200 |
| GET | `/products/:id` | Detail produk + kategori | 200 |
| PATCH | `/products/:id` | Ubah produk | 200 |
| DELETE | `/products/:id` | Hapus produk | 200 |
| POST | `/customers` | Tambah pelanggan | 201 |
| GET | `/customers` | Daftar pelanggan | 200 |
| GET | `/customers/:id` | Detail pelanggan + pesanannya | 200 |
| PATCH | `/customers/:id` | Ubah pelanggan | 200 |
| DELETE | `/customers/:id` | Hapus pelanggan | 200 |
| POST | `/orders` | Buat pesanan (kurangi stok) | 201 |
| GET | `/orders?customerId=&status=` | Daftar pesanan (filter opsional) | 200 |
| GET | `/orders/:id` | Detail pesanan + pelanggan + item + produk | 200 |
| PATCH | `/orders/:id` | Ubah item dan/atau status pesanan | 200 |
| DELETE | `/orders/:id` | Hapus pesanan | 200 |
| GET | `/order-items?orderId=` | Daftar detail item (filter pesanan opsional) | 200 |
| GET | `/order-items/:id` | Detail satu item + produk + pesanan | 200 |

> Detail item (`order-items`) hanya dibaca lewat endpoint ini. Pembuatan, perubahan, dan penghapusan item dilakukan melalui `/orders` agar stok dan total selalu konsisten (lihat aturan bisnis B4–B10 di [DESAIN-DAN-ERD.md](./DESAIN-DAN-ERD.md)).

## Format Error (semua endpoint)

```json
{ "message": "Pesan error", "error": "Conflict", "statusCode": 409 }
```

Untuk kegagalan validasi, `message` berupa **array** berisi semua pelanggaran:

```json
{ "message": ["price must not be less than 0", "stock must be an integer number"], "error": "Bad Request", "statusCode": 400 }
```

| Status | Arti | Contoh penyebab |
|--------|------|-----------------|
| 400 | Bad Request | Body tidak valid, properti tak dikenal, `:id` / query bukan angka, stok tidak cukup |
| 404 | Not Found | ID tidak ada, atau referensi (kategori/pelanggan/produk) tidak ada |
| 409 | Conflict | Data unik duplikat, relasi masih dipakai, transisi status tidak sah |

Properti yang tidak dideklarasikan di DTO **ditolak** (`400`, `property x should not exist`).

---

## Categories

### Skema `Category`
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | integer | PK, otomatis |
| name | string | wajib, unik, maks. 100 karakter |
| description | string \| null | opsional |

### `POST /categories`
Body: `{ "name": "Elektronik", "description": "Perangkat elektronik" }` (`description` opsional)

| Status | Kondisi |
|--------|---------|
| 201 | `{ "id": 1, "name": "Elektronik", "description": "Perangkat elektronik" }` |
| 400 | `name` kosong / bukan string / > 100 karakter |
| 409 | Nama sudah ada |

### `GET /categories` → 200
`[ { "id": 1, "name": "Elektronik", "description": null } ]`

### `GET /categories/:id`
200 — kategori beserta array `products`:
```json
{ "id": 1, "name": "Elektronik", "description": null,
  "products": [ { "id": 1, "name": "Mouse", "price": 150000, "stock": 10, "categoryId": 1, "description": null } ] }
```
400 `:id` bukan angka · 404 tidak ditemukan

### `PATCH /categories/:id`
Body: salah satu/semua field `name`, `description`.
200 — kategori yang sudah diperbarui · 400 · 404 · 409 (nama dipakai kategori lain)

### `DELETE /categories/:id`
200 `{ "message": "Kategori #1 dihapus" }` · 404 · 409 jika masih punya produk (`Kategori #1 masih dipakai oleh N produk`)

---

## Products

### Skema `Product`
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | integer | PK |
| name | string | wajib, maks. 150 karakter |
| description | string \| null | opsional |
| price | number | wajib, ≥ 0, maks. 2 desimal |
| stock | integer | wajib, ≥ 0 |
| categoryId | integer | FK → categories.id, wajib |
| category | Category | ikut dikembalikan pada create/get/update |

### `POST /products`
```json
{ "name": "Mouse", "description": "Mouse nirkabel", "price": 150000, "stock": 10, "categoryId": 1 }
```
201 — produk beserta `category` · 400 (validasi) · 404 (`Kategori #x tidak ditemukan`)

### `GET /products?categoryId=1` → 200
Array produk (masing-masing dengan `category`). `categoryId` opsional; nilai non-angka → 400.

### `GET /products/:id` → 200 · 400 · 404

### `PATCH /products/:id`
Body: field apa pun dari `POST`. 200 produk terbaru · 400 · 404 (produk atau kategori baru tidak ada)

### `DELETE /products/:id`
200 `{ "message": "Produk #1 dihapus" }` · 404 · 409 jika sudah dipakai di detail pesanan

---

## Customers

### Skema `Customer`
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | integer | PK |
| name | string | wajib, maks. 100 karakter |
| email | string | wajib, format email, unik |
| phone | string \| null | opsional, maks. 30 karakter |
| address | string \| null | opsional |

### `POST /customers`
```json
{ "name": "Budi", "email": "budi@mail.com", "phone": "08123456789", "address": "Jl. Mawar 1" }
```
201 pelanggan · 400 (mis. `email must be an email`) · 409 (`Email "..." sudah terdaftar`)

### `GET /customers` → 200
### `GET /customers/:id`
200 — pelanggan beserta array `orders` (tanpa item) · 400 · 404

### `PATCH /customers/:id`
200 · 400 · 404 · 409 (email dipakai pelanggan lain)

### `DELETE /customers/:id`
200 `{ "message": "Pelanggan #1 dihapus" }` · 404 · 409 jika masih punya pesanan

---

## Orders

### Skema `Order`
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | integer | PK |
| customerId | integer | FK → customers.id |
| status | enum | `pending` \| `paid` \| `shipped` \| `completed` \| `cancelled` (awal: `pending`) |
| totalAmount | number | dihitung server |
| createdAt, updatedAt | string (ISO 8601) | otomatis |
| customer | Customer | pada create/get/update |
| items | OrderItem[] | pada create/get/update |

### Skema `OrderItem`
| Field | Tipe | Keterangan |
|-------|------|------------|
| id | integer | PK |
| orderId | integer | FK → orders.id |
| productId | integer | FK → products.id |
| quantity | integer | ≥ 1 |
| unitPrice | number | harga produk **saat transaksi** |
| subtotal | number | `unitPrice × quantity` |
| product | Product | informasi produk terkait |

### `POST /orders`
```json
{ "customerId": 1, "items": [ { "productId": 1, "quantity": 2 }, { "productId": 2, "quantity": 1 } ] }
```
201 — pesanan `pending` lengkap dengan `customer` dan `items[].product`; stok produk berkurang.

| Status | Kondisi |
|--------|---------|
| 400 | `items` kosong/bukan array, `quantity` < 1, **stok tidak cukup** (`Stok produk "Mouse" tidak cukup (tersedia 10, diminta 99)`) |
| 404 | Pelanggan atau produk tidak ditemukan |

Jika terjadi kegagalan, tidak ada perubahan data (seluruh proses dalam satu transaksi).

### `GET /orders?customerId=1&status=pending`
200 — array pesanan (terbaru lebih dulu), lengkap dengan `customer` dan `items[].product`. `status` harus salah satu nilai enum, jika tidak → 400.

### `GET /orders/:id` → 200 · 400 · 404

### `PATCH /orders/:id`
Body (semua opsional, minimal salah satu):
```json
{ "status": "paid" }
```
```json
{ "items": [ { "productId": 1, "quantity": 4 } ] }
```
- `items` **mengganti seluruh** item pesanan; hanya saat status `pending`. Stok item lama dikembalikan lalu stok baru dikurangi; `totalAmount` dihitung ulang dengan harga produk saat itu.
- `status` mengikuti alur: `pending → paid | cancelled`, `paid → shipped | cancelled`, `shipped → completed`. Pembatalan mengembalikan stok.

200 — pesanan terbaru · 400 (validasi / stok tidak cukup) · 404 · 409 (transisi status tidak sah, mis. `Status tidak dapat berubah dari "pending" ke "shipped"`; atau ubah `items` saat status bukan `pending`)

### `DELETE /orders/:id`
200 `{ "message": "Pesanan #1 dihapus" }` · 404 · 409 jika status bukan `pending`/`cancelled`. Menghapus pesanan `pending` mengembalikan stok.

---

## Order Items (read-only)

### `GET /order-items?orderId=1` → 200
```json
[ { "id": 1, "orderId": 1, "productId": 1, "quantity": 3, "unitPrice": 150000, "subtotal": 450000,
    "product": { "id": 1, "name": "Mouse", "price": 150000, "stock": 7, "categoryId": 1, "description": null } } ]
```
`orderId` opsional; non-angka → 400.

### `GET /order-items/:id`
200 — item beserta `product` dan `order` · 400 · 404 (`Detail pesanan #x tidak ditemukan`)
