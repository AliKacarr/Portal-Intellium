// src/Api/EmergencyContactApi.js
import axios from "axios";
import { host } from "./host";

/** Listele (Controller: GetAllByUserId(long id)) */
export const getEmergencyContactsByUserId = (userId) => {
  return axios.get(`${host}/api/EmergencyContact/GetAllByUserId?id=${userId}`);
};

/** Ekle (Controller: add(AddEmergencyContactDto body)) */
export const addEmergencyContact = (contact) => {
  // contact: { userId, fullName, relationShip, phoneNumber, workPhoneNumber, eMail, address }
  return axios.post(`${host}/api/EmergencyContact/add`, contact);
};

/** Güncelle (Controller: update(UpdateEmergencyContactDto body)) */
export const updateEmergencyContact = (contact) => {
  // contact: { id, userId, fullName, relationShip, phoneNumber, workPhoneNumber, eMail, address, isPrimary }
  return axios.put(`${host}/api/EmergencyContact/update`, contact);
};

/** Sil (Controller: delete(long id) [query]) */
export const deleteEmergencyContact = (id) => {
  return axios.delete(`${host}/api/EmergencyContact/delete?id=${id}`);
};

/** Birincil yap (Controller: change(long id) [query]) */
export const setPrimaryEmergencyContact = (id) => {
  return axios.put(`${host}/api/EmergencyContact/change?id=${id}`);
};
