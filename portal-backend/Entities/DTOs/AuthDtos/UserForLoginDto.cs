using System.Text.Json.Serialization;

namespace Entities.DTOs.AuthDtos
{
    public class UserForLoginDto
    {
        [JsonPropertyName("email")]
        public string Email { get; set; }
        [JsonPropertyName("password")]
        public string Password { get; set; }
    }
}
