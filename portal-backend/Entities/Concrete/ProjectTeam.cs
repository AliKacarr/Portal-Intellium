namespace Entities.Concrete
{
    public class ProjectTeam
    {
        public long Id { get; set; }
        public string Name { get; set; }
        public long ProjectId { get; set; }
        public string Description { get; set; }
    }
}
