import axios from "axios";
import { host } from "./host";

// Ticket Id'ye göre ticket eforlarını getir
export const GetAllEffortByTicketById = (ticketId) => {
  return axios.get(
    `${host}/api/TicketEfforts/getallbyticketid?ticketId=${ticketId}`
  );
};

// Tüm ticket eforlarını getir
export const DeleteTicketEffort = (ticketEffortId) => {
  return axios.delete(
    `${host}/api/TicketEfforts/delete?ticketEffortId=${ticketEffortId}`
  );
};

// Ticket eforlarını Oluştur
export const CreateTicketEffort = (data) => {
  return axios.post(`${host}/api/TicketEfforts/add`, data);
};
