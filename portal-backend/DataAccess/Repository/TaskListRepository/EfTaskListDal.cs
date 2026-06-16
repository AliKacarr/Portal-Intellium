using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.TaskDtos;
using Entities.DTOs.TaskListDtos;

namespace DataAccess.Repository.TaskListRepository
{
    public class EfTaskListDal : EfEntityRepositoryBase<TaskList, PortalContext>, ITaskListDal
    {
        public List<TaskListDto> GetAllWithTasks(int boardId)
        {
            using (var context = new PortalContext())
            {
                var result = (from taskList in context.TaskLists
                              where taskList.BoardId == boardId
                              select new TaskListDto
                              {
                                  Id = taskList.Id,
                                  BoardId = boardId,
                                  Name = taskList.Name,
                                  OrderNo = taskList.OrderNo,
                                  Tasks = context.Tasks.Where(task => task.TaskListId == taskList.Id)
                                  .Select(task => new TaskForTaskListDto
                                  {

                                      Id = task.Id,
                                      TaskListId = taskList.Id,
                                      Name = task.Name,
                                      AttachmentCount = context.TaskAttachments.Count(ta => ta.TaskId == task.Id),
                                      CommentCount = context.TaskComments.Count(tc => tc.TaskId == task.Id),
                                      OrderNo = task.OrderNo,
                                      StartDate = task.CreatedDate,
                                      DueDate = task.DueDate,
                                      taskLabels = context.TaskLabels
                                                .Where(taskLabel => taskLabel.TaskId == task.Id)
                                                .Join(context.Labels, taskLabel => taskLabel.LabelId, label => label.Id,
                                                    (taskLabel, label) => new TaskLabelDto
                                                    {
                                                        Id = taskLabel.Id,
                                                        LabelId = label.Id,
                                                        Name = label.Name,
                                                        Color = label.Color,
                                                    }).ToList(),
                                      taskMembers = context.TaskMembers
                                                .Where(taskMember => taskMember.TaskId == task.Id)
                                                .Join(context.Users, taskMember => taskMember.UserId, user => user.Id,
                                                    (taskMember, user) => new TaskMemberDto
                                                    {
                                                        Id = taskMember.Id,
                                                        UserId = user.Id,
                                                        Name = user.Name,
                                                        Email = user.Email,
                                                        ImageUrl = user.ImageUrl
                                                    })
                                                .ToList()

                                  }).OrderBy(task => task.OrderNo).ToList()
                              }).OrderBy(taskList => taskList.OrderNo).ToList();

                return result;
            }


        }


    }
}
