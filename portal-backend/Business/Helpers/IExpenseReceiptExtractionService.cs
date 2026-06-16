using Core.Utilities.Results.Abstract;
using Entities.DTOs.ExpenseDto;

namespace Business.Helpers
{
    public interface IExpenseReceiptExtractionService
    {
        Task<IDataResult<ExpenseReceiptExtractionResultDto>> ExtractAsync(byte[] imageBytes, string? contentType, CancellationToken cancellationToken = default);
    }
}
