import React, { useEffect, useState } from "react";
import { Button, DatePicker, InputNumber, Form, Input, Table, message, Popconfirm } from "antd";
import { useIntl } from "react-intl";
import moment from "moment";
import { addUserCertificate, deleteCertificate, getCertificateByUserId } from "../../Api/ProfileApi";
const { Column, ColumnGroup } = Table;

const EgitimveSertifika = ({ userId }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [certificateDetail, setCertificateDetail] = useState();
  const [deleteApiProgress, setDeleteApiProgress] = useState(false);

  const getCertificate = async () => {
    try {
      const response = await getCertificateByUserId(userId);
      if (response.data.success) {
        const certificateData = response.data.data;
        setCertificateDetail(certificateData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    getCertificate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  const onFinish = async (values) => {
    const formDataUser = {
      userId: userId,
      certificateName: values.certificateName,
      certificateNo: values.certificateNo,
      startTime: moment(values.startTime),
      endTime: moment(values.endTime),
      institutionName: values.institutionName,
      certificateExamMark: values.certificateExamMark,
    };
    setLoading(true);

    try {
      await addUserCertificate(formDataUser);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.certAdded" }),
      });
      getCertificate();
      form.resetFields();
    } catch (e) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.certAddError" }),
      });
    }
    setLoading(false);
  };

  const onDeleteCertificate = async (id) => {
    setDeleteApiProgress(true);
    try {
      await deleteCertificate(id);
      setCertificateDetail((prevData) => prevData.filter((item) => item.id !== id));
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.certDeleted" }),
      });
    } catch (error) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.certDeleteError" }),
      });
    } finally {
      setDeleteApiProgress(false);
    }
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
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.cert.name" })} name="certificateName">
          <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.cert.namePh" })} />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.cert.no" })} name="certificateNo">
          <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.cert.noPh" })} />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.cert.institution" })} name="institutionName">
          <Input />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.cert.issueDate" })} name="startTime">
          <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.cert.validUntil" })} name="endTime">
          <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.cert.score" })} name="certificateExamMark">
          <InputNumber style={{ width: "30%" }} min={0} max={100} />
        </Form.Item>

        <Form.Item
          wrapperCol={{
            offset: 8,
          }}
        >
          <Button type="primary" htmlType="submit" loading={loading}>
            {intl.formatMessage({ id: "profileDetailAdmin.cert.addButton" })}
          </Button>
        </Form.Item>
      </Form>

      <Table pagination={false} size="small" style={{ marginBottom: 10 }} dataSource={certificateDetail}>
        <ColumnGroup align="left">
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.cert.name" })} dataIndex="certificateName" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.cert.no" })} dataIndex="certificateNo" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.cert.institution" })} dataIndex="institutionName" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.cert.issueDate" })} dataIndex="startTime" render={(date) => moment(date).format("DD.MM.YYYY")} />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.cert.validUntil" })} dataIndex="endTime" render={(date) => moment(date).format("DD.MM.YYYY")} />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.cert.score" })} dataIndex="certificateExamMark" />
          <Column
            render={(text, data) => (
              <Popconfirm
                title={intl.formatMessage({ id: "profileDetailAdmin.cert.deleteConfirm" })}
                onConfirm={() => onDeleteCertificate(data.id)}
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

export default EgitimveSertifika;
