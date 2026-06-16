using System.Text.Json.Serialization;

namespace Entities.DTOs.ExpenseDto
{
    public class ExpenseReceiptExtractRequestDto
    {
        /// <summary>Varsayılan JSON: imageBase64 (camelCase).</summary>
        public string? ImageBase64 { get; set; }

        /// <summary>Alternatif: image_base64 (snake_case).</summary>
        [JsonPropertyName("image_base64")]
        public string? ImageBase64Snake { get; set; }

        /// <summary>Eski / alternatif isim.</summary>
        [JsonPropertyName("imageData")]
        public string? ImageData { get; set; }

        public string? ContentType { get; set; }

        [JsonPropertyName("content_type")]
        public string? ContentTypeSnake { get; set; }

        public string? ResolveImageBase64()
        {
            if (!string.IsNullOrWhiteSpace(ImageBase64)) return ImageBase64;
            if (!string.IsNullOrWhiteSpace(ImageBase64Snake)) return ImageBase64Snake;
            return ImageData;
        }

        public string? ResolveContentType() =>
            !string.IsNullOrWhiteSpace(ContentType) ? ContentType : ContentTypeSnake;
    }

    public class ExpenseReceiptExtractBulkRequestDto
    {
        public List<ExpenseReceiptExtractRequestDto> Images { get; set; } = new();
    }
}
