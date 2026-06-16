using System;

namespace Entities.Concrete
{
    /// <summary>Talep Yönetimi durumları (veritabanında Türkçe metin olarak saklanır).</summary>
    public enum TalepDurumu
    {
        Taslak = 1,
        Gonderildi = 2,
        Incelemede = 3,
        EkBilgiBekleniyor = 4,
        OnayBekliyor = 5,
        IslemeAlindi = 6,
        Tamamlandi = 7,
        Reddedildi = 8,
        IptalEdildi = 9
    }

    public static class TalepDurumuTurkish
    {
        public static string ToTurkish(TalepDurumu v) => v switch
        {
            TalepDurumu.Taslak => "Taslak",
            TalepDurumu.Gonderildi => "Gönderildi",
            TalepDurumu.Incelemede => "İncelemede",
            TalepDurumu.EkBilgiBekleniyor => "Ek Bilgi Bekleniyor",
            TalepDurumu.OnayBekliyor => "Onay Bekliyor",
            TalepDurumu.IslemeAlindi => "İşleme Alındı",
            TalepDurumu.Tamamlandi => "Tamamlandı",
            TalepDurumu.Reddedildi => "Reddedildi",
            TalepDurumu.IptalEdildi => "İptal Edildi",
            _ => throw new ArgumentOutOfRangeException(nameof(v), v, null)
        };

        public static bool TryParseTurkish(string? input, out TalepDurumu value)
        {
            value = default;
            if (string.IsNullOrWhiteSpace(input))
                return false;

            var s = input.Trim();
            foreach (TalepDurumu e in Enum.GetValues(typeof(TalepDurumu)))
            {
                if (string.Equals(ToTurkish(e), s, StringComparison.OrdinalIgnoreCase))
                {
                    value = e;
                    return true;
                }
            }

            return false;
        }

        public static TalepDurumu ParseTurkishOrDefault(string? input, TalepDurumu fallback)
        {
            return TryParseTurkish(input, out var v) ? v : fallback;
        }
    }
}
