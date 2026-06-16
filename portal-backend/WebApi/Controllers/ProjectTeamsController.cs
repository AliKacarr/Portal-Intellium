using Business.Repository.ProjectTeamRepository;
using Entities.DTOs.ProjectTeamDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProjectTeamsController : ControllerBase
    {
        private readonly IProjectTeamService _projectTeamService;

        public ProjectTeamsController(IProjectTeamService projectTeamService)
        {
            _projectTeamService = projectTeamService;
        }

        [HttpPost("add")]
        public IActionResult Add(AddProjectTeamDto addProjectTeamDto)
        {
            var result = _projectTeamService.Add(addProjectTeamDto);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getall")]
        public IActionResult GetAll()
        {
            var result = _projectTeamService.GetAll();
            return (result.Success) ? Ok(result) : BadRequest(result);
        }
        [HttpGet("getallbyproject")]
        public IActionResult GetAllByProject(long projectId)
        {
            var result = _projectTeamService.GetAllByProject(projectId);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpGet("getbyid")]
        public IActionResult GetById(long id)
        {
            var result = _projectTeamService.GetById(id);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpDelete("delete")]
        public IActionResult Delete(long id)
        {
            var result = _projectTeamService.Delete(id);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update(EditProjectTeamDto editProjectTeam)
        {
            var result = _projectTeamService.Update(editProjectTeam);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

    }
}
