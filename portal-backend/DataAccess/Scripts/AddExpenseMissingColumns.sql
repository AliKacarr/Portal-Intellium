-- Expenses tablosunda eksik sütunları ekler (42703: ApprovedUserId sütunu mevcut değil hatası için).
-- PostgreSQL'de çalıştırın: psql -U postgres -d portaldb -f AddExpenseMissingColumns.sql
-- veya pgAdmin'de portaldb veritabanında bu dosyayı açıp çalıştırın.

-- ApprovedUserId (nullable)
ALTER TABLE "Expenses" ADD COLUMN IF NOT EXISTS "ApprovedUserId" bigint NULL;

-- Aşağıdaki sütunlar da migration'da var; yoksa ekleyin:
ALTER TABLE "Expenses" ADD COLUMN IF NOT EXISTS "CreatedUserId" bigint NOT NULL DEFAULT 0;
ALTER TABLE "Expenses" ADD COLUMN IF NOT EXISTS "IsPinned" boolean NOT NULL DEFAULT false;
ALTER TABLE "Expenses" ADD COLUMN IF NOT EXISTS "MealDescription" text NULL;
