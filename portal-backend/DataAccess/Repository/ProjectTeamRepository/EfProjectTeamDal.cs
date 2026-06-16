using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.ProjectDtos;
using Entities.DTOs.ProjectTeamDtos;
using Entities.DTOs.UserDtos;

namespace DataAccess.Repository.ProjectTeamRepository
{
	public class EfProjectTeamDal : EfEntityRepositoryBase<ProjectTeam, PortalContext>, IProjectTeamDal
	{
		public bool CanUserAccessProjectTeam(long projectTeamId, long userId)
		{
			using var context = new PortalContext();
			return context.ProjectTeams
				.Where(team => team.Id == projectTeamId)
			.Any(team =>
					context.Projects.Any(project =>
					project.Id == team.ProjectId &&
						context.ProjectTeams.Any(t => t.ProjectId == project.Id) &&
						context.ProjectTeamMembers.Any(member => member.UserId == userId && member.ProjectTeamId == team.Id)
			) ||
					context.ProjectTeamMembers.Any(member => member.UserId == userId && member.ProjectTeamId == team.Id)
				);
		}

		public List<GetAllProjectTeamDto> GetAllByCustomerAndUserWithMembers(long customerId, long userId)
		{
			using var context = new PortalContext();

			var customerTeams = context.Projects
			.Where(project => project.CustomerId == customerId)
			.ToList() 
			.SelectMany(project => context.ProjectTeams
				.Where(team => team.ProjectId == project.Id)
				.ToList() 
		.Select(team => new GetAllProjectTeamDto
		{
			Id = team.Id,
			Name = team.Name,
			ProjectName = project.ProjectName,
			Description = team.Description,
			ProjectLeader = context.Users
				.Where(u => u.Id == project.LeaderUserId)
				.Select(user => new BaseUserDto
				{
					Id = user.Id,
					Name = user.Name,
					ImageUrl = user.ImageUrl,
					IsActive = user.IsActive
				})
				.FirstOrDefault()!,
			Members = context.ProjectTeamMembers
				.Where(member => member.ProjectTeamId == team.Id)
				.Join(context.Users,
					  member => member.UserId,
					  user => user.Id,
					  (member, user) => new ProjectTeamMemberDto
					  {
						  Id = user.Id,
						  Name = user.Name,
						  ImageUrl = user.ImageUrl,
						  IsActive = user.IsActive,
						  UserRole = context.RolesForUsers
						.Where(ru => ru.UserId == user.Id)
						.Join(context.UserRoles,
							  ru => ru.RoleId,
							  role => role.Id,
							  (ru, role) => new UserRole
							  {
								  Id = role.Id,
								  RoleName = role.RoleName,
							  })
						.FirstOrDefault(),
						  ProjectRole = member.ProjectRole
					  }).ToList()
		})).ToList();


			var userAdditionalTeams = context.ProjectTeamMembers
				.Where(member => member.UserId == userId)
				.Join(context.ProjectTeams, member => member.ProjectTeamId, team => team.Id, (member, team) => team)
				.ToList()
				.Where(team => !customerTeams.Any(ct => ct.Id == team.Id))
				.Select(team => new GetAllProjectTeamDto
				{
					Id = team.Id,
					Name = team.Name,
					ProjectName = context.Projects.Where(p => p.Id == team.ProjectId).Single().ProjectName,
					Description = team.Description,
					Members = context.ProjectTeamMembers
						.Where(member => member.ProjectTeamId == team.Id)
						.Join(context.Users, member => member.UserId, user => user.Id, (member, user) => new ProjectTeamMemberDto
						{
							Id = user.Id,
							Name = user.Name,
							ImageUrl = user.ImageUrl,
							IsActive = user.IsActive,
							UserRole = context.RolesForUsers
								.Where(ru => ru.UserId == user.Id)
								.Join(context.UserRoles, ru => ru.RoleId, role => role.Id, (ru, role) => new UserRole
								{
									Id = role.Id,
									RoleName = role.RoleName,
								}).SingleOrDefault(),
							ProjectRole = member.ProjectRole
						}).ToList()
				}).ToList();

			customerTeams.AddRange(userAdditionalTeams);
			return customerTeams;
		}

		public List<GetAllProjectTeamDto> GetAllWithMembers()
		{
			using var context = new PortalContext();
			var result = context.ProjectTeams
							.Select(team => new GetAllProjectTeamDto
							{
								Id = team.Id,
								Name = team.Name,
								ProjectName = context.Projects.Where(project => project.Id == team.ProjectId).Single().ProjectName,
								Description = team.Description,
								ProjectLeader = context.Users.Where(u => u.Id == context.Projects.Where(p => p.Id == team.ProjectId)
									.Select(p => p.LeaderUserId).SingleOrDefault()).Select(user => new BaseUserDto
									{
										Id = user.Id,
										Name = user.Name,
										ImageUrl = user.ImageUrl,
										IsActive = user.IsActive
									})
											.SingleOrDefault()!,
								Members = context.ProjectTeamMembers
											.Where(member => member.ProjectTeamId == team.Id)
											.Join(context.Users, member => member.UserId, user => user.Id, (member, user) => new ProjectTeamMemberDto
											{
												Id = user.Id,
												Name = user.Name,
												ImageUrl = user.ImageUrl,
												IsActive = user.IsActive,
												UserRole = context.RolesForUsers.Where(ru => ru.UserId.Equals(user.Id))
												 .Join(context.UserRoles, ru => ru.RoleId, role => role.Id, (ru, role) => new UserRole
												 {
													 Id = role.Id,
													 RoleName = role.RoleName,
												 }).SingleOrDefault(),
												ProjectRole = member.ProjectRole

											}).ToList()

							}).ToList();
			return result;
		}

		public List<GetAllProjectTeamDto> GetAllByProjectWithMembers(long projectId)
		{
			using var context = new PortalContext();
			var result = context.Projects
							.Where(project => project.Id == projectId)
							.SelectMany(project => context.ProjectTeams
							.Where(team => team.ProjectId == project.Id)
							.Select(team => new GetAllProjectTeamDto
							{
								Id = team.Id,
								Name = team.Name,
								ProjectName = context.Projects.Where(p => p.Id == team.ProjectId).Single().ProjectName,
								Description = team.Description,
								Members = context.ProjectTeamMembers
											.Where(member => member.ProjectTeamId == team.Id)
											.Join(context.Users, member => member.UserId, user => user.Id, (member, user) => new ProjectTeamMemberDto
											{
												Id = user.Id,
												Name = user.Name,
												ImageUrl = user.ImageUrl,
												IsActive = user.IsActive,
												UserRole = context.RolesForUsers
																.Where(ru => ru.UserId.Equals(user.Id))
																.Join(context.UserRoles, ru => ru.RoleId, role => role.Id, (ru, role) => new UserRole
																{
																	Id = role.Id,
																	RoleName = role.RoleName,
																}).SingleOrDefault(),
												ProjectRole = member.ProjectRole
											}).ToList()
							})).ToList();
			return result;
		}

		public GetProjectTeamDto GetById(long id)
		{
			using (var context = new PortalContext())
			{
				var result = context.ProjectTeams
					.Where(team => team.Id.Equals(id))
								.Select(team => new GetProjectTeamDto
								{
									Id = team.Id,
									Name = team.Name,
									Description = team.Description,
									Project = context.Projects.Where(project => project.Id == team.ProjectId).Select(p => new ProjectForProjectTeamDetailDto
									{
										Id = p.Id,
										ProjectName = p.ProjectName,
										Description = p.Description,
										Leader = context.Users.Where(u => u.Id == p.LeaderUserId).Select(leader => new ProjectLeaderDto
										{
											Id = leader.Id,
											Name = leader.Name,
											ImageUrl = leader.ImageUrl,
											IsActive = leader.IsActive
										}).Single(),
										StartDate = p.StartDate,
										FinishDate = p.FinishDate,
										IsActive = p.IsActive


									}).Single(),
									Members = context.ProjectTeamMembers
												.Where(member => member.ProjectTeamId == team.Id)
												.Join(context.Users, member => member.UserId, user => user.Id, (member, user) => new ProjectTeamMemberDto
												{
													Id = user.Id,
													Name = user.Name,
													ImageUrl = user.ImageUrl,
													IsActive = user.IsActive,
													UserRole = context.RolesForUsers.Where(ru => ru.UserId.Equals(user.Id))
													 .Join(context.UserRoles, ru => ru.RoleId, role => role.Id, (ru, role) => new UserRole
													 {
														 Id = role.Id,
														 RoleName = role.RoleName,
													 }).SingleOrDefault(),
													ProjectRole = member.ProjectRole

												}).ToList()

								}).SingleOrDefault();
				return result;
			}
		}
	}
}
