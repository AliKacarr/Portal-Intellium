import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import { useIntl } from "react-intl";
import {
  Button,
  Card,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { ArrowLeftOutlined, SwapOutlined } from "@ant-design/icons";
import { adminDeleteRequest, getInboxRequests, getRequestCategories, updateRequestStatus } from "../../Api/RequestApi";
import { ui } from "./requestUi";
import { formatTrDateTimeFromApi } from "./requestDateFormat";
import "./requestFilters.css";
import "./requestTable.css";

const containerStyle = ui.page;
const surfaceCardStyle = ui.surface;
const softHeaderStyle = ui.toolbar;
const FILTER_ALL = "__all__";

const unwrapList = (res) => {
  const d = res?.data ?? res?.Data ?? res;
  const inner = d?.data ?? d?.Data ?? d;
  return Array.isArray(inner) ? inner : Array.isArray(d) ? d : [];
};

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

const ADMIN_STATUS_VALUES = [
  "Gönderildi",
  "İncelemede",
  "Ek Bilgi Bekleniyor",
  "Onay Bekliyor",
  "İşleme Alındı",
  "Tamamlandı",
  "Reddedildi",
];

const FILTER_STATUS_VALUES = [
  ...ADMIN_STATUS_VALUES,
  "İptal Edildi",
];

export default function AdminRequests() {
  const intl = useIntl();
  const history = useHistory();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [status, setStatus] = useState(FILTER_ALL);
  const [categoryId, setCategoryId] = useState(FILTER_ALL);

  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusRow, setStatusRow] = useState(null);
  const [nextStatus, setNextStatus] = useState(undefined);
  const [statusNote, setStatusNote] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);

  const statusLabel = useCallback((v) => intl.formatMessage({ id: `request.st.${v}` }), [intl]);

  const adminChangeOptions = useMemo(
    () => ADMIN_STATUS_VALUES.map((v) => ({ value: v, label: statusLabel(v) })),
    [statusLabel]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, listRes] = await Promise.all([
        getRequestCategories(),
        getInboxRequests({
          status: status === FILTER_ALL ? undefined : status,
          categoryId: categoryId === FILTER_ALL ? undefined : categoryId,
        }),
      ]);
      setCategories(unwrapList(catRes));
      setRows(unwrapList(listRes));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("AdminRequests load error:", e);
      message.error(intl.formatMessage({ id: "request.admin.loadFailed" }));
    } finally {
      setLoading(false);
    }
  }, [status, categoryId, intl]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryOptions = useMemo(
    () => [
      { value: FILTER_ALL, label: intl.formatMessage({ id: "request.filter.all" }) },
      ...(categories || []).map((c) => ({
        value: c.id ?? c.Id,
        label: c.name ?? c.Name,
        subCategories: c.subCategories ?? c.SubCategories ?? [],
      })),
    ],
    [categories, intl]
  );

  const filterStatusOptions = useMemo(
    () => [
      { value: FILTER_ALL, label: intl.formatMessage({ id: "request.filter.all" }) },
      ...FILTER_STATUS_VALUES.map((v) => ({ value: v, label: statusLabel(v) })),
    ],
    [intl, statusLabel]
  );

  const rowOwnerLabel = (r) => String(r.ownerName ?? r.OwnerName ?? "").trim() || "—";

  const openStatusModal = (r) => {
    setStatusRow(r);
    setNextStatus(undefined);
    setStatusNote("");
    setStatusModalVisible(true);
  };

  const submitStatusChange = async () => {
    const id = statusRow?.id ?? statusRow?.Id;
    if (!id) {
      message.error(intl.formatMessage({ id: "request.msg.invalidRequest" }));
      return;
    }
    if (!nextStatus) {
      message.warning(intl.formatMessage({ id: "request.msg.selectNewStatus" }));
      return;
    }
    const noteTrim = statusNote.trim();
    const needsNote = nextStatus === "Reddedildi" || nextStatus === "Ek Bilgi Bekleniyor";
    if (needsNote && !noteTrim) {
      message.warning(intl.formatMessage({ id: "request.msg.noteRequired" }));
      return;
    }
    setStatusSaving(true);
    try {
      await updateRequestStatus(id, { status: nextStatus, note: noteTrim || undefined });
      message.success(intl.formatMessage({ id: "request.msg.statusUpdated" }));
      setStatusModalVisible(false);
      setStatusRow(null);
      await load();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("update status error:", e);
      message.error(intl.formatMessage({ id: "request.msg.statusUpdateFailed" }));
    } finally {
      setStatusSaving(false);
    }
  };

  const onDelete = useCallback(
    (r) => {
      const rid = r?.id ?? r?.Id;
      if (!rid) {
        message.error(intl.formatMessage({ id: "request.msg.invalidRequest" }));
        return;
      }
      Modal.confirm({
        title: intl.formatMessage({ id: "request.deleteModal.title" }),
        content: intl.formatMessage({ id: "request.deleteModal.content" }),
        okText: intl.formatMessage({ id: "request.deleteModal.ok" }),
        cancelText: intl.formatMessage({ id: "request.cancel" }),
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await adminDeleteRequest(rid);
            message.success(intl.formatMessage({ id: "request.msg.deleted" }));
            await load();
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("admin delete error:", e);
            message.error(intl.formatMessage({ id: "request.msg.deleteFailed" }));
          }
        },
      });
    },
    [intl, load]
  );

  const columns = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: "request.col.owner" }),
        width: 200,
        ellipsis: true,
        render: (_, r) => rowOwnerLabel(r),
      },
      {
        title: intl.formatMessage({ id: "request.col.category" }),
        width: 220,
        align: "center",
        render: (_, r) => (
          <div style={ui.requestTagCellWrap}>
            <Tag color="default" style={ui.requestTagCellStyle}>
              {r.category ?? r.Category}
            </Tag>
          </div>
        ),
      },
      {
        title: intl.formatMessage({ id: "request.col.subCategory" }),
        width: 220,
        align: "center",
        render: (_, r) => (
          <div style={ui.requestTagCellWrap}>
            <Tag color="default" style={ui.requestTagCellStyle}>
              {r.subCategory ?? r.SubCategory ?? "-"}
            </Tag>
          </div>
        ),
      },
      {
        title: intl.formatMessage({ id: "request.col.status" }),
        width: 220,
        align: "center",
        render: (_, r) => {
          const st = r.status ?? r.Status;
          return (
            <div style={ui.requestTagCellWrap}>
              <Tag color={statusColor(st)} style={ui.requestTagCellStyle}>
                {st}
              </Tag>
            </div>
          );
        },
      },
      {
        title: intl.formatMessage({ id: "request.col.date" }),
        width: 170,
        align: "center",
        render: (_, r) => {
          const v =
            r.createdAt ??
            r.CreatedAt ??
            r.createdDate ??
            r.CreatedDate ??
            r.requestDate ??
            r.RequestDate ??
            r.updatedAt ??
            r.UpdatedAt;
          return <div style={ui.requestCellCenter}>{formatTrDateTimeFromApi(v)}</div>;
        },
      },
      {
        title: intl.formatMessage({ id: "request.col.actions" }),
        width: 380,
        align: "center",
        render: (_, r) => (
          <div style={ui.requestCellCenter}>
            <Space size={8} wrap>
              <Button
                size="small"
                type="primary"
                icon={<SwapOutlined />}
                onClick={() => openStatusModal(r)}
                style={ui.requestTableActionBtnWide}
              >
                {intl.formatMessage({ id: "request.action.changeStatus" })}
              </Button>
              <Button
                size="small"
                onClick={() => history.push(`/dashboard/requests/${r.id ?? r.Id}`)}
                style={ui.requestTableActionBtn}
              >
                {intl.formatMessage({ id: "request.action.detail" })}
              </Button>
              <Button size="small" danger onClick={() => onDelete(r)} style={ui.requestTableActionBtn}>
                {intl.formatMessage({ id: "request.action.delete" })}
              </Button>
            </Space>
          </div>
        ),
      },
    ],
    [intl, history, onDelete]
  );

  const statusModalTitle =
    statusRow && rowOwnerLabel(statusRow) !== "—"
      ? intl.formatMessage({ id: "request.statusModal.titleWithOwner" }, { owner: rowOwnerLabel(statusRow) })
      : intl.formatMessage({ id: "request.statusModal.title" });

  return (
    <LayoutWrapper>
      <PageHeader>{intl.formatMessage({ id: "request.admin.pageTitle" })}</PageHeader>

      <div style={containerStyle}>
        <Card style={{ ...surfaceCardStyle, marginBottom: 12 }} bodyStyle={{ padding: 14 }}>
          <div>
            <Typography.Title level={4} style={{ margin: 0, lineHeight: 1.15 }}>
              {intl.formatMessage({ id: "request.admin.heroTitle" })}
            </Typography.Title>
            <Typography.Text type="secondary">
              {intl.formatMessage({ id: "request.admin.heroSubtitle" })}
            </Typography.Text>
          </div>

          <div style={{ height: 12 }} />
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 12,
              rowGap: 12,
            }}
          >
            <div
              style={{
                flex: "0 1 auto",
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                alignItems: "center",
              }}
            >
              <Select
                className="request-filter-select"
                dropdownClassName="request-filter-dropdown"
                value={status}
                onChange={(v) => setStatus(v ?? FILTER_ALL)}
                options={filterStatusOptions}
                style={ui.requestListFilterSelect}
              />
              <Select
                className="request-filter-select"
                dropdownClassName="request-filter-dropdown"
                value={categoryId}
                onChange={(v) => setCategoryId(v ?? FILTER_ALL)}
                options={categoryOptions}
                style={ui.requestListFilterSelect}
              />
            </div>
            <Space wrap size={8} style={{ marginInlineStart: "auto", flexShrink: 0 }}>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => history.push("/dashboard/requests")}
                style={ui.requestFilterBarBtn}
              >
                {intl.formatMessage({ id: "request.backToList" })}
              </Button>
            </Space>
          </div>
        </Card>

        <Card style={surfaceCardStyle} bodyStyle={{ padding: 0 }} headStyle={softHeaderStyle} bordered>
          <div className="request-table-wrap">
            <Table
              rowKey={(r) => String(r.id ?? r.Id)}
              loading={loading}
              columns={columns}
              dataSource={rows}
              size="middle"
              pagination={{ pageSize: 10, showSizeChanger: true }}
              style={{ borderRadius: 14, overflow: "hidden" }}
              className="request-table"
              scroll={{ x: "max-content" }}
            />
          </div>
        </Card>
      </div>

      <Modal
        title={statusModalTitle}
        visible={statusModalVisible}
        onCancel={() => !statusSaving && setStatusModalVisible(false)}
        onOk={submitStatusChange}
        okText={intl.formatMessage({ id: "request.save" })}
        cancelText={intl.formatMessage({ id: "request.cancel" })}
        confirmLoading={statusSaving}
        cancelButtonProps={{ disabled: statusSaving }}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 10 }}>
          {intl.formatMessage({ id: "request.statusModal.hint" })}
        </Typography.Paragraph>
        <div style={{ marginBottom: 12 }}>
          <Typography.Text strong>{intl.formatMessage({ id: "request.statusModal.newStatus" })}</Typography.Text>
          <Select
            style={{ width: "100%", marginTop: 6 }}
            placeholder={intl.formatMessage({ id: "request.statusModal.statusPh" })}
            value={nextStatus}
            onChange={setNextStatus}
            options={adminChangeOptions}
          />
        </div>
        <Input.TextArea
          rows={4}
          placeholder={intl.formatMessage({ id: "request.statusModal.notePh" })}
          maxLength={2000}
          showCount
          value={statusNote}
          onChange={(e) => setStatusNote(e.target.value)}
        />
      </Modal>
    </LayoutWrapper>
  );
}
