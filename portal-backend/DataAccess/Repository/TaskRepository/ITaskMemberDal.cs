using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.UserDtos;

namespace DataAccess.Repository.TaskRepository
{
    public interface ITaskMemberDal : IEntityRepository<TaskMember>
    {
        List<UserDto> GetTaskMembersAsUserByBoardId(int boardId);
    }
}
