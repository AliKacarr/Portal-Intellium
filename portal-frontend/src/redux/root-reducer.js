import { combineReducers } from "redux";
import App from "@iso/redux/app/reducer";
import Auth from "@iso/redux/auth/reducer";
import ThemeSwitcher from "@iso/redux/themeSwitcher/reducer";
import LanguageSwitcher from "@iso/redux/languageSwitcher/reducer";
import scrumBoard from "@iso/redux/scrumBoard/reducer";
import drawer from "@iso/redux/drawer/reducer";
import modal from "@iso/redux/modal/reducer";

// ✅ YENİ EKLENEN REDUCER'LAR
import deepLink from "./deepLink/deepLinkSlice";
import dashboard from "./dashboard/dashboardSlice";
import expenseReducer from "../containers/Expense/redux/reducers";

export default combineReducers({
  Auth,
  App,
  ThemeSwitcher,
  LanguageSwitcher,
  scrumBoard,
  drawer,
  modal,
  // ✅ SİSTEME DAHİL EDİLDİLER
  deepLink,
  dashboard,
  expenses: expenseReducer,
});