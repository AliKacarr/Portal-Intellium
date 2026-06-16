import React, { useEffect, useState } from "react";
import { Form } from "formik";
import {
  Button,
  Select,
  Switch,
  DatePicker,
  Input,
  notification,
  Spin,
} from "antd";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";
import { Wrapper } from "./CreateOrUpdateBoardForm.style";
import { addBoard, getBoardCategories } from "../../../Api/ScrumBoardApi";
import { Heading } from "../../../containers/ScrumBoard/Board/BoardCreateOrUpdate/BoardCreateOrUpdate.style";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { GetAllProjectAsBasic } from "../../../Api/ProjectApi";

const CreateBoardForm = () => {
  const intl = useIntl();
  const history = useHistory();

  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [apiProgress, setApiProgress] = useState(false);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardCategory, setBoardCategory] = useState();
  const [boardProject, setBoardProject] = useState();
  const [isMember, setIsMember] = useState(false);
  const [avatar, setAvatar] = useState("");
  const [endDate, setEndDate] = useState(undefined);
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
  }, []);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = {
      projectId: boardProject,
      categoryId: boardCategory,
      name: boardName,
      avatarPath: avatar,
      privateToProjectMembers: isMember,
      startDate: new Date().toISOString(),
      endDate: endDate,
    };

    const warnTitle = intl.formatMessage({ id: "scrumboard.createBoard.warnTitle" });

    if (boardName.length < 3) {
      openNotificationWithIcon(
        "warning",
        warnTitle,
        intl.formatMessage({ id: "scrumboard.createBoard.nameShort" })
      );
      return;
    }
    if (boardCategory === undefined) {
      openNotificationWithIcon("warning", warnTitle, intl.formatMessage({ id: "scrumboard.createBoard.selectCategory" }));
      return;
    }
    if (boardProject === undefined) {
      openNotificationWithIcon("warning", warnTitle, intl.formatMessage({ id: "scrumboard.createBoard.selectProject" }));
      return;
    }
    if (endDate === undefined) {
      openNotificationWithIcon("warning", warnTitle, intl.formatMessage({ id: "scrumboard.createBoard.selectEndDate" }));
      return;
    }

    setApiProgress(true);
    try {
      const response = await addBoard(formData);
      openNotificationWithIcon(
        "success",
        intl.formatMessage({ id: "scrumboard.createBoard.successTitle" }),
        response.data.message
      );
      setBoardName();
      setBoardCategory();
      setBoardProject();
      setEndDate();
      setButtonDisabled(true);
      setTimeout(() => {
        history.push("/dashboard/scrum-board");
      }, 3000);
    } catch (error) {
      openNotificationWithIcon("error", intl.formatMessage({ id: "scrumboard.createBoard.errorTitle" }), error.response.data.Message);
    }

    setApiProgress(false);
  };

  return (
    <Wrapper>
      <Heading>{intl.formatMessage({ id: "scrumboard.createBoard.heading" })}</Heading>
      <Form onSubmit={handleSubmit}>
        <Input
          id="name"
          value={boardName}
          onChange={(e) => setBoardName(e.target.value)}
          name="name"
          type="text"
          label={intl.formatMessage({ id: "scrumboard.createBoard.namePh" })}
          placeholder={intl.formatMessage({ id: "scrumboard.createBoard.namePh" })}
          size="large"
          className="mb-10"
        />

        <Select
          onChange={(value) => setBoardCategory(value)}
          name="category"
          value={boardCategory}
          placeholder={intl.formatMessage({ id: "scrumboard.createBoard.categoryPh" })}
          size="large"
          className="mb-10"
          options={categories}
        />

        <Select
          onChange={(value) => setBoardProject(value)}
          name="project"
          value={boardProject}
          placeholder={intl.formatMessage({ id: "scrumboard.createBoard.projectPh" })}
          size="large"
          className="mb-10"
          options={projects}
        />

        <div className="switch-form-item mb-10">
          <Switch
            className="switch-form-item"
            name="isMember"
            checked={isMember}
            onChange={(checked) => setIsMember(checked)}
            checkedChildren={<CheckOutlined />}
            unCheckedChildren={<CloseOutlined />}
          />
          <span style={{ marginLeft: "10px" }}>{intl.formatMessage({ id: "scrumboard.createBoard.membersOnly" })}</span>
        </div>

        <DatePicker
          placeholder={intl.formatMessage({ id: "scrumboard.createBoard.endDatePh" })}
          value={endDate}
          onChange={(e) => setEndDate(e)}
          format={"DD.MM.YYYY"}
        />

        <Spin spinning={apiProgress} style={{ marginTop: 10 }}>
          <Button
            htmlType="submit"
            type="primary"
            style={{ width: "100%", marginTop: 20 }}
            size="large"
            disabled={buttonDisabled}
          >
            {intl.formatMessage({ id: "scrumboard.createBoard.submit" })}
          </Button>
        </Spin>
      </Form>

      {contextHolder}
    </Wrapper>
  );
};

export default CreateBoardForm;
