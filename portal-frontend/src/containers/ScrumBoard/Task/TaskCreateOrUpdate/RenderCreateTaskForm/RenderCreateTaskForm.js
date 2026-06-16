import React, { useMemo, useState } from "react";
import { Form, Field } from "formik";
import { Form as AntForm } from "@ant-design/compatible";
import { Row, Col, DatePicker, message } from "antd";
import { AntTextArea } from "@iso/components/ScrumBoard/AntFields";
import CreateTaskHeader from "../CreateTaskHeader/CreateTaskHeader";
import HeadingWithIcon from "@iso/components/ScrumBoard/HeadingWithIcon/HeadingWithIcon";
import TitleIcon from "@iso/assets/images/icon/05-icon.svg";
import DescriptionIcon from "@iso/assets/images/icon/06-icon.svg";
import DebounceSelect from "@iso/components/ScrumBoard/SearchUser/SearchUserSelect";
import {
  addTask,
  deleteTask,
  getAllLabels,
  updateTask,
} from "../../../../../Api/ScrumBoardApi";
import moment from "moment";
import { useDispatch } from "react-redux";
import scrumBoardActions from "@iso/redux/scrumBoard/actions";
import { getUserByName } from "../../../../../Api/UserApi";
import MarkdownEditor from "../../../../../components/Custom/MarkdownEditor/MarkdownEditor";
import { useIntl } from "react-intl";

export default function RenderCreateTaskForm({
  values,
  submitCount,
  onCancel,
  onEditCancel,
  columnId,
  onLocalSave,
  hideDelete,
  disableDetailBack,
}) {
  const intl = useIntl();
  const dispatch = useDispatch();

  const [apiProgress, setApiProgress] = useState(false);

  const [taskListId, setTaskListId] = useState();
  const [taskName, setTaskName] = useState(undefined);
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStartDate, setTaskStartDate] = useState();
  const [taskDueDate, setTaskDueDate] = useState();

  const [initialTaskMembers, setInitialTaskMembers] = useState([]);
  const [initialTaskLabels, setInitialTaskLabels] = useState([]);
  const [taskLabels, setTaskLabels] = useState();

  const [addUserIds, setAddUserIds] = useState([]);
  const [removeUserIds, setRemoveUserIds] = useState([]);

  const [addLabelIds, setAddLabelIds] = useState([]);
  const [removeLabelIds, setRemoveLabelIds] = useState([]);

  // İlk mount'ta formu task değerleriyle doldurur; values/columnId değişiminde yeniden çalıştırmıyoruz.
  useMemo(() => {
    setTaskName(values.task.name);
    setTaskDescription(values.task.description);

    if (values.editing) {
      setTaskListId(values.task.taskListId);
      setTaskStartDate(values.task.createdDate);
      setTaskDueDate(values.task.dueDate);
    } else {
      setTaskListId(columnId);
      setTaskStartDate(new Date().getTime());
      setTaskDueDate(new Date().getTime());
    }

    async function fetchData() {
      try {
        const response = (await getAllLabels()).data;

        if (response.data) {
          const labels = response.data.map((label) => ({
            label: label.name,
            value: label.id,
          }));
          setTaskLabels(labels);
        }
      } catch (error) {}
    }

    fetchData();

    if (values.taskMembers) {
      const members = values.taskMembers.map((user) => ({
        label: user.name,
        value: user.userId,
      }));
      setInitialTaskMembers(members);
    }
    if (values.taskLabels) {
      const labels = values.taskLabels.map((label) => ({
        label: label.name,
        value: label.labelId,
      }));
      setInitialTaskLabels(labels);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only init
  }, []);

  async function SearchUserList(username) {
    if (username === "") return;
    return getUserByName(username).then((response) =>
      response.data.data.map((user) => ({
        label: `${user.name}`,
        value: user.id,
      }))
    );
  }

  const onMemberDeselect = (member) => {
    if (addUserIds.includes(member.value)) {
      setAddUserIds((prevAddUserIds) =>
        prevAddUserIds.filter((userId) => userId !== member.value)
      );
    }
    if (!removeUserIds.includes(member.value)) {
      setRemoveUserIds((prevRemoveUserIds) => [
        ...prevRemoveUserIds,
        member.value,
      ]);
    }
    setInitialTaskMembers((prevInitialTaskMembers) =>
      prevInitialTaskMembers.filter((user) => user.value !== member.value)
    );
  };

  const onMemberSelect = (member) => {
    if (
      !addUserIds.includes(member.value) &&
      !initialTaskMembers.some((user) => user.value === member.value)
    ) {
      setAddUserIds((prevAddUserIds) => [...prevAddUserIds, member.value]);
    }
    if (removeUserIds.includes(member.value)) {
      setRemoveUserIds((prevRemoveUserIds) =>
        prevRemoveUserIds.filter((userId) => userId !== member.value)
      );
    }
  };

  const onLabelDeselect = (label) => {
    if (addLabelIds.includes(label.value)) {
      setAddLabelIds((prevAddLabelIds) =>
        prevAddLabelIds.filter((labelId) => labelId !== label.value)
      );
    }
    if (!removeLabelIds.includes(label.value)) {
      setRemoveLabelIds((prevRemoveLabelIds) => [
        ...prevRemoveLabelIds,
        label.value,
      ]);
    }
    setInitialTaskLabels((prevInitialTaskLabels) =>
      prevInitialTaskLabels.filter(
        (currentLabel) => currentLabel.value !== label.value
      )
    );
  };

  const onLabelSelect = (label) => {
    if (
      !addLabelIds.includes(label.value) &&
      !initialTaskLabels.some(
        (currentLabel) => currentLabel.value === label.value
      )
    ) {
      setAddLabelIds((prevAddLabelIds) => [...prevAddLabelIds, label.value]);
    }
    if (removeLabelIds.includes(label.value)) {
      setRemoveLabelIds((prevRemoveLabelIds) =>
        prevRemoveLabelIds.filter((labelId) => labelId !== label.value)
      );
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!taskName) {
      message.warning(intl.formatMessage({ id: "scrumboard.taskForm.nameEmpty" }));
      return;
    }
    if (!taskDescription) {
      message.warning(intl.formatMessage({ id: "scrumboard.taskForm.descEmpty" }));
      return;
    }

    if (onLocalSave) {
      onLocalSave({
        id: values.task.id,
        name: taskName,
        description: taskDescription,
        startDate: taskStartDate,
        dueDate: taskDueDate,
        taskListId: taskListId,
      });
      onCancel();
      return;
    }

    setApiProgress(true);
    var task = {
      task: {
        id: values.editing ? values.task.id : 0,
        taskListId: taskListId,
        name: taskName,
        description: taskDescription,
        createdDate: moment(new Date(taskStartDate)),
        dueDate: moment(new Date(taskDueDate)),
      },
      AddUserIds: addUserIds,
      AddLabelIds: addLabelIds,
    };
    if (values.editing) {
      task = {
        ...task,
        orderNo: values.task.orderNo,
        RemoveUserIds: removeUserIds,
        RemoveLabelIds: removeLabelIds,
      };
      try {
        await updateTask(task);
      } catch (error) {}
    } else {
      try {
        await addTask(task);
      } catch (error) {}
    }

    dispatch(scrumBoardActions.refreshTask(true));
    setApiProgress(false);
    onCancel();
  };

  const onDelete = async () => {
    try {
      setApiProgress(true);
      await deleteTask(values.task.id);
      dispatch(scrumBoardActions.refreshTask(true));
      onCancel();
    } catch (error) {
      console.log(error);
      setApiProgress(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <CreateTaskHeader
        values={values}
        onCancel={onCancel}
        onDelete={onDelete}
        onEditCancel={onEditCancel}
        apiProgress={apiProgress}
        hideDelete={hideDelete}
        disableDetailBack={disableDetailBack}
      />
      <Field
        component={AntTextArea}
        value={taskName}
        onInput={(e) => {
          setTaskName(e.target.value);
        }}
        name="name"
        type="text"
        tasklabel={
          <HeadingWithIcon
            heading={intl.formatMessage({ id: "scrumboard.taskForm.nameLabel" })}
            iconSrc={TitleIcon}
          />
        }
        placeholder={intl.formatMessage({ id: "scrumboard.taskForm.namePh" })}
        submitCount={submitCount}
        hasFeedback
        autoSize={{ minRows: 2 }}
        formitem={{
          colon: false,
        }}
      />

      <Row gutter={16}>
        <Col span={6}>
          <AntForm.Item colon={false} hasFeedback name="memberSelect">
            <HeadingWithIcon
              heading={intl.formatMessage({ id: "scrumboard.taskForm.membersLabel" })}
            />
            <DebounceSelect
              mode="multiple"
              value={initialTaskMembers}
              placeholder={intl.formatMessage({ id: "scrumboard.taskForm.membersPh" })}
              fetchOptions={SearchUserList}
              onDeselect={onMemberDeselect}
              onSelect={onMemberSelect}
              onChange={(e) => setInitialTaskMembers(e)}
              style={{
                width: "100%",
              }}
            />
          </AntForm.Item>
        </Col>
        <Col span={6}>
          <AntForm.Item colon={false} hasFeedback>
            <HeadingWithIcon
              heading={intl.formatMessage({ id: "scrumboard.taskForm.tagsLabel" })}
            />
            <DebounceSelect
              mode="multiple"
              value={initialTaskLabels}
              placeholder={intl.formatMessage({ id: "scrumboard.taskForm.tagsPh" })}
              customOptions={taskLabels}
              onDeselect={onLabelDeselect}
              onSelect={onLabelSelect}
              onChange={(e) => setInitialTaskLabels(e)}
              style={{
                width: "100%",
              }}
            />
          </AntForm.Item>
        </Col>

        <Col span={6}>
          <AntForm.Item colon={false} hasFeedback>
            <HeadingWithIcon
              heading={intl.formatMessage({ id: "scrumboard.taskForm.startLabel" })}
            />
            <DatePicker
              value={taskStartDate ? moment(new Date(taskStartDate)) : moment()}
              onChange={(e) => setTaskStartDate(e)}
              placeholder={intl.formatMessage({ id: "scrumboard.taskForm.startPh" })}
              format={"DD.MM.YYYY"}
            />
          </AntForm.Item>
        </Col>

        <Col span={6}>
          <AntForm.Item colon={false} hasFeedback>
            <HeadingWithIcon
              heading={intl.formatMessage({ id: "scrumboard.taskForm.endLabel" })}
            />
            <DatePicker
              value={taskDueDate ? moment(new Date(taskDueDate)) : moment()}
              onChange={(e) => setTaskDueDate(e)}
              placeholder={intl.formatMessage({ id: "scrumboard.taskForm.endPh" })}
              format={"DD.MM.YYYY"}
            />
          </AntForm.Item>
        </Col>
      </Row>

      <div>
        <HeadingWithIcon
          heading={intl.formatMessage({ id: "scrumboard.taskForm.descriptionLabel" })}
          iconSrc={DescriptionIcon}
        />
        <MarkdownEditor value={taskDescription} onChange={setTaskDescription} />
      </div>
    </Form>
  );
}
