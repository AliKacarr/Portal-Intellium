namespace Entities.Concrete
{
    public class UserJobExperience
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string CompanyName { get; set; } // Kurum adı
        public string JobTitle { get; set; } // İş ünvanı
        public string Duty { get; set; } // Görev
        public DateTime StartDate { get; set; } // Başlangıç tarihi
        public DateTime? DepartureDate { get; set; } // Ayrılış tarihi


    }
}
