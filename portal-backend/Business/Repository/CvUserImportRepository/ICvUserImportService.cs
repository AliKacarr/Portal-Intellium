using Core.Utilities.Results.Abstract;
using Entities.DTOs.CvUserImportDtos;
using Microsoft.AspNetCore.Http;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.Repository.CvUserImportRepository
{
    public interface ICvUserImportService
    {
        Task<IDataResult<CvUserImportBatchDto>> UploadAsync(IFormFileCollection files);
        IDataResult<CvUserImportBatchDto> GetBatch(long batchId);
        IDataResult<List<CvUserImportItemDto>> GetMine();
        Task<IDataResult<bool>> ProcessNextPendingAsync(CancellationToken cancellationToken);
        Task<IDataResult<CreateUsersFromCvImportResultDto>> CreateUsersAsync(CreateUsersFromCvImportDto createUsersDto);
        IResult DeleteItems(DeleteCvUserImportItemsDto deleteItemsDto);
    }
}
