using Entities.DTOs.NoteDtos;
using FluentValidation;

namespace Business.Repository.NoteRepository.Validations
{
    /// <summary>
    /// Not oluşturma/güncelleme body'si - tüm alanlar opsiyonel (boş not da oluşturulabilir).
    /// </summary>
    public class NoteCreateUpdateDtoValidator : AbstractValidator<NoteCreateUpdateDto>
    {
        public NoteCreateUpdateDtoValidator()
        {
            // Tüm alanlar opsiyonel; ek kural yok. Böylece "One or more validation errors" 400'ü önlenir.
        }
    }
}
