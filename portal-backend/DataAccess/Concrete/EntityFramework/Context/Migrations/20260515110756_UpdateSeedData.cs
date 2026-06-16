using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 1L,
                columns: new[] { "AddetAt", "LicenceFinishDate", "LicenceStartDate" },
                values: new object[] { new DateTime(2026, 5, 15, 14, 7, 54, 407, DateTimeKind.Local).AddTicks(4313), new DateTime(2026, 7, 14, 14, 7, 54, 407, DateTimeKind.Local).AddTicks(4290), new DateTime(2026, 5, 15, 14, 7, 54, 407, DateTimeKind.Local).AddTicks(4126) });

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 11, 7, 54, 407, DateTimeKind.Utc).AddTicks(4090));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 11, 7, 54, 407, DateTimeKind.Utc).AddTicks(4091));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 11, 7, 54, 407, DateTimeKind.Utc).AddTicks(4092));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 11, 7, 54, 407, DateTimeKind.Utc).AddTicks(4093));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 15, 14, 7, 54, 407, DateTimeKind.Local).AddTicks(5378));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 15, 14, 7, 54, 407, DateTimeKind.Local).AddTicks(5392));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 11, 7, 54, 407, DateTimeKind.Utc).AddTicks(3716));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 11, 7, 54, 407, DateTimeKind.Utc).AddTicks(3719));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 11, 7, 54, 407, DateTimeKind.Utc).AddTicks(3720));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 11, 7, 54, 407, DateTimeKind.Utc).AddTicks(3721));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 15, 14, 7, 54, 407, DateTimeKind.Local).AddTicks(4776), "442f0b84-09f1-4ce6-abaf-6d622ad1141d", new DateTime(2026, 5, 15, 14, 7, 54, 407, DateTimeKind.Local).AddTicks(4778), new byte[] { 102, 42, 55, 170, 76, 11, 126, 254, 223, 11, 147, 115, 165, 131, 193, 217, 49, 113, 148, 159, 196, 172, 142, 174, 139, 188, 113, 220, 98, 101, 45, 236, 136, 230, 184, 68, 126, 202, 138, 25, 205, 226, 92, 129, 47, 59, 152, 20, 236, 17, 210, 54, 92, 100, 254, 2, 105, 112, 161, 65, 114, 225, 123, 194 }, new byte[] { 198, 132, 62, 178, 37, 137, 82, 84, 60, 98, 47, 97, 171, 236, 55, 248, 240, 143, 168, 114, 176, 229, 230, 10, 103, 213, 251, 49, 190, 193, 123, 202, 54, 142, 204, 36, 248, 249, 137, 175, 152, 210, 92, 192, 83, 123, 101, 99, 17, 62, 25, 204, 77, 29, 115, 99, 123, 104, 40, 249, 202, 237, 192, 103, 62, 219, 138, 178, 204, 5, 19, 69, 254, 126, 0, 84, 170, 36, 157, 255, 55, 149, 230, 99, 140, 23, 181, 149, 208, 204, 245, 228, 170, 206, 209, 133, 212, 151, 46, 15, 187, 133, 123, 15, 52, 241, 85, 110, 122, 195, 34, 103, 144, 69, 242, 71, 69, 8, 112, 34, 173, 127, 80, 219, 207, 67, 127, 94 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 15, 14, 7, 54, 407, DateTimeKind.Local).AddTicks(4881), "f7a56d77-4617-407a-b354-1d4cd67d5398", new DateTime(2026, 5, 15, 14, 7, 54, 407, DateTimeKind.Local).AddTicks(4883), new byte[] { 36, 16, 190, 242, 146, 204, 5, 112, 30, 75, 118, 29, 111, 229, 149, 144, 90, 37, 132, 94, 183, 97, 64, 114, 233, 41, 176, 222, 245, 231, 217, 16, 89, 213, 149, 209, 64, 20, 104, 96, 15, 70, 112, 244, 52, 21, 12, 52, 19, 182, 245, 253, 27, 224, 143, 152, 252, 35, 150, 252, 44, 39, 81, 66 }, new byte[] { 125, 218, 66, 146, 166, 10, 70, 246, 184, 254, 112, 133, 210, 195, 68, 93, 34, 0, 141, 241, 148, 237, 53, 157, 57, 2, 240, 177, 45, 125, 114, 216, 79, 87, 10, 1, 42, 103, 115, 204, 158, 91, 198, 54, 88, 54, 129, 82, 204, 215, 165, 51, 252, 170, 84, 135, 151, 69, 234, 137, 130, 182, 74, 66, 116, 43, 39, 1, 8, 243, 52, 253, 245, 52, 159, 80, 169, 112, 82, 98, 58, 128, 255, 221, 195, 236, 66, 59, 199, 186, 252, 255, 43, 251, 0, 5, 116, 95, 74, 242, 125, 87, 116, 175, 34, 48, 116, 192, 155, 196, 165, 174, 78, 196, 234, 229, 106, 82, 10, 209, 173, 26, 175, 26, 78, 200, 238, 30 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3L,
                columns: new[] { "PasswordHash", "PasswordSalt" },
                values: new object[] { new byte[] { 149, 166, 78, 250, 221, 98, 147, 68, 213, 189, 110, 52, 88, 126, 248, 81, 209, 8, 73, 255, 92, 88, 66, 200, 110, 221, 222, 53, 29, 164, 62, 201, 71, 193, 197, 62, 243, 253, 64, 206, 139, 83, 41, 24, 46, 146, 171, 198, 24, 28, 169, 41, 158, 87, 242, 115, 231, 162, 98, 25, 232, 25, 24, 143 }, new byte[] { 122, 92, 10, 117, 18, 233, 171, 5, 83, 46, 0, 182, 35, 168, 17, 136, 84, 191, 70, 245, 248, 37, 100, 69, 66, 96, 52, 176, 195, 132, 118, 163, 146, 239, 82, 87, 230, 159, 182, 10, 100, 223, 161, 14, 33, 65, 121, 160, 135, 227, 230, 29, 218, 113, 197, 253, 99, 111, 223, 241, 153, 58, 187, 96, 164, 131, 205, 78, 28, 215, 151, 160, 219, 228, 241, 192, 86, 144, 156, 217, 119, 230, 33, 154, 125, 96, 128, 77, 23, 248, 132, 29, 56, 173, 236, 74, 234, 21, 142, 142, 185, 82, 101, 99, 72, 188, 197, 160, 57, 108, 200, 128, 140, 194, 242, 175, 225, 253, 30, 170, 238, 232, 55, 226, 130, 91, 187, 148 } });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 1L,
                columns: new[] { "AddetAt", "LicenceFinishDate", "LicenceStartDate" },
                values: new object[] { new DateTime(2026, 5, 13, 1, 54, 24, 811, DateTimeKind.Local).AddTicks(9980), new DateTime(2026, 7, 12, 1, 54, 24, 811, DateTimeKind.Local).AddTicks(9970), new DateTime(2026, 5, 13, 1, 54, 24, 811, DateTimeKind.Local).AddTicks(9950) });

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 12, 22, 54, 24, 811, DateTimeKind.Utc).AddTicks(9930));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 12, 22, 54, 24, 811, DateTimeKind.Utc).AddTicks(9930));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 12, 22, 54, 24, 811, DateTimeKind.Utc).AddTicks(9930));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 12, 22, 54, 24, 811, DateTimeKind.Utc).AddTicks(9930));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 13, 1, 54, 24, 812, DateTimeKind.Local).AddTicks(320));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 13, 1, 54, 24, 812, DateTimeKind.Local).AddTicks(320));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 12, 22, 54, 24, 811, DateTimeKind.Utc).AddTicks(9880));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 12, 22, 54, 24, 811, DateTimeKind.Utc).AddTicks(9880));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 12, 22, 54, 24, 811, DateTimeKind.Utc).AddTicks(9880));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 12, 22, 54, 24, 811, DateTimeKind.Utc).AddTicks(9880));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 13, 1, 54, 24, 812, DateTimeKind.Local).AddTicks(160), "b7c4de84-97a6-4d09-9958-89782ef7f3b9", new DateTime(2026, 5, 13, 1, 54, 24, 812, DateTimeKind.Local).AddTicks(170), new byte[] { 243, 98, 214, 108, 116, 234, 198, 65, 119, 247, 21, 123, 34, 98, 124, 125, 181, 180, 129, 85, 60, 200, 221, 247, 98, 67, 195, 163, 215, 185, 37, 210, 91, 127, 224, 73, 46, 110, 33, 48, 118, 155, 166, 153, 176, 176, 42, 182, 73, 157, 173, 150, 5, 130, 216, 208, 186, 179, 19, 173, 219, 17, 94, 37 }, new byte[] { 42, 71, 201, 252, 56, 17, 81, 142, 30, 86, 155, 202, 46, 168, 111, 86, 55, 236, 8, 35, 62, 240, 226, 250, 77, 39, 138, 44, 81, 169, 137, 187, 161, 4, 105, 170, 74, 212, 167, 200, 149, 106, 219, 11, 175, 36, 237, 204, 66, 240, 247, 108, 185, 146, 114, 174, 16, 224, 246, 62, 248, 159, 227, 235, 78, 36, 189, 37, 226, 64, 0, 111, 12, 245, 235, 126, 8, 241, 204, 21, 216, 180, 72, 58, 43, 57, 5, 222, 151, 248, 15, 38, 53, 246, 136, 37, 105, 14, 36, 111, 97, 175, 151, 37, 74, 17, 136, 195, 177, 60, 150, 72, 3, 250, 171, 65, 229, 7, 9, 28, 93, 175, 99, 205, 52, 65, 243, 237 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 13, 1, 54, 24, 812, DateTimeKind.Local).AddTicks(210), "d2fe8667-2a5f-47cf-8aad-91ffb98fac4b", new DateTime(2026, 5, 13, 1, 54, 24, 812, DateTimeKind.Local).AddTicks(220), new byte[] { 171, 122, 27, 99, 48, 68, 81, 232, 29, 75, 171, 254, 163, 58, 247, 231, 179, 182, 163, 138, 243, 33, 116, 208, 28, 253, 184, 221, 196, 93, 208, 213, 197, 41, 55, 93, 236, 37, 190, 237, 69, 209, 230, 166, 83, 213, 205, 226, 110, 171, 101, 23, 248, 134, 135, 114, 199, 208, 88, 161, 94, 115, 143, 161 }, new byte[] { 213, 76, 124, 4, 255, 128, 28, 163, 244, 96, 183, 38, 246, 68, 73, 222, 255, 238, 80, 233, 185, 82, 54, 122, 9, 69, 9, 116, 187, 41, 35, 192, 54, 112, 16, 105, 25, 179, 122, 154, 192, 155, 130, 106, 16, 8, 73, 244, 76, 103, 172, 6, 6, 1, 233, 71, 82, 63, 177, 207, 222, 102, 251, 16, 242, 62, 179, 236, 194, 219, 73, 60, 27, 72, 0, 218, 58, 113, 63, 97, 95, 157, 132, 248, 212, 121, 144, 182, 47, 205, 68, 89, 139, 4, 73, 108, 116, 251, 232, 227, 125, 240, 63, 235, 239, 87, 189, 95, 121, 10, 241, 160, 208, 243, 216, 100, 48, 95, 47, 161, 196, 220, 169, 128, 226, 233, 57, 43 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3L,
                columns: new[] { "PasswordHash", "PasswordSalt" },
                values: new object[] { new byte[] { 22, 219, 56, 38, 94, 62, 80, 246, 19, 165, 144, 41, 176, 180, 220, 58, 148, 26, 245, 120, 188, 118, 31, 150, 228, 156, 255, 57, 85, 26, 146, 165, 105, 252, 234, 80, 75, 117, 151, 199, 134, 139, 181, 180, 195, 110, 199, 156, 60, 170, 139, 184, 168, 218, 201, 31, 175, 41, 239, 49, 221, 28, 125, 78 }, new byte[] { 123, 137, 7, 36, 155, 84, 8, 223, 120, 24, 147, 238, 141, 109, 247, 79, 70, 240, 72, 50, 174, 201, 217, 140, 186, 170, 154, 207, 189, 157, 115, 59, 56, 94, 177, 68, 115, 233, 6, 228, 226, 20, 41, 250, 195, 68, 129, 176, 114, 80, 235, 33, 189, 55, 205, 27, 210, 196, 199, 115, 106, 144, 25, 226, 216, 100, 31, 55, 184, 79, 0, 44, 177, 176, 170, 123, 165, 74, 56, 150, 171, 159, 79, 133, 101, 200, 255, 11, 131, 173, 171, 108, 15, 109, 208, 182, 96, 37, 108, 12, 215, 171, 24, 42, 4, 9, 104, 82, 204, 187, 150, 101, 85, 146, 125, 239, 170, 234, 25, 139, 71, 229, 59, 18, 77, 92, 32, 111 } });
        }
    }
}
