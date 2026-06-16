using Core.Utilities.Results.Abstract;
using Entities.DTOs;
using Microsoft.AspNetCore.Http;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.File
{
    public interface IFileService
    {
        Task<IDataResult<FileDto>> Save(IFormFile file, string fileType);
        IResult Delete(string filePath, string fileType);
        IDataResult<string> GetFileAsBase64(string filePath);
    }
}
