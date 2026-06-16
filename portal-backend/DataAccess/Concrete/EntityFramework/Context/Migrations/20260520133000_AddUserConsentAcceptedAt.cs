using DataAccess.Concrete.EntityFramework.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    [DbContext(typeof(PortalContext))]
    [Migration("20260520133000_AddUserConsentAcceptedAt")]
    public partial class AddUserConsentAcceptedAt : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
ALTER TABLE ""Users"" ADD COLUMN IF NOT EXISTS ""LegalConsentAcceptedAt"" timestamp without time zone NULL;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'KvkkAcceptedAt'
    ) THEN
        EXECUTE 'UPDATE ""Users"" SET ""LegalConsentAcceptedAt"" = COALESCE(""LegalConsentAcceptedAt"", ""KvkkAcceptedAt"") WHERE ""LegalConsentAcceptedAt"" IS NULL';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Users' AND column_name = 'ExplicitConsentAcceptedAt'
    ) THEN
        EXECUTE 'UPDATE ""Users"" SET ""LegalConsentAcceptedAt"" = COALESCE(""LegalConsentAcceptedAt"", ""ExplicitConsentAcceptedAt"") WHERE ""LegalConsentAcceptedAt"" IS NULL';
    END IF;
END $$;

ALTER TABLE ""Users"" DROP COLUMN IF EXISTS ""KvkkAcceptedAt"";
ALTER TABLE ""Users"" DROP COLUMN IF EXISTS ""ExplicitConsentAcceptedAt"";
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
ALTER TABLE ""Users"" DROP COLUMN IF EXISTS ""LegalConsentAcceptedAt"";
");
        }
    }
}
