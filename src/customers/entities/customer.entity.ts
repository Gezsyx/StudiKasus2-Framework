import { Column, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { Order } from '../../orders/entities/order.entity.js';

/** Tabel `customers`: pelanggan toko. */
@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // UNIK: satu email hanya boleh dipakai satu pelanggan.
  @Column({ unique: true })
  email: string;

  // Boleh kosong (NULL).
  @Column({ type: 'varchar', nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  // RELASI one-to-many: SATU pelanggan dapat memiliki BANYAK pesanan.
  // Foreign key-nya ada di tabel orders (customerId).
  @OneToMany(() => Order, (order) => order.customer)
  orders: Relation<Order[]>;
}
