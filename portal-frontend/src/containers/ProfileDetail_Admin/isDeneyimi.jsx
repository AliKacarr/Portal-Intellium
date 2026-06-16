import React, { useEffect, useState } from "react";
import { Button, DatePicker, Form, Input, message, Table, Popconfirm } from "antd";
import { useIntl } from "react-intl";
import { getJobExperienceByUserId, addJobExperience, deleteJobExperience } from "../../Api/ProfileApi";
import moment from "moment";

const { Column, ColumnGroup } = Table;

const IsDeneyimi = ({ userId }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [deneyim, setDeneyim] = useState([]);
  const [apiProgress, setApiProgress] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [deleteApiProgress, setDeleteApiProgress] = useState(false);
  const ongoing = intl.formatMessage({ id: "profile.ongoing" });

  const isDeneyim = async () => {
    try {
      const response = await getJobExperienceByUserId(userId);
      setDeneyim(response.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    isDeneyim();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  const onFinish = async (values) => {
    const formDataExperience = {
      userId: userId,
      companyName: values.companyName,
      duty: values.duty,
      jobTitle: values.jobTitle,
      startDate: moment(values.startDate),
      departureDate: values.departureDate ? moment(values.departureDate) : null,
    };
    setApiProgress(true);
    try {
      await addJobExperience(formDataExperience);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.expCreated" }),
      });
      isDeneyim();
      form.resetFields();
    } catch (e) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.expCreateError" }),
      });
    }
    setApiProgress(false);
  };

  const onDeleteExperience = async (id) => {
    setDeleteApiProgress(true);
    try {
      await deleteJobExperience(id);
      setDeneyim((prevData) => prevData.filter((item) => item.id !== id));
    } catch (error) {}
    setDeleteApiProgress(false);
  };

  return (
    <div>
      {contextHolder}
      <Form
        form={form}
        onFinish={onFinish}
        labelCol={{
          span: 8,
        }}
        wrapperCol={{
          span: 16,
        }}
        layout="horizontal"
        style={{
          maxWidth: 650,
        }}
      >
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.exp.company" })} name="companyName">
          <Input />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.exp.duty" })} name="duty">
          <Input />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.exp.jobTitle" })} name="jobTitle">
          <Input />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.exp.startDate" })} name="startDate">
          <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.exp.endDate" })} name="departureDate">
          <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
        </Form.Item>

        <Form.Item
          wrapperCol={{
            offset: 8,
          }}
        >
          <Button type="primary" htmlType="submit" loading={apiProgress}>
            {intl.formatMessage({ id: "profileDetailAdmin.exp.addButton" })}
          </Button>
        </Form.Item>
      </Form>

      <Table
        pagination={false}
        dataSource={deneyim}
        size="small"
        style={{
          margin: "20px 20px",
        }}
        scroll={{
          x: 700,
        }}
      >
        <ColumnGroup align="left">
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.exp.company" })} dataIndex="companyName" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.exp.duty" })} dataIndex="duty" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.exp.jobTitle" })} dataIndex="jobTitle" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.exp.startDate" })} dataIndex="startDate" render={(date) => moment(date).format("DD.MM.YYYY")} />
          <Column
            title={intl.formatMessage({ id: "profileDetailAdmin.exp.endDate" })}
            dataIndex="departureDate"
            render={(date) => (date ? moment(date).format("DD.MM.YYYY") : ongoing)}
          />

          <Column
            render={(text, data) => (
              <Popconfirm
                title={intl.formatMessage({ id: "profileDetailAdmin.exp.deleteConfirm" })}
                onConfirm={() => onDeleteExperience(data.id)}
                okButtonProps={{ loading: deleteApiProgress }}
                okText={intl.formatMessage({ id: "profileDetailAdmin.confirmYes" })}
                cancelText={intl.formatMessage({ id: "profileDetailAdmin.confirmNo" })}
              >
                <Button danger type="text" className="projectDltBtn">
                  <i className="ion-android-delete" />
                </Button>
              </Popconfirm>
            )}
          />
        </ColumnGroup>
      </Table>
    </div>
  );
};

export default IsDeneyimi;
