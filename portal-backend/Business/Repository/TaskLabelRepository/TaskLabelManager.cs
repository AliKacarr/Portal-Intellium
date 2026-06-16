using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.TaskRepository;
using Entities.Concrete;
using Microsoft.IdentityModel.Tokens;

namespace Business.Repository.TaskLabelRepository
{
	public class TaskLabelManager : ITaskLabelService
	{

		private readonly ITaskLabelDal _taskLabelDal;
		private readonly ITaskDal _taskDal;

		public TaskLabelManager(ITaskLabelDal taskLabelDal, ITaskDal taskDal)
		{
			_taskLabelDal = taskLabelDal;
			_taskDal = taskDal;
		}

		public IResult Add(List<int> labelIds, int taskId)
		{
			if (_taskDal.Get(t => t.Id.Equals(taskId)) is null) return new ErrorResult();

			foreach (var labelId in labelIds)
			{
				var result = _taskLabelDal.Get(label => label.LabelId.Equals(labelId) && label.TaskId.Equals(taskId));
				if (result == null)
				{
					TaskLabel taskLabel = new()
					{
						LabelId = labelId,
						TaskId = taskId
					};
					_taskLabelDal.Add(taskLabel);
				}
			}
			return new SuccessResult();
		}

		public IResult DeleteByLabelIdAndTaskId(int labelId, int taskId)
		{
			var result = _taskLabelDal.Get(p => p.LabelId.Equals(labelId) && p.TaskId.Equals(taskId));
			if (result == null) return new ErrorResult();

			_taskLabelDal.Delete(result);

			return new SuccessResult();
		}
		public IResult DeleteAllByLabelIdsAndTaskId(List<int> labelIds, int taskId)
		{
			if (labelIds.IsNullOrEmpty()) return new ErrorResult();
			foreach (var labelId in labelIds)
			{
				DeleteByLabelIdAndTaskId(labelId, taskId);
			}
			return new SuccessResult();
		}

		public IResult DeleteByTaskLabelId(int taskLabelId)
		{
			var result = _taskLabelDal.Get(p => p.Id.Equals(taskLabelId));
			if (result == null) return new ErrorResult();

			_taskLabelDal.Delete(result);

			return new SuccessResult();
		}

		public IResult DeleteAllByTaskLabelIds(List<int> taskLabelIds)
		{
			if (taskLabelIds.IsNullOrEmpty()) return new ErrorResult();
			foreach (var taskLabelId in taskLabelIds)
			{
				DeleteByTaskLabelId(taskLabelId);
			}
			return new SuccessResult();
		}

		public IDataResult<List<int>> GetAllIdByTaskId(int taskId)
		{
			var result = _taskLabelDal.GetAll(p => p.TaskId.Equals(taskId)).Select(p => p.Id).ToList();
			return new SuccessDataResult<List<int>>(result);
		}


	}
}
