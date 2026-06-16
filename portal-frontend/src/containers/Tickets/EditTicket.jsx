import React, { useEffect, useState } from "react";
import { Button, Form, Modal, Select, message } from "antd";
import { getUserByName } from "../../Api/UserApi";
import { UpdateTicket } from "../../Api/TicketApi";
import { getAllBoards, getTaskListWithTasks } from "../../Api/ScrumBoardApi";
import { ticketStatus } from "../../Data/ticketStatus";
import { ticketRequestTypes } from "../../Data/ticketRequestTypes";
import { EditOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";

const EditTicket = ({ ticketData, refreshDetail }) => {
  const intl = useIntl();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [apiProgress, setApiProgress] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [userList, setUserList] = useState([]);

  const [isAssigned, setIsAssigned] = useState(false);
  const [assignedUserId, setAssignedUserId] = useState(undefined);
  const [boardOptions, setBoardOptions] = useState([]);
  const [listOptions, setListOptions] = useState([
    { label: intl.formatMessage({ id: "tickets.lists.defaultLabel" }), value: "default_biletler" },
  ]);
  const [selectedBoardId, setSelectedBoardId] = useState(undefined);
  const [selectedTaskListId, setSelectedTaskListId] = useState("default_biletler");

  useEffect(() => {
    if (ticketData.assignedUser && isModalVisible) {
      setUserList((prev) => {
        const seeded = {
          label: `${ticketData.assignedUser.name}`,
          value: ticketData.assignedUser.id,
        };
        const exists = prev.some((item) => item.value === seeded.value);
        return exists ? prev : [seeded, ...prev];
      });
      setAssignedUserId(ticketData.assignedUser.id);
    }
    if (ticketData.status !== 0 && isModalVisible) {
      setIsAssigned(true);
    }
  }, [isModalVisible, ticketData]);

  useEffect(() => {
    if (!isModalVisible) return;
    const loadBoards = async () => {
      try {
        const response = await getAllBoards();
        const filteredBoards = (response.data.data || []).filter(
          (board) => board?.project?.id === ticketData.project.id
        );
        setBoardOptions(
          filteredBoards.map((board) => ({ label: board.name, value: board.id }))
        );
      } catch (error) {
        setBoardOptions([]);
      }
    };
    loadBoards();
  }, [isModalVisible, ticketData.project.id]);

  const onBoardChange = async (boardId) => {
    setSelectedBoardId(boardId);
    setSelectedTaskListId("default_biletler");
    if (!boardId) {
      setListOptions([
        {
          label: intl.formatMessage({ id: "tickets.lists.defaultLabel" }),
          value: "default_biletler",
        },
      ]);
      return;
    }
    try {
      const response = await getTaskListWithTasks(boardId);
      const dynamicLists = (response.data.data || []).map((taskList) => ({
        label: taskList.name,
        value: taskList.id,
      }));
      const uniqueLists = dynamicLists.filter((list) => list.label !== "Biletler");
      setListOptions([
        {
          label: intl.formatMessage({ id: "tickets.lists.defaultLabel" }),
          value: "default_biletler",
        },
        ...uniqueLists,
      ]);
    } catch (error) {
      setListOptions([
        {
          label: intl.formatMessage({ id: "tickets.lists.defaultLabel" }),
          value: "default_biletler",
        },
      ]);
    }
  };

  //// Modal
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  function safelyParseJSON(jsonString) {
    try {
      return JSON.parse(jsonString) ?? undefined;
    } catch (error) {
      return [];
    }
  }

  const tailLayout = {
    wrapperCol: {
      offset: 8,
      span: 16,
    },
  };

  //// Form onFinish
  const onFinish = async (values) => {
    const requestTypeString = values.requestType
      .map((item) => `"${item}"`)
      .join(", ");

    const formattedRequestType = `[${requestTypeString}]`;
    const formData = {
      id: ticketData.id,
      status: values.status,
      assignedUserId: assignedUserId,
      targetBoardId: selectedBoardId || null,
      targetTaskListId:
        selectedTaskListId && selectedTaskListId !== "default_biletler"
          ? selectedTaskListId
          : null,
      requestType: requestTypeString && formattedRequestType,
    };

    setApiProgress(true);
    try {
      await UpdateTicket(formData);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "tickets.edit.toast.updated" }),
      });
    } catch (e) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "tickets.edit.toast.error" }),
      });
    }
    refreshDetail(true);
    setApiProgress(false);
    setIsModalVisible(false);
  };

  const searchUserList = async (username) => {
    if (username === "") setUserList([]);
    const response = await getUserByName(username);
    setUserList(
      response.data.data.map((user) => ({
        label: `${user.name}`,
        value: user.id,
      }))
    );
  };

  const onStatusChange = (value) => {
    if (value === 0) {
      setIsAssigned(false);
      setAssignedUserId(undefined);
    } else if (value === 1) {
      setIsAssigned(true);
    } else {
      setIsAssigned(true);
    }
  };

  return (
    <div>
      {contextHolder}
      <Button
        type="default"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        icon={<EditOutlined />}
        onClick={showModal}
      >
        {intl.formatMessage({ id: "tickets.edit.button" })}
      </Button>

      <Modal
        destroyOnClose="true"
        title={intl.formatMessage({ id: "tickets.edit.modalTitle" })}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          labelCol={{
            span: 8,
          }}
          wrapperCol={{
            span: 16,
          }}
          style={{
            maxWidth: 700,
          }}
          layout="horizontal"
          onFinish={onFinish}
        >
          <Form.Item
            initialValue={ticketData.status}
            label={intl.formatMessage({ id: "tickets.edit.form.status.label" })}
            name="status"
            style={{ marginBottom: 10 }}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "tickets.edit.form.status.required" }),
              },
            ]}
          >
            <Select
              showSearch
              placeholder={intl.formatMessage({ id: "tickets.edit.form.status.placeholder" })}
              optionFilterProp="children"
              onChange={(value) => onStatusChange(value)}
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={ticketStatus}
            />
          </Form.Item>

          <Form.Item
            initialValue={safelyParseJSON(ticketData.requestType)}
            label={intl.formatMessage({ id: "tickets.edit.form.requestType.label" })}
            name="requestType"
            style={{ marginBottom: 10 }}
          >
            <Select
              mode="multiple"
              showSearch
              placeholder={intl.formatMessage({ id: "tickets.edit.form.requestType.placeholder" })}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "")
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={ticketRequestTypes}
            />
          </Form.Item>

          {isAssigned && (
            <>
              <Form.Item
                name="assignedUser"
                label={intl.formatMessage({ id: "tickets.edit.form.assignedUser.label" })}
                initialValue={
                  ticketData.assignedUser ? ticketData.assignedUser.id : null
                }
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({ id: "tickets.edit.form.assignedUser.required" }),
                  },
                ]}
              >
                <Select
                  onChange={(value) => setAssignedUserId(value)}
                  showSearch
                  placeholder={intl.formatMessage({ id: "tickets.edit.form.assignedUser.placeholder" })}
                  defaultActiveFirstOption={false}
                  suffixIcon={null}
                  filterOption={false}
                  onSearch={searchUserList}
                  notFoundContent={null}
                  options={userList}
                />
              </Form.Item>

              <Form.Item label={intl.formatMessage({ id: "tickets.edit.form.targetBoard.label" })}>
                <Select
                  allowClear
                  placeholder={intl.formatMessage({
                    id: "tickets.edit.form.targetBoard.placeholder",
                  })}
                  options={boardOptions}
                  value={selectedBoardId}
                  onChange={onBoardChange}
                />
              </Form.Item>

              <Form.Item label={intl.formatMessage({ id: "tickets.edit.form.targetList.label" })}>
                <Select
                  disabled={!selectedBoardId}
                  placeholder={intl.formatMessage({
                    id: "tickets.edit.form.targetList.placeholder",
                  })}
                  options={listOptions}
                  value={selectedTaskListId}
                  onChange={setSelectedTaskListId}
                />
              </Form.Item>
            </>
          )}

          <Form.Item {...tailLayout} style={{ marginBottom: 0 }}>
            <Button
              style={{ float: "right" }}
              type="primary"
              htmlType="submit"
              loading={apiProgress}
            >
              {intl.formatMessage({ id: "tickets.edit.actions.save" })}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EditTicket;
