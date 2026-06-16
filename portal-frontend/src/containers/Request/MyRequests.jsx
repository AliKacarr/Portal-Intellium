import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import SecureLS from "secure-ls";
import { resolveUiRole } from "@iso/lib/helpers/jwtRoles";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import { useIntl } from "react-intl";
import { Button, Card, Empty, Input, Select, Space, Table, Tag, Typography, message, Modal } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { cancelRequest, getMyRequests, getRequestCategories } from "../../Api/RequestApi";
import { ui } from "./requestUi";
import { formatTrDateTimeFromApi } from "./requestDateFormat";
import "./requestFilters.css";
import "./requestTable.css";

const ls = new SecureLS({ encodingType: "aes" });

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

const containerStyle = ui.page;
const surfaceCardStyle = ui.surface;
const softHeaderStyle = ui.toolbar;

const FILTER_ALL = "__all__";

const normStatus = (s) =>
  String(s || "")
    .trim()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const statusBucket = (stRaw) => {
  const s = normStatus(stRaw);
  if (s.includes("tamamlandı") || s.includes("reddedildi") || s.includes("iptal")) return "terminal";
  if (s.includes("taslak")) return "draft";
  if (s.includes("ek bilgi")) return "needInfo";
  if (s.includes("gönderildi") || s.includes("incelemede")) return "submittedReview";
  return "pipeline";
};

const statusColor = (status) => {
  const s = normStatus(status);
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

const unwrapList = (res) => {
  const d = res?.data ?? res?.Data ?? res;
  const inner = d?.data ?? d?.Data ?? d;
  return Array.isArray(inner) ? inner : Array.isArray(d) ? d : [];
};

const statusValueList = [
  "Taslak",
  "Gönderildi",
  "İncelemede",
  "Ek Bilgi Bekleniyor",
  "Onay Bekliyor",
  "İşleme Alındı",
  "Tamamlandı",
  "Reddedildi",
  "İptal Edildi",
];

const MyRequests = () => {
  const intl = useIntl();
  const history = useHistory();
  const reduxRole = useSelector((state) => {
    const r = state?.Auth?.role;
    if (!r) return null;
    if (typeof r === "string") return r;
    return r?.roleName ?? r?.RoleName ?? r?.name ?? r?.Name ?? null;
  });
  const accessToken = useSelector((state) => state?.Auth?.accessToken) || ls.get("accessToken");
  const userRole = resolveUiRole({ reduxRole, accessToken });
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(FILTER_ALL);
  const [categoryId, setCategoryId] = useState(FILTER_ALL);

  const statusLabel = useCallback((v) => intl.formatMessage({ id: `request.st.${v}` }), [intl]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [catRes, listRes] = await Promise.all([
        getRequestCategories(),
        getMyRequests(status === FILTER_ALL ? undefined : status),
      ]);
      setCategories(unwrapList(catRes));
      const list = unwrapList(listRes);
      setRows(list);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("MyRequests load error:", e);
      message.error(
        `${intl.formatMessage({ id: "request.msg.loadFailed" })} (${summarizeApiError(e)})`
      );
    } finally {
      setLoading(false);
    }
  }, [status, intl]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryOptions = useMemo(
    () => [
      { value: FILTER_ALL, label: intl.formatMessage({ id: "request.filter.all" }) },
      ...(categories || []).map((c) => ({
        value: c.id ?? c.Id,
        label: c.name ?? c.Name,
      })),
    ],
    [categories, intl]
  );

  const statusOptions = useMemo(
    () => [
      { value: FILTER_ALL, label: intl.formatMessage({ id: "request.filter.all" }) },
      ...statusValueList.map((v) => ({ value: v, label: statusLabel(v) })),
    ],
    [intl, statusLabel]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (rows || []).filter((r) => {
      const cat = String(r.category ?? r.Category ?? "").toLowerCase();
      const sub = String(r.subCategory ?? r.SubCategory ?? "").toLowerCase();
      const st = String(r.status ?? r.Status ?? "").toLowerCase();
      const matchText = !q || cat.includes(q) || sub.includes(q) || st.includes(q);
      const matchCat =
        categoryId === FILTER_ALL ? true : Number(r.categoryId ?? r.CategoryId) === Number(categoryId);
      return matchText && matchCat;
    });
  }, [rows, search, categoryId]);

  const onCancel = useCallback(
    async (record) => {
      const rid = record.id ?? record.Id;
      Modal.confirm({
        title: intl.formatMessage({ id: "request.cancelModal.title" }),
        content: intl.formatMessage({ id: "request.cancelModal.content" }),
        okText: intl.formatMessage({ id: "request.cancelModal.ok" }),
        cancelText: intl.formatMessage({ id: "request.cancelModal.back" }),
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            await cancelRequest(rid);
            message.success(intl.formatMessage({ id: "request.msg.cancelled" }));
            await load();
          } catch (e) {
            message.error(intl.formatMessage({ id: "request.msg.cancelFailed" }));
          }
        },
      });
    },
    [intl, load]
  );

  const columns = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: "request.col.category" }),
        dataIndex: "category",
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
        dataIndex: "subCategory",
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
        dataIndex: "status",
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
        dataIndex: "createdAt",
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
        width: 280,
        align: "center",
        render: (_, r) => {
          const id = r.id ?? r.Id;
          const st = r.status ?? r.Status;
          const bucket = statusBucket(st);
          const toDetail = () => history.push(`/dashboard/requests/${id}`);
          const toEdit = () => history.push(`/dashboard/requests/edit/${id}`);
          const btn = ui.requestTableActionBtn;

          if (bucket === "terminal") {
            return (
              <div style={ui.requestCellCenter}>
                <Button size="small" onClick={toDetail} style={btn}>
                  {intl.formatMessage({ id: "request.action.detail" })}
                </Button>
              </div>
            );
          }

          if (bucket === "draft") {
            return (
              <div style={ui.requestCellCenter}>
                <Space wrap size={8}>
                  <Button size="small" onClick={toEdit} style={btn}>
                    {intl.formatMessage({ id: "request.action.edit" })}
                  </Button>
                  <Button size="small" danger onClick={() => onCancel(r)} style={btn}>
                    {intl.formatMessage({ id: "request.action.cancelRequest" })}
                  </Button>
                </Space>
              </div>
            );
          }

          if (bucket === "needInfo") {
            return (
              <div style={ui.requestCellCenter}>
                <Space wrap size={8}>
                  <Button size="small" onClick={toEdit} style={btn}>
                    {intl.formatMessage({ id: "request.action.edit" })}
                  </Button>
                  <Button size="small" danger onClick={() => onCancel(r)} style={btn}>
                    {intl.formatMessage({ id: "request.action.cancelRequest" })}
                  </Button>
                </Space>
              </div>
            );
          }

          return (
            <div style={ui.requestCellCenter}>
              <Space wrap size={8}>
                <Button size="small" onClick={toDetail} style={btn}>
                  {intl.formatMessage({ id: "request.action.detail" })}
                </Button>
                <Button size="small" danger onClick={() => onCancel(r)} style={btn}>
                  {intl.formatMessage({ id: "request.action.cancelRequest" })}
                </Button>
              </Space>
            </div>
          );
        },
      },
    ],
    [intl, history, onCancel]
  );

  return (
    <LayoutWrapper>
      <PageHeader>{intl.formatMessage({ id: "request.my.pageTitle" })}</PageHeader>

      <div style={containerStyle}>
        <div style={{ ...ui.hero, marginBottom: 14 }}>
          <div style={{ minWidth: 0 }}>
            <Typography.Title level={3} style={ui.heroTitle}>
              {intl.formatMessage({ id: "request.my.heroTitle" })}
            </Typography.Title>
            <Typography.Text type="secondary" style={ui.heroSub}>
              {intl.formatMessage({ id: "request.my.heroSubtitle" })}
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
              <Input
                className="request-filter-search"
                placeholder={intl.formatMessage({ id: "request.searchPlaceholder" })}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                allowClear
                style={ui.requestListFilterSearch}
              />
              <Select
                className="request-filter-select"
                dropdownClassName="request-filter-dropdown"
                value={status}
                onChange={(v) => setStatus(v ?? FILTER_ALL)}
                options={statusOptions}
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
              {userRole === "admin" ? (
                <Button onClick={() => history.push("/dashboard/requests/admin")} style={ui.requestFilterBarBtn}>
                  {intl.formatMessage({ id: "request.adminPanel" })}
                </Button>
              ) : null}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => history.push("/dashboard/requests/new")}
                style={ui.requestFilterBarBtn}
              >
                {intl.formatMessage({ id: "request.newRequest" })}
              </Button>
            </Space>
          </div>
        </div>

        <Card style={surfaceCardStyle} bodyStyle={{ padding: 0 }} headStyle={softHeaderStyle} bordered>
          <div className="request-table-wrap">
            <Table
              rowKey={(r) => String(r.id ?? r.Id)}
              loading={loading}
              columns={columns}
              dataSource={filtered}
              size="middle"
              pagination={{ pageSize: 10, showSizeChanger: true }}
              style={ui.tableWrap}
              className="request-table"
              scroll={{ x: "max-content" }}
              locale={{
                emptyText: (
                  <div style={{ padding: "28px 12px" }}>
                    <Empty description={intl.formatMessage({ id: "request.empty.title" })}>
                      <Button type="primary" onClick={() => history.push("/dashboard/requests/new")}>
                        {intl.formatMessage({ id: "request.empty.cta" })}
                      </Button>
                    </Empty>
                  </div>
                ),
              }}
            />
          </div>
        </Card>
      </div>
    </LayoutWrapper>
  );
};

export default MyRequests;
