import React, { useMemo, useState } from "react";
import { useIntl } from "react-intl";
import { Table, Space, Button, Badge, message, Tooltip, Modal, Input } from "antd";
import { FilePdfOutlined, RollbackOutlined, CheckCircleOutlined, CloseOutlined } from "@ant-design/icons";
import axios from "axios";

import { host as API_BASE_URL } from "../../../Api/host";
import { DEBIT_STATUS, isDebitDelivered, isDebitSent, isDebitDeliveryFailed } from "../../Zimmet/debitStatus";

const onChange = () => {};

const getAuthToken = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.accessToken || localStorage.getItem("token");
  } catch {
    return localStorage.getItem("token");
  }
};

const AssetsTable = ({ data, currentUserId, onRefresh }) => {
  const intl = useIntl();
  const [returnOpen, setReturnOpen] = useState(false);
  const [returnRow, setReturnRow] = useState(null);
  const [returnNote, setReturnNote] = useState("");
  const [returnLoading, setReturnLoading] = useState(false);
  const [confirmDeliveryOpen, setConfirmDeliveryOpen] = useState(false);
  const [confirmDeliveryRow, setConfirmDeliveryRow] = useState(null);
  const [confirmDeliveryLoading, setConfirmDeliveryLoading] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectRow, setRejectRow] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const axiosAuth = useMemo(() => {
    const instance = axios.create({ baseURL: API_BASE_URL });
    instance.interceptors.request.use((config) => {
      const token = getAuthToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
    return instance;
  }, [API_BASE_URL]);

  const openPdf = (pdfPath) => {
    if (!pdfPath) {
      message.warning(intl.formatMessage({ id: "zimmetBilgilerim.table.pdfMissingWarning" }));
      return;
    }
    const fullUrl = `${API_BASE_URL}${pdfPath}`;
    window.open(fullUrl, "_blank");
  };

  const openReturnModal = (record) => {
    setReturnRow(record);
    setReturnNote("");
    setReturnOpen(true);
  };

  const submitReturnRequest = async () => {
    const pid = returnRow?.productId;
    const debitId = returnRow?.debitId ?? returnRow?.id;
    if (!pid || !debitId || !currentUserId) {
      message.error(intl.formatMessage({ id: "zimmetBilgilerim.return.missingData" }));
      return;
    }
    setReturnLoading(true);
    try {
      const body = {
        userId: Number(currentUserId),
        productId: Number(pid),
        relatedDebitId: Number(debitId),
        requestKind: "Return",
        description: (returnNote || "").trim(),
      };
      const res = await axiosAuth.post("/api/DebitRequest/add", body);
      const payload = res?.data;
      const ok = payload?.success === true || payload?.Success === true;
      if (ok) {
        message.success(intl.formatMessage({ id: "zimmetBilgilerim.return.success" }));
        setReturnOpen(false);
        setReturnRow(null);
        if (onRefresh) onRefresh();
      } else {
        message.error(payload?.message || intl.formatMessage({ id: "zimmetBilgilerim.return.error" }));
      }
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.response?.data?.Message;
      message.error(msg || intl.formatMessage({ id: "zimmetBilgilerim.return.error" }));
    } finally {
      setReturnLoading(false);
    }
  };

  const submitConfirmDelivery = async () => {
    const debitId = confirmDeliveryRow?.debitId ?? confirmDeliveryRow?.id;
    if (!debitId) {
      message.error(intl.formatMessage({ id: "zimmetBilgilerim.return.missingData" }));
      return;
    }
    setConfirmDeliveryLoading(true);
    try {
      const res = await axiosAuth.post("/api/debit/confirm-delivery", { debitId: Number(debitId) });
      const ok = res?.data?.success === true || res?.data?.Success === true;
      if (ok) {
        message.success(intl.formatMessage({ id: "zimmetBilgilerim.handshake.success" }));
        setConfirmDeliveryOpen(false);
        setConfirmDeliveryRow(null);
        if (onRefresh) onRefresh();
        window.dispatchEvent(new CustomEvent("debit-requests:refresh"));
      } else {
        message.error(res?.data?.message || intl.formatMessage({ id: "zimmetBilgilerim.handshake.error" }));
      }
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.response?.data?.Message;
      message.error(msg || intl.formatMessage({ id: "zimmetBilgilerim.handshake.error" }));
    } finally {
      setConfirmDeliveryLoading(false);
    }
  };

  const submitMarkDeliveryFailed = async () => {
    const debitId = rejectRow?.debitId ?? rejectRow?.id;
    if (!debitId) {
      message.error(intl.formatMessage({ id: "zimmetBilgilerim.return.missingData" }));
      return;
    }
    setRejectLoading(true);
    try {
      const note = (rejectNote || "").trim();
      const res = await axiosAuth.post("/api/debit/handshake/reject", {
        debitId: Number(debitId),
        note: note || undefined,
      });
      const ok = res?.data?.success === true || res?.data?.Success === true;
      if (ok) {
        message.success(intl.formatMessage({ id: "zimmetBilgilerim.handshake.rejectSuccess" }));
        setRejectOpen(false);
        setRejectRow(null);
        setRejectNote("");
        if (onRefresh) onRefresh();
      } else {
        message.error(res?.data?.message || intl.formatMessage({ id: "zimmetBilgilerim.handshake.rejectError" }));
      }
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e?.response?.data?.Message;
      message.error(msg || intl.formatMessage({ id: "zimmetBilgilerim.handshake.rejectError" }));
    } finally {
      setRejectLoading(false);
    }
  };

  const columns = [
    {
      title: intl.formatMessage({ id: "zimmetBilgilerim.table.colCategory" }),
      dataIndex: "categorie",
      sorter: (a, b) => a.categorie.localeCompare(b.categorie),
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: intl.formatMessage({ id: "zimmetBilgilerim.table.colProduct" }),
      dataIndex: "product",
      sorter: (a, b) => a.product.localeCompare(b.product),
    },
    {
      title: intl.formatMessage({ id: "zimmetBilgilerim.table.colSerial" }),
      dataIndex: "serial_number",
      sorter: (a, b) => a.serial_number.localeCompare(b.serial_number),
    },
    {
      title: intl.formatMessage({ id: "zimmetBilgilerim.table.colStatus" }),
      dataIndex: "statu",
      key: "statu",
      sorter: (a, b) => a.statu.localeCompare(b.statu),
      render: (_, record) => {
        let statusType = "default";
        if (isDebitDelivered(record.statu)) statusType = "success";
        else if (record.statu === DEBIT_STATUS.SENT) statusType = "processing";
        else if (isDebitDeliveryFailed(record.statu)) statusType = "error";
        else if (record.statu === "Zimmetli") statusType = "warning";
        else if (record.statu === "İade Edildi") statusType = "default";

        return <Badge status={statusType} text={record.statu} />;
      },
    },
    {
      title: intl.formatMessage({ id: "zimmetBilgilerim.table.colDeliveryDate" }),
      dataIndex: "teslim_tarihi",
      defaultSortOrder: "descend",
      sorter: (a, b) => (a.deliverySortKey || 0) - (b.deliverySortKey || 0),
      render: (text) => (
        <span className="zimmet-delivery-date-cell">{text || "—"}</span>
      ),
    },
    {
      title: intl.formatMessage({ id: "zimmetBilgilerim.table.colHandover" }),
      dataIndex: "action",
      align: "center",
      render: (_, record) => {
        const hasPdf = !!record.pdfPath;

        return (
          <span
            className="zimmet-action-slot"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 34,
            }}
          >
            <Tooltip
              title={
                hasPdf
                  ? intl.formatMessage({ id: "zimmetBilgilerim.table.tooltipPdfOpen" })
                  : intl.formatMessage({ id: "zimmetBilgilerim.table.tooltipPdfMissing" })
              }
            >
              <Button
                type="text"
                disabled={!hasPdf}
                icon={
                  <FilePdfOutlined
                    style={{
                      fontSize: "20px",
                      color: hasPdf ? "#ff4d4f" : "#d9d9d9",
                    }}
                  />
                }
                onClick={() => openPdf(record.pdfPath)}
              />
            </Tooltip>
          </span>
        );
      },
    },
    {
      title: intl.formatMessage({ id: "zimmetBilgilerim.table.colAction" }),
      key: "islemler",
      align: "center",
      width: 224,
      render: (_, record) => {
        if (isDebitSent(record.statu)) {
          const btnBase = {
            height: 28,
            minHeight: 28,
            padding: "0 7px",
            borderRadius: 6,
            fontWeight: 500,
            fontSize: 11,
            lineHeight: "26px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          };
          const iconSm = { fontSize: 12 };
          return (
            <div
              className="zimmet-handshake-actions"
              style={{
                display: "inline-flex",
                flexDirection: "row",
                flexWrap: "nowrap",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                margin: "0 auto",
              }}
            >
              <Tooltip title={intl.formatMessage({ id: "zimmetBilgilerim.handshake.receiveTooltip" })}>
                <span className="zimmet-action-slot" style={{ display: "inline-flex", padding: 0 }}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<CheckCircleOutlined style={iconSm} />}
                    onClick={() => {
                      setConfirmDeliveryRow(record);
                      setConfirmDeliveryOpen(true);
                    }}
                    style={{
                      ...btnBase,
                      background: "#52c41a",
                      borderColor: "#52c41a",
                      color: "#fff",
                    }}
                  >
                    {intl.formatMessage({ id: "zimmetBilgilerim.handshake.receiveButton" })}
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={intl.formatMessage({ id: "zimmetBilgilerim.handshake.rejectTooltip" })}>
                <span className="zimmet-action-slot zimmet-action-slot--danger" style={{ display: "inline-flex", padding: 0 }}>
                  <Button
                    danger
                    type="default"
                    size="small"
                    icon={<CloseOutlined style={iconSm} />}
                    onClick={() => {
                      setRejectRow(record);
                      setRejectNote("");
                      setRejectOpen(true);
                    }}
                    style={{
                      ...btnBase,
                      borderWidth: 1,
                      color: "#cf1322",
                      borderColor: "#ffccc7",
                      background: "#fff",
                    }}
                  >
                    {intl.formatMessage({ id: "zimmetBilgilerim.handshake.rejectButton" })}
                  </Button>
                </span>
              </Tooltip>
            </div>
          );
        }

        const canReturn = isDebitDelivered(record.statu);
        if (!canReturn) {
          return (
            <span style={{ color: "#bfbfbf", fontSize: 13 }}>
              {intl.formatMessage({ id: "zimmetBilgilerim.return.notAvailable" })}
            </span>
          );
        }

        return (
          <div
            className="zimmet-action-slot zimmet-action-slot--accent"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "fit-content",
              maxWidth: "100%",
              margin: "0 auto",
              padding: "0 2px",
              verticalAlign: "middle",
            }}
          >
            <Tooltip title={intl.formatMessage({ id: "zimmetBilgilerim.return.tooltip" })}>
              <Button
                type="default"
                size="small"
                icon={<RollbackOutlined style={{ fontSize: 12 }} />}
                onClick={() => openReturnModal(record)}
                style={{
                  fontWeight: 500,
                  fontSize: 11,
                  lineHeight: "26px",
                  borderRadius: 6,
                  borderColor: "#fa8c16",
                  color: "#d46b08",
                  background: "#fff7e6",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  height: 28,
                  minHeight: 28,
                  padding: "0 7px",
                  boxShadow: "none",
                }}
              >
                {intl.formatMessage({ id: "zimmetBilgilerim.return.buttonShort" })}
              </Button>
            </Tooltip>
          </div>
        );
      },
    },
  ];

  return (
    <Space style={{ width: "100%" }} direction="vertical">
      <Table
        className="zimmet-assets-table"
        columns={columns}
        dataSource={data}
        onChange={onChange}
        rowKey={(r) => r.id ?? r.key ?? r.serial_number}
        pagination={{ pageSize: 10 }}
        size="middle"
      />

      <Modal
        title={intl.formatMessage({ id: "zimmetBilgilerim.return.modalTitle" })}
        open={returnOpen}
        onOk={submitReturnRequest}
        onCancel={() => {
          if (!returnLoading) {
            setReturnOpen(false);
            setReturnRow(null);
          }
        }}
        okText={intl.formatMessage({ id: "zimmetBilgilerim.return.confirm" })}
        cancelText={intl.formatMessage({ id: "zimmetBilgilerim.return.cancel" })}
        confirmLoading={returnLoading}
        destroyOnClose
        okButtonProps={{ style: { minWidth: 120 } }}
      >
        <p style={{ marginBottom: 12, color: "rgba(0,0,0,0.75)", lineHeight: 1.6 }}>
          {intl.formatMessage(
            { id: "zimmetBilgilerim.return.modalBodyWithProduct" },
            {
              product: returnRow?.product ?? "—",
              serial: returnRow?.serial_number ?? "—",
            }
          )}
        </p>
        <p style={{ marginBottom: 8, fontSize: 13, color: "rgba(0,0,0,0.45)" }}>
          {intl.formatMessage({ id: "zimmetBilgilerim.return.modalNoteHint" })}
        </p>
        <Input.TextArea
          rows={3}
          value={returnNote}
          onChange={(e) => setReturnNote(e.target.value)}
          placeholder={intl.formatMessage({ id: "zimmetBilgilerim.return.notePlaceholder" })}
          maxLength={500}
          showCount
        />
      </Modal>

      <Modal
        title={intl.formatMessage({ id: "zimmetBilgilerim.handshake.modalTitle" })}
        open={confirmDeliveryOpen}
        onOk={submitConfirmDelivery}
        onCancel={() => {
          if (!confirmDeliveryLoading) {
            setConfirmDeliveryOpen(false);
            setConfirmDeliveryRow(null);
          }
        }}
        okText={intl.formatMessage({ id: "zimmetBilgilerim.handshake.confirm" })}
        cancelText={intl.formatMessage({ id: "zimmetBilgilerim.handshake.cancel" })}
        confirmLoading={confirmDeliveryLoading}
        destroyOnClose
        okButtonProps={{ style: { minWidth: 140 } }}
      >
        <p style={{ marginBottom: 0, color: "rgba(0,0,0,0.75)", lineHeight: 1.6 }}>
          {intl.formatMessage({ id: "zimmetBilgilerim.handshake.modalBody" })}
        </p>
      </Modal>

      <Modal
        title={intl.formatMessage({ id: "zimmetBilgilerim.handshake.rejectModalTitle" })}
        open={rejectOpen}
        onOk={submitMarkDeliveryFailed}
        onCancel={() => {
          if (!rejectLoading) {
            setRejectOpen(false);
            setRejectRow(null);
            setRejectNote("");
          }
        }}
        okText={intl.formatMessage({ id: "zimmetBilgilerim.handshake.rejectConfirm" })}
        cancelText={intl.formatMessage({ id: "zimmetBilgilerim.handshake.cancel" })}
        confirmLoading={rejectLoading}
        destroyOnClose
        okButtonProps={{ danger: true, type: "primary", style: { minWidth: 120 } }}
      >
        <p style={{ marginBottom: 10, color: "rgba(0,0,0,0.75)", lineHeight: 1.6 }}>
          {intl.formatMessage({ id: "zimmetBilgilerim.handshake.rejectModalBody" })}
        </p>
        <Input.TextArea
          rows={3}
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder={intl.formatMessage({ id: "zimmetBilgilerim.handshake.rejectNotePlaceholder" })}
          maxLength={500}
          showCount
        />
      </Modal>
    </Space>
  );
};

export default AssetsTable;
