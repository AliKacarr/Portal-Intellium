using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs.DocumentDto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Repository.DocumentRepository
{
    public interface IDocumentService
    {

        IResult Add(DocumentDto documentDto);
        IResult Update(DocumentDto documentDto);
        IResult Delete(int Id);
        IDataResult<List<Document>> GetAllByUserId(long userId);
        IDataResult<Document> GetById(int Id);
        IDataResult<List<Document>> GetAll();
    }
}