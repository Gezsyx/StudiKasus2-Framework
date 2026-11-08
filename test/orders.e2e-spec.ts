import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';

describe('E-commerce flow (e2e)', () => {
  let app: INestApplication<App>;
  let http: ReturnType<typeof request>;
  let categoryId: number;
  let productId: number;
  let customerId: number;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    http = request(app.getHttpServer());

    categoryId = (await http.post('/categories').send({ name: 'Elektronik' }).expect(201)).body.id;
    productId = (
      await http.post('/products').send({ name: 'Mouse', price: 150000, stock: 10, categoryId }).expect(201)
    ).body.id;
    customerId = (await http.post('/customers').send({ name: 'Budi', email: 'budi@mail.com' }).expect(201)).body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  const stock = async () => (await http.get(`/products/${productId}`).expect(200)).body.stock as number;

  it('menolak data tidak valid dan duplikat', async () => {
    await http.post('/products').send({ name: 'X', price: -1, stock: 1.5, categoryId }).expect(400);
    await http.post('/categories').send({ name: 'Elektronik' }).expect(409);
    await http.post('/customers').send({ name: 'Dobel', email: 'budi@mail.com' }).expect(409);
  });

  it('menolak pesanan jika stok kurang atau produk/pelanggan tidak ada', async () => {
    await http.post('/orders').send({ customerId, items: [{ productId, quantity: 99 }] }).expect(400);
    await http.post('/orders').send({ customerId, items: [{ productId: 999, quantity: 1 }] }).expect(404);
    await http.post('/orders').send({ customerId: 999, items: [{ productId, quantity: 1 }] }).expect(404);
    expect(await stock()).toBe(10);
  });

  it('alur pesanan: buat, harga snapshot, ubah item, status, batal, hapus', async () => {
    const created = await http
      .post('/orders')
      .send({ customerId, items: [{ productId, quantity: 2 }, { productId, quantity: 1 }] })
      .expect(201);
    const orderId = created.body.id;
    expect(created.body.totalAmount).toBe(450000);
    expect(created.body.items).toHaveLength(1);
    expect(created.body.items[0]).toMatchObject({ quantity: 3, unitPrice: 150000, subtotal: 450000 });
    expect(created.body.items[0].product.name).toBe('Mouse');
    expect(await stock()).toBe(7);

    // Harga produk berubah, harga pada detail pesanan tetap.
    await http.patch(`/products/${productId}`).send({ price: 200000 }).expect(200);
    const items = await http.get(`/order-items?orderId=${orderId}`).expect(200);
    expect(items.body[0].unitPrice).toBe(150000);

    // Ubah item saat pending: stok lama dikembalikan, stok baru dikurangi.
    const updated = await http.patch(`/orders/${orderId}`).send({ items: [{ productId, quantity: 4 }] }).expect(200);
    expect(updated.body.totalAmount).toBe(800000);
    expect(await stock()).toBe(6);

    // Produk yang sudah dipakai pesanan tidak boleh dihapus.
    await http.delete(`/products/${productId}`).expect(409);

    // Alur status.
    await http.patch(`/orders/${orderId}`).send({ status: 'shipped' }).expect(409);
    await http.patch(`/orders/${orderId}`).send({ status: 'paid' }).expect(200);
    await http.patch(`/orders/${orderId}`).send({ items: [{ productId, quantity: 1 }] }).expect(409);
    await http.delete(`/orders/${orderId}`).expect(409);

    // Batal mengembalikan stok, lalu pesanan boleh dihapus.
    await http.patch(`/orders/${orderId}`).send({ status: 'cancelled' }).expect(200);
    expect(await stock()).toBe(10);
    await http.delete(`/orders/${orderId}`).expect(200);
    await http.get(`/orders/${orderId}`).expect(404);
  });

  it('daftar pesanan dapat dipanggil tanpa filter maupun dengan filter', async () => {
    const created = await http.post('/orders').send({ customerId, items: [{ productId, quantity: 1 }] }).expect(201);
    const all = await http.get('/orders').expect(200);
    expect(all.body.map((o: { id: number }) => o.id)).toContain(created.body.id);
    const filtered = await http.get(`/orders?customerId=${customerId}&status=pending`).expect(200);
    expect(filtered.body.length).toBeGreaterThan(0);
    await http.get('/orders?status=ngawur').expect(400);
    await http.delete(`/orders/${created.body.id}`).expect(200);
  });

  it('kategori dan pelanggan yang masih dipakai tidak boleh dihapus', async () => {
    const { body } = await http.post('/orders').send({ customerId, items: [{ productId, quantity: 1 }] }).expect(201);
    await http.delete(`/categories/${categoryId}`).expect(409);
    await http.delete(`/customers/${customerId}`).expect(409);

    await http.delete(`/orders/${body.id}`).expect(200); // pending: stok kembali
    expect(await stock()).toBe(10);
    await http.delete(`/customers/${customerId}`).expect(200);
  });
});
