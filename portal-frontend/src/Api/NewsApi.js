import axios from "axios";
import { host } from "./host";

export const GetAllNews = (publishedOnly = true) => {
  return axios.get(`${host}/api/news/getAll?publishedOnly=${publishedOnly}`);
};

export const GetNewsById = (id, skipIncrement = false) => {
  const params = new URLSearchParams({ id: String(id) });
  if (skipIncrement) params.set("skipIncrement", "true");
  return axios.get(`${host}/api/news/getById?${params.toString()}`);
};

export const GetNewsByDepartment = (departmentId) => {
  return axios.get(`${host}/api/news/getByDepartment?departmentId=${departmentId}`);
};

export const CreateNews = (data) => {
  return axios.post(`${host}/api/news/add`, data);
};

/** Yerel görsel ile haber oluşturma (multipart/form-data). */
export const CreateNewsMultipart = (formData) => {
  return axios.post(`${host}/api/news/addForm`, formData);
};

export const UpdateNews = (data) => {
  return axios.put(`${host}/api/news/update`, data);
};

/** Yerel görsel ile haber güncelleme (multipart/form-data). */
export const UpdateNewsMultipart = (formData) => {
  return axios.put(`${host}/api/news/updateForm`, formData);
};

export const DeleteNews = (id) => {
  return axios.delete(`${host}/api/news/delete?id=${id}`);
};

export const GetNewsByNewsId = (newsId) => {
  return axios.get(`${host}/api/news/comments/getByNews?newsId=${newsId}`);
};

export const AddNewsComment = (data) => {
  return axios.post(`${host}/api/news/comments/add`, data);
};

export const DeleteNewsComment = (id) => {
  return axios.delete(`${host}/api/news/comments/delete?id=${id}`);
};

export const GetNewsViewers = (id) => {
  return axios.get(`${host}/api/news/viewers?id=${id}`);
};
