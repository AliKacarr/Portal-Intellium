using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.TaskCommentDtos;

namespace DataAccess.Repository.TaskRepository
{
    public interface ITaskCommentDal : IEntityRepository<TaskComment>
    {
        List<TaskCommentDto> GetAllByTaskId(int taskId);
    }
}
