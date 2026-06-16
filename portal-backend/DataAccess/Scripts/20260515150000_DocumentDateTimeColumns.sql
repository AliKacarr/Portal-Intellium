-- Documents tablosunda tarih kolonları saat bilgisini kesiyordu (date tipi).
-- Bu script'i PostgreSQL'de bir kez çalıştırın, ardından API'yi yeniden başlatın.

ALTER TABLE "Documents"
    ALTER COLUMN "CreatedAt" TYPE timestamp without time zone
        USING CASE WHEN "CreatedAt" IS NULL THEN NULL ELSE "CreatedAt"::timestamp END;

ALTER TABLE "Documents"
    ALTER COLUMN "UpdatedAt" TYPE timestamp without time zone
        USING CASE WHEN "UpdatedAt" IS NULL THEN NULL ELSE "UpdatedAt"::timestamp END;

ALTER TABLE "Documents"
    ALTER COLUMN "LastAccessed" TYPE timestamp without time zone
        USING CASE WHEN "LastAccessed" IS NULL THEN NULL ELSE "LastAccessed"::timestamp END;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260515150000_DocumentDateTimeColumns', '8.0.0')
ON CONFLICT ("MigrationId") DO NOTHING;
