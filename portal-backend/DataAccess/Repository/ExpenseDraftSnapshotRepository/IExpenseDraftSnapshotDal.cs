using Core.DataAccess;
using Entities.Concrete;

namespace DataAccess.Repository.ExpenseDraftSnapshotRepository
{
    public interface IExpenseDraftSnapshotDal : IEntityRepository<ExpenseDraftSnapshot>
    {
        /// <summary>
        /// expense_drafts.payload_json içinde bu masraf taslak Id'sine referans veren uuid snapshot kayıtlarını siler.
        /// </summary>
        int DeleteSnapshotsReferencingExpenseDraftId(long userId, long expenseDraftId);

        /// <summary>
        /// Üst düzey requestId ile eşleşen snapshot satırlarını siler (toplu taslak / talep bazlı silme).
        /// </summary>
        int DeleteSnapshotsForRequestId(long userId, string requestId);
    }
}

