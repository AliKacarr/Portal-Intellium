namespace Entities.DTOs
{
    public class DebitRequestDto 
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; }
        public int? ProductId { get; set; }
        public string? ProductLabel { get; set; }
        public string? ProductStatus { get; set; }
        public string? RequestedCategory { get; set; }
        public string? RequestedBrand { get; set; }
        public string? RequestedModel { get; set; }
        // Sadece admin ekranında gösterilecek uyarılar (kullanıcı ekranında kullanmayın)
        public string? AdminWarning { get; set; }
        public string Category { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public DateTime RequestDate { get; set; }
        public string RequestKind { get; set; } = "Assignment";
        public int? RelatedDebitId { get; set; }
    }
}