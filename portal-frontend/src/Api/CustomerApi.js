import axios from "axios";
import { host } from "./host";

export const AddCustomer = (customer) => {
  return axios.post(`${host}/api/Customer/add`, customer);
};

// Customer Düzenleme için User bilgisi
export const GetCustomerById = (customerId) => {
  return axios.get(`${host}/api/Customer/getById?id=${customerId}`);
};

// Customer düzenleme
export const CustomerEdit = (customer) => {
  return axios.put(`${host}/api/Customer/update`, customer);
};

export const GetAllCustomerAsBasic = () => {
  return axios.get(`${host}/api/Customer/getallasbasic`);
};
export const GetAllCustomerAsRaw = () => {
  return axios.get(`${host}/api/Customer/getallasraw`);
};
