namespace Entities.DTOs
{
    public class DebitDetailDto 
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        
        // Ürün Özeti
        public string Category { get; set; }
        public string ProductInfo { get; set; } // Marka + Model birleşimi (Örn: BMW 3.20i)
        public string SerialNumber { get; set; }
        
        // Teknik Detaylar (İstersek frontend'de açıp gösterebiliriz)
        public string TechnicalSpecs { get; set; } 

        // Personel Bilgileri
        public long ReceiverUserId { get; set; }
        public long DeliveredUserId { get; set; }
        
        public DateTime DeliveryDate { get; set; }
        public string Status { get; set; }
        public string PdfPath { get; set; }
    }
}