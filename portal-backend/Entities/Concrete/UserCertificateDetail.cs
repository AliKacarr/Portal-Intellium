namespace Entities.Concrete
{
    public class UserCertificateDetail
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public string CertificateName { get; set; }
        public string CertificateNo { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string InstitutionName { get; set; } // Kurum adı
        public double CertificateExamMark { get; set; } //sınav sonucu
    }
}
