using Entities.Concrete;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;

namespace Business.Helpers.PermissionPdfGenerators
{
    public partial class PermissionPdfGenerator
    {
        private void DrawIK005(ColumnDescriptor col, Permission p, User user, double days, DateTime jobStartDate)
        {
            // STİLLER
            IContainer HeaderGray(IContainer c) => c.Border(1).BorderColor(Colors.Black).Background(Colors.Grey.Lighten3).Padding(2).AlignCenter().AlignMiddle();
            IContainer CellLabel(IContainer c) => c.Border(1).BorderColor(Colors.Black).Padding(3).AlignLeft().AlignMiddle();
            IContainer CellValue(IContainer c) => c.Border(1).BorderColor(Colors.Black).Padding(3).AlignLeft().AlignMiddle();

            // --- ANA GÖVDE ---
            col.Item().Row(row =>
            {
                // ================= SOL SÜTUN =================
                row.RelativeItem().PaddingRight(5).Column(left =>
                {
                    // 1. İK TABLOSU
                    left.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(1.4f); c.RelativeColumn(2); }); // Etiket sütununu biraz genişlettim

                        // Başlık (DÜZELTİLDİ: İnsan Kaynakları)
                        table.Cell().ColumnSpan(2).Element(HeaderGray)
                             .Text("** Bu Bölüm İnsan Kaynakları Tarafından Doldurulacaktır.").FontSize(7).Bold().Italic();

                        // Satırlar (DÜZELTİLDİ: Uzun İsimlendirmeler)
                        table.Cell().Element(CellLabel).Text("Personelin Adı");
                        table.Cell().Element(CellValue).Text(user.Name);

                        table.Cell().Element(CellLabel).Text("Görevi");
                        table.Cell().Element(CellValue).Text("Personel");

                        table.Cell().Element(CellLabel).Text("İşe Giriş Tarihi");
                        table.Cell().Element(CellValue).Text(jobStartDate != DateTime.MinValue ? jobStartDate.ToString("dd.MM.yyyy") : "-");

                        // Görseldeki gibi yüksek alan
                        table.Cell().Element(CellLabel).Text("İzin Talebinin Gerekçesi");
                        table.Cell().Element(CellValue).MinHeight(60).Text(p.Description ?? "Ücretsiz İzin");

                        table.Cell().Element(CellLabel).Text("İzin Başlangıç Tarihi");
                        table.Cell().Element(CellValue).Text(p.StartTime.ToString("dd.MM.yyyy"));

                        table.Cell().Element(CellLabel).Text("İzin Bitiş\n(İşe Başlama) Tarihi"); // Alt alta
                        table.Cell().Element(CellValue).Text(p.EndTime.ToString("dd.MM.yyyy"));

                        table.Cell().Element(CellLabel).Text("İzin Gün Sayısı");
                        table.Cell().Element(CellValue).Text($"{days:0.##}");
                    });

                    // 2. İLETİŞİM TABLOSU
                    left.Item().PaddingTop(5).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(1.4f); c.RelativeColumn(2); });

                        table.Cell().ColumnSpan(2).Element(HeaderGray)
                             .Text("** Bu Bölüm Personel Tarafından Doldurulacaktır.").FontSize(7).Bold().Italic();

                        table.Cell().Element(CellLabel).Text("İrtibat Telefon No");
                        table.Cell().Element(CellValue).Text(p.PhoneNumber ?? "");

                        table.Cell().Element(CellLabel).Height(50).AlignMiddle().Text("İzinde Bulunacağı Adres");
                        table.Cell().Element(CellValue).Height(50).AlignMiddle().Text(p.Address ?? "");
                    });
                });

                // ================= SAĞ SÜTUN (BEYAN VE İMZA) =================
                row.RelativeItem().PaddingLeft(5).Border(1).BorderColor(Colors.Black).Column(right =>
                {
                    // Başlık
                    right.Item().Background(Colors.Grey.Lighten3).Padding(2).BorderBottom(1).BorderColor(Colors.Black).AlignCenter()
                         .Text("** Bu Bölüm Personel Tarafından Doldurulacaktır.").FontSize(7).Bold().Italic();

                    // Beyan Metni
                    right.Item().Padding(8).Column(c =>
                    {
                        c.Item().AlignCenter().Text("İnsan Kaynakları Birimi'ne").Bold().FontSize(9);
                        
                        // ÖZEL METİN
                        c.Item().PaddingTop(5).Text("Detayları verilen tarihlerde ücretsiz izin kullanmak istiyorum. Talep ettiğim iznin ÜCRETSİZ İZİN mahiyetinde olacağını ve ücretimden düşüleceğini biliyorum ve gereğinin yapılmasını arz ediyorum.").Justify().FontSize(8);
                        
                        c.Item().PaddingTop(15).Text("Saygılarımla,").FontSize(8);
                        
                        c.Item().PaddingTop(10).Row(r => 
                        {
                            r.RelativeItem().Text("Personelin Adı:").FontSize(8).Bold();
                            r.RelativeItem().AlignRight().Text(user.Name).FontSize(8);
                        });
                        c.Item().Row(r => 
                        {
                            r.RelativeItem().Text("İzin Talep Tarihi:").FontSize(8).Bold();
                            r.RelativeItem().AlignRight().Text(DateTime.Now.ToString("dd.MM.yyyy")).FontSize(8);
                        });

                        c.Item().PaddingTop(10).Text("İmza:").FontSize(8).Bold();
                        c.Item().Height(30);
                    });
                });
            });

            // --- DÜŞÜNCE VE ONAY ---
            col.Item().PaddingTop(10).Border(1).BorderColor(Colors.Black).Column(c =>
            {
                c.Item().MinHeight(45).Row(r => 
                {
                    r.ConstantItem(120).Background(Colors.Grey.Lighten3).BorderRight(1).BorderColor(Colors.Black)
                     .Padding(5).AlignCenter().AlignMiddle().Text("DÜŞÜNCE VE ONAY").Bold().FontSize(9);

                    r.RelativeItem().Padding(5).AlignMiddle()
                     .Text($"Kimliği yukarıda yer alan personelimizin, {p.StartTime:dd.MM.yyyy} tarihinde ayrılmak ve {p.EndTime:dd.MM.yyyy} tarihinde göreve başlamak kaydıyla ücretsiz izin kullanması uygundur.").FontSize(8);
                });

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

            // --- İZİNDEN DÖNÜŞ (DİP KISIM) ---
            col.Item().PaddingTop(10).Border(1).BorderColor(Colors.Black).Column(c =>
            {
                c.Item().Padding(5).Text("İzinden Dönünce Personel Tarafından Doldurulacaktır.").FontSize(8).Bold();
                c.Item().Padding(5).Text($"...../...../20..... Tarihi ile ...../...../20... Tarihleri arasında ücretsiz izin kullandım.").FontSize(8);

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
            });
        }
    }
}