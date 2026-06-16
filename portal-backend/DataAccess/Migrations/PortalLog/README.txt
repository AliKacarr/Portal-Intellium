portallogdb — PortalLogContext EF Core migration’ları
=====================================================

Önkoşullar
-----------
1) PostgreSQL’de log veritabanını oluşturun (örnek ad: portallogdb).
2) WebApi\appsettings.json veya dotnet user-secrets içinde:
   ConnectionStrings:LogConnectionStrings = Host=...;Database=portallogdb;...

İlk kurulum (boş veritabanı)
----------------------------
WebApi klasöründe:

  dotnet tool restore
  dotnet ef database update --context PortalLogContext --project ..\DataAccess\DataAccess.csproj --startup-project .

Bu komut 20260425180000_PortalLog_InitialSchema migration’ını uygular (RequestUrl, Sessions, UserActivityLogs, …).

Ana uygulama veritabanı (portaldb / PortalContext) ayrıdır; onun migration’larını ayrı connection ile uygulayın.

Tabloları daha önce manuel SQL ile oluşturduysanız
-------------------------------------------------
"relation already exists" alırsanız, aynı şema zaten vardır. Bu durumda yalnızca EF geçmişine kayıt ekleyin:

  psql ... -f BaselineExistingLogTables.sql

Ardından tekrar:

  dotnet ef database update --context PortalLogContext --project ..\DataAccess\DataAccess.csproj --startup-project .

Yeni migration ekleme
---------------------
WebApi klasöründen:

  dotnet ef migrations add MigrationAdi --context PortalLogContext --project ..\DataAccess\DataAccess.csproj --startup-project . --output-dir Migrations\PortalLog

dotnet-ef sürümü WebApi\.config\dotnet-tools.json içinde tanımlıdır (projede EF 7 ile uyumlu).
