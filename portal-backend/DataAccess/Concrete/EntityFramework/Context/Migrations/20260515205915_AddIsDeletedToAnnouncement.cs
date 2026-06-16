using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    /// <inheritdoc />
    public partial class AddIsDeletedToAnnouncement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "Announcements",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishDate",
                table: "Announcements",
                type: "timestamp without time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "Announcements");

            migrationBuilder.DropColumn(
                name: "PublishDate",
                table: "Announcements");

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
    }
}
