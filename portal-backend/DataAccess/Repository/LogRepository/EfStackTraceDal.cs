using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Repository.LogRepository;
using Entities.Concrete.Logs;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository.LogRepositroy
{
	public class EfStackTraceDal : EfEntityRepositoryBase<StackTrace, PortalLogContext>, IStackTraceDal
	{
		public long AddForError(StackTrace stackTrace)
		{
			using var context = new PortalLogContext();
			var temp = context.Set<StackTrace>().Select(x => new { x.Id, x.STHash }).FirstOrDefault(hash => hash.STHash == stackTrace.STHash);
			if (temp != null)
			{
				return temp.Id;
			}
			else
			{
				var addedEntity = context.Entry(stackTrace);
				addedEntity.State = EntityState.Added;
				context.SaveChanges();
				temp = context.Set<StackTrace>().Select(x => new { x.Id, x.STHash }).FirstOrDefault(hash => hash.STHash == stackTrace.STHash);
				return temp.Id;
			}
		}
	}
}
