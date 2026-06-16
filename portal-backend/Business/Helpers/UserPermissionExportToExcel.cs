using Business.Repository.UserPermissionRepository;
using Business.Repository.UserRepository;
using DataAccess.Repository.UserPermissionRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using OfficeOpenXml;
using System.IO;
namespace Business.Helpers
{
    public class UserPermissionExportToExcel
    {
        private readonly IUserPermissionService _userPermissionService;
        private readonly IUserDal _userDal;


        public UserPermissionExportToExcel(IUserPermissionService userPermissionService, IUserDal userDal)
        {
            _userPermissionService = userPermissionService;
            _userDal = userDal;
        }


        public void ExportToExcel()
        {
            // Lisans ayarlarını yap
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;

            // UserPermissionManager kullanarak veritabanından veri alın
            var data = _userPermissionService.GetAll().Data;

            // UserId'ye göre sırala
            data = data.OrderBy(x => x.Id).ToList();

            using (var package = new ExcelPackage())
            {
                // Excel dosyasına bir sayfa ekleyin
                ExcelWorksheet worksheet = package.Workbook.Worksheets.Add("Sayfa1");

                // Başlık satırını ekleyin
                worksheet.Cells[1, 1].Value = "ID";
                worksheet.Cells[1, 2].Value = "Kullanıcı Id";
                worksheet.Cells[1, 3].Value = "Toplam İzin Hakkı";

                worksheet.Cells[1, 4].Value = "Kalan İzin";
                worksheet.Cells[1, 5].Value = "Kullanılan İzin";
                worksheet.Cells[1, 6].Value = "Bu Sene Kazanılan İzin";


                // ... Diğer sütun başlıkları

                // Verileri ekleyin
                for (int i = 0; i < data.Count; i++)
                {
                    worksheet.Cells[i + 2, 1].Value = data[i].Id;

                    var user = _userDal.Get(x=> x.Id == data[i].UserId);
                    if (user != null)
                    {
                        worksheet.Cells[i + 2, 2].Value = user.Name;
                        worksheet.Cells[i + 2, 3].Value = data[i].TotalLeave;
                        worksheet.Cells[i + 2, 4].Value = data[i].RemainingLeave;
                        worksheet.Cells[i + 2, 5].Value = data[i].UsedLeave;
                        worksheet.Cells[i + 2, 6].Value = data[i].ThisYear;
                        // ... Diğer sütun değerleri
                    }


                }
                worksheet.Cells[worksheet.Dimension.Address].AutoFitColumns();

                // Excel dosyasını kaydedin
                FileInfo fileInfo = new FileInfo("UserPermission.xlsx");
                package.SaveAs(fileInfo);
            }
        }
    }
}