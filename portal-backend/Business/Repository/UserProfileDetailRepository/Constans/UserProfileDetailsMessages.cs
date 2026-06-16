namespace Business.Repository.UserProfileDetailRepository.Constans
{
    public static class UserProfileDetailsMessages
    {
        public const string AddedUserProfileDetail = "Kullanıcı profil bilgileri başarıyla eklendi.";
        public const string UpdatedUserProfileDetail = "Kullanıcı profil bilgileri başarıyla güncellendi.";
        public const string DeletedUserProfileDetail = "Kullanıcı profil bilgileri başarıyla silindi.";
        public const string GetUserProfileDetail = "Kullanıcı profil bilgileri listelendi.";
        public const string UserProfileDetailNotFound = "Kullanıcı profil bilgileri bulunamadı.";
        public const string TCInvalidLengthMessage = "TC Kimlik Numarası 11 haneli olmalıdır.";
        public const string TCEmptyMessage = "TC Kimlik Numarası boş olamaz.";
        public const string IBANEmpty = "IBAN numarası boş olamaz.";
        public const string IBANMustStartWithTR = "IBAN numarası 'TR' ile başlamalıdır.";
        public const string IBANLengthMustBe26 = "IBAN numarası toplamda 26 karakter olmalıdır.";
        public const string MilitaryCaseRequiredForMale = "Erkek kullanıcılar için askerlik durumu zorunludur.";

    }
}
