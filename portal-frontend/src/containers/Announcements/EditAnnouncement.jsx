import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Switch,
  Alert,
  message,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import moment from "moment";
import { UpdateAnnouncement } from "../../Api/AnnouncementApi";
import { GetAllDepartments } from "../../Api/DepartmentApi";
import { pickBolumDepartmentsFromApi, JOB_BOLUMU_NAMES, unwrapDepartmentList } from "../../Data/jobBolumleri";
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

function resolveAnnouncementInitialAudience(ann, bolumDepartments) {
  const annDeptId =
    ann.departmentId != null && ann.departmentId !== ""
      ? Number(ann.departmentId)
      : null;
  const hasDept = Number.isFinite(annDeptId);
  const general =
    (ann.isGeneral ?? true) && !hasDept && !String(ann.serviceArea || "").trim();

  if (general) return NEWS_AUDIENCE_EVERYONE_VALUE;

  if (hasDept) {
    const inList = bolumDepartments.some((d) => d.id === annDeptId);
    if (inList) return annDeptId;
  }

  const legacy = String(ann.serviceArea || "").trim();
  if (legacy && JOB_BOLUMU_NAMES.some((n) => n.localeCompare(legacy, "tr", { sensitivity: "accent" }) === 0)) {
    const canon = JOB_BOLUMU_NAMES.find(
      (n) => n.localeCompare(legacy, "tr", { sensitivity: "accent" }) === 0
    );
    const match = bolumDepartments.find((d) => d.name === canon);
    if (match) return match.id;
  }

  return hasDept ? annDeptId : undefined;
}

const EditAnnouncement = ({ announcement, refreshList }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiProgress, setApiProgress] = useState(false);
  const [bolumDepartments, setBolumDepartments] = useState([]);
  const [deptLoading, setDeptLoading] = useState(false);

  useEffect(() => {
    if (!isModalOpen || !announcement) return undefined;
    let cancelled = false;
    setDeptLoading(true);

    (async () => {
      try {
        const deptRes = await GetAllDepartments();
        const allDepts = unwrapDepartmentList(deptRes);
        const bolum = pickBolumDepartmentsFromApi(allDepts);
        if (cancelled) return;
        setBolumDepartments(bolum);
        const audience = resolveAnnouncementInitialAudience(announcement, bolum);
        form.setFieldsValue({
          title: announcement.title,
          content: announcement.content,
          priority: announcement.priority,
          publishDate: announcement.publishDate ? moment(announcement.publishDate) : moment(),
          expiryDate: announcement.expiryDate ? moment(announcement.expiryDate) : null,
          isActive: announcement.isActive,
          audience,
        });
      } catch {
        if (!cancelled) setBolumDepartments([]);
      } finally {
        if (!cancelled) setDeptLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isModalOpen, announcement, form]);

  const onFinish = async (values) => {
    const { departmentId, serviceArea, isGeneral } = resolveNewsAudienceForSubmit(values);
    const formData = {
      id: announcement.id,
      title: values.title,
      content: values.content,
      priority: values.priority,
      expiryDate: values.expiryDate
        ? toEndOfDayLocalIso(values.expiryDate)
        : announcement.expiryDate,
      publishDate: values.publishDate
        ? toLocalDateTimeIso(values.publishDate)
        : announcement.publishDate,
      isGeneral,
      isActive: values.isActive ?? true,
      departmentId,
      serviceArea,
    };

    setApiProgress(true);
    try {
      await UpdateAnnouncement(formData);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "announcements.edit.success" }),
      });
      refreshList();
      setIsModalOpen(false);
    } catch {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "announcements.edit.error" }),
      });
    }
    setApiProgress(false);
  };

  return (
    <>
      {contextHolder}
      <Button
        type="text"
        icon={<EditOutlined />}
        onClick={() => setIsModalOpen(true)}
        size="small"
      />
      <Modal
        width={720}
        title={intl.formatMessage({ id: "announcements.edit.title" })}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
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
              key={`audience-edit-${announcement?.id}-${bolumDepartments.map((d) => d.id).join("-")}`}
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

          <Form.Item
            name="isActive"
            label={intl.formatMessage({ id: "announcements.form.isActive" })}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 8, span: 16 }} style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={apiProgress}>
              {intl.formatMessage({ id: "announcements.form.submitUpdate" })}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default EditAnnouncement;
