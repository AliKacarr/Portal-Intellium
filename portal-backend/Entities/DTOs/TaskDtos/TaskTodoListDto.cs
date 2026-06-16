using Entities.Concrete;

namespace Entities.DTOs.TaskDtos
{
    public class TaskTodoListDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public List<TaskTodo> TaskTodos { get; set; }
    }
}
