using AutoMapper;
using Entities.Concrete;
using Entities.DTOs.HealthInfoDtos;

namespace Business.Mapping.AutoMapper
{
    public class HealthInfoMapping : Profile
    {
        public HealthInfoMapping()
        {
            // --- DTO -> ENTITY ---

            // Add DTO -> Entity
            CreateMap<AddHealthInfoDto, HealthInfo>()
                .ForMember(dest => dest.HealthInfoPremium, opt => opt.MapFrom(src => src.PremiumDetails))
                .ForMember(dest => dest.HealthInfoDependents, opt => opt.MapFrom(src => src.Dependents))
                // Dosyaları (IFormFile) manuel yöneteceğimiz için ignore ediyoruz
                .ForMember(dest => dest.HealthInfoDocuments, opt => opt.Ignore())
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.AddedAt, opt => opt.Ignore())
                .ForMember(dest => dest.IsActive, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore()); // UserId zaten mapleniyor

            // Update DTO -> Entity
            CreateMap<UpdateHealthInfoDto, HealthInfo>()
                .ForMember(dest => dest.HealthInfoPremium, opt => opt.MapFrom(src => src.PremiumDetails))
                
                // --- DÜZELTME BURADA YAPILDI ---
                // Manager sınıfında manuel döngü ile yönettiğimiz için AutoMapper buraya DOKUNMAMALI!
                // Önceden MapFrom vardı, şimdi Ignore() yaptık.
                .ForMember(dest => dest.HealthInfoDependents, opt => opt.Ignore()) 
                // -------------------------------

                // Dosyaları (IFormFile) ve silme listelerini manuel yöneteceğiz
                .ForMember(dest => dest.HealthInfoDocuments, opt => opt.Ignore()) 
                .ForMember(dest => dest.Id, opt => opt.Ignore()) // Id'yi güncellemede kullanmayız
                .ForMember(dest => dest.AddedAt, opt => opt.Ignore())
                .ForMember(dest => dest.IsActive, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore());

            // Alt DTO'lar -> Entity
            CreateMap<HealthInfoPremiumDto, HealthInfoPremium>()
                 // Id'yi DTO'dan almak istemeyebiliriz, EF'in yönetmesi daha iyi (1:1'de)
                 // .ForMember(dest => dest.Id, opt => opt.Ignore()) 
                 .ForMember(dest => dest.HealthInfo, opt => opt.Ignore());
            
            CreateMap<HealthInfoDependentDto, HealthInfoDependent>()
                 // Id'yi DTO'dan alıyoruz (Güncelleme için önemli)
                 .ForMember(dest => dest.HealthInfo, opt => opt.Ignore());


            // --- ENTITY -> DTO ---

            // Ana Entity -> Ana Get DTO
            CreateMap<HealthInfo, GetHealthInfoWithUserDto>()
                // Zaten isimler (PremiumDetails, Dependents, Documents) eşleşmiyor,
                // o yüzden AutoMapper'ın otomatik yapmasını beklemeyip manuel eşliyoruz:
                .ForMember(dest => dest.PremiumDetails, opt => opt.MapFrom(src => src.HealthInfoPremium))
                .ForMember(dest => dest.Dependents, opt => opt.MapFrom(src => src.HealthInfoDependents))
                .ForMember(dest => dest.Documents, opt => opt.MapFrom(src => src.HealthInfoDocuments));

            // Alt Entity -> Alt DTO
            CreateMap<HealthInfoPremium, HealthInfoPremiumDto>();
            CreateMap<HealthInfoDependent, HealthInfoDependentDto>();
            CreateMap<HealthInfoDocument, HealthInfoDocumentDto>();
        }
    }
}