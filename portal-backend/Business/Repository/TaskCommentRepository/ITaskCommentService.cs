using Core.Utilities.Results.Abstract;
using Entities.DTOs.TaskCommentDtos;

namespace Business.Repository.TaskCommentRepository
{
    public interface ITaskCommentService
    {
        IResult Add(AddTaskCommentDto taskCommentDto);

        IResult Delete(int taskCommentId);

        IResult DeleteAll(List<TaskCommentDto> taskComments);

        IDataResult<List<TaskCommentDto>> GetAllByTaskId(int taskId);

    }
}
