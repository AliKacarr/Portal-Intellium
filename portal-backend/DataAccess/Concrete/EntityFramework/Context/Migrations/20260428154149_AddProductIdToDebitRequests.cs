using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    /// <inheritdoc />
    public partial class AddProductIdToDebitRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ProductId",
                table: "DebitRequests",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 1L,
                columns: new[] { "AddetAt", "LicenceFinishDate", "LicenceStartDate" },
                values: new object[] { new DateTime(2026, 4, 28, 18, 41, 49, 270, DateTimeKind.Local).AddTicks(935), new DateTime(2026, 6, 27, 18, 41, 49, 270, DateTimeKind.Local).AddTicks(909), new DateTime(2026, 4, 28, 18, 41, 49, 270, DateTimeKind.Local).AddTicks(896) });

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 28, 15, 41, 49, 270, DateTimeKind.Utc).AddTicks(862));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 28, 15, 41, 49, 270, DateTimeKind.Utc).AddTicks(865));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 28, 15, 41, 49, 270, DateTimeKind.Utc).AddTicks(867));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddetAt",
                value: new DateTime(2026, 4, 28, 18, 41, 49, 270, DateTimeKind.Local).AddTicks(1411));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddetAt",
                value: new DateTime(2026, 4, 28, 18, 41, 49, 270, DateTimeKind.Local).AddTicks(1418));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 28, 15, 41, 49, 270, DateTimeKind.Utc).AddTicks(733));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 28, 15, 41, 49, 270, DateTimeKind.Utc).AddTicks(736));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 28, 15, 41, 49, 270, DateTimeKind.Utc).AddTicks(738));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 4, 28, 18, 41, 49, 270, DateTimeKind.Local).AddTicks(1179), "32c222ae-b9e6-4849-b4fd-730659db93d7", new DateTime(2026, 4, 28, 18, 41, 49, 270, DateTimeKind.Local).AddTicks(1180), new byte[] { 161, 180, 125, 211, 44, 93, 69, 140, 249, 151, 121, 242, 30, 216, 79, 194, 106, 202, 21, 254, 242, 18, 175, 59, 113, 123, 154, 251, 122, 223, 96, 133, 191, 249, 124, 1, 212, 160, 194, 54, 239, 1, 136, 189, 207, 112, 48, 221, 79, 89, 28, 230, 130, 127, 26, 60, 32, 75, 216, 19, 129, 196, 43, 99 }, new byte[] { 153, 168, 234, 20, 230, 22, 244, 140, 253, 211, 94, 82, 123, 126, 248, 11, 178, 55, 3, 251, 237, 171, 240, 130, 30, 146, 235, 211, 182, 56, 115, 141, 172, 113, 19, 196, 15, 51, 133, 239, 182, 33, 239, 157, 47, 171, 216, 97, 187, 105, 95, 118, 163, 74, 149, 43, 247, 162, 91, 176, 86, 200, 252, 31, 112, 248, 79, 252, 220, 177, 126, 122, 212, 69, 132, 41, 208, 58, 246, 158, 18, 217, 222, 226, 239, 83, 53, 10, 80, 49, 147, 138, 40, 158, 144, 155, 69, 239, 180, 221, 156, 9, 227, 16, 148, 75, 50, 127, 42, 233, 155, 189, 115, 47, 44, 97, 180, 224, 89, 77, 121, 240, 35, 208, 206, 168, 184, 221 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 4, 28, 18, 41, 49, 270, DateTimeKind.Local).AddTicks(1277), "6227d1fc-1e52-4315-9112-a94998e64a1e", new DateTime(2026, 4, 28, 18, 41, 49, 270, DateTimeKind.Local).AddTicks(1278), new byte[] { 160, 62, 160, 11, 26, 54, 10, 81, 24, 72, 221, 3, 194, 18, 175, 173, 186, 217, 226, 235, 47, 119, 33, 247, 45, 249, 251, 56, 137, 101, 1, 32, 32, 122, 225, 86, 228, 56, 17, 85, 122, 143, 246, 27, 103, 234, 236, 58, 179, 199, 4, 197, 69, 113, 41, 220, 251, 146, 30, 255, 146, 221, 115, 28 }, new byte[] { 106, 98, 240, 149, 8, 251, 165, 132, 216, 98, 42, 43, 150, 158, 99, 243, 146, 144, 157, 74, 118, 243, 197, 154, 45, 59, 78, 44, 61, 158, 212, 96, 40, 86, 182, 100, 231, 161, 43, 93, 191, 4, 11, 150, 59, 180, 211, 11, 98, 8, 161, 150, 28, 38, 83, 215, 44, 96, 211, 7, 165, 36, 225, 202, 108, 61, 73, 155, 240, 5, 213, 77, 185, 56, 130, 62, 132, 83, 202, 243, 87, 230, 52, 201, 218, 88, 153, 26, 253, 225, 70, 116, 122, 24, 248, 253, 203, 161, 237, 191, 183, 105, 246, 135, 77, 81, 147, 208, 26, 31, 102, 77, 156, 84, 83, 90, 217, 140, 111, 164, 169, 49, 31, 146, 103, 107, 149, 126 } });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "DebitRequests");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 1L,
                columns: new[] { "AddetAt", "LicenceFinishDate", "LicenceStartDate" },
                values: new object[] { new DateTime(2026, 4, 24, 14, 40, 19, 552, DateTimeKind.Local).AddTicks(3782), new DateTime(2026, 6, 23, 14, 40, 19, 552, DateTimeKind.Local).AddTicks(3761), new DateTime(2026, 4, 24, 14, 40, 19, 552, DateTimeKind.Local).AddTicks(3744) });

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 24, 11, 40, 19, 552, DateTimeKind.Utc).AddTicks(3708));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 24, 11, 40, 19, 552, DateTimeKind.Utc).AddTicks(3709));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 24, 11, 40, 19, 552, DateTimeKind.Utc).AddTicks(3710));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddetAt",
                value: new DateTime(2026, 4, 24, 14, 40, 19, 552, DateTimeKind.Local).AddTicks(4349));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddetAt",
                value: new DateTime(2026, 4, 24, 14, 40, 19, 552, DateTimeKind.Local).AddTicks(4359));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 24, 11, 40, 19, 552, DateTimeKind.Utc).AddTicks(3565));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 24, 11, 40, 19, 552, DateTimeKind.Utc).AddTicks(3568));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 24, 11, 40, 19, 552, DateTimeKind.Utc).AddTicks(3569));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 4, 24, 14, 40, 19, 552, DateTimeKind.Local).AddTicks(4108), "68cb37aa-642a-400e-b7ca-ef66ace0a770", new DateTime(2026, 4, 24, 14, 40, 19, 552, DateTimeKind.Local).AddTicks(4109), new byte[] { 122, 103, 162, 9, 31, 21, 0, 25, 165, 43, 142, 16, 204, 12, 254, 202, 5, 4, 77, 212, 84, 103, 232, 178, 122, 7, 51, 58, 51, 152, 128, 81, 214, 106, 34, 243, 39, 139, 24, 177, 160, 3, 54, 117, 221, 231, 35, 95, 120, 98, 145, 199, 194, 23, 229, 249, 65, 25, 122, 255, 181, 128, 48, 96 }, new byte[] { 218, 197, 101, 120, 182, 228, 201, 110, 33, 99, 253, 105, 9, 92, 101, 166, 16, 2, 121, 59, 171, 106, 8, 67, 213, 132, 219, 181, 132, 181, 125, 149, 92, 234, 18, 106, 129, 154, 96, 18, 140, 128, 244, 13, 224, 24, 216, 135, 26, 238, 57, 229, 224, 178, 118, 219, 73, 29, 172, 233, 91, 251, 226, 107, 109, 11, 9, 190, 162, 234, 181, 49, 255, 28, 64, 69, 238, 246, 31, 104, 226, 98, 209, 55, 47, 161, 70, 212, 43, 75, 156, 157, 129, 171, 214, 136, 118, 52, 16, 143, 146, 135, 136, 16, 168, 12, 246, 207, 32, 200, 21, 199, 30, 219, 62, 242, 233, 247, 190, 35, 33, 84, 7, 67, 206, 122, 152, 18 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 4, 24, 14, 40, 19, 552, DateTimeKind.Local).AddTicks(4190), "0a54ec20-45b3-4119-a61b-55a5dfcf8339", new DateTime(2026, 4, 24, 14, 40, 19, 552, DateTimeKind.Local).AddTicks(4192), new byte[] { 161, 248, 75, 232, 68, 93, 224, 185, 147, 63, 37, 40, 160, 225, 200, 110, 101, 200, 121, 13, 219, 193, 210, 59, 133, 220, 53, 0, 14, 24, 85, 122, 165, 135, 104, 151, 55, 115, 194, 198, 11, 194, 153, 62, 217, 185, 58, 116, 249, 23, 72, 105, 131, 14, 154, 189, 62, 118, 235, 39, 21, 160, 143, 3 }, new byte[] { 151, 251, 229, 74, 237, 177, 207, 59, 81, 92, 65, 225, 9, 108, 226, 183, 29, 115, 102, 218, 87, 154, 21, 176, 0, 152, 244, 219, 33, 77, 46, 177, 87, 234, 148, 14, 213, 184, 211, 228, 217, 83, 3, 186, 194, 88, 211, 215, 5, 148, 100, 107, 123, 233, 211, 189, 238, 120, 170, 152, 43, 165, 106, 189, 160, 230, 141, 158, 167, 20, 21, 38, 29, 154, 43, 37, 66, 190, 2, 22, 82, 195, 84, 195, 189, 232, 178, 44, 32, 76, 12, 42, 15, 205, 151, 108, 150, 16, 198, 41, 141, 210, 207, 198, 147, 31, 219, 247, 155, 166, 32, 253, 206, 194, 136, 214, 188, 189, 98, 128, 178, 186, 11, 77, 21, 46, 0, 94 } });
        }
    }
}
