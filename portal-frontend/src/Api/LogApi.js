import axios from "axios";
import { host } from "./host";

export const GetFilteredActivities = async (filters) => {
    return await axios.post(`${host}/api/useractivities/getfilteredactivities`, filters);
};

export const GetFilteredSessions = async (filters) => {
    return await axios.post(`${host}/api/sessions/getfilteredsessions`, filters);
};

export const GetFilteredErrors = async (filters) => {
    return await axios.post(`${host}/api/errors/getfilterederrors`, filters);
};
