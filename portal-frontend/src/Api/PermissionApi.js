import axios from "axios";
import { host } from "./host";

const noCacheAxiosConfig = {
  headers: {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  },
};

// 1. KULLANICI İZİN BAKİYESİNİ GETİRİR (Kartlar için)
export const getTicket = async (id) => {
  try {
    const response = await axios.get(
      `${host}/api/userPermission/getUserPermissionById`,
      {
        ...noCacheAxiosConfig,
        params: { id, _: Date.now() },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

/** Ücretli izin kuralları, bu yıl / toplam kırılımı ve kullanılan izin özeti */
export const getLeaveEntitlementExplanation = async (id) => {
  try {
    const response = await axios.get(
      `${host}/api/userPermission/getLeaveEntitlementExplanation`,
      {
        ...noCacheAxiosConfig,
        params: { id, _: Date.now() },
      }
    );
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

// 2. KULLANICININ ALDIĞI İZİNLERİ LİSTELER (Takvim için)
export const getPermissionsByUserId = async (userId) => {
  try {
    const response = await axios.get(
      `${host}/api/permission/getPermissionByUserId?userId=${userId}`
    );
    return response.data;
  } catch (error) {
    console.log("Kullanıcı izinleri hatası:", error);
  }
};

// 3. YENİ İZİN TALEP ETME (Form için)
export const newPermisson = async (
  userId,
  permissionType,
  address,
  email,
  phoneNumber,
  startTime,
  endTime,
  description,
  documentPath
) => {
  try {
    const response = await axios.post(`${host}/api/permission/add`, {
      userId,
      permissionType,
      address,
      email,
      phoneNumber,
      startTime,
      endTime,
      description,
      documentPath,
    });
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

// 4. TÜM İZİNLERİ GETİRİR (Admin listesi için)
export const getPermissions = async () => {
  try {
    const response = await axios.get(`${host}/api/permission/getPermission`);
    return response.data;
  } catch (error) {
    console.log(error);
  }
};

// 5. İZİN ONAYLAMA (Admin için)
export const confirmPermission = async (permissionId) => {
  try {
    const response = await axios.patch(
      `${host}/api/permission/confirmPermission?permissionId=${permissionId}`
    );
    return response.data;
  } catch (err) {
    console.log(err);
  }
};

// 6. İZİN REDDETME (Admin için)
export const refusePermission = async (permissionId, reason) => {
  try {
    const response = await axios.patch(
      `${host}/api/permission/declinePermission?permissionId=${permissionId}&reason=${reason}`
    );
    return response.data;
  } catch (err) {
    console.log(err);
  }
};

// 7. PDF OLUŞTURMA VE İNDİRME (GÜNCELLENDİ)
export const newPermissionPdf = async (permissionId) => {
  try {
    // Controller'daki yeni endpoint: api/permission/download-pdf/{id}
    const response = await axios.get(
      `${host}/api/permission/download-pdf/${permissionId}`,
      {
        responseType: "blob", // Binary veri (dosya) için zorunlu
        headers: {
          "Content-Type": "application/pdf",
        },
      }
    );
    return response;
  } catch (err) {
    console.log("PDF İndirme Hatası:", err);
    throw err; // Hatayı fırlat ki UI tarafında yakalayabilelim
  }
};

// 8. İZİN GÜNCELLEME (GÜNCELLENDİ: Dosya Desteği Eklendi)
export const updatePermission = async (formData) => {
  try {
    // Veri JSON değil, FormData olarak gidiyor.
    // Bu yüzden Content-Type: multipart/form-data olarak ayarlanmalı.
    const response = await axios.put(`${host}/api/permission/update`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (err) {
    console.log(err);
  }
};

/** Onay bekleyen kendi talebini iptal eder (kayıt silinir). */
export const cancelPendingPermission = async (userId, permissionId) => {
  const response = await axios.delete(`${host}/api/permission/cancelPending`, {
    params: { userId, permissionId },
  });
  return response.data;
};

// 9. TÜM KULLANICILARIN İZİN BAKİYELERİNİ GETİRİR (Admin panel için)
export const getAllUserPermissions = async () => {
  try {
    const response = await axios.get(`${host}/api/userPermission/getall`);
    return response.data;
  } catch (err) {
    console.log("getAllUserPermissions hatası:", err);
  }
};

// 10. ADMİN MANUEL BAKİYE GÜNCELLEMESİ (RecalculateFromJobAndProfile çağırmaz)
export const adminUpdateLeaveBalance = async (payload) => {
  try {
    const response = await axios.put(
      `${host}/api/userPermission/adminUpdateBalance`,
      payload
    );
    return response.data;
  } catch (err) {
    console.log("adminUpdateLeaveBalance hatası:", err);
    throw err; // Hata UI'da yakalanabilsin diye fırlatıyoruz
  }
};

/** Admin: tarih aralığında tüm izinler (kullanıcı + tip) — takvim. */
export const getAdminCalendarEvents = async (startDate, endDate) => {
  const s = startDate.toISOString().split("T")[0];
  const e = endDate.toISOString().split("T")[0];
  try {
    const response = await axios.get(
      `${host}/api/permission/adminCalendar?start=${s}&end=${e}`
    );
    return response.data;
  } catch (err) {
    console.log("getAdminCalendarEvents hatası:", err);
    throw err;
  }
};