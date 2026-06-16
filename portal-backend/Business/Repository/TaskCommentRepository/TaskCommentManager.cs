using AutoMapper;
using Business.BusinessAspects;
using Business.Repository.NotificationRepository;
using Business.Repository.TaskCommentRepository.Constants;
using Business.Repository.TaskCommentRepository.Validations;
using Business.Repository.TaskMemberRepository;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.TaskRepository;
using DataAccess.Repository.TaskListRepository; // ✅ EKLENDİ (Bunu kontrol et)
using Entities.Concrete;
using Entities.DTOs.NotificationDtos;
using Entities.DTOs.TaskCommentDtos;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Text.Json;

namespace Business.Repository.TaskCommentRepository
{
    public class TaskCommentManager : ITaskCommentService
    {
        private readonly ITaskCommentDal _taskCommentDal;
        private readonly IUserContext _userContext;
        private readonly IMapper _mapper;
        
        // Bildirim Servisleri
        private readonly INotificationService _notificationService;
        private readonly ITaskMemberDal _taskMemberDal; 
        private readonly ITaskDal _taskDal; 
        private readonly ITaskListDal _taskListDal; // ✅ EKLENDİ

        public TaskCommentManager(ITaskCommentDal taskCommentDal, IUserContext userContext, IMapper mapper, 
            INotificationService notificationService, ITaskMemberDal taskMemberDal, ITaskDal taskDal, ITaskListDal taskListDal)
        {
            _taskCommentDal = taskCommentDal;
            _userContext = userContext;
            _mapper = mapper;
            _notificationService = notificationService;
            _taskMemberDal = taskMemberDal;
            _taskDal = taskDal;
            _taskListDal = taskListDal; // ✅ Inject edildi
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(AddTaskCommentValidator))]
        public IResult Add(AddTaskCommentDto taskCommentDto)
        {
            TaskComment taskComment = _mapper.Map<TaskComment>(taskCommentDto);
            taskComment.UserId = _userContext.UserId;
            taskComment.CreatedDate = DateTime.Now;
            _taskCommentDal.Add(taskComment);

            // --- 🔥 BİLDİRİM: YENİ YORUM 🔥 ---
            try
            {
                // 1. Görevi bul
                var task = _taskDal.Get(t => t.Id == taskComment.TaskId);
                
                // 2. Görevin bağlı olduğu Listeyi (TaskList) bul ve oradan BoardId'yi çek
                // (Task -> TaskList -> Board)
                var taskList = _taskListDal.Get(tl => tl.Id == task.TaskListId);
                
                // Buradaki 'BoardId' property'si TaskList entity'nde olmalı.
                int targetBoardId = 0;
                if (taskList != null) 
                {
                     // dynamic kullanarak TaskList içinde BoardId var mı diye bakıyoruz, hata vermesin.
                     try { targetBoardId = (int)((dynamic)taskList).BoardId; } catch {}
                }

                if (targetBoardId > 0)
                {
                    var taskMembers = _taskMemberDal.GetAll(m => m.TaskId == taskComment.TaskId && m.UserId != _userContext.UserId);
                    var navJson = JsonSerializer.Serialize(new { taskId = taskComment.TaskId });
                    foreach (var member in taskMembers)
                    {
                        _notificationService.Add(new AddNotificationDto
                        {
                            AssignedUserId = member.UserId,
                            Title = "Yeni Yorum",
                            Content = $"'{task.Name}' görevine yeni bir yorum yapıldı.",
                            Type = "scrumTask",
                            ReferenceId = targetBoardId.ToString(),
                            NavigationData = navJson
                        });
                    }
                }
            }
            catch { }
            // ----------------------------------

            return new SuccessResult("Yorum başarıyla eklendi.");
        }

        // ... Diğer metodlar (Delete, DeleteAll, GetAllByTaskId) AYNEN KALSIN
        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(DeleteTaskCommentValidator))]
        public IResult Delete(int taskCommentId)
        {
            var result = _taskCommentDal.Get(p => p.Id.Equals(taskCommentId));
            _taskCommentDal.Delete(result);
            return new SuccessResult(TaskCommentMessages.TaskCommentDeleted);
        }

        public IResult DeleteAll(List<TaskCommentDto> taskComments)
        {
            if (taskComments.IsNullOrEmpty()) return new ErrorResult();
            foreach (var taskComment in taskComments)
            {
                Delete(taskComment.Id);
            }
            return new SuccessResult();
        }

        [LoggerAspect]
        [SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
        [ValidationAspect(typeof(GetAllTaskCommentValidator))]
        public IDataResult<List<TaskCommentDto>> GetAllByTaskId(int taskId)
        {
            var result = _taskCommentDal.GetAllByTaskId(taskId);
            return new SuccessDataResult<List<TaskCommentDto>>(result);
        }
    }
}