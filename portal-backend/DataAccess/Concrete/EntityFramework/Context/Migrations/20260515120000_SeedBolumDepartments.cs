using DataAccess.Concrete.EntityFramework.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    [DbContext(typeof(PortalContext))]
    [Migration("20260515120000_SeedBolumDepartments")]
    public partial class SeedBolumDepartments : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            var names = new[] { "Ar&Ge", "Merkez", "Dış Kaynak" };
            foreach (var name in names)
            {
                var esc = name.Replace("'", "''");
                migrationBuilder.Sql($@"
INSERT INTO ""Departments"" (""Name"", ""Description"", ""IsActive"", ""CreatedAt"")
SELECT '{esc}', NULL, true, NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM ""Departments"" WHERE ""Name"" = '{esc}' AND ""IsActive""
);");
            }
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
