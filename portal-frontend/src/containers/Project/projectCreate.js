import React, { useEffect, useState } from "react";
import { Button, DatePicker, Form, Input, Modal, Select, message } from "antd";
import { AddProject, GetCategories } from "../../Api/ProjectApi";
import { getUserByName } from "../../Api/UserApi";
import { GetAllCustomerAsBasic } from "../../Api/CustomerApi";
import { PlusCircleOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

export default function ProjeOlustur({ refreshList }) {
  const intl = useIntl();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [apiProgress, setApiProgress] = useState(false);
  const [userList, setUserList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);

  const searchUserList = async (username) => {
    if (username === "") {
      setUserList([]);
      return;
    }
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
  }, []);

  const onFinish = async (values) => {
    const formDataProject = {
      projectName: values.projectName,
      description: values.description,
      projectTypeId: values.projectType,
      leaderUserId: values.projectLead,
      customerId: values.customer,
      startDate: values.projectDate[0]._d,
      finishDate: values.projectDate[1]._d,
      isActive: false,
    };

    setApiProgress(true);
    try {
      await AddProject(formDataProject);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "project.create.success" }),
      });
      refreshList();
    } catch (e) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "project.create.error" }),
      });
    }
    setApiProgress(false);

    setIsModalOpen(false);
  };

  const showModal = () => {
    setIsModalOpen(true);
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
      <div>
        <Button
          className="custom-button"
          type="primary"
          icon={<PlusCircleOutlined style={{ fontSize: "15px" }} />}
          onClick={showModal}
        >
          {intl.formatMessage({ id: "project.create.button" })}
        </Button>
      </div>
      <Modal
        width={750}
        title={intl.formatMessage({ id: "project.create.title" })}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
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
            style={{ width: "100%" }}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "project.validation.dateRange" }),
                type: "array",
              },
            ]}
          >
            <RangePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item {...tailLayout} style={{ marginBottom: 0 }}>
            <Button
              style={{ float: "right" }}
              type="primary"
              htmlType="submit"
              loading={apiProgress}
            >
              {intl.formatMessage({ id: "project.create.submit" })}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
