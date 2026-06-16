using Core.DataAccess.EntityFramework;
using DataAccess.Concrete.EntityFramework.Context;
using Entities.Concrete;
using Entities.DTOs.BoardDtos;
using Entities.DTOs.BoardMemberDtos;
using Entities.DTOs.ProjectDtos;
using Entities.DTOs.UserDtos;

namespace DataAccess.Repository.BoardRepository
{
	public class EfBoardDal : EfEntityRepositoryBase<Board, PortalContext>, IBoardDal
	{
		public bool CanUserAccessToBoard(int boardId, long userId)
		{
			using var context = new PortalContext();
			var board = context.Boards.FirstOrDefault(b => b.Id == boardId);
			if (board == null)
				return false;


			if (board.CreatedUserId == userId)
				return true;

			if (!board.PrivateToProjectMembers)
			{
				var isProjectMember = context.ProjectTeams
					.Where(team => team.ProjectId == board.ProjectId)
					.SelectMany(team => context.ProjectTeamMembers
						.Where(member => member.ProjectTeamId == team.Id && member.UserId == userId))
					.Any();

				var isBoardMember = context.BoardMembers
					.Any(bm => bm.BoardId == boardId && bm.UserId == userId);

				if (isProjectMember || isBoardMember)
					return true;
			}

			if (board.PrivateToProjectMembers)
			{
				var isBoardMember = context.BoardMembers
					.Any(bm => bm.BoardId == boardId && bm.UserId == userId);
				if (isBoardMember)
					return true;
			}

			return false;
		}

		public List<BasicBoardDto> GetAllBasicBoards()
		{
			using var context = new PortalContext();
			var result = context.Boards.Select(board => new BasicBoardDto
			{
				Id = board.Id,
				Category = context.BoardCategories.FirstOrDefault(category => category.Id == board.CategoryId)!,
				Name = board.Name,
				AvatarPath = board.AvatarPath,
			}).ToList();

			return result;
		}

		public List<BasicBoardDto> GetAllBasicBoardsByUser(long userId)
		{
			using var context = new PortalContext();
			var filteredBoards = (from board in context.Boards
								  where (
									  board.CreatedUserId == userId ||

									  (!board.PrivateToProjectMembers &&
									   (context.ProjectTeams
										   .Where(team => team.ProjectId == board.ProjectId)
										   .SelectMany(team => context.ProjectTeamMembers
											   .Where(member => member.ProjectTeamId == team.Id && member.UserId == userId))
										   .Any()
										||
										context.BoardMembers.Any(bm => bm.BoardId == board.Id && bm.UserId == userId))
									  )
									  ||
									  (board.PrivateToProjectMembers &&
									   context.BoardMembers.Any(bm => bm.BoardId == board.Id && bm.UserId == userId))
								  )
								  select board).ToList();

			var result = filteredBoards.Select(board => new BasicBoardDto
			{
				Id = board.Id,
				Category = context.BoardCategories.FirstOrDefault(category => category.Id == board.CategoryId)!,
				Name = board.Name,
				AvatarPath = board.AvatarPath,
			}).ToList();

			return result;
		}

		public List<BoardDto> GetAllBoards()
		{
			using var context = new PortalContext();
			var result = context.Boards.Select(board => new BoardDto
			{
				Id = board.Id,
				Project = context.Projects.Where(project => project.Id == board.ProjectId).Select(project => new BasicProjectDto
				{
					Id = project.Id,
					ProjectName = project.ProjectName
				}).FirstOrDefault()!,
				Category = context.BoardCategories.FirstOrDefault(category => category.Id == board.CategoryId)!,
				Name = board.Name,
				AvatarPath = board.AvatarPath,
				PrivateToProjectMembers = board.PrivateToProjectMembers,
				StartDate = board.StartDate,
				EndDate = board.EndDate,
				CreatedUser = context.Users
				.Where(user => user.Id == board.CreatedUserId)
				.Select(user => new BaseUserDto
				{
					Id = user.Id,
					ImageUrl = user.ImageUrl,
					Name = user.Name,
					IsActive = user.IsActive
				}).FirstOrDefault()!,
				BoardMembers = (from boardMember in context.BoardMembers
								join user in context.Users on boardMember.UserId equals user.Id
								where boardMember.BoardId == board.Id
								select new BoardMemberDto
								{
									Id = boardMember.Id,
									UserId = boardMember.UserId,
									Email = user.Email,
									ImageUrl = user.ImageUrl,
									Name = user.Name
								}).ToList()
			}).ToList();

			return result;
		}

		public List<BoardDto> GetAllBoardsByUser(long userId)
		{
			using var context = new PortalContext();

			var filteredBoards = (from board in context.Boards
								  where (
									  // Kullanıcı board'un sahibiyse erişebilir
									  board.CreatedUserId == userId ||

									  // PrivateToProjectMembers false ise hem proje üyesi hem de board üyesi erişebilir
									  (!board.PrivateToProjectMembers &&
									   (context.ProjectTeams
										   .Where(team => team.ProjectId == board.ProjectId)
										   .SelectMany(team => context.ProjectTeamMembers
											   .Where(member => member.ProjectTeamId == team.Id && member.UserId == userId))
										   .Any()
										||
										context.BoardMembers.Any(bm => bm.BoardId == board.Id && bm.UserId == userId))
									  )

									  // PrivateToProjectMembers true ise sadece board üyeleri erişebilir
									  ||
									  (board.PrivateToProjectMembers &&
									   context.BoardMembers.Any(bm => bm.BoardId == board.Id && bm.UserId == userId))
								  )
								  select board).ToList();

			var result = filteredBoards.Select(board => new BoardDto
			{
				Id = board.Id,
				Project = context.Projects.Where(project => project.Id == board.ProjectId)
					.Select(project => new BasicProjectDto
					{
						Id = project.Id,
						ProjectName = project.ProjectName
					}).FirstOrDefault()!,

				Category = context.BoardCategories.FirstOrDefault(category => category.Id == board.CategoryId)!,
				Name = board.Name,
				AvatarPath = board.AvatarPath,
				PrivateToProjectMembers = board.PrivateToProjectMembers,
				StartDate = board.StartDate,
				EndDate = board.EndDate,

				CreatedUser = context.Users
					.Where(user => user.Id == board.CreatedUserId)
					.Select(user => new BaseUserDto
					{
						Id = user.Id,
						ImageUrl = user.ImageUrl,
						Name = user.Name,
						IsActive = user.IsActive,
					}).FirstOrDefault()!,

				BoardMembers = (from boardMember in context.BoardMembers
								join user in context.Users on boardMember.UserId equals user.Id
								where boardMember.BoardId == board.Id
								select new BoardMemberDto
								{
									Id = boardMember.Id,
									UserId = boardMember.UserId,
									Email = user.Email,
									ImageUrl = user.ImageUrl,
									Name = user.Name
								}).ToList()
			}).ToList();

			return result;
		}

		public BoardDto GetBoard(int boardId)
		{
			using var context = new PortalContext();
			var result = context.Boards
			.Where(board => board.Id == boardId)
			.Select(board => new BoardDto
			{
				Id = board.Id,
				Project = context.Projects.Where(project => project.Id == board.ProjectId).Select(project => new BasicProjectDto
				{
					Id = project.Id,
					ProjectName = project.ProjectName
				}).FirstOrDefault()!,
				Category = context.BoardCategories.FirstOrDefault(category => category.Id == board.CategoryId)!,
				Name = board.Name,
				AvatarPath = board.AvatarPath,
				PrivateToProjectMembers = board.PrivateToProjectMembers,
				StartDate = board.StartDate,
				EndDate = board.EndDate,
				CreatedUser = context.Users
					.Where(user => user.Id == board.CreatedUserId)
					.Select(user => new BaseUserDto
					{
						Id = user.Id,
						ImageUrl = user.ImageUrl,
						Name = user.Name,
						IsActive = user.IsActive,

					})
					.FirstOrDefault()!,
				BoardMembers = (from boardMember in context.BoardMembers
								join user in context.Users on boardMember.UserId equals user.Id
								where boardMember.BoardId == board.Id
								select new BoardMemberDto
								{
									Id = boardMember.Id,
									UserId = boardMember.UserId,
									Email = user.Email,
									ImageUrl = user.ImageUrl,
									Name = user.Name
								}).ToList()

			})
			.SingleOrDefault();

			return result;
		}

		public Board GetBoardByTaskId(int taskId)
		{
			using var context = new PortalContext();

			var result = (from task in context.Tasks
						 join taskList in context.TaskLists on task.TaskListId equals taskList.Id
						 join board in context.Boards on taskList.BoardId equals board.Id
						 where task.Id == taskId
						 select board).FirstOrDefault();

			return result;
		}

	}
}
