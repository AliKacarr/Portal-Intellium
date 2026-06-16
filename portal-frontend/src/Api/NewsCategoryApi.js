import axios from "axios";
import { host } from "./host";

export const GetAllNewsCategories = () => {
  return axios.get(`${host}/api/NewsCategory/getAll`);
};

export const AddNewsCategory = (name, description = null) => {
  const params = new URLSearchParams({ name: String(name || "").trim() });
  if (description != null && String(description).trim())
    params.set("description", String(description).trim());
  return axios.post(`${host}/api/NewsCategory/add?${params.toString()}`);
};

export const UpdateNewsCategory = (id, name, description = null) => {
  const params = new URLSearchParams({
    id: String(id),
    name: String(name || "").trim(),
  });
  if (description != null && String(description).trim())
    params.set("description", String(description).trim());
  return axios.put(`${host}/api/NewsCategory/update?${params.toString()}`);
};

export const DeleteNewsCategory = (id) => {
  return axios.delete(`${host}/api/NewsCategory/delete?id=${id}`);
};

/** API yanıtından kategori listesi (Id/Name veya id/name). */
export function unwrapNewsCategoryList(res) {
  const data = res?.data?.data ?? res?.data ?? res;
  return Array.isArray(data) ? data : [];
}
