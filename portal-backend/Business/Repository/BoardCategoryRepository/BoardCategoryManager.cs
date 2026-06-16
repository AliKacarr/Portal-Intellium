using Business.BusinessAspects;
using Business.Repository.BoardCategoryRepository.Constants;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.BoardRepository;
using Entities.Concrete;

namespace Business.Repository.BoardCategoryRepository
{
	public class BoardCategoryManager : IBoardCategoryService
	{
		private readonly IBoardCategoryDal _boardCategoryDal;

		public BoardCategoryManager(IBoardCategoryDal boardCategoryDal)
		{
			_boardCategoryDal = boardCategoryDal;
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		public IResult Add(BoardCategory boardCategory)
		{
			_boardCategoryDal.Add(boardCategory);
			return new SuccessResult(BoardCategoryMessages.AddedBoardCategory);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		public IResult Delete(int boardCategoryId)
		{
			var result = _boardCategoryDal.Get(p => p.Id.Equals(boardCategoryId));
			if (result == null) return new ErrorResult(BoardCategoryMessages.BoardCategoryNotFound);

			_boardCategoryDal.Delete(result);
			return new SuccessResult(BoardCategoryMessages.DeletedBoardCategory);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<List<BoardCategory>> GetAll()
		{
			var result = _boardCategoryDal.GetAll();
			return new SuccessDataResult<List<BoardCategory>>(result, BoardCategoryMessages.BoardCategoryListed);
		}

		public IDataResult<BoardCategory> GetById(int id)
		{
			var result = _boardCategoryDal.Get(bc => bc.Id.Equals(id));
			return result != null ? new SuccessDataResult<BoardCategory>(result)
				: new ErrorDataResult<BoardCategory>(BoardCategoryMessages.BoardCategoryNotFound);
		}

		[LoggerAspect]
		[SecuredOperation(RoleNames.Admin)]
		public IResult Update(BoardCategory boardCategory)
		{
			var result = _boardCategoryDal.Get(p => p.Id.Equals(boardCategory.Id));
			if (result == null) return new ErrorResult(BoardCategoryMessages.BoardCategoryNotFound);

			result.Name = boardCategory.Name;
			_boardCategoryDal.Update(result);
			return new SuccessResult(BoardCategoryMessages.UpdatedBoardCategory);
		}
	}
}
