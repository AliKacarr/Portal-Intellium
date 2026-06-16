using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Microsoft.AspNetCore.Http;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.Repository.TaskAttachmentRepository
{
    public interface ITaskAttachmentService
    {
        Task<IResult> Add(List<IFormFile> taskAttachments, int taskId);
        IResult Delete(int taskAttachmentId);
        IResult DeleteAll(List<int> taskAttachmentIds);
        IDataResult<List<TaskAttachment>> GetAllByTaskId(int taskId);
        IDataResult<List<int>> GetAllIdByTaskId(int taskId);
    }
}
