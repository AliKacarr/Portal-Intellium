using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Repository.LogRepository;
using Entities.Concrete.Logs;
using Microsoft.EntityFrameworkCore;

namespace DataAccess.Repository.LogRepositroy
{
	public class EfErrorMessageDal : EfEntityRepositoryBase<ErrorMessage, PortalLogContext>, IErrorMessageDal
	{
		public long AddForError(ErrorMessage errorMessage)
		{
			using var context = new PortalLogContext();
			var temp = context.Set<ErrorMessage>().FirstOrDefault(message => message.Message == errorMessage.Message);
			if (temp != null)
			{
				return temp.Id;
			}
			else
			{
				var addedEntity = context.Entry(errorMessage);
				addedEntity.State = EntityState.Added;
				context.SaveChanges();
				temp = context.Set<ErrorMessage>().FirstOrDefault(message => message.Message == errorMessage.Message);
				return temp.Id;
			}
		}
	}
}
