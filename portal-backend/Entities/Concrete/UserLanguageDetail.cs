namespace Entities.Concrete
{
    public class UserLanguageDetail
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string ForeignLanguage { get; set; } //Yabancı Dil Bilgisi
        public string Read { get; set; }
        public string Write { get; set; }
        public string Speaking { get; set; }
        public string? DocumentPath { get; set; }

    }
}
