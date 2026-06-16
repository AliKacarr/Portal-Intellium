using Entities.DTOs.ExpenseDto;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.Globalization;

namespace Business.Helpers
{
    /// <summary>Masraf listesini frontend alan mapping'i ile PDF olarak üretir.</summary>
    public static class ExpenseExportToPdf
    {
        private const string Font = Fonts.Arial;
        private const int RowsPerTablePage = 24;

        public static byte[] Generate(
            IReadOnlyList<ExpenseDto> expenses,
            string requestedBy,
            string periodDisplay,
            DateTime issueDate)
        {
            QuestPDF.Settings.License = LicenseType.Community;

            var totalAmount = expenses.Sum(e => e.TotalAmount);
            var totalVat = expenses.Sum(e => e.Vat);

            var chunks = new List<List<ExpenseDto>>();
            for (var i = 0; i < expenses.Count; i += RowsPerTablePage)
            {
                var take = Math.Min(RowsPerTablePage, expenses.Count - i);
                chunks.Add(expenses.Skip(i).Take(take).ToList());
            }

            if (chunks.Count == 0)
                chunks.Add(new List<ExpenseDto>());

            var document = Document.Create(container =>
            {
                for (var pageIndex = 0; pageIndex < chunks.Count; pageIndex++)
                {
                    var chunk = chunks[pageIndex];
                    var isLastPage = pageIndex == chunks.Count - 1;

                    container.Page(page =>
                    {
                        page.Size(PageSizes.A4.Landscape());
                        page.MarginHorizontal(1f, Unit.Centimetre);
                        page.MarginVertical(0.8f, Unit.Centimetre);
                        page.DefaultTextStyle(x => x.FontSize(8).FontFamily(Font));
                        page.PageColor(Colors.White);

                        page.Content().Column(main =>
                        {
                            main.Spacing(6);
                            main.Item().Row(r =>
                            {
                                r.RelativeItem().Text("MASRAF PDF RAPORU").FontSize(13).Bold();
                                r.RelativeItem().AlignRight().Text($"Sayfa {pageIndex + 1}/{chunks.Count}").FontSize(8)
                                    .FontColor(Colors.Grey.Darken2);
                            });

                            main.Item().Text($"Masraf Sahibi: {requestedBy} | Dönem: {periodDisplay} | Düzenleme Tarihi: {issueDate:yyyy-MM-dd}")
                                .FontSize(8).FontColor(Colors.Grey.Darken2);

                            main.Item().Element(c => DrawExpenseTable(c, chunk, isLastPage, totalVat, totalAmount));
                        });
                    });
                }
            });

            return document.GeneratePdf();
        }

        private static void DrawExpenseTable(
            IContainer container,
            List<ExpenseDto> chunk,
            bool isLastChunk,
            decimal totalVat,
            decimal totalAmount)
        {
            container.Table(table =>
            {
                table.ColumnsDefinition(cols =>
                {
                    cols.RelativeColumn(0.9f);  // invoiceDate
                    cols.RelativeColumn(0.9f);  // invoiceNumber
                    cols.RelativeColumn(1.0f);  // invoiceTitle
                    cols.RelativeColumn(1.0f);  // projectName
                    cols.RelativeColumn(0.9f);  // expenseType
                    cols.RelativeColumn(1.5f);  // description
                    cols.RelativeColumn(1.0f);  // ownerName
                    cols.RelativeColumn(0.55f); // currencyCode
                    cols.RelativeColumn(0.6f);  // vatRate
                    cols.RelativeColumn(0.75f); // vat
                    cols.RelativeColumn(0.85f); // totalAmount
                });

                static IContainer CellStyle(IContainer c) =>
                    c.Border(0.5f).BorderColor(Colors.Black).PaddingVertical(3).PaddingHorizontal(4);

                void HeaderCell(string text)
                {
                    table.Cell().Element(CellStyle).AlignMiddle().AlignCenter().Text(text).FontSize(7).Bold();
                }

                HeaderCell("Fatura Tarihi");
                HeaderCell("Fatura Numarasi");
                HeaderCell("Kategori");
                HeaderCell("Kurum");
                HeaderCell("Odeme Tipi");
                HeaderCell("Aciklama");
                HeaderCell("Masraf Sahibi");
                HeaderCell("Para Birimi");
                HeaderCell("KDV Orani");
                HeaderCell("KDV Tutari");
                HeaderCell("Vergiler Dahil Toplam");

                foreach (var e in chunk)
                {
                    var ownerName = string.IsNullOrWhiteSpace(e.CreatedUserName)
                        ? $"#{e.UserId}"
                        : e.CreatedUserName!;

                    table.Cell().Element(CellStyle).AlignMiddle().Text(FormatInvoiceDate(e.InvoiceDate)).FontSize(7);
                    table.Cell().Element(CellStyle).AlignMiddle().Text(e.InvoiceNumber ?? "—").FontSize(7);
                    table.Cell().Element(CellStyle).AlignMiddle().Text(e.InvoiceTitle ?? "—").FontSize(7);
                    table.Cell().Element(CellStyle).AlignMiddle().Text(e.ProjectName ?? "—").FontSize(7);
                    table.Cell().Element(CellStyle).AlignMiddle().Text(e.ExpenseType ?? "—").FontSize(7);
                    table.Cell().Element(CellStyle).AlignMiddle().Text(Truncate(e.Description ?? "—", 120)).FontSize(7);
                    table.Cell().Element(CellStyle).AlignMiddle().Text(ownerName).FontSize(7);
                    table.Cell().Element(CellStyle).AlignMiddle().AlignCenter().Text(string.IsNullOrWhiteSpace(e.CurrencyCode) ? "TRY" : e.CurrencyCode.Trim().ToUpperInvariant()).FontSize(7);
                    table.Cell().Element(CellStyle).AlignMiddle().AlignRight().Text(FormatVatRate(e.VatRate)).FontSize(7);
                    table.Cell().Element(CellStyle).AlignMiddle().AlignRight().Text(FormatDecimalAmount(e.Vat)).FontSize(7);
                    table.Cell().Element(CellStyle).AlignMiddle().AlignRight().Text(FormatDecimalAmount(e.TotalAmount)).FontSize(7);
                }

                if (isLastChunk)
                {
                    table.Cell().ColumnSpan(9).Element(CellStyle).AlignRight().Text("Toplam").Bold().FontSize(8);
                    table.Cell().Element(CellStyle).AlignRight().Text(FormatDecimalAmount(totalVat)).Bold().FontSize(8);
                    table.Cell().Element(CellStyle).AlignRight().Text(FormatDecimalAmount(totalAmount)).Bold().FontSize(8);
                }
            });
        }

        private static string FormatInvoiceDate(string? yyyyMmDd)
        {
            if (string.IsNullOrWhiteSpace(yyyyMmDd)) return "—";
            if (DateTime.TryParseExact(yyyyMmDd.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var d))
                return d.ToString("dd.MM.yyyy", CultureInfo.GetCultureInfo("tr-TR"));
            if (DateTime.TryParse(yyyyMmDd, CultureInfo.GetCultureInfo("tr-TR"), DateTimeStyles.None, out d))
                return d.ToString("dd.MM.yyyy", CultureInfo.GetCultureInfo("tr-TR"));
            return yyyyMmDd;
        }

        private static string FormatVatRate(decimal vatRate)
        {
            if (vatRate <= 0) return "%0";
            if (vatRate <= 1m && vatRate > 0)
                return vatRate.ToString("0.00", CultureInfo.GetCultureInfo("tr-TR"));
            return $"%{vatRate:0.##}";
        }

        private static string FormatDecimalAmount(decimal amount) =>
            amount.ToString("N2", CultureInfo.GetCultureInfo("tr-TR"));

        private static string Truncate(string s, int max)
        {
            if (string.IsNullOrEmpty(s)) return "—";
            s = s.Trim();
            return s.Length <= max ? s : s[..(max - 1)] + "…";
        }
    }
}
