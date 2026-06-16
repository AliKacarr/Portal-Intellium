using Business.BusinessAspects;
using Business.Repository.AiTaskPreviewRepository.Constants;
using Business.Repository.TaskRepository;
using Business.Repository.UserRepository;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.AiTaskPreviewRepository;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.TaskListRepository;
using Entities.Concrete;
using Entities.DTOs.AiTaskPreviewDtos;
using Entities.DTOs.TaskDtos;

namespace Business.Repository.AiTaskPreviewRepository
{
    public class AiTaskPreviewManager : IAiTaskPreviewService
    {
        private readonly IAiTaskPreviewDal _aiTaskPreviewDal;
        private readonly IUserService _userService;
        private readonly ITaskListDal _taskListDal;
        private readonly IBoardDal _boardDal;
        private readonly ITaskService _taskService;
        private readonly IUserContext _userContext;

        public AiTaskPreviewManager(
            IAiTaskPreviewDal aiTaskPreviewDal,
            IUserService userService,
            ITaskListDal taskListDal,
            IBoardDal boardDal,
            ITaskService taskService,
            IUserContext userContext)
        {
            _aiTaskPreviewDal = aiTaskPreviewDal;
            _userService = userService;
            _taskListDal = taskListDal;
            _boardDal = boardDal;
            _taskService = taskService;
            _userContext = userContext;
        }

        public IResult Import(ImportAiTaskPreviewsDto importAiTaskPreviewsDto)
        {
            if (string.IsNullOrWhiteSpace(importAiTaskPreviewsDto.Email))
                return new ErrorResult(AiTaskPreviewMessages.UserNotFound);

            if (importAiTaskPreviewsDto.Items == null || !importAiTaskPreviewsDto.Items.Any())
                return new ErrorResult(AiTaskPreviewMessages.EmptyPreviewList);

            var user = _userService.GetByMail(importAiTaskPreviewsDto.Email.Trim());
            if (user == null)
                return new ErrorResult(AiTaskPreviewMessages.UserNotFound);

            if (importAiTaskPreviewsDto.Items.Any(item => !TryGetAccessibleTaskList(user.Id, item.TaskListId, out _)))
                return new ErrorResult(AiTaskPreviewMessages.InvalidTaskList);

            foreach (var item in importAiTaskPreviewsDto.Items)
            {
                _aiTaskPreviewDal.Add(new AiTaskPreview
                {
                    UserId = user.Id,
                    TaskListId = item.TaskListId,
                    Title = item.Title,
                    Description = item.Description,
                    DueDate = item.DueDate,
                    Status = AiTaskPreviewStatuses.Pending,
                    SourceReference = importAiTaskPreviewsDto.SourceReference,
                    CreatedAt = DateTime.Now
                });
            }

            return new SuccessResult(AiTaskPreviewMessages.Imported);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IDataResult<List<AiTaskPreviewDto>> GetMine()
        {
            var previews = _aiTaskPreviewDal.GetAll(p =>
                p.UserId == _userContext.UserId &&
                p.Status == AiTaskPreviewStatuses.Pending);

            var result = previews
                .OrderByDescending(p => p.CreatedAt)
                .Select(MapPreview)
                .ToList();

            return new SuccessDataResult<List<AiTaskPreviewDto>>(result);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IResult Update(UpdateAiTaskPreviewDto updateAiTaskPreviewDto)
        {
            var previewResult = GetPendingPreviewForCurrentUser(updateAiTaskPreviewDto.Id);
            if (!previewResult.Success)
                return new ErrorResult(previewResult.Message);

            var preview = previewResult.Data;

            if (!TryGetAccessibleTaskList(_userContext.UserId, updateAiTaskPreviewDto.TaskListId, out _))
                return new ErrorResult(AiTaskPreviewMessages.InvalidTaskList);

            preview.TaskListId = updateAiTaskPreviewDto.TaskListId;
            preview.Title = updateAiTaskPreviewDto.Title;
            preview.Description = updateAiTaskPreviewDto.Description;
            preview.DueDate = updateAiTaskPreviewDto.DueDate;
            preview.UpdatedAt = DateTime.Now;

            _aiTaskPreviewDal.Update(preview);
            return new SuccessResult(AiTaskPreviewMessages.Updated);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IResult Approve(ApproveAiTaskPreviewsDto approveAiTaskPreviewsDto)
        {
            if (approveAiTaskPreviewsDto.PreviewIds == null || !approveAiTaskPreviewsDto.PreviewIds.Any())
                return new ErrorResult(AiTaskPreviewMessages.EmptyPreviewList);

            foreach (var previewId in approveAiTaskPreviewsDto.PreviewIds.Distinct())
            {
                var previewResult = GetPendingPreviewForCurrentUser(previewId);
                if (!previewResult.Success)
                    return new ErrorResult(previewResult.Message);

                var preview = previewResult.Data;

                if (!TryGetAccessibleTaskList(_userContext.UserId, preview.TaskListId, out _))
                    return new ErrorResult(AiTaskPreviewMessages.InvalidTaskList);

                var addTaskDto = new AddTaskDto
                {
                    Task = new Entities.Concrete.Task
                    {
                        TaskListId = preview.TaskListId,
                        Name = preview.Title,
                        Description = preview.Description ?? string.Empty,
                        DueDate = preview.DueDate ?? DateTime.Now
                    }
                };

                var addResult = _taskService.Add(addTaskDto);
                if (!addResult.Success)
                    return addResult;

                preview.Status = AiTaskPreviewStatuses.Applied;
                preview.AppliedTaskId = addTaskDto.Task.Id;
                preview.ApprovedAt = DateTime.Now;
                preview.UpdatedAt = DateTime.Now;

                _aiTaskPreviewDal.Update(preview);
            }

            return new SuccessResult(AiTaskPreviewMessages.Approved);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        public IResult Reject(RejectAiTaskPreviewsDto rejectAiTaskPreviewsDto)
        {
            if (rejectAiTaskPreviewsDto.PreviewIds == null || !rejectAiTaskPreviewsDto.PreviewIds.Any())
                return new ErrorResult(AiTaskPreviewMessages.EmptyPreviewList);

            foreach (var previewId in rejectAiTaskPreviewsDto.PreviewIds.Distinct())
            {
                var previewResult = GetPendingPreviewForCurrentUser(previewId);
                if (!previewResult.Success)
                    return new ErrorResult(previewResult.Message);

                var preview = previewResult.Data;

                preview.Status = AiTaskPreviewStatuses.Rejected;
                preview.UpdatedAt = DateTime.Now;
                _aiTaskPreviewDal.Update(preview);
            }

            return new SuccessResult(AiTaskPreviewMessages.Rejected);
        }

        private AiTaskPreviewDto MapPreview(AiTaskPreview preview)
        {
            var taskList = _taskListDal.Get(tl => tl.Id == preview.TaskListId);
            var board = taskList == null ? null : _boardDal.Get(b => b.Id == taskList.BoardId);

            return new AiTaskPreviewDto
            {
                Id = preview.Id,
                BoardId = board?.Id ?? 0,
                BoardName = board?.Name ?? string.Empty,
                TaskListId = preview.TaskListId,
                TaskListName = taskList?.Name ?? string.Empty,
                Title = preview.Title,
                Description = preview.Description,
                DueDate = preview.DueDate,
                Status = preview.Status,
                SourceReference = preview.SourceReference,
                CreatedAt = preview.CreatedAt
            };
        }

        private IDataResult<AiTaskPreview> GetPendingPreviewForCurrentUser(long previewId)
        {
            var preview = _aiTaskPreviewDal.Get(p => p.Id == previewId && p.UserId == _userContext.UserId);
            if (preview == null)
                return new ErrorDataResult<AiTaskPreview>(AiTaskPreviewMessages.PreviewNotFound);

            if (preview.Status != AiTaskPreviewStatuses.Pending)
                return new ErrorDataResult<AiTaskPreview>(AiTaskPreviewMessages.PreviewAlreadyProcessed);

            return new SuccessDataResult<AiTaskPreview>(preview);
        }

        private bool TryGetAccessibleTaskList(long userId, int taskListId, out TaskList? taskList)
        {
            taskList = _taskListDal.Get(tl => tl.Id == taskListId);
            if (taskList == null)
                return false;

            return _boardDal.CanUserAccessToBoard(taskList.BoardId, userId);
        }
    }
}
