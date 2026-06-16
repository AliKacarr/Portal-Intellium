import axios from "axios";
import { host } from "./host";

// LABEL
export const getAllLabels = () => {
  return axios.get(`${host}/api/Labels/getall`);
};

// BOARD CATEGORY
export const getBoardCategories = () => {
  return axios.get(`${host}/api/BoardCategories/getall`);
};

// BOARD
export const getAllBoards = () => {
  return axios.get(`${host}/api/Boards/getall`);
};
export const getAllBasicBoards = () => {
  return axios.get(`${host}/api/Boards/getallbasic`);
};

export const deleteBoard = boardId => {
  return axios.delete(`${host}/api/Boards/delete?boardId=${boardId}`);
};

export const addBoard = board => {
  return axios.post(`${host}/api/Boards/add`, board);
};

export const updateBoard = board => {
  return axios.put(`${host}/api/Boards/update`, board);
};
export const getBoard = boardId => {
  return axios.get(`${host}/api/Boards/get?boardId=${boardId}`);
};

// TASK LIST
export const getTaskListWithTasks = boardId => {
  return axios.get(`${host}/api/TaskLists/getallwithtasks?boardId=${boardId}`);
};
export const addTaskList = (boardId, name) => {
  return axios.post(`${host}/api/TaskLists/add`, {
    boardId,
    name,
  });
};
export const deleteTaskList = taskListId => {
  return axios.delete(`${host}/api/TaskLists/delete?taskListId=${taskListId}`);
};
export const updateTaskList = taskList => {
  return axios.put(`${host}/api/TaskLists/update`, taskList);
};

export const updateTaskListOrder = taskLists => {
  return axios.put(`${host}/api/TaskLists/updateorder`, taskLists);
};

// AI TASK PREVIEW
export const importAiTaskPreviews = payload => {
  return axios.post(`${host}/api/AiTaskPreviews/import`, payload);
};

export const getAiTaskPreviewsMine = () => {
  return axios.get(`${host}/api/AiTaskPreviews/getmine`);
};

export const updateAiTaskPreview = payload => {
  return axios.put(`${host}/api/AiTaskPreviews/update`, payload);
};

export const approveAiTaskPreviews = payload => {
  return axios.post(`${host}/api/AiTaskPreviews/approve`, payload);
};

export const rejectAiTaskPreviews = payload => {
  return axios.post(`${host}/api/AiTaskPreviews/reject`, payload);
};

// TASK
export const getTask = taskId => {
  return axios.get(`${host}/api/Tasks/getbyid?id=${taskId}`);
};
export const deleteTask = taskId => {
  return axios.delete(`${host}/api/Tasks/delete?id=${taskId}`);
};
export const updateTask = task => {
  return axios.put(`${host}/api/Tasks/update`, task);
};
export const addTask = task => {
  return axios.post(`${host}/api/Tasks/add`, task);
};
export const updateTaskOrder = tasks => {
  return axios.patch(`${host}/api/Tasks/updateorder`, tasks);
};

// TASK COMMENT
export const getTaskComments = taskId => {
  return axios.get(`${host}/api/TaskComments/getall?taskId=${taskId}`);
};
export const addTaskComment = comment => {
  return axios.post(`${host}/api/TaskComments/add`, comment);
};
export const deleteTaskComment = commentId => {
  return axios.delete(
    `${host}/api/TaskComments/delete?taskCommentId=${commentId}`
  );
};

// TASK TODO LIST
export const addTaskTodoList = todoList => {
  return axios.post(`${host}/api/TaskTodoLists/add`, todoList);
};
export const getAllTaskTodoList = taskId => {
  return axios.get(`${host}/api/TaskTodoLists/getallwithtodo?taskId=${taskId}`);
};
export const deleteTaskTodoList = id => {
  return axios.delete(`${host}/api/TaskTodoLists/delete?id=${id}`);
};
export const updateTaskTodoList = todoList => {
  return axios.put(`${host}/api/TaskTodoLists/update`, todoList);
};

// TASK TODO
export const changeStateTaskTodo = (id, state) => {
  return axios.put(`${host}/api/TaskTodos/change?id=${id}&state=${state}`);
};
export const addTaskTodo = todo => {
  return axios.post(`${host}/api/TaskTodos/add`, todo);
};
export const deleteTaskTodo = id => {
  return axios.delete(`${host}/api/TaskTodos/delete?id=${id}`);
};
export const updateTaskTodo = todo => {
  return axios.put(`${host}/api/TaskTodos/update`, todo);
};

// TASK ATTACHMENT
export const addTaskAttachment = attachments => {
  return axios.post(`${host}/api/TaskAttachments/add`, attachments, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
export const getAllTaskAttachment = taskId => {
  return axios.get(`${host}/api/TaskAttachments/getall?taskId=${taskId}`);
};
export const deleteTaskAttachment = id => {
  return axios.delete(
    `${host}/api/TaskAttachments/delete?taskAttachmentId=${id}`
  );
};

// TASK MEMBER
export const getAllTaskMembers = boardId => {
  return axios.get(
    `${host}/api/TaskMembers/getallbyboardid?boardId=${boardId}`
  );
};

// BOARD MEMBERS
export const getAllBoardMembers = boardId => {
  return axios.get(`${host}/api/BoardMembers/getall?boardId=${boardId}`);
};
export const addBoardMembers = members => {
  return axios.post(`${host}/api/BoardMembers/add`, members);
};
export const deleteBoardMember = id => {
  return axios.delete(`${host}/api/BoardMembers/delete?boardMemberId=${id}`);
};
