namespace Entities.Concrete
{
    public class UserEducationDetail
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string CompletedEducation { get; set; } // Tamamlanan Eğitim
        public string School { get; set; }
        public string Department { get; set; } //Bölüm
        public string Scholarship { get; set; } //Burs Tipi
        public double GradePoint { get; set; } // Ortalama
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }

    }
}
