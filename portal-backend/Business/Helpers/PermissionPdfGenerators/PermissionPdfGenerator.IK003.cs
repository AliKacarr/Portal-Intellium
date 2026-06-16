using Entities.Concrete;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;

namespace Business.Helpers.PermissionPdfGenerators
{
    public partial class PermissionPdfGenerator
    {
        private void DrawIK003(ColumnDescriptor col, Permission p, User user, double days, DateTime jobStartDate, string declarationText = null)
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
                        table.ColumnsDefinition(c => { c.RelativeColumn(1.3f); c.RelativeColumn(2); });

                        // Başlık
                        table.Cell().ColumnSpan(2).Element(HeaderGray)
                             .Text("** Bu Bölüm İnsan Kaynakları Tarafından Doldurulacaktır.").FontSize(7).Bold().Italic();

                        // Satırlar
                        table.Cell().Element(CellLabel).Text("Personelin Adı");
                        table.Cell().Element(CellValue).Text(user.Name);

                        table.Cell().Element(CellLabel).Text("Görevi");
                        table.Cell().Element(CellValue).Text("Personel");

                        table.Cell().Element(CellLabel).Text("İşe Giriş Tarihi");
                        table.Cell().Element(CellValue).Text(jobStartDate != DateTime.MinValue ? jobStartDate.ToString("dd.MM.yyyy") : "-");

                        // Gerekçe Alanı
                        table.Cell().Element(CellLabel).Text("İzin Talebinin Gerekçesi\n(Mazeret izinlerinde detay belirtiniz)");
                        table.Cell().Element(CellValue).Text(p.Description ?? "-");

                        table.Cell().Element(CellLabel).Text("İzin Başlangıç Tarihi");
                        table.Cell().Element(CellValue).Text(p.StartTime.ToString("dd.MM.yyyy"));

                        table.Cell().Element(CellLabel).Text("İzin Bitiş (İşe Başlama) Tarihi");
                        table.Cell().Element(CellValue).Text(p.EndTime.ToString("dd.MM.yyyy"));

                        table.Cell().Element(CellLabel).Text("İzin Gün Sayısı");
                        table.Cell().Element(CellValue).Text($"{days:0.##}");
                    });

                    // 2. İLETİŞİM TABLOSU
                    left.Item().PaddingTop(5).Table(table =>
                    {
                        table.ColumnsDefinition(c => { c.RelativeColumn(1.3f); c.RelativeColumn(2); });

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
                        
                        // Dinamik beyan metni: PermissionManager'dan senaryo bazlı üretilir
                        // (Senaryo 1: 1 yıl doldurmamış / Senaryo 2: yeterli bakiye / Senaryo 3: bakiye aşıyor)
                        string beyanText = declarationText ?? p.Description ?? "-";

                        c.Item().PaddingTop(5).Text(beyanText).Justify().FontSize(8);
                        

                        // İsim Tarih İmza
                        c.Item().PaddingTop(15).Row(r => 
                        {
                            r.RelativeItem().Text("Personelin Adı:").FontSize(8).Bold();
                            r.RelativeItem().AlignRight().Text("İzin Talep Tarihi:").FontSize(8).Bold();
                        });
                        c.Item().Row(r => 
                        {
                            r.RelativeItem().Text(user.Name).FontSize(8);
                            r.RelativeItem().AlignRight().Text(DateTime.Now.ToString("dd.MM.yyyy")).FontSize(8);
                        });

                        c.Item().PaddingTop(15).Text("İmza:").FontSize(8).Bold();
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
                     .Text($"Kimliği yukarıda yer alan personelimizin, {p.StartTime:dd.MM.yyyy} Tarihinde ayrılmak ve {p.EndTime:dd.MM.yyyy} Tarihinde göreve başlamak kaydıyla kullanması uygundur.").FontSize(8);
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

            // --- İZİNDEN DÖNÜŞ (IK-003 Özel Formatı) ---
            col.Item().PaddingTop(10).Border(1).BorderColor(Colors.Black).Column(c =>
            {
                // Başlık Satırı
                c.Item().BorderBottom(1).BorderColor(Colors.Black).Background(Colors.Grey.Lighten3).Padding(2).AlignCenter()
                    .Text("İzinden Dönünce Personel Tarafından Doldurulacaktır.").FontSize(7).Bold().Italic();

                c.Item().Padding(5).Text($"20... Yılına ait yıllık ücretli izin hakkımı .../.../20... Tarihi ile .../.../20... Tarihleri arasında kullandım.").FontSize(8);

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