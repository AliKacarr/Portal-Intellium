import axios from "axios";
import { host } from "./host";

export const CreateHoliday = (data) => {
  return axios.post(`${host}/api/holiday/add`, data);
};
export const UpdateHoliday = (data) => {
  return axios.put(`${host}/api/holiday/update`, data);
};
export const DeleteHoliday = (id) => {
  return axios.delete(`${host}/api/holiday/delete?id=${id}`);
};
export const GetAllHoliday = () => {
  return axios.get(`${host}/api/holiday/getall`);
};
export const GenerateHolidays = async (year) => {
  return await axios.post(`${host}/api/holiday/generateHolidays?year=${year}`);
};
