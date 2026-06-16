using Core.Utilities.Results.Abstract;
using Entities.DTOs.AgreementDtos;
using System.Collections.Generic;

namespace Business.Repository.AgreementRepository
{
    public interface IAgreementService
    {
        IDataResult<List<AgreementDto>> GetActive();
        IDataResult<List<AgreementDto>> GetHistory();
        IDataResult<AgreementDto> AddVersion(CreateAgreementDto agreementDto);
        IResult AcceptActiveAgreements(long userId, List<long> agreementIds, bool requireAllActive = false);
        IDataResult<bool> RequiresAgreementUpdate(long userId);
        IDataResult<List<long>> GetRequiredAgreementIds(long userId);
    }
}
