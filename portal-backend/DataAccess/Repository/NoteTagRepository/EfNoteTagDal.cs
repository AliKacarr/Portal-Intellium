using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.NoteTagRepository
{
    public class EfNoteTagDal : EfEntityRepositoryBase<NoteTag, PortalContext>, INoteTagDal
    {
    }
}
