using Core.DataAccess;
using Entities.Concrete;
using Entities.DTOs.HealthInfoDtos;
using System.Collections.Generic; // List için

namespace DataAccess.Repository.HealthInfoRepository
{
    public interface IHealthInfoDal : IEntityRepository<HealthInfo>
    {
        // Tüm sağlık bilgilerini kullanıcı detaylarıyla getirir (Liste sayfası için)
        // Bu imza YENİ DTO'yu (GetHealthInfoWithUserDto) zaten destekliyor.
        List<GetHealthInfoWithUserDto> GetAllWithUser();

        // Belirli bir ID'ye sahip sağlık bilgisini kullanıcı detaylarıyla getirir (Düzenleme sayfası için)
        // Bu imza YENİ DTO'yu (GetHealthInfoWithUserDto) zaten destekliyor.
        GetHealthInfoWithUserDto? GetWithUserById(long id);
    }
}