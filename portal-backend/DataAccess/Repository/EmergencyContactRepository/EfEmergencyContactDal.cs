using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;

namespace DataAccess.Repository.EmergencyContactRepository
{
    public class EfEmergencyContactDal : EfEntityRepositoryBase<EmergencyContact, PortalContext>, IEmergencyContactDal
    {
    }
}
