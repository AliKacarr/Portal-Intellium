-- Masraf dönemi kolonu: "YYYY-MM" (örn. 2025-03). Önceki dönemlere ekleme yapılamaz kuralı için.
-- Çalıştırma: psql -U postgres -d portaldb -f AddExpensePeriodColumn.sql  veya pgAdmin'de portaldb'de çalıştırın.

ALTER TABLE "Expenses" ADD COLUMN IF NOT EXISTS "ExpensePeriod" text NULL;
UPDATE "Expenses" SET "ExpensePeriod" = to_char("InvoiceDate", 'YYYY-MM') WHERE "ExpensePeriod" IS NULL;
ALTER TABLE "Expenses" ALTER COLUMN "ExpensePeriod" SET DEFAULT to_char(CURRENT_DATE, 'YYYY-MM');
