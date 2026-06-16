import React, { useState } from "react";
import { connect, useDispatch } from "react-redux";
import moment from "moment";
import { Formik } from "formik";
import RenderColumnForm from "@iso/components/ScrumBoard/RenderColumnForm/RenderColumnForm";
import { dateFormat } from "@iso/components/ScrumBoard/FieldFormats";
import scrumBoardActions from "@iso/redux/scrumBoard/actions";
import { addTaskList, updateTaskList } from "../../../../Api/ScrumBoardApi";

const initialValues = {
  id: "",
  boardId: "",
  name: "",
  editing: false,
};

const CreateOrUpdateColumn = (props) => {
  const dispatch = useDispatch();
  const [apiProgress, setApiProgress] = useState(false);

  const initials = {
    ...initialValues,
    ...props.taskList,
    editing: props.editing,
    updated_at: moment(Date.now(dateFormat)).toString(),
  };

  const handleSubmit = async (values) => {
    setApiProgress(true);
    try {
      if (values.editing) {
        await updateTaskList({ id: values.id, name: values.name });
      } else {
        await addTaskList(props.boardId, values.name);
      }
      dispatch(scrumBoardActions.refreshTask(true));
      props.onCancel();
    } catch (error) {}
    setApiProgress(false);
  };

  return (
    <Formik
      initialValues={initials}
      onSubmit={handleSubmit}
      render={(formikProps) => (
        <RenderColumnForm
          {...formikProps}
          onCancel={props.onCancel}
          initials={initials}
          apiProgress={apiProgress}
        />
      )}
    />
  );
};
export default CreateOrUpdateColumn;
