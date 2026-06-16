namespace Entities.Concrete
{
    /// <summary>
    /// Masraf ayarları - tek satır (singleton) olarak tutulur.
    /// mealAcceptedDailyAmount: Günlük kabul edilen yemek tutarı (₺)
    /// previousPeriodCutoffDay: Önceki dönem fatura son giriş günü (1-31)
    /// vatRates: KDV oranları dizisi (JSON olarak saklanır)
    /// </summary>
    public class ExpenseSettings
    {
        public int Id { get; set; }
        public int MealAcceptedDailyAmount { get; set; } = 500;
        public int PreviousPeriodCutoffDay { get; set; } = 5;
        /// <summary>KDV oranları - DB'de JSON olarak saklanır, API'de List olarak döner.</summary>
        public string VatRatesJson { get; set; } = "[1,10,20]";
    }
}
