using System;
using System.Globalization;

namespace Business.Helpers
{
    internal static class ExpenseWorkflowMailTemplates
    {
        internal static string BuildRevisionHtml(
            string olusturanAdi,
            string formNo,
            string duzeltmeIsteyen,
            DateTime duzeltmeTarihi,
            string duzeltmeNedeni,
            string duzeltmeLink)
        {
            return RevisionTemplate
                .Replace("[OLUSTURAN_ADI]", Html(olusturanAdi))
                .Replace("[FORM_NO]", Html(formNo))
                .Replace("[DUZELTME_ISTEYEN]", Html(duzeltmeIsteyen))
                .Replace("[DUZELTME_TARIHI]", Html(duzeltmeTarihi.ToString("dd.MM.yyyy HH:mm", CultureInfo.GetCultureInfo("tr-TR"))))
                .Replace("[DUZELTME_NEDENI]", Html(duzeltmeNedeni))
                .Replace("[DUZELTME_LINK]", HtmlAttr(duzeltmeLink));
        }

        internal static string BuildApproveHtml(
            string olusturanAdi,
            string formNo,
            string onaylayan,
            DateTime onayTarihi,
            decimal toplamTutar,
            string detayLink)
        {
            var total = toplamTutar.ToString("0.##", CultureInfo.GetCultureInfo("tr-TR"));
            return ApproveTemplate
                .Replace("[OLUSTURAN_ADI]", Html(olusturanAdi))
                .Replace("[FORM_NO]", Html(formNo))
                .Replace("[MALI_ISLER_ONAYLAYAN]", Html(onaylayan))
                .Replace("[ONAY_TARIHI]", Html(onayTarihi.ToString("dd.MM.yyyy HH:mm", CultureInfo.GetCultureInfo("tr-TR"))))
                .Replace("[TOPLAM_TUTAR]", Html(total))
                .Replace("[DETAY_LINK]", HtmlAttr(detayLink));
        }

        internal static string BuildRejectHtml(
            string formNo,
            string iptalEden,
            DateTime iptalTarihi,
            string iptalNedeni,
            string detayLink)
        {
            return RejectTemplate
                .Replace("[FORM_NO]", Html(formNo))
                .Replace("[IPTAL_EDEN]", Html(iptalEden))
                .Replace("[IPTAL_TARIHI]", Html(iptalTarihi.ToString("dd.MM.yyyy HH:mm", CultureInfo.GetCultureInfo("tr-TR"))))
                .Replace("[IPTAL_NEDENI]", Html(iptalNedeni))
                .Replace("[DETAY_LINK]", HtmlAttr(detayLink));
        }

        private static string Html(string? s) =>
            (s ?? string.Empty)
                .Replace("&", "&amp;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\"", "&quot;")
                .Replace("'", "&#39;");

        private static string HtmlAttr(string? s) => Html(s);

        // Şablonlar: kullanıcıdan gelen örnekler baz alınarak UTF-8 Türkçe karakterlerle düzeltildi.
        private const string RevisionTemplate = @"<!DOCTYPE html>
<html lang=""tr"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <title>Masraf Formu Düzeltme Bildirimi</title>
</head>
<body style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;"">
  <div style=""max-width: 600px; margin: 0 auto; padding: 20px; margin-top: 20px; border: 1px solid #ddd; border-radius: 10px;"">
    <div style=""background-color: #FF9800; color: white; padding: 15px; text-align: center; border-radius: 10px 10px 0 0;"">
      <h1 style=""margin: 0; font-size: 24px;"">Masraf Formu Düzeltme Bildirimi</h1>
    </div>
    <div style=""padding: 20px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;"">
      <p>Sayın [OLUSTURAN_ADI],</p>
      <p>Masraf formunuz için düzeltme talebi bulunmaktadır:</p>
      <div style=""background-color: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px;"">
        <p><strong>Form No:</strong> [FORM_NO]</p>
        <p><strong>Düzeltme İsteyen:</strong> [DUZELTME_ISTEYEN]</p>
        <p><strong>Düzeltme Tarihi:</strong> [DUZELTME_TARIHI]</p>
        <p><strong>Düzeltme Nedeni:</strong></p>
        <p>[DUZELTME_NEDENI]</p>
      </div>
      <p>Masraf formunda gerekli düzeltmeleri yapmak için aşağıdaki butona tıklayabilirsiniz:</p>
      <div style=""text-align: center; margin: 30px 0;"">
        <a href=""[DUZELTME_LINK]"" style=""background-color: #FF9800; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px;"">Formu Düzenle</a>
      </div>
      <p><strong>Not:</strong> Düzeltme işleminden sonra form tekrar onay sürecine alınacaktır.</p>
    </div>
    <div style=""text-align: center; padding: 20px; font-size: 12px; color: #666;"">
      <p>Bu mail otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
      <p>© 2026 Intellium A.Ş. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>";

        private const string ApproveTemplate = @"<!DOCTYPE html>
<html lang=""tr"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <title>Masraf Formu Onay ve Evrak Bildirimi</title>
</head>
<body style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;"">
  <div style=""max-width: 600px; margin: 0 auto; padding: 20px; margin-top: 20px; border: 1px solid #ddd; border-radius: 10px;"">
    <div style=""background-color: #4CAF50; color: white; padding: 15px; text-align: center; border-radius: 10px 10px 0 0;"">
      <h1 style=""margin: 0; font-size: 24px;"">Masraf Formu Onaylandı</h1>
    </div>
    <div style=""padding: 20px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;"">
      <p>Sayın [OLUSTURAN_ADI],</p>
      <p>Masraf formunuz Mali İşler tarafından onaylanmıştır.</p>
      <div style=""background-color: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px;"">
        <p><strong>Form No:</strong> [FORM_NO]</p>
        <p><strong>Onaylayan:</strong> [MALI_ISLER_ONAYLAYAN]</p>
        <p><strong>Onay Tarihi:</strong> [ONAY_TARIHI]</p>
        <p><strong>Toplam Onaylanan Tutar:</strong> [TOPLAM_TUTAR] TL</p>
      </div>
      <p>Form detaylarını görüntülemek için aşağıdaki butona tıklayabilirsiniz:</p>
      <div style=""text-align: center; margin: 30px 0;"">
        <a href=""[DETAY_LINK]"" style=""background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px;"">Form Detaylarını Görüntüle</a>
      </div>
      <p><strong>Not:</strong> Tüm evraklar sistem tarafından otomatik olarak arşivlenmiştir.</p>
    </div>
    <div style=""text-align: center; padding: 20px; font-size: 12px; color: #666;"">
      <p>Bu mail otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
      <p>© 2026 Intellium A.Ş. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>";

        private const string RejectTemplate = @"<!DOCTYPE html>
<html lang=""tr"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <title>Masraf Formu Red Bildirimi</title>
</head>
<body style=""font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;"">
  <div style=""max-width: 600px; margin: 0 auto; padding: 20px; margin-top: 20px; border: 1px solid #ddd; border-radius: 10px;"">
    <div style=""background-color: #F44336; color: white; padding: 15px; text-align: center; border-radius: 10px 10px 0 0;"">
      <h1 style=""margin: 0; font-size: 24px;"">Masraf Formu Red Bildirimi</h1>
    </div>
    <div style=""padding: 20px; background-color: #f9f9f9; border-radius: 0 0 10px 10px;"">
      <p>Sayın ilgili,</p>
      <p>Aşağıdaki masraf formu reddedilmiştir:</p>
      <div style=""background-color: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 4px;"">
        <p><strong>Form No:</strong> [FORM_NO]</p>
        <p><strong>Reddeden:</strong> [IPTAL_EDEN]</p>
        <p><strong>Red Tarihi:</strong> [IPTAL_TARIHI]</p>
        <p><strong>Red Nedeni:</strong></p>
        <p>[IPTAL_NEDENI]</p>
      </div>
      <p>Form detaylarını görüntülemek için aşağıdaki butona tıklayabilirsiniz:</p>
      <div style=""text-align: center; margin: 30px 0;"">
        <a href=""[DETAY_LINK]"" style=""background-color: #F44336; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px;"">Form Detaylarını Görüntüle</a>
      </div>
      <p><strong>Not:</strong> Reddedilen formlar için gerekli düzeltmeleri yaparak tekrar gönderebilirsiniz.</p>
    </div>
    <div style=""text-align: center; padding: 20px; font-size: 12px; color: #666;"">
      <p>Bu mail otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
      <p>© 2026 Intellium A.Ş. Tüm hakları saklıdır.</p>
    </div>
  </div>
</body>
</html>";
    }
}

