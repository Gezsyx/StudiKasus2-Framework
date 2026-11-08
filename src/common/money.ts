import type { ColumnOptions } from 'typeorm';

/**
 * Pengaturan kolom untuk UANG, dipakai ulang di kolom price, unitPrice, subtotal, totalAmount.
 *
 * - Tipe `numeric(12,2)`: maksimal 12 digit dengan 2 angka di belakang koma. Berbeda dengan float,
 *   hasil hitung uang tetap tepat (tidak ada 0.1 + 0.2 = 0.30000000000000004).
 * - PostgreSQL mengembalikan `numeric` sebagai STRING ("150000.00"), jadi `transformer.from`
 *   mengubahnya kembali menjadi number saat dibaca dari database.
 */
export const moneyColumn: ColumnOptions = {
  type: 'numeric',
  precision: 12,
  scale: 2,
  transformer: {
    to: (value?: number | null) => value, // aplikasi -> database: tidak diubah
    from: (value?: string | number | null) => (value === null || value === undefined ? value : Number(value)), // database -> aplikasi
  },
};
