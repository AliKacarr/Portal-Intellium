namespace Entities.DTOs.RequestDtos
{
    public class UpdateRequestDto
    {
        public int? CategoryId { get; set; }
        public int? SubCategoryId { get; set; }
        public string? OtherText { get; set; }
        public string? Description { get; set; }
        public string? PayloadJson { get; set; }
        public string? Note { get; set; }
        /// <summary>Opsiyonel: admin düzenleyip tekrar gönderme / sürece alma.</summary>
        public string? Status { get; set; }
    }
}

