using Core.DataAccess.EntityFramework;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Concrete.EntityFramework.Context;
using DataAccess.Repository.LogRepository;
using Entities.Concrete.Logs;
using Entities.DTOs.LogDtos;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace DataAccess.Repository.LogRepositroy
{
	public class EfErrorDal : EfEntityRepositoryBase<Error, PortalLogContext>, IErrorDal
	{
		public List<ErrorDto> GetAllForDTO(Expression<Func<Error, bool>>? filter = null)
		{
			using var context = new PortalLogContext();
			if (filter != null)
			{
				var errors = context.Set<Error>().Where(filter).ToList();
				if (errors.Any())
				{
					var list = new List<ErrorDto>();
					errors.ForEach(e =>
					{
						var errordto = new ErrorDto();
						errordto.Id = e.Id;
						if (e.TypeId != 0) { errordto.Type = context.Set<ErrorType>().FirstOrDefault(et => et.Id == e.TypeId).Type; }
						if (e.MessageId != 0) { errordto.Message = context.Set<ErrorMessage>().FirstOrDefault(mes => mes.Id == e.MessageId).Message; }
						errordto.ActivityId = e.ActivityId;
						errordto.StackTraceId = e.StackTraceId;
						list.Add(errordto);
					});
					return list;

				}
				else
				{
					return new List<ErrorDto>();
				}
			}
			else
			{
				var errors = context.Set<Error>().ToList();

				if (errors.Any())
				{
					var list = new List<ErrorDto>();
					errors.ForEach(e =>
					{
						var errordto = new ErrorDto();
						errordto.Id = e.Id;
						if (e.TypeId != 0) { errordto.Type = context.Set<ErrorType>().FirstOrDefault(et => et.Id == e.TypeId).Type; }
						if (e.MessageId != 0) { errordto.Message = context.Set<ErrorMessage>().FirstOrDefault(mes => mes.Id == e.MessageId).Message; }
						errordto.ActivityId = e.ActivityId;
						errordto.StackTraceId = e.StackTraceId;
						list.Add(errordto);
					});
					return list;

				}
				else
				{
					return new List<ErrorDto>();
				}
			}
		}

		public async Task<IResult> GetFilteredErrorsAsync(ErrorFilterDto filterDto)
		{
			using var logContext = new PortalLogContext();
			var errorsQuery = from error in logContext.Errors
							  join errorType in logContext.ErrorTypes
								  on error.TypeId equals errorType.Id
							  join errorMessage in logContext.ErrorMessages on error.MessageId equals errorMessage.Id
							  select new ErrorDto
							  {
								  Id = error.Id,
								  ActivityId = error.ActivityId,
								  StackTraceId = error.StackTraceId,
								  Type = errorType.Type,
								  Message = errorMessage.Message!
							  };

			if (!string.IsNullOrEmpty(filterDto.Type))
			{
				errorsQuery = errorsQuery.Where(e => e.Type.ToLower().Contains(filterDto.Type.ToLower()));
			}

			int totalCount = await errorsQuery.CountAsync();

			var errors = await errorsQuery
				.Skip((filterDto.Page - 1) * filterDto.Limit)
				.Take(filterDto.Limit)
				.ToListAsync();



			return errors.Any()
				? new PaginatedResult<List<ErrorDto>>(errors, true)
				{
					PageNumber = filterDto.Page,
					PageSize = filterDto.Limit,
					TotalCount = totalCount
				}
				: new ErrorResult("Kayıt bulunamadı.");
		}
		public ErrorDto GetForDTO(Expression<Func<Error, bool>>? filter)
		{
			using var context = new PortalContext();
			var e = context.Set<Error>().FirstOrDefault(filter);
			if (e != null)
			{
				var errordto = new ErrorDto();
				errordto.Id = e.Id;
				if (e.TypeId != 0) { errordto.Type = context.Set<ErrorType>().FirstOrDefault(et => et.Id == e.TypeId).Type; }
				if (e.MessageId != 0) { errordto.Message = context.Set<ErrorMessage>().FirstOrDefault(mes => mes.Id == e.MessageId).Message; }
				errordto.ActivityId = e.ActivityId;
				errordto.StackTraceId = e.StackTraceId;
				return errordto;

			}
			else
			{
				return new ErrorDto();
			}
		}
	}
}
