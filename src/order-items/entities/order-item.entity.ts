import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { moneyColumn } from '../../common/money.js';
import { Order } from '../../orders/entities/order.entity.js';
import { Product } from '../../products/entities/product.entity.js';

/**
 * Tabel `order_items` = TABEL PENGHUBUNG (junction table) antara `orders` dan `products`.
 * Relasi many-to-many "satu pesanan berisi banyak produk, satu produk ada di banyak pesanan"
 * dipecah menjadi dua relasi one-to-many lewat tabel ini. Tabel ini juga membawa data sendiri:
 * quantity, unitPrice, dan subtotal.
 */
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  // FOREIGN KEY -> orders.id
  @Column()
  orderId: number;

  // BANYAK item milik SATU pesanan.
  // CASCADE -> kalau pesanan dihapus, semua item-nya ikut terhapus otomatis oleh database.
  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'orderId' })
  order: Relation<Order>;

  // FOREIGN KEY -> products.id
  @Column()
  productId: number;

  // BANYAK item merujuk ke SATU produk.
  // RESTRICT -> produk yang pernah dipesan TIDAK bisa dihapus (riwayat pesanan harus tetap utuh).
  @ManyToOne(() => Product, (product) => product.orderItems, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'productId' })
  product: Relation<Product>;

  // Jumlah yang dibeli (minimal 1, divalidasi di DTO).
  @Column({ type: 'integer' })
  quantity: number;

  /** Harga satuan produk pada saat transaksi (snapshot, tidak berubah walau harga produk berubah). */
  @Column(moneyColumn)
  unitPrice: number;

  // unitPrice x quantity, dihitung server.
  @Column(moneyColumn)
  subtotal: number;
}
