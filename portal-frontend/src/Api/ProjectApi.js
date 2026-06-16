import axios from "axios";
import { host } from "./host";

export const GetAllProject = () => {
  return axios.get(`${host}/api/Project/getAll`);
};
export const GetAllProjectAsBasic = () => {
return axios.get(`${host}/api/Project/getAllAsBasic`);
};
export const GetLeaderProjects = () => {
return axios.get(`${host}/api/Project/GetLeaderProjects`);
};

export const AddProject = (project) => {
  return axios.post(`${host}/api/Project/add`, project);
};

export const EditProject = (project) => {
  return axios.put(`${host}/api/Project/update`, project);
};

// kategoriler
export const GetCategories = () => {
  return axios.get(`${host}/api/ProjectType/getList`);
};

export const GetById = (id) => {
  return axios.get(`${host}/api/Project/getById?id=${id}`);
};

