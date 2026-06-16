import axios from "axios";
import { host } from "./host";

// Ticket Attachments çek
export const GetTicketAttachments = (ticketId) => {
  return axios.get(
    `${host}/api/TicketAttachments/getallbyticketid?ticketId=${ticketId}`
  );
};

// Ticket Attachment ekle
export const AddTicketAttachment = (data) => {
  return axios.post(`${host}/api/TicketAttachments/add`, data);
};
