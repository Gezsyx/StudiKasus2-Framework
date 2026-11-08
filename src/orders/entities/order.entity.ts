import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';
import { moneyColumn } from '../../common/money.js';
import { Customer } from '../../customers/entities/customer.entity.js';
import { OrderItem } from '../../order-items/entities/order-item.entity.js';
import { OrderStatus } from '../order-status.enum.js';

/** Tabel `orders`: "kepala" pesanan (siapa yang memesan, status, total). Isi barangnya ada di `order_items`. */
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  // FOREIGN KEY -> customers.id (siapa yang memesan).
  @Column()
  customerId: number;

  // RELASI many-to-one: BANYAK pesanan milik SATU pelanggan.
  // RESTRICT -> pelanggan tidak bisa dihapus selama masih punya pesanan.
  @ManyToOne(() => Customer, (customer) => customer.orders, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'customerId' })
  customer: Relation<Customer>;

  // Status pesanan (pending/paid/shipped/completed/cancelled). Aturan perpindahan status ada di order-status.enum.ts.
  @Column({ type: 'varchar', default: OrderStatus.PENDING })
  status: OrderStatus;

  // Total harga seluruh item. Dihitung SERVER (bukan dikirim klien) di OrdersService.addItems().
  @Column({ ...moneyColumn, default: 0 })
  totalAmount: number;

  // Diisi otomatis saat baris dibuat.
  @CreateDateColumn()
  createdAt: Date;

  // Diisi otomatis setiap kali baris diubah.
  @UpdateDateColumn()
  updatedAt: Date;

  // RELASI one-to-many: SATU pesanan memiliki BANYAK detail item.
  @OneToMany(() => OrderItem, (item) => item.order)
  items: Relation<OrderItem[]>;
}
