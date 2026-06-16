using Entities.DTOs.ExpenseDto;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;

namespace Business.Helpers
{
    /// <summary>Tek masraf kaydini rapor formatinda PDF uretir.</summary>
    public static class ExpenseSingleExportToPdf
    {
        public static byte[] Generate(ExpenseDto expense, string ownerName, DateTime issueDate)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var items = expense.Items ?? new List<ExpenseItemDto>();
            if (items.Count == 0)
            {
                items.Add(new ExpenseItemDto
                {
                    ItemName = expense.InvoiceTitle ?? "Masraf",
                    Quantity = 1,
                    UnitPrice = expense.ExcludingVatAmount,
                    KdvRate = (int)Math.Round(expense.VatRate, 0, MidpointRounding.AwayFromZero),
                    TotalAmount = expense.TotalAmount
                });
            }

            var doc = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(24);
                    page.DefaultTextStyle(x => x.FontFamily(Fonts.Arial).FontSize(9));

                    page.Content().Column(col =>
                    {
                        col.Spacing(10);

                        col.Item().Row(r =>
                        {
                            r.RelativeItem().Column(c =>
                            {
                                c.Item().Text("Masraf Raporu").Bold().FontSize(20);
                                c.Item().Text("OFFICIAL FINANCIAL STATEMENT").FontSize(8).FontColor(Colors.Grey.Darken1);
                            });
                            r.RelativeItem().AlignRight().Column(c =>
                            {
                                c.Item().Text("MASRAF NUMARASI").FontSize(7).FontColor(Colors.Grey.Darken1);
                                c.Item().Text($"EX-{expense.Id}").Bold().FontSize(18);
                            });
                        });

                        col.Item().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(8).Column(c =>
                        {
                            c.Spacing(4);
                            c.Item().Row(r =>
                            {
                                r.RelativeItem().Text($"Durumu: {expense.Status}");
                                r.RelativeItem().Text($"Tarihi: {FormatDate(expense.InvoiceDate)}");
                                r.RelativeItem().Text($"Donem: {expense.ExpensePeriod ?? "N/A"}");
                                r.RelativeItem().Text($"Kategori: {expense.InvoiceTitle ?? "N/A"}");
                            });
                            c.Item().Row(r =>
                            {
                                r.RelativeItem().Text($"Masraf Sahibi: {ownerName}");
                                r.RelativeItem().Text($"Talep Sahibi: {ownerName}");
                                r.RelativeItem().Text("Sirket: Intellium");
                                r.RelativeItem().Text("Departman: null");
                            });
                            c.Item().Row(r =>
                            {
                                r.RelativeItem().Text($"Para Birimi: {(string.IsNullOrWhiteSpace(expense.CurrencyCode) ? "TRY" : expense.CurrencyCode)}");
                            });
                        });

                        col.Item().Column(c =>
                        {
                            c.Item().Text("Aciklama").Bold();
                            c.Item().Text(string.IsNullOrWhiteSpace(expense.Description) ? "-" : expense.Description);
                        });

                        col.Item().Text("Masraf ve Alt Kalemleri").Bold();
                        col.Item().Table(table =>
                        {
                            table.ColumnsDefinition(cols =>
                            {
                                cols.RelativeColumn(1.2f);
                                cols.RelativeColumn(0.8f);
                                cols.RelativeColumn(0.8f);
                                cols.RelativeColumn(0.8f);
                                cols.RelativeColumn(0.9f);
                            });

                            static IContainer Cell(IContainer c) =>
                                c.Border(0.5f).BorderColor(Colors.Grey.Lighten2).Padding(4);

                            table.Header(h =>
                            {
                                h.Cell().Element(Cell).Text("Kalem").Bold();
                                h.Cell().Element(Cell).AlignRight().Text("Miktar").Bold();
                                h.Cell().Element(Cell).AlignRight().Text("Birim").Bold();
                                h.Cell().Element(Cell).AlignRight().Text("KDV %").Bold();
                                h.Cell().Element(Cell).AlignRight().Text("Toplam").Bold();
                            });

                            foreach (var item in items)
                            {
                                table.Cell().Element(Cell).Text(item.ItemName ?? "-");
                                table.Cell().Element(Cell).AlignRight().Text(item.Quantity.ToString(CultureInfo.InvariantCulture));
                                table.Cell().Element(Cell).AlignRight().Text(FormatAmount(item.UnitPrice));
                                table.Cell().Element(Cell).AlignRight().Text(item.KdvRate.ToString(CultureInfo.InvariantCulture));
                                table.Cell().Element(Cell).AlignRight().Text(FormatAmount(item.TotalAmount));
                            }
                        });

                        col.Item().AlignRight().Text($"TOPLAM GIDER ODEMESI: {FormatAmount(expense.TotalAmount)}").Bold();

                        col.Item().PaddingTop(8).Row(r =>
                        {
                            r.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(c =>
                            {
                                c.Item().Text("Eklenen Fis Gorseli").Bold();
                                c.Item().PaddingTop(6).Text(string.IsNullOrWhiteSpace(expense.ImagePath) ? "Gorsel bulunamadi." : expense.ImagePath);
                            });
                            r.RelativeItem().Border(1).BorderColor(Colors.Grey.Lighten2).Padding(10).Column(c =>
                            {
                                c.Item().Text("Gorsel Dogrulandi").Bold();
                                c.Item().PaddingTop(6).Text("Fatura okuma sonucu: ATSarim");
                            });
                        });

                        col.Item().PaddingTop(8).Row(r =>
                        {
                            r.RelativeItem().Text($"Duzenlenme Tarihi: {issueDate:dd MMM yyyy HH:mm}");
                            r.RelativeItem().AlignCenter().Text("Onaylayan");
                            r.RelativeItem().AlignCenter().Text("Muhasebe");
                            r.RelativeItem().AlignRight().Text("Sayfa 01/01");
                        });
                    });
                });
            });

            return doc.GeneratePdf();
        }

        private static string FormatDate(string? yyyyMmDd)
        {
            if (string.IsNullOrWhiteSpace(yyyyMmDd)) return "-";
            if (DateTime.TryParseExact(yyyyMmDd, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var dt))
                return dt.ToString("dd MMMM yyyy", CultureInfo.GetCultureInfo("tr-TR"));
            return yyyyMmDd;
        }

        private static string FormatAmount(decimal amount) =>
            amount.ToString("N2", CultureInfo.GetCultureInfo("tr-TR"));
    }
}
