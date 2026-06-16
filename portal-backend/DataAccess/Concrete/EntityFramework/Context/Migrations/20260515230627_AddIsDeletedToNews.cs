using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDeletedToNews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "NewsItems",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 1L,
                columns: new[] { "AddetAt", "LicenceFinishDate", "LicenceStartDate" },
                values: new object[] { new DateTime(2026, 5, 16, 2, 6, 26, 288, DateTimeKind.Local).AddTicks(9130), new DateTime(2026, 7, 15, 2, 6, 26, 288, DateTimeKind.Local).AddTicks(9105), new DateTime(2026, 5, 16, 2, 6, 26, 288, DateTimeKind.Local).AddTicks(9088) });

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 23, 6, 26, 288, DateTimeKind.Utc).AddTicks(9059));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 23, 6, 26, 288, DateTimeKind.Utc).AddTicks(9061));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 23, 6, 26, 288, DateTimeKind.Utc).AddTicks(9061));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 23, 6, 26, 288, DateTimeKind.Utc).AddTicks(9062));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 16, 2, 6, 26, 288, DateTimeKind.Local).AddTicks(9785));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 16, 2, 6, 26, 288, DateTimeKind.Local).AddTicks(9799));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 23, 6, 26, 288, DateTimeKind.Utc).AddTicks(8904));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 23, 6, 26, 288, DateTimeKind.Utc).AddTicks(8907));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 23, 6, 26, 288, DateTimeKind.Utc).AddTicks(8908));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 23, 6, 26, 288, DateTimeKind.Utc).AddTicks(8909));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 16, 2, 6, 26, 288, DateTimeKind.Local).AddTicks(9400), "b50ac8e1-d7f0-431c-9728-b765c317bbdb", new DateTime(2026, 5, 16, 2, 6, 26, 288, DateTimeKind.Local).AddTicks(9402), new byte[] { 14, 97, 240, 71, 191, 253, 202, 61, 193, 246, 216, 163, 148, 38, 82, 244, 80, 127, 82, 61, 252, 77, 216, 44, 20, 216, 135, 155, 118, 71, 72, 14, 45, 16, 220, 43, 37, 212, 71, 148, 31, 210, 210, 87, 109, 179, 6, 36, 69, 78, 138, 124, 188, 115, 150, 173, 240, 88, 151, 225, 214, 140, 9, 205 }, new byte[] { 236, 96, 217, 195, 49, 59, 103, 26, 73, 165, 166, 147, 159, 110, 248, 197, 15, 219, 132, 147, 205, 137, 148, 64, 145, 84, 168, 49, 247, 216, 113, 195, 205, 201, 33, 254, 104, 82, 78, 253, 148, 147, 242, 46, 44, 104, 12, 208, 245, 73, 83, 159, 161, 7, 246, 119, 138, 92, 23, 155, 95, 117, 16, 219, 43, 137, 153, 122, 60, 19, 238, 59, 109, 253, 240, 39, 37, 36, 131, 235, 89, 230, 160, 1, 2, 106, 233, 201, 17, 3, 18, 213, 27, 33, 206, 127, 89, 41, 113, 57, 48, 39, 2, 66, 58, 26, 220, 137, 206, 73, 49, 168, 116, 215, 107, 51, 5, 147, 13, 175, 157, 160, 75, 96, 175, 213, 59, 139 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 16, 2, 6, 26, 288, DateTimeKind.Local).AddTicks(9504), "a28e90ac-6c76-4852-9e39-84f42626ef70", new DateTime(2026, 5, 16, 2, 6, 26, 288, DateTimeKind.Local).AddTicks(9506), new byte[] { 196, 231, 3, 227, 242, 56, 61, 12, 130, 116, 222, 133, 48, 5, 33, 192, 40, 27, 80, 227, 115, 29, 76, 16, 208, 232, 43, 236, 132, 5, 90, 220, 163, 253, 217, 239, 250, 92, 112, 71, 183, 41, 247, 13, 49, 236, 137, 134, 16, 227, 36, 56, 246, 129, 14, 15, 239, 6, 213, 101, 109, 204, 68, 108 }, new byte[] { 127, 182, 26, 87, 172, 93, 161, 166, 77, 221, 22, 218, 116, 15, 176, 232, 210, 143, 236, 55, 64, 25, 249, 141, 245, 187, 142, 25, 59, 64, 125, 255, 72, 149, 96, 205, 179, 13, 198, 153, 0, 223, 33, 180, 58, 191, 139, 131, 179, 179, 109, 24, 202, 90, 76, 157, 65, 232, 39, 177, 170, 59, 88, 51, 65, 2, 127, 63, 168, 243, 40, 243, 9, 104, 194, 55, 74, 255, 240, 45, 149, 232, 133, 186, 41, 22, 109, 98, 230, 175, 176, 46, 252, 69, 90, 178, 3, 65, 222, 215, 92, 97, 141, 251, 20, 87, 171, 230, 43, 54, 37, 91, 121, 156, 24, 185, 55, 17, 185, 244, 238, 78, 43, 82, 242, 117, 19, 120 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3L,
                columns: new[] { "PasswordHash", "PasswordSalt" },
                values: new object[] { new byte[] { 67, 99, 62, 0, 252, 210, 213, 225, 133, 101, 160, 218, 219, 217, 181, 215, 224, 239, 163, 141, 100, 174, 48, 157, 122, 156, 104, 102, 135, 117, 219, 250, 125, 82, 222, 238, 23, 140, 159, 119, 36, 134, 175, 47, 99, 148, 228, 66, 235, 54, 28, 196, 124, 184, 20, 148, 228, 246, 111, 117, 8, 160, 6, 27 }, new byte[] { 141, 10, 31, 80, 49, 199, 183, 204, 72, 51, 137, 168, 249, 219, 161, 169, 12, 135, 33, 28, 65, 62, 11, 132, 5, 136, 159, 23, 204, 21, 251, 183, 19, 145, 235, 224, 67, 165, 207, 248, 215, 216, 187, 217, 42, 67, 246, 159, 146, 174, 31, 100, 40, 53, 100, 51, 207, 108, 204, 215, 0, 154, 107, 68, 61, 210, 31, 79, 214, 8, 41, 57, 130, 31, 210, 73, 100, 14, 98, 5, 5, 205, 117, 237, 103, 137, 12, 12, 86, 237, 192, 125, 189, 99, 80, 152, 218, 74, 48, 132, 54, 225, 148, 123, 240, 135, 226, 111, 13, 158, 111, 83, 26, 75, 232, 131, 16, 6, 2, 48, 218, 170, 109, 118, 142, 207, 129, 28 } });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "NewsItems");

            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 1L,
                columns: new[] { "AddetAt", "LicenceFinishDate", "LicenceStartDate" },
                values: new object[] { new DateTime(2026, 5, 15, 23, 59, 14, 609, DateTimeKind.Local).AddTicks(3336), new DateTime(2026, 7, 14, 23, 59, 14, 609, DateTimeKind.Local).AddTicks(3315), new DateTime(2026, 5, 15, 23, 59, 14, 609, DateTimeKind.Local).AddTicks(3303) });

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 59, 14, 609, DateTimeKind.Utc).AddTicks(3278));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 59, 14, 609, DateTimeKind.Utc).AddTicks(3280));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 59, 14, 609, DateTimeKind.Utc).AddTicks(3280));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 59, 14, 609, DateTimeKind.Utc).AddTicks(3281));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 15, 23, 59, 14, 609, DateTimeKind.Local).AddTicks(3915));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 15, 23, 59, 14, 609, DateTimeKind.Local).AddTicks(3928));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 59, 14, 609, DateTimeKind.Utc).AddTicks(3119));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 59, 14, 609, DateTimeKind.Utc).AddTicks(3121));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 59, 14, 609, DateTimeKind.Utc).AddTicks(3122));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 59, 14, 609, DateTimeKind.Utc).AddTicks(3123));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 15, 23, 59, 14, 609, DateTimeKind.Local).AddTicks(3580), "1089dfe8-1692-4271-8855-5a6602f0afb4", new DateTime(2026, 5, 15, 23, 59, 14, 609, DateTimeKind.Local).AddTicks(3582), new byte[] { 206, 152, 114, 195, 43, 188, 12, 189, 249, 52, 2, 34, 192, 208, 66, 244, 237, 239, 54, 161, 13, 164, 178, 223, 137, 83, 89, 96, 178, 179, 77, 150, 33, 124, 0, 100, 185, 54, 209, 245, 69, 3, 153, 101, 24, 119, 23, 46, 212, 205, 60, 237, 14, 127, 73, 106, 225, 198, 108, 66, 3, 255, 39, 124 }, new byte[] { 15, 40, 68, 108, 102, 229, 42, 213, 180, 70, 119, 24, 109, 77, 176, 63, 25, 85, 212, 169, 8, 169, 100, 104, 77, 180, 26, 21, 163, 74, 77, 89, 117, 89, 124, 85, 98, 52, 32, 215, 97, 203, 120, 69, 193, 170, 214, 182, 252, 104, 51, 193, 95, 2, 232, 147, 228, 145, 64, 215, 4, 118, 86, 142, 90, 85, 171, 186, 199, 185, 247, 207, 204, 19, 199, 132, 7, 232, 186, 161, 89, 196, 167, 35, 48, 84, 91, 86, 36, 226, 216, 223, 196, 228, 86, 241, 96, 0, 141, 217, 192, 250, 152, 122, 184, 55, 219, 4, 238, 108, 220, 17, 145, 183, 31, 44, 23, 84, 125, 231, 223, 131, 95, 23, 201, 124, 99, 0 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 15, 23, 59, 14, 609, DateTimeKind.Local).AddTicks(3673), "203df4df-c788-48e4-9c8e-3b58df06fcd7", new DateTime(2026, 5, 15, 23, 59, 14, 609, DateTimeKind.Local).AddTicks(3675), new byte[] { 136, 251, 232, 158, 22, 49, 43, 181, 111, 245, 95, 139, 186, 141, 86, 150, 203, 18, 137, 23, 157, 13, 166, 153, 143, 20, 134, 173, 3, 164, 241, 110, 29, 167, 91, 208, 190, 190, 224, 87, 94, 143, 55, 141, 155, 208, 36, 123, 231, 6, 96, 106, 13, 148, 134, 222, 219, 132, 179, 231, 156, 25, 72, 59 }, new byte[] { 162, 127, 114, 64, 220, 42, 190, 243, 118, 97, 212, 98, 103, 212, 36, 68, 13, 114, 119, 103, 14, 228, 178, 186, 164, 195, 141, 28, 245, 78, 138, 221, 121, 61, 144, 133, 81, 159, 230, 239, 204, 110, 48, 49, 105, 144, 50, 25, 144, 132, 209, 96, 82, 208, 89, 168, 252, 82, 161, 126, 74, 110, 80, 138, 111, 240, 155, 170, 85, 224, 3, 20, 239, 87, 125, 80, 221, 4, 147, 129, 39, 13, 131, 18, 165, 19, 137, 167, 120, 166, 129, 177, 203, 133, 195, 224, 77, 96, 56, 184, 35, 251, 160, 75, 10, 251, 224, 137, 140, 224, 67, 129, 62, 35, 177, 178, 42, 145, 132, 2, 117, 5, 239, 186, 115, 239, 178, 181 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3L,
                columns: new[] { "PasswordHash", "PasswordSalt" },
                values: new object[] { new byte[] { 134, 144, 157, 118, 51, 195, 123, 195, 62, 104, 113, 135, 122, 250, 219, 172, 161, 121, 108, 45, 195, 10, 206, 255, 17, 131, 210, 26, 111, 215, 135, 60, 7, 167, 139, 232, 211, 39, 187, 70, 77, 57, 141, 114, 247, 13, 208, 200, 59, 181, 179, 230, 205, 25, 163, 171, 163, 232, 231, 106, 199, 248, 81, 179 }, new byte[] { 106, 146, 151, 172, 117, 161, 26, 58, 54, 186, 9, 80, 207, 147, 172, 22, 168, 198, 184, 113, 162, 72, 27, 51, 70, 226, 163, 221, 99, 140, 243, 2, 105, 61, 12, 67, 215, 246, 149, 35, 150, 96, 66, 89, 167, 80, 17, 24, 186, 227, 201, 4, 123, 207, 142, 240, 136, 71, 6, 5, 130, 218, 86, 70, 227, 181, 12, 212, 92, 26, 170, 238, 238, 160, 154, 226, 160, 172, 232, 228, 214, 246, 131, 181, 132, 106, 161, 83, 96, 36, 233, 185, 63, 68, 59, 42, 240, 35, 86, 162, 181, 21, 172, 61, 51, 220, 107, 6, 19, 136, 146, 59, 248, 202, 155, 130, 13, 177, 152, 148, 243, 173, 190, 196, 86, 236, 144, 161 } });
        }
    }
}
