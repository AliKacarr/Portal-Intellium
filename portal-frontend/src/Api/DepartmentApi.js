import axios from "axios";
import { host } from "./host";

export const GetAllDepartments = () => {
  return axios.get(`${host}/api/department/getAll`);
};

export const GetDepartmentById = (id) => {
  return axios.get(`${host}/api/department/getById?id=${id}`);
};
