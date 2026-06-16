# Masraf Paneli – Frontend Hata Çözümü (Normal Kullanıcı + Başkası Adına Masraf)

Bu doküman, **Masraf Paneli** sayfasında normal kullanıcı girişinde görülen **400** ve **500** hatalarının çözümü ile “kendi masraflarını görme” ve “başkası adına masraf oluşturma” için frontend’in yapması gerekenleri özetler.

---

## 1. Yapılan Backend Düzeltmeleri

- **GET /api/expense/my-expenses** eklendi. Normal kullanıcı giriş yaptığında kendi masraflarını bu endpoint ile alabilir. Sorgu parametresi: `PinnedFirst=true` (isteğe bağlı). Cevap: `{ "data": [ ... ] }`.
- **GET /api/Users/getuserlist** 500 hatası giderildi (GetAllForUserList içinde `SingleOrDefault` → `FirstOrDefault`). Endpoint sadece **admin** rolüne açık; admin kullanıcı listesini alabilir.

---

## 2. Frontend’in Yapması Gerekenler

### 2.1 Kendi masraflarını gösterme (Masraf Paneli – “Masraflarım”)

**Sorun:** `GET /api/expense/my-expenses?PinnedFirst=true` 400 veriyordu (endpoint yoktu).  
**Çözüm:** Backend artık bu URL’yi destekliyor. Yapmanız gerekenler:

1. **İstek URL’si:**  
   - **Kullanın:** `GET /api/expense/my-expenses?PinnedFirst=true`  
   - Base URL: `http://localhost:7295` veya `https://localhost:7295` (veya production API adresi).
2. **Header:** Her istekte `Authorization: Bearer <accessToken>` gönderin.
3. **Cevap:** `200 OK` ve body: `{ "data": [ ExpenseDto, ... ] }`.  
   - `data` boş dizi olabilir; bu durumda “Masraf kaydı bulunamadı” / “No expense record found” gösterin.
4. **Hata:** 400/401/500 durumunda response body’deki `message` (ve varsa `errors`) alanını kullanıcıya gösterin.

Böylece normal kullanıcı **kendi eklediği masrafları** Masraf Paneli’nde görebilir.

---

### 2.2 Başkası adına masraf oluşturma (sadece Admin)

**Davranış:** Backend’de **sadece admin** başka kullanıcı adına masraf ekleyebilir. Kullanıcı listesi de sadece admin için döner.

**Kullanıcı listesi (dropdown / select):**

1. **Endpoint:** `GET /api/Users/getuserlist`  
   - **Yetki:** Sadece **admin** rolü 200 alır. Normal kullanıcı **403 Forbidden** alır.
2. **Frontend mantığı:**
   - Sayfa açıldığında veya “Yeni Masraf Ekle” formu açıldığında:
     - Eğer kullanıcı **admin** ise → `GET /api/Users/getuserlist` çağırın; gelen listeyi “Kullanıcı seç” / “Masraf sahibi” dropdown’ında kullanın.
     - Eğer kullanıcı **admin değilse** → Bu isteği **hiç yapmayın** veya 403 gelirse hatayı bastırıp dropdown’ı göstermeyin / sadece “Kendi masraflarım” ile devam edin.
3. **403 / 500 durumu:**  
   - 403: “Kullanıcı listesi yetkiniz yok” gibi bir mesaj göstermeyin; sadece “başka kullanıcı seç” alanını gizleyin veya devre dışı bırakın.  
   - 500: Backend güncel; artık 500 beklenmemeli. Olursa `message` / `errors` ile kullanıcıya bilgi verin.

Böylece **admin** başka kullanıcı adına masraf oluşturabilir; normal kullanıcı sadece kendi adına masraf ekler ve kullanıcı listesi isteği 403 alsa da sayfa hata vermez.

---

### 2.3 Masraf ekleme (POST /api/expense/add)

- **userId:** Her zaman body’de gönderin.  
  - Normal kullanıcı: giriş yapan kullanıcının ID’si (kendi adına).  
  - Admin: kendi adına veya dropdown’dan seçilen kullanıcının ID’si (başkası adına).
- **400 cevabı:** Body’de `{ "message": "...", "errors": [] }` döner. `message`’ı kullanıcıya gösterin.

---

## 3. Özet Kontrol Listesi (Frontend)

- [ ] Masraf Paneli / “Masraflarım” listesi için **GET /api/expense/my-expenses?PinnedFirst=true** kullanılıyor.
- [ ] Tüm masraf ve kullanıcı isteklerinde **Authorization: Bearer &lt;token&gt;** header’ı gönderiliyor.
- [ ] **GET /api/Users/getuserlist** sadece admin için çağrılıyor; normal kullanıcıda çağrılmıyor veya 403 hatası zararsız şekilde ele alınıyor (dropdown gizleniyor / devre dışı).
- [ ] Masraf ekleme formunda admin için “Kullanıcı seç” alanı var; normal kullanıcıda yok veya sadece kendi adı gösteriliyor.
- [ ] 400/403/500 durumunda response’taki `message` (ve varsa `errors`) kullanıcıya gösteriliyor.

Bu adımlarla normal kullanıcı **kendi eklediği masrafları** görebilir; **admin** hem kendi hem **başkası adına** masraf oluşturabilir ve paneldeki 400/500 hataları giderilmiş olur.
