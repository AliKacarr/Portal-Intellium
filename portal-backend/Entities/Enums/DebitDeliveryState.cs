namespace Entities.Enums
{
    /// <summary>
    /// Zimmet teslimat (handshake) durumu — veritabanında metin olarak saklanır.
    /// Sayısal eşleme (mock / raporlama): 0 ayrılmamış; 1 = Gönderildi; 2 = Teslim Edildi; 3 = Teslim Edilemedi.
    /// </summary>
    public enum DebitDeliveryState
    {
        Sent = 1,
        Delivered = 2,
        DeliveryFailed = 3
    }

    /// <summary>API ve DB ile uyumlu sabit stringler.</summary>
    public static class DebitStatusTexts
    {
        public const string Sent = "Gönderildi";
        public const string Delivered = "Teslim Edildi";
        public const string DeliveryFailed = "Teslim Edilemedi";
    }
}
