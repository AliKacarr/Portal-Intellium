namespace Entities.Concrete
{
    public class ProjectTeamMember
    {
        public long Id { get; set; }
        public long ProjectTeamId { get; set; }
        public long UserId { get; set; }
        public string ProjectRole { get; set; }
    }
}
