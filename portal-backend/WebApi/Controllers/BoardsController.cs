using Business.Helpers;
using Business.Repository.BoardRepository;
using Entities.DTOs.BoardDtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class BoardsController : ControllerBase
	{
		private const string ServiceClientName = "PortalMeet";
		private const string ServiceKeyHeaderName = "X-Service-Key";
		private readonly IBoardService _boardService;
		private readonly IServiceKeyValidator _serviceKeyValidator;
		public BoardsController(IBoardService boardService, IServiceKeyValidator serviceKeyValidator)
		{
			_boardService = boardService;
			_serviceKeyValidator = serviceKeyValidator;
		}

		[HttpGet("getall")]
		public IActionResult GetAll()
		{
			var result = _boardService.GetAll();
			return (result.Success) ? Ok(result) : BadRequest(result);
		}
		[HttpGet("getallbasic")]
		public IActionResult GetAllBasic()
		{
			var result = _boardService.GetAllBasic();
			return (result.Success) ? Ok(result) : BadRequest(result);
		}
		[HttpGet("get")]
		public IActionResult Get(int boardId)
		{
			var result = _boardService.Get(boardId);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		[AllowAnonymous]
		[HttpGet("getallwithlistsbyemail")]
		public IActionResult GetAllWithListsByEmail(string email)
		{
			if (!HasValidServiceKey())
				return Unauthorized("Geçersiz servis anahtarı.");

			var result = _boardService.GetAllWithTaskListsByEmail(email);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		[HttpPost("add")]
		public IActionResult AddBoard([FromBody] AddBoardDto board)
		{
			var result = _boardService.Add(board);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}
		[HttpDelete("delete")]
		public IActionResult DeleteBoard(int boardId)
		{
			var result = _boardService.Delete(boardId);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}
		[HttpPut("update")]
		public IActionResult UpdateBoard([FromBody] EditBoardDto board)
		{
			var result = _boardService.Update(board);
			return (result.Success) ? Ok(result) : BadRequest(result);
		}

		private bool HasValidServiceKey()
		{
			var serviceKey = Request.Headers[ServiceKeyHeaderName].FirstOrDefault();
			return _serviceKeyValidator.IsValid(ServiceClientName, serviceKey);
		}
	}
}
