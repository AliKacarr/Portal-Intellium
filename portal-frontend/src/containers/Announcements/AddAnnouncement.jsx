import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Alert,
  message,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import moment from "moment";
import { CreateAnnouncement } from "../../Api/AnnouncementApi";
import { GetAllDepartments } from "../../Api/DepartmentApi";
import { pickBolumDepartmentsFromApi, unwrapDepartmentList } from "../../Data/jobBolumleri";
import {
  NEWS_AUDIENCE_EVERYONE_VALUE,
  resolveNewsAudienceForSubmit,
} from "../News/newsAudience";
import PortalContentEditor from "@iso/components/Custom/PortalContentEditor/PortalContentEditor";
import { validateRichContentRequired } from "@iso/components/Custom/PortalContentEditor/portalRichContent";

const { Option } = Select;

const toLocalDateTimeIso = (value) => {
  const parsed = moment.isMoment(value) ? value : moment(value || undefined);
  return (parsed.isValid() ? parsed : moment()).format("YYYY-MM-DDTHH:mm:ss");
};

const toEndOfDayLocalIso = (value) => {
  const parsed = moment.isMoment(value) ? value.clone() : moment(value || undefined);
  return (parsed.isValid() ? parsed : moment()).endOf("day").format("YYYY-MM-DDTHH:mm:ss");
};

const AddAnnouncement = ({ refreshList }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiProgress, setApiProgress] = useState(false);
  const [bolumDepartments, setBolumDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);

  useEffect(() => {
    if (!isModalOpen) return;
    setDeptLoading(true);
    GetAllDepartments()
      .then((res) => {
        setBolumDepartments(pickBolumDepartmentsFromApi(unwrapDepartmentList(res)));
      })
      .catch(() => setBolumDepartments([]))
      .finally(() => setDeptLoading(false));
  }, [isModalOpen]);

  const onFinish = async (values) => {
    const { isGeneral, departmentId, serviceArea } = resolveNewsAudienceForSubmit(values);
    const formData = {
      title: values.title,
      content: values.content,
      priority: values.priority,
      expiryDate: values.expiryDate
        ? toEndOfDayLocalIso(values.expiryDate)
        : null,
      publishDate: toLocalDateTimeIso(values.publishDate),
      isGeneral,
      departmentId,
      serviceArea,
    };

    setApiProgress(true);
    try {
      await CreateAnnouncement(formData);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "announcements.add.success" }),
      });

      form.resetFields();
      refreshList();
      setIsModalOpen(false);
    } catch {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "announcements.add.error" }),
      });
    }
    setApiProgress(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  return (
    <div>
      {contextHolder}
      <Button
        style={{
          marginBottom: 16,
          borderRadius: 8,
          padding: "0 16px",
          fontWeight: 500,
          boxShadow: "0 4px 10px rgba(24, 144, 255, 0.18)",
        }}
        type="primary"
        icon={<PlusOutlined style={{ marginInlineEnd: 8 }} />}
        onClick={() => setIsModalOpen(true)}
      >
        {intl.formatMessage({ id: "announcements.add.button" })}
      </Button>
      <Modal
        width={720}
        title={intl.formatMessage({ id: "announcements.add.title" })}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        {!deptLoading && bolumDepartments.length === 0 ? (
          <Alert
            type="warning"
            showIcon
            style={{ marginBottom: 12 }}
            message={intl.formatMessage({ id: "announcements.form.bolumMissing" })}
          />
        ) : null}
        <Form
          form={form}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          layout="horizontal"
          onFinish={onFinish}
          initialValues={{ priority: "medium", publishDate: moment() }}
        >
          <Form.Item
            name="title"
            label={intl.formatMessage({ id: "announcements.form.title" })}
            rules={[
              { required: true, message: intl.formatMessage({ id: "announcements.form.titleRequired" }) },
            ]}
          >
            <Input placeholder={intl.formatMessage({ id: "announcements.form.titlePlaceholder" })} />
          </Form.Item>

          <Form.Item
            name="content"
            label={intl.formatMessage({ id: "announcements.form.content" })}
            rules={[
              {
                validator: validateRichContentRequired(
                  intl.formatMessage({ id: "announcements.form.contentRequired" })
                ),
              },
            ]}
          >
            <PortalContentEditor
              minHeight={160}
              placeholder={intl.formatMessage({ id: "announcements.form.contentPlaceholder" })}
            />
          </Form.Item>

          <Form.Item
            name="priority"
            label={intl.formatMessage({ id: "announcements.form.priority" })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "announcements.form.priorityRequired" }),
              },
            ]}
          >
            <Select>
              <Option value="low">{intl.formatMessage({ id: "announcements.priority.low" })}</Option>
              <Option value="medium">{intl.formatMessage({ id: "announcements.priority.medium" })}</Option>
              <Option value="high">{intl.formatMessage({ id: "announcements.priority.high" })}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="publishDate"
            label={intl.formatMessage({ id: "announcements.form.publishDate" })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "announcements.form.publishDateRequired" }),
              },
            ]}
            extra={intl.formatMessage({ id: "announcements.form.publishSchedulingHint" })}
          >
            <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY HH:mm" showTime />
          </Form.Item>

          <Form.Item
            name="expiryDate"
            label={intl.formatMessage({ id: "announcements.form.expiryDate" })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "announcements.form.expiryDateRequired" }),
              },
            ]}
          >
            <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
          </Form.Item>

          <Form.Item
            name="audience"
            label={intl.formatMessage({ id: "announcements.form.department" })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "announcements.form.departmentRequired" }),
              },
            ]}
          >
            <Select
              key={`audience-${isModalOpen}-${bolumDepartments.map((d) => d.id).join("-")}`}
              loading={deptLoading}
              placeholder={intl.formatMessage({ id: "announcements.form.departmentPlaceholder" })}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              <Option value={NEWS_AUDIENCE_EVERYONE_VALUE}>
                {intl.formatMessage({ id: "announcements.form.audienceEveryone" })}
              </Option>
              {bolumDepartments.map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }} style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={apiProgress}>
              {intl.formatMessage({ id: "announcements.form.submitCreate" })}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddAnnouncement;
