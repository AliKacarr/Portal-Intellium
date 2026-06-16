using Business.Repository.TaskRepository;
using Entities.DTOs.TaskDtos;
using Microsoft.AspNetCore.Mvc;

namespace WebApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskservice;
        
        public TasksController(ITaskService taskservice)
        {
            _taskservice = taskservice;
        }

        [HttpGet("getbyid")]
        public IActionResult GetById(int id)
        {
            var result = _taskservice.GetById(id);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpPost("add")]
        public IActionResult Add([FromBody] AddTaskDto addTaskDto)
        {
            var result = _taskservice.Add(addTaskDto);
            return (result.Success) ? Ok(result) : BadRequest(result);

        }

        [HttpDelete("delete")]
        public IActionResult Delete(int id)
        {
            var result = _taskservice.Delete(id);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpPut("update")]
        public IActionResult Update([FromBody] EditTaskDto editTaskDto)
        {
            var result = _taskservice.Update(editTaskDto);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }

        [HttpPatch("updateorder")]
        public IActionResult UpdateOrder([FromBody] List<TaskOrderEditDto> tasks)
        {
            var result = _taskservice.UpdateOrder(tasks);
            return (result.Success) ? Ok(result) : BadRequest(result);
        }


    }
}
