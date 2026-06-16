import { createStore, applyMiddleware, combineReducers } from "redux";
import thunk from "redux-thunk";
import expenseReducer from "./reducers";

const rootReducer = combineReducers({
  expenses: expenseReducer,
});

const store = createStore(rootReducer, applyMiddleware(thunk));

export default store;
