using Entities.DTOs.ExpenseDto;
using Microsoft.AspNetCore.Http;

namespace Business.ReceiptVision
{
    public interface IReceiptVisionService
    {
        Task<ReceiptExtractionResultDto> AnalyzeAsync(IFormFile file, CancellationToken cancellationToken = default);

        Task<ReceiptExtractionResultDto> AnalyzeAsync(byte[] imageBytes, string? contentType, CancellationToken cancellationToken = default);
    }
}
