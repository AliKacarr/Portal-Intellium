using Entities.Concrete.Logs;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace DataAccess.Concrete.EntityFramework.Context
{
	public class PortalLogContext : DbContext
	{
		public PortalLogContext() { }

		public PortalLogContext(DbContextOptions<PortalLogContext> options) : base(options) { }

		protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
		{
			if (optionsBuilder.IsConfigured)
				return;

			var builder = new ConfigurationBuilder().SetBasePath(Directory.GetCurrentDirectory()).AddJsonFile("appsettings.json", optional: true, reloadOnChange: true);
			var dbConnection = builder.Build().GetSection("ConnectionStrings:LogConnectionStrings").Value;

			AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
			AppContext.SetSwitch("Npgsql.DisableDateTimeInfinityConversions", true);
			optionsBuilder.UseNpgsql(dbConnection);
		}

		public DbSet<Session> Sessions { get; set; }
		public DbSet<RequestUrl> RequestUrl { get; set; }
		public DbSet<UserActivity> UserActivityLogs { get; set; }
		public DbSet<Error> Errors { get; set; }
		public DbSet<ErrorType> ErrorTypes { get; set; }
		public DbSet<ErrorMessage> ErrorMessages { get; set; }
		public DbSet<StackTrace> StackTrace { get; set; }

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			modelBuilder.Entity<Session>(entity =>
			{
				entity.ToTable("Sessions");
				entity.HasKey(e => e.Id);
				entity.Property(e => e.Username).HasColumnType("text");
				entity.Property(e => e.Token).HasColumnType("text");
				entity.Property(e => e.IPAddress).HasColumnType("text");
				entity.Property(e => e.UserAgent).HasColumnType("text");
				entity.Property(e => e.SessionHash).HasColumnType("text");
			});

			modelBuilder.Entity<RequestUrl>(entity =>
			{
				entity.ToTable("RequestUrl");
				entity.HasKey(e => e.Id);
				entity.Property(e => e.Url).HasColumnType("text");
			});

			modelBuilder.Entity<UserActivity>(entity =>
			{
				entity.ToTable("UserActivityLogs");
				entity.HasKey(e => e.Id);
				entity.Property(e => e.Payload).HasColumnType("text");
				entity.Property(e => e.Response).HasColumnType("text");
			});

			modelBuilder.Entity<Error>(entity =>
			{
				entity.ToTable("Errors");
				entity.HasKey(e => e.Id);
			});

			modelBuilder.Entity<ErrorType>(entity =>
			{
				entity.ToTable("ErrorTypes");
				entity.HasKey(e => e.Id);
				entity.Property(e => e.Type).HasColumnType("text");
			});

			modelBuilder.Entity<ErrorMessage>(entity =>
			{
				entity.ToTable("ErrorMessages");
				entity.HasKey(e => e.Id);
				entity.Property(e => e.Message).HasColumnType("text");
			});

			modelBuilder.Entity<StackTrace>(entity =>
			{
				entity.ToTable("StackTrace");
				entity.HasKey(e => e.Id);
				entity.Property(e => e.STHash).HasColumnType("text");
				entity.Property(e => e.ErrorStackTrace).HasColumnType("text");
			});
		}
	}
}
