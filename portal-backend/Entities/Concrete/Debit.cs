
namespace Entities.Concrete
{
    public class Debit 
    {
        public int Id { get; set; }
        public int ProductId { get; set; } // Artık ürün özelliklerini buradan çekeceğiz
        public long ReceiverUserId { get; set; }
        public long DeliveredUserId { get; set; }
        public DateTime DeliveryDate { get; set; }
        public string? Status { get; set; } = "Zimmetli"; 
        public byte[]? PdfFile { get; set; }
        public string? Description { get; set; }
    }
}