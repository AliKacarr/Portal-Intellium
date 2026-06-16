using Core.Utilities.Results.Abstract;
using Entities.DTOs.ExpenseDto;

namespace Business.Repository.ExpenseRepository
{
    public interface IExpenseService
    {
        IDataResult<ExpenseDto> Add(AddExpenseDto expenseDto);
        /// <summary>Taslak ekler. Zorunlu alanlar gevşektir; submit aşamasında doğrulanır.</summary>
        IDataResult<ExpenseDto> AddDraft(UpsertExpenseDraftDto draftDto);
        /// <summary>Çoklu taslak ekler.</summary>
        IDataResult<List<ExpenseDto>> BulkInsertDraft(BulkInsertExpenseDraftRequestDto request, IReadOnlyList<string>? imagePathsByIndex = null);
        /// <summary>Kullanıcının kendi taslaklarını listeler.</summary>
        IDataResult<List<ExpenseDto>> GetMyDrafts();
        /// <summary>Taslak günceller (partial).</summary>
        IDataResult<ExpenseDto> UpdateDraft(int draftId, UpsertExpenseDraftDto draftDto);
        /// <summary>Taslak siler.</summary>
        IResult DeleteDraft(int draftId);
        /// <summary>RequestId bazlı taslak siler.</summary>
        IResult DeleteDraftByRequest(string requestId);
        /// <summary>Taslağı gönderir (Beklemede'ye çevirir).</summary>
        IDataResult<ExpenseDto> SubmitDraft(int draftId);
        /// <summary>RequestId bazlı taslakları gönderir (Beklemede'ye çevirir).</summary>
        IDataResult<List<ExpenseDto>> SubmitDraftRequest(string requestId);
        IDataResult<List<ExpenseDto>> BulkAdd(BulkAddExpenseDto bulkDto);
        /// <summary>Çoklu kayıt: her öğe ayrı satır, createdBy = isteği atan, status = Beklemede. imagePathsByIndex: dosya indeksine göre yüklenen dosya yolları.</summary>
        IDataResult<List<ExpenseDto>> BulkInsert(BulkInsertExpenseRequestDto request, IReadOnlyList<string>? imagePathsByIndex = null);
        IDataResult<ExpenseDto> Update(UpdateExpenseDto expenseDto);
        IResult Delete(int id);
        IDataResult<List<ExpenseDto>> GetAllByUserId(long userId);
        IDataResult<List<ExpenseDto>> GetFiltered(ExpenseFilterDto filter);
        /// <summary>Admin: Tüm kullanıcıların masraflarını döner (userId filtresi uygulanmaz).</summary>
        IDataResult<List<ExpenseDto>> GetAllForAdmin(ExpenseFilterDto filter);
        IDataResult<ExpenseDto> GetById(int id);
        IDataResult<ExpenseDetailDto> GetDetailById(int id);
        IDataResult<ExpenseDetailDto> Approve(ApproveExpenseDto dto);
        IResult Reject(int id);
        IDataResult<ExpenseDto> TogglePin(int id);
        /// <summary>Mevcut filtreye göre masraf listesini Excel olarak döner. Tarih sütunu doğru format ve genişlikte.</summary>
        IDataResult<byte[]> ExportToExcel(ExpenseFilterDto filter);
        /// <summary>Mevcut filtreye göre masraf listesini PDF (MASRAF FORMU) olarak döner. Admin: tümü; kullanıcı: sadece kendi kayıtları (GetFiltered ile aynı).</summary>
        IDataResult<byte[]> ExportToPdf(ExpenseFilterDto filter);
        /// <summary>Tek masraf kaydını detay formatında PDF olarak döner.</summary>
        IDataResult<byte[]> ExportSingleToPdf(int id);
        /// <summary>Tek çağrı ile request bazlı onay.</summary>
        IDataResult<List<ExpenseDetailDto>> ApproveRequest(string requestId, Entities.DTOs.ExpenseDto.ApproveExpenseRequestDto dto);
        /// <summary>Tek çağrı ile request bazlı red.</summary>
        IResult RejectRequest(string requestId, Entities.DTOs.ExpenseDto.RejectExpenseRequestDto dto);
        /// <summary>Tek çağrı ile request bazlı revize talebi (Status: Revize Bekliyor).</summary>
        IDataResult<List<ExpenseDto>> RevisionRequest(string requestId, Entities.DTOs.ExpenseDto.RevisionExpenseRequestDto dto);
        /// <summary>Masraf formu için izin verilen para birimleri (ISO 4217).</summary>
        IDataResult<List<ExpenseCurrencyOptionDto>> GetSupportedCurrencies();

        // --- Tamamlanmamış masraf (incomplete drafts) ---
        IDataResult<UpsertExpenseIncompleteDraftResponseDto> UpsertIncompleteDraft(UpsertExpenseIncompleteDraftRequestDto request);
        IResult DeleteIncompleteDraft(string draftId);
        IDataResult<List<ExpenseIncompleteDraftDto>> GetMyIncompleteDrafts();
        IDataResult<ExpenseIncompleteDraftDetailDto> GetMyIncompleteDraftById(string draftId);

        // --- Taslak snapshot (uuid + payload_json) ---
        IDataResult<UpsertExpenseDraftSnapshotResponseDto> UpsertDraftSnapshot(UpsertExpenseDraftSnapshotRequestDto request);
        IDataResult<List<ExpenseDraftSnapshotDto>> GetMyDraftSnapshots();
        IDataResult<ExpenseDraftSnapshotDto> GetMyDraftSnapshotById(string draftId);
        IResult DeleteDraftSnapshot(string draftId);
    }
}
