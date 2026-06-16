using Entities.DTOs.CvUserImportDtos;

namespace Business.Repository.CvUserImportRepository
{
    public interface ICvParserClient
    {
        Task<CvCandidateDto> ParseAsync(string absoluteFilePath, string fileName, string contentType, CancellationToken cancellationToken);
    }
}
