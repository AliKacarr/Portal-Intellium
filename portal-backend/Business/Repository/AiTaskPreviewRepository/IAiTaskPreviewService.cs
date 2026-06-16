using Core.Utilities.Results.Abstract;
using Entities.DTOs.AiTaskPreviewDtos;

namespace Business.Repository.AiTaskPreviewRepository
{
    public interface IAiTaskPreviewService
    {
        IResult Import(ImportAiTaskPreviewsDto importAiTaskPreviewsDto);
        IDataResult<List<AiTaskPreviewDto>> GetMine();
        IResult Update(UpdateAiTaskPreviewDto updateAiTaskPreviewDto);
        IResult Approve(ApproveAiTaskPreviewsDto approveAiTaskPreviewsDto);
        IResult Reject(RejectAiTaskPreviewsDto rejectAiTaskPreviewsDto);
    }
}
