using Business.Repository.ProjectRepository;
using Entities.DTOs.ProjectDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
	[Route("api/[controller]")]
	[ApiController]
	public class ProjectController : ControllerBase
	{
		private readonly IProjectService _projectService;

		public ProjectController(IProjectService projectService)
		{
			_projectService = projectService;
		}

		[HttpPost("add")]
		public IActionResult Add(AddProjectDto project)
		{
			var result = _projectService.Add(project);
			if (result.Success)
			{
				return Ok(result);
			}
			return BadRequest(result);
		}

		[HttpPut("update")]
		public IActionResult Update(UpdateProjectDto project)
		{
			var result = _projectService.Update(project);
			if (result.Success)
			{
				return Ok(result);
			}
			return BadRequest(result);
		}
		[HttpGet("getAll")]
		public IActionResult GetAll()
		{
			var result = _projectService.GetAllAsDto();
			if (result.Success)
			{
				return Ok(result);
			}
			return BadRequest(result);
		}
		[HttpGet("getAllAsBasic")]
		public IActionResult GetAllAsBasic()
		{
			var result = _projectService.GetAllAsBasic();
			if (result.Success)
			{
				return Ok(result);
			}
			return BadRequest(result);
		}
		[HttpGet("GetLeaderProjects")]
		public IActionResult GetLeaderProjects()
		{
			var result = _projectService.GetLeaderProjectsByUser();
			if (result.Success)
			{
				return Ok(result);
			}
			return BadRequest(result);
		}
		[HttpGet("getById")]
		public IActionResult Get(long id)
		{
			var result = _projectService.GetById(id);
			if (result.Success)
			{
				return Ok(result);
			}
			return BadRequest(result);
		}
	}
}
