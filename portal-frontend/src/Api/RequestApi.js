import axios from "axios";
import { host } from "./host";

export const getRequestCategories = async () => {
  const res = await axios.get(`${host}/api/request/categories`);
  return res.data;
};

export const addRequestCategory = async (payload) => {
  const res = await axios.post(`${host}/api/request/categories`, payload);
  return res.data;
};

export const updateRequestCategory = async (id, payload) => {
  const res = await axios.put(`${host}/api/request/categories/${id}`, payload);
  return res.data;
};

export const deleteRequestCategory = async (id) => {
  const res = await axios.delete(`${host}/api/request/categories/${id}`);
  return res.data;
};

export const addRequestSubCategory = async (payload) => {
  const res = await axios.post(`${host}/api/request/sub-categories`, payload);
  return res.data;
};

export const updateRequestSubCategory = async (id, payload) => {
  const res = await axios.put(`${host}/api/request/sub-categories/${id}`, payload);
  return res.data;
};

export const deleteRequestSubCategory = async (id) => {
  const res = await axios.delete(`${host}/api/request/sub-categories/${id}`);
  return res.data;
};

export const addRequestSubCategoryField = async (payload) => {
  const res = await axios.post(`${host}/api/request/sub-category-fields`, payload);
  return res.data;
};

export const updateRequestSubCategoryField = async (id, payload) => {
  const res = await axios.put(`${host}/api/request/sub-category-fields/${id}`, payload);
  return res.data;
};

export const deleteRequestSubCategoryField = async (id) => {
  const res = await axios.delete(`${host}/api/request/sub-category-fields/${id}`);
  return res.data;
};

export const createRequest = async (payload) => {
  const res = await axios.post(`${host}/api/request/create`, payload);
  return res.data;
};

export const getRequestDetail = async (id) => {
  const res = await axios.get(`${host}/api/request/${id}`);
  return res.data;
};

export const uploadRequestAttachments = async (id, files) => {
  const form = new FormData();
  (files || []).forEach((f) => {
    if (f?.originFileObj) form.append("attachments", f.originFileObj);
    else if (f instanceof File) form.append("attachments", f);
  });
  const res = await axios.post(`${host}/api/request/${id}/attachments`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getMyRequests = async (status) => {
  const res = await axios.get(`${host}/api/request/my`, {
    params: status ? { status } : undefined,
  });
  return res.data;
};

export const downloadRequestAttachment = async (requestId, attachmentId) => {
  const res = await axios.get(
    `${host}/api/request/${requestId}/attachments/${attachmentId}`,
    { responseType: "blob" }
  );
  return res;
};

export const getInboxRequests = async ({ status, categoryId } = {}) => {
  const res = await axios.get(`${host}/api/request/inbox`, {
    params: {
      ...(status ? { status } : {}),
      ...(categoryId ? { categoryId } : {}),
    },
  });
  return res.data;
};

export const updateRequestStatus = async (id, payload) => {
  const res = await axios.patch(`${host}/api/request/${id}/status`, payload);
  return res.data;
};

export const adminUpdateRequest = async (id, payload) => {
  const res = await axios.patch(`${host}/api/request/${id}`, payload);
  return res.data;
};

export const updateMyDraftRequest = async (id, payload) => {
  const res = await axios.patch(`${host}/api/request/my/${id}`, payload);
  return res.data;
};

export const cancelRequest = async (id, note) => {
  const res = await axios.post(`${host}/api/request/${id}/cancel`, null, {
    params: note ? { note } : undefined,
  });
  return res.data;
};

export const deleteMyDraftRequest = async (id) => {
  const res = await axios.delete(`${host}/api/request/my/${id}`);
  return res.data;
};

export const adminDeleteRequest = async (id) => {
  const res = await axios.delete(`${host}/api/request/${id}`);
  return res.data;
};

