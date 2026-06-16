using Entities.Concrete;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;

namespace Business.Helpers.PermissionPdfGenerators
{
    public partial class PermissionPdfGenerator
    {
        private void DrawIK004(ColumnDescriptor col, Permission p, User user, double hours, DateTime jobStartDate)
        {
            // STİLLER
            IContainer HeaderGray(IContainer c) => c.Border(1).BorderColor(Colors.Black).Background(Colors.Grey.Lighten3).Padding(4).AlignCenter().AlignMiddle();
            IContainer Label(IContainer c) => c.Border(1).BorderColor(Colors.Black).Padding(5).AlignLeft().AlignMiddle();
            IContainer Value(IContainer c) => c.Border(1).BorderColor(Colors.Black).Padding(5).AlignLeft().AlignMiddle();

            // --- 1. BİLGİ TABLOSU ---
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(c => { c.ConstantColumn(160); c.RelativeColumn(); });

                // Başlık Satırı (Gri Şerit)
                table.Cell().ColumnSpan(2).Element(HeaderGray)
                     .Text("PERSONELİN").FontSize(10).Bold();

                // Satırlar
                table.Cell().Element(Label).Text("Adı ve Soyadı").Bold();
                table.Cell().Element(Value).Text(user.Name);

                table.Cell().Element(Label).Text("Tarih").Bold();
                table.Cell().Element(Value).Text(p.StartTime.ToString("dd.MM.yyyy"));

                table.Cell().Element(Label).Text("İzne Çıkış Saati").Bold();
                table.Cell().Element(Value).Text(p.StartTime.ToString("HH:mm"));

                table.Cell().Element(Label).Text("İzinden Döneceği Saat").Bold();
                table.Cell().Element(Value).Text(p.EndTime.ToString("HH:mm"));

                table.Cell().Element(Label).Text("Toplam İzinli Saat").Bold();
                table.Cell().Element(Value).Text($"{hours:0.##} Saat");

                // Açıklama (Biraz daha geniş olabilir)
                table.Cell().Element(Label).AlignTop().Text("Açıklama").Bold();
                table.Cell().Element(Value).MinHeight(40).Text(p.Description ?? "-");
            });

            // --- 2. İMZA BÖLÜMÜ ---
            col.Item().PaddingTop(20).Table(table =>
            {
                table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });

                // Başlıklar
                table.Cell().Border(1).BorderColor(Colors.Black).Background(Colors.Grey.Lighten3).Padding(5).AlignCenter().Text("Personel İmza").Bold();
                table.Cell().Border(1).BorderColor(Colors.Black).Background(Colors.Grey.Lighten3).Padding(5).AlignCenter().Text("Yönetici İmza").Bold();

                // İmza Alanları
                table.Cell().Border(1).BorderColor(Colors.Black).Height(60).AlignCenter().AlignMiddle(); // Boş
                table.Cell().Border(1).BorderColor(Colors.Black).Height(60).AlignCenter().AlignMiddle(); // Boş
            });

            // --- 3. DİPNOT (Tablo içine alarak çerçeveli yapıyoruz) ---
            col.Item().PaddingTop(10).Border(1).BorderColor(Colors.Black).Padding(5).Column(c =>
            {
                c.Item().Text("Personele saatlik izin verilmesi ve süresinin belirlenmesi işverenin yetkisindedir.").FontSize(8).Italic();
            });
        }
    }
}