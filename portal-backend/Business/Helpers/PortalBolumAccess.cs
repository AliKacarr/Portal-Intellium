using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Helpers;

namespace Business.Helpers
{
    public static class PortalBolumAccess
    {
        public static bool UserCanSeeContent(
            long userId,
            bool isGeneral,
            long? departmentId,
            string? departmentName,
            string? serviceArea)
        {
            using var context = new PortalContext();
            var scope = PortalBolumScope.Resolve(context, userId);
            return scope.CanSee(isGeneral, departmentId, departmentName, serviceArea);
        }

        public static bool UserCanSeePoll(
            long userId,
            bool isGeneral,
            long? departmentId,
            string? departmentName)
        {
            using var context = new PortalContext();
            var scope = PortalBolumScope.Resolve(context, userId);
            return scope.CanSeePoll(isGeneral, departmentId, departmentName);
        }
    }
}
