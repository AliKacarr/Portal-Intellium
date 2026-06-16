namespace Business.Repository.ExpenseCategoryRepository.Constants
{
    public static class ExpenseCategoryMessages
    {
        public const string CategoryNotFound = "Kategori bulunamadı.";
        public const string CategoryAdded = "Masraf kategorisi eklendi.";
        public const string CategoryUpdated = "Masraf kategorisi güncellendi.";
        public const string CategoryDeleted = "Masraf kategorisi silindi.";
        public const string CategoryListed = "Masraf kategorileri listelendi.";
        public const string SystemCategoryCannotBeDeleted = "Sistem kategorileri silinemez.";
        public const string SystemCategoryCannotBeRenamed = "Sistem kategorileri yeniden adlandırılamaz.";
        public const string CategoryNameRequired = "Kategori adı boş olamaz.";
        public const string CategoryAlreadyExists = "Bu kategori zaten mevcut.";
    }
}
