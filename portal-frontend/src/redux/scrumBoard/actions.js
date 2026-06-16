const scrumBoardActions = {
  //BOARD
  CREATE_OR_UPDATE_BOARD_WATCHER: "CREATE_OR_UPDATE_BOARD_WATCHER",
  CREATE_OR_UPDATE_BOARD: "CREATE_OR_UPDATE_BOARD",
  EDIT_BOARD: "EDIT_BOARD",
  NEW_BOARD: "NEW_BOARD",
  DELETE_BOARD_WATCHER: "DELETE_BOARD_WATCHER",
  DELETE_BOARD: "DELETE_BOARD",
  SELECT_BOARD: "SELECT_BOARD",

  //COLUMN
  CREATE_OR_UPDATE_COLUMN_WATCHER: "CREATE_OR_UPDATE_COLUMN_WATCHER",
  CREATE_OR_UPDATE_COLUMN: "CREATE_OR_UPDATE_COLUMN",
  EDIT_COLUMN: "EDIT_COLUMN",
  CANCEL_EDIT_COLUMN: "CANCEL_EDIT_COLUMN",
  DELETE_COLUMN_WATCHER: "DELETE_COLUMN_WATCHER",
  DELETE_COLUMN: "DELETE_COLUMN",
  RESET_COLUMN: "RESET_COLUMN",
  MOVE_COLUMN_WATCHER: "MOVE_COLUMN_WATCHER",
  SET_MOVED_COLUMN: "SET_MOVED_COLUMN",
  DUBLICATE_COLUMN: "DUBLICATE_COLUMN",

  //TASK
  CREATE_OR_UPDATE_TASK_WATCHER: "CREATE_OR_UPDATE_TASK_WATCHER",
  CREATE_OR_UPDATE_TASK: "CREATE_OR_UPDATE_TASK",
  EDIT_TASK: "EDIT_TASK",
  CANCEL_EDIT_TASK: "CANCEL_EDIT_TASK",
  DELETE_TASK_WATCHER: "DELETE_TASK_WATCHER",
  DELETE_TASK: "DELETE_TASK",
  RESET_TASK: "RESET_TASK",
  MOVE_TASK_WATCHER: "MOVE_TASK_WATCHER",
  SET_MOVED_TASK: "SET_MOVED_TASK",
  DUBLICATE_TASK: "DUBLICATE_TASK",
  REFRESH_TASK: "REFRESH_TASK",
  RELOAD_TASK_DETAIL: "RELOAD_TASK_DETAIL",
  RELOAD_TASK_COMMENT: "RELOAD_TASK_COMMENT",
  RELOAD_TASK_ATTACHMENT: "RELOAD_TASK_ATTACHMENT",
  RELOAD_TASK_TODOLIST: "RELOAD_TASK_TODOLIST",
  INCREMENT_TASK_COMMENT_COUNT: "INCREMENT_TASK_COMMENT_COUNT",
  DECREMENT_TASK_COMMENT_COUNT: "DECREMENT_TASK_COMMENT_COUNT",
  INCREMENT_TASK_ATTACHMENT_COUNT: "INCREMENT_TASK_ATTACHMENT_COUNT",
  DECREMENT_TASK_ATTACHMENT_COUNT: "DECREMENT_TASK_ATTACHMENT_COUNT",

  // FILTER
  SET_FILTER_BOARD_SEARCH_TEXT: "SET_FILTER_BOARD_SEARCH_TEXT",
  SET_FILTER_BOARD_CATEGORY: "SET_FILTER_BOARD_CATEGORY",
  SET_FILTER_TASK_SEARCH_TEXT: "SET_FILTER_TASK_SEARCH_TEXT",
  SET_FILTER_TASK_LABEL_CATEGORY: "SET_FILTER_TASK_LABEL_CATEGORY",
  SET_FILTER_TASK_MEMBERS: "SET_FILTER_TASK_MEMBERS",

  // LOAD DATA
  LOAD_BOARDS_DATA_SAGA: "LOAD_BOARDS_DATA_SAGA",
  LOAD_CURRENT_BOARD_DATA_SAGA: "LOAD_CURRENT_BOARD_DATA_SAGA",
  SET_BOARDS_DATA: "SET_BOARDS_DATA",
  SET_CURRENT_BOARD_DATA: "SET_CURRENT_BOARD_DATA",

  // LABELS
  CREATE_OR_UPDATE_LABEL: "CREATE_OR_UPDATE_LABEL",
  EDIT_LABEL: "EDIT_LABEL",
  DELETE_LABEL: "DELETE_LABEL",

  // Load Data Actions

  boardsRenderWatcher: () => ({
    type: scrumBoardActions.LOAD_BOARDS_DATA_SAGA,
  }),

  setBoardsData: (boards) => ({
    type: scrumBoardActions.SET_BOARDS_DATA,
    payload: boards,
  }),

  boardRenderWatcher: (boardId) => ({
    type: scrumBoardActions.LOAD_CURRENT_BOARD_DATA_SAGA,
    payload: boardId,
  }),

  setBoardData: (boardData) => ({
    type: scrumBoardActions.SET_CURRENT_BOARD_DATA,
    payload: boardData,
  }),

  // Task Actions
  createOrUpdateTaskWatcher: (payload) => {
    return {
      type: scrumBoardActions.CREATE_OR_UPDATE_TASK_WATCHER,
      payload,
    };
  },
  createOrUpdateTask: (payload) => {
    return {
      type: scrumBoardActions.CREATE_OR_UPDATE_TASK,
      payload,
    };
  },

  editTask: (payload) => {
    return {
      type: scrumBoardActions.EDIT_TASK,
      payload,
    };
  },

  refreshTask: (payload) => {
    return {
      type: scrumBoardActions.REFRESH_TASK,
      payload,
    };
  },

  reloadTaskDetail: (payload) => {
    return {
      type: scrumBoardActions.RELOAD_TASK_DETAIL,
      payload,
    };
  },

  reloadTaskComments: (payload) => {
    return {
      type: scrumBoardActions.RELOAD_TASK_COMMENT,
      payload,
    };
  },

  reloadTaskAttachments: (payload) => {
    return {
      type: scrumBoardActions.RELOAD_TASK_ATTACHMENT,
      payload,
    };
  },

  reloadTaskTodoLists: (payload) => {
    return {
      type: scrumBoardActions.RELOAD_TASK_TODOLIST,
      payload,
    };
  },

  cancelEditTask: (payload) => {
    return {
      type: scrumBoardActions.CANCEL_EDIT_TASK,
      payload,
    };
  },

  deleteTaskWatcher: (payload) => {
    return {
      type: scrumBoardActions.DELETE_TASK_WATCHER,
      payload,
    };
  },
  deleteTask: (payload) => {
    return {
      type: scrumBoardActions.DELETE_TASK,
      payload,
    };
  },

  resetTask: (payload) => {
    return {
      type: scrumBoardActions.RESET_TASK,
      payload,
    };
  },

  incrementTaskCommentCount: (taskId) => {
    return {
      type: "INCREMENT_TASK_COMMENT_COUNT",
      payload: taskId,
    };
  },
  decrementTaskCommentCount: (taskId) => {
    return {
      type: "DECREMENT_TASK_COMMENT_COUNT",
      payload: taskId,
    };
  },

  incrementTaskAttachmentCount: (taskId) => {
    return {
      type: "INCREMENT_TASK_ATTACHMENT_COUNT",
      payload: taskId,
    };
  },
  decrementTaskAttachmentCount: (taskId) => {
    return {
      type: "DECREMENT_TASK_ATTACHMENT_COUNT",
      payload: taskId,
    };
  },

  // FILTER
  setFilterBoardSearchText: (payload) => {
    return {
      type: scrumBoardActions.SET_FILTER_BOARD_SEARCH_TEXT,
      payload,
    };
  },
  setFilterBoardCategory: (payload) => {
    return {
      type: scrumBoardActions.SET_FILTER_BOARD_CATEGORY,
      payload,
    };
  },
  setFilterTaskSearchText: (payload) => {
    return {
      type: scrumBoardActions.SET_FILTER_TASK_SEARCH_TEXT,
      payload,
    };
  },
  setFilterTaskLabelCategory: (payload) => {
    return {
      type: scrumBoardActions.SET_FILTER_TASK_LABEL_CATEGORY,
      payload,
    };
  },
  setFilterTaskMembers: (payload) => {
    return {
      type: scrumBoardActions.SET_FILTER_TASK_MEMBERS,
      payload,
    };
  },

  moveTaskWatcher: (payload) => {
    return {
      type: scrumBoardActions.MOVE_TASK_WATCHER,
      payload,
    };
  },
  setMovedTask: (payload) => {
    return {
      type: scrumBoardActions.SET_MOVED_TASK,
      payload,
    };
  },

  // Column Actions
  createOrUpdateColumnWatcher: (payload) => {
    return {
      type: scrumBoardActions.CREATE_OR_UPDATE_COLUMN_WATCHER,
      payload,
    };
  },
  createOrUpdateColumn: (payload) => {
    return {
      type: scrumBoardActions.CREATE_OR_UPDATE_COLUMN,
      payload,
    };
  },

  editColumn: (payload) => {
    return {
      type: scrumBoardActions.EDIT_COLUMN,
      payload,
    };
  },

  cancelEditColumn: (payload) => {
    return {
      type: scrumBoardActions.CANCEL_EDIT_COLUMN,
      payload,
    };
  },

  deleteColumnWatcher: (payload) => {
    return {
      type: scrumBoardActions.DELETE_COLUMN_WATCHER,
      payload,
    };
  },
  deleteColumn: (payload) => {
    return {
      type: scrumBoardActions.DELETE_COLUMN,
      payload,
    };
  },

  resetColumn: (payload) => {
    return {
      type: scrumBoardActions.RESET_COLUMN,
      payload,
    };
  },
  moveColumnWatcher: (payload) => {
    return {
      type: scrumBoardActions.MOVE_COLUMN_WATCHER,
      payload,
    };
  },
  setMovedColumn: (payload) => {
    return {
      type: scrumBoardActions.SET_MOVED_COLUMN,
      payload,
    };
  },

  // Board Actions
  createOrUpdateBoardWatcher: (board) => {
    return {
      type: scrumBoardActions.CREATE_OR_UPDATE_BOARD_WATCHER,
      payload: board,
    };
  },
  createOrUpdateBoard: (board) => {
    return {
      type: scrumBoardActions.CREATE_OR_UPDATE_BOARD,
      payload: board,
    };
  },
  editBoard: (board) => {
    return {
      type: scrumBoardActions.EDIT_BOARD,
      payload: board,
    };
  },
  newBoard: () => {
    return {
      type: scrumBoardActions.NEW_BOARD,
    };
  },
  deleteBoardWatcher: (boardID) => {
    return {
      type: scrumBoardActions.DELETE_BOARD_WATCHER,
      payload: boardID,
    };
  },
  deleteBoard: (boardID) => {
    return {
      type: scrumBoardActions.DELETE_BOARD,
      payload: boardID,
    };
  },

  // Label Actions
  createOrUpdateLabel: (label) => {
    return {
      type: scrumBoardActions.CREATE_OR_UPDATE_LABEL,
      payload: label,
    };
  },
  editLabel: (label) => {
    return {
      type: scrumBoardActions.EDIT_LABEL,
      payload: label,
    };
  },
  deleteLabel: (labelID) => {
    return {
      type: scrumBoardActions.DELETE_LABEL,
      payload: labelID,
    };
  },
};

export default scrumBoardActions;
