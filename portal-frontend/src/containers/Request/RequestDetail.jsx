import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import SecureLS from "secure-ls";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import { useIntl } from "react-intl";
import { Button, Card, Descriptions, Divider, Empty, Input, List, Select, Space, Tag, Typography, message } from "antd";
import { ArrowLeftOutlined, DownloadOutlined } from "@ant-design/icons";
import { resolveUiRole } from "@iso/lib/helpers/jwtRoles";
import { downloadRequestAttachment, getRequestDetail, updateRequestStatus } from "../../Api/RequestApi";
import { buildRequestDynamicFieldSpec, normalizeRequestKey } from "./requestDynamicFields";
import { formatTrDateTimeFromApi } from "./requestDateFormat";

const ls = new SecureLS({ encodingType: "aes" });

const ADMIN_DETAIL_STATUS_VALUES = [
  "Gönderildi",
  "İncelemede",
  "Ek Bilgi Bekleniyor",
  "Onay Bekliyor",
  "İşleme Alındı",
  "Tamamlandı",
  "Reddedildi",
];

const parseJwtUserId = (accessToken) => {
  try {
    const token = String(accessToken || "").trim();
    if (!token) return null;
    const parts = token.split(".");
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payloadB64 + "===".slice((payloadB64.length + 3) % 4);
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(json);
    const id =
      payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
      payload.sub ??
      payload.userId ??
      payload.UserId;
    const n = Number(id);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
};

const unwrap = (res) => res?.data ?? res?.Data ?? res?.data?.data ?? res;

const statusColor = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("taslak")) return "default";
  if (s.includes("gönderildi")) return "blue";
  if (s.includes("incelemede")) return "geekblue";
  if (s.includes("ek bilgi")) return "gold";
  if (s.includes("onay bekliyor")) return "cyan";
  if (s.includes("işleme")) return "purple";
  if (s.includes("tamamlandı")) return "green";
  if (s.includes("reddedildi")) return "red";
  if (s.includes("iptal")) return "volcano";
  return "default";
};

const tryParseJson = (text) => {
  if (!text || typeof text !== "string") return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
};

const saveBlob = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName || "attachment";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

const RequestDetail = () => {
  const intl = useIntl();
  const history = useHistory();
  const { id } = useParams();
  const requestId = Number(id);
  const reduxRole = useSelector((state) => {
    const r = state?.Auth?.role;
    if (!r) return null;
    if (typeof r === "string") return r;
    return r?.roleName ?? r?.RoleName ?? r?.name ?? r?.Name ?? null;
  });
  const accessToken = useSelector((state) => state?.Auth?.accessToken) || ls.get("accessToken");
  const userRole = resolveUiRole({ reduxRole, accessToken });
  const jwtUserId = parseJwtUserId(accessToken);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [adminNextStatus, setAdminNextStatus] = useState(undefined);
  const [adminNote, setAdminNote] = useState("");
  const [adminSaving, setAdminSaving] = useState(false);

  const statusLabel = useCallback((v) => intl.formatMessage({ id: `request.st.${v}` }), [intl]);

  const adminDetailStatusOptions = useMemo(
    () => ADMIN_DETAIL_STATUS_VALUES.map((v) => ({ value: v, label: statusLabel(v) })),
    [statusLabel]
  );

  const rawStatus = String(data?.status ?? data?.Status ?? "").toLowerCase();
  const ownerUserId = Number(data?.ownerUserId ?? data?.OwnerUserId);
  const isOwner =
    Number.isFinite(ownerUserId) && jwtUserId != null ? Number(jwtUserId) === ownerUserId : true;
  const canUserEdit = isOwner && (rawStatus.includes("taslak") || rawStatus.includes("ek bilgi"));
  const isTerminalDetail =
    rawStatus.includes("tamamlandı") || rawStatus.includes("reddedildi") || rawStatus.includes("iptal");
  const showAdminStatusCard =
    userRole === "admin" && data && !rawStatus.includes("taslak") && !isTerminalDetail;

  useEffect(() => {
    setAdminNextStatus(undefined);
    setAdminNote("");
  }, [requestId, data?.id, data?.Id]);

  const load = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    try {
      const res = await getRequestDetail(requestId);
      setData(unwrap(res));
    } catch {
      message.error(intl.formatMessage({ id: "request.detail.loadFailed" }));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [requestId, intl]);

  useEffect(() => {
    load();
  }, [load]);

  const submitAdminDetailStatus = async () => {
    if (!adminNextStatus) {
      message.warning(intl.formatMessage({ id: "request.msg.selectNewStatus" }));
      return;
    }
    const noteTrim = adminNote.trim();
    const needsNote = adminNextStatus === "Reddedildi" || adminNextStatus === "Ek Bilgi Bekleniyor";
    if (needsNote && !noteTrim) {
      message.warning(intl.formatMessage({ id: "request.msg.noteRequired" }));
      return;
    }
    setAdminSaving(true);
    try {
      await updateRequestStatus(requestId, { status: adminNextStatus, note: noteTrim || undefined });
      message.success(intl.formatMessage({ id: "request.msg.statusUpdated" }));
      await load();
    } catch {
      message.error(intl.formatMessage({ id: "request.msg.statusUpdateFailed" }));
    } finally {
      setAdminSaving(false);
    }
  };

  const payload = useMemo(() => tryParseJson(data?.payloadJson ?? data?.PayloadJson), [data]);
  const payloadEntries = useMemo(() => Object.entries(payload || {}), [payload]);

  const dynamicFieldLabels = useMemo(() => {
    const cat = normalizeRequestKey(data?.category ?? data?.Category);
    const sub = normalizeRequestKey(data?.subCategory ?? data?.SubCategory);
    const spec = buildRequestDynamicFieldSpec(cat, sub);
    const map = {};
    (spec || []).forEach((f) => {
      map[f.key] = f.label;
    });
    return map;
  }, [data]);

  const onDownload = async (att) => {
    try {
      const res = await downloadRequestAttachment(requestId, att.id ?? att.Id);
      const blob = new Blob([res.data], { type: res.headers?.["content-type"] || "application/octet-stream" });
      const fileName = att.name ?? att.Name ?? "attachment";
      saveBlob(blob, fileName);
    } catch {
      message.error(intl.formatMessage({ id: "request.detail.downloadFailed" }));
    }
  };

  const formatHistoryNote = (noteRaw, toSt) => {
    if (!noteRaw) return "";
    if (toSt.includes("reddedildi")) {
      return intl.formatMessage({ id: "request.detail.history.rejectReason" }, { note: noteRaw });
    }
    if (toSt.includes("ek bilgi")) {
      return intl.formatMessage({ id: "request.detail.history.infoRequest" }, { note: noteRaw });
    }
    return intl.formatMessage({ id: "request.detail.history.note" }, { note: noteRaw });
  };

  return (
    <LayoutWrapper>
      <PageHeader>{intl.formatMessage({ id: "request.detail.pageTitle" })}</PageHeader>

      <Card
        loading={loading}
        style={{
          width: "100%",
          maxWidth: "none",
          margin: "0 20px",
          borderRadius: 14,
          border: "1px solid rgba(226,232,240,0.9)",
          boxShadow: "0 10px 26px rgba(15, 23, 42, 0.06)",
        }}
        bodyStyle={{ padding: 18 }}
      >
        <Space style={{ width: "100%", justifyContent: "space-between" }} wrap>
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => history.push("/dashboard/requests")}>
              {intl.formatMessage({ id: "request.backToList" })}
            </Button>
            {canUserEdit ? (
              <Button onClick={() => history.push(`/dashboard/requests/edit/${requestId}`)}>
                {intl.formatMessage({ id: "request.action.edit" })}
              </Button>
            ) : null}
          </Space>
          <Tag color={statusColor(data?.status ?? data?.Status)}>{data?.status ?? data?.Status}</Tag>
        </Space>

        {!data ? (
          <Empty description={intl.formatMessage({ id: "request.detail.notFound" })} style={{ padding: 24 }} />
        ) : (
          <>
            <Divider />
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={intl.formatMessage({ id: "request.detail.label.category" })}>
                {data.category ?? data.Category}
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: "request.detail.label.subCategory" })}>
                {data.subCategory ?? data.SubCategory}
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: "request.detail.label.title" })}>
                {data.title ?? data.Title}
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: "request.detail.label.description" })}>
                {(data.description ?? data.Description) || "-"}
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: "request.detail.label.other" })}>
                {(data.otherText ?? data.OtherText) || "-"}
              </Descriptions.Item>
            </Descriptions>

            {showAdminStatusCard ? (
              <>
                <Divider />
                <Typography.Title level={5} style={{ marginTop: 0 }}>
                  {intl.formatMessage({ id: "request.detail.adminSection" })}
                </Typography.Title>
                <Typography.Paragraph type="secondary" style={{ marginBottom: 10 }}>
                  {intl.formatMessage({ id: "request.detail.adminHint" })}
                </Typography.Paragraph>
                <Space direction="vertical" style={{ width: "100%" }} size={10}>
                  <Select
                    style={{ width: "100%", maxWidth: 420 }}
                    placeholder={intl.formatMessage({ id: "request.detail.statusPh" })}
                    value={adminNextStatus}
                    onChange={setAdminNextStatus}
                    options={adminDetailStatusOptions}
                  />
                  <Input.TextArea
                    rows={3}
                    placeholder={intl.formatMessage({ id: "request.detail.notePh" })}
                    maxLength={2000}
                    showCount
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                  />
                  <Button type="primary" loading={adminSaving} onClick={submitAdminDetailStatus}>
                    {intl.formatMessage({ id: "request.detail.saveStatus" })}
                  </Button>
                </Space>
              </>
            ) : null}

            <Divider />
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              {intl.formatMessage({ id: "request.detail.dynamicSection" })}
            </Typography.Title>
            {payloadEntries.length === 0 ? (
              <Typography.Text type="secondary">{intl.formatMessage({ id: "request.detail.noDynamic" })}</Typography.Text>
            ) : (
              <Descriptions bordered size="small" column={1}>
                {payloadEntries.map(([k, v]) => (
                  <Descriptions.Item key={k} label={dynamicFieldLabels[k] || k}>
                    {String(v)}
                  </Descriptions.Item>
                ))}
              </Descriptions>
            )}

            <Divider />
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              {intl.formatMessage({ id: "request.detail.attachments" })}
            </Typography.Title>
            <List
              locale={{ emptyText: intl.formatMessage({ id: "request.list.attachmentsEmpty" }) }}
              dataSource={data.attachments ?? data.Attachments ?? []}
              renderItem={(att) => (
                <List.Item
                  actions={[
                    <Button
                      key="download"
                      icon={<DownloadOutlined />}
                      onClick={() => onDownload(att)}
                      size="small"
                    >
                      {intl.formatMessage({ id: "request.detail.download" })}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={att.name ?? att.Name}
                    description={
                      att.sizeBytes || att.SizeBytes
                        ? `${Math.round((Number(att.sizeBytes ?? att.SizeBytes) / 1024) * 10) / 10} KB`
                        : null
                    }
                  />
                </List.Item>
              )}
            />

            <Divider />
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              {intl.formatMessage({ id: "request.detail.history" })}
            </Typography.Title>
            <List
              locale={{ emptyText: intl.formatMessage({ id: "request.detail.historyEmpty" }) }}
              dataSource={data.history ?? data.History ?? []}
              renderItem={(h) => {
                const noteRaw = String(h.note ?? h.Note ?? "").trim();
                const toSt = String(h.toStatus ?? h.ToStatus ?? "").toLowerCase();
                const noteLine = formatHistoryNote(noteRaw, toSt);
                const when = h.createdAt ?? h.CreatedAt;
                const whenStr = when ? formatTrDateTimeFromApi(when, { withSeconds: true }) : "";
                const desc = [noteLine, whenStr].filter(Boolean).join(" • ");
                return (
                  <List.Item>
                    <List.Item.Meta
                      title={`${(h.fromStatus ?? h.FromStatus) || "-"} → ${h.toStatus ?? h.ToStatus}`}
                      description={desc || "—"}
                    />
                  </List.Item>
                );
              }}
            />
          </>
        )}
      </Card>
    </LayoutWrapper>
  );
};

export default RequestDetail;
