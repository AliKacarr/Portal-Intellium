using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace DataAccess.Concrete.EntityFramework.Context
{
	/// <summary>
	/// dotnet ef migrations / database update --context PortalLogContext için (WebApi başlangıç projesi, cwd: WebApi).
	/// </summary>
	public sealed class PortalLogContextFactory : IDesignTimeDbContextFactory<PortalLogContext>
	{
		public PortalLogContext CreateDbContext(string[] args)
		{
			var env = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development";
			var basePath = Directory.GetCurrentDirectory();
			if (!File.Exists(Path.Combine(basePath, "appsettings.json")))
			{
				var webApi = Path.GetFullPath(Path.Combine(basePath, "..", "WebApi"));
				if (File.Exists(Path.Combine(webApi, "appsettings.json")))
					basePath = webApi;
			}

			var configuration = new ConfigurationBuilder()
				.SetBasePath(basePath)
				.AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
				.AddJsonFile($"appsettings.{env}.json", optional: true, reloadOnChange: true)
				.AddEnvironmentVariables()
				.Build();

			var connectionString = configuration.GetSection("ConnectionStrings:LogConnectionStrings").Value;
			if (string.IsNullOrWhiteSpace(connectionString))
				throw new InvalidOperationException(
					"ConnectionStrings:LogConnectionStrings bulunamadı. WebApi\\appsettings.json içinde tanımlayın veya komutu WebApi klasöründen çalıştırın.");

			AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
			AppContext.SetSwitch("Npgsql.DisableDateTimeInfinityConversions", true);

			var optionsBuilder = new DbContextOptionsBuilder<PortalLogContext>();
			optionsBuilder.UseNpgsql(connectionString);

			return new PortalLogContext(optionsBuilder.Options);
		}
	}
}
