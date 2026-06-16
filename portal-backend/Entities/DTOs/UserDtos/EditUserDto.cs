using System;
using System.Text.Json.Serialization;

namespace Entities.DTOs.UserDtos
{
    public class EditUserDto
    {
        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public long Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Language { get; set; }
        public string? NewPassword { get; set; }
        public bool IsActive { get; set; }

        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public long CustomerId { get; set; }

        [JsonNumberHandling(JsonNumberHandling.AllowReadingFromString)]
        public long UserRoleId { get; set; }

        public DateTime AddetAt { get; set; }   // İşe Başlama Tarihi
        public DateTime BirthDate { get; set; } // Doğum Tarihi
    }
}