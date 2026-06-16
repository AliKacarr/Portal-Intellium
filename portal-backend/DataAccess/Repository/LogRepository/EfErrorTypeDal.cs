using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Repository.LogRepository;
using Entities.Concrete.Logs;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository.LogRepositroy
{
	public class EfErrorTypeDal : EfEntityRepositoryBase<ErrorType, PortalLogContext>, IErrorTypeDal
	{
		public long AddForError(ErrorType errorType)
		{
			using var context = new PortalLogContext();
			var temp = context.Set<ErrorType>().FirstOrDefault(type => type.Type == errorType.Type);
			if (temp != null)
			{
				return temp.Id;
			}
			else
			{
				var addedEntity = context.Entry(errorType);
				addedEntity.State = EntityState.Added;
				context.SaveChanges();
				temp = context.Set<ErrorType>().FirstOrDefault(type => type.Type == errorType.Type);
				return temp.Id;
			}
		}
	}
}
