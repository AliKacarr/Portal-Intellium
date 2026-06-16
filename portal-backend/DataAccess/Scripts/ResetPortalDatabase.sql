-- portaldb'yi sıfırla (tüm tablolar + migration geçmişi silinir).
-- pgAdmin veya psql ile postgres kullanıcısıyla çalıştırın.
--
-- Sonra: cd WebApi && dotnet run
-- (Development'ta migration'lar otomatik uygulanır)

-- Yöntem A: Veritabanını tamamen yeniden oluştur (önerilen)
-- NOT: Aktif bağlantı varsa önce backend'i durdurun.
/*
DROP DATABASE IF EXISTS portaldb;
CREATE DATABASE portaldb;
*/

-- Yöntem B: Aynı veritabanında şemayı sıfırla (DROP DATABASE yetkisi yoksa)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
