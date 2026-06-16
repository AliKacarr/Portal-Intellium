using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    /// <inheritdoc />
    public partial class SeedNazliUser : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 1L,
                columns: new[] { "AddetAt", "LicenceFinishDate", "LicenceStartDate" },
                values: new object[] { new DateTime(2026, 5, 8, 8, 15, 44, 921, DateTimeKind.Local).AddTicks(3005), new DateTime(2026, 7, 7, 8, 15, 44, 921, DateTimeKind.Local).AddTicks(2962), new DateTime(2026, 5, 8, 8, 15, 44, 921, DateTimeKind.Local).AddTicks(2935) });

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 8, 5, 15, 44, 921, DateTimeKind.Utc).AddTicks(2878));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 8, 5, 15, 44, 921, DateTimeKind.Utc).AddTicks(2880));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 8, 5, 15, 44, 921, DateTimeKind.Utc).AddTicks(2881));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 8, 5, 15, 44, 921, DateTimeKind.Utc).AddTicks(2882));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 8, 8, 15, 44, 921, DateTimeKind.Local).AddTicks(6768));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 8, 8, 15, 44, 921, DateTimeKind.Local).AddTicks(6803));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 8, 5, 15, 44, 921, DateTimeKind.Utc).AddTicks(2556));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 8, 5, 15, 44, 921, DateTimeKind.Utc).AddTicks(2563));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 8, 5, 15, 44, 921, DateTimeKind.Utc).AddTicks(2564));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 8, 5, 15, 44, 921, DateTimeKind.Utc).AddTicks(2565));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 8, 8, 15, 44, 921, DateTimeKind.Local).AddTicks(4129), "ba5ce832-d0ea-4d7d-b160-35c0bec00cda", new DateTime(2026, 5, 8, 8, 15, 44, 921, DateTimeKind.Local).AddTicks(4144), new byte[] { 57, 179, 138, 22, 9, 248, 37, 149, 246, 117, 22, 121, 65, 105, 149, 232, 105, 163, 197, 197, 70, 102, 166, 168, 235, 166, 219, 9, 111, 206, 143, 119, 189, 89, 186, 108, 186, 161, 77, 224, 188, 94, 139, 199, 190, 74, 217, 76, 73, 47, 252, 83, 246, 146, 159, 129, 136, 201, 40, 24, 38, 107, 20, 252 }, new byte[] { 74, 87, 129, 248, 170, 221, 189, 40, 80, 60, 195, 198, 153, 183, 144, 246, 93, 43, 230, 181, 41, 97, 97, 148, 117, 215, 117, 141, 203, 32, 128, 172, 54, 16, 223, 232, 220, 214, 155, 75, 93, 57, 145, 132, 186, 207, 9, 115, 149, 210, 149, 11, 128, 227, 179, 202, 67, 248, 76, 200, 17, 166, 182, 9, 54, 231, 174, 195, 43, 250, 61, 219, 208, 182, 133, 157, 84, 95, 208, 172, 2, 48, 156, 122, 210, 130, 23, 144, 14, 70, 30, 1, 40, 236, 247, 221, 49, 58, 192, 221, 168, 58, 197, 102, 33, 246, 230, 83, 18, 125, 107, 142, 210, 204, 241, 23, 188, 160, 184, 127, 100, 247, 236, 107, 158, 92, 216, 104 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 8, 8, 15, 44, 921, DateTimeKind.Local).AddTicks(4381), "47f78112-47e1-4288-9585-bc2408aa7d3e", new DateTime(2026, 5, 8, 8, 15, 44, 921, DateTimeKind.Local).AddTicks(4384), new byte[] { 59, 129, 205, 103, 240, 38, 249, 148, 131, 139, 146, 50, 169, 144, 138, 28, 213, 95, 192, 74, 76, 132, 51, 136, 189, 177, 5, 2, 143, 34, 39, 159, 135, 182, 124, 117, 67, 88, 207, 63, 170, 21, 215, 132, 38, 65, 117, 179, 104, 213, 60, 30, 101, 124, 95, 25, 99, 89, 119, 177, 184, 20, 66, 190 }, new byte[] { 188, 111, 178, 88, 1, 23, 12, 154, 225, 16, 162, 84, 214, 122, 229, 80, 160, 113, 70, 64, 2, 213, 193, 249, 239, 108, 18, 21, 99, 168, 11, 247, 70, 63, 19, 106, 41, 115, 234, 195, 243, 119, 218, 21, 236, 26, 33, 161, 52, 212, 25, 85, 176, 172, 249, 207, 13, 198, 59, 188, 215, 179, 46, 102, 124, 133, 56, 73, 97, 54, 122, 44, 199, 245, 132, 70, 252, 3, 57, 72, 120, 127, 219, 41, 156, 49, 134, 82, 112, 212, 153, 53, 48, 115, 189, 68, 241, 39, 88, 98, 51, 80, 193, 223, 243, 52, 247, 190, 10, 54, 138, 144, 20, 59, 247, 202, 181, 105, 57, 117, 17, 59, 2, 103, 149, 251, 236, 196 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3L,
                columns: new[] { "PasswordHash", "PasswordSalt" },
                values: new object[] { new byte[] { 4, 28, 0, 29, 121, 204, 204, 63, 179, 112, 110, 69, 98, 248, 85, 87, 16, 240, 39, 83, 115, 40, 254, 238, 247, 245, 80, 3, 142, 88, 166, 24, 151, 60, 17, 109, 1, 178, 199, 128, 128, 151, 218, 13, 205, 153, 67, 62, 83, 69, 15, 193, 120, 226, 136, 155, 214, 137, 37, 82, 33, 235, 36, 8 }, new byte[] { 169, 170, 219, 88, 204, 39, 129, 32, 52, 160, 38, 181, 244, 29, 27, 210, 0, 212, 42, 248, 141, 88, 148, 218, 240, 77, 188, 251, 223, 71, 42, 253, 130, 193, 228, 106, 106, 96, 49, 148, 255, 168, 43, 195, 191, 179, 249, 136, 213, 42, 107, 237, 61, 116, 176, 43, 185, 150, 158, 11, 229, 103, 227, 213, 13, 169, 219, 6, 177, 254, 116, 232, 14, 195, 44, 240, 145, 170, 233, 136, 1, 99, 137, 171, 58, 126, 147, 74, 143, 192, 160, 195, 126, 99, 104, 163, 184, 251, 149, 251, 56, 157, 107, 248, 40, 201, 218, 224, 237, 202, 80, 191, 186, 131, 108, 253, 193, 203, 36, 186, 74, 30, 51, 7, 157, 120, 23, 24 } });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "AddetAt", "ConfirmValue", "Email", "ForgotPasswordRequestDate", "ForgotPasswordValue", "ImageUrl", "IsActive", "IsConfirm", "IsForgotPasswordComplete", "Language", "MailConfirm", "MailConfirmDate", "Name", "PasswordHash", "PasswordSalt" },
                values: new object[] { 4L, new DateTime(2026, 5, 8, 0, 0, 0, 0, DateTimeKind.Utc), "seed-nazli", "nazliduyguu@gmail.com", null, null, null, true, true, null, "Türkçe", true, new DateTime(2026, 5, 8, 0, 0, 0, 0, DateTimeKind.Utc), "Nazlı Duygu",
                    new byte[] { 32, 190, 131, 213, 119, 144, 66, 70, 216, 17, 229, 181, 219, 38, 14, 164, 183, 164, 123, 206, 84, 174, 129, 90, 91, 31, 152, 157, 5, 64, 30, 100, 164, 233, 152, 13, 53, 114, 249, 188, 250, 187, 84, 239, 137, 56, 111, 248, 240, 121, 119, 199, 115, 139, 88, 193, 56, 98, 164, 129, 98, 17, 138, 191 },
                    new byte[] { 47, 234, 46, 77, 116, 208, 240, 91, 178, 157, 213, 77, 213, 231, 146, 86, 232, 209, 56, 86, 228, 198, 62, 38, 238, 93, 145, 158, 247, 101, 252, 194, 66, 223, 95, 216, 226, 104, 187, 79, 8, 42, 110, 116, 137, 129, 112, 246, 92, 103, 173, 230, 160, 56, 172, 208, 251, 225, 2, 198, 106, 222, 84, 245, 27, 96, 189, 64, 122, 227, 174, 237, 101, 179, 61, 98, 252, 20, 26, 11, 197, 177, 155, 181, 24, 88, 176, 170, 171, 208, 197, 67, 209, 208, 25, 89, 68, 55, 80, 32, 63, 162, 14, 168, 120, 213, 183, 52, 196, 234, 2, 145, 126, 89, 78, 255, 253, 23, 37, 138, 21, 99, 138, 83, 130, 153, 133, 167 }
                });

            migrationBuilder.InsertData(
                table: "UserCustomers",
                columns: new[] { "Id", "AddetAt", "CustomerId", "IsActive", "UserId" },
                values: new object[] { 4L, new DateTime(2026, 5, 8, 0, 0, 0, 0, DateTimeKind.Utc), 1L, true, 4L });

            migrationBuilder.InsertData(
                table: "UserOperationClaims",
                columns: new[] { "Id", "OperationClaimId", "UserId" },
                values: new object[] { 4L, 3L, 4L });

            migrationBuilder.InsertData(
                table: "RolesForUsers",
                columns: new[] { "Id", "RoleId", "UserId" },
                values: new object[] { 4L, 3L, 4L });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "RolesForUsers",
                keyColumn: "Id",
                keyValue: 4L);

            migrationBuilder.DeleteData(
                table: "UserOperationClaims",
                keyColumn: "Id",
                keyValue: 4L);

            migrationBuilder.DeleteData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 4L);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4L);

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

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 7, 18, 53, 55, 982, DateTimeKind.Utc).AddTicks(8361));

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

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 7, 18, 53, 55, 982, DateTimeKind.Utc).AddTicks(7355));

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

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3L,
                columns: new[] { "PasswordHash", "PasswordSalt" },
                values: new object[] { new byte[] { 160, 12, 247, 175, 240, 214, 167, 14, 243, 242, 218, 123, 3, 158, 47, 149, 248, 56, 161, 250, 75, 19, 138, 178, 84, 11, 128, 184, 199, 49, 120, 25, 79, 31, 74, 42, 128, 111, 225, 253, 47, 162, 251, 95, 222, 97, 193, 228, 190, 69, 201, 96, 196, 255, 70, 27, 129, 96, 116, 82, 34, 163, 32, 197 }, new byte[] { 15, 104, 36, 74, 145, 148, 138, 244, 72, 71, 134, 156, 61, 75, 142, 176, 45, 81, 44, 243, 231, 187, 140, 193, 229, 140, 188, 142, 16, 84, 112, 224, 82, 156, 52, 88, 66, 75, 249, 178, 240, 56, 143, 223, 86, 54, 183, 89, 137, 225, 106, 24, 44, 123, 45, 135, 130, 232, 38, 228, 109, 121, 204, 88, 187, 86, 165, 60, 108, 117, 251, 128, 204, 7, 194, 79, 92, 64, 246, 243, 203, 13, 142, 175, 240, 19, 255, 80, 119, 217, 152, 92, 9, 0, 127, 63, 121, 51, 189, 218, 39, 53, 65, 82, 242, 241, 29, 30, 147, 74, 248, 161, 107, 190, 81, 92, 46, 24, 56, 22, 8, 80, 194, 255, 76, 77, 72, 57 } });
        }
    }
}
