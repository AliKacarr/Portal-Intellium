using Entities.Concrete;
using System;
using System.Collections.Generic;
using System.Globalization;

namespace Business.Helpers
{
    public static class HolidayCalculator
    {
        public static List<Holiday> GetHolidaysForYear(int year)
        {
            List<Holiday> holidays = new List<Holiday>();

            // --- A. SABİT RESMİ TATİLLER (GÜNEŞ TAKVİMİ) ---
            holidays.Add(CreateHoliday(year, 1, 1, "Yılbaşı", 1));
            holidays.Add(CreateHoliday(year, 4, 23, "Ulusal Egemenlik ve Çocuk Bayramı", 1));
            holidays.Add(CreateHoliday(year, 5, 1, "Emek ve Dayanışma Günü", 1));
            holidays.Add(CreateHoliday(year, 5, 19, "Atatürk'ü Anma, Gençlik ve Spor Bayramı", 1));
            holidays.Add(CreateHoliday(year, 7, 15, "Demokrasi ve Milli Birlik Günü", 1));
            holidays.Add(CreateHoliday(year, 8, 30, "Zafer Bayramı", 1));
            
            // 29 Ekim (1.5 Gün)
            holidays.Add(new Holiday 
            { 
                Name = "Cumhuriyet Bayramı (Arife)", 
                StartTime = new DateTime(year, 10, 28, 13, 0, 0), 
                EndTime = new DateTime(year, 10, 28, 23, 59, 59),
                Year = year
            });
            holidays.Add(CreateHoliday(year, 10, 29, "Cumhuriyet Bayramı", 1));

            // --- B. DİNİ BAYRAMLAR (HİCRİ TAKVİM HESAPLAMASI + DÜZELTME) ---
            var religiousHolidays = CalculateReligiousHolidays(year);
            holidays.AddRange(religiousHolidays);

            return holidays;
        }

        private static Holiday CreateHoliday(int year, int month, int day, string name, double duration)
        {
            var start = new DateTime(year, month, day, 0, 0, 0);
            var end = start.AddDays(duration).AddSeconds(-1);
            return new Holiday { Name = name, StartTime = start, EndTime = end, Year = year };
        }

        private static List<Holiday> CalculateReligiousHolidays(int year)
        {
            List<Holiday> list = new List<Holiday>();
            HijriCalendar hijri = new HijriCalendar();

            // --- DÜZELTME FAKTÖRÜ ---
            // Eğer tarihler 1 gün geriden geliyorsa burayı 1 yap.
            // İleri gidiyorsa -1 yap.
            int hijriCorrection = 1; 

            // Miladi yılın aralığı
            int startHijriYear = hijri.GetYear(new DateTime(year, 1, 1));
            int endHijriYear = hijri.GetYear(new DateTime(year, 12, 31));

            for (int hYear = startHijriYear; hYear <= endHijriYear; hYear++)
            {
                // --- RAMAZAN BAYRAMI (1. Gün: 1 Şevval - 10. Ay) ---
                try
                {
                    // Bayramın 1. günü
                    DateTime ramazanStart = new DateTime(hYear, 10, 1, hijri);
                    
                    // Düzeltme uygula
                    ramazanStart = ramazanStart.AddDays(hijriCorrection);

                    if (ramazanStart.Year == year)
                    {
                        // Arife (Bir gün önce yarım gün)
                        DateTime arifeDate = ramazanStart.AddDays(-1);
                        list.Add(new Holiday 
                        { 
                            Name = "Ramazan Bayramı Arife", 
                            StartTime = arifeDate.Date.AddHours(13), 
                            EndTime = arifeDate.Date.AddDays(1).AddSeconds(-1),
                            Year = year
                        });

                        // Bayram (3 Gün)
                        list.Add(new Holiday 
                        { 
                            Name = "Ramazan Bayramı", 
                            StartTime = ramazanStart, 
                            EndTime = ramazanStart.AddDays(3).AddSeconds(-1),
                            Year = year
                        });
                    }
                }
                catch { } 

                // --- KURBAN BAYRAMI (1. Gün: 10 Zilhicce - 12. Ay) ---
                try
                {
                    // Bayramın 1. günü
                    DateTime kurbanStart = new DateTime(hYear, 12, 10, hijri);
                    
                    // Düzeltme uygula
                    kurbanStart = kurbanStart.AddDays(hijriCorrection);

                    if (kurbanStart.Year == year)
                    {
                        // Arife (Bir gün önce yarım gün)
                        DateTime arifeDate = kurbanStart.AddDays(-1);
                        list.Add(new Holiday 
                        { 
                            Name = "Kurban Bayramı Arife", 
                            StartTime = arifeDate.Date.AddHours(13), 
                            EndTime = arifeDate.Date.AddDays(1).AddSeconds(-1),
                            Year = year
                        });

                        // Bayram (4 Gün)
                        list.Add(new Holiday 
                        { 
                            Name = "Kurban Bayramı", 
                            StartTime = kurbanStart, 
                            EndTime = kurbanStart.AddDays(4).AddSeconds(-1),
                            Year = year
                        });
                    }
                }
                catch { }
            }

            return list;
        }
    }
}