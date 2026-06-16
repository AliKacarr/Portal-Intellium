using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.NoteRepository
{
    public class EfNoteDal : EfEntityRepositoryBase<Note, PortalContext>, INoteDal
    {
    }
}
