import axios from "axios";
import { host } from "./host";
import SecureLS from "secure-ls";

function getStoredAccessToken() {
  try {
    const ls = new SecureLS({ encodingType: "aes" });
    const t = ls.get("accessToken");
    if (typeof t === "string" && t.trim()) return t.trim();
  } catch { }
  const t2 = localStorage.getItem("token") || localStorage.getItem("accessToken");
  return typeof t2 === "string" && t2.trim() ? t2.trim() : null;
}

function looksLikeJwt(token) {
  if (typeof token !== "string") return false;
  const t = token.trim();
  // JWT: header.payload.signature (en az 2 nokta)
  return t.length > 20 && t.split(".").length >= 3;
}

function authHeaders(explicitToken) {
  const token =
    typeof explicitToken === "string" && explicitToken.trim()
      ? explicitToken.trim()
      : getStoredAccessToken();
  if (!looksLikeJwt(token)) return {};
  return { Authorization: `Bearer ${token}` };
}

// USER getById
export const getUserById = (id) => {
  const headers = authHeaders();
  if (!headers.Authorization) {
    // Token yoksa network isteği atma (konsolda 401 kırmızısı oluşmasın).
    return Promise.reject({ response: { status: 401, data: { message: "Token gerekli" } } });
  }
  return axios.get(`${host}/api/Users/getById?id=${id}`, {
    headers,
  });
};

// USER
export const getUserByName = (name) => {
  const headers = authHeaders();
  if (!headers.Authorization) {
    return Promise.reject({ response: { status: 401, data: { message: "Token gerekli" } } });
  }
  return axios.get(`${host}/api/Users/getByName?name=${name}`, {
    headers,
  });
};

// User Ekleme
export const addUser = (user) => {
  return axios.post(`${host}/api/Auth/register`, user);
};

// user image değiştirme
export const ChangeUserImage = (formData) => {
  return axios.put(`${host}/api/users/changeImage`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// user image silme
export const DeleteUserImage = (userId) => {
  return axios.delete(`${host}/api/Users/removeImage?userId=${userId}`, {
    headers: authHeaders(),
  });
};

// kullanıcı ve ilişkili kayıtları kalıcı silme
export const HardDeleteUser = (userId) => {
  return axios.delete(`${host}/api/Users/hardDelete?userId=${userId}`, {
    headers: authHeaders(),
  });
};

// Rol Getirme
export const getRoles = () => {
  return axios.get(`${host}/api/UserRole/getAll`);
};

// User Listeleme – İstek mutlaka Authorization: Bearer <token> ile gider; token yoksa 401 (çağıran taraf istek atmaz).
export const UserListe = (accessToken) => {
  const headers = authHeaders(accessToken);
  if (!headers.Authorization) {
    return Promise.reject({ response: { status: 401, data: { message: "Token gerekli" } } });
  }
  return axios.get(`${host}/api/Users/getuserlist`, { headers });
};

// User Düzenleme için User bilgisi
export const UserDetail = (id, accessToken) => {
  const headers = authHeaders(accessToken);
  // Token yoksa / bozuksa, header override etme: axios.defaults Authorization çalışsın.
  // Böylece diğer endpoint'ler çalışıyorken sadece bu istek 401'e düşmez.
  const url = `${host}/api/Users/getById?id=${id}`;
  return headers.Authorization ? axios.get(url, { headers }) : axios.get(url);
};
// User düzenleme
export const UserEdit = (user) => {
  return axios.put(`${host}/api/Users/update`, user, {
    headers: authHeaders(),
  });
};
