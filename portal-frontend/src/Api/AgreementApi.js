import axios from "axios";
import { buildApiUrl } from "./host";

export const GetActiveAgreements = () => {
  return axios.get(buildApiUrl("/api/agreements/active"));
};

export const GetAgreementHistory = () => {
  return axios.get(buildApiUrl("/api/agreements/history"));
};

export const CreateAgreementVersion = (payload) => {
  return axios.post(buildApiUrl("/api/agreements"), payload);
};

export const AcceptActiveAgreements = (payload) => {
  return axios.post(buildApiUrl("/api/agreements/accept"), payload);
};
