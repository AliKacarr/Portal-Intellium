using DataAccess.Repository.HolidayRepository;
using DataAccess.Repository.LeaveDeducationRepository;
using DataAccess.Repository.UserRepository;
using Entities.Concrete;
using iTextSharp.text.pdf;
using System;
using System.IO;
using Business.Helpers;

namespace Business.Helpers
{
    public class PermissionForms
    {
        private readonly IUserDal _userDal;
        private readonly ILeaveDeducationDal _leaveDeducationDal;
        private readonly string _baseDir;

        public PermissionForms(IUserDal userDal, ILeaveDeducationDal leaveDeducationDal)
        {
            _userDal = userDal;
            _leaveDeducationDal = leaveDeducationDal;
            _baseDir = AppDomain.CurrentDomain.BaseDirectory;
        }

        // DÖNÜŞ TİPİ: byte[] (Dosya Verisi)
        public byte[] GeneratePdf(Permission permission, User user, IHolidayDal holidayDal, DateTime jobStartDate)
        {
            // 1. Şablonu Bul (Template)
            string templateFileName = GetTemplateNameByPermissionType(permission, user);
            string templatePath = Path.Combine(Directory.GetCurrentDirectory(), "Business", "Helpers", "PermissionForms", templateFileName);
            
            // Yol kontrolü (Debug/Release farkı için)
            if (!System.IO.File.Exists(templatePath))
            {
                 templatePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "Business", "Helpers", "PermissionForms", templateFileName);
            }

            if (!System.IO.File.Exists(templatePath))
            {
                throw new FileNotFoundException($"PDF şablon dosyası bulunamadı: {templatePath}");
            }

            // 2. RAM ÜZERİNDE İŞLEM (DİSKE YAZMA YOK!)
            using (var existingFileStream = new FileStream(templatePath, FileMode.Open, FileAccess.Read))
            using (var outputStream = new MemoryStream()) // Sadece Hafızada oluşacak
            {
                var pdfReader = new PdfReader(existingFileStream);
                var pdfStamper = new PdfStamper(pdfReader, outputStream);
                var formFields = pdfStamper.AcroFields;

                // Alanları Doldur
                FillFields(formFields, permission, user, holidayDal, templatePath, jobStartDate);

                // Formu kilitle ve kapat
                pdfStamper.FormFlattening = true; 
                pdfStamper.Close();

                // Hafızadaki dosyayı Byte Dizisi olarak döndür
                return outputStream.ToArray();
            }
        }

        private void FillFields(AcroFields formFields, Permission permission, User user, IHolidayDal holidayDal, string templatePath, DateTime jobStartDate)
        {
            // Kişisel Bilgiler
            formFields.SetField("user_name", user.Name);
            formFields.SetField("PersonelinAdi", user.Name); 
            formFields.SetField("Gorevi", "Personel"); 
            formFields.SetField("IseGirisTarihi", jobStartDate != DateTime.MinValue ? jobStartDate.ToString("dd.MM.yyyy") : "-");
            
            string phone = permission.PhoneNumber ?? "";
            formFields.SetField("user_contactPhone", phone);
            formFields.SetField("IrtibatTelefonNo", phone);
            
            formFields.SetField("user_contactAddress", permission.Address);
            formFields.SetField("IzindeBulunacagiAdres", permission.Address);

            formFields.SetField("permission_description", permission.Description);
            formFields.SetField("Aciklama", permission.Description);
            
            formFields.SetField("permission_startDate", permission.StartTime.ToString("dd.MM.yyyy"));
            formFields.SetField("IzinBaslangicTarihi", permission.StartTime.ToString("dd.MM.yyyy"));
            
            formFields.SetField("permission_endDate", permission.EndTime.ToString("dd.MM.yyyy"));
            formFields.SetField("IzinBitisTarihi", permission.EndTime.ToString("dd.MM.yyyy"));

            formFields.SetField("IseBaslamaTarihi", permission.EndTime.AddDays(1).ToString("dd.MM.yyyy"));
            
            string today = DateTime.Now.ToString("dd.MM.yyyy");
            formFields.SetField("permission_updatedDate", today);
            formFields.SetField("Tarih", today);
            formFields.SetField("IzinTalepTarihi", today);

            double totalDays = UserPermissionCalculate.CalculateTotalWorkingDays(permission.StartTime, permission.EndTime, holidayDal, permission.PermissionTypeId);
            formFields.SetField("permission_totalDay", totalDays.ToString());
            formFields.SetField("IzinGunSayisi", totalDays.ToString());

            // Saatlik İzin Özel
            if (templatePath.Contains("IK004"))
            {
                string startHour = permission.StartTime.ToString("HH:mm");
                string endHour = permission.EndTime.ToString("HH:mm");
                
                formFields.SetField("permission_startDateTime", startHour);
                formFields.SetField("IzneCikisSaati", startHour);
                formFields.SetField("BaslangicSaati", startHour);

                formFields.SetField("permission_endDateTime", endHour);
                formFields.SetField("IzindenDonecegiSaat", endHour);
                formFields.SetField("DonusSaati", endHour); 
                formFields.SetField("BitisSaati", endHour);
                
                TimeSpan diff = permission.EndTime - permission.StartTime;
                string totalHour = diff.TotalHours.ToString("0.0") + " Saat";
                formFields.SetField("permission_totalHour", totalHour);
                formFields.SetField("ToplamIzinliSaat", totalHour);
            }
            
            // Mazeret İzni Özel
            if (templatePath.Contains("mazeret"))
            {
                string mazeretNedeni = permission.PermissionTypeRef?.SubPermission ?? "Mazeret";
                formFields.SetField("MazeretIzniTalebiNedenleri", mazeretNedeni);
            }
        }

        private string GetTemplateNameByPermissionType(Permission permission, User user)
        {
            return PermissionTypeHelper.GetTemplateName(permission.PermissionTypeId, permission.IsAdvanceLeave, permission.PermissionTypeRef?.SubPermission, permission.PermissionTypeRef?.DurationUnit);
        }

        private bool IsHourly(DateTime start, DateTime end)
        {
            TimeSpan duration = end - start;
            return start.Date == end.Date && duration.TotalHours < 6;
        }
    }
}