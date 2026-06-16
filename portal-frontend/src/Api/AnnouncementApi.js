import axios from "axios";
import { host } from "./host";

export const GetAllAnnouncements = () => {
  return axios.get(`${host}/api/announcement/getAll`);
};

export const GetAnnouncementById = (id) => {
  return axios.get(`${host}/api/announcement/getById?id=${id}`);
};

export const GetActiveAnnouncements = (departmentId, serviceArea) => {
  const params = new URLSearchParams();
  if (departmentId != null && departmentId !== "") params.set("departmentId", String(departmentId));
  if (serviceArea) params.set("serviceArea", String(serviceArea));
  const q = params.toString();
  return axios.get(`${host}/api/announcement/getActive${q ? `?${q}` : ""}`);
};

export const CreateAnnouncement = (data) => {
  return axios.post(`${host}/api/announcement/add`, data);
};

export const UpdateAnnouncement = (data) => {
  return axios.put(`${host}/api/announcement/update`, data);
};

export const DeleteAnnouncement = (id) => {
  return axios.delete(`${host}/api/announcement/delete?id=${id}`);
};

export const GetAnnouncementViewers = (id) => {
  return axios.get(`${host}/api/announcement/viewers?id=${id}`);
};
