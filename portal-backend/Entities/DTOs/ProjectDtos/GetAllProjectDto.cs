using Entities.Concrete;

namespace Entities.DTOs.ProjectDtos
{
    public class GetAllProjectDto
    {
        public long Id { get; set; }
        public string ProjectName { get; set; }
        public string Description { get; set; }
        public ProjectType ProjectType { get; set; }
        public List<ProjectTeam> ProjectTeams { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime FinishDate { get; set; }
        public bool IsActive { get; set; }
    }
}
