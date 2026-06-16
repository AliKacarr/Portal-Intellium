import React, { useEffect, useMemo, useState } from "react";
import { Form, Input, Button, Select, Table, Popconfirm, message } from "antd";
import { useIntl } from "react-intl";
import { addLanguage, deleteLanguage, getLanguageByUserId } from "../../Api/ProfileApi";

const { Column, ColumnGroup } = Table;

const LANG_VALUES = [
  { value: "İngilizce", id: "profileDetailAdmin.lang.langEnglish" },
  { value: "Almanca", id: "profileDetailAdmin.lang.langGerman" },
  { value: "Rusça", id: "profileDetailAdmin.lang.langRussian" },
  { value: "Çince", id: "profileDetailAdmin.lang.langChinese", disabled: true },
];

const LEVEL_VALUES = [
  { value: "Başlangıç", id: "profileDetailAdmin.lang.levelBeginner" },
  { value: "Orta Seviye", id: "profileDetailAdmin.lang.levelIntermediate" },
  { value: "İleri Seviye", id: "profileDetailAdmin.lang.levelAdvanced" },
];

const DilBilgileri = ({ userId }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [dil, setDil] = useState([]);
  const [apiProgress, setApiProgress] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [deleteApiProgress, setDeleteApiProgress] = useState(false);

  const diller = useMemo(
    () =>
      LANG_VALUES.map((x) => ({
        value: x.value,
        label: intl.formatMessage({ id: x.id }),
        disabled: x.disabled,
      })),
    [intl]
  );

  const seviye = useMemo(
    () => LEVEL_VALUES.map((x) => ({ value: x.value, label: intl.formatMessage({ id: x.id }) })),
    [intl]
  );

  const dilBilgi = async () => {
    try {
      const response = await getLanguageByUserId(userId);
      setDil(response.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    dilBilgi();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  const onFinish = async (values) => {
    const formDataExperience = {
      userId: userId,
      foreignLanguage: values.foreignLanguage,
      read: values.read,
      write: values.write,
      speaking: values.speaking,
      documentPath: values.documentPath,
    };
    setApiProgress(true);
    try {
      await addLanguage(formDataExperience);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.langCreated" }),
      });
      dilBilgi();
      form.resetFields();
    } catch (e) {
      messageApi.open({
        type: "error",
        content: `${intl.formatMessage({ id: "profileDetailAdmin.errorPrefix" })} ${e.response?.data?.title || intl.formatMessage({ id: "profileDetailAdmin.message.langCreateError" })}`,
      });
    }
    setApiProgress(false);
  };

  const onDeleteLanguage = async (id) => {
    setDeleteApiProgress(true);
    try {
      await deleteLanguage(id);
      setDil((prevData) => prevData.filter((item) => item.id !== id));
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.langDeleted" }),
      });
    } catch (error) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.langDeleteError" }),
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
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.lang.foreign" })} name="foreignLanguage">
          <Select style={{ width: "100%" }} options={diller} />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.lang.read" })} name="read">
          <Select style={{ width: "100%" }} options={seviye} />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.lang.speak" })} name="speaking">
          <Select style={{ width: "100%" }} options={seviye} />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.lang.write" })} name="write">
          <Select style={{ width: "100%" }} options={seviye} />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.lang.document" })} name="documentPath">
          <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.lang.documentPh" })} />
        </Form.Item>
        <Form.Item
          wrapperCol={{
            offset: 8,
          }}
        >
          <Button type="primary" htmlType="submit" loading={apiProgress}>
            {intl.formatMessage({ id: "profileDetailAdmin.lang.addButton" })}
          </Button>
        </Form.Item>
      </Form>

      <Table pagination={false} dataSource={dil} size="small" style={{ margin: "20px 20px" }} scroll={{ x: 700 }}>
        <ColumnGroup align="left">
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.lang.foreign" })} dataIndex="foreignLanguage" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.lang.read" })} dataIndex="read" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.lang.write" })} dataIndex="write" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.lang.speak" })} dataIndex="speaking" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.lang.document" })} dataIndex="documentPath" />

          <Column
            render={(text, data) => (
              <Popconfirm
                title={intl.formatMessage({ id: "profileDetailAdmin.lang.deleteConfirm" })}
                onConfirm={() => onDeleteLanguage(data.id)}
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

export default DilBilgileri;
