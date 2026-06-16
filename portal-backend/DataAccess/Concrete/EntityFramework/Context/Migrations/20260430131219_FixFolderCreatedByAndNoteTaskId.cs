using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    /// <inheritdoc />
    public partial class FixFolderCreatedByAndNoteTaskId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "Notes");

            migrationBuilder.Sql(
                "ALTER TABLE \"Notes\" ALTER COLUMN \"CreatedBy\" TYPE bigint USING 0");

            migrationBuilder.AddColumn<int>(
                name: "TaskId",
                table: "Notes",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(
                "ALTER TABLE \"Folders\" ALTER COLUMN \"CreatedBy\" TYPE bigint USING 0");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 1L,
                columns: new[] { "AddetAt", "LicenceFinishDate", "LicenceStartDate" },
                values: new object[] { new DateTime(2026, 4, 30, 16, 12, 18, 498, DateTimeKind.Local).AddTicks(6136), new DateTime(2026, 6, 29, 16, 12, 18, 498, DateTimeKind.Local).AddTicks(6111), new DateTime(2026, 4, 30, 16, 12, 18, 498, DateTimeKind.Local).AddTicks(6095) });

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 30, 13, 12, 18, 498, DateTimeKind.Utc).AddTicks(6063));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 30, 13, 12, 18, 498, DateTimeKind.Utc).AddTicks(6065));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 30, 13, 12, 18, 498, DateTimeKind.Utc).AddTicks(6065));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddetAt",
                value: new DateTime(2026, 4, 30, 16, 12, 18, 498, DateTimeKind.Local).AddTicks(6801));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddetAt",
                value: new DateTime(2026, 4, 30, 16, 12, 18, 498, DateTimeKind.Local).AddTicks(6815));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 30, 13, 12, 18, 498, DateTimeKind.Utc).AddTicks(5851));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 30, 13, 12, 18, 498, DateTimeKind.Utc).AddTicks(5856));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 4, 30, 13, 12, 18, 498, DateTimeKind.Utc).AddTicks(5857));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 4, 30, 16, 12, 18, 498, DateTimeKind.Local).AddTicks(6490), "6aada284-263e-4d1e-bb2e-e229e635b435", new DateTime(2026, 4, 30, 16, 12, 18, 498, DateTimeKind.Local).AddTicks(6493), new byte[] { 4, 172, 60, 162, 183, 77, 188, 116, 138, 206, 36, 123, 51, 185, 50, 62, 37, 73, 187, 87, 60, 239, 233, 147, 60, 71, 84, 213, 73, 239, 124, 120, 120, 78, 21, 88, 127, 14, 12, 77, 215, 123, 111, 214, 194, 0, 152, 62, 125, 29, 196, 80, 148, 49, 112, 52, 132, 145, 48, 74, 47, 112, 189, 76 }, new byte[] { 157, 125, 211, 76, 125, 125, 106, 38, 252, 79, 179, 247, 203, 140, 189, 91, 42, 245, 74, 102, 22, 96, 201, 9, 21, 242, 201, 108, 72, 46, 203, 145, 42, 140, 16, 130, 172, 219, 126, 70, 151, 141, 243, 27, 242, 44, 217, 6, 82, 9, 181, 108, 153, 233, 184, 51, 236, 242, 150, 58, 46, 251, 73, 102, 230, 109, 129, 95, 53, 37, 59, 105, 74, 97, 240, 188, 26, 44, 219, 168, 112, 202, 233, 59, 230, 64, 218, 155, 41, 69, 60, 58, 191, 125, 180, 144, 6, 209, 167, 109, 86, 62, 91, 246, 248, 84, 184, 200, 166, 203, 63, 142, 168, 153, 213, 233, 252, 137, 85, 234, 73, 93, 204, 120, 239, 50, 165, 168 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 4, 30, 16, 12, 18, 498, DateTimeKind.Local).AddTicks(6615), "ae561ae0-f161-4312-9997-8ebfb5086783", new DateTime(2026, 4, 30, 16, 12, 18, 498, DateTimeKind.Local).AddTicks(6617), new byte[] { 155, 243, 163, 207, 223, 29, 252, 100, 69, 182, 24, 45, 209, 197, 155, 4, 117, 104, 253, 146, 212, 30, 187, 143, 49, 106, 145, 42, 164, 171, 42, 253, 48, 218, 152, 141, 88, 18, 229, 171, 120, 118, 126, 82, 225, 4, 214, 222, 203, 222, 114, 232, 105, 191, 146, 151, 41, 155, 116, 149, 59, 205, 41, 93 }, new byte[] { 195, 17, 38, 36, 53, 149, 239, 86, 48, 213, 174, 91, 192, 212, 226, 18, 77, 113, 89, 99, 18, 41, 14, 168, 109, 141, 104, 41, 175, 173, 132, 74, 147, 19, 71, 195, 167, 197, 152, 193, 13, 230, 78, 130, 84, 129, 43, 85, 123, 103, 223, 12, 232, 34, 138, 2, 61, 137, 250, 69, 93, 201, 105, 39, 146, 24, 87, 137, 60, 212, 81, 53, 90, 229, 57, 147, 97, 227, 85, 227, 102, 69, 225, 252, 194, 57, 172, 90, 47, 231, 95, 143, 30, 50, 85, 152, 239, 56, 170, 148, 23, 60, 88, 126, 161, 253, 67, 100, 9, 228, 40, 231, 44, 224, 236, 157, 47, 14, 55, 201, 0, 199, 215, 108, 127, 155, 24, 153 } });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TaskId",
                table: "Notes");

            migrationBuilder.AlterColumn<Guid>(
                name: "CreatedBy",
                table: "Notes",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint");

            migrationBuilder.AddColumn<Guid>(
                name: "ProjectId",
                table: "Notes",
                type: "uuid",
                nullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "CreatedBy",
                table: "Folders",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(long),
                oldType: "bigint");

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
    }
}
