import React, { useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import moment from "moment";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import { useIntl } from "react-intl";
import { Button, Card, Col, DatePicker, Divider, Form, Input, Row, Select, Typography, Upload, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { createRequest, getRequestCategories, getRequestDetail, updateMyDraftRequest, uploadRequestAttachments } from "../../Api/RequestApi";
import { ui } from "./requestUi";
import "./requestFilters.css";

const summarizeApiError = (e) => {
  const status = e?.response?.status;
  const url = e?.config?.url;
  const method = (e?.config?.method || "").toUpperCase();
  const serverMsg =
    e?.response?.data?.message ??
    e?.response?.data?.Message ??
    e?.response?.data?.error ??
    e?.response?.data?.Error;
  const base = status ? `${status}` : "Network";
  const req = url ? ` • ${method} ${url}` : "";
  const msg = serverMsg ? ` • ${serverMsg}` : "";
  return `${base}${req}${msg}`;
};

const unwrapList = (res) => {
  const d = res?.data ?? res?.Data ?? res;
  const inner = d?.data ?? d?.Data ?? d;
  return Array.isArray(inner) ? inner : Array.isArray(d) ? d : [];
};

const getDynamicFieldPlaceholder = (label, type) => {
  const safeLabel = String(label || "Bu alan").trim();
  if (type === "date") return "Tarih seçiniz";
  if (type === "file") return `${safeLabel} için dosya seçiniz`;
  return `${safeLabel} giriniz`;
};

const normalizeApiDynamicFields = (fields) =>
  (Array.isArray(fields) ? fields : [])
    .map((f) => {
      const label = f.label ?? f.Label;
      const type = String(f.dataType ?? f.DataType ?? "text").toLowerCase();
      return {
        key: f.fieldKey ?? f.FieldKey,
        label,
        type,
        required: Boolean(f.isRequired ?? f.IsRequired),
        sortOrder: f.sortOrder ?? f.SortOrder ?? 0,
        placeholder: getDynamicFieldPlaceholder(label, type),
      };
    })
    .filter((f) => f.key && f.label)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

const serializeDynamicFields = (values = {}) => {
  const result = {};
  Object.entries(values || {}).forEach(([key, value]) => {
    if (value && typeof value.format === "function") {
      result[key] = value.format("YYYY-MM-DD");
      return;
    }
    if (Array.isArray(value) && value.some((item) => item?.originFileObj || item?.name)) {
      result[key] = value.map((item) => item?.name).filter(Boolean);
      return;
    }
    result[key] = value;
  });
  return result;
};

const collectDynamicFiles = (values = {}) =>
  Object.values(values || {})
    .filter((value) => Array.isArray(value) && value.some((item) => item?.originFileObj || item instanceof File))
    .flat();

const getDynamicFieldValueProps = (field) => (value) => {
  if (field.type === "date") {
    if (!value) return { value: undefined };
    if (moment.isMoment(value)) return { value };
    const parsed = moment(value);
    return { value: parsed.isValid() ? parsed : undefined };
  }

  if (field.type === "file") {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      return {
        fileList: value.map((name, index) => ({
          uid: `${field.key}-${index}`,
          name,
          status: "done",
        })),
      };
    }
    return { fileList: value };
  }

  return { value };
};

const containerStyle = { width: "100%", maxWidth: "none", padding: "0 20px" };
const surfaceCardStyle = {
  borderRadius: 14,
  border: "1px solid rgba(226,232,240,0.9)",
  boxShadow: "0 10px 26px rgba(15, 23, 42, 0.06)",
};

const CreateRequest = () => {
  const intl = useIntl();
  const history = useHistory();
  const { id } = useParams();
  const editingId = Number(id);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [cats, setCats] = useState([]);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [loadedDetailStatus, setLoadedDetailStatus] = useState(null);

  useEffect(() => {
    setInitialLoaded(false);
  }, [editingId]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getRequestCategories();
        setCats(unwrapList(res));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("CreateRequest categories error:", e);
        message.error(
          `${intl.formatMessage({ id: "request.error.categoriesLoad" })} (${summarizeApiError(e)})`
        );
      }
    };
    load();
  }, [intl]);

  useEffect(() => {
    if (!editingId) setLoadedDetailStatus(null);
  }, [editingId]);

  useEffect(() => {
    const loadExisting = async () => {
      if (!editingId || initialLoaded) return;
      try {
        const res = await getRequestDetail(editingId);
        const d = res?.data ?? res?.Data ?? res?.data?.data ?? res;
        const statusNorm = String(d?.status ?? d?.Status ?? "").toLowerCase();
        const editable = statusNorm.includes("taslak") || statusNorm.includes("ek bilgi");
        if (!editable) {
          message.warning(intl.formatMessage({ id: "request.warning.notEditable" }));
          history.replace("/dashboard/requests");
          setInitialLoaded(true);
          return;
        }
        setLoadedDetailStatus(d?.status ?? d?.Status ?? null);
        const payload = (() => {
          try {
            return d?.payloadJson || d?.PayloadJson ? JSON.parse(d?.payloadJson ?? d?.PayloadJson) : {};
          } catch {
            return {};
          }
        })();
        form.setFieldsValue({
          categoryId: d?.categoryId ?? d?.CategoryId,
          subCategoryId: d?.subCategoryId ?? d?.SubCategoryId,
          otherText: d?.otherText ?? d?.OtherText,
          description: d?.description ?? d?.Description,
          dynamicFields: payload,
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("CreateRequest load draft error:", e);
        message.error(intl.formatMessage({ id: "request.error.draftLoad" }));
      } finally {
        setInitialLoaded(true);
      }
    };
    loadExisting();
  }, [editingId, form, initialLoaded, history, intl]);

  const selectedCategoryId = Form.useWatch("categoryId", form);
  const selectedSubCategoryId = Form.useWatch("subCategoryId", form);

  const selectedCategory = useMemo(
    () => (cats || []).find((c) => Number(c.id ?? c.Id) === Number(selectedCategoryId)),
    [cats, selectedCategoryId]
  );

  const subOptions = useMemo(() => {
    const subs = selectedCategory?.subCategories ?? selectedCategory?.SubCategories ?? [];
    return (subs || []).map((s) => ({
      value: s.id ?? s.Id,
      label: s.name ?? s.Name,
      fields: s.fields ?? s.Fields ?? [],
    }));
  }, [selectedCategory]);

  const selectedSub = useMemo(
    () => subOptions.find((s) => Number(s.value) === Number(selectedSubCategoryId)),
    [subOptions, selectedSubCategoryId]
  );

  const dynamicFieldSpec = useMemo(
    () => normalizeApiDynamicFields(selectedSub?.fields ?? selectedSub?.Fields),
    [selectedSub]
  );

  useEffect(() => {
    if (dynamicFieldSpec.length === 0) return;
    const current = form.getFieldValue("dynamicFields") || {};
    const next = { ...current };
    let changed = false;
    dynamicFieldSpec.forEach((field) => {
      const value = next[field.key];
      if (field.type === "date" && value && !moment.isMoment(value)) {
        const parsed = moment(value);
        if (parsed.isValid()) {
          next[field.key] = parsed;
          changed = true;
        }
      }
      if (field.type === "file" && Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
        next[field.key] = value.map((name, index) => ({
          uid: `${field.key}-${index}`,
          name,
          status: "done",
        }));
        changed = true;
      }
    });
    if (changed) form.setFieldsValue({ dynamicFields: next });
  }, [dynamicFieldSpec, form]);

  const editingEkBilgi =
    !!editingId && String(loadedDetailStatus || "").toLowerCase().includes("ek bilgi");

  const onSubmit = async (saveAsDraft) => {
    try {
      const values = saveAsDraft ? form.getFieldsValue(true) : await form.validateFields();
      setLoading(true);
      const payload = {
        categoryId: values.categoryId ?? 0,
        subCategoryId: values.subCategoryId ?? 0,
        otherText: values.otherText,
        description: values.description,
        payloadJson: JSON.stringify(serializeDynamicFields(values.dynamicFields || {})),
        saveAsDraft,
      };
      let requestId = null;
      if (editingId) {
        const stNorm = String(loadedDetailStatus || "").toLowerCase();
        const draftStatus = stNorm.includes("ek bilgi") ? "Ek Bilgi Bekleniyor" : "Taslak";
        const status = saveAsDraft ? draftStatus : "Gönderildi";
        const noteDraftEk = intl.formatMessage({ id: "request.note.infoUpdated" });
        const noteDraft = intl.formatMessage({ id: "request.note.draftUpdated" });
        const noteSubmit = intl.formatMessage({ id: "request.note.submitted" });
        await updateMyDraftRequest(editingId, {
          ...payload,
          status,
          note: saveAsDraft
            ? draftStatus === "Ek Bilgi Bekleniyor"
              ? noteDraftEk
              : noteDraft
            : noteSubmit,
        });
        requestId = editingId;
      } else {
        const res = await createRequest(payload);
        const created = res?.data ?? res?.Data ?? res?.data?.data ?? null;
        requestId = created?.id ?? created?.Id ?? null;
      }

      const files = [...(values.attachments || []), ...collectDynamicFiles(values.dynamicFields || {})];
      if (!saveAsDraft && requestId && files.length > 0) {
        await uploadRequestAttachments(requestId, files);
      }
      message.success(
        saveAsDraft
          ? intl.formatMessage({ id: "request.success.draftSaved" })
          : intl.formatMessage({ id: "request.success.submitted" })
      );
      history.push("/dashboard/requests");
    } catch (e) {
      if (e?.errorFields) return;
      message.error(intl.formatMessage({ id: "request.error.saveFailed" }));
    } finally {
      setLoading(false);
    }
  };

  const pageHeaderTitle = editingEkBilgi
    ? intl.formatMessage({ id: "request.page.updateTitle" })
    : editingId
      ? intl.formatMessage({ id: "request.page.editDraftTitle" })
      : intl.formatMessage({ id: "request.page.newTitle" });

  const cardTitle = editingEkBilgi
    ? intl.formatMessage({ id: "request.card.titleUpdate" })
    : editingId
      ? intl.formatMessage({ id: "request.card.titleDraft" })
      : intl.formatMessage({ id: "request.card.titleNew" });

  const cardSubtitle = editingEkBilgi
    ? intl.formatMessage({ id: "request.card.subtitleEkBilgi" })
    : editingId
      ? intl.formatMessage({ id: "request.card.subtitleDraft" })
      : intl.formatMessage({ id: "request.card.subtitleNew" });

  return (
    <LayoutWrapper>
      <PageHeader>{pageHeaderTitle}</PageHeader>

      <div style={containerStyle}>
        <Card style={surfaceCardStyle} bodyStyle={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <Typography.Title level={4} style={{ margin: 0, lineHeight: 1.15 }}>
                {cardTitle}
              </Typography.Title>
              <Typography.Text type="secondary">{cardSubtitle}</Typography.Text>
            </div>
            <Button onClick={() => history.push("/dashboard/requests")} style={ui.requestFilterBarBtn}>
              {intl.formatMessage({ id: "request.backToList" })}
            </Button>
          </div>

          <Divider style={{ margin: "14px 0" }} />

          <Form form={form} layout="vertical" initialValues={{ saveAsDraft: true }}>
            <Row gutter={[12, 12]}>
              <Col xs={24} md={12}>
                <Form.Item name="categoryId" label={intl.formatMessage({ id: "request.field.category" })}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder={intl.formatMessage({ id: "request.placeholder.category" })}
                    className="request-filter-select"
                    dropdownClassName="request-filter-dropdown"
                    style={{ width: "100%" }}
                    options={(cats || []).map((c) => ({
                      value: c.id ?? c.Id,
                      label: c.name ?? c.Name,
                    }))}
                    onChange={() => {
                      form.setFieldsValue({
                        subCategoryId: undefined,
                        otherText: undefined,
                        dynamicFields: {},
                        attachments: [],
                      });
                    }}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item name="subCategoryId" label={intl.formatMessage({ id: "request.field.subCategory" })}>
                  <Select
                    showSearch
                    optionFilterProp="label"
                    placeholder={intl.formatMessage({ id: "request.placeholder.subCategory" })}
                    className="request-filter-select"
                    dropdownClassName="request-filter-dropdown"
                    style={{ width: "100%" }}
                    disabled={!selectedCategory}
                    options={subOptions}
                    onChange={() => {
                      form.setFieldsValue({
                        otherText: undefined,
                        dynamicFields: {},
                        attachments: [],
                      });
                    }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Card size="small" style={{ borderRadius: ui.requestTableRadius }} bodyStyle={{ padding: 12 }}>
                  <Typography.Text strong>{intl.formatMessage({ id: "request.section.details" })}</Typography.Text>
                  <div style={{ height: 10 }} />

                  <div
                    style={{
                      border: "1px solid rgba(226,232,240,0.9)",
                      borderRadius: ui.requestTableRadius,
                      padding: 12,
                      background: "rgba(248,250,252,0.8)",
                      minHeight: 120,
                      maxHeight: 260,
                      overflow: "auto",
                      marginBottom: 12,
                    }}
                  >
                    {dynamicFieldSpec.length > 0 ? (
                      <Row gutter={[12, 12]}>
                        {dynamicFieldSpec.map((f) => (
                          <Col xs={24} md={12} key={f.key}>
                            <Form.Item
                              name={["dynamicFields", f.key]}
                              label={f.label}
                              getValueProps={getDynamicFieldValueProps(f)}
                              getValueFromEvent={f.type === "file" ? (e) => e?.fileList : undefined}
                              rules={
                                f.required
                                  ? [
                                      {
                                        required: true,
                                        message: intl.formatMessage(
                                          { id: "request.validation.dynamicRequired" },
                                          { field: f.label }
                                        ),
                                      },
                                    ]
                                  : undefined
                              }
                            >
                              {f.type === "date" ? (
                                <DatePicker
                                  className="request-rounded-control"
                                  format="DD.MM.YYYY"
                                  placeholder={f.placeholder}
                                  style={{ width: "100%" }}
                                />
                              ) : f.type === "file" ? (
                                <Upload beforeUpload={() => false} maxCount={1}>
                                  <Button icon={<UploadOutlined />} style={ui.requestFilterBarBtn}>
                                    {f.placeholder}
                                  </Button>
                                </Upload>
                              ) : f.multiline ? (
                                <Input.TextArea
                                  className="request-rounded-control"
                                  rows={f.rows || 3}
                                  placeholder={f.placeholder}
                                />
                              ) : (
                                <Input className="request-rounded-control" placeholder={f.placeholder} />
                              )}
                            </Form.Item>
                          </Col>
                        ))}
                      </Row>
                    ) : (
                      <Typography.Text type="secondary">
                        {intl.formatMessage({ id: "request.dynamicEmptyHint" })}
                      </Typography.Text>
                    )}
                  </div>

                  <Form.Item
                    name="attachments"
                    label={intl.formatMessage({ id: "request.field.attachments" })}
                    valuePropName="fileList"
                    getValueFromEvent={(e) => e?.fileList}
                  >
                    <Upload className="request-create-upload" beforeUpload={() => false} multiple maxCount={5}>
                      <Button icon={<UploadOutlined />} style={ui.requestFilterBarBtn}>
                        {intl.formatMessage({ id: "request.fileSelect" })}
                      </Button>
                    </Upload>
                  </Form.Item>
                </Card>
              </Col>

              <Col xs={24}>
                <Form.Item
                  name="description"
                  label={intl.formatMessage({ id: "request.field.description" })}
                >
                  <Input.TextArea
                    className="request-rounded-control"
                    rows={5}
                    placeholder={intl.formatMessage({ id: "request.placeholder.descriptionOptional" })}
                  />
                </Form.Item>
              </Col>
            </Row>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
              <Button style={ui.requestFilterBarBtn} onClick={() => history.push("/dashboard/requests")}>
                {intl.formatMessage({ id: "request.cancel" })}
              </Button>
              <Button style={ui.requestFilterBarBtn} loading={loading} onClick={() => onSubmit(true)}>
                {intl.formatMessage({ id: "request.saveDraft" })}
              </Button>
              <Button type="primary" style={ui.requestFilterBarBtn} loading={loading} onClick={() => onSubmit(false)}>
                {intl.formatMessage({ id: "request.submit" })}
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </LayoutWrapper>
  );
};

export default CreateRequest;
