const actions = {
  CHECK_AUTHORIZATION: "CHECK_AUTHORIZATION",
  LOGIN: "LOGIN",
  LOGOUT: "LOGOUT",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_ERROR: "LOGIN_ERROR",
  checkAuthorization: () => ({ type: actions.CHECK_AUTHORIZATION }),
  login: (user) => ({
    type: actions.LOGIN,
    payload: { user },
  }),
  logout: () => ({
    type: actions.LOGOUT,
  }),
};
export default actions;
