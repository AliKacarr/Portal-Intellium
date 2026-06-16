using System.Text.Json.Serialization;

namespace Core.Utilities.Results.Concrete
{
    public class ExceptionResult
    {
        public int StatusCode { get; set; }
        public string? Message { get; set; }

        // Frontend standardi icin (backward compatible)
        [JsonPropertyName("message")]
        public string? MessageAlias
        {
            get => Message;
            set => Message = value;
        }
    }
}
