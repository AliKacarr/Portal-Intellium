using Business.Repository.BoardCategoryRepository.Constants;
using Business.Repository.ProjectRepository.Constants;
using DataAccess.Repository.BoardRepository;
using DataAccess.Repository.ProjectRepository;
using Entities.DTOs.BoardDtos;
using FluentValidation;

namespace Business.Repository.BoardRepository.Validations
{
	public class AddBoardValidator : AbstractValidator<AddBoardDto>
	{
		private readonly IBoardCategoryDal _boardCategoryDal;
		private readonly IProjectDal _projectDal;
		public AddBoardValidator(IBoardCategoryDal boardCategoryDal, IProjectDal projectDal)
		{
			_boardCategoryDal = boardCategoryDal;
			_projectDal = projectDal;

			RuleFor(board => board.CategoryId).Must(CategoryExists).WithMessage(BoardCategoryMessages.BoardCategoryNotFound);
			RuleFor(board => board.ProjectId).Must(ProjectExists).WithMessage(ProjectMessages.ProjectNotFound);
		}

		private bool CategoryExists(int categoryId)
		{
			return _boardCategoryDal.Get(c => c.Id == categoryId) != null;
		}

		private bool ProjectExists(long projectId)
		{
			return _projectDal.Get(p => p.Id == projectId) != null;
		}
	}
}
