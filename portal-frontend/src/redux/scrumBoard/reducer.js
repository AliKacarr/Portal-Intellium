import scrumBoardActions from "./actions";

const initialState = {
  boards: {},
  columns: {},
  tasks: {},
  filterBoardsearchText: "",
  filterBoardCategory: [],
  filterTaskSearchText: "",
  filterTaskLabelCategory: [],
  filterTaskMembers: [],
  labels: {},
  refresh: false,
  reloadTaskDetail: false,
  reloadTaskComments: false,
  reloadTaskAttachments: false,
  reloadTaskTodoLists: false,
  taskCommentAdded: { taskId: 0 },
  taskCommentRemoved: { taskId: 0 },
  taskAttachmentAdded: { taskId: 0 },
  taskAttachmentRemoved: { taskId: 0 },
};
export default function scrumBoardReducer(state = initialState, action) {
  switch (action.type) {
    case scrumBoardActions.SET_BOARDS_DATA:
      return { ...state, ...action.payload };

    case scrumBoardActions.SET_CURRENT_BOARD_DATA:
      return { ...state, ...action.payload };

    case scrumBoardActions.CREATE_OR_UPDATE_TASK:
      return {
        ...state,
        tasks: action.payload.tasks,
        columns: action.payload.columns,
      };

    case scrumBoardActions.EDIT_TASK:
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.id]: {
            ...action.payload,
            editing: true,
          },
        },
      };
    case scrumBoardActions.REFRESH_TASK:
      return {
        ...state,
        refresh: action.payload,
      };

    case scrumBoardActions.INCREMENT_TASK_COMMENT_COUNT:
      return {
        ...state,
        taskCommentAdded: { taskId: action.payload },
      };

    case scrumBoardActions.DECREMENT_TASK_COMMENT_COUNT:
      return {
        ...state,
        taskCommentRemoved: { taskId: action.payload },
      };

    case scrumBoardActions.INCREMENT_TASK_ATTACHMENT_COUNT:
      return {
        ...state,
        taskAttachmentAdded: { taskId: action.payload },
      };

    case scrumBoardActions.DECREMENT_TASK_ATTACHMENT_COUNT:
      return {
        ...state,
        taskAttachmentRemoved: { taskId: action.payload },
      };

    case scrumBoardActions.RELOAD_TASK_DETAIL:
      return {
        ...state,
        reloadTaskDetail: action.payload,
      };

    case scrumBoardActions.RELOAD_TASK_COMMENT:
      return {
        ...state,
        reloadTaskComments: action.payload,
      };

    case scrumBoardActions.RELOAD_TASK_ATTACHMENT:
      return {
        ...state,
        reloadTaskAttachments: action.payload,
      };

    case scrumBoardActions.RELOAD_TASK_TODOLIST:
      return {
        ...state,
        reloadTaskTodoLists: action.payload,
      };

    case scrumBoardActions.CANCEL_EDIT_TASK:
      return {
        ...state,
        tasks: {
          ...state.tasks,
          [action.payload.id]: {
            ...action.payload,
            editing: false,
          },
        },
      };

    case scrumBoardActions.DELETE_TASK:
      return {
        ...state,
        tasks: action.payload.tasks,
        columns: action.payload.columns,
      };

    case scrumBoardActions.SET_FILTER_BOARD_SEARCH_TEXT:
      return {
        ...state,
        filterBoardsearchText: action.payload,
      };

    case scrumBoardActions.SET_FILTER_BOARD_CATEGORY:
      return {
        ...state,
        filterBoardCategory: action.payload,
      };

    case scrumBoardActions.SET_FILTER_TASK_SEARCH_TEXT:
      return {
        ...state,
        filterTaskSearchTask: action.payload,
      };

    case scrumBoardActions.SET_FILTER_TASK_LABEL_CATEGORY:
      return {
        ...state,
        filterTaskLabelCategory: action.payload,
      };

    case scrumBoardActions.SET_FILTER_TASK_MEMBERS:
      return {
        ...state,
        filterTaskMembers: action.payload,
      };

    case scrumBoardActions.SET_MOVED_TASK:
      return {
        ...state,
        columns: action.payload.columns,
        tasks: action.payload.tasks,
      };

    case scrumBoardActions.RESET_TASK: {
      return {
        ...state,
        task: initialState.task,
      };
    }

    /// COLUMNS
    case scrumBoardActions.CREATE_OR_UPDATE_COLUMN:
      return {
        ...state,
        columns: action.payload.columns,
        boards: action.payload.boards,
      };
    case scrumBoardActions.EDIT_COLUMN:
      return {
        ...state,
        columns: {
          ...state.columns,
          [action.payload.id]: {
            ...action.payload,
            editing: true,
          },
        },
      };

    case scrumBoardActions.CANCEL_EDIT_COLUMN:
      return {
        ...state,
        columns: {
          ...state.columns,
          [action.payload.id]: {
            ...action.payload,
            editing: false,
          },
        },
      };
    case scrumBoardActions.DELETE_COLUMN:
      return {
        ...state,
        columns: action.payload.columns,
        boards: action.payload.boards,
      };

    case scrumBoardActions.SET_MOVED_COLUMN:
      return {
        ...state,
        boards: action.payload,
      };

    case scrumBoardActions.CREATE_OR_UPDATE_BOARD:
      return {
        ...state,
        boards: action.payload,
      };
    case scrumBoardActions.EDIT_BOARD:
      return {
        ...state,
        boards: {
          ...state.boards,
          [action.payload.id]: {
            ...action.payload,
            editing: true,
          },
        },
      };
    case scrumBoardActions.NEW_BOARD:
      return {
        ...state,
        boards: {
          editing: false,
        },
      };

    case scrumBoardActions.DELETE_BOARD:
      return {
        ...state,
        boards: action.payload,
      };

    case scrumBoardActions.CREATE_OR_UPDATE_LABEL:
      return {
        ...state,
        labels: {
          ...state.labels,
          [action.payload.id]: action.payload,
        },
      };
    case scrumBoardActions.EDIT_LABEL:
      return {
        ...state,
        labels: {
          ...state.labels,
          [action.payload.id]: {
            ...action.payload,
            editing: true,
          },
        },
      };
    case scrumBoardActions.DELETE_LABEL:
      const LABELS = {
        ...state.labels,
      };
      delete LABELS[action.payload];
      return {
        ...state,
        labels: LABELS,
      };
    default:
      return state;
  }
}
