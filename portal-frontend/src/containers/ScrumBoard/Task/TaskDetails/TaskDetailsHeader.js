import React, { useState } from "react";
import styled from "styled-components";
import {
  Button,
  Popconfirm,
  Popover,
  Space,
  Spin,
  Tooltip,
  Upload,
  message,
} from "antd";
import { useIntl } from "react-intl";
import { IconSvg } from '@iso/components/ScrumBoard/IconSvg/IconSvg';
import RemoveIcon from '@iso/assets/images/icon/02-icon.svg';
import PlusIcon from '@iso/assets/images/icon/24.svg';
import ArrowIcon from '@iso/assets/images/icon/14-icon.svg';
import AddTodo from "../../../../components/ScrumBoard/AddTodo/AddTodo";
import { Formik } from "formik";
import {
  addTaskAttachment,
  addTaskTodoList,
} from "../../../../Api/ScrumBoardApi";
import { useDispatch } from "react-redux";
import scrumBoardActions from '@iso/redux/scrumBoard/actions';
import { CloudUploadOutlined } from "@ant-design/icons";

const Container = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 69px;
  background-color: #ffffff;
  border-bottom: 1px solid #e9e9e9;
`;

const ActionButtons = styled.div`
  > img {
    margin-right: 15px;
    border: none;
    width: 40px;
    margin-left: -5px;
  }
`;

const IconButtons = styled.div`
  > img {
    margin-left: 15px;
    margin-right: 0;
  }
`;
export default function CardDetailsHeader({
  onIconClick,
  onBtnClick,
  onDelete,
  onEditCancel,
  apiProgress,
  taskId,
  reloadAttachment,
}) {
  const intl = useIntl();
  const dispatch = useDispatch();
  const [addTodoApiProgress, setAddTodoApiProgress] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [uploadApiProgress, setUploadApiProgress] = useState(false);

  const addTodoValues = {
    taskId,
    title: "",
  };

  const handlePopoverOpenChange = (newOpen) => {
    setPopoverOpen(newOpen);
  };

  const handleSubmitAddTodo = async (e, formikAddTodo) => {
    e.preventDefault();
    setAddTodoApiProgress(true);
    try {
      if (formikAddTodo.values.title) {
        await addTaskTodoList(formikAddTodo.values);
        dispatch(scrumBoardActions.reloadTaskTodoLists(true));
        setPopoverOpen(false);
        formikAddTodo.resetForm();
      }
    } catch (error) {
      console.log(error);
    }
    setAddTodoApiProgress(false);
  };

  const addTodoComponent = () => {
    return (
      <Formik
        initialValues={addTodoValues}
        component={(formik) => (
          <AddTodo
            {...formik}
            handleSubmit={(e) => handleSubmitAddTodo(e, formik)}
            onCancel={() => setPopoverOpen(false)}
            apiProgress={addTodoApiProgress}
          />
        )}
      ></Formik>
    );
  };

  const onUploadChange = async ({ fileList }) => {
    if (fileList.length > 0) {
      const formData = new FormData();
      fileList.forEach((file) => {
        formData.append("taskAttachments", file.originFileObj);
        formData.append("taskId", taskId);
      });
      setUploadApiProgress(true);
      try {
        message.loading(intl.formatMessage({ id: 'scrumboard.taskDetailsHeader.uploading' }), 0);

        await addTaskAttachment(formData);
        reloadAttachment();
        message.destroy();
        message.success(intl.formatMessage({ id: 'scrumboard.taskDetailsHeader.uploaded' }));
        dispatch(scrumBoardActions.incrementTaskAttachmentCount(taskId));
      } catch (error) {
        message.destroy();
        message.warn(intl.formatMessage({ id: 'scrumboard.taskDetailsHeader.uploadLimit' }));
      }
      setUploadApiProgress(false);
    }
  };

  return (
    <Container>
      {apiProgress ? (
        <Spin />
      ) : (
        <>
          <ActionButtons>
            <IconSvg src={ArrowIcon} onClick={onIconClick} />
            <Button htmlType="button" type="primary" onClick={onBtnClick}>
              {intl.formatMessage({ id: 'scrumboard.taskDetailsHeader.updateTask' })}
            </Button>
            {onEditCancel && (
              <Button type="default" onClick={onEditCancel}>
                {intl.formatMessage({ id: 'scrumboard.taskDetailsHeader.cancel' })}
              </Button>
            )}
          </ActionButtons>

          <IconButtons>
            <Space>
              {uploadApiProgress ? (
                <Spin indicator />
              ) : (
                <Upload onChange={onUploadChange} showUploadList={false}>
                  <Tooltip title={intl.formatMessage({ id: 'scrumboard.taskDetailsHeader.uploadTooltip' })} placement="bottom">
                    <Button
                      icon={
                        <CloudUploadOutlined style={{ color: "#53607C" }} />
                      }
                      type="dashed"
                    />
                  </Tooltip>
                </Upload>
              )}
            </Space>

            <Popover
              content={addTodoComponent}
              trigger="click"
              placement="bottomLeft"
              open={popoverOpen}
              onOpenChange={handlePopoverOpenChange}
            >
              <Tooltip title={intl.formatMessage({ id: 'scrumboard.taskDetailsHeader.addChecklist' })} placement="bottom">
                <IconSvg src={PlusIcon} />
              </Tooltip>
            </Popover>

            <Popconfirm
              title={intl.formatMessage({ id: 'scrumboard.taskDetailsHeader.deleteTaskConfirm' })}
              okText={intl.formatMessage({ id: 'scrumboard.common.yes' })}
              cancelText={intl.formatMessage({ id: 'scrumboard.common.no' })}
              onConfirm={onDelete}
              placement="bottomRight"
            >
              <Tooltip title={intl.formatMessage({ id: 'scrumboard.taskDetailsHeader.deleteTask' })} placement="bottom">
                <IconSvg src={RemoveIcon} />
              </Tooltip>
            </Popconfirm>
          </IconButtons>
        </>
      )}
    </Container>
  );
}
