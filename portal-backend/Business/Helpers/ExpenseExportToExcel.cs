using Entities.DTOs.ExpenseDto;
using OfficeOpenXml;
using System.Globalization;

namespace Business.Helpers
{
    /// <summary>Masraf listesini Excel'e aktarır. Tarih sütunu formatı ve sütun genişliği doğru ayarlanır (######## sorunu önlenir).</summary>
    public static class ExpenseExportToExcel
    {
        public static byte[] Export(List<ExpenseDto> expenses, IReadOnlyDictionary<long, string?>? ownerNameByUserId = null)
        {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            using var package = new ExcelPackage();
            var worksheet = package.Workbook.Worksheets.Add("Masraflar");

            // Başlıklar (ekrandaki sütunlarla uyumlu)
            worksheet.Cells[1, 1].Value = "Talep Numarası";
            worksheet.Cells[1, 2].Value = "Talep Eden";
            worksheet.Cells[1, 3].Value = "Fatura No";
            worksheet.Cells[1, 4].Value = "Kurum";
            worksheet.Cells[1, 5].Value = "Açıklama";
            worksheet.Cells[1, 6].Value = "Kategori";
            worksheet.Cells[1, 7].Value = "Tutar";
            worksheet.Cells[1, 8].Value = "Para Birimi";
            worksheet.Cells[1, 9].Value = "Durum";
            worksheet.Cells[1, 10].Value = "Tarih";
            worksheet.Cells[1, 1, 1, 10].Style.Font.Bold = true;

            for (var i = 0; i < expenses.Count; i++)
            {
                var row = i + 2;
                var e = expenses[i];
                worksheet.Cells[row, 1].Value = e.RequestId ?? "";

                string? ownerName = null;
                if (ownerNameByUserId != null && ownerNameByUserId.TryGetValue(e.UserId, out var n))
                    ownerName = n;
                ownerName = string.IsNullOrWhiteSpace(ownerName)
                    ? (!string.IsNullOrWhiteSpace(e.CreatedUserName) ? e.CreatedUserName : $"Kullanıcı #{e.UserId}")
                    : ownerName;
                worksheet.Cells[row, 2].Value = ownerName;

                worksheet.Cells[row, 3].Value = e.InvoiceNumber ?? "";
                worksheet.Cells[row, 4].Value = e.ProjectName ?? "";
                worksheet.Cells[row, 5].Value = e.Description ?? "";
                worksheet.Cells[row, 6].Value = e.InvoiceTitle ?? "";
                worksheet.Cells[row, 7].Value = e.TotalAmount;
                worksheet.Cells[row, 7].Style.Numberformat.Format = "#,##0.00";
                worksheet.Cells[row, 8].Value = string.IsNullOrWhiteSpace(e.CurrencyCode) ? "TRY" : e.CurrencyCode.Trim().ToUpperInvariant();
                worksheet.Cells[row, 9].Value = e.Status ?? "";

                // Tarih: hem değeri doğru yaz hem format + sütun genişliği ayarla (######## önlenir)
                if (!string.IsNullOrWhiteSpace(e.InvoiceDate) && DateTime.TryParseExact(e.InvoiceDate, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var invoiceDate))
                {
                    worksheet.Cells[row, 10].Value = invoiceDate;
                    worksheet.Cells[row, 10].Style.Numberformat.Format = "dd.mm.yyyy";
                }
                else
                {
                    worksheet.Cells[row, 10].Value = e.InvoiceDate ?? "";
                }
            }

            // Tarih sütunu (J) genişliği ve formatı – ######## görünmesini engeller
            worksheet.Column(10).Width = 14;
            if (expenses.Count > 0)
                worksheet.Cells[2, 10, expenses.Count + 1, 10].Style.Numberformat.Format = "dd.mm.yyyy";

            worksheet.Cells[worksheet.Dimension?.Address ?? "A1"].AutoFitColumns();
            // Tarih sütununu tekrar en az 14 yap (AutoFit bazen dar bırakabiliyor)
            if (worksheet.Column(10).Width < 14)
                worksheet.Column(10).Width = 14;

            return package.GetAsByteArray();
        }
    }
}
