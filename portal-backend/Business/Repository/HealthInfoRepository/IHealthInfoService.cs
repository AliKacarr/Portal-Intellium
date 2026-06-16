using Core.Utilities.Results.Abstract;
using Entities.Concrete; // HealthInfo için
using Entities.DTOs.HealthInfoDtos;
using System.Collections.Generic; // List için
using System.Security.Claims; // YENİ: Kullanıcının kimliğini (ve rollerini) almak için

namespace Business.Repository.HealthInfoRepository
{
    public interface IHealthInfoService
    {
        // YENİ: Metodlar artık 'ClaimsPrincipal user' parametresi alıyor
        // Bu, Manager'da "Admin mi?" kontrolü yapabilmemiz için GEREKLİDİR.
        // Controller'dan 'User' (HttpContext.User) nesnesini buraya göndereceğiz.

        // Yeni kayıt ekleme (Yeni DTO ile)
        IResult Add(AddHealthInfoDto healthInfoAddDto, ClaimsPrincipal user);

        // Kayıt silme (Dosyaları da siler)
        IResult Delete(long id);

        // Kayıt güncelleme (Yeni DTO ile)
        IResult Update(UpdateHealthInfoDto healthInfoUpdateDto, ClaimsPrincipal user);

        // Tüm kayıtları kullanıcı bilgisiyle getir (Admin kontrolü içerir)
        IDataResult<List<GetHealthInfoWithUserDto>> GetAllWithUser(ClaimsPrincipal user);

        // Belirli bir kullanıcının tüm kayıtlarını getir
        // NOT: Bu metodun DTO dönmesi daha iyi olabilir, şimdilik entity bırakıyoruz.
        IDataResult<List<HealthInfo>> GetAllByUserId(long userId);

        // Tek bir kaydı kullanıcı bilgisiyle getir (Admin kontrolü içerir)
        IDataResult<GetHealthInfoWithUserDto> GetWithUserById(long id, ClaimsPrincipal user);
    }
}