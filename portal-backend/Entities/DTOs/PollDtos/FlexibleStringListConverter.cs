using System.Text.Json;
using System.Text.Json.Serialization;

namespace Entities.DTOs.PollDtos
{
    public class FlexibleStringListConverter : JsonConverter<List<string>>
    {
        public override List<string> Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return new List<string>();

            if (reader.TokenType != JsonTokenType.StartArray)
                throw new JsonException("Options alanı dizi olmalıdır.");

            var result = new List<string>();

            while (reader.Read())
            {
                if (reader.TokenType == JsonTokenType.EndArray)
                    return result;

                if (reader.TokenType == JsonTokenType.String)
                {
                    result.Add(reader.GetString() ?? string.Empty);
                    continue;
                }

                if (reader.TokenType == JsonTokenType.StartObject)
                {
                    using var itemDoc = JsonDocument.ParseValue(ref reader);
                    var item = itemDoc.RootElement;

                    if (TryReadString(item, "text", out var text) ||
                        TryReadString(item, "label", out text) ||
                        TryReadString(item, "value", out text))
                    {
                        result.Add(text);
                        continue;
                    }

                    throw new JsonException("Options içindeki obje text/label/value alanlarından birini içermelidir.");
                }

                throw new JsonException("Options elemanları string veya obje olmalıdır.");
            }

            throw new JsonException("Options JSON dizisi hatalı sonlandı.");
        }

        public override void Write(Utf8JsonWriter writer, List<string> value, JsonSerializerOptions options)
        {
            writer.WriteStartArray();
            foreach (var item in value)
            {
                writer.WriteStringValue(item);
            }
            writer.WriteEndArray();
        }

        private static bool TryReadString(JsonElement element, string propertyName, out string value)
        {
            value = string.Empty;
            if (!element.TryGetProperty(propertyName, out var property))
                return false;

            if (property.ValueKind == JsonValueKind.String)
            {
                value = property.GetString() ?? string.Empty;
                return true;
            }

            if (property.ValueKind == JsonValueKind.Number || property.ValueKind == JsonValueKind.True || property.ValueKind == JsonValueKind.False)
            {
                value = property.ToString();
                return true;
            }

            return false;
        }
    }
}
