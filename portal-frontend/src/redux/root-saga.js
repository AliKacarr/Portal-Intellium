import { all } from "redux-saga/effects";
import authSagas from "@iso/redux/auth/saga";
import scrumBoardSaga from "@iso/redux/scrumBoard/saga";

export default function* rootSaga(getState) {
  yield all([authSagas(), scrumBoardSaga()]);
}
