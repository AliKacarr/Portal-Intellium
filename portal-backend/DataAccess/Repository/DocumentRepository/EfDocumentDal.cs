using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Repository.DocumentRepository;
using Entities.Concrete;
using System.Collections.Generic;
using System.Linq;

namespace DataAccess.Repository.DocumentRepository
{
    public class EfDocumentDal : EfEntityRepositoryBase<Document, PortalContext>, IDocumentDal
    {

        public void AddDocument(Document document)
        {
            using (var context = new PortalContext())
            {
                context.Documents.Add(document);
                context.SaveChanges();
            }
        }

        public void UpdateDocument(Document document)
        {

            using (var context = new PortalContext())
            {
                context.Documents.Update(document);
                context.SaveChanges();
            }

        }

        public void DeleteDocument(int Id)
        {

            using (var context = new PortalContext())
            {
                var document = context.Documents.FirstOrDefault(d => d.Id == Id);
                if (document != null)
                {
                    document.IsActive = false;
                    context.SaveChanges();
                }
            }

        }

        public List<Document> GetAllByUserId(long userId)
        {

            using (var context = new PortalContext())
            {
                return context.Documents.Where(d => d.UserId == userId && d.IsActive).ToList();
            }

        }

        public Document GetById(int Id)
        {

            using (var context = new PortalContext())

            {

                return context.Documents.FirstOrDefault(d => d.Id == Id && d.IsActive);

            }

        }

        public List<Document> GetAll()
        {
            using (var context = new PortalContext())

            {
                return context.Documents.ToList();
            }
        }
    }
}