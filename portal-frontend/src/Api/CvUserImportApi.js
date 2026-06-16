import axios from "axios";
import { host } from "./host";

export const uploadCvUserImport = (files) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file.originFileObj || file);
  });

  return axios.post(`${host}/api/CvUserImports/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getCvUserImportBatch = (batchId) => {
  return axios.get(`${host}/api/CvUserImports/batch/${batchId}`);
};

export const getCvUserImportItems = () => {
  return axios.get(`${host}/api/CvUserImports/mine`);
};

export const createUsersFromCvImport = (payload) => {
  return axios.post(`${host}/api/CvUserImports/create-users`, payload);
};

export const deleteCvUserImportItems = (payload) => {
  return axios.post(`${host}/api/CvUserImports/delete-items`, payload);
};
