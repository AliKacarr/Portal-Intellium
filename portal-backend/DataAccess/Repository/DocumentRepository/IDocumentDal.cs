using Core.DataAccess;
using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataAccess.Repository.DocumentRepository
{
    public interface IDocumentDal : IEntityRepository<Document>
    {
        void AddDocument(Document document);
        void UpdateDocument(Document document);
        void DeleteDocument(int Id);
        List<Document> GetAllByUserId(long userId);
        Document GetById(int Id);
        List<Document> GetAll();
    }
}