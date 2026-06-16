using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Repository.LogRepository;
using Entities.Concrete.Logs;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository.LogRepositroy
{
	public class EfRequestUrlDal : EfEntityRepositoryBase<RequestUrl, PortalLogContext>, IRequestUrlDal
	{
		public long AddForUserActivity(RequestUrl requestUrl)
		{
			using var context = new PortalLogContext();
			var temp = context.Set<RequestUrl>().FirstOrDefault(url => url.Url == requestUrl.Url);
			if (temp != null)
			{
				return temp.Id;
			}
			else
			{
				var addedEntity = context.Entry(requestUrl);
				addedEntity.State = EntityState.Added;
				context.SaveChanges();
				temp = context.Set<RequestUrl>().FirstOrDefault(url => url.Url == requestUrl.Url);
				return temp.Id;
			}
		}
	}
}
