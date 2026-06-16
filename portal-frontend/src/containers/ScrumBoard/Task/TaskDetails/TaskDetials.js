import React, { useEffect, useState } from "react";
import { connect, useDispatch, useSelector } from "react-redux";
import { Row, Col, Tooltip, Upload, Avatar, Divider, message, Tag } from "antd";
import moment from "moment";
import "./TaskDetails.css";
import Comments from "@iso/components/ScrumBoard/Comments/Comments";
import HeadingWithIcon from "@iso/components/ScrumBoard/HeadingWithIcon/HeadingWithIcon";
import CardDetailsHeader from "./TaskDetailsHeader";
import {
  CardDetailsWrapper,
  AttachmentWrapper,
  TaskName,
  TaskDescription,
} from "../Task.style";
import TitleIcon from "@iso/assets/images/icon/05-icon.svg";
import DescriptionIcon from "@iso/assets/images/icon/06-icon.svg";
import AttachmentIcon from "@iso/assets/images/icon/01-icon.svg";
import CommentIcon from "@iso/assets/images/icon/09-icon.svg";
import Clock from "@iso/assets/images/icon/17.svg";
import scrumBoardActions from "@iso/redux/scrumBoard/actions";
import {
  deleteTask,
  deleteTaskAttachment,
  deleteTaskTodoList,
  getAllTaskAttachment,
  getAllTaskTodoList,
  getTask,
  getTaskComments,
} from "../../../../Api/ScrumBoardApi";
import { buildApiUrl } from "../../../../Api/host";
import { isEmptyArray } from "formik";
import TaskTodoList from "../TaskTodoList/TaskTodoList";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useIntl } from "react-intl";

const TaskDetials = ({ task, editTask, closeDrawer, openDrawer, columnId }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const reloadTaskDetail = useSelector(
    (state) => state.scrumBoard.reloadTaskDetail
  );
  const reloadTaskComments = useSelector(
    (state) => state.scrumBoard.reloadTaskComments
  );
  const reloadTaskAttachments = useSelector(
    (state) => state.scrumBoard.reloadTaskAttachments
  );
  const reloadTaskTodoLists = useSelector(
    (state) => state.scrumBoard.reloadTaskTodoLists
  );
  const currentUser = useSelector((store) => store.Auth);

  const [apiProgress, setApiProgress] = useState(false);
  const [taskDetails, setTaskDetails] = useState();
  const [taskComments, setTaskComments] = useState();
  const [taskTodoLists, setTaskTodoLists] = useState([]);
  const [taskAttachments, setTaskAttachments] = useState([]);
  const [fileList, setFileList] = useState([]);
  const [deleteTodoListApiProgress, setDeleteTodoListApiProgress] =
    useState(false);

  const onPreview = async (file) => {
    let src = file.url;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj);
        reader.onload = () => resolve(reader.result);
      });
    }
    const image = new Image();
    image.src = src;
    window.open(src);
  };

  const loadComments = async () => {
    try {
      const response = await getTaskComments(task.id);
      setTaskComments(response.data.data);
    } catch (error) {
      console.error("Yorumlar hata oluştu:", error);
    }
  };

  const loadAttachments = async () => {
    try {
      const response = await getAllTaskAttachment(task.id);
      setTaskAttachments(response.data.data);
      setFileList([]);
      const newFileList = response.data.data.map((taskAttachment) => ({
        id: taskAttachment.id,
        creatorUserId: taskAttachment.creatorUserId,
        name: taskAttachment.name,
        url: buildApiUrl(taskAttachment.attachmentPath),
        status: "done",
      }));
      setFileList((prevFileList) => [...newFileList, ...prevFileList]);
    } catch (error) {
      console.error("Eklentilerde hata oluştu:", error);
    }
  };

  const loadTodoLists = async () => {
    try {
      const response = await getAllTaskTodoList(task.id);
      setTaskTodoLists(response.data.data);
    } catch (error) {
      console.error("Eklentilerde hata oluştu:", error);
    }
  };

  const loadTask = async () => {
    try {
      const response = await getTask(task.id);
      setTaskDetails(response.data.data);
    } catch (error) {
      console.error("Veri yüklenirken hata oluştu:", error);
    }
  };

  useEffect(() => {
    loadTask();
    loadAttachments();
    loadComments();
    loadTodoLists();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawer açılışında bir kez yükle
  }, []);

  useEffect(() => {
    if (reloadTaskDetail) {
      loadTask();
      dispatch(scrumBoardActions.reloadTaskDetail(false));
    }
    if (reloadTaskAttachments) {
      loadAttachments();
      dispatch(scrumBoardActions.reloadTaskAttachments(false));
    }
    if (reloadTaskComments) {
      loadComments();
      dispatch(scrumBoardActions.reloadTaskComments(false));
    }
    if (reloadTaskTodoLists) {
      loadTodoLists();
      dispatch(scrumBoardActions.reloadTaskTodoLists(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sadece redux reload bayrakları
  }, [
    reloadTaskDetail,
    reloadTaskAttachments,
    reloadTaskComments,
    reloadTaskTodoLists,
  ]);

  const onDeleteTask = async () => {
    try {
      setApiProgress(true);
      await deleteTask(taskDetails.task.id);
      dispatch(scrumBoardActions.refreshTask(true));
      closeDrawer();
    } catch (error) {
      console.log(error);
      setApiProgress(false);
    }
  };

  const onDeleteAttachment = async (file) => {
    try {
      await deleteTaskAttachment(file.id);
      loadAttachments();
      message.success(intl.formatMessage({ id: "scrumboard.taskDetails.fileRemoved" }));
      dispatch(scrumBoardActions.decrementTaskAttachmentCount(task.id));
    } catch (error) {
      message.error(intl.formatMessage({ id: "scrumboard.taskDetails.fileRemoveError" }));
    }
  };

  const onDeleteTaskTodoList = async (todoListId) => {
    setDeleteTodoListApiProgress(true);
    try {
      await deleteTaskTodoList(todoListId);
      setTaskTodoLists((prevTaskTodoLists) => {
        const updatedTaskTodoLists = prevTaskTodoLists.filter(
          (todoList) => todoList.id !== todoListId
        );
        return updatedTaskTodoLists;
      });
    } catch (error) {
      console.log(error);
    }
    setDeleteTodoListApiProgress(false);
  };

  // Renkler dizisi
  function getColorById(id) {
    const customColors = [
      "#6895D2",
      "#A4CE95",
      "#D04848",
      "#F3B95F",
      "#FDE767",
    ];

    // ID'ye göre indeks hesaplanması
    const index = id % customColors.length;

    // ID'ye göre belirlenen renk döndürülmesi
    return customColors[index];
  }

  return (
    <>
      {taskDetails && (
        <CardDetailsWrapper>
          <CardDetailsHeader
            onBtnClick={() => {
              editTask(taskDetails);
              openDrawer({
                drawerType: "CREATE_OR_EDIT_TASK",
                drawerProps: {
                  initials: { ...taskDetails, editing: true },
                  columnId: columnId,
                },
              });
            }}
            onIconClick={closeDrawer}
            onDelete={onDeleteTask}
            apiProgress={apiProgress}
            taskId={task.id}
            reloadAttachment={loadAttachments}
          />
          <Row style={{ marginTop: 10 }}>
            <Col span={8}>
              <HeadingWithIcon
                heading={intl.formatMessage({ id: "scrumboard.taskDetails.taskName" })}
                iconSrc={TitleIcon}
              />
              <TaskName>{taskDetails.task.name}</TaskName>
            </Col>

            <Col span={8}>
              <HeadingWithIcon
                heading={intl.formatMessage({ id: "scrumboard.taskDetails.startDate" })}
                iconSrc={Clock}
              />
              {moment(taskDetails.task.createdDate).format("DD.MM.YYYY")}
            </Col>

            <Col span={8}>
              <HeadingWithIcon
                heading={intl.formatMessage({ id: "scrumboard.taskDetails.endDate" })}
                iconSrc={Clock}
              />
              {moment(taskDetails.task.dueDate).format("DD.MM.YYYY")}
            </Col>
          </Row>

          <Row>
            <Col span={16}>
              {!isEmptyArray(taskDetails.taskLabels) && (
                <>
                  <HeadingWithIcon
                    heading={intl.formatMessage({ id: "scrumboard.taskDetails.tags" })}
                  />
                  <p>
                    {taskDetails.taskLabels.map((label) => (
                      <Tag
                        key={label.id}
                        className="custom-tag"
                        style={{
                          backgroundColor: `#${label.color}20`,
                          color: `#${label.color}`,
                        }}
                      >
                        {label.name}
                      </Tag>
                    ))}
                  </p>
                </>
              )}
            </Col>

            <Col span={8}>
              {!isEmptyArray(taskDetails.taskMembers) && (
                <>
                  <HeadingWithIcon
                    heading={intl.formatMessage({
                      id: "scrumboard.taskDetails.assignees",
                    })}
                  />

                  <Avatar.Group
                    maxCount={3}
                    size="large"
                    maxStyle={{ color: "#f56a00", backgroundColor: "#fde3cf" }}
                  >
                    {taskDetails.taskMembers.map((assignee) => (
                      <Tooltip
                        key={assignee.id}
                        title={assignee.name}
                        placement="top"
                      >
                        {assignee.imageUrl ? (
                          <Avatar
                            src={buildApiUrl(assignee.imageUrl)}
                          />
                        ) : (
                          <Avatar
                            style={{
                              backgroundColor: getColorById(assignee.userId),
                            }}
                          >
                            {assignee.name.charAt(0).toUpperCase()}
                          </Avatar>
                        )}
                      </Tooltip>
                    ))}
                  </Avatar.Group>
                </>
              )}
            </Col>
          </Row>
          <div style={{ clear: "both", paddingTop: "30px" }}>
            <HeadingWithIcon
              heading={intl.formatMessage({ id: "scrumboard.taskDetails.description" })}
              iconSrc={DescriptionIcon}
            />
            <TaskDescription>
              <ReactMarkdown
                children={taskDetails.task.description
                  .split("\n\n")
                  .map((paragraph) => paragraph.split("\n").join("  \n"))
                  .join("\n\n")}
                remarkPlugins={[remarkGfm]}
              />
            </TaskDescription>
          </div>

          {!isEmptyArray(taskAttachments) && (
            <>
              <AttachmentWrapper>
                <HeadingWithIcon
                  heading={intl.formatMessage({
                    id: "scrumboard.taskDetails.attachments",
                  })}
                  iconSrc={AttachmentIcon}
                />
              </AttachmentWrapper>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                {fileList.map((file) => (
                  <Upload
                    key={file.id}
                    className="upload-list-inline"
                    listType="picture"
                    onPreview={onPreview}
                    onRemove={onDeleteAttachment}
                    showUploadList={{
                      showRemoveIcon: file.creatorUserId === currentUser.id,
                    }}
                    fileList={[file]}
                  ></Upload>
                ))}
              </div>
              <Divider />
            </>
          )}

          {!isEmptyArray(taskTodoLists) && (
            <div>
              {taskTodoLists.map((todoList, index) => (
                <TaskTodoList
                  todoList={todoList}
                  key={index}
                  onDeleteTaskTodoList={onDeleteTaskTodoList}
                  deleteTodoListApiProgress={deleteTodoListApiProgress}
                />
              ))}

              <Divider />
            </div>
          )}
          <HeadingWithIcon
            heading={intl.formatMessage({ id: "scrumboard.taskDetails.comments" })}
            iconSrc={CommentIcon}
          />
          <Comments comments={taskComments} taskId={task.id} />
        </CardDetailsWrapper>
      )}
    </>
  );
};
export default connect(null, { ...scrumBoardActions })(TaskDetials);
