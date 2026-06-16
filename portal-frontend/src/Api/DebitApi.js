// src/Api/DebitApi.js
import axios from "axios";
import { host } from "./host";

export const getAllDebits = async () => {
  return await axios.get(`${BASE_URL}/api/debit/getall`);
};

// PDF yolunu tam URL'e çeviren yardımcı fonksiyon (Bunu component içinde de yazabiliriz)
export const getPdfFullUrl = (relativePath) => {
  if (!relativePath) return null;
  return `${BASE_URL}${relativePath}`;
};