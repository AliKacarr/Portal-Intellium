using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Entities.Converters
{
    /// <summary>
    /// Frontend tagIds'i bazen dizi, bazen string gönderir. Her iki formatta da List&lt;string&gt; olarak okur (400 hatasını önler).
    /// </summary>
    public class TagIdsJsonConverter : JsonConverter<List<string>>
    {
        public override List<string> Read(ref Utf8JsonReader reader, System.Type typeToConvert, JsonSerializerOptions options)
        {
            if (reader.TokenType == JsonTokenType.Null)
                return new List<string>();
            if (reader.TokenType == JsonTokenType.String)
            {
                var s = reader.GetString();
                return string.IsNullOrEmpty(s) ? new List<string>() : new List<string> { s };
            }
            if (reader.TokenType == JsonTokenType.StartArray)
            {
                var list = new List<string>();
                while (reader.Read())
                {
                    if (reader.TokenType == JsonTokenType.EndArray) break;
                    if (reader.TokenType == JsonTokenType.String)
                        list.Add(reader.GetString() ?? "");
                    else if (reader.TokenType == JsonTokenType.Number && reader.TryGetInt64(out var num))
                        list.Add(num.ToString());
                }
                return list;
            }
            return new List<string>();
        }

        public override void Write(Utf8JsonWriter writer, List<string> value, JsonSerializerOptions options)
        {
            writer.WriteStartArray();
            foreach (var item in value ?? new List<string>())
                writer.WriteStringValue(item);
            writer.WriteEndArray();
        }
    }
}
