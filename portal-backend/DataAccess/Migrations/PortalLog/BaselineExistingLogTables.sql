-- Tabloları daha önce manuel SQL ile oluşturduysanız, EF migration geçmişine bu kaydı ekleyin.
-- Böylece "relation already exists" hatası olmadan dotnet ef database update tamamlanır.

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260425180000_PortalLog_InitialSchema', '7.0.20')
ON CONFLICT ("MigrationId") DO NOTHING;
