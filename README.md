# Portal Intellium

Intellium Akademi için geliştirilen kurumsal portal uygulaması. İş takibi, izin yönetimi, masraf takibi, haberler ve daha fazlasını içerir.

Bu proje [Intellium Academy Portal Frontend](https://github.com/Intellium-Academy/portal-frontend) ve [Intellium Academy Portal Backend](https://github.com/Intellium-Academy/portal-backend) repolarından forklandı ve üzerinde geliştirmeler yapıldı.

## 🚀 Kullanılan Teknolojiler

### Backend
- **.NET 6.0** - Web API
- **C#** - Programlama dili
- **Entity Framework Core 7.0** - ORM
- **PostgreSQL** - Veritabanı
- **Autofac** - Dependency Injection
- **JWT Bearer** - Kimlik doğrulama
- **Quartz.NET** - Planlanmış görevler
- **QuestPDF** - PDF işlemleri

### Frontend
- **React 17** - Kullanıcı arayüzü
- **Redux** - Durum yönetimi
- **Ant Design** - UI kütüphanesi
- **React Router** - Yönlendirme
- **Formik** - Form yönetimi
- **Chart.js** - Grafikler

## 📦 Proje Yapısı

```
portal/
├── portal-backend/     # .NET 6.0 Backend API
│   ├── Business/       # İş katmanı
│   ├── Core/           # Çekirdek katman
│   ├── DataAccess/     # Veri erişim katmanı
│   ├── Entities/       # Varlıklar
│   └── WebApi/         # API projesi
└── portal-frontend/    # React Frontend
    └── src/            # Kaynak kodları
```

## ⚙️ Kurulum

### Gereksinimler
- [.NET 6.0 SDK](https://dotnet.microsoft.com/download)
- [Node.js](https://nodejs.org/)
- [PostgreSQL](https://www.postgresql.org/)

### Backend Kurulumu

1. PostgreSQL'da `portaldb` veritabanı oluşturun
2. `portal-backend/WebApi/appsettings.json` dosyasındaki bağlantı dizesini güncelleyin
3. Backend'i çalıştırın:
   ```bash
   cd portal-backend/WebApi
   dotnet run
   ```

### Frontend Kurulumu

1. Bağımlılıkları yükleyin:
   ```bash
   cd portal-frontend
   npm install
   ```
2. Frontend'i çalıştırın:
   ```bash
   npm start
   ```

## 👥 Kullanıcılar

Varsayılan kullanıcılar:
- `turgut.ozcelikyurek@intellium.com.tr` - Şifre: 1234
- `test.user@intellium.com.tr` - Şifre: 123456
- `admin2@intellium.com.tr` - Şifre: Admin!12345

## 📋 Özellikler

- ✅ Ana Sayfa (Dashboard)
- ✅ Bilet Yönetimi
- ✅ Proje Yönetimi
- ✅ Profil Yönetimi
- ✅ Scrum Board
- ✅ Kullanıcı Yönetimi
- ✅ Masraf Takibi
- ✅ Not Yönetimi
- ✅ Onay Süreçleri
- ✅ Tatil/Yıllık İzin Yönetimi
- ✅ Log Kayıtları
- ✅ Haberler, Duyurular ve Anketler

## 📝 Lisans

Bu proje Intellium Akademi için geliştirilmiştir.
Tüm hakları [Intellium Academy](https://github.com/Intellium-Academy/)'e aittir.