using Core.Utilities.Results.Abstract;

namespace Business.Repository.TaskLabelRepository
{
	public interface ITaskLabelService
	{
		IResult Add(List<int> labelIds, int taskId);

		IResult DeleteByLabelIdAndTaskId(int labelId, int taskId);
		IResult DeleteAllByLabelIdsAndTaskId(List<int> labelIds, int taskId);
		IResult DeleteByTaskLabelId(int taskLabelId);
		IResult DeleteAllByTaskLabelIds(List<int> taskLabelIds);
		IDataResult<List<int>> GetAllIdByTaskId(int taskId);
	}
}
