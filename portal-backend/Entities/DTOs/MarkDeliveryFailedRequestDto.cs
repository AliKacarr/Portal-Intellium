namespace Entities.DTOs
{
    /// <summary>POST /api/debit/mark-delivery-failed ve admin eşlemesi.</summary>
    public class MarkDeliveryFailedRequestDto
    {
        public int DebitId { get; set; }

        /// <summary>Alıcı tarafında opsiyonel gerekçe; admin tarafında genelde boş.</summary>
        public string? Note { get; set; }
    }
}
