-- Haber kategorileri (NewsCategories boşsa varsayılan kayıtlar)
INSERT INTO "NewsCategories" ("Name", "Description", "IsActive", "CreatedAt")
SELECT v."Name", v."Description", true, NOW() AT TIME ZONE 'UTC'
FROM (VALUES
    ('Genel', 'Genel haberler'),
    ('Şirket', 'Şirket ve kurumsal haberler'),
    ('Teknoloji', 'Teknoloji ve yazılım'),
    ('İnsan Kaynakları', 'İK ve çalışan haberleri'),
    ('Etkinlik', 'Etkinlik ve organizasyon')
) AS v("Name", "Description")
WHERE NOT EXISTS (SELECT 1 FROM "NewsCategories" WHERE "IsActive" = true LIMIT 1);
