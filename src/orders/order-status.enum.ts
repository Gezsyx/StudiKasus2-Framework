/** Daftar status yang valid untuk sebuah pesanan. */
export enum OrderStatus {
  PENDING = 'pending', // baru dibuat, belum dibayar
  PAID = 'paid', // sudah dibayar
  SHIPPED = 'shipped', // sedang dikirim
  COMPLETED = 'completed', // selesai
  CANCELLED = 'cancelled', // dibatalkan (stok dikembalikan)
}

/**
 * Aturan transisi status: kunci = status sekarang, nilai = status tujuan yang BOLEH.
 * Dipakai di OrdersService.update(). Perpindahan di luar daftar ini ditolak dengan HTTP 409.
 *
 *   pending -> paid -> shipped -> completed
 *      \         \
 *       +---------+--> cancelled
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [], // status akhir
  [OrderStatus.CANCELLED]: [], // status akhir
};
