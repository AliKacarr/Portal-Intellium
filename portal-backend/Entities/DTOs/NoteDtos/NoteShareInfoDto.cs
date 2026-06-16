using System;
using System.Text.Json.Serialization;

namespace Entities.DTOs.NoteDtos
{
    public class NoteShareInfoDto
    {
        [JsonPropertyName("userId")]
        public long UserId { get; set; }

        [JsonPropertyName("userName")]
        public string UserName { get; set; }

        [JsonPropertyName("email")]
        public string Email { get; set; }

        // Frontend bazı yerlerde userEmail bekleyebiliyor; aynı değeri alias olarak veriyoruz.
        [JsonPropertyName("userEmail")]
        public string UserEmail
        {
            get => Email;
            set => Email = value;
        }

        [JsonPropertyName("readOnly")]
        public bool ReadOnly { get; set; }

        [JsonPropertyName("sharedAt")]
        public DateTime SharedAt { get; set; }
    }
}

