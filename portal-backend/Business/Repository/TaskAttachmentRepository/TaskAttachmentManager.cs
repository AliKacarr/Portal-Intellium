using Business.BusinessAspects;
using Business.File;
using Business.Repository.NotificationRepository;
using Business.Repository.TaskAttachmentRepository.Constants;
using Business.Repository.TaskAttachmentRepository.Validations;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.TaskRepository;
using DataAccess.Repository.TaskListRepository; // ✅ EKLENDİ
using Entities.Concrete;
using Entities.DTOs.NotificationDtos;
using Microsoft.AspNetCore.Http;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using IResult = Core.Utilities.Results.Abstract.IResult;

namespace Business.Repository.TaskAttachmentRepository
{
    public class TaskAttachmentManager : ITaskAttachmentService
    {
        private readonly ITaskAttachmentDal _taskAttachmentDal;
        private readonly IFileService _fileService;
        private readonly IUserContext _userContext;
        
        // Bildirim Servisleri
        private readonly INotificationService _notificationService;
        private readonly ITaskMemberDal _taskMemberDal;
        private readonly ITaskDal _taskDal;
        private readonly ITaskListDal _taskListDal; // ✅ EKLENDİ

        public TaskAttachmentManager(ITaskAttachmentDal taskAttachmentDal, IFileService fileService, IUserContext userContext, 
            INotificationService notificationService, ITaskMemberDal taskMemberDal, ITaskDal taskDal, ITaskListDal taskListDal)
        {
            _taskAttachmentDal = taskAttachmentDal;
            _fileService = fileService;
            _userContext = userContext;
            _notificationService = notificationService;
            _taskMemberDal = taskMemberDal;
            _taskDal = taskDal;
            _taskListDal = taskListDal; // ✅ Inject edildi
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(AddTaskAttachmentValidator))]
        public async Task<IResult> Add(List<IFormFile> taskAttachments, int taskId)
        {
            var task = _taskDal.Get(t => t.Id == taskId);
            
            // 🛠️ BoardId'yi Bulma
            int targetBoardId = 0;
            try 
            {
                var taskList = _taskListDal.Get(tl => tl.Id == task.TaskListId);
                targetBoardId = (int)((dynamic)taskList).BoardId;
            }
            catch { }

            var taskMembers = _taskMemberDal.GetAll(m => m.TaskId == taskId && m.UserId != _userContext.UserId).ToList();

            foreach (var taskAttachment in taskAttachments)
            {
                if (taskAttachment.Length > 0)
                {
                    var result = await _fileService.Save(taskAttachment, FileType.TASK_ATTACHMENT);
                    if (!result.Success) continue;

                    TaskAttachment newTaskAttachment = new()
                    {
                        TaskId = taskId,
                        CreatorUserId = _userContext.UserId,
                        Name = result.Data.Name,
                        AttachmentPath = result.Data.FilePath
                    };
                    _taskAttachmentDal.Add(newTaskAttachment);

                    // --- 🔥 BİLDİRİM ---
                    try 
                    {
                        if (task != null && taskMembers.Any() && targetBoardId > 0)
                        {
                            foreach (var member in taskMembers)
                            {
                                _notificationService.Add(new AddNotificationDto
                                {
                                    AssignedUserId = member.UserId,
                                    Title = "Yeni Dosya Eklendi",
                                    Content = $"'{task.Name}' görevine yeni bir dosya eklendi: {newTaskAttachment.Name}",
                                    Type = "scrumTask",
                                    ReferenceId = targetBoardId.ToString() // ✅ PANO ID
                                });
                            }
                        }
                    }
                    catch { }
                    // ------------------------------------------
                }
            }
            return new SuccessResult(TaskAttachmentMessages.TaskAttachmentAdded);
        }

        // ... Diğer metodlar aynı kalsın ...
        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(DeleteTaskAttachmentValidator))]
        public IResult Delete(int taskAttachmentId)
        {
            var result = _taskAttachmentDal.Get(p => p.Id.Equals(taskAttachmentId));
            _taskAttachmentDal.Delete(result);
            _fileService.Delete(result.AttachmentPath, FileType.TASK_ATTACHMENT);
            return new SuccessResult();
        }

        public IResult DeleteAll(List<int> taskAttachmentIds)
        {
            if (taskAttachmentIds.IsNullOrEmpty()) return new ErrorResult();
            foreach (var taskAttachmentId in taskAttachmentIds)
            {
                Delete(taskAttachmentId);
            }
            return new SuccessResult();
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(GetAllTaskAttachmentValidator))]
        public IDataResult<List<TaskAttachment>> GetAllByTaskId(int taskId)
        {
            var result = _taskAttachmentDal.GetAll(p => p.TaskId.Equals(taskId));
            return new SuccessDataResult<List<TaskAttachment>>(result);
        }

        public IDataResult<List<int>> GetAllIdByTaskId(int taskId)
        {
            var result = _taskAttachmentDal.GetAll(p => p.TaskId.Equals(taskId)).Select(p => p.Id).ToList();
            return new SuccessDataResult<List<int>>(result);
        }
    }
}