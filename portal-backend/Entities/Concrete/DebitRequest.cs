namespace Entities.Concrete
{
    public class DebitRequest 
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        // Yeni akış: Talep edilen ürün (stok kontrolü ProductId üzerinden yapılır)
        public int? ProductId { get; set; }
        // Envanterde hiç yoksa kullanıcı yeni ürün talep edebilir
        public string? RequestedCategory { get; set; }
        public string? RequestedBrand { get; set; }
        public string? RequestedModel { get; set; }
        public string Category { get; set; }
        public string Description { get; set; }
        public string Status { get; set; } = "Bekliyor";
        public DateTime RequestDate { get; set; } = DateTime.Now;
        /// <summary>Assignment: normal zimmet talebi; Return: kullanıcı iade talebi.</summary>
        public string RequestKind { get; set; } = "Assignment";
        /// <summary>RequestKind Return iken hangi zimmet kaydının iade edileceği.</summary>
        public int? RelatedDebitId { get; set; }
    }
}