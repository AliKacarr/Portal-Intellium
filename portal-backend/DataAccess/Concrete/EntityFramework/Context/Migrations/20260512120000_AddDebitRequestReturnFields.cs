using DataAccess.Concrete.EntityFramework.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    [DbContext(typeof(PortalContext))]
    [Migration("20260512120000_AddDebitRequestReturnFields")]
    /// <inheritdoc />
    public partial class AddDebitRequestReturnFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RelatedDebitId",
                table: "DebitRequests",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestKind",
                table: "DebitRequests",
                type: "text",
                nullable: false,
                defaultValue: "Assignment");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RelatedDebitId",
                table: "DebitRequests");

            migrationBuilder.DropColumn(
                name: "RequestKind",
                table: "DebitRequests");
        }
    }
}
