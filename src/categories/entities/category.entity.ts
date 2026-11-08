import { Column, Entity, OneToMany, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { Product } from '../../products/entities/product.entity.js';

/**
 * ENTITY = representasi satu TABEL database sebagai class TypeScript.
 * Satu object `Category` = satu baris di tabel `categories`.
 */
@Entity('categories') // nama tabel di database
export class Category {
  // PRIMARY KEY, auto-increment (1, 2, 3, ...)
  @PrimaryGeneratedColumn()
  id: number;

  // Kolom teks wajib diisi (NOT NULL) dan UNIK -> dua kategori tidak boleh bernama sama.
  @Column({ unique: true })
  name: string;

  // Kolom teks panjang, boleh kosong (NULL).
  @Column({ type: 'text', nullable: true })
  description: string | null;

  // RELASI one-to-many: SATU kategori punya BANYAK produk.
  // Ini sisi "satu" dan TIDAK membuat kolom di tabel categories; foreign key-nya ada di tabel products (categoryId).
  // `Relation<>` dipakai agar tidak error "circular import" karena Product juga mengimpor Category (mode ESM).
  @OneToMany(() => Product, (product) => product.category)
  products: Relation<Product[]>;
}
