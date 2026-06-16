import axios from "axios";
import { host } from "./host";
import SecureLS from "secure-ls";

function authHeaders() {
  try {
    const ls = new SecureLS({ encodingType: "aes" });
    const token = ls.get("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export const GetUserJobDetailByUserId = (id) => {
  return axios.get(`${host}/api/UserJobDetail/getByUserId?id=${id}`, {
    headers: authHeaders(),
  });
};

export const GetMyUserJobDetail = () => {
  return axios.get(`${host}/api/UserJobDetail/me`, {
    headers: authHeaders(),
  });
};
