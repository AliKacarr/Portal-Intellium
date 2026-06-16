namespace Business.ReceiptVision
{
    /// <summary>
    /// appsettings bölümü: <c>GroqReceiptVision</c> (<see cref="SectionName"/>).
    /// <para><b>Anahtar önceliği (kod):</b> ortam <c>GROQ_API_KEY</c> → ortam <c>GroqReceiptVision__ApiKey</c> (çift alt çizgi = yapılandırma hiyerarşisi) → <c>GroqReceiptVision:ApiKey</c> (appsettings / user-secrets).</para>
    /// <para><b>Windows (kalıcı):</b> Sistem Özellikleri → Ortam Değişkenleri → kullanıcı veya sistem için <c>GROQ_API_KEY</c> = <c>gsk_...</c>; veya PowerShell: <c>setx GROQ_API_KEY "gsk_..."</c> (yeni oturumda geçerli).</para>
    /// <para><b>Linux / Docker / Azure App Service:</b> ortam değişkeni <c>GROQ_API_KEY</c> veya <c>GroqReceiptVision__ApiKey</c>.</para>
    /// <para><b>Yerel (Visual Studio):</b> Proje → Özellikler → Hata Ayıklama → Ortam değişkenleri; veya <c>dotnet user-secrets set "GroqReceiptVision:ApiKey" "gsk_..."</c> (WebApi klasöründe).</para>
    /// </summary>
    public class GroqReceiptVisionOptions
    {
        public const string SectionName = "GroqReceiptVision";

        /// <summary>Ortam yoksa appsettings/user-secrets; üretimde anahtarı buraya yazmayın — <c>GROQ_API_KEY</c> kullanın.</summary>
        public string ApiKey { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = "https://api.groq.com/openai/v1";
        /// <summary>Groq multimodal; eski llama-3.2-11b-vision-preview kaldırıldı — bkz. console.groq.com/docs/deprecations</summary>
        public string Model { get; set; } = "meta-llama/llama-4-scout-17b-16e-instruct";
        public int TimeoutSeconds { get; set; } = 120;
        /// <summary>Kalem listesi uzun olabilir; kesilmesini azaltmak için yüksek tutulur.</summary>
        public int MaxTokens { get; set; } = 4096;

        /// <summary>Çözülmüş görüntü üst sınırı (byte); receipt/extract doğrulaması.</summary>
        public int MaxImageBytes { get; set; } = 15 * 1024 * 1024;

        public int ReceiptImageMaxEdgePixels { get; set; } = 1536;

        public int ReceiptImageJpegQuality { get; set; } = 82;

        public int ReceiptImageReencodeAboveBytes { get; set; } = 1_500_000;
    }
}
