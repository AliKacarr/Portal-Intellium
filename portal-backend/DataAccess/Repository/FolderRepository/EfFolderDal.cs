using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.FolderRepository
{
    public class EfFolderDal : EfEntityRepositoryBase<Folder, PortalContext>, IFolderDal
    {
    }
}
