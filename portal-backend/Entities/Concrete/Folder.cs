namespace Entities.Concrete
{
    public class Folder
    {
        public Guid Id { get; set; }
        public string Title { get; set; }
        public long CreatedBy { get; set; }
        public bool IsPrivate { get; set; }
        public bool IsFavorite { get; set; }
        public bool IsDeleted { get; set; }
    }
}
