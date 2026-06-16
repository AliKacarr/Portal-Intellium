import axios from "axios";
const host = process.env.REACT_APP_CHATBOT_URL;

export const SendMessage = (message) => {
    return axios.post(`${host}/chatbot`, message);
  };