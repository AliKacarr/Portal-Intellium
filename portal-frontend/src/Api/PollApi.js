import axios from "axios";
import { host } from "./host";

export const GetAllPolls = () => {
  return axios.get(`${host}/api/poll/getAll`);
};

export const GetActivePolls = () => {
  return axios.get(`${host}/api/poll/getActive`);
};

export const GetPollById = (id) => {
  return axios.get(`${host}/api/poll/getById?id=${id}`);
};

export const CreatePoll = (data) => {
  return axios.post(`${host}/api/poll/add`, data);
};

export const UpdatePoll = (data) => {
  return axios.post(`${host}/api/poll/update`, data);
};

export const VotePoll = (data) => {
  return axios.post(`${host}/api/poll/vote`, data);
};

export const DeletePoll = (id) => {
  return axios.delete(`${host}/api/poll/delete?id=${id}`);
};
