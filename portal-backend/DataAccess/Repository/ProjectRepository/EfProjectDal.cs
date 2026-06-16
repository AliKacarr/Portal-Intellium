using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.CustomerDtos;
using Entities.DTOs.ProjectDtos;

namespace DataAccess.Repository.ProjectRepository
{
	public class EfProjectDal : EfEntityRepositoryBase<Project, PortalContext>, IProjectDal
	{
		public bool CanUserAccessProject(long projectId, long customerId, long userId)
		{
			using var context = new PortalContext();
			var accessibleProjects = (from project in context.Projects
									  where project.Id == projectId &&
											(project.CustomerId == customerId ||
											project.LeaderUserId == userId ||
											 context.ProjectTeamMembers.Any(member =>
												 member.UserId == userId &&
												 context.ProjectTeams.Any(team =>
													 team.Id == member.ProjectTeamId &&
													 team.ProjectId == project.Id)))
									  select project.Id).Any();

			return accessibleProjects;
		}
		public List<GetAllProjectDto> GetAllByCustomerAndUser(long customerId, long userId)
		{
			using var context = new PortalContext();
			var leaderProjects = context.Projects
				.Where(p => p.LeaderUserId == userId)
				.ToList();

			var customerProjects = context.Projects
				.Where(p => p.CustomerId == customerId || p.LeaderUserId == userId)
				.Select(project => new GetAllProjectDto
				{
					Id = project.Id,
					ProjectName = project.ProjectName,
					Description = project.Description,
					ProjectType = context.ProjectTypes.Single(type => type.Id == project.ProjectTypeId),
					ProjectTeams = context.ProjectTeams.Where(team => team.ProjectId == project.Id).ToList(),
					IsActive = project.IsActive,
					FinishDate = project.FinishDate,
					StartDate = project.StartDate,
				}).ToList();

			var userAdditionalProjects = context.ProjectTeamMembers
				.Where(member => member.UserId == userId)
				.Join(context.ProjectTeams, member => member.ProjectTeamId, team => team.Id, (member, team) => team)
				.Join(context.Projects, team => team.ProjectId, project => project.Id, (team, project) => project)
				.Where(project => project.CustomerId != customerId)
				.ToList()
				.Where(project => !customerProjects.Any(cp => cp.Id == project.Id) || leaderProjects.Any(lp => lp.Id == project.Id))
				.Select(project => new GetAllProjectDto
				{
					Id = project.Id,
					ProjectName = project.ProjectName,
					Description = project.Description,
					ProjectType = context.ProjectTypes.Single(type => type.Id == project.ProjectTypeId),
					ProjectTeams = context.ProjectTeams.Where(team => team.ProjectId == project.Id).ToList(),
					IsActive = project.IsActive,
					FinishDate = project.FinishDate,
					StartDate = project.StartDate,
				}).ToList();

			var allProjects = customerProjects.Concat(userAdditionalProjects)
								   .GroupBy(project => project.Id)
								   .Select(group => group.First())
								   .ToList();

			return allProjects;
		}

		public List<GetAllProjectDto> GetAllAsDto()
		{
			using var context = new PortalContext();
			var result = context.Projects.Select(project => new GetAllProjectDto
			{
				Id = project.Id,
				ProjectName = project.ProjectName,
				Description = project.Description,
				ProjectType = context.ProjectTypes.Where(type => type.Id.Equals(project.ProjectTypeId)).Single(),
				ProjectTeams = context.ProjectTeams.Where(team => team.ProjectId.Equals(project.Id)).ToList(),
				IsActive = project.IsActive,
				FinishDate = project.FinishDate,
				StartDate = project.StartDate,
			}).ToList();
			return result;
		}


		public GetProjectDto GetById(long projectId)
		{
			using var context = new PortalContext();
			var result = context.Projects.Where(p => p.Id.Equals(projectId)).Select(project => new GetProjectDto
			{
				Id = project.Id,
				ProjectName = project.ProjectName,
				Description = project.Description,
				ProjectType = context.ProjectTypes.Where(type => type.Id.Equals(project.ProjectTypeId)).Single(),
				ProjectLeader = context.Users.Where(u => u.Id.Equals(project.LeaderUserId)).Select(user => new ProjectMemberDto
				{
					Id = user.Id,
					Name = user.Name,
					ImageUrl = user.ImageUrl,
					IsActive = user.IsActive,
				}).Single(),
				Customer = context.Customers.Where(c => c.CustomerId.Equals(project.CustomerId)).Select(customer => new BasicCustomerDto
				{
					CustomerId = customer.CustomerId,
					CustomerName = customer.CustomerName,
				}).Single(),
				IsActive = project.IsActive,
				StartDate = project.StartDate,
				FinishDate = project.FinishDate

			}).SingleOrDefault();

			return result;
		}

		public List<BasicProjectDto> GetAllAsBasicByCustomerAndUser(long customerId, long userId)
		{
			using var context = new PortalContext();
			var leaderProjects = context.Projects
				.Where(p => p.LeaderUserId == userId)
				.Select(project => new BasicProjectDto
				{
					Id = project.Id,
					ProjectName = project.ProjectName
				})
				.ToList();

			var customerProjects = context.Projects
				.Where(p => p.CustomerId == customerId || p.LeaderUserId == userId)
				.Select(project => new BasicProjectDto
				{
					Id = project.Id,
					ProjectName = project.ProjectName
				})
				.ToList();

			var userAdditionalProjects = context.ProjectTeamMembers
				.Where(member => member.UserId == userId)
				.Join(context.ProjectTeams, member => member.ProjectTeamId, team => team.Id, (member, team) => team)
				.Join(context.Projects, team => team.ProjectId, project => project.Id, (team, project) => project)
				.Where(project => project.CustomerId != customerId)
				.ToList()
				.Where(project => !customerProjects.Any(cp => cp.Id == project.Id) || leaderProjects.Any(lp => lp.Id == project.Id))
				.Select(project => new BasicProjectDto
				{
					Id = project.Id,
					ProjectName = project.ProjectName
				})
				.ToList();

			var allProjects = customerProjects.Concat(userAdditionalProjects).Concat(leaderProjects)
								   .GroupBy(project => project.Id)
								   .Select(group => group.First())
								   .ToList();

			return allProjects;
		}


		public List<BasicProjectDto> GetAllAsBasic()
		{
			using var context = new PortalContext();
			var result = context.Projects.Select(project => new BasicProjectDto
			{
				Id = project.Id,
				ProjectName = project.ProjectName
			}).ToList();
			return result;
		}
		public List<BasicProjectDto> GetLeaderProjectsByUser(long userId)
		{
			using var context = new PortalContext();
			var result = context.Projects.Where(p => p.LeaderUserId.Equals(userId)).Select(project => new BasicProjectDto
			{
				Id = project.Id,
				ProjectName = project.ProjectName
			}).ToList();
			return result;
		}

	}
}
