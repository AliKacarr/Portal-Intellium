import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Spin,
  Switch,
  message,
  Typography,
} from "antd";
import { EditOutlined } from "@ant-design/icons";
import moment from "moment";
import { GetNewsById, UpdateNews, UpdateNewsMultipart } from "../../Api/NewsApi";
import { GetAllNewsCategories, unwrapNewsCategoryList } from "../../Api/NewsCategoryApi";
import { GetAllDepartments } from "../../Api/DepartmentApi";
import { pickBolumDepartmentsFromApi, unwrapDepartmentList, JOB_BOLUMU_NAMES } from "../../Data/jobBolumleri";
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

const appendUpdateNewsFormData = (fd, values, newsId) => {
  fd.append("Id", String(newsId));
  const { isGeneral, departmentId, serviceArea } = resolveNewsAudienceForSubmit(values);
  const isPublished = values.isPublished === true;
  const publishDate = isPublished ? publishDateToIso(values.publishDate) : null;
  fd.append("Title", String(values.title || "").trim());
  fd.append("Content", String(values.content || ""));
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

function resolveInitialAudience(dto, bolumDepartments) {
  const general =
    (dto.isGeneral ?? true) &&
    !dto.departmentId &&
    !String(dto.serviceArea || "").trim();

  if (general) return NEWS_AUDIENCE_EVERYONE_VALUE;

  if (dto.departmentId) {
    const inList = bolumDepartments.some((d) => d.id === dto.departmentId);
    if (inList) return dto.departmentId;
  }

  const legacy = String(dto.serviceArea || "").trim();
  if (legacy && JOB_BOLUMU_NAMES.includes(legacy)) {
    const match = bolumDepartments.find((d) => d.name === legacy);
    if (match) return match.id;
  }

  return dto.departmentId ?? undefined;
}

const EditNews = ({ news, refreshList }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiProgress, setApiProgress] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverInputKey, setCoverInputKey] = useState(0);
  const [detailNews, setDetailNews] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bolumDepartments, setBolumDepartments] = useState([]);
  const [newsCategories, setNewsCategories] = useState([]);
  const [publishEnabled, setPublishEnabled] = useState(true);

  useEffect(() => {
    if (!isModalOpen || !news?.id) return undefined;
    let cancelled = false;
    setDetailLoading(true);
    setDetailNews(null);
    setBolumDepartments([]);
    setNewsCategories([]);
    form.resetFields();

    (async () => {
      try {
        const [newsRes, deptRes, catRes] = await Promise.all([
          GetNewsById(news.id, true),
          GetAllDepartments(),
          GetAllNewsCategories(),
        ]);
        const dto = newsRes.data?.data;
        const allDepts = unwrapDepartmentList(deptRes);
        const bolumDepartments = pickBolumDepartmentsFromApi(allDepts);
        const categories = unwrapNewsCategoryList(catRes);

        if (cancelled) return;
        if (!dto) {
          messageApi.open({
            type: "error",
            content: intl.formatMessage({ id: "news.detail.loadError" }),
          });
          setDetailLoading(false);
          return;
        }
        setDetailNews(dto);
        setBolumDepartments(bolumDepartments);
        setNewsCategories(categories);
        setPublishEnabled(dto.isPublished === true);
        const audience = resolveInitialAudience(dto, bolumDepartments);
        const categoryId = dto.newsCategoryId ?? dto.NewsCategoryId ?? undefined;

        form.setFieldsValue({
          title: dto.title,
          content: dto.content ?? "",
          imageUrl: dto.imageUrl || "",
          publishDate: dto.publishDate ? moment(dto.publishDate) : null,
          tags: dto.tags || "",
          isPublished: dto.isPublished,
          isCommentable: dto.isCommentable,
          audience,
          newsCategoryId: categoryId,
        });
      } catch {
        if (!cancelled) {
          messageApi.open({
            type: "error",
            content: intl.formatMessage({ id: "news.detail.loadError" }),
          });
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isModalOpen, news?.id, form, intl, messageApi]);

  const resetCover = () => {
    setCoverFile(null);
    setCoverInputKey((k) => k + 1);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setDetailNews(null);
    setPublishEnabled(true);
    resetCover();
  };

  const onFinish = async (values) => {
    const { departmentId, serviceArea, isGeneral } = resolveNewsAudienceForSubmit(values);
    const isPublished = values.isPublished === true;
    const formData = {
      id: news.id,
      title: values.title,
      content: values.content,
      imageUrl: values.imageUrl || null,
      publishDate: isPublished ? publishDateToIso(values.publishDate) : null,
      isPublished,
      isCommentable: values.isCommentable ?? true,
      isGeneral,
      isActive: detailNews?.isActive ?? news?.isActive ?? true,
      tags: values.tags || null,
      departmentId,
      serviceArea,
      newsCategoryId: values.newsCategoryId ?? null,
    };

    setApiProgress(true);
    try {
      if (coverFile) {
        const fd = new FormData();
        appendUpdateNewsFormData(fd, values, news.id);
        fd.append("ImageFile", coverFile);
        await UpdateNewsMultipart(fd);
      } else {
        await UpdateNews(formData);
      }
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "news.edit.success" }),
      });
      refreshList();
      closeModal();
    } catch {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "news.edit.error" }),
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
        title={intl.formatMessage({ id: "news.edit.title" })}
        open={isModalOpen}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Spin spinning={detailLoading}>
          <Form
            form={form}
            labelCol={{ span: 7 }}
            wrapperCol={{ span: 17 }}
            layout="horizontal"
            onFinish={onFinish}
          >
            <Form.Item
              name="title"
              label={intl.formatMessage({ id: "news.form.title" })}
              rules={[
                { required: true, message: intl.formatMessage({ id: "news.form.titleRequired" }) },
              ]}
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
                disabled={!publishEnabled || detailLoading}
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
                disabled={detailLoading}
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
                disabled={detailLoading}
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
              <Button type="primary" htmlType="submit" loading={apiProgress} disabled={detailLoading}>
                {intl.formatMessage({ id: "news.form.submitUpdate" })}
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Modal>
    </>
  );
};

export default EditNews;
