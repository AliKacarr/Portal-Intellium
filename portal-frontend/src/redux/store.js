import { createStore, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import createSagaMiddleware from "redux-saga";
import rootReducer from "./root-reducer";
import rootSaga from "./root-saga";
import { setAuthorizationHeader } from "../Api/AuthApi";
import authAction from "@iso/redux/auth/actions";

const { logout } = authAction;
const sagaMiddleware = createSagaMiddleware();
const middlewares = [thunk, sagaMiddleware];

const bindMiddleware = (middleware) => {
  if (process.env.NODE_ENV !== "production") {
    const { composeWithDevTools } = require("redux-devtools-extension");
    return composeWithDevTools(applyMiddleware(...middleware));
  }
  return applyMiddleware(...middleware);
};

const store = createStore(rootReducer, bindMiddleware(middlewares));

// İlk yüklemede (refresh sonrası) axios Authorization header'ını hemen kur.
// store.subscribe sadece state değişince tetiklendiği için, init'te 401 alınabiliyordu.
try {
  const initialAuth = store.getState()?.Auth;
  if (initialAuth) {
    setAuthorizationHeader({
      accessToken: initialAuth.accessToken,
      isLoggedIn: initialAuth.isLoggedIn,
    });
  }
} catch (e) {
  console.warn("setAuthorizationHeader (init):", e);
}

store.subscribe(() => {
  const state = store.getState()?.Auth;
  if (!state) return;

  if (state.expiration != null) {
    const expirationTime = new Date(state.expiration);
    const currentTime = new Date();
    if (expirationTime <= currentTime) {
      store.dispatch(logout());
    }
  }
  try {
    setAuthorizationHeader({
      accessToken: state.accessToken,
      isLoggedIn: state.isLoggedIn,
    });
  } catch (e) {
    console.warn("setAuthorizationHeader:", e);
  }
});

sagaMiddleware.run(rootSaga);
export { store };
