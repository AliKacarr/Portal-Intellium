import actions from "./actions";
import SecureLS from "secure-ls";

const ls = new SecureLS({ encodingType: 'aes' });

const initialAccessToken = ls.get("accessToken") || null;

const initState = {
  id: Number(ls.get("id")) || null,
  name: ls.get("name") || null,
  // --- 1. BAŞLANGIÇ DEĞERİNE EMAIL EKLENDİ ---
  email: ls.get("email") || null, 
  imageUrl:
    ls.get("imageUrl") === "null"
      ? null
      : ls.get("imageUrl"),
  isActive: ls.get("isActive") || null,
  customer: ls.get("customer") ? JSON.parse(ls.get("customer")) : null,
  role: ls.get("role") ? JSON.parse(ls.get("role")) : null,
  jobTitle: ls.get("jobTitle") ? JSON.parse(ls.get("jobTitle")) : null,
  department: ls.get("department") || null,
  serviceArea: ls.get("serviceArea") || null,
  accessToken: initialAccessToken,
  refreshToken: ls.get("refreshToken") || null,
  expiration: ls.get("expiration") || null,
  // Refresh sonrası token varken "logout gibi" görünmeyi engelle.
  isLoggedIn: Boolean(ls.get("isLoggedIn") || initialAccessToken),
};

export default function authReducer(state = initState, action) {
  switch (action.type) {
    case actions.LOGIN: // Login başarılı olduğunda burası çalışır
      ls.set("id", action.payload.user.id);
      ls.set("name", action.payload.user.name);
      // --- 2. LOGIN OLUNCA EMAIL'İ KAYDET ---
      // Backend'den (AuthUserDto'dan) gelen email'i alıyoruz
      ls.set("email", action.payload.user.email); 
      
      ls.set("imageUrl", action.payload.user.imageUrl || "null");
      ls.set("isActive", action.payload.user.isActive);
      ls.set("customer", JSON.stringify(action.payload.user.customer));
      ls.set("role", JSON.stringify(action.payload.user.role));
      ls.set("jobTitle", JSON.stringify(action.payload.user.jobTitle));
      ls.set("department", action.payload.user.department || "");
      ls.set("serviceArea", action.payload.user.serviceArea || "");
      ls.set("accessToken", action.payload.user.accessToken);
      ls.set("refreshToken", action.payload.user.refreshToken);
      ls.set("expiration", action.payload.user.expiration);
      ls.set("isLoggedIn", true);
      
      return {
        ...state,
        ...action.payload.user,
        // State'i de güncelliyoruz
        email: action.payload.user.email, 
        isLoggedIn: true
      };
    case actions.LOGOUT:
      const persistedLanguage = localStorage.getItem("language");
      localStorage.clear();
      if (persistedLanguage) {
        localStorage.setItem("language", persistedLanguage);
      }
      document.location.reload();
      return initState;
    default:
      return state;
  }
}