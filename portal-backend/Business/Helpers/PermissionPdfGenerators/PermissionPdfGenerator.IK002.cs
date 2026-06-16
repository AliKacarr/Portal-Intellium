using Entities.Concrete;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;

namespace Business.Helpers.PermissionPdfGenerators
{
    public partial class PermissionPdfGenerator
    {
        private void DrawIK002(ColumnDescriptor col, Permission p, User user, double days, DateTime jobStartDate)
        {
            // STİLLER
            // Sol taraftaki kalın başlıklar
            IContainer Label(IContainer c) => c.BorderBottom(1).BorderColor(Colors.Black).Padding(5).AlignLeft().AlignMiddle().DefaultTextStyle(x => x.Bold());
            // Sağ taraftaki değerler
            IContainer Value(IContainer c) => c.BorderBottom(1).BorderLeft(1).BorderColor(Colors.Black).Padding(5).AlignLeft().AlignMiddle();

            // --- 1. KİŞİSEL BİLGİ TABLOSU ---
            col.Item().Border(1).BorderColor(Colors.Black).Table(table =>
            {
                table.ColumnsDefinition(c => { c.ConstantColumn(180); c.RelativeColumn(); });

                // Satır 1
                table.Cell().Element(Label).Text("Talepte Bulunan Personelin;\nAdı ve Soyadı");
                table.Cell().Element(Value).Text(user.Name);

                // Satır 2
                table.Cell().Element(Label).Text("Mazeret İzni Talebi\nNedenleri");
                table.Cell().Element(Value).Text(p.Description ?? p.PermissionTypeRef?.SubPermission ?? "Mazeret");

                // Satır 3
                table.Cell().Element(Label).Text("Mazeret İznine\nAyrılma Tarihi");
                table.Cell().Element(Value).Text(p.StartTime.ToString("dd.MM.yyyy"));

                // Satır 4 (Son satırda alt çizgi kaldırılır)
                table.Cell().BorderBottom(0).Padding(5).AlignLeft().AlignMiddle().DefaultTextStyle(x => x.Bold())
                     .Text("Mazeret İzni Süresince Yerine\nGörevlendirilen Personelin Adı");
                
                table.Cell().BorderBottom(0).BorderLeft(1).BorderColor(Colors.Black).Padding(5).AlignLeft().AlignMiddle()
                     .Text("-");
            });

            // --- 2. İMZA TABLOSU ---
            col.Item().PaddingTop(15).Table(table =>
            {
                table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); });
                
                // Başlıklar
                table.Cell().Border(1).BorderColor(Colors.Black).Padding(5).AlignCenter().DefaultTextStyle(x => x.Bold()).Text("Personel");
                table.Cell().Border(1).BorderColor(Colors.Black).Padding(5).AlignCenter().DefaultTextStyle(x => x.Bold()).Text("Yönetici / Üst Yönetim Onay");

                // İmza Boşlukları
                table.Cell().Border(1).BorderColor(Colors.Black).Height(50).AlignCenter().AlignMiddle().Text(""); // Personel İmza
                table.Cell().Border(1).BorderColor(Colors.Black).Height(50).AlignCenter().AlignMiddle().Text(""); // Yönetici İmza
            });

            // --- 3. SÜRE VE TARİH TABLOSU ---
            col.Item().PaddingTop(15).Table(table =>
            {
                table.ColumnsDefinition(c => { c.RelativeColumn(); c.RelativeColumn(); c.RelativeColumn(); });

                IContainer Header(IContainer c) => c.Border(1).BorderColor(Colors.Black).Background(Colors.Grey.Lighten3).Padding(5).AlignCenter().AlignMiddle().DefaultTextStyle(x => x.Bold());
                IContainer Cell(IContainer c) => c.Border(1).BorderColor(Colors.Black).Padding(10).AlignCenter().AlignMiddle();

                // Başlıklar
                table.Cell().Element(Header).Text("Mazeret Bildirim\nTarihi");
                table.Cell().Element(Header).Text("Mazeret İzni\nSüresi");
                table.Cell().Element(Header).Text("Mazeret İzninden\nDönüş Tarihi");

                // Değerler
                table.Cell().Element(Cell).Text(DateTime.Now.ToString("dd.MM.yyyy")); 
                table.Cell().Element(Cell).Text($"{days:0.##} Gün");
                table.Cell().Element(Cell).Text(p.EndTime.ToString("dd.MM.yyyy"));
            });

            // --- 4. NOTLAR ---
            col.Item().PaddingTop(15).Text("Not 1: Personele Mazeret izni verilmesi ve süresinin belirlenmesi işverenin yetkisindedir.").FontSize(8);
            col.Item().PaddingTop(2).Text("Not 2: Aşağıda yazılı mazeret izinleri dışındaki izinler ücretsiz olarak kullandırılacaktır, bu tür izinlerin verilmesi işverenin yetkisi dahilinde bulunmaktadır.").FontSize(8);
            
            // --- 5. MAZERET LİSTESİ (Birebir Metinler) ---
            col.Item().PaddingTop(10).Border(1).BorderColor(Colors.Black).Table(table =>
            {
                table.ColumnsDefinition(c => { c.RelativeColumn(); c.ConstantColumn(160); });
                
                // Başlık Satırı
                table.Cell().BorderBottom(1).BorderColor(Colors.Black).Padding(4).DefaultTextStyle(x => x.Bold()).Text("Mazeret İzin Türü");
                table.Cell().BorderBottom(1).BorderLeft(1).BorderColor(Colors.Black).Padding(4).DefaultTextStyle(x => x.Bold()).Text("İzin Süresi");

                // Yardımcı Fonksiyon
                void AddRow(string tur, string sure)
                {
                    table.Cell().BorderBottom(1).BorderColor(Colors.Black).Padding(4).Text(tur).FontSize(8);
                    table.Cell().BorderBottom(1).BorderLeft(1).BorderColor(Colors.Black).Padding(4).Text(sure).FontSize(8);
                }

                AddRow("Evlilik", "3 Güne Kadar (Belgelendirilerek)");
                AddRow("Eşinin, çocuğunun, anne, baba ve kardeşlerinin ölümü", "3 Güne Kadar");
                AddRow("Eşinin doğum yapması (babalık izni)", "5 Gün (Belgelendirilerek)");
                AddRow("Çocuğunun evlenmesi", "1 Gün");
                AddRow("Ev Değiştirilmesi", "1 Gün (Belgelendirilerek)");
                AddRow("Hastalık", "1 Gün");
                
                // Son satırda alt çizgi olmasın
                table.Cell().Padding(4).Text("Doğal afetlere uğraması").FontSize(8);
                table.Cell().BorderLeft(1).BorderColor(Colors.Black).Padding(4).Text("3 Güne kadar").FontSize(8);
            });
        }
    }
}