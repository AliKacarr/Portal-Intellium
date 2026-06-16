using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Text.RegularExpressions;
using Business.ReceiptVision;
using Core.Utilities.Results.Abstract;
using Core.Utilities.Results.Concrete;
using Entities.DTOs.ExpenseDto;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using DrawingImagingEncoder = System.Drawing.Imaging.Encoder;

namespace Business.Helpers
{
    /// <summary>Fiş/fatura görüntüsünden alan çıkarma — yalnızca Groq Cloud vision (GroqReceiptVision).</summary>
    public class ExpenseReceiptExtractionManager : IExpenseReceiptExtractionService
    {
        /// <summary>
        /// Sadece miktar×birim fiyat satırı (örn. 1,033Kg X 99,00) — yakalanan gruplar bir sonraki/önceki ürün satırına yedirilir.
        /// </summary>
        private static readonly Regex DetailQtyPriceCaptureRegex = new(
            @"^\s*(?<qty>\d+(?:[.,]\d+)?)\s*(?:adt|adet|pcs|pc|kg|g|gr|lt|l|ml)?\s*[x×]\s*[-+]?\s*(?:tl|try)?\s*(?:[\p{Sc}]|[A-Za-z])?\s*(?<price>\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:[Tt][Ll]\s*/\s*[Kk][Gg])?\s*$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        private static readonly Regex NonProductQtyPriceOnlyLineRegex = new(
            // "2 Adt x 15,00", "2x₺15,00", "2 Adet × TL 15,00", OCR gürültüsü: "2Adt X B15,00"
            // Amaç: SADECE miktar×birim fiyat ifadesini yakalayıp ürün listesine sokmamak.
            @"^\s*" +
            // qty + opsiyonel birim: adet/kg/lt vb.
            @"\d+(?:[.,]\d+)?\s*(?:adt|adet|pcs|pc|kg|g|gr|lt|l|ml)?\s*" +
            @"[x×]\s*" +
            @"[-+]?\s*(?:tl|try)?\s*" +
            @"(?:[\p{Sc}]|[A-Za-z])?\s*" + // ₺,$,€ veya OCR'nin koyduğu 'B' gibi tek harf
            @"\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\s*" + // 15,00 / 1.215,00 / 1215.00
            @"(?:[Tt][Ll]\s*/\s*[Kk][Gg])?\s*" + // "195,00 TL/KG" (Şok vb.)
            @"$",
            RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        private static readonly Regex NonProductTotalsOrPaymentsRegex = new(
            @"\b(?:toplam|ara\s*toplam|topkdv|kdv|vergi|vat|nakit|kredi|pos|banka|para\s*üstü|odenecek|ödenecek)\b",
            RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        private static readonly Regex DiscountLikeRegex = new(
            @"\b(?:indirim|i̇ndirim|iskonto|ıskonto|kupon|kampanya|avantaj|puan|promosyon|promo)\b",
            RegexOptions.Compiled | RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

        private readonly IConfiguration _configuration;
        private readonly ILogger<ExpenseReceiptExtractionManager> _logger;
        private readonly IReceiptVisionService _groqReceiptVision;

        public ExpenseReceiptExtractionManager(
            IConfiguration configuration,
            ILogger<ExpenseReceiptExtractionManager> logger,
            IReceiptVisionService groqReceiptVision)
        {
            _configuration = configuration;
            _logger = logger;
            _groqReceiptVision = groqReceiptVision;
        }

        public async Task<IDataResult<ExpenseReceiptExtractionResultDto>> ExtractAsync(
            byte[] imageBytes,
            string? contentType,
            CancellationToken cancellationToken = default)
        {
            if (imageBytes == null || imageBytes.Length == 0)
                return new DataResult<ExpenseReceiptExtractionResultDto>(null!, false, "Görüntü verisi boş.");

            var maxBytes = _configuration.GetValue("GroqReceiptVision:MaxImageBytes", 15 * 1024 * 1024);
            if (imageBytes.Length > maxBytes)
                return new DataResult<ExpenseReceiptExtractionResultDto>(null!, false,
                    $"Görüntü çok büyük (çözülmüş üst sınır {maxBytes} byte).");

            if (string.IsNullOrWhiteSpace(ResolveGroqApiKey()))
                return new DataResult<ExpenseReceiptExtractionResultDto>(null!, false,
                    "Fiş okuma devre dışı: Groq API anahtarı yok. Ortam: GROQ_API_KEY veya GroqReceiptVision__ApiKey; " +
                    "veya WebApi: dotnet user-secrets set \"GroqReceiptVision:ApiKey\" \"gsk_...\" (https://console.groq.com).");

            var mime = NormalizeMime(contentType);
            var prepared = PrepareImageBytesForGroq(imageBytes, mime);

            var sw = Stopwatch.StartNew();
            try
            {
                var groq = await _groqReceiptVision
                    .AnalyzeAsync(prepared.Bytes, prepared.MimeType, cancellationToken)
                    .ConfigureAwait(false);
                sw.Stop();
                _logger.LogInformation(
                    "Fiş OCR (Groq) tamam: {Ms} ms, görüntü {Kb} KB",
                    sw.ElapsedMilliseconds, (prepared.Bytes.Length + 1023) / 1024);

                var dto = MapGroqToExpenseDto(groq);
                return new DataResult<ExpenseReceiptExtractionResultDto>(dto, true);
            }
            catch (HttpRequestException ex)
            {
                sw.Stop();
                _logger.LogWarning(ex, "Fiş OCR (Groq) HTTP hatası ({Ms} ms)", sw.ElapsedMilliseconds);
                var msg = ex.Message;
                if (msg.Contains("429", StringComparison.Ordinal) || msg.Contains("Too Many Requests", StringComparison.OrdinalIgnoreCase))
                    return new DataResult<ExpenseReceiptExtractionResultDto>(null!, false,
                        "Groq istek kotası veya hız sınırı aşıldı (429). Bir süre sonra tekrar deneyin veya Groq planınızı kontrol edin.");
                return new DataResult<ExpenseReceiptExtractionResultDto>(null!, false,
                    string.IsNullOrWhiteSpace(msg) ? "Groq fiş okuma servisi hata döndü." : msg);
            }
            catch (InvalidOperationException ex)
            {
                sw.Stop();
                _logger.LogWarning(ex, "Fiş OCR (Groq) işlenemedi ({Ms} ms)", sw.ElapsedMilliseconds);
                return new DataResult<ExpenseReceiptExtractionResultDto>(null!, false, ex.Message);
            }
            catch (Exception ex)
            {
                sw.Stop();
                _logger.LogWarning(ex, "Fiş OCR (Groq) beklenmeyen hata ({Ms} ms)", sw.ElapsedMilliseconds);
                return new DataResult<ExpenseReceiptExtractionResultDto>(null!, false, "Fiş okunamadı.");
            }
        }

        private static ExpenseReceiptExtractionResultDto MapGroqToExpenseDto(ReceiptExtractionResultDto g)
        {
            var headerKdv = (int)Math.Round((double)(g.VatRatePercent ?? g.TaxRate ?? 0m));
            var items = MapGroqLineItems(g.LineItems, headerKdv);

            var dto = new ExpenseReceiptExtractionResultDto
            {
                TotalAmount = g.TotalAmount,
                Vat = g.TaxAmount,
                VatRate = g.VatRatePercent ?? g.TaxRate,
                InvoiceDate = string.IsNullOrWhiteSpace(g.Date) ? null : g.Date.Trim(),
                CurrencyCode = string.IsNullOrWhiteSpace(g.CurrencyCode) ? "TRY" : g.CurrencyCode.Trim().ToUpperInvariant(),
                Items = items,
                Description = string.IsNullOrWhiteSpace(g.Description) ? null : g.Description.Trim(),
                InvoiceNumber = string.IsNullOrWhiteSpace(g.InvoiceNumber) ? null : g.InvoiceNumber.Trim(),
                InvoiceTitle = string.IsNullOrWhiteSpace(g.VendorName) ? null : g.VendorName.Trim(),
                ExcludingVatAmount = g.ExcludingVatAmount
            };

            // Tutarlılık/eksik alan tamamlama:
            // - Bazı fişlerde model TOPKDV/TOPLAM'dan birini kaçırabiliyor veya oranı 0 yazabiliyor.
            // - Frontend vatRate=0 olunca KDV'yi 0 hesaplıyor; bu yüzden 0 oranı "bilinmiyor" say.
            dto = CompleteVatFields(dto);
            return dto;
        }

        private static ExpenseReceiptExtractionResultDto CompleteVatFields(ExpenseReceiptExtractionResultDto dto)
        {
            var total = dto.TotalAmount;
            var vat = dto.Vat;
            var rate = dto.VatRate;
            var excluding = dto.ExcludingVatAmount;

            // Kalemlerin brüt toplamı (indirimi negatif tuttuğumuz için dahil).
            decimal? itemsSum = null;
            if (dto.Items != null && dto.Items.Count > 0)
            {
                var sum = 0m;
                foreach (var it in dto.Items)
                {
                    if (it == null) continue;
                    var q = Math.Max(1, it.Quantity);
                    sum += q * it.UnitPrice;
                }
                if (sum != 0m) itemsSum = Math.Round(sum, 2, MidpointRounding.AwayFromZero);
            }

            // Kalemlerden karma KDV tespiti (1'den fazla farklı oran varsa).
            var distinctItemRates = (dto.Items ?? new List<ExpenseReceiptExtractedItemDto>())
                .Where(x => x != null)
                .Select(x => x.KdvRate)
                .Where(r => r > 0)
                .Distinct()
                .Take(3)
                .ToList();
            var isMixedVat = distinctItemRates.Count > 1;

            // 0 veya negatif oran çoğunlukla placeholder; gerçek %0 KDV çok nadir ve toplam/KDV tutarıyla zaten anlaşılır.
            if (rate.HasValue && rate.Value <= 0m)
                rate = null;
            // Türkiye fişleri için "mantıksız" oranları (OCR/AI kayması) yok say.
            if (rate.HasValue && rate.Value > 30m)
                rate = null;

            // Karma KDV fişlerinde tek bir vatRate ile KDV türetmek hataya yol açar. Oranı bilinmiyor say.
            if (isMixedVat)
                rate = null;

            // KDV tutarı aşırı büyükse (AI yanlış satırı TOPKDV sanmış olabilir) yok sayıp yeniden türet.
            if (vat.HasValue && total.HasValue)
            {
                // KDV genelde toplamın %30'undan küçük olur (çoğu fişte %1/%10/%20).
                if (vat.Value < 0m || vat.Value > Math.Round(total.Value * 0.30m, 2, MidpointRounding.AwayFromZero))
                    vat = null;
            }

            // Toplam yoksa satır kalemlerinden üret (qty int olduğundan birim fiyat zaten satır toplamına normalize edilebilir).
            if (!total.HasValue && dto.Items != null && dto.Items.Count > 0)
            {
                var sum = 0m;
                foreach (var it in dto.Items)
                {
                    if (it == null) continue;
                    var q = Math.Max(1, it.Quantity);
                    sum += q * it.UnitPrice;
                }
                if (sum > 0m) total = Math.Round(sum, 2, MidpointRounding.AwayFromZero);
            }

            // OCR/AI bazen "TOPLAM 427,42" satırını "1.427,42" gibi yanlış okuyup 1000 ekliyor.
            // Güvenlik: Eğer toplam 1000+ ama kalem toplamı 1000 altındaysa ve 1000 çıkarmak kalem toplamına daha çok yaklaştırıyorsa düzelt.
            if (total.HasValue && itemsSum.HasValue)
            {
                var t = total.Value;
                var s = itemsSum.Value;
                if (t >= 1000m && s > 0m && s < 1000m)
                {
                    var tMinus = t - 1000m;
                    if (tMinus > 0m)
                    {
                        var d0 = Math.Abs(t - s);
                        var d1 = Math.Abs(tMinus - s);
                        // "daha yakın" + çok agresif olmamak için ekstra koşul: 1000 çıkınca fark ciddi azalmalı.
                        if (d1 < d0 && (d0 - d1) >= 50m)
                        {
                            total = Math.Round(tMinus, 2, MidpointRounding.AwayFromZero);
                        }
                    }
                }
            }

            // Oran yoksa kalemlerden baskın KDV oranını tahmin et (en sık görülen >0 oran).
            // Karma KDV varsa oranı null bırak (türetim hataya yol açar).
            if (!rate.HasValue && !isMixedVat && dto.Items != null && dto.Items.Count > 0)
            {
                var mode = dto.Items
                    .Where(x => x != null)
                    .Select(x => x!.KdvRate)
                    .Where(r => r > 0)
                    .GroupBy(r => r)
                    .OrderByDescending(g => g.Count())
                    .ThenByDescending(g => g.Key) // eşitse büyük olanı seç (20,10,...)
                    .Select(g => (int?)g.Key)
                    .FirstOrDefault();
                if (mode.HasValue)
                    rate = mode.Value;
            }

            if (!excluding.HasValue && total.HasValue && vat.HasValue)
                excluding = Math.Round(total.Value - vat.Value, 2, MidpointRounding.AwayFromZero);

            if (!vat.HasValue && total.HasValue && excluding.HasValue)
                vat = Math.Round(total.Value - excluding.Value, 2, MidpointRounding.AwayFromZero);

            // Oran yoksa ama total+vat varsa oranı hesapla: vat / (total - vat)
            if (!rate.HasValue && total.HasValue && vat.HasValue)
            {
                var net = total.Value - vat.Value;
                if (net > 0.01m && vat.Value >= 0m)
                {
                    var r = Math.Round((vat.Value / net) * 100m, 2, MidpointRounding.AwayFromZero);
                    // Türkiye fişlerinde tipik oranlar; saçma oranları null bırak.
                    if (r is >= 0m and <= 30m)
                        rate = r;
                }
            }

            // VAT yoksa ama oran+total varsa vat'ı hesapla: total - total/(1+rate/100)
            // Karma KDV fişlerinde bu yanlış olur; karma ise hesaplama yapma.
            if (!vat.HasValue && total.HasValue && rate.HasValue && rate.Value > 0m && !isMixedVat)
            {
                var denom = 1m + (rate.Value / 100m);
                if (denom > 1m)
                {
                    var net = Math.Round(total.Value / denom, 2, MidpointRounding.AwayFromZero);
                    vat = Math.Round(total.Value - net, 2, MidpointRounding.AwayFromZero);
                    excluding ??= net;
                }
            }

            // Son temizlik: türetilen alanları 2 ondalıkta sabitle (UI ve DB tutarlılığı).
            if (total.HasValue) total = Math.Round(total.Value, 2, MidpointRounding.AwayFromZero);
            if (excluding.HasValue) excluding = Math.Round(excluding.Value, 2, MidpointRounding.AwayFromZero);
            if (vat.HasValue) vat = Math.Round(vat.Value, 2, MidpointRounding.AwayFromZero);

            return new ExpenseReceiptExtractionResultDto
            {
                InvoiceNumber = dto.InvoiceNumber,
                InvoiceDate = dto.InvoiceDate,
                InvoiceTitle = dto.InvoiceTitle,
                CurrencyCode = dto.CurrencyCode,
                Description = dto.Description,
                Items = dto.Items,
                TotalAmount = total,
                Vat = vat,
                ExcludingVatAmount = excluding,
                VatRate = rate
            };
        }

        private static List<ExpenseReceiptExtractedItemDto> MapGroqLineItems(
            List<ReceiptExtractionLineItemDto>? lines,
            int headerKdvFallback)
        {
            if (lines == null || lines.Count == 0)
                return new List<ExpenseReceiptExtractedItemDto>();

            // Sıra korunmalı: "1,033Kg X 99,00" gibi detay satırı ayrı kalem olarak düşürülürken,
            // hemen önceki/sonraki ürün satırına miktar×birim fiyat yedirilmezse (özellikle piliç/kg)
            // ürün tamamen kaybolur veya 0 TL kalır.
            var result = new List<ExpenseReceiptExtractedItemDto>();
            (decimal Qty, decimal Unit)? pendingDetailForNext = null;

            foreach (var x in lines)
            {
                if (x == null || string.IsNullOrWhiteSpace(x.ItemName))
                    continue;

                var name = x.ItemName.Trim();

                if (NonProductTotalsOrPaymentsRegex.IsMatch(name))
                    continue;

                if (NonProductQtyPriceOnlyLineRegex.IsMatch(name))
                {
                    if (TryParseDetailLineQtyAndUnitPrice(name, out var dQty, out var dUnit))
                    {
                        if (result.Count > 0)
                            ApplyWeightDetailToLine(result[^1], dQty, dUnit);
                        else
                            pendingDetailForNext = (dQty, dUnit);
                    }

                    // Detay satırı asla ayrı kalem olmasın (parse edilemese bile).
                    continue;
                }

                var row = new ExpenseReceiptExtractedItemDto
                {
                    ItemName = name,
                    Quantity = ResolveQuantityInt(x.Quantity),
                    UnitPrice = ResolveUnitPriceForIntQuantity(x.Quantity, x.UnitPrice),
                    KdvRate = NormalizeKdv((int)Math.Round((double)(x.KdvRate ?? headerKdvFallback)))
                };

                if (pendingDetailForNext.HasValue)
                {
                    ApplyWeightDetailToLine(row, pendingDetailForNext.Value.Qty, pendingDetailForNext.Value.Unit);
                    pendingDetailForNext = null;
                }

                if (!string.IsNullOrWhiteSpace(row.ItemName) && DiscountLikeRegex.IsMatch(row.ItemName))
                {
                    row.ItemName = "İNDİRİM";
                    row.Quantity = 1;
                    row.UnitPrice = -Math.Abs(row.UnitPrice);
                }

                if (!(row.ItemName == "İNDİRİM" && row.UnitPrice == 0m))
                    result.Add(row);
            }

            return result;
        }

        private static void ApplyWeightDetailToLine(ExpenseReceiptExtractedItemDto row, decimal detailQty, decimal detailUnit)
        {
            row.Quantity = ResolveQuantityInt(detailQty);
            row.UnitPrice = ResolveUnitPriceForIntQuantity(detailQty, detailUnit);
        }

        private static bool TryParseDetailLineQtyAndUnitPrice(string name, out decimal qty, out decimal unitPrice)
        {
            qty = 0m;
            unitPrice = 0m;
            var m = DetailQtyPriceCaptureRegex.Match(name);
            if (!m.Success) return false;
            return TryParseTrDecimal(m.Groups["qty"].Value, out qty)
                   && TryParseTrDecimal(m.Groups["price"].Value, out unitPrice);
        }

        /// <summary>Fişteki TR ondalık (1.234,56 / 1,033 / 99,00) → decimal.</summary>
        private static bool TryParseTrDecimal(string s, out decimal value)
        {
            value = 0m;
            if (string.IsNullOrWhiteSpace(s)) return false;
            s = s.Trim();
            var lastComma = s.LastIndexOf(',');
            var lastDot = s.LastIndexOf('.');
            if (lastComma >= 0 && (lastDot < 0 || lastComma > lastDot))
            {
                // Avrupa: nokta binlik, virgül ondalık
                s = s.Replace(".", "", StringComparison.Ordinal).Replace(',', '.');
            }
            else if (lastComma >= 0)
                s = s.Replace(",", "", StringComparison.Ordinal);

            return decimal.TryParse(
                s,
                NumberStyles.AllowLeadingSign | NumberStyles.AllowDecimalPoint,
                CultureInfo.InvariantCulture,
                out value);
        }

        private static int ResolveQuantityInt(decimal? q)
        {
            var qty = q ?? 1m;
            if (qty <= 0m) return 1;
            var rounded = Math.Round(qty, 0, MidpointRounding.AwayFromZero);
            var hasFraction = Math.Abs(qty - rounded) > 0.0001m;
            if (hasFraction) return 1;
            return Math.Max(1, (int)rounded);
        }

        private static decimal ResolveUnitPriceForIntQuantity(decimal? q, decimal? unitPrice)
        {
            var up = unitPrice ?? 0m;
            var qty = q ?? 1m;
            if (qty <= 0m) return up;

            var rounded = Math.Round(qty, 0, MidpointRounding.AwayFromZero);
            var hasFraction = Math.Abs(qty - rounded) > 0.0001m;
            if (!hasFraction) return up;

            // qty küsuratlıysa: unitPrice çoğunlukla "birim fiyat" olur; qty=1'e çekince satır toplamını koru.
            return Math.Round(qty * up, 2, MidpointRounding.AwayFromZero);
        }

        /// <summary>
        /// Önce ortam değişkenleri (CI/Production’da en güvenilir), sonra <see cref="IConfiguration"/> (user-secrets, appsettings).
        /// Böylece boş <c>ApiKey</c> satırı veya provider sırası yüzünden anahtarın okunmaması riski azalır.
        /// </summary>
        private string? ResolveGroqApiKey()
        {
            var k = Environment.GetEnvironmentVariable("GROQ_API_KEY")?.Trim();
            if (!string.IsNullOrEmpty(k)) return k;
            k = Environment.GetEnvironmentVariable("GroqReceiptVision__ApiKey")?.Trim();
            if (!string.IsNullOrEmpty(k)) return k;
            k = _configuration["GroqReceiptVision:ApiKey"]?.Trim();
            if (!string.IsNullOrEmpty(k)) return k;
            return null;
        }

        private static int NormalizeKdv(int r)
        {
            int[] allowed = { 0, 1, 10, 20 };
            if (allowed.Contains(r)) return r;
            if (r == 18) return 20;
            return allowed.OrderBy(a => Math.Abs(a - r)).First();
        }

        /// <summary>Büyük görüntüleri Groq’a göndermeden küçültür / JPEG sıkıştırır. GroqReceiptVision:ReceiptImageMaxEdgePixels=0 ile ölçekleme kapalı.</summary>
        private (byte[] Bytes, string MimeType) PrepareImageBytesForGroq(byte[] raw, string normalizedMime)
        {
            var maxEdge = _configuration.GetValue("GroqReceiptVision:ReceiptImageMaxEdgePixels", 1536);
            var reencodeAbove = _configuration.GetValue("GroqReceiptVision:ReceiptImageReencodeAboveBytes", 1_500_000);
            var jpegQuality = Math.Clamp(_configuration.GetValue("GroqReceiptVision:ReceiptImageJpegQuality", 82), 40, 95);

            try
            {
                using var msIn = new MemoryStream(raw, writable: false);
                using var img = Image.FromStream(msIn, false, false);
                var w = img.Width;
                var h = img.Height;
                if (w < 1 || h < 1)
                    return (raw, normalizedMime);

                var needScale = maxEdge > 0 && Math.Max(w, h) > maxEdge;
                var needReencode = reencodeAbove > 0 && raw.Length > reencodeAbove;
                if (!needScale && !needReencode)
                    return (raw, normalizedMime);

                double ratio = 1;
                if (needScale)
                    ratio = (double)maxEdge / Math.Max(w, h);

                var nw = Math.Max(1, (int)Math.Round(w * ratio));
                var nh = Math.Max(1, (int)Math.Round(h * ratio));

                using var target = new Bitmap(nw, nh, PixelFormat.Format24bppRgb);
                using (var g = Graphics.FromImage(target))
                {
                    g.InterpolationMode = InterpolationMode.HighQualityBicubic;
                    g.PixelOffsetMode = PixelOffsetMode.HighQuality;
                    g.CompositingQuality = CompositingQuality.HighQuality;
                    g.DrawImage(img, 0, 0, nw, nh);
                }

                using var msOut = new MemoryStream();
                var enc = ImageCodecInfo.GetImageEncoders().FirstOrDefault(x => x.FormatID == ImageFormat.Jpeg.Guid);
                if (enc != null)
                {
                    using var p = new EncoderParameters(1);
                    p.Param[0] = new EncoderParameter(DrawingImagingEncoder.Quality, (long)jpegQuality);
                    target.Save(msOut, enc, p);
                }
                else
                    target.Save(msOut, ImageFormat.Jpeg);

                var result = msOut.ToArray();
                _logger.LogDebug(
                    "Fiş görüntüsü Groq öncesi: {W}x{H} {InBytes} B -> {NW}x{NH} {OutBytes} B",
                    w, h, raw.Length, nw, nh, result.Length);
                return (result, "image/jpeg");
            }
            catch (Exception ex)
            {
                _logger.LogDebug(ex, "Fiş görüntüsü küçültülemedi; orijinal gönderiliyor.");
                return (raw, normalizedMime);
            }
        }

        private static string NormalizeMime(string? contentType)
        {
            if (string.IsNullOrWhiteSpace(contentType)) return "image/jpeg";
            var s = contentType.Split(';', 2)[0].Trim().ToLowerInvariant();
            return s is "image/png" or "image/jpeg" or "image/jpg" or "image/webp" or "image/gif"
                ? (s == "image/jpg" ? "image/jpeg" : s)
                : "image/jpeg";
        }
    }
}
