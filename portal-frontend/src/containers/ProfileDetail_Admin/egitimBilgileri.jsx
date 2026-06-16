import React, { useEffect, useMemo, useState } from "react";
import { DatePicker, Form, Input, InputNumber, Button, Select, Popconfirm, Table, message } from "antd";
import { useIntl } from "react-intl";
import moment from "moment";
import { addEducation, deleteEducation, getEduByUserId } from "../../Api/ProfileApi";

const { Column, ColumnGroup } = Table;

const DEGREE_OPTIONS = [
  { value: "Lisans", id: "profileDetailAdmin.eduDeg.Lisans" },
  { value: "Ön Lisans", id: "profileDetailAdmin.eduDeg.OnLisans" },
  { value: "Yüksek Lisans", id: "profileDetailAdmin.eduDeg.YuksekLisans" },
  { value: "Doktora", id: "profileDetailAdmin.eduDeg.Doktora" },
  { value: "Lise", id: "profileDetailAdmin.eduDeg.Lise" },
];

const BURS_OPTIONS = [
  { value: "Tam burslu", id: "profileDetailAdmin.burs.Tam" },
  { value: "Yarı burslu", id: "profileDetailAdmin.burs.Yari" },
  { value: "Burs yok", id: "profileDetailAdmin.burs.Yok" },
];

const EgitimBilgileri = ({ userId }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [egitim, setEgitim] = useState([]);
  const [apiProgress, setApiProgress] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [deleteApiProgress, setDeleteApiProgress] = useState(false);
  const ongoing = intl.formatMessage({ id: "profile.ongoing" });

  const egitimDerece = useMemo(
    () => DEGREE_OPTIONS.map((o) => ({ value: o.value, label: intl.formatMessage({ id: o.id }) })),
    [intl]
  );

  const burs = useMemo(
    () => BURS_OPTIONS.map((o) => ({ value: o.value, label: intl.formatMessage({ id: o.id }) })),
    [intl]
  );

  const egitimBilgi = async () => {
    try {
      const response = await getEduByUserId(userId);
      setEgitim(response.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    egitimBilgi();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount
  }, []);

  const onFinish = async (values) => {
    const formDataExperience = {
      userId: userId,
      completedEducation: values.completedEducation,
      school: values.school,
      department: values.department,
      scholarship: values.scholarship,
      gradePoint: values.gradePoint,
      startDate: moment(values.startDate),
      endDate: values.endDate ? moment(values.endDate) : null,
    };
    setApiProgress(true);
    try {
      await addEducation(formDataExperience);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.eduCreated" }),
      });
      egitimBilgi();
      form.resetFields();
    } catch (e) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.eduCreateError" }),
      });
    }
    setApiProgress(false);
  };

  const onDeleteEducation = async (id) => {
    setDeleteApiProgress(true);
    try {
      await deleteEducation(id);
      setEgitim((prevData) => prevData.filter((item) => item.id !== id));
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.eduDeleted" }),
      });
    } catch (error) {
      console.error("Error deleting education:", error);
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.eduDeleteError" }),
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
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.edu.completed" })} name="completedEducation">
          <Select style={{ width: "100%" }} options={egitimDerece} />
        </Form.Item>
        <Form.Item
          label={intl.formatMessage({ id: "profileDetailAdmin.edu.school" })}
          name="school"
          rules={[{ required: true, message: intl.formatMessage({ id: "profileDetailAdmin.validation.schoolRequired" }) }]}
        >
          <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.edu.schoolPh" })} />
        </Form.Item>
        <Form.Item
          label={intl.formatMessage({ id: "profileDetailAdmin.edu.department" })}
          name="department"
          rules={[{ required: true, message: intl.formatMessage({ id: "profileDetailAdmin.validation.departmentRequired" }) }]}
        >
          <Input placeholder={intl.formatMessage({ id: "profileDetailAdmin.edu.departmentPh" })} />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.edu.scholarship" })} name="scholarship">
          <Select style={{ width: "100%" }} options={burs} />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.edu.grade" })} name="gradePoint">
          <InputNumber style={{ width: "30%" }} min={0} max={4} />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.edu.start" })} name="startDate">
          <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
        </Form.Item>
        <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.edu.end" })} name="endDate">
          <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
        </Form.Item>
        <Form.Item
          wrapperCol={{
            offset: 8,
          }}
        >
          <Button type="primary" htmlType="submit" loading={apiProgress}>
            {intl.formatMessage({ id: "profileDetailAdmin.edu.addButton" })}
          </Button>
        </Form.Item>
      </Form>

      <Table pagination={false} dataSource={egitim} size="small" style={{ margin: "20px 20px" }} scroll={{ x: 700 }}>
        <ColumnGroup align="left">
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.edu.completed" })} dataIndex="completedEducation" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.edu.school" })} dataIndex="school" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.edu.department" })} dataIndex="department" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.edu.scholarship" })} dataIndex="scholarship" />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.edu.grade" })} dataIndex="gradePoint" />

          <Column title={intl.formatMessage({ id: "profileDetailAdmin.edu.start" })} dataIndex="startDate" render={(date) => moment(date).format("DD.MM.YYYY")} />
          <Column title={intl.formatMessage({ id: "profileDetailAdmin.edu.end" })} dataIndex="endDate" render={(date) => (date ? moment(date).format("DD.MM.YYYY") : ongoing)} />
          <Column
            render={(text, data) => (
              <Popconfirm
                title={intl.formatMessage({ id: "profileDetailAdmin.edu.deleteConfirm" })}
                onConfirm={() => onDeleteEducation(data.id)}
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

export default EgitimBilgileri;
