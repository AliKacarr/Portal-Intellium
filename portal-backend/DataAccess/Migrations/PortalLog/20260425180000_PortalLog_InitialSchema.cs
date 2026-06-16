using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DataAccess.Migrations.PortalLog
{
	/// <summary>portallogdb — kullanıcı aktivitesi ve hata log tabloları.</summary>
	public partial class PortalLog_InitialSchema : Migration
	{
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.CreateTable(
				name: "RequestUrl",
				columns: table => new
				{
					Id = table.Column<long>(type: "bigint", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					Url = table.Column<string>(type: "text", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_RequestUrl", x => x.Id);
				});

			migrationBuilder.CreateTable(
				name: "Sessions",
				columns: table => new
				{
					Id = table.Column<long>(type: "bigint", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					UserId = table.Column<long>(type: "bigint", nullable: false),
					Username = table.Column<string>(type: "text", nullable: false),
					Token = table.Column<string>(type: "text", nullable: false),
					IPAddress = table.Column<string>(type: "text", nullable: false),
					UserAgent = table.Column<string>(type: "text", nullable: false),
					SessionHash = table.Column<string>(type: "text", nullable: true),
					Verified = table.Column<bool>(type: "boolean", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Sessions", x => x.Id);
				});

			migrationBuilder.CreateTable(
				name: "UserActivityLogs",
				columns: table => new
				{
					Id = table.Column<long>(type: "bigint", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					SessionId = table.Column<long>(type: "bigint", nullable: false),
					RequestUrlId = table.Column<long>(type: "bigint", nullable: false),
					Payload = table.Column<string>(type: "text", nullable: true),
					StatusCode = table.Column<int>(type: "integer", nullable: false),
					Time = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
					Response = table.Column<string>(type: "text", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_UserActivityLogs", x => x.Id);
				});

			migrationBuilder.CreateTable(
				name: "StackTrace",
				columns: table => new
				{
					Id = table.Column<long>(type: "bigint", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					STHash = table.Column<string>(type: "text", nullable: false),
					ErrorStackTrace = table.Column<string>(type: "text", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_StackTrace", x => x.Id);
				});

			migrationBuilder.CreateTable(
				name: "ErrorTypes",
				columns: table => new
				{
					Id = table.Column<long>(type: "bigint", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					Type = table.Column<string>(type: "text", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_ErrorTypes", x => x.Id);
				});

			migrationBuilder.CreateTable(
				name: "ErrorMessages",
				columns: table => new
				{
					Id = table.Column<long>(type: "bigint", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					Message = table.Column<string>(type: "text", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_ErrorMessages", x => x.Id);
				});

			migrationBuilder.CreateTable(
				name: "Errors",
				columns: table => new
				{
					Id = table.Column<long>(type: "bigint", nullable: false)
						.Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
					ActivityId = table.Column<long>(type: "bigint", nullable: false),
					TypeId = table.Column<long>(type: "bigint", nullable: false),
					MessageId = table.Column<long>(type: "bigint", nullable: false),
					StackTraceId = table.Column<long>(type: "bigint", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Errors", x => x.Id);
				});
		}

		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(name: "Errors");
			migrationBuilder.DropTable(name: "ErrorMessages");
			migrationBuilder.DropTable(name: "ErrorTypes");
			migrationBuilder.DropTable(name: "StackTrace");
			migrationBuilder.DropTable(name: "UserActivityLogs");
			migrationBuilder.DropTable(name: "Sessions");
			migrationBuilder.DropTable(name: "RequestUrl");
		}
	}
}
