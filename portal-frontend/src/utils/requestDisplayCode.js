/** Talep kimliğinden tek satırda gösterilecek 8 karakterlik alfanümerik kod. */
const REQUEST_DISPLAY_CODE_ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export const formatRequestDisplayCode8 = (raw) => {
  const s = String(raw || "").trim();
  if (!s) return "—";
  const alnum = s.replace(/[^a-zA-Z0-9]/g, "");
  if (alnum.length >= 8) {
    return alnum.slice(-8).toUpperCase();
  }
  let out = alnum.toUpperCase();
  let x = 0;
  for (let i = 0; i < s.length; i += 1) {
    x = (x * 31 + s.charCodeAt(i)) >>> 0;
  }
  while (out.length < 8) {
    x = (x * 1664525 + 1013904223) >>> 0;
    out += REQUEST_DISPLAY_CODE_ALPHABET[x % REQUEST_DISPLAY_CODE_ALPHABET.length];
  }
  return out.slice(0, 8);
};

