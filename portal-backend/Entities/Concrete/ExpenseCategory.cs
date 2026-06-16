namespace Entities.Concrete
{
    /// <summary>
    /// Masraf kategorisi.
    /// value: Kategori adı
    /// system: true ise sistem kategorisi (silinemez), false ise özel kategori
    /// visible: Görünürlük (formlarda listelenir mi)
    /// aliases: Eski adlar (ad değiştiğinde eklenir, DB'de JSON olarak saklanır)
    /// </summary>
    public class ExpenseCategory
    {
        public int Id { get; set; }
        public string Value { get; set; } = string.Empty;
        public bool System { get; set; }
        public bool Visible { get; set; } = true;
        /// <summary>Eski adlar - DB'de JSON olarak saklanır.</summary>
        public string AliasesJson { get; set; } = "[]";
    }
}
