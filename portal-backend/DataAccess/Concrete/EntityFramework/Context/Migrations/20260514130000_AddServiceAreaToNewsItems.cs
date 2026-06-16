using DataAccess.Concrete.EntityFramework.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    [DbContext(typeof(PortalContext))]
    [Migration("20260514130000_AddServiceAreaToNewsItems")]
    public partial class AddServiceAreaToNewsItems : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ServiceArea",
                table: "NewsItems",
                type: "text",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ServiceArea",
                table: "NewsItems");
        }
    }
}
