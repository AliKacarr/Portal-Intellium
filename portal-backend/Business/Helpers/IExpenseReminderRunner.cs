using Core.Utilities.Results.Abstract;
using Entities.DTOs.ExpenseDto;

namespace Business.Helpers
{
    public interface IExpenseReminderRunner
    {
        /// <summary>HTTP / manuel test: admin JWT gerekir.</summary>
        Task<IDataResult<ExpenseReminderRunResultDto>> RunAsync(RunExpenseRemindersDto dto, CancellationToken cancellationToken = default);

        /// <summary>Zamanlanmış Quartz job; HTTP kullanıcısı yoktur, yetki kontrolü yapılmaz.</summary>
        Task<IDataResult<ExpenseReminderRunResultDto>> RunScheduledAsync(RunExpenseRemindersDto dto, CancellationToken cancellationToken = default);

        /// <summary>Admin: bildirim neden boş — teşhis (DB sorgusu, zaman kuralı, hedef kullanıcı listesi).</summary>
        Task<IDataResult<ExpenseReminderDiagnosticsDto>> GetDiagnosticsAsync(CancellationToken cancellationToken = default);

        /// <summary>
        /// Masraf ekleme/güncelleme sonrası: yetki kontrolü yok; talep sahibi + (varsa) adminlere anında bildirim ve e-posta (ReminderType=Immediate).
        /// </summary>
        /// <param name="forceResendImmediate">Aynı gün için daha önce Immediate log varsa silip yeniden bildirim/e-posta (API yeniden başlatma taraması için).</param>
        Task NotifyAdminsForExpenseRequestAsync(string requestId, CancellationToken cancellationToken = default, bool forceResendImmediate = false);

        /// <summary>Admin: SMTP ayarını doğrulamak için tek test e-postası gönderir.</summary>
        Task<IDataResult<string>> SendTestMailAsync(string toEmail, CancellationToken cancellationToken = default);
    }
}
