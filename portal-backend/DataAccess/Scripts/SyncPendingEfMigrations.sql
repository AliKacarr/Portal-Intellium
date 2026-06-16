-- Yarım kurulmuş DB: tablolar var, __EFMigrationsHistory eksik/yarım → EF CREATE TABLE ile çakışır (42P07).
-- Bu script + EnsurePortalNewsAnnouncementPollSchema.sql sonrası dotnet ef database update çalıştırın.
--
-- Sıra:
--   1) EnsurePortalNewsAnnouncementPollSchema.sql
--   2) Bu dosya
--   3) cd WebApi; dotnet tool restore; dotnet ef database update --context PortalContext

CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

-- InitialCreate şeması varsa (AiTaskPreviews veya benzeri tablolar):
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260424114020_InitialCreate', '7.0.0'
WHERE to_regclass('public."AiTaskPreviews"') IS NOT NULL
   OR to_regclass('public."Users"') IS NOT NULL
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260506120000_AddPortalNewsAnnouncementPollModules', '7.0.0'
WHERE to_regclass('public."Departments"') IS NOT NULL
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260510120000_AddNotificationNavigationData', '7.0.0'
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Notifications' AND column_name = 'NavigationData'
)
ON CONFLICT ("MigrationId") DO NOTHING;

-- Görüntüleme tabloları EnsurePortal script ile oluşturulduysa veya zaten varsa:
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260512225425_AddAnnouncementAndNewsViews', '7.0.0'
WHERE to_regclass('public."AnnouncementViews"') IS NOT NULL
  AND to_regclass('public."NewsViews"') IS NOT NULL
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260514130000_AddServiceAreaToNewsItems', '7.0.0'
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'NewsItems' AND column_name = 'ServiceArea'
)
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260514140000_AddServiceAreaToAnnouncements', '7.0.0'
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Announcements' AND column_name = 'ServiceArea'
)
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260515205915_AddIsDeletedToAnnouncement', '7.0.0'
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Announcements' AND column_name = 'IsDeleted'
)
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260515230627_AddIsDeletedToNews', '7.0.0'
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'NewsItems' AND column_name = 'IsDeleted'
)
ON CONFLICT ("MigrationId") DO NOTHING;

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
SELECT '20260518120000_PollMultiQuestion', '7.0.0'
WHERE to_regclass('public."PollQuestions"') IS NOT NULL
ON CONFLICT ("MigrationId") DO NOTHING;
