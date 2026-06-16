using Entities.Concrete;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

namespace Business.Helpers.DebitHelpers
{
    public class GetDebitPDFPath
    {
        public GetDebitPDFPath()
        {
            // Lisans Ayarı
            QuestPDF.Settings.License = LicenseType.Community;
        }

        // DÖNÜŞ TİPİNİ DEĞİŞTİRDİM: string -> byte[]
        public byte[] CreateDebitPdf(Debit debit, User receiver, string receiverTitle, Product product, User deliverer)
        {
            // 1. Logo Yolu (Sadece okumak için lazım, kaydetmek için değil)
            string wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            string logoPath = Path.Combine(wwwrootPath, "logo.png"); 

            // Not: saveFolder, fileName gibi kodları SİLDİM. Çünkü diske yazmayacağız.

            // 2. PDF Çizimi ve RAM'de Oluşturma
            var pdfData = QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1.5f, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(10).FontFamily(Fonts.Arial));

                    // --- BAŞLIK ---
                    page.Header().Border(1).BorderColor(Colors.Grey.Medium).Row(row =>
                    {
                        row.RelativeItem().Padding(10).Column(col =>
                        {
                            if (System.IO.File.Exists(logoPath))
                            {
                                byte[] logoBytes = System.IO.File.ReadAllBytes(logoPath);
                                col.Item().Height(40).Image(logoBytes, ImageScaling.FitArea);
                            }
                            else
                            {
                                col.Item().Text("intellium").FontSize(22).Bold().FontColor(Colors.Blue.Medium);
                                col.Item().Text("\"Innovative and Intelligent Solutions with AI\"").FontSize(8).Italic().FontColor(Colors.Blue.Lighten1);
                            }
                        });

                        row.RelativeItem().BorderLeft(1).BorderColor(Colors.Grey.Medium)
                           .Padding(10).AlignCenter().AlignMiddle()
                           .Text("ZİMMET TUTANAĞI").FontSize(16).FontColor(Colors.Blue.Darken2);
                    });

                    // --- İÇERİK ---
                    page.Content().PaddingVertical(20).Column(col =>
                    {
                        // PERSONEL TABLOSU
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns => { columns.ConstantColumn(120); columns.RelativeColumn(); });
                            
                            // Başlık Satırı
                            table.Cell().ColumnSpan(2).Border(1).BorderColor(Colors.Black).Background(Colors.White).Padding(2).PaddingLeft(5)
                                 .Text("PERSONELİN").Bold();

                            // Adı Soyadı
                            table.Cell().Border(1).BorderColor(Colors.Black).Background(Colors.White).Padding(2).PaddingLeft(5).Text("ADI SOYADI").Bold();
                            table.Cell().Border(1).BorderColor(Colors.Black).Padding(2).PaddingLeft(5).Text(receiver.Name ?? "");

                            // Unvanı
                            table.Cell().Border(1).BorderColor(Colors.Black).Background(Colors.White).Padding(2).PaddingLeft(5).Text("UNVANI").Bold();
                            table.Cell().Border(1).BorderColor(Colors.Black).Padding(2).PaddingLeft(5).Text(receiverTitle ?? "");
                        });

                        col.Item().PaddingVertical(15).Text("Aşağıda tanımı ve özellikleri belirtilen işyerimize ait emtia sağlam ve eksiksiz olarak teslim edilmiştir.").SemiBold();

                        // ÜRÜN TABLOSU
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(columns => { 
                                columns.RelativeColumn(); columns.RelativeColumn(); 
                                columns.RelativeColumn(); columns.RelativeColumn(); 
                            });

                            // Tablo Başlığı
                            table.Header(header =>
                            {
                                header.Cell().ColumnSpan(4).Border(1).BorderColor(Colors.Black).Background(Colors.White).Padding(5).AlignCenter().Text("TESLİM EDİLEN EMTİA").Bold();
                                header.Cell().ColumnSpan(2).Border(1).BorderColor(Colors.Black).Background(Colors.White).Padding(5).AlignCenter().Text("Ürün").Bold();
                                header.Cell().ColumnSpan(2).Border(1).BorderColor(Colors.Black).Background(Colors.White).Padding(5).AlignCenter().Text("Özellikleri").Bold();
                            });

                            var specs = new Dictionary<string, string>();
                            if (!string.IsNullOrEmpty(product.TechnicalSpecs))
                            {
                                try { specs = JsonConvert.DeserializeObject<Dictionary<string, string>>(product.TechnicalSpecs); } catch { }
                            }
                            var specList = specs.ToList();

                            var leftData = new List<(string Label, string Value)>
                            {
                                ("Ürün Kategorisi", product.Category),
                                ("Marka/Model", $"{product.Brand} {product.Model}"),
                                ("Seri No", product.SerialNumber),
                                ("Barkod No", product.BarcodeNumber ?? "-")
                            };

                            int maxRows = Math.Max(leftData.Count, specList.Count);
                            if (maxRows < 6) maxRows = 6; 

                            for (int i = 0; i < maxRows; i++)
                            {
                                // SOL SÜTUN
                                if (i < leftData.Count) {
                                    table.Cell().Border(1).BorderColor(Colors.Black).Background(Colors.White).Padding(5).Text(leftData[i].Label).Bold();
                                    table.Cell().Border(1).BorderColor(Colors.Black).Padding(5).Text(leftData[i].Value);
                                } else {
                                    table.Cell().Border(1).BorderColor(Colors.Black).Background(Colors.White).Padding(5).Text("");
                                    table.Cell().Border(1).BorderColor(Colors.Black).Padding(5).Text("");
                                }

                                // SAĞ SÜTUN
                                if (i < specList.Count) {
                                    table.Cell().Border(1).BorderColor(Colors.Black).Background(Colors.White).Padding(5).Text(specList[i].Key).Bold();
                                    table.Cell().Border(1).BorderColor(Colors.Black).Padding(5).Text(specList[i].Value);
                                } else {
                                    table.Cell().Border(1).BorderColor(Colors.Black).Background(Colors.White).Padding(5).Text("");
                                    table.Cell().Border(1).BorderColor(Colors.Black).Padding(5).Text("");
                                }
                            }
                        });

                        col.Item().PaddingTop(10).Text($"Teslim Tarihi:  {debit.DeliveryDate:dd.MM.yyyy}").Bold();

                        // İMZALAR
                        col.Item().PaddingTop(20).Row(row =>
                        {
                            row.RelativeItem().Column(c => {
                                c.Item().Text("Teslim Alan Personel").Bold();
                                c.Item().Text("(Adı Soyadı-İmza)");
                                c.Item().PaddingTop(15).Text(receiver.Name);
                            });
                            row.RelativeItem().AlignRight().Column(c => {
                                c.Item().Text("Teslim Eden Personel").Bold();
                                c.Item().Text("(Adı Soyadı-İmza)");
                                c.Item().PaddingTop(15).Text(deliverer?.Name ?? "Yönetici");
                            });
                        });

                        // GERİ TESLİM
                        col.Item().PaddingTop(40).Border(1).BorderColor(Colors.Black).Column(c =>
                        {
                            c.Item().BorderBottom(1).BorderColor(Colors.Black).Background(Colors.White).Padding(2).AlignCenter().Text("(Bu bölüm geri teslimde doldurulacaktır)").FontSize(9).Bold();
                            c.Item().Padding(5).PaddingBottom(0).Text("Yukarıda tanımı ve özellikleri belirtilen emtia işyerine;").Bold();
                            c.Item().PaddingLeft(20).PaddingBottom(10).Column(list => {
                                list.Spacing(3);
                                list.Item().Text("○  Hasarsız ve tam teslim edilmiştir.");
                                list.Item().Text("○  Hasarlı ve eksik teslim edilmiştir.");
                            });
                            c.Item().BorderTop(1).Padding(5).Text("Hasarlı ve eksik teslim edildiğinde açıklayınız;").Bold();
                            c.Item().Height(40);
                            c.Item().BorderTop(1).Row(r => {
                                r.RelativeItem().BorderRight(1).Padding(5).Column(sub => {
                                    sub.Item().Text("Teslim Alan Personel").FontSize(9).Bold();
                                    sub.Item().Text("(Adı Soyadı-İmza)").FontSize(9);
                                    sub.Item().Height(30);
                                });
                                r.RelativeItem().Padding(5).Column(sub => {
                                    sub.Item().Text("Teslim Eden Personel").FontSize(9).Bold();
                                    sub.Item().Text("(Adı Soyadı-İmza)").FontSize(9);
                                    sub.Item().Height(30);
                                });
                            });
                        });
                    });

                    page.Footer().Row(row => {
                        row.RelativeItem().Text("IK-Zimmet Tutanağı").FontSize(8);
                        row.RelativeItem().AlignCenter().Text(x => { x.Span("Sayfa "); x.CurrentPageNumber(); });
                        row.RelativeItem().AlignRight().Text("Form: IK-008").FontSize(8);
                    });
                });
            })
            // 🔥 KRİTİK NOKTA: Dosya yolu vermiyoruz, direkt binary veri alıyoruz.
            .GeneratePdf();

            // Byte array'i (binary veriyi) direkt dönüyoruz
            return pdfData;
        }
    }
}