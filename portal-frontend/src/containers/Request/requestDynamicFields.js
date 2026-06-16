/**
 * Talep Yönetimi: Backend seed (Program.cs) ile birebir alt kategori adları.
 * Eşleştirme için Türkçe yerel küçük harf kullanılır (İ/ı vb.).
 */

export function normalizeRequestKey(v) {
  return String(v ?? "")
    .normalize("NFC")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

/** Seed metni → normalize edilmiş anahtar */
function sk(seedLabel) {
  return normalizeRequestKey(seedLabel);
}

export function buildRequestDynamicFieldSpec(catRaw, subRaw) {
  const cat = normalizeRequestKey(catRaw);
  const sub = normalizeRequestKey(subRaw);

  if (!cat || !sub || sub === sk("Diğer")) return [];

  // ——— 1. İnsan Kaynakları ———
  if (cat === sk("İnsan Kaynakları")) {
    if (sub === sk("Çalışma Belgesi"))
      return [
        { key: "documentPurpose", label: "Belgenin Kullanım Amacı", required: true },
        { key: "recipientInstitution", label: "Hitaben / Alıcı Kurum", required: false },
        { key: "neededByDate", label: "İstenen Teslim Tarihi", required: false },
        { key: "language", label: "Dil Tercihi (varsa)", required: false },
      ];
    if (sub === sk("Maaş Bordrosu"))
      return [
        { key: "period", label: "Dönem (Ay/Yıl)", required: true },
        { key: "deliveryPreference", label: "Teslim Şekli (e-posta / kağıt)", required: false },
        { key: "notes", label: "Ek Not", required: false },
      ];
    if (sub === sk("SGK hizmet dökümü / işe giriş bildirgesi"))
      return [
        {
          key: "documentKind",
          label: "Belge Türü (SGK hizmet dökümü / işe giriş bildirgesi)",
          required: true,
        },
        { key: "period", label: "Dönem veya İlgili Tarih", required: false },
        { key: "notes", label: "Ek Bilgi", required: false },
      ];
    if (sub === sk("Fazla mesai bildirimi"))
      return [
        { key: "dateRange", label: "Mesai Tarih Aralığı", required: true },
        { key: "hoursTotal", label: "Toplam Süre (saat/gün)", required: true },
        { key: "projectOrDept", label: "Proje / Departman", required: false },
        { key: "taskSummary", label: "Yapılan İş Özeti", required: false },
      ];
    if (sub === sk("Konsolosluk yazısı talebi"))
      return [
        { key: "travelCountry", label: "Seyahat Edilecek Ülke", required: true },
        { key: "addressee", label: "Hangi Makama Hitaben Hazırlanacak", required: true },
        { key: "travelStart", label: "Seyahat Gidiş Tarihi", required: true },
        { key: "travelEnd", label: "Seyahat Dönüş Tarihi", required: true },
        { key: "passportNo", label: "Pasaport No", required: true },
      ];
    if (sub === sk("Yurtdışı görev yazısı"))
      return [
        { key: "destinationCountry", label: "Ülke / Şehir", required: true },
        { key: "hostOrganization", label: "Karşılayan Kurum / Müşteri", required: false },
        { key: "assignmentPurpose", label: "Görev Amacı", required: true },
        { key: "startDate", label: "Başlangıç Tarihi", required: true },
        { key: "endDate", label: "Bitiş Tarihi", required: false },
      ];
    if (sub === sk("Yurtdışı seyahat onayı"))
      return [
        { key: "destination", label: "Seyahat Destinasyonu", required: true },
        { key: "travelPurpose", label: "Seyahat Amacı", required: true },
        { key: "travelStart", label: "Gidiş Tarihi", required: true },
        { key: "travelEnd", label: "Dönüş Tarihi", required: false },
        { key: "estimatedBudgetHint", label: "Tahmini Masraf / Not", required: false },
      ];
    if (sub === sk("Yurtdışı eğitim/konferans katılım talebi"))
      return [
        { key: "eventName", label: "Eğitim / Konferans Adı", required: true },
        { key: "organizer", label: "Düzenleyen Kurum", required: false },
        { key: "location", label: "Yer (Şehir/Ülke)", required: true },
        { key: "startDate", label: "Başlangıç", required: true },
        { key: "endDate", label: "Bitiş", required: false },
        { key: "participationPurpose", label: "Katılım Amacı", required: true },
      ];
    if (sub === sk("Personel bilgi güncelleme"))
      return [
        { key: "fieldToUpdate", label: "Güncellenecek Alan (Adres / IBAN / vb.)", required: true },
        { key: "newValue", label: "Yeni Bilgi", required: true },
        {
          key: "addressDocNote",
          label: "Adres ise: Nüfus kayıtlı adres için e-devlet çıktısı yükleme alanı (evrakta)",
          required: false,
          multiline: true,
          rows: 2,
        },
      ];
    if (sub === sk("Aile bilgisi güncelleme"))
      return [
        { key: "familyMemberSummary", label: "Güncellenecek Aile Bilgisi Özeti", required: true },
        { key: "effectiveDate", label: "Geçerlilik / Talep Tarihi", required: false },
        { key: "notes", label: "Detay", required: false, multiline: true, rows: 3 },
      ];
    if (sub === sk("Askerlik durum güncelleme"))
      return [
        { key: "statusKind", label: "Durum (Terhis / Tecil / Diğer)", required: true },
        { key: "documentDate", label: "Belge / İşlem Tarihi", required: false },
        { key: "notes", label: "Açıklama", required: false, multiline: true, rows: 3 },
      ];
    if (sub === sk("Acil durum kişi bilgisi güncelleme"))
      return [
        { key: "contactFullName", label: "Ad Soyad", required: true },
        { key: "relation", label: "Yakınlık", required: true },
        { key: "phone", label: "Telefon", required: true },
        { key: "alternatePhone", label: "Yedek Telefon", required: false },
      ];
    if (sub === sk("Maaş yazısı (İngilizce/Türkçe)"))
      return [
        { key: "language", label: "Dil (İngilizce / Türkçe)", required: true },
        { key: "period", label: "Dönem", required: false },
        { key: "addressee", label: "Hitaben (varsa)", required: false },
        { key: "purpose", label: "Yazı Amacı", required: true },
      ];
    if (sub === sk("Çalışma belgesi (Resmi evrak)"))
      return [
        { key: "purpose", label: "Belge Talep Amacı", required: true },
        { key: "recipientInstitution", label: "Hitaben / Kurum Adı", required: false },
        { key: "employmentPeriodOnLetter", label: "Yazıda Geçecek Dönem / Pozisyon", required: false },
      ];
    if (sub === sk("Referans mektubu"))
      return [
        { key: "addresseeCompany", label: "Hitaben Kurum / Firma", required: true },
        { key: "targetRole", label: "Başvurulan Pozisyon / Program", required: false },
        { key: "toneLanguage", label: "Dil / Üslup Tercihi", required: false },
        { key: "deadline", label: "Son Tarih", required: false },
      ];
    if (sub === sk("SGK dökümü"))
      return [
        { key: "period", label: "İstenen Dönem", required: true },
        { key: "purpose", label: "Kullanım Amacı", required: false },
      ];
    if (sub === sk("İşten ayrılma yazısı"))
      return [
        { key: "lastWorkingDay", label: "Son Çalışma Günü", required: true },
        { key: "addressee", label: "Hitaben (varsa)", required: false },
        { key: "notes", label: "Ek Not", required: false },
      ];
    if (sub === sk("Deneyim belgesi"))
      return [
        { key: "employmentPeriod", label: "Çalışma Dönemi", required: true },
        { key: "roleTitle", label: "Ünvan / Görev", required: true },
        { key: "includeProjects", label: "Projeler / Başarılar (eklensin mi?)", required: false },
      ];
    if (sub === sk("İş seyahati planlama"))
      return [
        { key: "routeOrDestination", label: "Güzergah / Destinasyon", required: true },
        { key: "travelDates", label: "Seyahat Tarihleri", required: true },
        { key: "travelPurpose", label: "Seyahat Amacı", required: true },
        { key: "companions", label: "Katılımcılar", required: false },
      ];
    if (sub === sk("Uçak bileti talebi"))
      return [
        { key: "fromCity", label: "Kalkış Şehri / Havalimanı", required: true },
        { key: "toCity", label: "Varış Şehri / Havalimanı", required: true },
        { key: "dateTimePreference", label: "Tercih Edilen Tarih / Saat", required: true },
        { key: "flexibleDates", label: "Alternatif Tarihler", required: false },
        { key: "cabinPreference", label: "Kabin / Not", required: false },
      ];
    if (sub === sk("Otel rezervasyonu"))
      return [
        { key: "cityOrArea", label: "Şehir / Bölge", required: true },
        { key: "checkIn", label: "Giriş Tarihi", required: true },
        { key: "checkOut", label: "Çıkış Tarihi", required: true },
        { key: "guests", label: "Kişi Sayısı / Oda Tipi", required: true },
        { key: "budgetHint", label: "Bütçe / Tercih Notu", required: false },
      ];
    if (sub === sk("Araç kiralama"))
      return [
        { key: "pickupCity", label: "Alış Şehri / Lokasyon", required: true },
        { key: "rentalStart", label: "Kira Başlangıç", required: true },
        { key: "rentalEnd", label: "Kira Bitiş", required: true },
        { key: "vehicleClass", label: "Araç Sınıfı", required: false },
        { key: "drivers", label: "Sürücü Bilgisi", required: false },
      ];
    if (sub === sk("Etkinlik katılım talebi"))
      return [
        { key: "eventName", label: "Etkinlik Adı", required: true },
        { key: "eventDate", label: "Tarih", required: true },
        { key: "location", label: "Yer", required: false },
        { key: "registrationDeadline", label: "Kayıt Son Tarihi (varsa)", required: false },
        { key: "purpose", label: "Katılım Amacı", required: true },
      ];
  }

  // ——— 2. Bilgi Teknolojileri ———
  if (cat === sk("Bilgi Teknolojileri")) {
    if (sub === sk("Kullanıcı hesabı açma / kapatma"))
      return [
        { key: "fullName", label: "Ad Soyad", required: true },
        { key: "usernameOrEmail", label: "Kullanıcı Adı / Kurumsal E-posta", required: true },
        { key: "action", label: "İşlem (aç / kapat)", required: true },
        { key: "department", label: "Departman", required: false },
      ];
    if (sub === sk("Şifre sıfırlama"))
      return [
        { key: "usernameOrEmail", label: "Kullanıcı Adı / E-posta", required: true },
        { key: "system", label: "Sistem / Uygulama", required: false },
        { key: "contactChannel", label: "İletişim Tercihi", required: false },
      ];
    if (sub === sk("E-posta hesabı"))
      return [
        { key: "requestedAddress", label: "İstenen E-posta Adresi / Alias", required: true },
        { key: "action", label: "İşlem (yeni / kapama / grup vb.)", required: true },
        { key: "mailboxQuotaHint", label: "Kota / Özel İhtiyaç", required: false },
      ];
    if (sub === sk("Yazılım kurulum"))
      return [
        { key: "softwareName", label: "Yazılım Adı ve Sürüm", required: true },
        { key: "machineName", label: "Kurulacak Bilgisayar / Kullanıcı", required: true },
        { key: "purpose", label: "İş Gerekçesi", required: true },
      ];
    if (sub === sk("Donanım arıza bildirimi"))
      return [
        { key: "assetTagOrSerial", label: "Demirbaş / Seri No (varsa)", required: false },
        { key: "deviceType", label: "Cihaz Türü", required: true },
        { key: "symptom", label: "Arıza Belirtisi", required: true },
        { key: "location", label: "Lokasyon", required: true },
      ];
    if (sub === sk("Yetki / rol"))
      return [
        { key: "system", label: "Sistem / Uygulama", required: true },
        { key: "requestedRole", label: "İstenen Rol / Yetki Seti", required: true },
        { key: "justification", label: "Gerekçe", required: true },
        { key: "duration", label: "Süre (kalıcı / geçici)", required: false },
      ];
    if (sub === sk("Lisans"))
      return [
        { key: "productOrSku", label: "Ürün / SKU / Publisher", required: true },
        { key: "seatCount", label: "Lisans Adedi / Süre", required: true },
        { key: "costCenterOrProject", label: "Proje / Masraf Yeri", required: false },
        { key: "purpose", label: "Kullanım Amacı", required: true },
      ];
    if (sub === sk("Yazıcı / ağ / internet problemi"))
      return [
        { key: "problemType", label: "Tür (yazıcı / ağ / internet)", required: true },
        { key: "location", label: "Lokasyon / IP / Makine", required: true },
        { key: "symptom", label: "Sorun Tanımı", required: true },
        { key: "startedWhen", label: "Ne Zamandan Beri?", required: false },
      ];
  }

  // ——— 3. İdari İşler ———
  if (cat === sk("İdari İşler")) {
    if (sub === sk("Ofis malzemesi talebi"))
      return [
        { key: "deliveryLocation", label: "Teslim Lokasyonu", required: true },
        { key: "itemsList", label: "Malzeme Listesi", required: true, multiline: true, rows: 4 },
        { key: "urgency", label: "Öncelik", required: false },
      ];
    if (sub === sk("Toplantı odası düzenleme talebi"))
      return [
        { key: "dateTime", label: "Tarih ve Saat", required: true },
        { key: "durationMinutes", label: "Süre (dk)", required: false },
        { key: "roomPreference", label: "Oda / Kat Tercihi", required: false },
        { key: "layoutNeeds", label: "Düzen (U masa / teatro vb.)", required: false },
        { key: "cateringAvNeeds", label: "İkram / Ses-Görüntü İhtiyacı", required: false, multiline: true, rows: 2 },
      ];
    if (sub === sk("Araç / servis / otopark"))
      return [
        { key: "requestKind", label: "Talep Türü (servis / şirket aracı / otopark)", required: true },
        { key: "pickupPoint", label: "Alış Noktası", required: true },
        { key: "dropPoint", label: "Bırakış Noktası", required: true },
        { key: "dateTime", label: "Tarih / Saat", required: true },
        { key: "passengerCount", label: "Yolcu Sayısı", required: false },
      ];
    if (sub === sk("Kargo / kurye"))
      return [
        { key: "contentSummary", label: "Gönderi İçeriği", required: true },
        { key: "pickupAddress", label: "Toplama Adresi", required: true },
        { key: "deliveryAddress", label: "Teslim Adresi", required: true },
        { key: "dimensionsWeight", label: "Boyut / Ağırlık (varsa)", required: false },
        { key: "insuredValue", label: "Bedelli / Sigorta (varsa)", required: false },
      ];
    if (sub === sk("Temizlik / bakım bildirimi"))
      return [
        { key: "location", label: "Lokasyon / Kat / Oda", required: true },
        { key: "issueType", label: "Konu (temizlik / arıza / hijyen)", required: true },
        { key: "description", label: "Tanım", required: true, multiline: true, rows: 3 },
        { key: "priority", label: "Öncelik", required: false },
      ];
  }

  // ——— 4. Finans / Muhasebe ———
  if (cat === sk("Finans/Muhasebe")) {
    if (sub === sk("Avans talebi"))
      return [
        {
          key: "advanceType",
          label: "Avans Türü (Maaş Avansı / İş Avansı / Seyahat Avansı)",
          required: true,
        },
        { key: "amount", label: "Tutar ve Para Birimi", required: true },
        {
          key: "advanceRulesAck",
          label:
            "Türüne göre bilgi: Maaş avansı — maaştan kesilir; İş avansı — harcama sonrası fatura ile kapatılır; Seyahat avansı — harcırah/yurtdışı günlük bazlı. Lütfen kısa özet yazın.",
          required: true,
          multiline: true,
          rows: 3,
        },
        {
          key: "travelDetailsIfAny",
          label: "Seyahat avansı ise: ülke/şehir, tarihler, günlük tahmini",
          required: false,
          multiline: true,
          rows: 2,
        },
      ];
    if (sub === sk("Vergi / bordro açıklama"))
      return [
        { key: "topic", label: "Konu Başlığı", required: true },
        { key: "period", label: "İlgili Dönem", required: true },
        { key: "questionDetail", label: "Soru / Açıklama Talebi", required: true, multiline: true, rows: 4 },
      ];
  }

  // ——— 5. Satın Alma ———
  if (cat === sk("Satın Alma")) {
    if (sub === sk("Yazılım lisansı satın alma"))
      return [
        { key: "productName", label: "Ürün / Publisher", required: true },
        { key: "licenseModel", label: "Lisans Modeli (kullanıcı / Concurrent vb.)", required: true },
        { key: "quantity", label: "Adet / Süre", required: true },
        { key: "budgetReference", label: "Bütçe / Proje Kodu", required: false },
      ];
    if (sub === sk("Donanım satın alma"))
      return [
        { key: "itemSpec", label: "Teknik Özellik / Model", required: true, multiline: true, rows: 3 },
        { key: "quantity", label: "Adet", required: true },
        { key: "preferredVendor", label: "Tedarikçi Tercihi", required: false },
      ];
    if (sub === sk("Eğitim / danışmanlık satın alma"))
      return [
        { key: "serviceScope", label: "Hizmet Kapsamı", required: true, multiline: true, rows: 3 },
        { key: "vendorCandidate", label: "Önerilen Sağlayıcı", required: false },
        { key: "duration", label: "Süre / Gün Sayısı", required: false },
      ];
    if (sub === sk("Ofis ekipmanı satın alma"))
      return [
        { key: "items", label: "Ürün Listesi", required: true, multiline: true, rows: 4 },
        { key: "deliverySite", label: "Teslim Yeri", required: true },
        { key: "quantityNotes", label: "Adet / Özellik Notları", required: false },
      ];
    if (sub === sk("Abonelik talebi"))
      return [
        { key: "serviceName", label: "Servis / Platform Adı", required: true },
        { key: "billingCycle", label: "Faturalama (aylık/yıllık)", required: true },
        { key: "userSeatCount", label: "Kullanıcı / Kontör", required: false },
        { key: "businessReason", label: "İş Gerekçesi", required: true },
      ];
  }

  // ——— 6. Hukuk / KVKK / Uyum ———
  if (cat === sk("Hukuk/KVKK/Uyum")) {
    if (sub === sk("KVKK aydınlatma / açık rıza talebi"))
      return [
        { key: "requestNature", label: "Talep Türü (aydınlatma metni / açık rıza vb.)", required: true },
        { key: "dataSubjectContext", label: "İlgili Süreç / Kişi Grubu", required: false },
        { key: "deadline", label: "Hedef Tarih", required: false },
      ];
    if (sub === sk("Gizlilik sözleşmesi talebi"))
      return [
        { key: "counterparty", label: "Karşı Taraf / Firma", required: true },
        { key: "contractPurpose", label: "Sözleşme Amacı", required: true },
        { key: "ndaTemplate", label: "Şablon / Önceki Örnek (varsa)", required: false },
      ];
    if (sub === sk("Veri silme / düzeltme talebi"))
      return [
        { key: "requestType", label: "İşlem (silme / düzeltme)", required: true },
        { key: "dataDescription", label: "Hangi Veriler", required: true, multiline: true, rows: 3 },
        { key: "relatedSystems", label: "İlgili Sistem / Süreç", required: false },
      ];
  }

  // ——— 7. Proje / Ar-Ge ———
  if (cat === sk("Proje/Ar-Ge")) {
    if (sub === sk("Yeni proje fikri bildirimi"))
      return [
        { key: "ideaTitle", label: "Fikir Başlığı", required: true },
        { key: "problemStatement", label: "Problem / Fırsat", required: true, multiline: true, rows: 3 },
        { key: "expectedOutcome", label: "Beklenen Çıktı", required: false, multiline: true, rows: 2 },
      ];
    if (sub === sk("Ar-Ge önerisi"))
      return [
        { key: "researchArea", label: "Ar-Ge Alanı / Teknoloji", required: true },
        { key: "hypothesisOrApproach", label: "Önerilen Yaklaşım", required: true, multiline: true, rows: 4 },
        { key: "resourcesNeeded", label: "Kaynak İhtiyacı", required: false },
      ];
    if (sub === sk("Ürün geliştirme talebi"))
      return [
        { key: "productOrModule", label: "Ürün / Modül", required: true },
        { key: "featureScope", label: "Kapsam", required: true, multiline: true, rows: 4 },
        { key: "priority", label: "Öncelik", required: false },
      ];
    if (sub === sk("Test ortamı talebi"))
      return [
        { key: "applicationName", label: "Uygulama / Servis", required: true },
        { key: "environmentSpecs", label: "Ortam Özellikleri (DB, versiyon vb.)", required: true, multiline: true, rows: 3 },
        { key: "vpnAccessNeeded", label: "VPN / Erişim Notları", required: false },
      ];
    if (sub === sk("API erişim talebi"))
      return [
        { key: "apiOrIntegration", label: "API / Entegrasyon Adı", required: true },
        { key: "consumerSystem", label: "Tüketici Sistem / Proje", required: true },
        { key: "scopesNeeded", label: "İstenen Endpoint / Kapsam", required: true, multiline: true, rows: 3 },
        { key: "environment", label: "Ortam (test/prod)", required: false },
      ];
    if (sub === sk("Demo ortamı talebi"))
      return [
        { key: "demoAudience", label: "Demo Hedef Kitlesi", required: true },
        { key: "scenario", label: "Senaryo", required: true, multiline: true, rows: 3 },
        { key: "scheduleHint", label: "Tarih / Süre Tercihi", required: false },
      ];
    if (sub === sk("Teknik dokümantasyon talebi"))
      return [
        { key: "documentSubject", label: "Dokümantasyon Konusu", required: true },
        { key: "preferredFormat", label: "Format (Wiki/PDF/Confluence vb.)", required: false },
        { key: "detailLevel", label: "Detay Seviyesi", required: false },
      ];
  }

  // ——— 8. Genel Talep / Diğer ———
  if (cat === sk("Genel Talep / Diğer")) {
    if (sub === sk("Genel öneri"))
      return [
        { key: "proposalTitle", label: "Öneri Başlığı", required: true },
        { key: "benefitArea", label: "Fayda Alanı (maliyet/kalite/hız vb.)", required: true },
        { key: "proposalDetail", label: "Öneri Detayı", required: true, multiline: true, rows: 4 },
      ];
    if (sub === sk("Şikayet / geri bildirim"))
      return [
        { key: "subject", label: "Konu", required: true },
        { key: "whenOccurred", label: "Ne Zaman / Nerede", required: true },
        { key: "description", label: "Detaylı Açıklama", required: true, multiline: true, rows: 5 },
        { key: "expectedResolution", label: "Beklentiniz", required: false },
      ];
    if (sub === sk("Süreç iyileştirme önerisi"))
      return [
        { key: "processName", label: "Süreç Adı", required: true },
        { key: "currentPain", label: "Mevcut Sorun", required: true, multiline: true, rows: 3 },
        { key: "improvementIdea", label: "İyileştirme Önerisi", required: true, multiline: true, rows: 4 },
      ];
    if (sub === sk("Kurum içi duyuru talebi"))
      return [
        { key: "announcementTitle", label: "Duyuru Başlığı", required: true },
        { key: "targetAudience", label: "Hedef Kitle / Kanallar", required: true },
        { key: "publishDate", label: "Yayın Tarihi Tercihi", required: false },
        { key: "contentDraft", label: "Metin Taslağı", required: true, multiline: true, rows: 5 },
      ];
    if (sub === sk("Organizasyon talebi"))
      return [
        { key: "eventType", label: "Organizasyon Türü", required: true },
        { key: "estimatedGuests", label: "Tahmini Katılımcı", required: false },
        { key: "preferredDates", label: "Tarih Tercihleri", required: true },
        { key: "requirements", label: "İhtiyaçlar (mekân, ikram, teknik)", required: true, multiline: true, rows: 4 },
      ];
  }

  return [];
}

export function getRequestAttachmentPolicy(catRaw, subRaw) {
  const cat = normalizeRequestKey(catRaw);
  const sub = normalizeRequestKey(subRaw);
  const base = { required: false, hintKey: undefined };
  if (!cat || !sub || sub === sk("Diğer")) return base;

  if (cat === sk("İnsan Kaynakları")) {
    if (sub === sk("Askerlik durum güncelleme"))
      return {
        required: true,
        hintKey: "request.attachmentHint.askerlik",
      };
    if (sub === sk("Personel bilgi güncelleme"))
      return {
        required: true,
        hintKey: "request.attachmentHint.personelAdres",
      };
  }

  return base;
}
