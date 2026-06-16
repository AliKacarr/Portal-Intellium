using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Core.Utilities.Json
{
    /// <summary>DateTime? alanları ISO 8601 (Z) ile yazar; saat bilgisi kaybolmaz.</summary>
    public class FlexibleNullableDateTimeConverter : JsonConverter<DateTime?>
    {
        private static readonly string[] Formats =
        {
            "dd.MM.yyyy",
            "d.M.yyyy",
            "yyyy-MM-dd",
            "yyyy-MM-ddTHH:mm:ss",
            "yyyy-MM-ddTHH:mm:ssZ",
            "yyyy-MM-ddTHH:mm:ss.fffZ",
            "yyyy-MM-ddTHH:mm:ss.fff",
            "o",
        };

        public override DateTime? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return null;

            var value = reader.GetString();
            if (string.IsNullOrWhiteSpace(value))
                return null;

            if (DateTime.TryParseExact(value, Formats, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var parsed))
                return parsed;

            if (DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind, out var fallback))
                return fallback;

            throw new JsonException($"Geçersiz tarih formatı: '{value}'");
        }

        public override void Write(Utf8JsonWriter writer, DateTime? value, JsonSerializerOptions options)
        {
            if (!value.HasValue)
            {
                writer.WriteNullValue();
                return;
            }

            var dt = value.Value;
            if (dt.Kind == DateTimeKind.Unspecified)
                dt = DateTime.SpecifyKind(dt, DateTimeKind.Local);

            writer.WriteStringValue(dt.ToString("o", CultureInfo.InvariantCulture));
        }
    }
}
