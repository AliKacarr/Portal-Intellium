import axios from "axios";
import { host } from "./host";

// Ticket'ın yorumlarını getir
export const GetAllComments = (ticketId) => {
  return axios.get(
    `${host}/api/TicketComment/getAllByTicket?ticketId=${ticketId}`
  );
};

// Yorum ekle
export const CreateTicketComment = (ticket) => {
  return axios.post(`${host}/api/TicketComment/add`, ticket);
};

// Yoruma cevap ver
export const CreateTicketCommentReply = (ticket) => {
  return axios.post(`${host}/api/TicketCommentReply/add`, ticket);
};
