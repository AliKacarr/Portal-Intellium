namespace Entities.Concrete
{
    public class Customer
    {
        public long CustomerId { get; set; }
        public string CustomerName { get; set; } //Müşteri adı
        public string CustomerShortName { get; set; } //Müşteri kısa adı
        public string Address { get; set; } //Adres
        public string City { get; set; } //Şehir
        public string Country { get; set; } //Ülke
        public string PostalCode { get; set; } //Posta kodu
        public string AuthorizedPersonFullName { get; set; } //Yetkili kişi Tam Adı
        public string AuthorizedPersonMail { get; set; } //Yetkili Kişi Mail
        public string AuthorizedPersonTitle { get; set; } //Yetkili Kişi Unvan
        public string AuthorizedPersonPhone { get; set; } //Yetkili Kişi Telefon
        public string? BankName { get; set; } //Banka adı
        public string? BankAccountNumber { get; set; } //Banka hesap numarası
        public string? Website { get; set; } //Website
        public string Phone { get; set; } //Telefon
        public string TaxDepartment { get; set; } //Vergi dairesi
        public string TaxIdNumber { get; set; } //Vergi numarası
        public string LicenceType { get; set; } //Lisans tipi
        public string LicenceKey { get; set; } //Lisans anahtarı
        public DateTime? LicenceStartDate { get; set; } //Lisans başlangıç tarihi
        public DateTime? LicenceFinishDate { get; set; } //Lisans bitiş tarihi
        public DateTime AddetAt { get; set; }
        public bool IsActive { get; set; }
    }
}
