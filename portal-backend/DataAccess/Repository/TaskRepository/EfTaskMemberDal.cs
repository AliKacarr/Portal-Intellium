using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.CustomerDtos;
using Entities.DTOs.UserDtos;

namespace DataAccess.Repository.TaskRepository
{
    public class EfTaskMemberDal : EfEntityRepositoryBase<TaskMember, PortalContext>, ITaskMemberDal
    {
        public List<UserDto> GetTaskMembersAsUserByBoardId(int boardId)
        {
            using (var context = new PortalContext())
            {
                var result = (from board in context.Boards
                              where board.Id == boardId
                              join taskList in context.TaskLists on board.Id equals taskList.BoardId
                              join task in context.Tasks on taskList.Id equals task.TaskListId
                              join taskMember in context.TaskMembers on task.Id equals taskMember.TaskId
                              join user in context.Users on taskMember.UserId equals user.Id
                              select new { User = user })
                              .Distinct()
                              .ToList();

                var userDtoList = result.Select(r => new UserDto
                {
                    Id = r.User.Id,
                    Name = r.User.Name,
                    Email = r.User.Email,
                    IsActive = r.User.IsActive,
                    AddetAt = r.User.AddetAt,
                    ImageUrl = r.User.ImageUrl,
                    Customer = context.UserCustomers.Where(uc => uc.UserId.Equals(r.User.Id))
                                 .Join(context.Customers, uc => uc.CustomerId, customer => customer.CustomerId, (uc, customer) => new BasicCustomerDto
                                 {
                                     CustomerId = customer.CustomerId,
                                     CustomerName = customer.CustomerName,
                                 }).SingleOrDefault(),
                    UserRole = context.RolesForUsers.Where(ru => ru.UserId.Equals(r.User.Id))
                                 .Join(context.UserRoles, ru => ru.RoleId, role => role.Id, (ru, role) => new UserRole
                                 {
                                     Id = role.Id,
                                     RoleName = role.RoleName,
                                 }).SingleOrDefault(),
                }).ToList();

                return userDtoList;
            }
        }

    }
}
