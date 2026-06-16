using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.TaskCommentDtos;
using Entities.DTOs.UserDtos;

namespace DataAccess.Repository.TaskRepository
{
	public class EfTaskCommentDal : EfEntityRepositoryBase<TaskComment, PortalContext>, ITaskCommentDal
	{
		public List<TaskCommentDto> GetAllByTaskId(int taskId)
		{
			using (var context = new PortalContext())
			{
				var result = (from taskComment in context.TaskComments
							  where taskComment.TaskId == taskId
							  join user in context.Users on taskComment.UserId equals user.Id
							  orderby taskComment.CreatedDate descending
							  select new TaskCommentDto
							  {
								  Id = taskComment.Id,
								  User = new BaseUserDto
								  {
									  Id = user.Id,
									  Name = user.Name,
									  IsActive = user.IsActive,
									  ImageUrl = user.ImageUrl
								  },
								  Content = taskComment.Content,
								  CreatedDate = taskComment.CreatedDate,
							  }).ToList();
				return result;
			}
		}
	}
}
