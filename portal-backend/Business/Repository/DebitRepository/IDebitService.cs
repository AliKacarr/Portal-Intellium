using Core.Utilities.Results.Abstract;
using Entities.Concrete;
using Entities.DTOs; // DTO'ları kullanabilmek için şart
using System.Collections.Generic;

namespace Business.Repository.DebitRepository
{
    public interface IDebitService
    {
        // Temel CRUD İşlemleri
        IResult Add(Debit debit);
        IResult Update(Debit debit);
        IResult Delete(Debit debit);
        
        // Tekil Getirme
        IDataResult<Debit> GetById(int id);
        
        // Listeleme (Frontend için DTO dönen kritik metot)
        // NOT: Artık CPU, RAM vb. değil, genel DTO yapısı dönecek
        IDataResult<List<DebitDetailDto>> GetAllDebitsDto(); 
        
        // PDF Oluşturma
        IDataResult<string> GenerateDebitPdf(int debitId);

        /// <summary>Alıcı kullanıcı: statü Gönderildi → Teslim Edildi (tutanak oluşur).</summary>
        IResult ConfirmDeliveryByReceiver(int debitId, long receiverUserId);

        /// <summary>Admin: kullanıcı adına teslim onayı (aynı geçiş).</summary>
        IResult MarkDeliveredByAdmin(int debitId);

        /// <summary>Alıcı: Gönderildi → Teslim Edilemedi; stok iade, tutanak yok.</summary>
        IResult MarkDeliveryFailedByReceiver(int debitId, long receiverUserId, string? note);

        /// <summary>Admin: Gönderildi → Teslim Edilemedi (aynı stok iadesi).</summary>
        IResult MarkDeliveryFailedByAdmin(int debitId, string? note);
    }
}