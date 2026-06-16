const REQUEST_TABLE_RADIUS = 8;

export const ui = {
  /** Taleplerim / admin talep tablolarında rozet ve aksiyon buton köşesi (yumuşak dikdörtgen) */
  requestTableRadius: REQUEST_TABLE_RADIUS,
  requestTagCellStyle: {
    width: 200,
    flexShrink: 0,
    minHeight: 30,
    marginInlineEnd: 0,
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    boxSizing: "border-box",
    paddingInline: 12,
    paddingBlock: 4,
    lineHeight: 1.25,
    whiteSpace: "normal",
    wordBreak: "break-word",
    // Ant Tag varsayılan margin/padding'i satır içi hizayı bozmasın
    margin: 0,
    borderRadius: REQUEST_TABLE_RADIUS,
  },
  /** Tag'lerin satır içinde dikey hizası için sarmalayıcı */
  requestTagCellWrap: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  /** Tablo hücresi içeriğini dikey ortala */
  requestCellCenter: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  /** Detay / Düzenle / İptal — eşit kutu */
  requestTableActionBtn: {
    minWidth: 108,
    height: 30,
    paddingInline: 10,
    fontSize: 13,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: REQUEST_TABLE_RADIUS,
  },
  /** Admin: uzun başlıklı aksiyon (Durum Değiştir) */
  requestTableActionBtnWide: {
    minWidth: 142,
    height: 30,
    paddingInline: 10,
    fontSize: 13,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: REQUEST_TABLE_RADIUS,
  },
  /** Admin filtre satırı: tablo aksiyonlarıyla aynı köşe ve satır yüksekliği */
  requestFilterBarBtn: {
    height: 30,
    paddingInline: 12,
    fontSize: 13,
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: REQUEST_TABLE_RADIUS,
  },
  /** Taleplerim / Admin: arama kutusu — satırda kompakt */
  requestListFilterSearch: {
    width: 260,
    maxWidth: "100%",
    flex: "none",
  },
  /** Durum/kategori seçicileri — geniş uzamasın (~yarı genişlik) */
  requestListFilterSelect: {
    width: 200,
    maxWidth: "100%",
    flex: "none",
  },
  page: {
    width: "100%",
    maxWidth: "none",
    padding: "0 24px 24px",
  },
  hero: {
    borderRadius: 18,
    padding: "18px 18px 14px",
    border: "1px solid rgba(226,232,240,0.9)",
    background:
      "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(16,185,129,0.06) 40%, rgba(255,255,255,1) 100%)",
    boxShadow: "0 14px 34px rgba(15, 23, 42, 0.08)",
  },
  heroTitle: { margin: 0, lineHeight: 1.15, letterSpacing: -0.2 },
  heroSub: { display: "block", marginTop: 2 },
  surface: {
    borderRadius: 18,
    border: "1px solid rgba(226,232,240,0.9)",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
  },
  toolbar: {
    padding: 14,
    background:
      "linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(248,250,252,1) 100%)",
  },
  pillBtn: { borderRadius: 999 },
  subtleBtn: {
    borderRadius: 999,
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(8px)",
  },
  tableWrap: { borderRadius: 18, overflow: "hidden" },
};

