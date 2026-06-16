import React from "react";
import AddTodoWrapper from "./AddTodo.style";
import { Button, Spin } from "antd";
import { useIntl } from "react-intl";
import { AntInput } from "../AntFields";
import { Form, Field } from "formik";
import HeadingWithIcon from "../HeadingWithIcon/HeadingWithIcon";

const AddTodo = ({ handleSubmit, apiProgress, onCancel }) => {
  const intl = useIntl();
  const required = (value) => (!value ? intl.formatMessage({ id: "scrumboard.validation.required" }) : "");

  return (
    <AddTodoWrapper className="add-todo-wrapper">
      <Form onSubmit={handleSubmit}>
        <HeadingWithIcon heading={intl.formatMessage({ id: "scrumboard.addTodo.heading" })} />
        <Field
          component={AntInput}
          name="title"
          type="text"
          placeholder={intl.formatMessage({ id: "scrumboard.addTodo.placeholder" })}
          validate={required}
          size="medium"
          formitem={{
            colon: false,
          }}
        />
        {apiProgress ? (
          <Spin />
        ) : (
          <>
            <Button type="default" size="medium" onClick={onCancel}>
              {intl.formatMessage({ id: "scrumboard.addTodo.cancel" })}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{ marginLeft: 10 }}
              size="medium"
            >
              {intl.formatMessage({ id: "scrumboard.addTodo.save" })}
            </Button>
          </>
        )}
      </Form>
    </AddTodoWrapper>
  );
};

export default AddTodo;
