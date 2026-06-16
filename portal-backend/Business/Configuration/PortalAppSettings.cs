namespace Business.Configuration
{
    /// <summary>appsettings bölümü: <c>AppSettings</c></summary>
    public sealed class PortalAppSettings
    {
        public const string SectionName = "AppSettings";

        /// <summary>Portal ön yüz kök URL (örn. https://portal.intellium.com.tr)</summary>
        public string AppUrl { get; set; } = string.Empty;
    }
}
