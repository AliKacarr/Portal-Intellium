using System;
using DataAccess.Concrete.EntityFramework.Context;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace DataAccess.Concrete.EntityFramework.Context.Migrations
{
    [DbContext(typeof(PortalContext))]
    [Migration("20260518120000_PollMultiQuestion")]
    public partial class PollMultiQuestion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. PollQuestions tablosunu oluştur
            migrationBuilder.CreateTable(
                name: "PollQuestions",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Text = table.Column<string>(type: "text", nullable: false),
                    OrderIndex = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    PollId = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PollQuestions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PollQuestions_Polls_PollId",
                        column: x => x.PollId,
                        principalTable: "Polls",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PollQuestions_PollId",
                table: "PollQuestions",
                column: "PollId");

            // 2. Mevcut her Poll için bir PollQuestion oluştur (Poll.Question alanından)
            migrationBuilder.Sql(@"
                INSERT INTO ""PollQuestions"" (""Text"", ""OrderIndex"", ""IsActive"", ""CreatedAt"", ""PollId"")
                SELECT ""Question"", 0, true, ""CreatedAt"", ""Id""
                FROM ""Polls"";
            ");

            // 3. PollOptions tablosuna PollQuestionId sütunu ekle (nullable olarak)
            migrationBuilder.AddColumn<long>(
                name: "PollQuestionId",
                table: "PollOptions",
                type: "bigint",
                nullable: true);

            // 4. PollOptions.PollQuestionId'yi doldur
            migrationBuilder.Sql(@"
                UPDATE ""PollOptions"" po
                SET ""PollQuestionId"" = pq.""Id""
                FROM ""PollQuestions"" pq
                WHERE pq.""PollId"" = po.""PollId"";
            ");

            // 5. PollOptions.PollQuestionId'yi NOT NULL yap
            migrationBuilder.AlterColumn<long>(
                name: "PollQuestionId",
                table: "PollOptions",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            // 6. PollOptions FK ve index ekle
            migrationBuilder.CreateIndex(
                name: "IX_PollOptions_PollQuestionId",
                table: "PollOptions",
                column: "PollQuestionId");

            migrationBuilder.AddForeignKey(
                name: "FK_PollOptions_PollQuestions_PollQuestionId",
                table: "PollOptions",
                column: "PollQuestionId",
                principalTable: "PollQuestions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // 7. Eski PollOptions.PollId FK ve index'i kaldır, sonra sütunu sil
            migrationBuilder.DropForeignKey(
                name: "FK_PollOptions_Polls_PollId",
                table: "PollOptions");

            migrationBuilder.DropIndex(
                name: "IX_PollOptions_PollId",
                table: "PollOptions");

            migrationBuilder.DropColumn(
                name: "PollId",
                table: "PollOptions");

            // 8. Eski PollVotes unique index'i kaldır
            migrationBuilder.DropIndex(
                name: "IX_PollVotes_PollId_UserId",
                table: "PollVotes");

            // 9. PollVotes tablosuna PollQuestionId sütunu ekle (nullable olarak)
            migrationBuilder.AddColumn<long>(
                name: "PollQuestionId",
                table: "PollVotes",
                type: "bigint",
                nullable: true);

            // 10. PollVotes.PollQuestionId'yi doldur (option'ın sorusundan)
            migrationBuilder.Sql(@"
                UPDATE ""PollVotes"" pv
                SET ""PollQuestionId"" = po.""PollQuestionId""
                FROM ""PollOptions"" po
                WHERE po.""Id"" = pv.""PollOptionId"";
            ");

            // 11. PollVotes.PollQuestionId'yi NOT NULL yap
            migrationBuilder.AlterColumn<long>(
                name: "PollQuestionId",
                table: "PollVotes",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            // 12. PollVotes için yeni index ve FK ekle
            migrationBuilder.CreateIndex(
                name: "IX_PollVotes_PollQuestionId",
                table: "PollVotes",
                column: "PollQuestionId");

            migrationBuilder.CreateIndex(
                name: "IX_PollVotes_PollQuestionId_UserId",
                table: "PollVotes",
                columns: new[] { "PollQuestionId", "UserId" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_PollVotes_PollQuestions_PollQuestionId",
                table: "PollVotes",
                column: "PollQuestionId",
                principalTable: "PollQuestions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            // 13. Polls tablosundan Question sütununu kaldır
            migrationBuilder.DropColumn(
                name: "Question",
                table: "Polls");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Question sütununu geri ekle
            migrationBuilder.AddColumn<string>(
                name: "Question",
                table: "Polls",
                type: "text",
                nullable: false,
                defaultValue: "");

            // PollQuestions verisini geri yaz
            migrationBuilder.Sql(@"
                UPDATE ""Polls"" p
                SET ""Question"" = pq.""Text""
                FROM ""PollQuestions"" pq
                WHERE pq.""PollId"" = p.""Id"" AND pq.""OrderIndex"" = 0;
            ");

            // PollVotes PollQuestionId kaldır
            migrationBuilder.DropForeignKey(
                name: "FK_PollVotes_PollQuestions_PollQuestionId",
                table: "PollVotes");

            migrationBuilder.DropIndex(
                name: "IX_PollVotes_PollQuestionId_UserId",
                table: "PollVotes");

            migrationBuilder.DropIndex(
                name: "IX_PollVotes_PollQuestionId",
                table: "PollVotes");

            migrationBuilder.DropColumn(
                name: "PollQuestionId",
                table: "PollVotes");

            migrationBuilder.CreateIndex(
                name: "IX_PollVotes_PollId_UserId",
                table: "PollVotes",
                columns: new[] { "PollId", "UserId" },
                unique: true);

            // PollOptions PollQuestionId kaldır, PollId geri ekle
            migrationBuilder.DropForeignKey(
                name: "FK_PollOptions_PollQuestions_PollQuestionId",
                table: "PollOptions");

            migrationBuilder.DropIndex(
                name: "IX_PollOptions_PollQuestionId",
                table: "PollOptions");

            migrationBuilder.AddColumn<long>(
                name: "PollId",
                table: "PollOptions",
                type: "bigint",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""PollOptions"" po
                SET ""PollId"" = pq.""PollId""
                FROM ""PollQuestions"" pq
                WHERE pq.""Id"" = po.""PollQuestionId"";
            ");

            migrationBuilder.AlterColumn<long>(
                name: "PollId",
                table: "PollOptions",
                type: "bigint",
                nullable: false,
                defaultValue: 0L,
                oldClrType: typeof(long),
                oldType: "bigint",
                oldNullable: true);

            migrationBuilder.DropColumn(
                name: "PollQuestionId",
                table: "PollOptions");

            migrationBuilder.CreateIndex(
                name: "IX_PollOptions_PollId",
                table: "PollOptions",
                column: "PollId");

            migrationBuilder.AddForeignKey(
                name: "FK_PollOptions_Polls_PollId",
                table: "PollOptions",
                column: "PollId",
                principalTable: "Polls",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            // PollQuestions tablosunu sil
            migrationBuilder.DropTable(name: "PollQuestions");
        }
    }
}
