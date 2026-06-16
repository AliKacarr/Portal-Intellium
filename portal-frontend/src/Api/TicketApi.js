import axios from "axios";
import { host } from "./host";

// Id'ye göre ticket getir
export const GetTicketById = (ticketId) => {
  return axios.get(`${host}/api/Ticket/getById?id=${ticketId}`);
};

// Tüm ticketları getir
export const GetAllTickets = () => {
  return axios.get(`${host}/api/Ticket/getAll`);
};

// Ticket Oluştur
export const CreateTicket = (data) => {
  return axios.post(`${host}/api/Ticket/add`, data);
};

// Son ticketları getir
export const GetLastTickets = (count) => {
  return axios.get(`${host}/api/Ticket/getLastTickets?ticketCount=${count}`);
};

// Ticket Güncelle
export const UpdateTicket = (data) => {
  return axios.put(`${host}/api/Ticket/update`, data);
};
// Kullanıcı ata
export const AssignUserToTicket = (data) => {
  return axios.patch(`${host}/api/Ticket/assignUser`, data);
};

// Toplam ticket sayısını getir
export const GetTicketCount = () => {
  return axios.get(`${host}/api/Ticket/getCount`);
};

// Bileti kapat
export const MarkAsResolved = (ticketId) => {
  return axios.patch(`${host}/api/Ticket/markasresolved?ticketId=${ticketId}`);
};
