using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    /// <summary>
    /// İkinci admin seed verisi. Portal tabloları 20260506120000_AddPortalNewsAnnouncementPollModules ile oluşturulur.
    /// </summary>
    public partial class SeedSecondAdmin : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 1L,
                columns: new[] { "AddetAt", "LicenceFinishDate", "LicenceStartDate" },
                values: new object[] { new DateTime(2026, 5, 7, 21, 53, 55, 982, DateTimeKind.Local).AddTicks(8471), new DateTime(2026, 7, 6, 21, 53, 55, 982, DateTimeKind.Local).AddTicks(8441), new DateTime(2026, 5, 7, 21, 53, 55, 982, DateTimeKind.Local).AddTicks(8413) });

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 7, 18, 53, 55, 982, DateTimeKind.Utc).AddTicks(7662));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 7, 18, 53, 55, 982, DateTimeKind.Utc).AddTicks(8360));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 7, 18, 53, 55, 982, DateTimeKind.Utc).AddTicks(8361));

            migrationBuilder.InsertData(
                table: "OperationClaims",
                columns: new[] { "Id", "AddedAt", "Name" },
                values: new object[] { 4L, new DateTime(2026, 5, 7, 18, 53, 55, 982, DateTimeKind.Utc).AddTicks(8361), "worker-outsource" });

            migrationBuilder.InsertData(
                table: "RolesForUsers",
                columns: new[] { "Id", "RoleId", "UserId" },
                values: new object[] { 3L, 1L, 3L });

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 7, 21, 53, 55, 982, DateTimeKind.Local).AddTicks(9378));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 7, 21, 53, 55, 982, DateTimeKind.Local).AddTicks(9390));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 7, 18, 53, 55, 982, DateTimeKind.Utc).AddTicks(7349));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 7, 18, 53, 55, 982, DateTimeKind.Utc).AddTicks(7354));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 7, 18, 53, 55, 982, DateTimeKind.Utc).AddTicks(7355));

            migrationBuilder.InsertData(
                table: "UserRoles",
                columns: new[] { "Id", "AddedAt", "Description", "RoleName" },
                values: new object[] { 4L, new DateTime(2026, 5, 7, 18, 53, 55, 982, DateTimeKind.Utc).AddTicks(7355), "worker-outsource", "worker-outsource" });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 7, 21, 53, 55, 982, DateTimeKind.Local).AddTicks(8940), "c497b582-607a-43b4-805d-3f3cacda8915", new DateTime(2026, 5, 7, 21, 53, 55, 982, DateTimeKind.Local).AddTicks(8942), new byte[] { 206, 75, 148, 205, 167, 53, 32, 37, 44, 238, 62, 135, 219, 131, 167, 201, 234, 151, 178, 163, 52, 46, 116, 49, 185, 62, 164, 13, 174, 134, 80, 227, 138, 218, 121, 2, 242, 46, 86, 7, 120, 152, 162, 248, 174, 1, 12, 40, 97, 144, 183, 141, 36, 136, 217, 215, 143, 123, 165, 110, 127, 236, 39, 253 }, new byte[] { 224, 42, 211, 172, 146, 25, 164, 128, 72, 189, 80, 3, 127, 42, 4, 124, 241, 236, 11, 163, 250, 111, 176, 172, 228, 236, 188, 132, 75, 65, 79, 229, 194, 128, 131, 38, 19, 102, 189, 15, 40, 197, 68, 151, 165, 39, 144, 222, 132, 223, 171, 109, 192, 158, 15, 164, 244, 216, 25, 72, 61, 39, 8, 127, 191, 106, 77, 182, 243, 55, 146, 247, 60, 163, 98, 21, 220, 223, 39, 32, 195, 41, 163, 103, 196, 44, 203, 167, 25, 108, 235, 187, 238, 251, 192, 201, 233, 36, 109, 95, 56, 20, 41, 253, 243, 215, 216, 65, 134, 192, 109, 47, 145, 233, 126, 93, 72, 75, 205, 120, 165, 108, 246, 197, 215, 96, 134, 200 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 7, 21, 53, 55, 982, DateTimeKind.Local).AddTicks(9055), "a0348f06-243b-4af2-8e42-1ead97922183", new DateTime(2026, 5, 7, 21, 53, 55, 982, DateTimeKind.Local).AddTicks(9056), new byte[] { 218, 66, 45, 189, 13, 70, 219, 194, 101, 79, 87, 34, 224, 114, 167, 192, 244, 171, 173, 200, 162, 117, 188, 225, 171, 35, 97, 3, 251, 141, 219, 174, 20, 20, 202, 8, 49, 189, 113, 141, 103, 245, 233, 127, 120, 88, 9, 74, 21, 104, 86, 166, 63, 12, 217, 119, 252, 72, 152, 238, 1, 78, 14, 224 }, new byte[] { 93, 236, 58, 247, 56, 28, 158, 43, 144, 28, 226, 64, 114, 102, 96, 215, 73, 234, 247, 1, 166, 132, 163, 197, 35, 10, 219, 104, 60, 129, 188, 137, 205, 224, 205, 212, 49, 140, 87, 230, 87, 93, 84, 74, 242, 48, 133, 199, 181, 91, 241, 108, 215, 44, 84, 65, 206, 124, 65, 76, 47, 67, 154, 182, 177, 95, 214, 237, 130, 216, 108, 144, 165, 239, 26, 255, 88, 45, 5, 80, 94, 29, 188, 185, 234, 197, 114, 248, 212, 129, 167, 220, 5, 145, 68, 198, 204, 38, 177, 75, 128, 244, 206, 253, 103, 163, 223, 135, 150, 116, 203, 253, 205, 116, 209, 142, 20, 175, 143, 197, 151, 21, 164, 17, 104, 56, 44, 184 } });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AddetAt", "ConfirmValue", "Email", "ForgotPasswordRequestDate", "ForgotPasswordValue", "ImageUrl", "IsActive", "IsConfirm", "IsForgotPasswordComplete", "Language", "MailConfirm", "MailConfirmDate", "Name", "PasswordHash", "PasswordSalt" },
                values: new object[] { 3L, new DateTime(2026, 5, 7, 0, 0, 0, 0, DateTimeKind.Utc), "seed-admin2", "admin2@intellium.com.tr", null, null, null, true, true, null, "Türkçe", true, new DateTime(2026, 5, 7, 0, 0, 0, 0, DateTimeKind.Utc), "Seed Admin 2", new byte[] { 160, 12, 247, 175, 240, 214, 167, 14, 243, 242, 218, 123, 3, 158, 47, 149, 248, 56, 161, 250, 75, 19, 138, 178, 84, 11, 128, 184, 199, 49, 120, 25, 79, 31, 74, 42, 128, 111, 225, 253, 47, 162, 251, 95, 222, 97, 193, 228, 190, 69, 201, 96, 196, 255, 70, 27, 129, 96, 116, 82, 34, 163, 32, 197 }, new byte[] { 15, 104, 36, 74, 145, 148, 138, 244, 72, 71, 134, 156, 61, 75, 142, 176, 45, 81, 44, 243, 231, 187, 140, 193, 229, 140, 188, 142, 16, 84, 112, 224, 82, 156, 52, 88, 66, 75, 249, 178, 240, 56, 143, 223, 86, 54, 183, 89, 137, 225, 106, 24, 44, 123, 45, 135, 130, 232, 38, 228, 109, 121, 204, 88, 187, 86, 165, 60, 108, 117, 251, 128, 204, 7, 194, 79, 92, 64, 246, 243, 203, 13, 142, 175, 240, 19, 255, 80, 119, 217, 152, 92, 9, 0, 127, 63, 121, 51, 189, 218, 39, 53, 65, 82, 242, 241, 29, 30, 147, 74, 248, 161, 107, 190, 81, 92, 46, 24, 56, 22, 8, 80, 194, 255, 76, 77, 72, 57 } });

            migrationBuilder.InsertData(
                table: "UserCustomers",
                columns: new[] { "Id", "AddetAt", "CustomerId", "IsActive", "UserId" },
                values: new object[] { 3L, new DateTime(2026, 5, 7, 0, 0, 0, 0, DateTimeKind.Utc), 1L, true, 3L });

            migrationBuilder.InsertData(
                table: "UserOperationClaims",
                columns: new[] { "Id", "OperationClaimId", "UserId" },
                values: new object[] { 3L, 1L, 3L });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 4L);

            migrationBuilder.DeleteData(
                table: "RolesForUsers",
                keyColumn: "Id",
                keyValue: 3L);

            migrationBuilder.DeleteData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 3L);

            migrationBuilder.DeleteData(
                table: "UserOperationClaims",
                keyColumn: "Id",
                keyValue: 3L);

            migrationBuilder.DeleteData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 4L);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3L);

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
    }
}
