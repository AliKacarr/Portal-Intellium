using Business.Repository.BoardMemberRepository;
using Entities.DTOs.BoardMemberDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BoardMembersController : ControllerBase
    {
        private readonly IBoardMemberService _boardMemberService;

        public BoardMembersController(IBoardMemberService boardMemberService)
        {
            _boardMemberService = boardMemberService;
        }

        [HttpPost("add")]
        public ActionResult Add([FromBody] AddBoardMembersDto boardMembers)
        {
            var result = _boardMemberService.Add(boardMembers);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("delete")]
        public ActionResult Delete(int boardMemberId)
        {
            var result = _boardMemberService.Delete(boardMemberId);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }


        [HttpGet("getall")]
        public ActionResult GetAllByBoardIdWithUsers(int boardId)
        {
            var result = _boardMemberService.GetAllByBoardIdWithUsers(boardId);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }
    }
}
