import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Tag,
  message,
} from "antd";
import React, { useState, useEffect } from "react";
import { GetAllCustomerAsBasic } from "../../Api/CustomerApi";
import { EditProject, GetCategories } from "../../Api/ProjectApi";
import { getUserByName } from "../../Api/UserApi";
import moment from "moment";
import { useIntl } from "react-intl";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ProjectEdit = ({ projectData, refreshDetail }) => {
  const intl = useIntl();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [apiProgress, setApiProgress] = useState(false);
  const [userList, setUserList] = useState([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [isDone, setIsDone] = useState(projectData.isActive);

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

  const getCategoriesData = async () => {
    try {
      const response = await GetCategories();
      setCategories(
        response.data.data.map((category) => ({
          label: `${category.projectTypeName}`,
          value: category.id,
        }))
      );
    } catch (error) {}
  };
  const getCustomersData = async () => {
    try {
      const response = await GetAllCustomerAsBasic();
      setCustomers(
        response.data.data.map((customer) => ({
          label: `${customer.customerName}`,
          value: customer.customerId,
        }))
      );
    } catch (error) {}
  };

  useEffect(() => {
    getCategoriesData();
    getCustomersData();
    searchUserList(projectData.projectLeader.name);
  }, [projectData]);

  const showModal = () => {
    setIsModalVisible(true);
  };
  const handleOk = () => {
    setIsModalVisible(false);
  };
  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const onFinish = async (values) => {
    const formDataProject = {
      id: projectData.id,
      projectName: values.projectName,
      description: values.description,
      projectTypeId: values.projectType,
      leaderUserId: values.projectLead,
      customerId: values.customer,
      startDate: values.projectDate[0]._d,
      finishDate: values.projectDate[1]._d,
      isActive: isDone,
    };

    setApiProgress(true);
    try {
      await EditProject(formDataProject);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "project.edit.success" }),
      });
    } catch (e) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "project.edit.error" }),
      });
    }
    setApiProgress(false);
    setIsModalVisible(false);
    refreshDetail();
  };

  const tailLayout = {
    wrapperCol: {
      offset: 8,
      span: 16,
    },
  };

  return (
    <div>
      {contextHolder}
      <Button type="primary" onClick={showModal} style={{ borderRadius: 4 }}>
        {intl.formatMessage({ id: "project.edit.button" })}
      </Button>
      <Modal
        title={intl.formatMessage({ id: "project.edit.title" })}
        width={750}
        visible={isModalVisible}
        onOk={handleOk}
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
            name="projectName"
            label={intl.formatMessage({ id: "project.field.projectName" })}
            initialValue={projectData.projectName}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "project.validation.projectName" }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({ id: "project.field.projectNamePh" })}
            />
          </Form.Item>
          <Form.Item
            name="projectType"
            label={intl.formatMessage({ id: "project.field.category" })}
            initialValue={projectData.projectType.id}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "project.validation.category" }),
              },
            ]}
          >
            <Select
              showSearch
              options={categories}
              placeholder={intl.formatMessage({ id: "project.field.categoryPh" })}
            />
          </Form.Item>

          <Form.Item
            name="customer"
            label={intl.formatMessage({ id: "project.field.customer" })}
            initialValue={projectData.customer.customerId}
            style={{ marginBottom: 10 }}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "project.validation.customer" }),
              },
            ]}
          >
            <Select
              showSearch
              placeholder={intl.formatMessage({ id: "project.field.customerPh" })}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
              }
              options={customers}
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={intl.formatMessage({ id: "project.field.description" })}
            initialValue={projectData.description}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "project.validation.description" }),
              },
            ]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="projectLead"
            label={intl.formatMessage({ id: "project.field.leader" })}
            initialValue={projectData.projectLeader.id}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "project.validation.leader" }),
              },
            ]}
          >
            <Select
              showSearch
              placeholder={intl.formatMessage({ id: "project.field.leaderPh" })}
              defaultActiveFirstOption={false}
              suffixIcon={null}
              filterOption={false}
              onSearch={searchUserList}
              notFoundContent={null}
              options={userList}
            />
          </Form.Item>

          <Form.Item
            name="projectDate"
            label={intl.formatMessage({ id: "project.field.dateRange" })}
            initialValue={[
              moment(projectData.startDate),
              moment(projectData.finishDate),
            ]}
            style={{ width: "100%" }}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "project.edit.validation.dateRange" }),
                type: "array",
              },
            ]}
          >
            <RangePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label={intl.formatMessage({ id: "project.edit.field.status" })}
            style={{ marginBottom: 18 }}
            initialValue={isDone}
          >
            <Switch
              onChange={(e) => setIsDone(e)}
              style={{ width: 25, background: isDone ? "#41B06E" : "#008DDA" }}
              checked={isDone}
            />

            <Tag
              color={isDone ? "#41B06E" : "#008DDA"}
              style={{ margin: 5, borderRadius: 15 }}
            >
              {isDone
                ? intl.formatMessage({ id: "project.status.completed" })
                : intl.formatMessage({ id: "project.status.ongoing" })}
            </Tag>
          </Form.Item>
          <Form.Item {...tailLayout} style={{ marginBottom: 0 }}>
            <Button
              style={{ float: "right", borderRadius: 4 }}
              type="primary"
              htmlType="submit"
              loading={apiProgress}
            >
              {intl.formatMessage({ id: "project.edit.save" })}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectEdit;
