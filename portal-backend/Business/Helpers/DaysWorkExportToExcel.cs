using Business.Repository.UserPermissionRepository;
using Entities.Concrete;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using OfficeOpenXml;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Helpers
{
    public class DaysWorkExportToExcel
    {
        public void ExportToExcel(List<User> users, List<DaysWork> daysWork, List<Permission> permissions)
        {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            using (var package = new ExcelPackage())
            {
                // Excel dosyasına bir sayfa ekleyin
                ExcelWorksheet worksheet = package.Workbook.Worksheets.Add("DaysWork");
                int daysInMonth = DateTime.DaysInMonth(DateTime.Now.Year, DateTime.Now.Month);

                // Başlık satırını ekleyin
                worksheet.Cells["A1:AF1"].Merge = true;
                worksheet.Cells["A1:AF1"].Value = $"Ay: {CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(DateTime.Now.Month)}, Yıl: {DateTime.Now.Year}";
                worksheet.Cells["A1:AF1"].Style.Font.Bold = true;
                worksheet.Cells["A1:AF1"].Style.Font.Size = 16;
                worksheet.Cells["A1:AF1"].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;

                worksheet.Cells["A2"].Value = "Kullanıcı Adı";
                worksheet.Cells["A2"].Style.Font.Bold = true;
                worksheet.Cells["A2"].Style.Font.Size = 16;
                worksheet.Cells["A2"].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;

                worksheet.Cells["B2:AF2"].Merge = true;
                worksheet.Cells["B2:AF2"].Value = "Günler";
                worksheet.Cells["B2:AF2"].Style.Font.Bold = true;
                worksheet.Cells["B2:AF2"].Style.Font.Size = 16;
                worksheet.Cells["B2:AF2"].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;

                for (int day = 1; day <= daysInMonth; day++)
                {
                    worksheet.Cells[3, 1 + day].Style.Font.Bold = true;
                    worksheet.Cells[3, 1 + day].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
                    worksheet.Cells[3, 1 + day].Value = $"{day}";
                }

                // Verileri ekleyin
                for (int i = 0; i < users.Count; i++)
                {
                    worksheet.Cells[i + 4, 1].Value = users[i].Name;

                    int columnOffset = 1;
                    for (int day = 1; day <= daysInMonth; day++)
                    {
                        DateTime currentDate = new DateTime(DateTime.Now.Year, DateTime.Now.Month, day);
                        var workingDay = daysWork.FirstOrDefault(dw => dw.UserId == users[i].Id && dw.Day.Date == currentDate.Date);
                        var isPermission = permissions.FirstOrDefault(x => x.UserId == users[i].Id && currentDate.Date >= x.StartTime.Date && currentDate.Date <= x.EndTime.Date);
                        if (workingDay != null)
                        {
                            worksheet.Cells[i + 4, columnOffset + day].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
                            worksheet.Cells[i + 4, columnOffset + day].Value = workingDay.Hour;
                        }
                        else if (isPermission != null)
                        {
                            worksheet.Cells[i + 4, columnOffset + day].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
                            worksheet.Cells[i + 4, columnOffset + day].Value = "İzinli";
                        }
                        else
                        {
                            worksheet.Cells[i + 4, columnOffset + day].Value = "";
                        }
                    }
                }

                worksheet.Cells["A1:AF2"].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
                worksheet.Cells["B2:L2"].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;

                worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

                // Excel dosyasını kaydedin
                FileInfo fileInfo = new FileInfo("DaysWork.xlsx");
                package.SaveAs(fileInfo);
            }
        }
        public void ExportToExcel(List<User> users, List<DaysWork> daysWork, List<Permission> permissions, int month , int year)
        {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            using (var package = new ExcelPackage())
            {
                // Excel dosyasına bir sayfa ekleyin
                ExcelWorksheet worksheet = package.Workbook.Worksheets.Add("DaysWork");
                int daysInMonth = DateTime.DaysInMonth(year,month);



                CultureInfo turkishCulture = new CultureInfo("tr-TR");
                DateTimeFormatInfo dateFormat = turkishCulture.DateTimeFormat;

                string monthName = dateFormat.GetMonthName(month);
                // Başlık satırını ekleyin

                worksheet.Cells["A1:AF1"].Merge = true;
                worksheet.Cells["A1:AF1"].Value = $"Ay: {monthName}, Yıl: {year}";
                worksheet.Cells["A1:AF1"].Style.Font.Bold = true;
                worksheet.Cells["A1:AF1"].Style.Font.Size = 16;
                worksheet.Cells["A1:AF1"].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;

                worksheet.Cells["A2"].Value = "Kullanıcı Adı";
                worksheet.Cells["A2"].Style.Font.Bold = true;
                worksheet.Cells["A2"].Style.Font.Size = 16;
                worksheet.Cells["A2"].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;

                worksheet.Cells["B2:AF2"].Merge = true;
                worksheet.Cells["B2:AF2"].Value = "Günler";
                worksheet.Cells["B2:AF2"].Style.Font.Bold = true;
                worksheet.Cells["B2:AF2"].Style.Font.Size = 16;
                worksheet.Cells["B2:AF2"].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;

                for (int day = 1; day <= daysInMonth; day++)
                {
                    worksheet.Cells[3, 1 + day].Style.Font.Bold = true;
                    worksheet.Cells[3, 1 + day].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
                    worksheet.Cells[3, 1 + day].Value = $"{day}";
                }

                // Verileri ekleyin
                for (int i = 0; i < users.Count; i++)
                {
                    worksheet.Cells[i + 4, 1].Value = users[i].Name;

                    int columnOffset = 1;
                    for (int day = 1; day <= daysInMonth; day++)
                    {
                        try
                        {
                            DateTime currentDate = new DateTime(year, month, day);

                            // currentDate'nin geçerli bir tarih olduğunu kontrol et
                            if (currentDate.Month == month && currentDate.Year == year)
                            {
                                var workingDay = daysWork.FirstOrDefault(dw => dw.UserId == users[i].Id && dw.Day.Date == currentDate.Date);
                                var isPermission = permissions.FirstOrDefault(x => x.UserId == users[i].Id && currentDate.Date >= x.StartTime.Date && currentDate.Date <= x.EndTime.Date);
                                if (workingDay != null)
                                {
                                    worksheet.Cells[i + 4, columnOffset + day].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
                                    worksheet.Cells[i + 4, columnOffset + day].Value = workingDay.Hour;
                                }
                                else if (isPermission != null)
                                {
                                    worksheet.Cells[i + 4, columnOffset + day].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
                                    worksheet.Cells[i + 4, columnOffset + day].Value = "İzinli";
                                }
                                else
                                {
                                    worksheet.Cells[i + 4, columnOffset + day].Value = "";
                                }
                            }
                            else
                            {
                                // Geçersiz bir tarih oluşturulduğunda burada gerekli işlemleri yapabilirsiniz.
                                Console.WriteLine($"Geçersiz tarih: {year}-{month}-{day}");
                            }
                        }
                        catch (ArgumentOutOfRangeException ex)
                        {
                            // Geçersiz bir tarih oluşturulduğunda burada gerekli işlemleri yapabilirsiniz.
                            Console.WriteLine($"Geçersiz tarih: {year}-{month}-{day}. Hata: {ex.Message}");
                        }
                    }
                }

                worksheet.Cells["A1:AF2"].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;
                worksheet.Cells["B2:L2"].Style.HorizontalAlignment = OfficeOpenXml.Style.ExcelHorizontalAlignment.Center;

                worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

                // Excel dosyasını kaydedin
                FileInfo fileInfo = new FileInfo($"{month}.{year}DaysWork.xlsx");
                package.SaveAs(fileInfo);
                
            }
        }
    }
}
