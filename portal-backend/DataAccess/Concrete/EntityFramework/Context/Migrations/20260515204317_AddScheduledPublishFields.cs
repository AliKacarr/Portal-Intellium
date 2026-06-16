using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduledPublishFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Customers",
                keyColumn: "CustomerId",
                keyValue: 1L,
                columns: new[] { "AddetAt", "LicenceFinishDate", "LicenceStartDate" },
                values: new object[] { new DateTime(2026, 5, 15, 23, 43, 15, 536, DateTimeKind.Local).AddTicks(9352), new DateTime(2026, 7, 14, 23, 43, 15, 536, DateTimeKind.Local).AddTicks(9324), new DateTime(2026, 5, 15, 23, 43, 15, 536, DateTimeKind.Local).AddTicks(9295) });

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 43, 15, 536, DateTimeKind.Utc).AddTicks(9268));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 43, 15, 536, DateTimeKind.Utc).AddTicks(9270));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 43, 15, 536, DateTimeKind.Utc).AddTicks(9270));

            migrationBuilder.UpdateData(
                table: "OperationClaims",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 43, 15, 536, DateTimeKind.Utc).AddTicks(9271));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 15, 23, 43, 15, 537, DateTimeKind.Local).AddTicks(344));

            migrationBuilder.UpdateData(
                table: "UserCustomers",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddetAt",
                value: new DateTime(2026, 5, 15, 23, 43, 15, 537, DateTimeKind.Local).AddTicks(354));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 1L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 43, 15, 536, DateTimeKind.Utc).AddTicks(9141));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 2L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 43, 15, 536, DateTimeKind.Utc).AddTicks(9143));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 3L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 43, 15, 536, DateTimeKind.Utc).AddTicks(9143));

            migrationBuilder.UpdateData(
                table: "UserRoles",
                keyColumn: "Id",
                keyValue: 4L,
                column: "AddedAt",
                value: new DateTime(2026, 5, 15, 20, 43, 15, 536, DateTimeKind.Utc).AddTicks(9144));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 15, 23, 43, 15, 536, DateTimeKind.Local).AddTicks(9798), "acccc216-6a61-4ceb-b105-86141e3cf92f", new DateTime(2026, 5, 15, 23, 43, 15, 536, DateTimeKind.Local).AddTicks(9800), new byte[] { 200, 50, 160, 154, 26, 209, 105, 227, 116, 160, 3, 100, 73, 152, 193, 29, 203, 53, 59, 147, 238, 210, 129, 185, 9, 172, 131, 235, 44, 58, 88, 73, 68, 20, 248, 193, 40, 139, 121, 120, 90, 59, 122, 108, 124, 46, 39, 15, 199, 180, 73, 213, 89, 1, 199, 227, 177, 32, 228, 55, 60, 131, 112, 236 }, new byte[] { 172, 158, 229, 105, 155, 88, 145, 59, 183, 58, 134, 193, 173, 102, 24, 205, 31, 18, 39, 131, 211, 221, 168, 13, 64, 186, 239, 250, 164, 140, 159, 30, 193, 133, 193, 117, 185, 54, 18, 205, 141, 33, 32, 35, 195, 117, 251, 42, 32, 227, 155, 51, 33, 241, 3, 72, 245, 111, 110, 79, 37, 26, 211, 253, 129, 31, 190, 148, 62, 141, 152, 129, 20, 213, 116, 64, 210, 62, 94, 234, 241, 19, 43, 36, 125, 179, 106, 224, 237, 229, 101, 232, 224, 244, 7, 173, 195, 94, 146, 23, 111, 250, 28, 100, 53, 151, 242, 10, 58, 1, 200, 96, 149, 230, 113, 0, 250, 238, 166, 112, 70, 127, 2, 223, 209, 167, 143, 179 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2L,
                columns: new[] { "AddetAt", "ConfirmValue", "MailConfirmDate", "PasswordHash", "PasswordSalt" },
                values: new object[] { new DateTime(2026, 5, 15, 23, 43, 15, 537, DateTimeKind.Local).AddTicks(102), "54279ee7-235c-420a-a818-912b02903462", new DateTime(2026, 5, 15, 23, 43, 15, 537, DateTimeKind.Local).AddTicks(103), new byte[] { 129, 225, 235, 41, 234, 67, 232, 67, 142, 94, 108, 211, 200, 149, 48, 206, 10, 21, 91, 2, 44, 254, 105, 149, 138, 35, 178, 126, 241, 142, 2, 53, 242, 76, 4, 155, 232, 22, 53, 232, 189, 8, 33, 250, 102, 161, 60, 142, 198, 31, 163, 254, 160, 112, 110, 251, 21, 107, 106, 153, 208, 17, 236, 115 }, new byte[] { 117, 81, 86, 70, 63, 33, 167, 219, 104, 123, 171, 50, 36, 115, 81, 248, 33, 227, 166, 251, 87, 119, 21, 252, 152, 73, 102, 151, 194, 183, 125, 15, 186, 72, 53, 35, 19, 108, 41, 62, 21, 37, 125, 185, 21, 6, 40, 130, 187, 213, 235, 96, 180, 232, 66, 224, 55, 18, 46, 187, 191, 226, 175, 222, 201, 5, 191, 88, 1, 149, 149, 41, 110, 63, 143, 224, 249, 244, 75, 185, 181, 247, 253, 168, 164, 104, 42, 127, 241, 118, 240, 31, 85, 88, 185, 45, 241, 165, 30, 122, 151, 138, 25, 153, 114, 100, 170, 235, 199, 71, 14, 100, 205, 209, 73, 237, 149, 64, 108, 2, 247, 37, 21, 202, 147, 215, 64, 254 } });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3L,
                columns: new[] { "PasswordHash", "PasswordSalt" },
                values: new object[] { new byte[] { 216, 239, 47, 55, 131, 239, 12, 128, 68, 128, 11, 23, 130, 231, 108, 116, 97, 166, 98, 65, 159, 214, 46, 135, 70, 40, 185, 194, 129, 116, 1, 67, 249, 29, 186, 104, 78, 148, 50, 37, 99, 167, 172, 86, 51, 2, 177, 109, 90, 179, 185, 167, 116, 109, 14, 130, 178, 65, 217, 250, 168, 103, 160, 142 }, new byte[] { 251, 149, 101, 125, 31, 72, 179, 182, 182, 98, 220, 210, 216, 96, 136, 130, 91, 94, 68, 218, 79, 0, 141, 57, 74, 163, 161, 110, 3, 88, 252, 82, 244, 117, 82, 73, 155, 165, 132, 90, 145, 141, 100, 193, 242, 87, 78, 13, 182, 92, 168, 134, 51, 19, 141, 161, 67, 59, 202, 166, 123, 48, 25, 118, 113, 185, 190, 143, 98, 156, 24, 118, 84, 222, 174, 212, 176, 142, 219, 171, 50, 236, 29, 186, 241, 113, 252, 174, 130, 7, 18, 68, 152, 233, 160, 73, 149, 90, 4, 179, 224, 124, 205, 93, 241, 244, 106, 98, 12, 182, 44, 18, 190, 127, 68, 153, 191, 203, 74, 200, 212, 13, 219, 57, 132, 191, 79, 111 } });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
    }
}
