namespace Entities.DTOs.ProjectDtos
{
    public class ProjectForProjectTeamDetailDto
    {
        public long Id { get; set; }
        public string ProjectName { get; set; }
        public string Description { get; set; }
        public ProjectLeaderDto Leader { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime FinishDate { get; set; }
        public bool IsActive { get; set; }
    }
}
