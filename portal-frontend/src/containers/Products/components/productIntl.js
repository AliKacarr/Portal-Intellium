/** Axios / ASP.NET BadRequest gövdesinden kullanıcı mesajı */
export function getProductApiErrorMessage(error, intl) {
  const data = error?.response?.data;
  if (!data) return error?.message || intl.formatMessage({ id: "products.errorGeneric" });
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (data.Message) return data.Message;
  const errs = data.errors;
  if (errs && typeof errs === "object") {
    const firstKey = Object.keys(errs)[0];
    const arr = errs[firstKey];
    if (Array.isArray(arr) && arr[0]) return arr[0];
  }
  return intl.formatMessage({ id: "products.errorGeneric" });
}

/** Backend sabit durum değerleri (Türkçe) → çeviri anahtarı */
export const PRODUCT_STATUS_KEYS = {
  Depoda: "products.statusDepoda",
  Zimmetli: "products.statusZimmetli",
  Tamirde: "products.statusTamirde",
  Hurda: "products.statusHurda",
};

