# Masraf fişi OCR (portal backend)

Tüm fiş okuma çağrıları **tek kanonik endpoint** üzerinden yapılır: sunucu arka planda Groq kullanır; istemcide Groq anahtarı tutulmaz.

---

## 1) Kanonik URL ve kimlik doğrulama

| Amaç | Method | Path (`host` sonrası) |
|------|--------|------------------------|
| Tekil fiş | `POST` | **`/api/expense/receipt/extract`** |
| Toplu fiş | `POST` | **`/api/expense/receipt/extract/bulk`** |

Tam URL: `{API_BASE}/api/expense/receipt/extract`

- **Auth:** `Authorization: Bearer <access_token>` (diğer masraf API’leri ile aynı).
- **Gövde:** `application/json` (varsayılan, dosya → önce JPEG’e küçültülür, `imageBase64` / `image_base64` / isteğe bağlı `imageData`) **veya** `multipart/form-data` (isteğe bağlı, aşağıda).

**Kullanılmaması gerekenler:** Eski WebApi rotaları (`/ReceiptExtract/OCR`, yanlış port `localhost:295`, vb.), ayrı “fiş mikroservis” URL’leri. Ağ sekmesinde yalnızca **`.../api/expense/receipt/extract`** görünmelidir.

Backend’de uyumluluk için `POST /api/external/receipt/extract` olabilir; frontend **yalnızca** `/api/expense/receipt/extract` kullanır.

---

## 2) API tabanı (env)

`src/Api/host.js` sırasıyla:

1. `REACT_APP_API_BASE_URL` (tercih edilen tek isim)
2. `REACT_APP_BACKEND_URL` (geriye dönük)

Örnek `.env.development`:

```env
REACT_APP_API_BASE_URL=https://localhost:7295
# veya
# REACT_APP_BACKEND_URL=https://localhost:7295
```

CRA kullanıldığı için prefix **`REACT_APP_`**’dir. Değişiklikten sonra `npm start` yeniden başlatılmalıdır.

---

## 3) İstemci modülü

Kod: **`src/containers/Expense/utils/receiptExtractApi.js`**

- **`extractReceipt(accessToken, input)`** — tek giriş noktası.  
  `input`: `{ file?, imageBase64?, imageData?, contentType?, signal?, onPhase? }`  
  Dönüş: `{ payload, ocrDurationMs }` — `payload` doğrudan `applyReceiptExtractionToForm` ile forma yazılır.

- **`postReceiptExtract`** / **`postReceiptVisionSingle`** — `extractReceipt` üzerinden; eski import’lar kırılmasın diye tutulur.

**Multipart (isteğe bağlı):**  
`REACT_APP_RECEIPT_EXTRACT_MULTIPART=true` ise dosya `POST .../receipt/extract` adresine `multipart/form-data` ile gider. Alan adı: `REACT_APP_RECEIPT_MULTIPART_FIELD` → `file` (varsayılan), `image` veya `receipt`.

---

## 4) Başarılı yanıt (200)

Örnek:

```json
{
  "data": {
    "invoice_number": "...",
    "invoice_date": "YYYY-MM-DD",
    "invoice_title": "...",
    "currency_code": "TRY",
    "description": "...",
    "items": [
      { "item_name": "...", "quantity": 1, "unit_price": 10.5, "kdv_rate": 10 }
    ],
    "total_amount": 0,
    "vat": 0,
    "excluding_vat_amount": 0,
    "vat_rate": 10
  },
  "ocr_duration_ms": 12345
}
```

`data` nesnesi **`mapReceiptExtractToForm.js`** içinde `applyReceiptExtractionToForm` / `mapReceiptExtractDataToFormPatch` ile forma uygulanır.

---

## 5) Hata (400)

Örnek gövde: `{ "message": "...", "code": "RECEIPT_AI_NOT_CONFIGURED", "errors": [] }`

UI metinleri `receiptExtractApi.js` → `RECEIPT_EXTRACT_ERROR_CODE_COPY_KEYS` ve `locales/tr/expense.json` / `locales/en/expense.json` (`expense.receiptExtractErr*`) ile eşlenir. Kodlar (örnek):

- `RECEIPT_AI_NOT_CONFIGURED` — sunucuda Groq / fiş okuma yapılandırması yok.
- `RECEIPT_AI_QUOTA` — kota veya hız sınırı.
- `RECEIPT_AI_PARSE`, `RECEIPT_AI_MAX_TOKENS`, `RECEIPT_AI_EMPTY_MODEL`, `EMPTY_IMAGE`, `MISSING_IMAGE`, …

---

## 6) Ekranlar

Aynı API ve aynı `extractReceipt` + `applyReceiptExtractionToForm` akışı:

- Yeni masraf (`ExpenseCreatePage`, `ExpenseFormFields`, `useExpenseListReceiptExtract`)
- Modal (`AddModal`)
- Revizyon / güncelleme (`UpdateDrawer` + defer extract)
- Tamamlanmamış / taslak: fiş değişince tetiklenen OCR sonrası `onReceiptExtractApplied` ile debounce’lu `upsert` (ilgili sayfa/hook’larda)

Toplu dosya: **`postReceiptExtractBulk`** → `/api/expense/receipt/extract/bulk`.

---

## 7) QA kontrol listesi

- Ağ: istek URL’si `.../api/expense/receipt/extract` (veya bulk).
- 401/403: token / yetki.
- 400: `code` ile çeviri anahtarı eşleşiyor mu.

Tarayıcı eklentisi `contentScript` kaynaklı hatalar fiş API’si değildir; asıl yanıt için **Network**’teki `receipt/extract` satırına bakın.
