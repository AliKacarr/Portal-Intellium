using Entities.Concrete;

namespace Entities.DTOs.TaskDtos
{
    public class TaskViewDto
    {
        public Concrete.Task Task { get; set; }
        public List<TaskMemberDto> TaskMembers { get; set; }
        public List<TaskLabelDto> TaskLabels { get; set; }

    }
}
