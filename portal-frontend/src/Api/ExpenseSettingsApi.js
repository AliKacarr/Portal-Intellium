import axios from "axios";
import { host } from "./host";

export const getExpenseSettingsApi = () => {
  return axios.get(`${host}/api/ExpenseSettings`);
};

export const updateExpenseSettingsApi = (data, config = {}) => {
  return axios.put(`${host}/api/ExpenseSettings`, data, config);
};

