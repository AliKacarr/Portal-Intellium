# Portal veritabanı kurulumu

## Sıfırdan kurulum (önerilen — ekip için)

1. `WebApi/appsettings.json` → `DevConnectionStrings` kendi PostgreSQL bilginize göre ayarlı olsun.
2. Çalışan backend varsa durdurun.
3. PostgreSQL'de şemayı sıfırlayın:

   `DataAccess/Scripts/ResetPortalDatabase.sql` dosyasını `portaldb` üzerinde çalıştırın.

   veya PowerShell:

   ```powershell
   .\scripts\reset-portaldb-and-run.ps1
   ```

4. Backend:

   ```powershell
   cd WebApi
   dotnet run
   ```

   **Development** ortamında:
   - `portaldb` yoksa otomatik oluşturulur
   - Tüm migration'lar otomatik uygulanır (son kayıt: `20260520120000_EnsurePortalSchemaComplete`)

Manuel migration komutu gerekmez; yine de isterseniz:

```powershell
dotnet tool restore
dotnet ef database update --project ..\DataAccess\DataAccess.csproj --startup-project WebApi.csproj --context PortalContext
```

## Yeni geliştirici (hiç DB yok)

1. PostgreSQL çalışsın, `appsettings.json` doğru olsun.
2. `cd WebApi` → `dotnet run`  
   Veritabanı ve tablolar ilk açılışta oluşur.

## Eski / yarım DB (migration geçmişi bozuk)

`Departments already exists` veya `ServiceArea does not exist` → önce **sıfırdan kurulum** adımları.  
Veri önemliyse: `EnsurePortalNewsAnnouncementPollSchema.sql` + `SyncPendingEfMigrations.sql` + `database update`.

## Son migration'lar (PortalContext)

| MigrationId | Açıklama |
|-------------|----------|
| `20260518120000_PollMultiQuestion` | Anket çoklu soru |
| `20260520120000_EnsurePortalSchemaComplete` | Portal şema doğrulama (idempotent) |

Tam liste: `dotnet ef migrations list --context PortalContext`
