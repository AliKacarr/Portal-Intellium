import axios from "axios";
import { buildApiUrl, getApiHosts, setActiveApiHost } from "./host";

const isNetworkError = (error) => !error?.response;

const buildLoginBody = (credentials) => ({
  ...credentials,
  userName: credentials.email ?? credentials.userName,
});

export const Login = (credentials) => {
  const body = buildLoginBody(credentials);

  return (async () => {
    let lastError;

    for (const currentHost of getApiHosts()) {
      try {
        const response = await axios.post(`${currentHost}/api/auth/login`, body);
        setActiveApiHost(currentHost);
        return response;
      } catch (error) {
        lastError = error;

        if (!isNetworkError(error)) {
          throw error;
        }
      }
    }

    throw lastError ?? new Error("LOGIN_REQUEST_FAILED");
  })();
};

export const ForgotPasswordRequest = (email) => {
  return axios.get(buildApiUrl("/api/auth/forgotPassword"), { params: { email } });
};

export const ForgotPasswordLinkCheck = (value) => {
  return axios.get(buildApiUrl("/api/auth/forgotPasswordLinkCheck"), {
    params: { value },
  });
};

export const ChangePasswordToForgotPassword = (payload) => {
  return axios.post(buildApiUrl("/api/auth/changePasswordToForgotPassword"), payload);
};

export const ConfirmEmail = (value) => {
  return axios.get(buildApiUrl("/api/auth/confirmuser"), { params: { value } });
};

export function setAuthorizationHeader({ accessToken, isLoggedIn }) {
  if (isLoggedIn && accessToken) {
    axios.defaults.headers["Authorization"] = `Bearer ${accessToken}`;
  } else {
    delete axios.defaults.headers["Authorization"];
  }
}
