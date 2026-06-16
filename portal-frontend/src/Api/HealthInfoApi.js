import axios from "axios";
import { host } from "./host"; // host dosyasının doğru yerde olduğundan emin ol
import SecureLS from "secure-ls";

const API_URL = `${host}/api/HealthInfos`;

const getAuthHeaders = () => {
  let secureToken;
  try {
    const ls = new SecureLS({ encodingType: "aes" });
    secureToken = ls.get("accessToken");
  } catch {
    secureToken = undefined;
  }

  const token =
    secureToken ||
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    (() => {
      try {
        const u = JSON.parse(localStorage.getItem("user") || "{}");
        return u?.accessToken;
      } catch {
        return undefined;
      }
    })();

  return token ? { Authorization: `Bearer ${token}` } : {};
};

const axiosAuth = () =>
  axios.create({
    baseURL: host,
    headers: getAuthHeaders(),
  });

// Admin paneli için TÜM kayıtları getirir
export const getAllHealthInfoWithUser = () => {
  return axiosAuth().get(`/api/HealthInfos/getall`);
};

// Admin paneli için TEK bir kaydı ID ile getirir (Düzenleme sayfası için)
export const getHealthInfoByIdWithUser = (id) => {
  return axiosAuth().get(`/api/HealthInfos/getbyidwithuser`, { params: { id } });
};

// Yeni kayıt ekler (FormData ile)
export const addHealthInfo = (formData) => {
  // Axios FormData gönderirken Content-Type'ı otomatik ve doğru şekilde ayarlar.
  // Manuel eklemek (özellikle boundary olmadan) sorun çıkarabilir.
  return axiosAuth().post(`/api/HealthInfos/add`, formData);
};

// Mevcut kaydı günceller (FormData ile)
export const updateHealthInfo = (formData) => {
  // Axios FormData gönderirken Content-Type'ı otomatik ve doğru şekilde ayarlar.
  return axiosAuth().put(`/api/HealthInfos/update`, formData);
};

// Kaydı siler
export const deleteHealthInfoById = (id) => {
  return axiosAuth().delete(`/api/HealthInfos/delete`, { params: { id } });
};

// AI ile poliçe dosyası parse et (IntelliumAI Backend)
const AI_BACKEND_URL = "http://localhost:8000";
export const parseHealthInfoWithAI = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return axios.post(`${AI_BACKEND_URL}/policy/parse`, formData);
};

// Kullanıcının kendi bilgilerini getiren fonksiyon
export const getHealthInfoById = async (userId) => {
  try {
    const response = await axiosAuth().get(`/api/HealthInfos/getallbyuserid`, {
      params: { userId },
    });
    return response.data;
  } catch (error) {
    console.error("Kullanıcı sağlık bilgileri alınırken hata:", error);
    return { success: false, message: error.message, data: [] };
  }
};