import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity.js';
import { moneyColumn } from '../../common/money.js';
import { OrderItem } from '../../order-items/entities/order-item.entity.js';

/** Tabel `products`: barang yang dijual toko. */
@Entity('products')
export class Product {
  // PRIMARY KEY, auto-increment.
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Harga SAAT INI. Tipe numeric(12,2) (lihat common/money.ts). Harga yang berlaku saat transaksi
  // disalin ke order_items.unitPrice, jadi mengubah harga di sini tidak mengubah pesanan lama.
  @Column(moneyColumn)
  price: number;

  // Jumlah stok. Berkurang saat ada pesanan, bertambah saat pesanan dibatalkan/dihapus.
  @Column({ type: 'integer', default: 0 })
  stock: number;

  // FOREIGN KEY (kolom nyata di tabel products) -> categories.id.
  // Kolom ini ditulis eksplisit supaya mudah dipakai untuk filter, mis. WHERE categoryId = 1.
  @Column()
  categoryId: number;

  // RELASI many-to-one: BANYAK produk milik SATU kategori. Inilah sisi yang memegang foreign key.
  // onDelete: 'RESTRICT' -> kategori TIDAK bisa dihapus selama masih punya produk (integritas data dijaga database).
  // nullable: false      -> produk wajib punya kategori.
  @ManyToOne(() => Category, (category) => category.products, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'categoryId' }) // hubungkan relasi ini dengan kolom categoryId di atas
  category: Relation<Category>;

  // RELASI one-to-many: SATU produk dapat muncul di BANYAK detail pesanan (order_items).
  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems: Relation<OrderItem[]>;
}
