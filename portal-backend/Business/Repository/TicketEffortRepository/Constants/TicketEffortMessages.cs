namespace Business.Repository.TicketEffortRepository.Constants
{
    public static class TicketEffortMessages
    {
        public const string EffortRequired = "Efor süresi 0'dan büyük olmalıdır.";
        public const string DescriptionRequired = "Açıklama alanı boş olamaz.";
        public const string DescriptionMaxLength = "Açıklama en fazla 500 karakter olmalıdır.";
        public const string EffortAddedSuccessfully = "Efor başarıyla eklendi.";
        public const string EffortNotFound = "Efor bulunamadı.";
        public const string EffortDeletedSuccessfully = "Efor başarıyla silindi.";
    }
}
