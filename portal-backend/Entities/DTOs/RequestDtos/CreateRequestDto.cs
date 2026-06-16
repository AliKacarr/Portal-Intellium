namespace Entities.DTOs.RequestDtos
{
    public class CreateRequestDto
    {
        public int CategoryId { get; set; }
        public int SubCategoryId { get; set; }
        public string? OtherText { get; set; }
        public string? Description { get; set; }
        public string? PayloadJson { get; set; }

        /// <summary>
        /// true => Taslak, false => Gönderildi
        /// </summary>
        public bool SaveAsDraft { get; set; } = true;
    }
}

