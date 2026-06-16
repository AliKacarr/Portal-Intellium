using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    /// <inheritdoc />
    public partial class AddRequestedProductFieldsToDebitRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RequestedBrand",
                table: "DebitRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestedCategory",
                table: "DebitRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestedModel",
                table: "DebitRequests",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 1L,
                columns: new[] { "AddetAt", "LicenceFinishDate", "LicenceStartDate" },
                values: new object[] { new DateTime(2026, 4, 28, 19, 9, 28, 218, DateTimeKind.Local).AddTicks(1314), new DateTime(2026, 6, 27, 19, 9, 28, 218, DateTimeKind.Local).AddTicks(1295), new DateTime(2026, 4, 28, 19, 9, 28, 218, DateTimeKind.Local).AddTicks(1280) });

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 28, 16, 9, 28, 218, DateTimeKind.Utc).AddTicks(1249));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 28, 16, 9, 28, 218, DateTimeKind.Utc).AddTicks(1251));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 28, 16, 9, 28, 218, DateTimeKind.Utc).AddTicks(1252));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddetAt",
                value: new DateTime(2026, 4, 28, 19, 9, 28, 218, DateTimeKind.Local).AddTicks(1853));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddetAt",
                value: new DateTime(2026, 4, 28, 19, 9, 28, 218, DateTimeKind.Local).AddTicks(1860));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 28, 16, 9, 28, 218, DateTimeKind.Utc).AddTicks(1094));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 28, 16, 9, 28, 218, DateTimeKind.Utc).AddTicks(1097));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 28, 16, 9, 28, 218, DateTimeKind.Utc).AddTicks(1099));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 4, 28, 19, 9, 28, 218, DateTimeKind.Local).AddTicks(1586), "eb304890-021f-441f-818e-1759351de3fc", new DateTime(2026, 4, 28, 19, 9, 28, 218, DateTimeKind.Local).AddTicks(1587), new byte[] { 143, 209, 136, 77, 112, 143, 102, 52, 50, 62, 156, 237, 116, 128, 8, 24, 110, 116, 89, 255, 126, 219, 24, 198, 53, 79, 105, 206, 226, 221, 113, 8, 148, 134, 158, 99, 105, 108, 211, 180, 231, 213, 149, 108, 176, 138, 71, 246, 68, 29, 125, 197, 26, 163, 69, 41, 45, 227, 37, 31, 197, 215, 194, 6 }, new byte[] { 184, 164, 69, 127, 164, 116, 25, 196, 131, 63, 193, 228, 144, 71, 146, 100, 40, 157, 50, 18, 37, 158, 199, 184, 167, 141, 32, 250, 44, 39, 223, 9, 217, 5, 51, 107, 169, 52, 101, 109, 54, 242, 121, 46, 195, 46, 39, 26, 126, 184, 154, 77, 235, 145, 28, 168, 150, 55, 30, 23, 56, 197, 85, 222, 111, 209, 195, 4, 102, 155, 105, 126, 146, 6, 131, 206, 140, 163, 213, 110, 192, 186, 201, 170, 183, 12, 194, 64, 170, 95, 243, 215, 214, 220, 56, 118, 94, 186, 136, 57, 50, 25, 130, 216, 206, 70, 120, 198, 169, 228, 4, 99, 105, 89, 193, 233, 230, 173, 52, 200, 53, 168, 140, 129, 44, 25, 118, 54 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 4, 28, 19, 9, 28, 218, DateTimeKind.Local).AddTicks(1664), "e62272ea-c4c3-4114-ab82-ce375f65bbfd", new DateTime(2026, 4, 28, 19, 9, 28, 218, DateTimeKind.Local).AddTicks(1666), new byte[] { 251, 80, 229, 16, 43, 54, 33, 166, 5, 118, 201, 3, 151, 169, 112, 165, 215, 32, 74, 248, 228, 90, 194, 18, 227, 37, 47, 251, 205, 17, 92, 232, 141, 106, 95, 252, 66, 169, 99, 32, 9, 200, 48, 36, 117, 204, 153, 78, 210, 191, 19, 169, 50, 127, 245, 63, 215, 80, 114, 61, 91, 52, 139, 20 }, new byte[] { 110, 134, 55, 141, 243, 144, 178, 107, 12, 244, 140, 29, 101, 62, 25, 31, 232, 188, 80, 71, 31, 70, 170, 45, 248, 242, 138, 39, 22, 30, 82, 156, 110, 206, 72, 147, 205, 38, 16, 145, 65, 135, 231, 247, 204, 137, 242, 238, 241, 221, 249, 27, 14, 38, 57, 214, 65, 90, 93, 138, 176, 22, 97, 39, 102, 107, 128, 208, 16, 220, 43, 232, 10, 146, 116, 71, 141, 103, 39, 231, 164, 38, 94, 2, 103, 4, 172, 9, 76, 105, 104, 81, 132, 161, 35, 28, 41, 214, 34, 136, 56, 69, 1, 186, 234, 199, 210, 75, 177, 38, 158, 150, 155, 139, 246, 188, 24, 228, 167, 7, 247, 80, 193, 119, 115, 198, 38, 193 } });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequestedBrand",
                table: "DebitRequests");

            migrationBuilder.DropColumn(
                name: "RequestedCategory",
                table: "DebitRequests");

            migrationBuilder.DropColumn(
                name: "RequestedModel",
                table: "DebitRequests");

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
    }
}
