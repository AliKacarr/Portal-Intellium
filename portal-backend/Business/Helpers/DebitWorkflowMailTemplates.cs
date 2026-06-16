using System;

namespace Business.Helpers
{
    internal static class DebitWorkflowMailTemplates
    {
        internal static string BuildAssignedHtml(string fullName, string productText, string portalUrl)
        {
            return BaseTemplate(
                title: "Zimmet gönderildi",
                accentColor: "#2563EB",
                greeting: $"Merhaba {Html(fullName)},",
                lead: "Size bir zimmet gönderildi.",
                itemsHtml:
                    Row("Ürün", productText) +
                    Row("İşlem", "Portala girip teslim aldığınızı onaylayabilirsiniz."),
                ctaText: "Portala Git",
                ctaUrl: portalUrl
            );
        }

        internal static string BuildDeliveredHtml(string fullName, string portalUrl)
        {
            return BaseTemplate(
                title: "Zimmet teslim alındı",
                accentColor: "#16A34A",
                greeting: $"Merhaba {Html(fullName)},",
                lead: "Zimmetiniz teslim alındı olarak güncellendi.",
                itemsHtml: Row("Bilgi", "Tutanak PDF’ini portal üzerinden görüntüleyebilirsiniz."),
                ctaText: "Portala Git",
                ctaUrl: portalUrl
            );
        }

        internal static string BuildDeliveryFailedHtml(string fullName, string? note, string portalUrl)
        {
            var items = Row("Durum", "Zimmetiniz Teslim Edilemedi olarak güncellendi.");
            if (!string.IsNullOrWhiteSpace(note))
                items += Row("Not", note.Trim());

            return BaseTemplate(
                title: "Zimmet teslim edilemedi",
                accentColor: "#DC2626",
                greeting: $"Merhaba {Html(fullName)},",
                lead: "Zimmet teslimat sürecinde bir güncelleme var.",
                itemsHtml: items,
                ctaText: "Portala Git",
                ctaUrl: portalUrl
            );
        }

        internal static string BuildRequestApprovedHtml(string fullName, string portalUrl)
        {
            return BaseTemplate(
                title: "Zimmet talebiniz onaylandı",
                accentColor: "#16A34A",
                greeting: $"Merhaba {Html(fullName)},",
                lead: "Zimmet talebiniz onaylandı.",
                itemsHtml: Row("Bilgi", "Detayları portal üzerinden görüntüleyebilirsiniz."),
                ctaText: "Taleplerime Git",
                ctaUrl: portalUrl
            );
        }

        internal static string BuildRequestRejectedHtml(string fullName, string portalUrl)
        {
            return BaseTemplate(
                title: "Zimmet talebiniz reddedildi",
                accentColor: "#DC2626",
                greeting: $"Merhaba {Html(fullName)},",
                lead: "Zimmet talebiniz reddedildi.",
                itemsHtml: Row("Bilgi", "Detayları portal üzerinden görüntüleyebilirsiniz."),
                ctaText: "Taleplerime Git",
                ctaUrl: portalUrl
            );
        }

        private static string BaseTemplate(
            string title,
            string accentColor,
            string greeting,
            string lead,
            string itemsHtml,
            string ctaText,
            string ctaUrl)
        {
            var safeCtaUrl = string.IsNullOrWhiteSpace(ctaUrl) ? "#" : HtmlAttr(ctaUrl);
            var year = DateTime.Now.Year;

            return $@"<!DOCTYPE html>
<html lang=""tr"">
<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <title>{Html(title)}</title>
</head>
<body style=""margin:0; padding:0; background:#f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; color:#111827;"">
  <div style=""max-width:680px; margin:0 auto; padding:24px 16px;"">
    <div style=""background:#ffffff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden;"">
      <div style=""background:{HtmlAttr(accentColor)}; padding:18px 20px;"">
        <div style=""font-size:16px; font-weight:700; color:#ffffff;"">{Html(title)}</div>
        <div style=""font-size:12px; color:rgba(255,255,255,0.92); margin-top:4px;"">Portal Intellium</div>
      </div>

      <div style=""padding:20px;"">
        <div style=""font-size:14px; margin-bottom:10px;"">{greeting}</div>
        <div style=""font-size:14px; color:#374151; margin-bottom:14px;"">{Html(lead)}</div>

        <div style=""background:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:14px 14px 6px 14px; margin:14px 0;"">
          {itemsHtml}
        </div>

        <div style=""text-align:center; margin:18px 0 6px 0;"">
          <a href=""{safeCtaUrl}"" style=""display:inline-block; background:{HtmlAttr(accentColor)}; color:#ffffff; text-decoration:none; padding:12px 18px; border-radius:10px; font-weight:700; font-size:14px;"">{Html(ctaText)}</a>
        </div>

        <div style=""font-size:12px; color:#6b7280; margin-top:10px;"">
          Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.
        </div>
      </div>
    </div>

    <div style=""text-align:center; font-size:12px; color:#9ca3af; margin-top:14px;"">
      © {year} Intellium A.Ş. Tüm hakları saklıdır.
    </div>
  </div>
</body>
</html>";
        }

        private static string Row(string label, string value) =>
            $@"<div style=""display:flex; gap:12px; padding:8px 0; border-bottom:1px solid #eef2f7;"">
  <div style=""width:120px; font-size:12px; color:#6b7280; font-weight:600;"">{Html(label)}</div>
  <div style=""flex:1; font-size:13px; color:#111827;"">{Html(value)}</div>
</div>";

        private static string Html(string? s) =>
            (s ?? string.Empty)
                .Replace("&", "&amp;")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\"", "&quot;")
                .Replace("'", "&#39;");

        private static string HtmlAttr(string? s) => Html(s);
    }
}

