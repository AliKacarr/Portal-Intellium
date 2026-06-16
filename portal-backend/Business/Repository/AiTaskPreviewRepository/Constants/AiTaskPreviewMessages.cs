namespace Business.Repository.AiTaskPreviewRepository.Constants
{
    public static class AiTaskPreviewMessages
    {
        public const string UserNotFound = "Bu e-posta adresine ait kullanıcı bulunamadı.";
        public const string EmptyPreviewList = "Kaydedilecek AI kartı bulunamadı.";
        public const string InvalidTaskList = "Seçilen liste geçersiz veya kullanıcı bu listeye erişemiyor.";
        public const string PreviewNotFound = "AI önizleme kartı bulunamadı.";
        public const string PreviewAlreadyProcessed = "Bu AI önizleme kartı artık beklemede değil.";
        public const string Imported = "AI kartları önizleme alanına kaydedildi.";
        public const string Updated = "AI önizleme kartı güncellendi.";
        public const string Approved = "Seçilen AI kartları scrum board'a aktarıldı.";
        public const string Rejected = "Seçilen AI kartları reddedildi.";
    }
}
