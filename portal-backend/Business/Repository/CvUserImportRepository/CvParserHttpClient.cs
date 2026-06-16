using System.Net.Http.Headers;
using System.Text.Json;
using Entities.DTOs.CvUserImportDtos;
using Microsoft.Extensions.Configuration;

namespace Business.Repository.CvUserImportRepository
{
    public class CvParserHttpClient : ICvParserClient
    {
        private readonly IConfiguration _configuration;
        private readonly JsonSerializerOptions _jsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
        };

        public CvParserHttpClient(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<CvCandidateDto> ParseAsync(string absoluteFilePath, string fileName, string contentType, CancellationToken cancellationToken)
        {
            if (!System.IO.File.Exists(absoluteFilePath))
                throw new FileNotFoundException("CV dosyası bulunamadı.", absoluteFilePath);

            var baseUrl = (_configuration["CvParser:BaseUrl"] ?? "").Trim().TrimEnd('/');
            if (string.IsNullOrWhiteSpace(baseUrl))
                throw new InvalidOperationException("CvParser:BaseUrl yapılandırması eksik. WebApi appsettings veya ortam değişkeni CvParser__BaseUrl tanımlayın.");
            var endpoint = _configuration["CvParser:ParseEndpoint"] ?? "/cv/parse";
            var timeoutSeconds = int.TryParse(_configuration["CvParser:TimeoutSeconds"], out var configuredTimeout)
                ? configuredTimeout
                : 480;

            using var httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(timeoutSeconds),
            };
            var serviceKey = _configuration["CvParser:ServiceKey"] ?? _configuration["ServiceKeys:PortalMeet"];
            if (!string.IsNullOrWhiteSpace(serviceKey))
                httpClient.DefaultRequestHeaders.Add("X-Service-Key", serviceKey);

            using var form = new MultipartFormDataContent();
            await using var fileStream = System.IO.File.OpenRead(absoluteFilePath);
            using var fileContent = new StreamContent(fileStream);
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse(string.IsNullOrWhiteSpace(contentType)
                ? "application/octet-stream"
                : contentType);
            form.Add(fileContent, "file", fileName);

            var requestUrl = $"{baseUrl.TrimEnd('/')}/{endpoint.TrimStart('/')}";
            using var response = await httpClient.PostAsync(requestUrl, form, cancellationToken);
            var responseText = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
                throw new InvalidOperationException($"CV parse servisi hata döndü ({(int)response.StatusCode}): {responseText}");

            var parsedResponse = JsonSerializer.Deserialize<CvParserResponseDto>(responseText, _jsonOptions);
            if (parsedResponse == null)
                throw new InvalidOperationException("CV parse servisi boş cevap döndü.");

            if (!parsedResponse.Success)
                throw new InvalidOperationException(parsedResponse.Error ?? "CV parse servisi başarısız cevap döndü.");

            if (parsedResponse.Candidate == null)
                throw new InvalidOperationException("CV parse servisinden kişi bilgisi dönmedi.");

            return parsedResponse.Candidate;
        }

        private class CvParserResponseDto
        {
            public bool Success { get; set; }
            public CvCandidateDto? Candidate { get; set; }
            public string? Error { get; set; }
        }
    }
}
