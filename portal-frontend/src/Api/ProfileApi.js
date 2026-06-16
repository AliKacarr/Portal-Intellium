import axios from "axios";
import { host } from "./host";

// USER bilgisi add
export const addProfileDetail = (profile) => {
  return axios.post(`${host}/api/UserProfileDetail/add`, profile);
};

// User Düzenleme için User bilgisi
export const UserProfileDetail = (id) => {
  return axios.get(`${host}/api/UserProfileDetail/getByUserId/${id}`);
};

// User profil detayı düzenleme
export const UserProfileEdit = (formData) => {
  return axios.put(`${host}/api/UserProfileDetail/update`, formData);
};

// USER Profile and contact detail
export const getProfileByUserId = (userId) => {
  return axios.get(`${host}/api/UserProfileDetail/getByUserId/${userId}`);
};

// USER Basic Profile detail
export const getProfileUserBasic = () => {
  return axios.get(`${host}/api/UserProfileDetail/getBasicProfilDetail`);
};
// USER Job add
export const addUserJob = (job) => {
  return axios.post(`${host}/api/UserJobDetail/add`, job);
};

// USER Job edit
export const UserJobEdit = (formData) => {
  return axios.put(`${host}/api/UserJobDetail/update`, formData);
};

// USER Job detail
export const getJobByUserId = (userId) => {
  return axios.get(`${host}/api/UserJobDetail/getByUserId?id=${userId}`);
};

// USER Education detail
export const getEduByUserId = (userId) => {
  return axios.get(`${host}/api/UserEducationDetail/getByUserId?id=${userId}`);
};

// USER Education add
export const addEducation = (edu) => {
  return axios.post(`${host}/api/UserEducationDetail/add`, edu);
};
// USER Education Silme
export const deleteEducation = (id) => {
  return axios.delete(`${host}/api/UserEducationDetail/delete?id=${id}`);
};

// USER Job Experience detail
export const getJobExperienceByUserId = (userId) => {
  return axios.get(
    `${host}/api/UserJobExperiences/getAllByUserId?userId=${userId}`
  );
};
// USER Job Experience add
export const addJobExperience = (job) => {
  return axios.post(`${host}/api/UserJobExperiences/add`, job);
};
// USER Job Experience Silme
export const deleteJobExperience = (id) => {
  return axios.delete(`${host}/api/UserJobExperiences/delete?id=${id}`);
};
// USER Language detail
export const getLanguageByUserId = (userId) => {
  return axios.get(`${host}/api/UserLanguageDetail/getByUserId?id=${userId}`);
};
// USER Language add
export const addLanguage = (lang) => {
  return axios.post(`${host}/api/UserLanguageDetail/add`, lang);
};
// USER Language Silme
export const deleteLanguage = (id) => {
  return axios.delete(`${host}/api/UserLanguageDetail/delete?id=${id}`);
};

// USER Job edit
export const addUserCertificate = (formData) => {
  return axios.post(`${host}/api/UserCertificateDetail/add`, formData);
};

// USER Certificate detail
export const getCertificateByUserId = (userId) => {
  return axios.get(
    `${host}/api/UserCertificateDetail/getByUserId?id=${userId}`
  );
};
// USER Certificate Silme
export const deleteCertificate = (id) => {
  return axios.delete(`${host}/api/UserCertificateDetail/delete?id=${id}`);
};

// USER Family detail
export const getFamilyByUserId = (userId) => {
  return axios.get(`${host}/api/UserFamilyDetail/getByUserId?id=${userId}`);
};
// USER Family add
export const addFamily = (family) => {
  return axios.post(`${host}/api/UserFamilyDetail/add`, family);
};
// USER Family Silme
export const deleteFamily = (id) => {
  return axios.delete(`${host}/api/UserFamilyDetail/delete?id=${id}`);
};
