using Entities.Concrete;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;

namespace Business.Helpers.PermissionPdfGenerators
{
    public partial class PermissionPdfGenerator
    {
        private void DrawIK001(ColumnDescriptor col, Permission p, User user, double days, DateTime jobStartDate, string declarationText = null)
        {
            // STİLLER
            IContainer HeaderGray(IContainer c) => c.Border(1).BorderColor(Colors.Black).Background(Colors.Grey.Lighten3).Padding(2).AlignCenter().AlignMiddle();
            IContainer CellLabel(IContainer c) => c.Border(1).BorderColor(Colors.Black).Padding(3).AlignLeft().AlignMiddle();
            IContainer CellValue(IContainer c) => c.Border(1).BorderColor(Colors.Black).Padding(3).AlignLeft().AlignMiddle();

            // --- ANA GÖVDE (ÜST KISIM) ---
            col.Item().Row(row =>
            {
                // SOL SÜTUN (KİŞİSEL BİLGİLER + İLETİŞİM)
                row.RelativeItem().PaddingRight(5).Column(left =>
                {
                    // 1. Tablo: İK Bilgileri
                    left.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(1.3f); c.RelativeColumn(2); });

                        // Tablo Başlığı (İTALİK YAPILDI)
                        table.Cell().ColumnSpan(2).Element(HeaderGray)
                             .Text("Bu Bölüm İnsan Kaynakları Tarafından Doldurulacaktır.").FontSize(7).Bold().Italic();

                        // Satırlar
                        table.Cell().Element(CellLabel).Text("Personelin Adı");
                        table.Cell().Element(CellValue).Text(user.Name);

                        table.Cell().Element(CellLabel).Text("Görevi");
                        table.Cell().Element(CellValue).Text("Personel"); 

                        table.Cell().Element(CellLabel).Text("İşe Giriş Tarihi");
                        table.Cell().Element(CellValue).Text(jobStartDate != DateTime.MinValue ? jobStartDate.ToString("dd.MM.yyyy") : "-");

                        table.Cell().Element(CellLabel).Text("Yıllık İzni Hak Ettiği Tarih");
                        table.Cell().Element(CellValue).Text(DateTime.Now.ToString("dd.MM.yyyy"));

                        table.Cell().Element(CellLabel).Text("İzin Başlangıç Tarihi");
                        table.Cell().Element(CellValue).Text(p.StartTime.ToString("dd.MM.yyyy"));

                        table.Cell().Element(CellLabel).Text("İzin Bitiş (İşe Başlama) Tarihi");
                        table.Cell().Element(CellValue).Text(p.EndTime.ToString("dd.MM.yyyy"));

                        table.Cell().Element(CellLabel).Text("İzin Gün Sayısı");
                        table.Cell().Element(CellValue).Text($"{days:0.##}");
                    });

                    // 2. Tablo: İletişim Bilgileri (Hemen altında)
                    left.Item().PaddingTop(5).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(1.3f); c.RelativeColumn(2); });

                        // Tablo Başlığı (İTALİK YAPILDI)
                        table.Cell().ColumnSpan(2).Element(HeaderGray)
                             .Text("** Bu Bölüm Personel Tarafından Doldurulacaktır.").FontSize(7).Bold().Italic();

                        table.Cell().Element(CellLabel).Text("İrtibat Telefon No");
                        table.Cell().Element(CellValue).Text(p.PhoneNumber ?? "");

                        table.Cell().Element(CellLabel).Height(50).AlignMiddle().Text("İzinde Bulunacağı Adres");
                        table.Cell().Element(CellValue).Height(50).AlignMiddle().Text(p.Address ?? "");
                    });
                });

                // SAĞ SÜTUN (DİLEKÇE KISMI)
                row.RelativeItem().PaddingLeft(5).Border(1).BorderColor(Colors.Black).Column(right =>
                {
                    // Başlık Gri (İTALİK YAPILDI)
                    right.Item().Background(Colors.Grey.Lighten3).Padding(2).BorderBottom(1).BorderColor(Colors.Black).AlignCenter()
                         .Text("** Bu Bölüm Personel Tarafından Doldurulacaktır.").FontSize(7).Bold().Italic();

                    // Beyaz Alan
                    right.Item().Padding(8).Column(c =>
                    {
                        c.Item().Text("İnsan Kaynakları Birimi'ne").Bold().FontSize(9);

                        // Dinamik beyan metni: PermissionManager'dan senaryo bazlı üretilir
                        string beyanText = declarationText ?? p.Description ?? $"Yıllık Ücretli İzin kullanma dönemim olan {p.StartTime:dd.MM.yyyy} ile {p.EndTime:dd.MM.yyyy} Tarihleri arasında kullanmak istediğim izin hakkımı kullanmak istiyorum.";

                        c.Item().PaddingTop(5).Text(beyanText).Justify().FontSize(8);

                        // İsim ve Tarih
                        c.Item().PaddingTop(10).Row(r => 
                        {
                            r.RelativeItem().Text("Personelin Adı:").FontSize(8).Bold();
                            r.RelativeItem().AlignRight().Text("İzin Talep Tarihi:").FontSize(8).Bold();
                        });
                        c.Item().Row(r => 
                        {
                            r.RelativeItem().Text(user.Name).FontSize(8);
                            r.RelativeItem().AlignRight().Text(DateTime.Now.ToString("dd.MM.yyyy")).FontSize(8);
                        });

                        // İmza
                        c.Item().PaddingTop(15).Text("İmza:").FontSize(8).Bold();
                        c.Item().Height(25); // İmza boşluğu
                    });
                });
            });

            // --- ORTA KISIM (DÜŞÜNCE VE ONAY) ---
            col.Item().PaddingTop(10).Border(1).BorderColor(Colors.Black).Column(c =>
            {
                c.Item().MinHeight(45).Row(r => 
                {
                    // Sol Gri Blok
                    r.ConstantItem(120).Background(Colors.Grey.Lighten3).BorderRight(1).BorderColor(Colors.Black)
                     .Padding(5).AlignCenter().AlignMiddle().Text("DÜŞÜNCE VE ONAY").Bold().FontSize(9);

                    // Sağ Açıklama
                    r.RelativeItem().Padding(5).AlignMiddle().Text($"Kimliği yukarıda yer alan personelimizin, {p.StartTime:dd.MM.yyyy} Tarihinde ayrılmak ve {p.EndTime:dd.MM.yyyy} Tarihinde göreve başlamak kaydıyla kullanması uygundur.").FontSize(8);
                });

                // Onay Kutuları
                c.Item().BorderTop(1).BorderColor(Colors.Black).Row(r =>
                {
                    r.RelativeItem().BorderRight(1).BorderColor(Colors.Black).Padding(2).Column(cc => 
                    {
                        cc.Item().AlignCenter().Text("ONAY").Bold().FontSize(8);
                        cc.Item().Height(50);
                    });
                    r.RelativeItem().Padding(2).Column(cc => 
                    {
                        cc.Item().AlignCenter().Text("ONAY").Bold().FontSize(8);
                        cc.Item().Height(50);
                    });
                });
            });

            // --- ALT KISIM (DÖNÜŞ BİLDİRİMİ) ---
            col.Item().PaddingTop(10).Border(1).BorderColor(Colors.Black).Column(c =>
            {
                // Beyan Metni
                c.Item().Padding(5).Text($"..... Yılına ait yıllık ücretli izin hakkımı .../.../.... Tarihi ile .../.../.... Tarihleri arasında kullandım.").FontSize(8);

                // İmza ve Tarih Kutusu
                c.Item().PaddingTop(5).BorderTop(1).BorderColor(Colors.Black).Row(r =>
                {
                    r.RelativeItem().BorderRight(1).BorderColor(Colors.Black).Padding(5).Height(35).AlignCenter().Column(cc => 
                    {
                        cc.Item().Text("İmza").Bold().FontSize(8);
                    });
                    r.RelativeItem().Padding(5).Height(35).AlignCenter().Column(cc => 
                    {
                        cc.Item().Text("İş Başı Tarihi").Bold().FontSize(8);
                    });
                });

                // UYARI METİNLERİ
                c.Item().BorderTop(1).BorderColor(Colors.Black).Padding(5).Column(cc =>
                {
                    cc.Item().Text("Farklı tarihleri kapsayan her izin dönemi için ayrı ayrı izin formu kullanılması gerekir.").FontSize(7).Italic();
                    cc.Item().Text("İzin dönüşü iş başı yapıldığında izninizi kullandığınıza dair imzanızı atmayı unutmayınız.").FontSize(7).Italic();
                });
            });
        }
    }
}