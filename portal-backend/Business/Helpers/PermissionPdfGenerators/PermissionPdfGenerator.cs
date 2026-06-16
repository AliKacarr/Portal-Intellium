using Entities.Concrete;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System;
using System.IO;

namespace Business.Helpers.PermissionPdfGenerators
{
    public partial class PermissionPdfGenerator
    {
        public PermissionPdfGenerator()
        {
            QuestPDF.Settings.License = LicenseType.Community;
        }

        public byte[] GeneratePdf(Permission permission, User user, double amount, DateTime jobStartDate, string declarationText = null)
        {
            // Logo Yolu
            string wwwrootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            string logoPath = Path.Combine(wwwrootPath, "logo.png");
            byte[] logoBytes = System.IO.File.Exists(logoPath) ? System.IO.File.ReadAllBytes(logoPath) : null;

            var document = QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(1, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(9).FontFamily(Fonts.Arial));

                    // --- HEADER (LOGO VE BAŞLIK) ---
                    page.Header().Height(60).Border(1).BorderColor(Colors.Black).Row(row =>
                    {
                        row.RelativeItem().Padding(5).AlignLeft().Column(col =>
                        {
                            if (logoBytes != null)
                            {
                                col.Item().Height(40).Image(logoBytes, ImageScaling.FitArea);
                            }
                            else
                            {
                                col.Item().Text("intellium").FontSize(24).Bold().FontColor(Colors.Blue.Medium);
                                col.Item().Text("Innovative and Intelligent Solutions with AI").FontSize(7).Italic();
                            }
                        });

                        string title = GetTitle(permission);
                        row.RelativeItem().BorderLeft(1).BorderColor(Colors.Black)
                           .Padding(5).AlignCenter().AlignMiddle()
                           .Text(title).FontSize(11).Bold().FontColor(Colors.Black);
                    });

                    // --- CONTENT (İÇERİK) ---
                    page.Content().PaddingVertical(10).Column(col =>
                    {
                        if (IsHourly(permission))         DrawIK004(col, permission, user, amount, jobStartDate);
                        else if (permission.IsAdvanceLeave)  DrawIK003(col, permission, user, amount, jobStartDate, declarationText);
                        else if (PermissionTypeHelper.IsUcretsiz(permission.PermissionTypeId)) DrawIK005(col, permission, user, amount, jobStartDate);
                        else if (PermissionTypeHelper.IsMazeret(permission.PermissionTypeId)) DrawIK002(col, permission, user, amount, jobStartDate);
                        else DrawIK001(col, permission, user, amount, jobStartDate, declarationText);

                        // --- DİJİTAL İZ KAYITLARI ---
                        col.Item().PaddingTop(15).Column(c =>
                        {
                            c.Item().Text("Dijital İşlem Kayıtları:").FontSize(8).Bold().Underline();
                            
                            string createdDate = permission.CreatedAt.HasValue 
                                ? permission.CreatedAt.Value.ToString("dd.MM.yyyy HH:mm") 
                                : permission.StartTime.ToString("dd.MM.yyyy 09:00"); // Eski kayıtlarda null olmaması için varsayılan ata
                            c.Item().Text($"İzin Talebi Oluşturulma Tarihi: {createdDate}").FontSize(8);

                            if (permission.IsAdvanceLeave && permission.AdvanceLeaveConsentAt.HasValue)
                            {
                                c.Item().Text($"Avans İzin Muvafakatnamesi Onay Tarihi: {permission.AdvanceLeaveConsentAt.Value.ToString("dd.MM.yyyy HH:mm")}").FontSize(8);
                            }
                        });
                    });

                    // --- FOOTER (SAYFA NO VE KOD) ---
                    page.Footer().PaddingTop(5).Row(row =>
                    {
                        string formCode = GetFormCode(permission);
                        row.RelativeItem().Text(formCode).FontSize(8).Bold();
                        row.RelativeItem().AlignCenter().Text("Sayfa 1").FontSize(8);

                        string shortCode = formCode.Contains("-") ? formCode.Split('-')[0] + "-" + formCode.Split('-')[1].Trim().Substring(0, 3) : "IK-GEN";
                        row.RelativeItem().AlignRight().Text($"Form: {shortCode}").FontSize(8);
                    });
                });
            });

            return document.GeneratePdf();
        }

        // --- YARDIMCI METOTLAR ---
        private string GetTitle(Permission p)
        {
            string sub = p.PermissionTypeRef?.SubPermission;
            short? du = p.PermissionTypeRef?.DurationUnit;
            return PermissionTypeHelper.GetPdfTitle(p.PermissionTypeId, p.IsAdvanceLeave, sub, du);
        }

        private string GetFormCode(Permission p)
        {
            string sub = p.PermissionTypeRef?.SubPermission;
            short? du = p.PermissionTypeRef?.DurationUnit;
            return PermissionTypeHelper.GetFormCode(p.PermissionTypeId, p.IsAdvanceLeave, sub, du);
        }

        private bool IsHourly(Permission p)
        {
            if (PermissionTypeHelper.IsHourly(p.PermissionTypeId, p.PermissionTypeRef?.SubPermission, p.PermissionTypeRef?.DurationUnit)) return true;
            TimeSpan duration = p.EndTime - p.StartTime;
            return p.StartTime.Date == p.EndTime.Date && duration.TotalHours < 8; 
        }
    }
}