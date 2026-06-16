import * as types from "../actionTypes/fileFoldersActionTypes";
import axios from "axios";
import { buildApiUrl } from "../../../../Api/host";
import {
  UPLOAD_DOCUMENT_REQUEST,
  UPLOAD_DOCUMENT_SUCCESS,
  UPLOAD_DOCUMENT_FAILURE,
  CREATE_DOCUMENT_FAILURE,
  CREATE_DOCUMENT_REQUEST,
  CREATE_DOCUMENT_SUCCESS,
  FOLDER_DOCUMENT_FAILURE,
  FOLDER_DOCUMENT_REQUEST,
  FOLDER_DOCUMENT_SUCCESS,

} from "../actionTypes/fileFoldersActionTypes";


const addFolder = (payload) => ({
  type: types.CREATE_FOLDER,
  payload,
});

// const addFolders = (payload) => ({
//   type: types.ADD_FOLDERS,
//   payload,
// });
const setLoading = (payload) => ({
  type: types.SET_LOADING,
  payload,
});
const setChangeFolder = (payload) => ({
  type: types.CHANGE_FOLDER,
  payload,
});
// const addFiles = (payload) => ({
//   type: types.ADD_FILES,
//   payload,
// });
const addFile = (payload) => ({
  type: types.CREATE_FILE,
  payload,
});
const setFileData = (payload) => ({
  type: types.SET_FILE_DATA,
  payload,
});
const setDeleteFile = (payload) => ({
  type: types.DELETE_FILE,
  payload,
});
const setRenameFile = (payload) => ({
  type: types.RENAME_FILE,
  payload,
});
const setDeleteFolder = (payload) => ({
  type: types.DELETE_FOLDER,
  payload,
});
const setRenameFolder = (payload) => ({
  type: types.RENAME_FOLDER,
  payload,
});
const setCopyDocument = (payload) => ({
  type: types.COPY_DOCUMENT,
  payload,
});
const setCutDocument = (payload) => ({
  type: types.CUT_DOCUMENT,
  payload,
});
const setPasteDocument = (payload) => ({
  type: types.PASTE_DOCUMENT,
  payload,
});
const setMoveDocument = (payload) => ({
  type: types.MOVE_DOCUMENT,
  payload,
});


//actions creators
export const createFolder = (data) => (dispatch) => {
  dispatch(addFolder(data));
};
//   return async (dispatch) => {
//     dispatch({ type: FOLDER_DOCUMENT_REQUEST });

//     try {
//       const response = await axios.post("https://localhost:7295/api/Document/add", data);
//       dispatch({
//         type: FOLDER_DOCUMENT_SUCCESS,
//         payload: response.data,
//       });
//     } catch (error) {
//       dispatch({
//         type: FOLDER_DOCUMENT_FAILURE,
//         payload: error.message,
//       });
//     }
//   };
// };
// export const getFolders = (userId) => {
//   return async (dispatch) => {
//     dispatch(setLoading(true));
//     try {
//       const response = await fetch(`https://localhost:7295/api/Document/getAllByUserId?userId=${userId}`);
//       if (!response.ok) {
//         throw new Error('Folder fetch failed');
//       }
//       const data = await response.json();
//       dispatch({ type: 'FETCH_FOLDERS_SUCCESS', payload: data });
//     } catch (error) {
//       dispatch({ type: 'FETCH_FOLDERS_FAILURE', payload: error.message });
//     } finally {
//       dispatch(setLoading(false));
//     }
//   };
// }
export const changeFolder = (Id) => (dispatch) => {
  dispatch(setChangeFolder(Id));
};
// export const getFiles = (userId) => {
//   return async (dispatch) => {
//     dispatch(setLoading(true));
//     try {
//       const response = await fetch(`https://localhost:7295/api/Document/getAllByUserId?userId=${userId}`);
//       if (!response.ok) {
//         throw new Error('File fetch failed');
//       }
//       const data = await response.json();
//       dispatch({ type: 'FETCH_FILES_SUCCESS', payload: data });
//     } catch (error) {
//       dispatch({ type: 'FETCH_FILES_FAILURE', payload: error.message });
//     } finally {
//       dispatch(setLoading(false));
//     }
//   };
// };
export const createFile = (data, setSuccess) => (dispatch) => {
  dispatch(addFile(data));
};
export const updateFileData = (fileId, data) => (dispatch) => {
  dispatch(setFileData({ fileId, data }));
};
export const uploadFile = (file, data, setSuccess) => (dispatch) => {
  //Todo: upload file to server.Then modify data object and set url as file url's on server side.
  dispatch(addFile(data));
};
export const deleteFile = (document) => (dispatch) => {
  if (document?.type === "folder") {
    dispatch(setDeleteFolder(document?.folderId));
    console.log("deleted folder");
  } else {
    dispatch(setDeleteFile(document?.fileId));
    console.log("deleted");
  }
};
//   const baseurl = "https://localhost:7295/api/Document/delete/";
//   try {
//     const response = await fetch(`${baseurl}${document?.Id}`, {
//       method: 'DELETE',
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     });

//     if (response.ok) {
//       if (document?.type === "folder") {
//         dispatch(setDeleteFolder(document?.Id));
//         console.log("deleted folder");
//       } else {
//         dispatch(setDeleteFile(document?.Id));
//         console.log("deleted file");
//       }
//     } else {
//       console.error('API Error:', response.statusText);
//     }
//   } catch (error) {
//     console.error('Fetch Error:', error);
//   }
// };

export const renameDocument = (document, newName) => (dispatch) => {
  if (document?.type === "folder") {
    dispatch(
      setRenameFolder({
        renamedFolderId: document?.folderId,
        newFolderName: newName,
      })
    );
  } else {
    dispatch(setRenameFile({ renamedFileId: document?.fileId, newName }));
  }
};

export const copyDocument = (document) => (dispatch) => {
  const id = document?.id ?? document?.Id ?? document?.fileId ?? document?.folderId ?? null;
  dispatch(setCopyDocument(id));
};
export const cutDocument = (document) => (dispatch) => {
  const id = document?.id ?? document?.Id ?? document?.fileId ?? document?.folderId ?? null;
  dispatch(setCutDocument(id));
};

export const pasteDocument = (document) => (dispatch) => {
  dispatch(setPasteDocument(document?.type));
};
export const moveDocument = (document) => (dispatch) => {
  dispatch(setMoveDocument(document?.type));
};
export const uploadDocument = (fileData) => {
  return async (dispatch) => {
    dispatch({ type: UPLOAD_DOCUMENT_REQUEST });

    try {
      const response = await axios.post(buildApiUrl("/api/Document/add"), fileData);
      dispatch({
        type: UPLOAD_DOCUMENT_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      dispatch({
        type: UPLOAD_DOCUMENT_FAILURE,
        payload: error.message,
      });
    }
  };
};

// export const createDocument = (fileData) => {
//   return async (dispatch) => {
//     dispatch({ type: CREATE_DOCUMENT_REQUEST });

//     try {
//       const response = await axios.post("https://localhost:7295/api/Document/add", fileData);
//       dispatch({
//         type: CREATE_DOCUMENT_SUCCESS,
//         payload: response.data,
//       });
//     } catch (error) {
//       dispatch({
//         type: CREATE_DOCUMENT_FAILURE,
//         payload: error.message,
//       });
//     }
//   };
// };

// export const createDocument = (documentData) => async (dispatch, getState) => {
//   try {
//     dispatch({ type: CREATE_DOCUMENT_REQUEST });
//     const { currentFolder } = getState().filefolders;
//     const response = await fetch(`https://localhost:7295/api/Document/add`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ ...documentData, parent: currentFolder }),
//     });
//     const data = await response.json();
//     dispatch({ type: CREATE_DOCUMENT_SUCCESS, payload: data });
//   } catch (error) {
//     dispatch({ type: CREATE_DOCUMENT_FAILURE, payload: error });
//   }
// };


export const folderDocument = (data) => {
  return async (dispatch) => {
    dispatch({ type: FOLDER_DOCUMENT_REQUEST });

    try {
      const response = await axios.post(buildApiUrl("/api/Document/add"), data);
      dispatch({
        type: FOLDER_DOCUMENT_SUCCESS,
        payload: response.data,
      });
    } catch (error) {
      dispatch({
        type: FOLDER_DOCUMENT_FAILURE,
        payload: error.message,
      });
    }
  }
}
export const fetchDocumentsRequest = () => ({
  type: types.FETCH_DOCUMENTS_REQUEST,
});

export const fetchDocumentsSuccess = (documents) => ({
  type: types.FETCH_DOCUMENTS_SUCCESS,
  payload: documents,
});

export const fetchDocumentsFailure = (error) => ({
  type: types.FETCH_DOCUMENTS_FAILURE,
  payload: error,
});

export const createDocumentRequest = () => ({
  type: types.CREATE_DOCUMENT_REQUEST,
});

export const createDocumentSuccess = (document) => ({
  type: types.CREATE_DOCUMENT_SUCCESS,
  payload: document,
});

export const createDocumentFailure = (error) => ({
  type: types.CREATE_DOCUMENT_FAILURE,
  payload: error,
});

export const folderDocumentRequest = () => ({
  type: types.FOLDER_DOCUMENT_REQUEST,
});

export const folderDocumentSuccess = (documents) => ({
  type: types.FOLDER_DOCUMENT_SUCCESS,
  payload: documents,
});

export const folderDocumentFailure = (error) => ({
  type: types.FOLDER_DOCUMENT_FAILURE,
  payload: error,
});

export const getDocuments = () => {
  return async (dispatch) => {
    dispatch({ type: 'FETCH_DOCUMENTS_REQUEST' });
    try {
      const response = await fetch(buildApiUrl("/api/Document/getAll"));
      if (!response.ok) {
        throw new Error('Document fetch failed');
      }
      const data = await response.json();
      dispatch({ type: 'FETCH_DOCUMENTS_SUCCESS', payload: data });
    } catch (error) {
      dispatch({ type: 'FETCH_DOCUMENTS_FAILURE', payload: error.message });
    }
  };
};




