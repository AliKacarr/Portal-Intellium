using Business.BusinessAspects;
using Business.Repository.RolesForUsersRepository;
using Business.Repository.UserRepository;
using Core.Identity;
using Core.Utilities.IoC;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.ProjectTeamMemberRepository;
using DataAccess.Repository.ProjectTeamRepository;
using Entities.DTOs.NotificationDtos;
using Microsoft.Extensions.DependencyInjection;

namespace Business.Repository.NotificationRepository
{
    public static class NotificationManagerExtension
    {

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public static IResult SendAllUsers(this INotificationService notificationService, AddNotificationDto addNotificationDto)
        {
            return notificationService.BroadcastToAllActiveUsers(addNotificationDto);
        }

        [LoggerAspect]
        [SecuredOperation(RoleNames.Admin)]
        public static IResult SendAllByRoleId(this INotificationService notificationService, AddNotificationDto addNotificationDto, long roleId)
        {
            IRolesForUsersService rolesForUsersService = ServiceTool.ServiceProvider.GetService<IRolesForUsersService>()!;
            rolesForUsersService.GetRolesForUsersByRoleId(roleId).Data.ForEach(role =>
            {
                notificationService.Add(new()
                {
                    AssignedUserId = role.UserId,
                    Content = addNotificationDto.Content,
                    Title = addNotificationDto.Title,
                    Type = addNotificationDto.Type,
                    ReferenceId = addNotificationDto.ReferenceId,
                    NavigationData = addNotificationDto.NavigationData
                });
            });
            return new SuccessResult();
        }

        public static IResult SendAllByRoleName(this INotificationService notificationService, AddNotificationDto notificationDto, string rolename)
        {
            IRolesForUsersService rolesForUsersService = ServiceTool.ServiceProvider.GetService<IRolesForUsersService>()!;
            rolesForUsersService.GetAllRolesForUsersByRoleName(rolename).Data.ForEach(role =>
            {
                notificationService.Add(new()
                {
                    AssignedUserId = role.UserId,
                    Content = notificationDto.Content,
                    Title = notificationDto.Title,
                    Type = notificationDto.Type,
                    ReferenceId = notificationDto.ReferenceId,
                    NavigationData = notificationDto.NavigationData
                });
            });
            return new SuccessResult();
        }

        public static IResult SendAllByProjecjtId(this INotificationService notificationService, AddNotificationDto addNotificationDto, long projecjtId)
        {
            IProjectTeamDal projectTeamDal = ServiceTool.ServiceProvider.GetService<IProjectTeamDal>()!;
            IProjectTeamMemberDal projectTeamMemberDal = ServiceTool.ServiceProvider.GetService<IProjectTeamMemberDal>()!;
            var teams = projectTeamDal.GetAll(t => t.ProjectId == projecjtId);
            if (!teams.Any())
                return new ErrorResult();

            var allDistinctMembers = teams
                .SelectMany(team => projectTeamMemberDal.GetAll(pm => pm.ProjectTeamId == team.Id))
                .GroupBy(member => member.UserId)
                .Select(group => group.First())
                .ToList();

            allDistinctMembers.ForEach(member =>
            {
                notificationService.Add(new()
                {
                    AssignedUserId = member.UserId,
                    Content = addNotificationDto.Content,
                    Title = addNotificationDto.Title,
                    Type = addNotificationDto.Type,
                    ReferenceId = addNotificationDto.ReferenceId,
                    NavigationData = addNotificationDto.NavigationData
                });
            });


            return new SuccessResult();
        }
    }
}