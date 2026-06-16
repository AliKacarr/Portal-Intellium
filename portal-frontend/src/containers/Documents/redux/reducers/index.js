import filefoldersReducer from "./filefoldersReducer";
import { combineReducers } from "redux";
import documentReducer from "./filefoldersReducer";

const rootReducer = combineReducers({
    filefolders: filefoldersReducer,
    document: documentReducer

});

export default rootReducer;