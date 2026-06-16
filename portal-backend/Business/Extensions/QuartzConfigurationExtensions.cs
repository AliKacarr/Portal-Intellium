using System;
using Business.Schedulers.Jobs;
using Business.Schedulers.Keys;
using Microsoft.Extensions.DependencyInjection;
using Quartz;

namespace Business.Extensions
{
    public static class QuartzConfigurationExtensions
    {
        public static void AddPortalQuartz(this IServiceCollection services)
        {
            services.AddQuartz(configurator =>
            {
                // Her job çalıştırmasında ayrı DI scope kullan (DbContext concurrency hatalarını önler)
                configurator.UseMicrosoftDependencyInjectionJobFactory();

                // Birthday
                configurator.AddJob<BirthdayJob>(options => options.WithIdentity(JobKeys.BirthdayJob));
                configurator.AddTrigger(options => options.ForJob(JobKeys.BirthdayJob)
                .WithIdentity(TriggerKeys.BirthdayTrigger)
                .WithCronSchedule("0 0 8 * * ?"));

                // Military
                configurator.AddJob<MilitaryJob>(options => options.WithIdentity(JobKeys.MilitaryJob));
                configurator.AddTrigger(options => options.ForJob(JobKeys.MilitaryJob)
                .WithIdentity(TriggerKeys.MilitaryTrigger)
                .WithCronSchedule("0 10 8 * * ?"));

                // Insurance
                configurator.AddJob<InsuranceJob>(options => options.WithIdentity(JobKeys.InsuranceJob));
                configurator.AddTrigger(options => options.ForJob(JobKeys.InsuranceJob)
                .WithIdentity(TriggerKeys.InsuranceTrigger)
                .WithCronSchedule("0 15 8 * * ?"));

                // ProjectTime
                configurator.AddJob<ProjectTimeJob>(options => options.WithIdentity(JobKeys.ProjectTimeJob));
                configurator.AddTrigger(options => options.ForJob(JobKeys.ProjectTimeJob)
                .WithIdentity(TriggerKeys.ProjectTimeTrigger)
                .WithCronSchedule("0 20 8 * * ?"));

                // dev_v2: izin bakiyesi
                configurator.AddJob<LeaveBalanceRefreshJob>(options => options.WithIdentity(JobKeys.LeaveBalanceRefreshJob));
                configurator.AddTrigger(options => options.ForJob(JobKeys.LeaveBalanceRefreshJob)
                .WithIdentity(TriggerKeys.LeaveBalanceRefreshTrigger)
                .WithCronSchedule("0 0 0 * * ?"));

                // Expense: masraf hatırlatma + taslak temizliği
                configurator.AddJob<ExpenseRequestReminderJob>(options => options.WithIdentity(JobKeys.ExpenseRequestReminderJob));
                configurator.AddTrigger(options => options.ForJob(JobKeys.ExpenseRequestReminderJob)
                    .WithIdentity(TriggerKeys.ExpenseRequestReminderMondayTrigger)
                    .WithCronSchedule("0 0 8 ? * MON", x => x.InTimeZone(TurkeyTimeZone())));
                configurator.AddTrigger(options => options.ForJob(JobKeys.ExpenseRequestReminderJob)
                    .WithIdentity(TriggerKeys.ExpenseRequestReminderLastDayTrigger)
                    .WithCronSchedule("0 0 8 L * ?", x => x.InTimeZone(TurkeyTimeZone())));

                configurator.AddJob<ExpenseIncompleteDraftCleanupJob>(options => options.WithIdentity(JobKeys.ExpenseIncompleteDraftCleanupJob));
                configurator.AddTrigger(options => options.ForJob(JobKeys.ExpenseIncompleteDraftCleanupJob)
                    .WithIdentity(TriggerKeys.ExpenseIncompleteDraftCleanupDailyTrigger)
                    .WithCronSchedule("0 30 2 * * ?", x => x.InTimeZone(TurkeyTimeZone())));

            });
        }

        /// <summary>Quartz cron'u sunucu yereli yerine TR saatine sabitler (Windows / Linux uyumu).</summary>
        private static TimeZoneInfo TurkeyTimeZone()
        {
            try
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Europe/Istanbul");
            }
            catch
            {
                return TimeZoneInfo.FindSystemTimeZoneById("Turkey Standard Time");
            }
        }
    }
}
