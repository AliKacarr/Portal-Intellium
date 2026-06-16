/**
 * Zimmet teslimat (handshake) — backend ile aynı string değerler.
 * Sayısal eşleme (yorum): 0 ayrılmamış; 1 = Sent; 2 = Delivered; 3 = DeliveryFailed.
 * API: POST confirm-delivery, mark-delivered; handshake/reject, handshake/reject-admin
 */
export const DEBIT_STATUS = {
  SENT: "Gönderildi",
  DELIVERED: "Teslim Edildi",
  DELIVERY_FAILED: "Teslim Edilemedi",
};

export const isDebitSent = (s) => String(s ?? "").trim() === DEBIT_STATUS.SENT;
export const isDebitDelivered = (s) => String(s ?? "").trim() === DEBIT_STATUS.DELIVERED;
export const isDebitDeliveryFailed = (s) => String(s ?? "").trim() === DEBIT_STATUS.DELIVERY_FAILED;
