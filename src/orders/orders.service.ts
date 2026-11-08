import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, FindOptionsWhere } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity.js';
import { OrderItemInputDto } from '../order-items/dto/order-item-input.dto.js';
import { OrderItem } from '../order-items/entities/order-item.entity.js';
import { Product } from '../products/entities/product.entity.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderDto } from './dto/update-order.dto.js';
import { Order } from './entities/order.entity.js';
import { ORDER_STATUS_TRANSITIONS, OrderStatus } from './order-status.enum.js';

// Relasi yang selalu ikut dimuat saat menampilkan pesanan: pelanggan + item + produk tiap item (fitur utama #5 pada soal).
const WITH_DETAIL = { customer: true, items: { product: true } } as const;
// Pembulatan 2 desimal untuk perhitungan uang.
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Service pesanan = bagian paling kompleks, karena satu operasi menyentuh BEBERAPA tabel sekaligus
 * (orders, order_items, products). Karena itu operasi tulis dibungkus TRANSAKSI database:
 * semua langkah berhasil bersama, atau jika ada satu yang gagal SEMUANYA dibatalkan (rollback).
 * Jadi tidak mungkin ada pesanan setengah jadi atau stok yang berkurang tanpa pesanan.
 */
@Injectable()
export class OrdersService {
  // DataSource = koneksi database utama; dipakai untuk membuka transaksi.
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  // ===== CREATE ===== (POST /orders)
  /**
   * Membuat pesanan: validasi pelanggan & produk, cek stok, simpan harga produk saat transaksi,
   * kurangi stok, dan hitung total. Semua dalam satu transaksi (gagal = rollback).
   */
  create(dto: CreateOrderDto) {
    // `m` = EntityManager milik transaksi ini. Semua query HARUS lewat `m` agar ikut dalam transaksi.
    return this.dataSource.transaction(async (m) => {
      // 1) Pelanggan harus ada -> 404 jika tidak.
      if (!(await m.existsBy(Customer, { id: dto.customerId }))) {
        throw new NotFoundException(`Pelanggan #${dto.customerId} tidak ditemukan`);
      }
      // 2) INSERT INTO orders (status awal 'pending', total sementara 0).
      const order = await m.save(
        m.create(Order, { customerId: dto.customerId, status: OrderStatus.PENDING, totalAmount: 0 }),
      );
      // 3) Simpan semua item + kurangi stok; hasilnya total harga.
      const total = await this.addItems(m, order.id, dto.items);
      // 4) UPDATE orders SET totalAmount = hasil hitung server.
      await m.update(Order, order.id, { totalAmount: total });
      // 5) Ambil ulang lengkap (pelanggan + item + produk) sebagai response.
      return this.load(m, order.id);
    });
  }

  // ===== READ (daftar) ===== (GET /orders, opsional ?customerId= dan ?status=)
  findAll(filter: { customerId?: number; status?: OrderStatus }) {
    // Hanya sertakan filter yang diberikan (TypeORM menolak nilai `undefined` di where).
    const where: FindOptionsWhere<Order> = {};
    if (filter.customerId !== undefined) where.customerId = filter.customerId;
    if (filter.status !== undefined) where.status = filter.status;
    return this.dataSource.getRepository(Order).find({
      where,
      relations: WITH_DETAIL, // JOIN pelanggan, item, dan produk
      order: { id: 'DESC' }, // pesanan terbaru di atas
    });
  }

  // ===== READ (detail) ===== (GET /orders/:id) -> 404 jika tidak ada (diatur di load())
  findOne(id: number) {
    return this.load(this.dataSource.manager, id);
  }

  // ===== UPDATE ===== (PATCH /orders/:id)
  /**
   * Memperbarui pesanan.
   * - `items`  : hanya saat status `pending`; stok lama dikembalikan lalu stok baru dikurangi.
   * - `status` : harus mengikuti alur pending → paid → shipped → completed (cancel dari pending/paid).
   *              Pembatalan mengembalikan stok.
   */
  update(id: number, dto: UpdateOrderDto) {
    return this.dataSource.transaction(async (m) => {
      const order = await this.load(m, id); // 404 jika pesanan tidak ada

      // --- Bagian A: mengganti item pesanan ---
      if (dto.items) {
        // Aturan B8: item hanya boleh diubah saat masih 'pending' -> 409 jika tidak.
        if (order.status !== OrderStatus.PENDING) {
          throw new ConflictException(`Item hanya dapat diubah saat status "pending" (saat ini "${order.status}")`);
        }
        await this.restoreStock(m, order.items); // kembalikan stok item lama
        await m.delete(OrderItem, { orderId: id }); // DELETE item lama
        const total = await this.addItems(m, id, dto.items); // INSERT item baru + kurangi stok
        await m.update(Order, id, { totalAmount: total }); // hitung ulang total
        order.items = await m.find(OrderItem, { where: { orderId: id } }); // simpan item terbaru untuk langkah berikutnya
      }

      // --- Bagian B: mengubah status ---
      if (dto.status && dto.status !== order.status) {
        // Aturan B9: hanya perpindahan yang ada di ORDER_STATUS_TRANSITIONS yang boleh -> 409 jika tidak.
        if (!ORDER_STATUS_TRANSITIONS[order.status].includes(dto.status)) {
          throw new ConflictException(`Status tidak dapat berubah dari "${order.status}" ke "${dto.status}"`);
        }
        // Dibatalkan -> stok barang dikembalikan.
        if (dto.status === OrderStatus.CANCELLED) {
          await this.restoreStock(m, order.items);
        }
        await m.update(Order, id, { status: dto.status }); // UPDATE orders SET status = ...
      }

      return this.load(m, id); // kembalikan data terbaru
    });
  }

  // ===== DELETE ===== (DELETE /orders/:id)
  /** Hanya pesanan `pending` atau `cancelled` yang boleh dihapus. Pesanan pending mengembalikan stok. */
  remove(id: number) {
    return this.dataSource.transaction(async (m) => {
      const order = await this.load(m, id); // 404 jika tidak ada
      // Aturan B10: pesanan yang sudah paid/shipped/completed tidak boleh dihapus -> 409.
      if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CANCELLED) {
        throw new ConflictException(`Pesanan berstatus "${order.status}" tidak dapat dihapus`);
      }
      // Pesanan 'pending' masih menahan stok -> kembalikan. ('cancelled' sudah dikembalikan saat dibatalkan.)
      if (order.status === OrderStatus.PENDING) await this.restoreStock(m, order.items);
      await m.delete(OrderItem, { orderId: id }); // hapus item dulu
      await m.delete(Order, id); // lalu hapus pesanannya
      return { message: `Pesanan #${id} dihapus` };
    });
  }

  // ===== HELPER (dipakai internal) =====

  // Memuat satu pesanan lengkap dengan relasinya; melempar 404 jika tidak ada.
  private async load(m: EntityManager, id: number) {
    const order = await m.findOne(Order, { where: { id }, relations: WITH_DETAIL });
    if (!order) throw new NotFoundException(`Pesanan #${id} tidak ditemukan`);
    return order;
  }

  /** Menyimpan item, mengurangi stok, dan mengembalikan total pesanan. */
  private async addItems(m: EntityManager, orderId: number, input: OrderItemInputDto[]) {
    // Aturan B6: gabungkan produk yang sama (mis. produk 1 qty 2 + produk 1 qty 1 = qty 3) agar pengecekan stok akurat.
    const qtyByProduct = new Map<number, number>();
    for (const { productId, quantity } of input) {
      qtyByProduct.set(productId, (qtyByProduct.get(productId) ?? 0) + quantity);
    }

    let total = 0;
    for (const [productId, quantity] of qtyByProduct) {
      // Produk harus ada -> 404 jika tidak. Harganya dipakai sebagai snapshot untuk item ini.
      const product = await m.findOneBy(Product, { id: productId });
      if (!product) throw new NotFoundException(`Produk #${productId} tidak ditemukan`);
      // Aturan B4: kurangi stok secara ATOMIK dengan satu perintah SQL
      //   UPDATE products SET stock = stock - qty WHERE id = ? AND stock >= qty
      // Jika dua pesanan masuk bersamaan, database memprosesnya satu per satu sehingga stok tidak bisa minus.
      const reserved = await m
        .createQueryBuilder()
        .update(Product)
        .set({ stock: () => 'stock - :qty' })
        .where('id = :id AND stock >= :qty', { id: productId, qty: quantity })
        .execute();
      // affected = 0 berarti tidak ada baris yang cocok -> stok tidak cukup -> 400 (dan transaksi di-rollback).
      if (!reserved.affected) {
        const current = await m.findOneByOrFail(Product, { id: productId });
        throw new BadRequestException(
          `Stok produk "${product.name}" tidak cukup (tersedia ${current.stock}, diminta ${quantity})`,
        );
      }
      // Aturan B5 & B7: salin harga produk saat ini ke item (unitPrice) dan hitung subtotal di server.
      const subtotal = round2(product.price * quantity);
      await m.save(
        m.create(OrderItem, { orderId, productId, quantity, unitPrice: product.price, subtotal }), // INSERT INTO order_items
      );
      total += subtotal;
    }
    return round2(total);
  }

  // Mengembalikan stok semua item ke tabel products (dipakai saat batal / hapus pesanan pending / ganti item).
  private async restoreStock(m: EntityManager, items: OrderItem[]) {
    for (const item of items) {
      // UPDATE products SET stock = stock + quantity WHERE id = ...
      await m.increment(Product, { id: item.productId }, 'stock', item.quantity);
    }
  }
}
