-- Bölüme atanmış anketlerde IsGeneral tutarsızlığını giderir.
UPDATE "Polls"
SET "IsGeneral" = false
WHERE "DepartmentId" IS NOT NULL AND "DepartmentId" > 0 AND "IsGeneral" = true;

-- Örnek: "dışkaynak" başlıklı anket Herkes olarak kaydedilmişse (DepartmentId null),
-- admin panelinden "Dış Kaynak" seçerek güncelleyin veya:
-- UPDATE "Polls" SET "IsGeneral" = false, "DepartmentId" = 3 WHERE "Id" = 14;
