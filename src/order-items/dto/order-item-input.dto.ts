import { IsInt, Min } from 'class-validator';

/**
 * Satu baris item pada saat membuat / mengubah pesanan.
 * Klien hanya mengirim produk & jumlah; harga, subtotal, dan total dihitung SERVER agar tidak bisa dimanipulasi.
 */
export class OrderItemInputDto {
  @IsInt()
  productId: number; // produk yang dipesan (dicek ada atau tidak di OrdersService.addItems)

  @IsInt()
  @Min(1) // minimal beli 1
  quantity: number;
}
