using System;

namespace Business.Helpers
{
    internal static class RequestDisplayCode
    {
        /// <summary>
        /// UI'da gösterilecek 8 haneli talep kodu.
        /// Hedef: uzun/GUID requestId'leri mail/bildirimde göstermemek; deterministik bir kısa kod üretmek.
        /// </summary>
        internal static string FormatRequestDisplayCode8(string? requestId)
        {
            var raw = (requestId ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(raw))
                return string.Empty;

            // GUID ise: dash'siz 32 hex'ten son 8.
            if (Guid.TryParse(raw, out var g))
            {
                var hex = g.ToString("N").ToUpperInvariant();
                return hex.Length <= 8 ? hex : hex[^8..];
            }

            // re_..., vb: harf/rakam filtrele, büyük harfe çevir, sondan 8 al.
            Span<char> buf = raw.Length <= 128 ? stackalloc char[raw.Length] : new char[raw.Length];
            var idx = 0;
            foreach (var ch in raw)
            {
                if (char.IsLetterOrDigit(ch))
                    buf[idx++] = char.ToUpperInvariant(ch);
            }

            if (idx == 0)
                return string.Empty;

            var cleaned = new string(buf[..idx]);
            return cleaned.Length <= 8 ? cleaned : cleaned[^8..];
        }
    }
}

