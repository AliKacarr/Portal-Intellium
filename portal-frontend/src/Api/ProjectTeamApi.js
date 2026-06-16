import axios from "axios";
import { host } from "./host";

// Proje Ekibi Ekleme
export const AddProjectTeam = (project) => {
  return axios.post(`${host}/api/ProjectTeams/add`, project);
};

// Proje Ekibi Listeleme
export const GetProjectTeams = () => {
    return axios.get(`${host}/api/ProjectTeams/getall`);
};
// Proje Ekibi Listeleme
export const GetAllByProject = (id) => {
  return axios.get(`${host}/api/ProjectTeams/getallbyproject?projectId=${id}`);
};

// Proje Ekibi ID'ye göre gösterme
export const GetTeamsById = (id) => {
  return axios.get(`${host}/api/ProjectTeams/getbyid?id=${id}`);
};

// Proje Ekibi Düzenleme
export const EditProjectTeam = (project) => {
  return axios.put(`${host}/api/ProjectTeams/update`, project);
};

// Proje Ekibi Silme
export const DeleteProjectTeam = (id) => {
  return axios.delete(`${host}/api/ProjectTeams/delete?id=${id}`);
};
