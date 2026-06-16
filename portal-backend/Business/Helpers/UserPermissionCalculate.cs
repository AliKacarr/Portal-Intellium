using DataAccess.Repository.HolidayRepository;
using Entities.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Business.Helpers
{
    public class UserPermissionCalculate
    {
        public static int CalculateThisYearLeave(DateTime startDate, DateTime userBirthDate, DateTime? referenceDate = null)
        {
            DateTime now = (referenceDate ?? DateTime.Now).Date;
            startDate = startDate.Date;
            userBirthDate = userBirthDate.Date;

            int seniorityYears = now.Year - startDate.Year;
            if (startDate > now.AddYears(-seniorityYears)) seniorityYears--;

            int age = 0;
            if (userBirthDate.Year < 1900) age = 30;
            else
            {
                age = now.Year - userBirthDate.Year;
                if (userBirthDate > now.AddYears(-age)) age--;
            }

            return CalculateAnnualLeaveBySeniorityAndAge(seniorityYears, age);
        }

        public static int CalculateTotalLeave(DateTime startDate, DateTime userBirthDate, DateTime? referenceDate = null)
        {
            DateTime now = (referenceDate ?? DateTime.Now).Date;
            startDate = startDate.Date;
            userBirthDate = userBirthDate.Date;

            int seniorityYears = now.Year - startDate.Year;
            if (startDate > now.AddYears(-seniorityYears)) seniorityYears--;
            if (seniorityYears <= 0) return 0;

            int totalLeave = 0;
            for (int k = 1; k <= seniorityYears; k++)
            {
                DateTime entitlementDate = startDate.AddYears(k);
                int ageAtEntitlementDate = CalculateAge(userBirthDate, entitlementDate);
                int seniorityForRule = k;
                totalLeave += CalculateAnnualLeaveBySeniorityAndAge(seniorityForRule, ageAtEntitlementDate);
            }

            return totalLeave;
        }

        /// <summary>Bu yılki ücretli izin hakkının metinsel açıklaması ve özet bilgiler.</summary>
        public static LeaveThisYearDetailDto BuildThisYearDetail(DateTime startDate, DateTime userBirthDate, DateTime? referenceDate = null)
        {
            DateTime now = (referenceDate ?? DateTime.Now).Date;
            startDate = startDate.Date;
            userBirthDate = userBirthDate.Date;

            int seniorityYears = now.Year - startDate.Year;
            if (startDate > now.AddYears(-seniorityYears)) seniorityYears--;

            int age = 0;
            if (userBirthDate.Year < 1900) age = 30;
            else
            {
                age = now.Year - userBirthDate.Year;
                if (userBirthDate > now.AddYears(-age)) age--;
            }

            int days = CalculateAnnualLeaveBySeniorityAndAge(seniorityYears, age);
            string summary = BuildAppliedRuleSummary(seniorityYears, age, days, now);

            return new LeaveThisYearDetailDto
            {
                SeniorityYears = seniorityYears,
                Age = age,
                ThisYearDays = days,
                AppliedRuleSummary = summary
            };
        }

        /// <summary>Toplam ücretli iznin yıllık kırılımı (kümülatif hesapla aynı mantık).</summary>
        public static List<LeaveAnnualAccrualRowDto> BuildAnnualAccruals(DateTime startDate, DateTime userBirthDate, DateTime? referenceDate = null)
        {
            DateTime now = (referenceDate ?? DateTime.Now).Date;
            startDate = startDate.Date;
            userBirthDate = userBirthDate.Date;

            int seniorityYears = now.Year - startDate.Year;
            if (startDate > now.AddYears(-seniorityYears)) seniorityYears--;
            if (seniorityYears <= 0) return new List<LeaveAnnualAccrualRowDto>();

            var rows = new List<LeaveAnnualAccrualRowDto>();
            for (int k = 1; k <= seniorityYears; k++)
            {
                DateTime entitlementDate = startDate.AddYears(k);
                int ageAt = CalculateAge(userBirthDate, entitlementDate);
                int earned = CalculateAnnualLeaveBySeniorityAndAge(k, ageAt);
                rows.Add(new LeaveAnnualAccrualRowDto
                {
                    ServiceYearIndex = k,
                    AnniversaryDate = entitlementDate,
                    AgeAtAnniversary = ageAt,
                    DaysEarned = earned
                });
            }

            return rows;
        }

        private static string BuildAppliedRuleSummary(int seniorityYears, int age, int days, DateTime now)
        {
            if (seniorityYears < 1)
                return $"Referans tarihi ({now:dd.MM.yyyy}) itibarıyla tamamlanmış kıdem yılınız 1’den az olduğu için bu yılın ücretli yıllık izin hakkı 0 gündür.";

            if (seniorityYears >= 1 && seniorityYears < 5)
            {
                if (age <= 18 || age >= 50)
                    return $"Tamamlanmış kıdem {seniorityYears} yıl (1–5 yıl bandı), yaş {age} (≤18 veya ≥50). Bu yılki hak: {days} gün.";
                return $"Tamamlanmış kıdem {seniorityYears} yıl (1–5 yıl bandı), yaş {age} (18–50 arası, sınırlar hariç). Bu yılki hak: {days} gün.";
            }

            if (seniorityYears >= 5 && seniorityYears < 15)
                return $"Tamamlanmış kıdem {seniorityYears} yıl (5–15 yıl bandı). Yaştan bağımsız bu yılki hak: {days} gün.";

            return $"Tamamlanmış kıdem {seniorityYears} yıl (15 yıl ve üzeri). Bu yılki hak: {days} gün.";
        }

        private static int CalculateAnnualLeaveBySeniorityAndAge(int seniorityYears, int age)
        {
            if (seniorityYears < 1) return 0;

            if (seniorityYears >= 1 && seniorityYears < 5)
            {
                if (age <= 18 || age >= 50) return 20;
                return 14;
            }

            if (seniorityYears >= 5 && seniorityYears < 15) return 20;
            if (seniorityYears >= 15) return 26;
            return 0;
        }

        private static int CalculateAge(DateTime birthDate, DateTime atDate)
        {
            birthDate = birthDate.Date;
            atDate = atDate.Date;

            if (birthDate.Year < 1900) return 30;

            int age = atDate.Year - birthDate.Year;
            if (birthDate > atDate.AddYears(-age)) age--;
            return age;
        }

        public static int CalculateDays(DateTime startTime, DateTime endTime)
        {
            TimeSpan duration = endTime - startTime;
            return (int)duration.TotalDays;
        }

        // --- GÜN HESAPLAMA (int PermissionTypeId overload) ---
        public static double CalculateTotalWorkingDays(DateTime start, DateTime end, IHolidayDal holidayDal, int permissionTypeId)
        {
            if (PermissionTypeHelper.IsUcretsiz(permissionTypeId)) return 0;
            return CalculateActualLeaveDays(start, end, holidayDal);
        }

        // --- GÜN HESAPLAMA (string overload — geriye dönük uyumluluk) ---
        public static double CalculateTotalWorkingDays(DateTime start, DateTime end, IHolidayDal holidayDal, string permissionType)
        {
            if (permissionType == "Ücretsiz" || permissionType == "ucretsiz") return 0;
            return CalculateActualLeaveDays(start, end, holidayDal);
        }

        public static double CalculateActualLeaveDays(DateTime start, DateTime end, IHolidayDal holidayDal)
        {
            var holidays = holidayDal.GetAll();

            // --- 1. TEK GÜN KONTROLÜ ---
            if (start.Date == end.Date)
            {
                if (start.DayOfWeek == DayOfWeek.Saturday || start.DayOfWeek == DayOfWeek.Sunday) return 0;

                bool isSingleDayHoliday = holidays.Any(h => start.Date >= h.StartTime.Date && start.Date <= h.EndTime.Date);
                if (isSingleDayHoliday) return 0;

                double totalHours = (end - start).TotalHours;
                if (totalHours > 0 && totalHours <= 6) return 0.5;
                if (totalHours > 6) return 1.0;
                return 0;
            }

            // --- 2. ÇOKLU GÜN KONTROLÜ ---
            double workingDays = 0;

            for (DateTime date = start.Date; date <= end.Date; date = date.AddDays(1))
            {
                if (date.DayOfWeek == DayOfWeek.Saturday || date.DayOfWeek == DayOfWeek.Sunday) continue;

                bool isHoliday = holidays.Any(h => date >= h.StartTime.Date && date <= h.EndTime.Date);
                if (isHoliday) continue;

                if (date.Date == start.Date)
                {
                    DateTime dayEnd = date.Date.AddHours(18);
                    double hours = (dayEnd - start).TotalHours;
                    if (hours > 0 && hours <= 6) workingDays += 0.5;
                    else workingDays += 1.0;
                }
                else if (date.Date == end.Date)
                {
                    DateTime dayStart = date.Date.AddHours(9);
                    double hours = (end - dayStart).TotalHours;
                    if (hours > 0 && hours <= 6) workingDays += 0.5;
                    else workingDays += 1.0;
                }
                else
                {
                    workingDays += 1.0;
                }
            }
            return workingDays;
        }
    }
}
