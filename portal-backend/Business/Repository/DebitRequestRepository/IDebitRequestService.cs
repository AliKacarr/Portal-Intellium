using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs;
using System.Collections.Generic;

namespace Business.Repository.DebitRequestRepository
{
    public interface IDebitRequestService
    {
        IResult Add(DebitRequest debitRequest);
        IResult Update(DebitRequest debitRequest);
        
        IDataResult<DebitRequest> GetById(int id);
        IDataResult<List<DebitRequestDto>> GetAllDto();
        IResult Reject(int id);
        IResult Complete(int id);

        /// <summary>Zimmet teslim alındığında ilişkili atama talebinin statüsünü günceller.</summary>
        IResult MarkAssignmentRequestDelivered(long receiverUserId, int productId);
    }
}