import axios from "axios";
import { host } from "./host";

// Label
export const GetLabels = () => {
  return axios.get(`${host}/api/Labels/getall`);
};

export const AddLabel = (label) => {
  return axios.post(`${host}/api/Labels/add`, label);
};

export const EditLabel = (label) => {
  return axios.put(`${host}/api/Labels/update`, label);
};

export const DeleteLabel = (id) => {
  return axios.delete(`${host}/api/Labels/delete?labelId=${id}`);
};

// BoardCategories
export const GetBoardCategories = () => {
  return axios.get(`${host}/api/BoardCategories/getall`);
};

export const AddBoardCategories = (category) => {
  return axios.post(`${host}/api/BoardCategories/add`, category);
};

export const EditBoardCategories = (category) => {
  return axios.put(`${host}/api/BoardCategories/update`, category);
};

export const DeleteBoardCategories = (id) => {
  return axios.delete(
    `${host}/api/BoardCategories/delete?boardCategoryId=${id}`
  );
};

// ProjectTypes
export const GetProjectTypes = () => {
  return axios.get(`${host}/api/ProjectType/getList`);
};

export const AddProjectType = (type) => {
  return axios.post(`${host}/api/ProjectType/add`, type);
};

export const EditProjectType = (type) => {
  return axios.put(`${host}/api/ProjectType/update`, type);
};

export const DeleteProjectType = (id) => {
  return axios.delete(`${host}/api/ProjectType/delete?id=${id}`);
};

// PermissionTypes
export const GetPermissionTypes = () => {
  return axios.get(`${host}/api/PermissionType/getall`);
};

export const GetPermissionTypeById = (id) => {
  return axios.get(`${host}/api/PermissionType/getbyid?id=${id}`);
};

export const AddPermissionType = (permissionType) => {
  return axios.post(`${host}/api/PermissionType/add`, permissionType);
};

export const EditPermissionType = (permissionType) => {
  return axios.post(`${host}/api/PermissionType/update`, permissionType);
};

export const DeletePermissionType = (id) => {
  return axios.post(`${host}/api/PermissionType/delete?id=${id}`);
};
