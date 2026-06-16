using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.NoteShareRepository
{
    public class EfNoteShareDal : EfEntityRepositoryBase<NoteShare, PortalContext>, INoteShareDal
    {
    }
}
