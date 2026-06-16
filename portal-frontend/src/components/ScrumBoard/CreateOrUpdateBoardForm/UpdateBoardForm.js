import React, { useEffect, useState } from "react";

import {
  Button,
  Select,
  Switch,
  DatePicker,
  Input,
  notification,
  Form,
} from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";
import { Wrapper } from "./CreateOrUpdateBoardForm.style";
import {
  getBoard,
  getBoardCategories,
  updateBoard,
} from "../../../Api/ScrumBoardApi";
import { Heading } from "../../../containers/ScrumBoard/Board/BoardCreateOrUpdate/BoardCreateOrUpdate.style";
import {
  useHistory,
  useParams,
} from "react-router-dom/cjs/react-router-dom.min";
import { GetAllProjectAsBasic } from "../../../Api/ProjectApi";
import moment from "moment";

const UpdateBoardForm = () => {
  const intl = useIntl();
  const history = useHistory();
  const { boardId } = useParams();
  const [board, setBoard] = useState();
  const [privateToProjectMembers, setPrivateToProjectMembers] = useState(false);
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [apiProgress, setApiProgress] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, title, content) => {
    api[type]({
      message: title,
      description: content,
    });
  };

  useEffect(() => {
    getCategories();
    getProjects();
    fetchBoard();
  }, []);

  const fetchBoard = async () => {
    try {
      const response = await getBoard(boardId);
      setPrivateToProjectMembers(response.data.data.privateToProjectMembers);
      setBoard(response.data.data);
    } catch (error) {}
  };
  const getCategories = async () => {
    try {
      const response = await getBoardCategories();
      setCategories(
        response.data.data.map((category) => ({
          label: `${category.name}`,
          value: category.id,
        }))
      );
    } catch (error) {
      console.log("error:", error);
    }
  };

  const getProjects = async () => {
    try {
      const response = await GetAllProjectAsBasic();

      setProjects(
        response.data.data.map((project) => ({
          label: `${project.projectName}`,
          value: project.id,
        }))
      );
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const onFinish = async (values) => {
    const formData = {
      id: boardId,
      projectId: values.project,
      categoryId: values.category,
      name: values.name,
      avatarPath: "",
      privateToProjectMembers,
      endDate: values.endDate,
    };
    const warnTitle = intl.formatMessage({ id: "scrumboard.createBoard.warnTitle" });
    if (values.name.length < 3) {
      openNotificationWithIcon(
        "warning",
        warnTitle,
        intl.formatMessage({ id: "scrumboard.createBoard.nameShort" })
      );
      return;
    }
    if (values.category === undefined) {
      openNotificationWithIcon("warning", warnTitle, intl.formatMessage({ id: "scrumboard.createBoard.selectCategory" }));
      return;
    }
    if (values.project === undefined) {
      openNotificationWithIcon("warning", warnTitle, intl.formatMessage({ id: "scrumboard.createBoard.selectProject" }));
      return;
    }
    if (values.endDate === undefined) {
      openNotificationWithIcon("warning", warnTitle, intl.formatMessage({ id: "scrumboard.createBoard.selectEndDate" }));
      return;
    }

    setApiProgress(true);
    try {
      const response = await updateBoard(formData);
      openNotificationWithIcon(
        "success",
        intl.formatMessage({ id: "scrumboard.createBoard.successTitle" }),
        response.data.message
      );

      setButtonDisabled(true);
      setTimeout(() => {
        history.push("/dashboard/scrum-board");
      }, 3000);
    } catch (error) {
      openNotificationWithIcon(
        "error",
        intl.formatMessage({ id: "scrumboard.createBoard.errorTitle" }),
        error.response.data.Message
      );
    }

    setApiProgress(false);
  };

  return (
    <Wrapper>
      <Heading>{intl.formatMessage({ id: "scrumboard.updateBoard.heading" })}</Heading>
      {board && (
        <Form onFinish={onFinish}>
          <Form.Item name="name" initialValue={board.name}>
            <Input
              type="text"
              label={intl.formatMessage({ id: "scrumboard.createBoard.namePh" })}
              placeholder={intl.formatMessage({ id: "scrumboard.createBoard.namePh" })}
              size="large"
            />
          </Form.Item>

          <Form.Item name="category" initialValue={board.category.id}>
            <Select
              placeholder={intl.formatMessage({ id: "scrumboard.createBoard.categoryPh" })}
              size="large"
              options={categories}
            />
          </Form.Item>

          <Form.Item name="project" initialValue={board.project.id}>
            <Select
              placeholder={intl.formatMessage({ id: "scrumboard.createBoard.projectPh" })}
              size="large"
              options={projects}
            />
          </Form.Item>

          <div className="switch-form-item mb-10">
            <Form.Item name="isMember" initialValue={privateToProjectMembers}>
              <Switch
                onChange={(e) => setPrivateToProjectMembers(e)}
                checked={privateToProjectMembers}
                checkedChildren={<CheckOutlined />}
                unCheckedChildren={<CloseOutlined />}
              />
              <span style={{ marginLeft: "10px" }}>{intl.formatMessage({ id: "scrumboard.createBoard.membersOnly" })}</span>
            </Form.Item>
          </div>

          <Form.Item name="endDate" initialValue={moment(board.endDate)}>
            <DatePicker placeholder={intl.formatMessage({ id: "scrumboard.createBoard.endDatePh" })} format={"DD.MM.YYYY"} />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              style={{ width: "100%", marginTop: 20 }}
              size="large"
              loading={apiProgress}
              disabled={buttonDisabled}
            >
              {intl.formatMessage({ id: "scrumboard.updateBoard.submit" })}
            </Button>
          </Form.Item>
        </Form>
      )}
      {contextHolder}
    </Wrapper>
  );
};

export default UpdateBoardForm;
