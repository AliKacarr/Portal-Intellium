using Business.Repository.NotificationRepository;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.TaskRepository;
using Entities.Concrete;
using Entities.DTOs.NotificationDtos;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Generic;
using System.Linq;

namespace Business.Repository.TaskMemberRepository
{
    public class TaskMemberManager : ITaskMemberService
    {
        private readonly ITaskMemberDal _taskMemberDal;
        private readonly ITaskDal _taskDal;
        private readonly INotificationService _notificationService; 

        public TaskMemberManager(ITaskMemberDal taskMemberDal, ITaskDal taskDal, INotificationService notificationService)
        {
            _taskMemberDal = taskMemberDal;
            _taskDal = taskDal;
            _notificationService = notificationService;
        }

        public IResult Add(List<int> userIds, int taskId)
        {
            var task = _taskDal.Get(t => t.Id.Equals(taskId));
            if (task is null) return new ErrorResult();

            foreach (var id in userIds)
            {
                var result = _taskMemberDal.Get(user => user.UserId.Equals(id) && user.TaskId.Equals(taskId));
                if (result == null)
                {
                    TaskMember member = new()
                    {
                        UserId = id,
                        TaskId = taskId
                    };
                    _taskMemberDal.Add(member);

                    // --- 🔥 BİLDİRİM: YENİ GÖREV ATAMASI 🔥 ---
                    _notificationService.Add(new AddNotificationDto
                    {
                        AssignedUserId = id,
                        Title = "Yeni Görev Ataması",
                        Content = $"'{task.Name}' adlı projede/görevde size atama yapıldı.",
                        Type = "scrumTask", 
                        ReferenceId = taskId.ToString()
                    });
                    // ------------------------------------------
                }
            }
            return new SuccessResult();
        }

        public IResult DeleteByUserIdAndTaskId(int userId, int taskId)
        {
            var result = _taskMemberDal.Get(p => p.UserId.Equals(userId) && p.TaskId.Equals(taskId));
            if (result == null) return new ErrorResult();

            _taskMemberDal.Delete(result);
            return new SuccessResult();
        }

        public IResult DeleteAllByUserIdsAndTaskId(List<int> userIds, int taskId)
        {
            if (userIds.IsNullOrEmpty()) return new ErrorResult();
            foreach (var userId in userIds)
            {
                DeleteByUserIdAndTaskId(userId, taskId);
            }
            return new SuccessResult();
        }

        public IResult DeleteByTaskMemberId(int taskMemberId)
        {
            var result = _taskMemberDal.Get(p => p.Id.Equals(taskMemberId));
            if (result == null) return new ErrorResult();

            _taskMemberDal.Delete(result);
            return new SuccessResult();
        }

        public IResult DeleteAllByTaskMemberIds(List<int> memberIds)
        {
            if (memberIds.IsNullOrEmpty()) return new ErrorResult();
            foreach (var memberId in memberIds)
            {
                DeleteByTaskMemberId(memberId);
            }
            return new SuccessResult();
        }

        public IDataResult<List<int>> GetAllIdByTaskId(int taskId)
        {
            var result = _taskMemberDal.GetAll(p => p.TaskId.Equals(taskId)).Select(p => p.Id).ToList();
            return new SuccessDataResult<List<int>>(result);
        }
    }
}