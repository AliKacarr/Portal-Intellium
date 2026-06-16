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
  message,
  Typography,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import moment from "moment";
import { CreateNews, CreateNewsMultipart } from "../../Api/NewsApi";
import { GetAllNewsCategories, unwrapNewsCategoryList } from "../../Api/NewsCategoryApi";
import { GetAllDepartments } from "../../Api/DepartmentApi";
import { pickBolumDepartmentsFromApi, unwrapDepartmentList } from "../../Data/jobBolumleri";
import {
  NEWS_AUDIENCE_EVERYONE_VALUE,
  resolveNewsAudienceForSubmit,
} from "./newsAudience";
import PortalContentEditor from "@iso/components/Custom/PortalContentEditor/PortalContentEditor";
import { validateRichContentRequired } from "@iso/components/Custom/PortalContentEditor/portalRichContent";

const { Option } = Select;

const publishDateToIso = (pd) => {
  if (!pd) return null;
  const value = moment.isMoment(pd) ? pd : moment(pd || undefined);
  return value.isValid() ? value.format("YYYY-MM-DDTHH:mm:ss") : null;
};

const appendAddNewsFormData = (fd, values) => {
  const { isGeneral, departmentId, serviceArea } = resolveNewsAudienceForSubmit(values);
  const isPublished = values.isPublished === true;
  const publishDate = isPublished ? publishDateToIso(values.publishDate) : null;
  fd.append("Title", String(values.title || "").trim());
  fd.append("Content", String(values.content || "").trim());
  const url = (values.imageUrl || "").trim();
  if (url) fd.append("ImageUrl", url);
  if (publishDate) fd.append("PublishDate", publishDate);
  fd.append("IsPublished", String(isPublished));
  fd.append("IsCommentable", String(values.isCommentable !== false));
  fd.append("IsGeneral", String(Boolean(isGeneral)));
  const tags = (values.tags || "").trim();
  if (tags) fd.append("Tags", tags);
  if (departmentId != null) fd.append("DepartmentId", String(departmentId));
  if (serviceArea) fd.append("ServiceArea", serviceArea);
  if (values.newsCategoryId != null && values.newsCategoryId !== "")
    fd.append("NewsCategoryId", String(values.newsCategoryId));
};

const AddNews = ({ refreshList }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiProgress, setApiProgress] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverInputKey, setCoverInputKey] = useState(0);
  const [bolumDepartments, setBolumDepartments] = useState([]);
  const [newsCategories, setNewsCategories] = useState([]);
  const [publishEnabled, setPublishEnabled] = useState(true);

  useEffect(() => {
    if (!isModalOpen) return;
    Promise.all([GetAllDepartments(), GetAllNewsCategories()])
      .then(([deptRes, catRes]) => {
        setBolumDepartments(pickBolumDepartmentsFromApi(unwrapDepartmentList(deptRes)));
        setNewsCategories(unwrapNewsCategoryList(catRes));
      })
      .catch(() => {
        setBolumDepartments([]);
        setNewsCategories([]);
      });
  }, [isModalOpen]);

  const onFinish = async (values) => {
    setApiProgress(true);
    try {
      const { isGeneral, departmentId, serviceArea } = resolveNewsAudienceForSubmit(values);
      if (coverFile) {
        const fd = new FormData();
        appendAddNewsFormData(fd, values);
        fd.append("ImageFile", coverFile);
        await CreateNewsMultipart(fd);
      } else {
        const isPublished = values.isPublished === true;
        const formData = {
          title: values.title,
          content: values.content,
          imageUrl: values.imageUrl || null,
          publishDate: isPublished ? publishDateToIso(values.publishDate) : null,
          isPublished,
          isCommentable: values.isCommentable ?? true,
          isGeneral,
          tags: values.tags || null,
          departmentId,
          serviceArea,
          newsCategoryId: values.newsCategoryId ?? null,
        };
        await CreateNews(formData);
      }

      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "news.add.success" }),
      });

      form.resetFields();
      setPublishEnabled(true);
      setCoverFile(null);
      setCoverInputKey((k) => k + 1);
      refreshList();
      setIsModalOpen(false);
    } catch (err) {
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        intl.formatMessage({ id: "news.add.error" });
      messageApi.open({ type: "error", content: errMsg });
    }
    setApiProgress(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    form.resetFields();
    setPublishEnabled(true);
    setCoverFile(null);
    setCoverInputKey((k) => k + 1);
  };

  return (
    <div style={{ width: "100%", textAlign: "right" }}>
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
        {intl.formatMessage({ id: "news.add.button" })}
      </Button>
      <Modal
        width={720}
        title={intl.formatMessage({ id: "news.add.title" })}
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          labelCol={{ span: 7 }}
          wrapperCol={{ span: 17 }}
          layout="horizontal"
          onFinish={onFinish}
          initialValues={{ isPublished: true, isCommentable: true }}
        >
          <Form.Item
            name="title"
            label={intl.formatMessage({ id: "news.form.title" })}
            rules={[{ required: true, message: intl.formatMessage({ id: "news.form.titleRequired" }) }]}
          >
            <Input placeholder={intl.formatMessage({ id: "news.form.titlePlaceholder" })} />
          </Form.Item>

          <Form.Item
            name="content"
            label={intl.formatMessage({ id: "news.form.content" })}
            rules={[
              {
                validator: validateRichContentRequired(
                  intl.formatMessage({ id: "news.form.contentRequired" })
                ),
              },
            ]}
          >
            <PortalContentEditor
              minHeight={180}
              placeholder={intl.formatMessage({ id: "news.form.contentPlaceholder" })}
            />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({ id: "news.form.imageUrl" })}
            extra="İsterseniz adres girin ve/veya yerel görsel seçin (jpg, png, gif, webp; en fazla 5 MB)."
          >
            <Form.Item name="imageUrl" noStyle>
              <Input placeholder={intl.formatMessage({ id: "news.form.imageUrlPlaceholder" })} />
            </Form.Item>
            <Typography.Paragraph type="secondary" style={{ margin: "10px 0 4px", fontSize: 12, marginBottom: 0 }}>
              Yerel dosya
            </Typography.Paragraph>
            <input
              key={coverInputKey}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            />
            {coverFile ? (
              <Typography.Text type="secondary" style={{ display: "block", marginTop: 6, fontSize: 12 }}>
                {coverFile.name}
              </Typography.Text>
            ) : null}
          </Form.Item>

          <Form.Item
            name="publishDate"
            label={intl.formatMessage({ id: "news.form.publishDate" })}
            extra={
              publishEnabled
                ? intl.formatMessage({ id: "news.form.publishDateOptionalHint" })
                : intl.formatMessage({ id: "news.form.publishDateDisabledHint" })
            }
          >
            <DatePicker
              style={{ width: "100%" }}
              format="DD.MM.YYYY HH:mm"
              showTime
              disabled={!publishEnabled}
            />
          </Form.Item>

          <Form.Item name="tags" label={intl.formatMessage({ id: "news.form.tags" })}>
            <Input placeholder={intl.formatMessage({ id: "news.form.tagsPlaceholder" })} />
          </Form.Item>

          <Form.Item
            name="newsCategoryId"
            label={intl.formatMessage({ id: "news.form.category" })}
            rules={[
              { required: true, message: intl.formatMessage({ id: "news.form.categoryRequired" }) },
            ]}
          >
            <Select
              placeholder={intl.formatMessage({ id: "news.form.categoryPlaceholder" })}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              {newsCategories.map((c) => {
                const id = c.id ?? c.Id;
                const name = c.name ?? c.Name;
                return (
                  <Option key={id} value={id}>
                    {name}
                  </Option>
                );
              })}
            </Select>
          </Form.Item>

          <Form.Item
            name="isPublished"
            label={intl.formatMessage({ id: "news.form.isPublished" })}
            valuePropName="checked"
            extra={intl.formatMessage({ id: "news.form.publishSchedulingHint" })}
          >
            <Switch
              onChange={(checked) => {
                setPublishEnabled(checked);
                if (!checked) form.setFieldsValue({ publishDate: null });
              }}
            />
          </Form.Item>

          <Form.Item
            name="isCommentable"
            label={intl.formatMessage({ id: "news.form.isCommentable" })}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="audience"
            label={intl.formatMessage({ id: "news.form.department" })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "news.form.departmentRequired" }),
              },
            ]}
          >
            <Select
              placeholder={intl.formatMessage({ id: "news.form.departmentPlaceholder" })}
              allowClear
              showSearch
              optionFilterProp="children"
            >
              <Option value={NEWS_AUDIENCE_EVERYONE_VALUE}>
                {intl.formatMessage({ id: "news.form.audienceEveryone" })}
              </Option>
              {bolumDepartments.map((d) => (
                <Option key={d.id} value={d.id}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 7, span: 17 }} style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" loading={apiProgress}>
              {intl.formatMessage({ id: "news.form.submitCreate" })}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddNews;
