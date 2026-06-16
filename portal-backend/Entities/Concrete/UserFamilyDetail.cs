namespace Entities.Concrete
{
    public class UserFamilyDetail
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string Name { get; set; }
        public string Surname { get; set; }
        public string Relationship { get; set; } //Anne , Baba vs.
        public string TelNo { get; set; }
        public DateTime BirthDate { get; set; }
        public string TC { get; set; }

    }
}
