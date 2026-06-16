import React, { useEffect, useState } from "react";
import { Button, DatePicker, Form, Input, message, Popconfirm, Table } from "antd";
import { useIntl } from "react-intl";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import moment from "moment";
import { addFamily, deleteFamily, getFamilyByUserId } from "../../Api/ProfileApi";
import parsePhoneNumber from "libphonenumber-js";

const { Column, ColumnGroup } = Table;

const AileBilgileri = ({ userId }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [familyDetail, setFamilyDetail] = useState();
  const [deleteApiProgress, setDeleteApiProgress] = useState(false);

  const getFamily = async () => {
    try {
      const response = await getFamilyByUserId(userId);
      if (response.data.success) {
        setFamilyDetail(response.data.data);
      }
    } catch (error) {}
  };

  useEffect(() => {
    getFamily();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  const onFinish = async (values) => {
    const formDataUser = {
      userId: userId,
      name: values.name,
      surname: values.surname,
      relationship: values.relationship,
      birthDate: moment(values.birthDate),
      tc: values.tc,
      telno: values.telno,
    };
    setLoading(true);

    try {
      await addFamily(formDataUser);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.familySaved" }),
      });
      getFamily();
      form.resetFields();
    } catch (e) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.familyError" }),
      });
    }
    setLoading(false);
  };

  const onDeleteFamily = async (id) => {
    setDeleteApiProgress(true);
    try {
      await deleteFamily(id);
      setFamilyDetail((prevData) => prevData.filter((item) => item.id !== id));
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.familyDeleted" }),
      });
    } catch (error) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.familyDeleteError" }),
      });
    } finally {
      setDeleteApiProgress(false);
    }
  };

  const formatPhoneNumber = (number) => {
    try {
      const formattedNumber = parsePhoneNumber(number).formatInternational().replace(/(\+\d+)\s(\d+)\s(\d+)/, "$1 ($2) $3");

      return formattedNumber;
    } catch (error) {
      return number;
    }
  };
  return (
    <div>
      {contextHolder}
      <Form
        form={form}
        onFinish={onFinish}
        labelCol={{
          span: 5,
        }}
        wrapperCol={{
          span: 16,
        }}
        layout="horizontal"
        style={{
          maxWidth: 650,
        }}
      >
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.family.name" })} name="name">
          <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.family.name" })} />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.family.surname" })} name="surname">
          <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.family.surname" })} />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.family.relation" })} name="relationship">
          <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.family.relation" })} />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.family.birthDate" })} name="birthDate">
          <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
        </Form.Item>
        <Form.Item
          name="telno"
          label={intl.formatMessage({ id: "profileDetailAdmin.family.phone" })}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <PhoneInput placeholder={intl.formatMessage({ id: "profileDetailAdmin.family.phonePh" })} defaultCountry="TR" international />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.family.tc" })} name="tc">
          <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.placeholder.tc" })} minLength={11} maxLength={11} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          wrapperCol={{
            offset: 5,
          }}
        >
          <Button type="primary" htmlType="submit" loading={loading}>
            {intl.formatMessage({ id: "profileDetailAdmin.family.addButton" })}
          </Button>
        </Form.Item>
      </Form>

      <Table pagination={false} size="small" style={{ marginBottom: 10 }} dataSource={familyDetail}>
        <ColumnGroup align="left">
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.family.name" })} dataIndex="name" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.family.surname" })} dataIndex="surname" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.family.relation" })} dataIndex="relationship" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.family.birthDate" })} dataIndex="birthDate" render={(date) => moment(date).format("DD.MM.YYYY")} />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.family.phone" })} dataIndex="telNo" render={(number) => <span>{formatPhoneNumber(number)}</span>} />
          <Column
            render={(text, data) => (
              <Popconfirm
                title={intl.formatMessage({ id: "profileDetailAdmin.family.deleteConfirm" })}
                onConfirm={() => onDeleteFamily(data.id)}
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

export default AileBilgileri;
