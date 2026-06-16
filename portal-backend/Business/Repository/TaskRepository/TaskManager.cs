using Business.BusinessAspects;
using Business.Repository.NotificationRepository;
using Business.Repository.TaskAttachmentRepository;
using Business.Repository.TaskCommentRepository;
using Business.Repository.TaskLabelRepository;
using Business.Repository.TaskMemberRepository;
using Business.Repository.TaskRepository.Constants;
using Business.Repository.TaskRepository.Validations;
using Business.Repository.TaskTodoListRepository;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.TaskRepository;
using DataAccess.Repository.TaskListRepository; // ✅ EKLENDİ
using Entities.DTOs.NotificationDtos;
using Entities.DTOs.TaskDtos;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Linq;

namespace Business.Repository.TaskRepository
{
    public class TaskManager : ITaskService
    {
        private readonly ITaskDal _taskDal;
        private readonly ITaskMemberService _taskMemberService;
        private readonly ITaskLabelService _taskLabelService;
        private readonly ITaskAttachmentService _taskAttachmentService;
        private readonly ITaskCommentService _taskCommentService;
        private readonly ITaskTodoListService _taskTodoListService;
        
        // 🔥 Bildirim ve İlişkili Servisler
        private readonly INotificationService _notificationService;
        private readonly ITaskMemberDal _taskMemberDal;
        private readonly ITaskListDal _taskListDal; // ✅ EKLENDİ (BoardId'yi bulmak için)

        public TaskManager(ITaskDal taskDal, ITaskMemberService taskMemberService, ITaskLabelService taskLabelService,
            ITaskAttachmentService taskAttachmentService, ITaskCommentService taskCommentService, ITaskTodoListService taskTodoListService, 
            INotificationService notificationService, ITaskMemberDal taskMemberDal, ITaskListDal taskListDal)
        {
            _taskDal = taskDal;
            _taskMemberService = taskMemberService;
            _taskLabelService = taskLabelService;
            _taskAttachmentService = taskAttachmentService;
            _taskCommentService = taskCommentService;
            _taskTodoListService = taskTodoListService;
            _notificationService = notificationService;
            _taskMemberDal = taskMemberDal;
            _taskListDal = taskListDal; // ✅ Inject edildi
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(AddTaskValidator))]
        public IResult Add(AddTaskDto taskDto)
        {
            var maxOrder = _taskDal.GetAll(p => p.TaskListId.Equals(taskDto.Task.TaskListId)).OrderByDescending(p => p.OrderNo).FirstOrDefault();
            taskDto.Task.CreatedDate = taskDto.Task.CreatedDate == default ? DateTime.Now : taskDto.Task.CreatedDate;
            taskDto.Task.OrderNo = (maxOrder != null) ? maxOrder.OrderNo + 1 : 1;

            _taskDal.Add(taskDto.Task);

            if (taskDto.AddUserIds != null) { _taskMemberService.Add(taskDto.AddUserIds, taskDto.Task.Id); }
            if (taskDto.AddLabelIds != null) { _taskLabelService.Add(taskDto.AddLabelIds, taskDto.Task.Id); }

            return new SuccessResult(TaskMessages.AddedTask);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(DeleteTaskValidator))]
        public IResult Delete(int taskId)
        {
            var task = _taskDal.Get(p => p.Id.Equals(taskId));

            DeleteRelatedEntities(_taskMemberService.GetAllIdByTaskId, _taskMemberService.DeleteAllByTaskMemberIds, taskId);
            DeleteRelatedEntities(_taskLabelService.GetAllIdByTaskId, _taskLabelService.DeleteAllByTaskLabelIds, taskId);
            DeleteRelatedEntities(_taskAttachmentService.GetAllIdByTaskId, _taskAttachmentService.DeleteAll, taskId);
            DeleteRelatedEntities(_taskCommentService.GetAllByTaskId, _taskCommentService.DeleteAll, taskId);
            DeleteRelatedEntities(_taskTodoListService.GetAllByTaskId, _taskTodoListService.DeleteAll, taskId);

            _taskDal.Delete(task);
            return new SuccessResult(TaskMessages.DeletedTask);
        }

        private static void DeleteRelatedEntities<T>(Func<int, IDataResult<List<T>>> getService, Func<List<T>, IResult> deleteService, int taskId)
        {
            var entities = getService(taskId).Data;
            if (entities?.Any() == true)
            {
                deleteService(entities);
            }
        }

        public IResult DeleteAll(List<Entities.Concrete.Task> tasks)
        {
            if (tasks.IsNullOrEmpty()) return new ErrorResult();
            foreach (var task in tasks)
            {
                Delete(task.Id);
            }
            return new SuccessResult();
        }

        public IDataResult<List<Entities.Concrete.Task>> GetAllByTaskListId(int taskListId)
        {
            var result = _taskDal.GetAll(p => p.TaskListId.Equals(taskListId));
            return new SuccessDataResult<List<Entities.Concrete.Task>>(result);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(GetByIdTaskValidator))]
        public IDataResult<TaskViewDto> GetById(int taskId)
        {
            var result = _taskDal.GetTaskByTaskId(taskId);
            return (result != null) ? new SuccessDataResult<TaskViewDto>(result) : new ErrorDataResult<TaskViewDto>(TaskMessages.TaskNotFound);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(UpdateTaskValidator))]
        public IResult Update(EditTaskDto taskDto)
        {
            var task = _taskDal.Get(p => p.Id.Equals(taskDto.Task.Id));

            task.Name = taskDto.Task.Name;
            task.Description = taskDto.Task.Description;
            task.CreatedDate = taskDto.Task.CreatedDate == default ? task.CreatedDate : taskDto.Task.CreatedDate;
            task.DueDate = taskDto.Task.DueDate;

            if (taskDto.AddUserIds != null) { _taskMemberService.Add(taskDto.AddUserIds, task.Id); }
            if (taskDto.RemoveUserIds != null) { _taskMemberService.DeleteAllByUserIdsAndTaskId(taskDto.RemoveUserIds, task.Id); }

            if (taskDto.AddLabelIds != null) { _taskLabelService.Add(taskDto.AddLabelIds, task.Id); }
            if (taskDto.RemoveLabelIds != null) { _taskLabelService.DeleteAllByLabelIdsAndTaskId(taskDto.RemoveLabelIds, task.Id); }

            _taskDal.Update(task);
            return new SuccessResult(TaskMessages.UpdatedTask);
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(UpdateOrderTaskValidator))]
        public IResult UpdateOrder(List<TaskOrderEditDto> tasks)
        {
            foreach (var task in tasks)
            {
                var updatedTask = _taskDal.Get(p => p.Id.Equals(task.Id));

                // --- 🔥 STATÜ DEĞİŞİMİ KONTROLÜ 🔥 ---
                bool isStatusChanged = task.TaskListId != 0 && updatedTask.TaskListId != task.TaskListId;

                if (task.TaskListId != 0)
                {
                    updatedTask.TaskListId = task.TaskListId;
                }
                updatedTask.OrderNo = task.OrderNo;
                _taskDal.Update(updatedTask);
                
                // Eğer statü değiştiyse (listesi değiştiyse) bildirim at
                if (isStatusChanged)
                {
                    try {
                        // 🛠️ PANO ID'SİNİ BULMA (Task -> TaskList -> Board)
                        int targetBoardId = 0;
                        var taskList = _taskListDal.Get(tl => tl.Id == updatedTask.TaskListId);
                        
                        if (taskList != null)
                        {
                            // dynamic ile BoardId çekiyoruz
                            targetBoardId = (int)((dynamic)taskList).BoardId;
                        }

                        if (targetBoardId > 0)
                        {
                            var members = _taskMemberDal.GetAll(m => m.TaskId == updatedTask.Id);
                            foreach(var member in members)
                            {
                                _notificationService.Add(new AddNotificationDto
                                {
                                    AssignedUserId = member.UserId,
                                    Title = "Görev Durumu Güncellendi",
                                    Content = $"'{updatedTask.Name}' görevinin durumu/listesi değiştirildi.",
                                    Type = "scrumTask",
                                    ReferenceId = targetBoardId.ToString() // ✅ PANO ID GÖNDERİLİYOR
                                });
                            }
                        }
                    } catch {}
                }
                // ------------------------------------
            }
            return new SuccessResult();
        }
    }
}