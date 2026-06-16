using Core.Utilities.Results.Abstract;

namespace Business.Repository.TaskMemberRepository
{
	public interface ITaskMemberService
	{
		IResult Add(List<int> userIds, int taskId);
		IResult DeleteByUserIdAndTaskId(int userId, int taskId);
		IResult DeleteAllByUserIdsAndTaskId(List<int> userIds, int taskId);
		IResult DeleteByTaskMemberId(int taskMemberId);
		IResult DeleteAllByTaskMemberIds(List<int> taskMemberIds);
		IDataResult<List<int>> GetAllIdByTaskId(int taskId);
	}
}
