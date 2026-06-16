namespace Core.Constants
{
    /// <summary>Masraf kayıtlarında kullanılan para birimleri (ISO 4217). Tutarlar seçilen birimde saklanır; TL dönüşümü yapılmaz.</summary>
    public static class ExpenseCurrencyCodes
    {
        public const string Default = "TRY";

        /// <summary>İzin verilen kodlar (büyük/küçük harf duyarsız).</summary>
        public static readonly HashSet<string> Allowed = new(StringComparer.OrdinalIgnoreCase)
        {
            "TRY", "USD", "EUR", "GBP", "CHF", "JPY", "CNY",
            "SAR", "AED", "KWD", "QAR", "BHD", "OMR",
            "CAD", "AUD", "NZD",
            "SEK", "NOK", "DKK",
            "PLN", "CZK", "HUF", "RON", "BGN",
            "RUB", "INR", "KRW", "MXN", "BRL", "ZAR", "ILS", "EGP"
        };

        /// <summary>API / dropdown için gösterim listesi (sıralı).</summary>
        public static IReadOnlyList<ExpenseCurrencyOption> Options { get; } = new[]
        {
            new ExpenseCurrencyOption("TRY", "Türk Lirası", "₺"),
            new ExpenseCurrencyOption("USD", "ABD Doları", "$"),
            new ExpenseCurrencyOption("EUR", "Euro", "€"),
            new ExpenseCurrencyOption("GBP", "İngiliz Sterlini", "£"),
            new ExpenseCurrencyOption("CHF", "İsviçre Frangı", "CHF"),
            new ExpenseCurrencyOption("JPY", "Japon Yeni", "¥"),
            new ExpenseCurrencyOption("CNY", "Çin Yuanı", "CNY"),
            new ExpenseCurrencyOption("SAR", "Suudi Riyali", "SAR"),
            new ExpenseCurrencyOption("AED", "BAE Dirhemi", "AED"),
            new ExpenseCurrencyOption("CAD", "Kanada Doları", "$"),
            new ExpenseCurrencyOption("AUD", "Avustralya Doları", "$"),
            new ExpenseCurrencyOption("SEK", "İsveç Kronu", "kr"),
            new ExpenseCurrencyOption("NOK", "Norveç Kronu", "kr"),
            new ExpenseCurrencyOption("DKK", "Danimarka Kronu", "kr"),
            new ExpenseCurrencyOption("PLN", "Polonya Zlotisi", "zł"),
            new ExpenseCurrencyOption("INR", "Hindistan Rupisi", "₹"),
            new ExpenseCurrencyOption("RUB", "Rus Rublesi", "₽"),
            new ExpenseCurrencyOption("BRL", "Brezilya Reali", "R$"),
            new ExpenseCurrencyOption("ZAR", "Güney Afrika Randı", "R"),
        };

        public static bool IsAllowed(string? code)
        {
            if (string.IsNullOrWhiteSpace(code)) return true;
            return Allowed.Contains(code.Trim());
        }

        /// <summary>Boş veya null ise TRY; aksi halde trim + upper.</summary>
        public static string Normalize(string? code)
        {
            if (string.IsNullOrWhiteSpace(code)) return Default;
            return code.Trim().ToUpperInvariant();
        }

        /// <summary>İzin kontrolü sonrası normalize; geçersizse false.</summary>
        public static bool TryNormalize(string? code, out string normalized)
        {
            normalized = Normalize(code);
            if (string.IsNullOrWhiteSpace(code)) return true;
            return Allowed.Contains(normalized);
        }
    }

    public readonly record struct ExpenseCurrencyOption(string Code, string NameTr, string Symbol);
}
