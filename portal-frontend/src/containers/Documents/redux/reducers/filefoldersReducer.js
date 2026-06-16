import * as types from "../actionTypes/fileFoldersActionTypes";
import {
  UPLOAD_DOCUMENT_REQUEST, UPLOAD_DOCUMENT_SUCCESS, UPLOAD_DOCUMENT_FAILURE,
  FETCH_DOCUMENTS_FAILURE, FETCH_DOCUMENTS_REQUEST, FETCH_DOCUMENTS_SUCCESS,
  CREATE_DOCUMENT_FAILURE, CREATE_DOCUMENT_REQUEST, CREATE_DOCUMENT_SUCCESS,
  FOLDER_DOCUMENT_FAILURE, FOLDER_DOCUMENT_REQUEST, FOLDER_DOCUMENT_SUCCESS
} from "../actionTypes/fileFoldersActionTypes";
import { v4 as uniqueId } from "uuid";


const initialState = {
  isLoading: true,
  currentFolder: "root",
  copiedDocument: null,
  cuttedDocument: null,
  userFolders: [
    {
      Id: uniqueId(),
      name: "Documents",
      path: ["root"],
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      type: "folder",
      parent: "root",
    },
    {
      Id: uniqueId(),
      name: "Photos",
      path: ["root"],
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      type: "folder",
      parent: "root",
    },
    {
      Id: uniqueId(),
      name: "Projects",
      path: ["root"],
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      type: "folder",
      parent: "root",
    },
    {
      Id: uniqueId(),
      name: "BirthdayParty",
      path: ["root", "Projects"],
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      type: "folder",
      parent: "Projects",
    }
  ],
  userFiles: [
    {
      Id: uniqueId(),
      name: "Resume.pdf",
      type: "pdf",
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      userId: "user123",
      path: ["root", "Documents"],
      parent: "Documents",
      data: {
        size: "2MB",
        uploadedBy: "user123"
      }
    },
    {
      Id: uniqueId(),
      name: "Vacation.jpg",
      type: "jpg",
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      userId: "user123",
      path: ["root", "Photos"],
      parent: "Photos",
      data: {
        size: "3MB",
        uploadedBy: "user123"
      }
    },
    {
      Id: uniqueId(),
      name: "ProjectPlan.docx",
      type: "docx",
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      userId: "user123",
      path: ["root", "Projects"],
      parent: "Projects",
      data: {
        size: "1MB",
        uploadedBy: "user123"
      }
    },
    {
      Id: uniqueId(),
      name: "BirthdayParty.jpeg",
      type: "jpeg",
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      userId: "user123",
      path: ["root", "Projects", "BirthdayParty"],
      parent: "BirthdayParty",
      data: {
        size: "1MB",
        uploadedBy: "user123"
      }
    }
  ],
  adminFolders: [
    {
      Id: uniqueId(),
      name: "Admin Documents",
      path: ["root"],
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      type: "folder",
      parent: "root",
    }
  ],
  adminFiles: [
    {
      Id: uniqueId(),
      name: "AdminManual.pdf",
      type: "pdf",
      createdAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      userId: "admin",
      path: ["root", "Admin Documents"],
      parent: "Admin Documents",
      data: {
        size: "5MB",
        uploadedBy: "admin"
      }
    }
  ]
};

export const initialStateDocument = {
  loading: false,
  document: null,
  error: null,
};

export const documentReducer = (state = initialStateDocument, action) => {
  switch (action.type) {
    case UPLOAD_DOCUMENT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case UPLOAD_DOCUMENT_SUCCESS:
      return {
        ...state,
        loading: false,
        document: action.payload,
      };
    case UPLOAD_DOCUMENT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case FETCH_DOCUMENTS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FETCH_DOCUMENTS_SUCCESS:
      return {
        ...state,
        loading: false,
        document: action.payload,
      };
    case FETCH_DOCUMENTS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case CREATE_DOCUMENT_REQUEST:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case CREATE_DOCUMENT_SUCCESS:
      return {
        ...state,
        loading: false,
        document: action.payload,

      };
    // case types.CREATE_DOCUMENT_SUCCESS:
    //   return {
    //     ...state,
    //     userFiles: [...state.userFiles, action.payload],
    //   };

    case CREATE_DOCUMENT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case FOLDER_DOCUMENT_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case FOLDER_DOCUMENT_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };
    case FOLDER_DOCUMENT_SUCCESS:
      return {
        ...state,
        loading: false,
        document: action.payload,
      };
    default:
      return state;
  }
};
const filefoldersReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.CREATE_FOLDER:
      return {
        ...state,
        userFolders: [...state.userFolders, action.payload],
      };
    case types.ADD_FOLDERS:
      return {
        ...state,
        userFolders:
          [...state.userFolders, action.payload],
      };
    case types.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case types.CHANGE_FOLDER:
      return {
        ...state,
        currentFolder: action.payload,
      };
    case types.ADD_FILES:
      return {
        ...state,
        userFiles: action.payload,
      };
    case types.CREATE_FILE:
      return {
        ...state,
        userFiles: [...state.userFiles, action.payload],
      };
    case types.SET_FILE_DATA:
      const { fileId, data } = action.payload;
      const allFiles = state.userFiles;
      const currentFile = allFiles.find((file) => file.fileId === fileId);
      currentFile.data = data;
      currentFile.updatedAt = new Date().toLocaleDateString();
      const updatedUserFiles = state.userFiles.map((file) =>
        file.fileId === fileId ? currentFile : file
      );
      return {
        ...state,
        userFiles: updatedUserFiles,
      };
    case types.DELETE_FILE:
      const deletedFileId = action.payload;
      const updatedUserFilesAfterDelete = state.userFiles.filter(
        (file) => file.fileId !== deletedFileId
      );
      return {
        ...state,
        userFiles: updatedUserFilesAfterDelete,
      };
    case types.DELETE_FOLDER:
      const deletedId = action.payload;
      const updatedUserFoldersAfterDelete = state.userFolders.filter(
        (file) => file.Id !== deletedId
      );
      return {
        ...state,
        userFolders: updatedUserFoldersAfterDelete,
      };
    case types.RENAME_FILE:
      const { renamedFileId, newName } = action.payload;
      const getAllFiles = state.userFiles;
      const willBeRenamedFile = getAllFiles.find(
        (file) => file.fileId === renamedFileId
      );
      const fileNameParts = newName?.split(".");
      const extension = fileNameParts.length > 1 ? fileNameParts.pop() : "txt";
      willBeRenamedFile.name =
        newName.split(".").length > 1 ? newName : `${newName}.txt`;
      willBeRenamedFile.type = extension;
      willBeRenamedFile.updatedAt = new Date().toLocaleDateString();
      const afterRenamedFiles = state.userFiles.map((file) =>
        file.fileId === renamedFileId ? willBeRenamedFile : file
      );
      return {
        ...state,
        userFiles: afterRenamedFiles,
      };
    case types.RENAME_FOLDER:
      const { renamedId, newFolderName } = action.payload;
      const getAllFolders = state.userFolders;
      const willBeRenamedFolder = getAllFolders.find(
        (folder) => folder.Id === renamedId
      );
      willBeRenamedFolder.name = newFolderName;
      willBeRenamedFolder.updatedAt = new Date().toLocaleDateString();
      const afterRenamedFolders = state.userFolders.map((folder) =>
        folder.Id === renamedId ? willBeRenamedFolder : folder
      );
      return {
        ...state,
        userFolders: afterRenamedFolders,
      };
    case types.COPY_DOCUMENT:
      return {
        ...state,
        copiedDocument: action.payload,
      };
    case types.CUT_DOCUMENT:
      return {
        ...state,
        cuttedDocument: action.payload,
      };
    case types.PASTE_DOCUMENT:
      if (action.payload.type === "folder") {
        return state;
      } else {
        const pasteFile = state.userFiles.find(
          (file) => file.fileId === state.copiedDocument
        );
        const currentFolderData = state.userFolders.find(
          (folder) => folder.Id === state.currentFolder
        );
        if (pasteFile) {
          const originalFileName = pasteFile?.name;
          const extensionIndex = originalFileName?.lastIndexOf(".");
          const fileNameWithoutExtension = originalFileName?.slice(
            0,
            extensionIndex
          );
          const fileExtension = originalFileName.slice(extensionIndex);
          let newFileName = `${fileNameWithoutExtension} (kopya)${fileExtension}`;
          const existingFileNames = state.userFiles
            .filter((file) => file.parent === state.currentFolder)
            .map((file) => file.name);
          let copyNumber = 1;
          while (existingFileNames.includes(newFileName)) {
            newFileName = `${fileNameWithoutExtension} (kopya ${copyNumber})${fileExtension}`;
            copyNumber++;
          }
          const copiedFile = {
            ...pasteFile,
            name: newFileName,
            parent: state.currentFolder,
            fileId: uniqueId(),
            path:
              state.currentFolder === "root"
                ? []
                : [...currentFolderData?.path, state.currentFolder],
            createdAt: new Date().toLocaleDateString(),
          };
          const updatedFiles = [...state.userFiles, copiedFile];

          return {
            ...state,
            userFiles: updatedFiles,
          };
        } else {
          return state;
        }
      }
    case types.MOVE_DOCUMENT:
      if (action.payload.type === "folder") {
        return state;
      } else {

        const currentFile = state.userFiles.find(
          (file) => file.fileId === state.cuttedDocument
        );
        const currentFolderData = state.userFolders.find(
          (folder) => folder.Id === state.currentFolder
        );
        currentFile.path =
          state.currentFolder === "root"
            ? []
            : [...currentFolderData?.path, state.currentFolder];
        currentFile.parent = state.currentFolder;
        const updatedUserFiles = state.userFiles.map((file) =>
          file.fileId === state.cuttedDocument ? currentFile : file
        );
        return {
          ...state,
          userFiles: updatedUserFiles,
        };
      }
    default:
      return state;
  }
};

export default filefoldersReducer;