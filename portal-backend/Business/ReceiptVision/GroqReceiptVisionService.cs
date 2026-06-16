using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Entities.DTOs.ExpenseDto;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Newtonsoft.Json.Linq;

namespace Business.ReceiptVision
{
    public class GroqReceiptVisionService : IReceiptVisionService
    {
        public const string HttpClientName = "GroqReceiptVision";

        /// <summary>Groq modelleri bazen tutarları JSON sayı yerine string döndürür (<c>"634.97"</c>); bu bayrak stringden okumaya izin verir.</summary>
        private static readonly JsonSerializerOptions JsonDeserializeOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            NumberHandling = JsonNumberHandling.AllowReadingFromString
        };

        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IOptions<GroqReceiptVisionOptions> _options;
        private readonly ILogger<GroqReceiptVisionService> _logger;

        public GroqReceiptVisionService(
            IHttpClientFactory httpClientFactory,
            IOptions<GroqReceiptVisionOptions> options,
            ILogger<GroqReceiptVisionService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _options = options;
            _logger = logger;
        }

        public async Task<ReceiptExtractionResultDto> AnalyzeAsync(IFormFile file, CancellationToken cancellationToken = default)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("Dosya boş olamaz.", nameof(file));

            await using var ms = new MemoryStream();
            await file.CopyToAsync(ms, cancellationToken).ConfigureAwait(false);
            return await AnalyzeAsync(ms.ToArray(), file.ContentType, cancellationToken).ConfigureAwait(false);
        }

        public async Task<ReceiptExtractionResultDto> AnalyzeAsync(byte[] imageBytes, string? contentType, CancellationToken cancellationToken = default)
        {
            if (imageBytes == null || imageBytes.Length == 0)
                throw new ArgumentException("Görüntü verisi boş.", nameof(imageBytes));

            var opt = _options.Value;
            var apiKey = ResolveApiKey();
            if (string.IsNullOrWhiteSpace(apiKey))
                throw new InvalidOperationException(
                    "Groq API anahtarı yok: ortam GROQ_API_KEY veya GroqReceiptVision__ApiKey; veya GroqReceiptVision:ApiKey (appsettings / user-secrets).");

            var mime = NormalizeImageMime(contentType);
            var b64 = Convert.ToBase64String(imageBytes);
            var dataUrl = $"data:{mime};base64,{b64}";


           const string systemPrompt =
    "You are a Turkish receipt OCR + JSON extraction engine. Output ONE JSON object only. No markdown, no prose. "
    + "Read printed totals (TOPLAM, TOPKDV) from the receipt footer. "
    + "Never return an empty object {} — every receipt must produce totalAmount, taxAmount, date when visible, and line_items with all product lines you can read.";

var userText =
    "DİKKAT - EN ÖNEMLİ KURAL: Fişte Rakı, Bira, Şarap, Viski, Votka, Sigara, Tuborg, Marlboro, Efes, Doluca, Roze gibi ALKOL ve TÜTÜN ürünleri varsa bunları KESİNLİKLE JSON'a ekleme! Sildiğin bu ürünlerin tutarını fişin altındaki genel TOPLAM'dan çıkar.\n"
    + "EKSTRA DİKKAT (YETİM ÇARPANLAR): Eğer sildiğin bu alkol ürününün hemen üstünde veya altında ona ait bir adet/fiyat çarpım satırı varsa (Örn: Tuborg'un üstündeki '2,00Adt X *170,00' satırı), O SATIRI DA TAMAMEN SİL! Sakın o çarpım değerini alıp panikle başka bir yemeğe veya ürüne yamama!\n\n"
    + "Fiş görüntüsünü oku ve aşağıdaki ANAHTARLARLA tek bir JSON nesnesi döndür (ek anahtar yok). Boş {} DÖNDÜRME.\n"
    + "ZORUNLU: Görünen TOPLAM (alkol düşülmüş) -> totalAmount, TOPKDV/KDV toplamı -> taxAmount, fiş tarihi -> date (YYYY-MM-DD), tüm geçerli ürün satırları -> line_items.\n"
    + "Bilinmeyen alanlar için null kullan; ama fişte net görünen tutarları asla atlama.\n\n"
    + "Satır kuralları:\n"
    + "- KESİN BİRLEŞTİRME YASAĞI (NO AGGREGATION): Fişteki ayrı satırları ASLA isimlerine göre gruplayıp adetlerini (quantity) toplama! Fişte aynı isimli ürün (Örn: Ozmo) 1. satırda ve 3. satırda (araya başka ürün girse bile) ayrı ayrı yazıyorsa, JSON dizisinde de KESİNLİKLE 2 ayrı obje olarak kalmalıdır. Her satır kendi objesinde olmalıdır.\n"
    + "- ADETLİ SATIRLAR (ÇARPAN): Eğer fişte bizzat '2,00Adt X *20,00' gibi bir çarpım yazıyorsa, bu ayrı bir ürün değildir. Hemen ALTINDAKİ veya ÜSTÜNDEKİ ürünün quantity'sini 2 yapıp, unit_price'ını 20 olarak ayarla (ürün adını bozma).\n"
    + "- İndirim satırı (-) ayrı ürün değil; bir üstteki ürünün net fiyatına yedir.\n"
    + "- Ürün adındaki '0.33 Lt', '50CL' gibi hacim ifadelerini çarpan sanma; quantity genelde 1, fiyat fişteki tutar.\n"
    + "- kdv_rate: satırdaki %01->1, %10->10, %20->20.\n"
    + "- Sayılarda ondalık için nokta kullan (ör. 634.97).\n\n"
    + "JSON anahtarları (tam olarak):\n"
    + "totalAmount (number|null), taxAmount (number|null), taxRate (number|null), date (string|null), "
    + "invoice_number (string|null), vendor_name (string|null), currency_code (string|null), description (string|null), "
    + "excluding_vat_amount (number|null), vat_rate_percent (number|null), "
    + "line_items: [ { item_name, quantity, unit_price, kdv_rate } ].\n\n"
    + "### SON KONTROL VE FİLTRELEME ADIMI (BANA ÇIKTIYI VERMEDEN ÖNCE UYGULA) ###\n"
    + "JSON nesnesini zihninde hazırladıktan sonra, kodu bana göndermeden hemen önce son bir kontrol yap:\n"
    + "1. 'line_items' dizisine bak. İçinde hala yanlışlıkla eklediğin bir alkol/tütün (Roze, Doluca vb.) kalmış mı? Varsa SİL ve toplamdan düş.\n"
    + "2. BİRLEŞTİRME KONTROLÜ: Ayrı satırlardaki aynı isimli ürünleri (Örn: Ozmo) toplayıp quantity'yi artırarak TEK KALEME mi indirdin? Fişte kaç ayrı satırda yazıyorsa JSON'da da o kadar ayrı satır olmalı! Yanlışlıkla grupladıysan DERHAL AYIR.\n"
    + "3. Bana sadece bu güvenlik denetiminden geçmiş temiz JSON'u gönder.";


    
            var payload = new JObject
            {
                ["model"] = opt.Model,
                ["max_completion_tokens"] = opt.MaxTokens,
                ["temperature"] = 0.0,
                ["top_p"] = 1.0,
                // json_schema bazı modellerde boş {} veya null alan üretebiliyor; json_object + net prompt daha güvenilir.
                ["response_format"] = new JObject { ["type"] = "json_object" },
                ["messages"] = new JArray
                {
                    new JObject { ["role"] = "system", ["content"] = systemPrompt },
                    new JObject
                    {
                        ["role"] = "user",
                        ["content"] = new JArray
                        {
                            new JObject { ["type"] = "text", ["text"] = userText },
                            new JObject
                            {
                                ["type"] = "image_url",
                                ["image_url"] = new JObject { ["url"] = dataUrl }
                            }
                        }
                    }
                }
            };

            var client = _httpClientFactory.CreateClient(HttpClientName);
            using var req = new HttpRequestMessage(HttpMethod.Post, "chat/completions");
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim());
            req.Content = new StringContent(payload.ToString(Newtonsoft.Json.Formatting.None), Encoding.UTF8, "application/json");

            var res = await client.SendAsync(req, cancellationToken).ConfigureAwait(false);
            var body = await res.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);

            if (!res.IsSuccessStatusCode)
            {
                _logger.LogWarning("Groq vision HTTP {Status}: {Body}", (int)res.StatusCode, Truncate(body, 600));
                res.EnsureSuccessStatusCode();
            }

            var assistantText = ExtractAssistantContent(body);
            if (string.IsNullOrWhiteSpace(assistantText))
            {
                _logger.LogWarning("Groq yanıtında message.content boş. Ham gövde (kısaltılmış): {Body}", Truncate(body, 900));
                throw new InvalidOperationException("Groq yanıtında metin bulunamadı (vision içerik dizisi veya boş cevap).");
            }

            var cleaned = StripMarkdownFence(assistantText.Trim());
            ReceiptExtractionResultDto? dto;
            try
            {
                dto = JsonSerializer.Deserialize<ReceiptExtractionResultDto>(cleaned, JsonDeserializeOptions);
            }
            catch (JsonException ex)
            {
                _logger.LogWarning(ex, "Groq JSON parse edilemedi: {Snippet}", Truncate(cleaned, 400));
                throw new InvalidOperationException("Model çıktısı JSON olarak okunamadı.", ex);
            }

            if (dto == null)
                throw new InvalidOperationException("Çıkarılan veri boş.");

            // Bazı çağrılarda model {} veya tamamen null alan döndürür; json_object kaldırarak bir kez yeniden dene.
            if (IsGroqExtractionEmpty(dto))
            {
                _logger.LogWarning(
                    "Groq boş/eksik JSON döndü (snippet): {Snippet}. response_format kaldırılarak yeniden deneniyor.",
                    Truncate(cleaned, 600));
                payload.Remove("response_format");
                using var req2 = new HttpRequestMessage(HttpMethod.Post, "chat/completions");
                req2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim());
                req2.Content = new StringContent(payload.ToString(Newtonsoft.Json.Formatting.None), Encoding.UTF8, "application/json");
                var res2 = await client.SendAsync(req2, cancellationToken).ConfigureAwait(false);
                var body2 = await res2.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
                if (!res2.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Groq ikinci deneme HTTP {Status}: {Body}", (int)res2.StatusCode, Truncate(body2, 400));
                    res2.EnsureSuccessStatusCode();
                }

                var assistantText2 = ExtractAssistantContent(body2);
                if (!string.IsNullOrWhiteSpace(assistantText2))
                {
                    cleaned = StripMarkdownFence(assistantText2.Trim());
                    try
                    {
                        dto = JsonSerializer.Deserialize<ReceiptExtractionResultDto>(cleaned, JsonDeserializeOptions);
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogWarning(ex, "Groq ikinci JSON parse edilemedi: {Snippet}", Truncate(cleaned, 400));
                    }
                }
            }

            if (dto == null || IsGroqExtractionEmpty(dto))
                _logger.LogWarning(
                    "Groq fiş çıktısı hâlâ boş: totalAmount={T}, taxAmount={V}, date={D}, lineCount={N}",
                    dto?.TotalAmount, dto?.TaxAmount, dto?.Date, dto?.LineItems?.Count ?? 0);

            _logger.LogInformation(
                "Groq vision ({Model}) fiş alanları okundu: totalAmount={T}, taxAmount={V}, taxRate={R}, date={D}, lineCount={N}",
                opt.Model, dto?.TotalAmount, dto?.TaxAmount, dto?.TaxRate, dto?.Date, dto?.LineItems?.Count ?? 0);

            return dto ?? throw new InvalidOperationException("Çıkarılan veri boş.");
        }

        /// <summary>Model hiçbir tutar ve kalem üretmediyse true (fiş okunamadı sayılır).</summary>
        private static bool IsGroqExtractionEmpty(ReceiptExtractionResultDto? dto)
        {
            if (dto == null) return true;
            var noTotals = dto.TotalAmount is null && dto.TaxAmount is null;
            var noLines = dto.LineItems is null || dto.LineItems.Count == 0;
            return noTotals && noLines;
        }

        /// <summary>Önce ortam; sonra IOptions (user-secrets ile aynı sıra mantığı — ExpenseReceiptExtractionManager ile uyumlu).</summary>
        private string ResolveApiKey()
        {
            var k = Environment.GetEnvironmentVariable("GROQ_API_KEY")?.Trim();
            if (!string.IsNullOrEmpty(k)) return k;
            k = Environment.GetEnvironmentVariable("GroqReceiptVision__ApiKey")?.Trim();
            if (!string.IsNullOrEmpty(k)) return k;
            k = _options.Value.ApiKey?.Trim();
            return k ?? string.Empty;
        }

        /// <summary>
        /// Groq/OpenAI uyumlu: <c>message.content</c> bazen string, bazen multimodal için <c>[{ "type":"text","text":"..." }]</c> dizisidir.
        /// </summary>
        private static string ExtractAssistantContent(string responseBody)
        {
            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;
            if (!root.TryGetProperty("choices", out var choices) || choices.ValueKind != JsonValueKind.Array || choices.GetArrayLength() == 0)
                return string.Empty;
            var msg = choices[0];
            if (!msg.TryGetProperty("message", out var message)) return string.Empty;
            if (!message.TryGetProperty("content", out var content)) return string.Empty;

            if (content.ValueKind == JsonValueKind.String)
                return content.GetString() ?? string.Empty;

            if (content.ValueKind == JsonValueKind.Array)
            {
                var sb = new StringBuilder();
                foreach (var part in content.EnumerateArray())
                {
                    if (part.ValueKind == JsonValueKind.String)
                    {
                        sb.Append(part.GetString());
                        continue;
                    }

                    if (part.ValueKind == JsonValueKind.Object &&
                        part.TryGetProperty("text", out var textEl) &&
                        textEl.ValueKind == JsonValueKind.String)
                    {
                        sb.Append(textEl.GetString());
                    }
                }

                return sb.ToString();
            }

            return string.Empty;
        }

        private static string StripMarkdownFence(string text)
        {
            var t = text.Trim();
            if (!t.StartsWith("```", StringComparison.Ordinal)) return t;
            var firstNl = t.IndexOf('\n');
            if (firstNl < 0) return t;
            t = t[(firstNl + 1)..];
            var end = t.LastIndexOf("```", StringComparison.Ordinal);
            if (end >= 0) t = t[..end];
            return t.Trim();
        }

        private static string NormalizeImageMime(string? contentType)
        {
            if (string.IsNullOrWhiteSpace(contentType)) return "image/jpeg";
            var s = contentType.Split(';', 2)[0].Trim().ToLowerInvariant();
            return s is "image/png" or "image/jpeg" or "image/jpg" or "image/webp" or "image/gif"
                ? (s == "image/jpg" ? "image/jpeg" : s)
                : "image/jpeg";
        }

        private static string Truncate(string s, int max)
        {
            if (string.IsNullOrEmpty(s) || s.Length <= max) return s;
            return s[..max] + "...";
        }
    }
}
