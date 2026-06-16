using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.AiTaskPreviewRepository
{
    public class EfAiTaskPreviewDal : EfEntityRepositoryBase<AiTaskPreview, PortalContext>, IAiTaskPreviewDal
    {
    }
}
