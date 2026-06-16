using AutoMapper;
using Business.BusinessAspects;
using Business.Repository.BoardMemberRepository;
using Business.Repository.BoardRepository.Constants;
using Business.Repository.BoardRepository.Validations;
using Business.Repository.TaskListRepository;
using Business.Repository.UserRepository;
using Core.Aspects.Autofac.Validation;
using Core.Identity;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using DataAccess.Repository.BoardRepository;
using Entities.Concrete;
using Entities.DTOs.BoardDtos;
using Entities.DTOs.BoardMemberDtos;

namespace Business.Repository.BoardRepository
{
	public class BoardManager : IBoardService
	{
		private readonly IBoardDal _boardDal;
		private readonly ITaskListService _taskListService;
		private readonly IBoardMemberService _boardMemberService;
		private readonly IUserService _userService;
		private readonly IMapper _mapper;
		private readonly IUserContext _userContext;

		public BoardManager(IBoardDal boardDal, ITaskListService taskListService, IBoardMemberService boardMemberService, IUserService userService, IMapper mapper, IUserContext userContext)
		{
			_boardDal = boardDal;
			_taskListService = taskListService;
			_boardMemberService = boardMemberService;
			_userService = userService;
			_mapper = mapper;
			_userContext = userContext;
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(AddBoardValidator))]
		public IResult Add(AddBoardDto addBoardDto)
		{
			Board board = _mapper.Map<Board>(addBoardDto);
			board.CreatedUserId = _userContext.UserId;

			_boardDal.Add(board);
			_boardMemberService.Add(new AddBoardMembersDto
			{
				BoardId = board.Id,
				UserIds = new List<long> { _userContext.UserId }
			});
			return new SuccessResult(BoardMessages.AddedBoard);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(DeleteBoardValidator))]
		public IResult Delete(int boardId)
		{
			var removedBoard = _boardDal.Get(p => p.Id.Equals(boardId));

			var removedTaskLists = _taskListService.GetAllByBoardId(boardId).Data;
			var removedBoardMembers = _boardMemberService.GetAllByBoardId(boardId).Data;

			if (removedTaskLists != null) _taskListService.DeleteAll(removedTaskLists);
			if (removedBoardMembers != null) _boardMemberService.DeleteAll(removedBoardMembers);


			_boardDal.Delete(removedBoard);
			return new SuccessResult(BoardMessages.DeletedBoard);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(GetBoardValidator))]
		public IDataResult<BoardDto> Get(int boardId)
		{
			var result = _boardDal.GetBoard(boardId);
			return new SuccessDataResult<BoardDto>(result);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<List<BoardDto>> GetAll()
		{
			List<BoardDto> result = _userContext.RoleName.Equals(RoleNames.Admin)
				? _boardDal.GetAllBoards() : _boardDal.GetAllBoardsByUser(_userContext.UserId);

			return new SuccessDataResult<List<BoardDto>>(result);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		public IDataResult<List<BasicBoardDto>> GetAllBasic()
		{
			List<BasicBoardDto> result = _userContext.RoleName.Equals(RoleNames.Admin)
				? _boardDal.GetAllBasicBoards() : _boardDal.GetAllBasicBoardsByUser(_userContext.UserId);

			return new SuccessDataResult<List<BasicBoardDto>>(result);
		}

		public IDataResult<List<BoardWithTaskListsDto>> GetAllWithTaskListsByEmail(string email)
		{
			if (string.IsNullOrWhiteSpace(email))
				return new ErrorDataResult<List<BoardWithTaskListsDto>>(BoardMessages.UserNotFoundByEmail);

			var user = _userService.GetByMail(email.Trim());
			if (user == null)
				return new ErrorDataResult<List<BoardWithTaskListsDto>>(BoardMessages.UserNotFoundByEmail);

			var boards = _boardDal.GetAllBoardsByUser(user.Id);
			var result = boards.Select(board => new BoardWithTaskListsDto
			{
				Name = board.Name,
				TaskLists = _taskListService.GetAllByBoardId(board.Id).Data?
					.OrderBy(taskList => taskList.OrderNo)
					.Select(taskList => new BoardTaskListDto
					{
						Id = taskList.Id,
						Name = taskList.Name,
						OrderNo = taskList.OrderNo
					}).ToList() ?? new List<BoardTaskListDto>()
			}).ToList();

			return new SuccessDataResult<List<BoardWithTaskListsDto>>(result);
		}

		[LoggerAspect]
		[SecuredOperation($"{RoleNames.User},{RoleNames.Worker},{RoleNames.Admin}")]
		[ValidationAspect(typeof(UpdateBoardValidator))]
		public IResult Update(EditBoardDto board)
		{
			var updatedBoard = _boardDal.Get(p => p.Id.Equals(board.Id));
			_mapper.Map(board, updatedBoard);
			_boardDal.Update(updatedBoard);
			return new SuccessResult(BoardMessages.UpdatedBoard);
		}
	}
}
