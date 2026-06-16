import React, { useState } from "react";
import axios from "axios";
import { useIntl } from "react-intl";

import { Table, Space, Button, Badge, Tooltip, message, Modal, Dropdown, Menu } from "antd";
import {
  InfoCircleOutlined,
  FileOutlined,
  DeleteOutlined,
  EditOutlined,
  UndoOutlined,
  MoreOutlined,
} from "@ant-design/icons";

import { host as API_BASE_URL } from "../../../Api/host";
import { DEBIT_STATUS, isDebitDeliveryFailed } from "../../Zimmet/debitStatus";

const onChange = () => {};

const getAuthToken = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u?.accessToken || localStorage.getItem("token");
  } catch {
    return localStorage.getItem("token");
  }
};

const downloadDebitPdf = async (intl, id) => {
  if (!id && id !== 0) {
    message.error(intl.formatMessage({ id: "zimmetBilgileri.table.invalidDebitId" }));
    return;
  }

  const hide = message.loading(intl.formatMessage({ id: "zimmetBilgileri.table.pdfPreparing" }), 0);
  const token = getAuthToken();

  try {
    const res = await axios.get(`${API_BASE_URL}/api/debit/download/${id}`, {
      responseType: "blob",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    hide();

    const file = new Blob([res.data], { type: "application/pdf" });
    const fileURL = window.URL.createObjectURL(file);
    window.open(fileURL, "_blank");
  } catch (err) {
    hide();
    console.error(err);
    message.error(intl.formatMessage({ id: "zimmetBilgileri.table.pdfOpenFailed" }));
  }
};

const AssetsTable = ({
  data,
  openDelete,
  setWillBeDeleted,
  setWillBeShowDetails,
  openDetailsDrawer,
  openEditDrawer,
  onRevoked,
}) => {
  const intl = useIntl();
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeRecord, setRevokeRecord] = useState(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const confirmRevoke = async () => {
    const debitId = revokeRecord?.id;
    if (!debitId && debitId !== 0) return;
    const token = getAuthToken();
    setRevokeLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/debit/${debitId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      message.success(intl.formatMessage({ id: "zimmetBilgileri.revoke.success" }));
      setRevokeOpen(false);
      setRevokeRecord(null);
      if (onRevoked) await onRevoked();
    } catch (e) {
      console.error(e);
      message.error(intl.formatMessage({ id: "zimmetBilgileri.revoke.error" }));
    } finally {
      setRevokeLoading(false);
    }
  };

  const canRevoke = (record) => {
    const s = String(record?.statu || "").trim();
    return s === "Teslim Edildi" || s === DEBIT_STATUS.SENT;
  };

  const openRevokeModal = (record) => {
    setRevokeRecord(record);
    setRevokeOpen(true);
  };

  const personelColumns = [
    {
      title: intl.formatMessage({ id: "zimmetBilgileri.table.colPersonnel" }),
      dataIndex: "personel",
      sorter: (a, b) => a.personel.localeCompare(b.personel),
    },
    {
      title: intl.formatMessage({ id: "zimmetBilgileri.table.colProduct" }),
      dataIndex: "product",
      sorter: (a, b) => a.product.localeCompare(b.product),
    },
    {
      title: intl.formatMessage({ id: "zimmetBilgileri.table.colSerial" }),
      dataIndex: "serial_number",
      sorter: (a, b) => a.serial_number.localeCompare(b.serial_number),
    },
    {
      title: intl.formatMessage({ id: "zimmetBilgileri.table.colStatus" }),
      dataIndex: "statu",
      key: "statu",
      sorter: (a, b) => a.statu.localeCompare(b.statu),
      render: (_, record) => {
        let color = "geekblue";
        if (record.statu === "Teslim Edildi") color = "lime";
        else if (record.statu === DEBIT_STATUS.SENT) color = "gold";
        else if (record.statu === DEBIT_STATUS.DELIVERY_FAILED) color = "red";
        else if (record.statu === "Teslim Edilmedi") color = "purple";
        return (
          <Tooltip
            title={
              record.geri_teslim_tarihi
                ? record.teslim_tarihi + " - " + record.geri_teslim_tarihi
                : record.teslim_tarihi
            }
          >
            <Badge color={color} status="success" text={record.statu} />
          </Tooltip>
        );
      },
    },
    {
      title: intl.formatMessage({ id: "zimmetBilgileri.table.colAction" }),
      dataIndex: "actions",
      align: "center",
      width: 340,
      render: (_, record) => {
        const debitId = record.id ?? record.key ?? record.personelId;
        const slotW = 40;
        const deliveryFailed = isDebitDeliveryFailed(record.statu);
        const pdfDisabled = record.statu === DEBIT_STATUS.SENT || record.statu === DEBIT_STATUS.DELIVERY_FAILED;
        /** Aksiyon satırı: tek ton, modern görünüm (sadece sil Ant danger ile vurgulanır) */
        const iconInk = "rgba(0, 0, 0, 0.55)";
        const iconInkDisabled = "#d9d9d9";
        const iconSize = 16;

        const slot = (child, variant) => (
          <div
            className={`zimmet-action-slot${variant === "danger" ? " zimmet-action-slot--danger" : ""}`}
            style={{
              width: slotW,
              minHeight: 32,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {child}
          </div>
        );

        const actionBtn = (opts) => (
          <Tooltip title={opts.title}>
            <Button
              type="text"
              size="small"
              icon={opts.icon}
              danger={opts.danger}
              disabled={opts.disabled}
              onClick={opts.onClick}
              style={{
                width: 34,
                height: 34,
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: opts.danger ? undefined : iconInk,
              }}
            />
          </Tooltip>
        );

        const openAdminMarkDelivered = () => {
          Modal.confirm({
            title: intl.formatMessage({ id: "zimmetBilgileri.handshake.adminConfirmTitle" }),
            content: intl.formatMessage({ id: "zimmetBilgileri.handshake.adminConfirmBody" }),
            okText: intl.formatMessage({ id: "zimmetBilgileri.handshake.adminDeliveredOk" }),
            cancelText: intl.formatMessage({ id: "zimmetBilgileri.handshake.adminDeliveredCancel" }),
            onOk: async () => {
              try {
                const token = getAuthToken();
                const res = await axios.post(
                  `${API_BASE_URL}/api/debit/mark-delivered`,
                  { debitId: Number(record.id) },
                  { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                );
                const ok = res?.data?.success === true || res?.data?.Success === true;
                if (!ok) {
                  message.error(res?.data?.message || intl.formatMessage({ id: "zimmetBilgileri.handshake.adminError" }));
                  throw new Error("mark-delivered failed");
                }
                message.success(intl.formatMessage({ id: "zimmetBilgileri.handshake.adminSuccess" }));
                if (onRevoked) await onRevoked();
              } catch (e) {
                if (e?.message !== "mark-delivered failed") {
                  message.error(intl.formatMessage({ id: "zimmetBilgileri.handshake.adminError" }));
                }
                throw e;
              }
            },
          });
        };

        const openAdminMarkFailed = () => {
          Modal.confirm({
            title: intl.formatMessage({ id: "zimmetBilgileri.handshake.adminFailedConfirmTitle" }),
            content: intl.formatMessage({ id: "zimmetBilgileri.handshake.adminFailedConfirmBody" }),
            okText: intl.formatMessage({ id: "zimmetBilgileri.handshake.adminFailedOk" }),
            cancelText: intl.formatMessage({ id: "zimmetBilgileri.handshake.adminFailedCancel" }),
            okButtonProps: { danger: true, type: "primary" },
            onOk: async () => {
              try {
                const token = getAuthToken();
                const res = await axios.post(
                  `${API_BASE_URL}/api/debit/handshake/reject-admin`,
                  { debitId: Number(record.id), note: null },
                  { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                );
                const ok = res?.data?.success === true || res?.data?.Success === true;
                if (!ok) {
                  message.error(res?.data?.message || intl.formatMessage({ id: "zimmetBilgileri.handshake.adminError" }));
                  throw new Error("mark-failed failed");
                }
                message.success(intl.formatMessage({ id: "zimmetBilgileri.handshake.adminFailedSuccess" }));
                if (onRevoked) await onRevoked();
              } catch (e) {
                if (e?.message !== "mark-failed failed") {
                  message.error(intl.formatMessage({ id: "zimmetBilgileri.handshake.adminError" }));
                }
                throw e;
              }
            },
          });
        };

        if (deliveryFailed) {
          return (
            <div
              style={{
                display: "flex",
                flexWrap: "nowrap",
                justifyContent: "center",
                alignItems: "center",
                gap: 6,
                padding: "4px 0",
              }}
            >
              {slot(
                actionBtn({
                  title: intl.formatMessage({ id: "zimmetBilgileri.table.menuDetail" }),
                  icon: <InfoCircleOutlined style={{ fontSize: iconSize, color: iconInk }} />,
                  onClick: () => {
                    openDetailsDrawer(true);
                    setWillBeShowDetails(record);
                  },
                })
              )}
              {slot(
                actionBtn({
                  title: intl.formatMessage({ id: "zimmetBilgileri.table.menuDelete" }),
                  icon: <DeleteOutlined style={{ fontSize: iconSize }} />,
                  danger: true,
                  onClick: () => {
                    openDelete(true);
                    setWillBeDeleted(record.id);
                  },
                }),
                "danger"
              )}
            </div>
          );
        }

        return (
          <div
            style={{
              display: "flex",
              flexWrap: "nowrap",
              justifyContent: "center",
              alignItems: "center",
              gap: 6,
              padding: "4px 0",
            }}
          >
            {slot(
              actionBtn({
                title: intl.formatMessage({ id: "zimmetBilgileri.table.tooltipPdf" }),
                icon: (
                  <FileOutlined style={{ fontSize: iconSize, color: pdfDisabled ? iconInkDisabled : iconInk }} />
                ),
                disabled: pdfDisabled,
                onClick: () => downloadDebitPdf(intl, debitId),
              })
            )}
            {slot(
              actionBtn({
                title: intl.formatMessage({ id: "zimmetBilgileri.table.menuUpdate" }),
                icon: <EditOutlined style={{ fontSize: iconSize, color: iconInk }} />,
                onClick: () => {
                  openEditDrawer(true);
                  setWillBeShowDetails(record);
                },
              })
            )}
            {slot(
              actionBtn({
                title: intl.formatMessage({ id: "zimmetBilgileri.table.menuDetail" }),
                icon: <InfoCircleOutlined style={{ fontSize: iconSize, color: iconInk }} />,
                onClick: () => {
                  openDetailsDrawer(true);
                  setWillBeShowDetails(record);
                },
              })
            )}
            {slot(
              canRevoke(record) ? (
                actionBtn({
                  title: intl.formatMessage({ id: "zimmetBilgileri.table.menuRevoke" }),
                  icon: <UndoOutlined style={{ fontSize: iconSize, color: iconInk }} />,
                  onClick: () => openRevokeModal(record),
                })
              ) : null
            )}
            {slot(
              record.statu === DEBIT_STATUS.SENT ? (
                <Dropdown
                  overlay={
                    <Menu
                      style={{ minWidth: 232, padding: "6px 0", borderRadius: 10 }}
                      onClick={({ key, domEvent }) => {
                        domEvent?.stopPropagation?.();
                        if (key === "mark-delivered") openAdminMarkDelivered();
                        if (key === "mark-failed") openAdminMarkFailed();
                      }}
                    >
                      <Menu.Item key="mark-delivered" style={{ margin: "0 6px", borderRadius: 8, height: "auto", lineHeight: 1.45 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 500,
                            color: "rgba(0, 0, 0, 0.88)",
                          }}
                        >
                          {intl.formatMessage({ id: "zimmetBilgileri.table.adminMarkDelivered" })}
                        </span>
                      </Menu.Item>
                      <Menu.Item key="mark-failed" style={{ margin: "0 6px", borderRadius: 8, height: "auto", lineHeight: 1.45 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 500,
                            color: "#cf1322",
                          }}
                        >
                          {intl.formatMessage({ id: "zimmetBilgileri.table.adminMarkDeliveryFailed" })}
                        </span>
                      </Menu.Item>
                    </Menu>
                  }
                  trigger={["click"]}
                  placement="bottomRight"
                >
                  <Tooltip title={intl.formatMessage({ id: "zimmetBilgileri.table.tooltipMore" })}>
                    <Button
                      type="text"
                      size="small"
                      icon={<MoreOutlined style={{ fontSize: iconSize, color: iconInk }} />}
                      style={{ width: 34, height: 34, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    />
                  </Tooltip>
                </Dropdown>
              ) : (
                <span style={{ width: slotW, minHeight: 32, display: "inline-block" }} aria-hidden />
              )
            )}
            {slot(
              actionBtn({
                title: intl.formatMessage({ id: "zimmetBilgileri.table.menuDelete" }),
                icon: <DeleteOutlined style={{ fontSize: iconSize }} />,
                danger: true,
                onClick: () => {
                  openDelete(true);
                  setWillBeDeleted(record.id);
                },
              }),
              "danger"
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Space style={{ width: "100%" }} direction="vertical">
      <Table
        className="zimmet-assets-table"
        pagination={{
          style: { marginTop: "2rem" },
          position: ["bottomCenter"],
          defaultPageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "30"],
        }}
        columns={personelColumns}
        dataSource={data}
        onChange={onChange}
        rowKey={(r) => r.id ?? r.key ?? r.personelId}
      />

      <Modal
        title={intl.formatMessage({ id: "zimmetBilgileri.revoke.modalTitle" })}
        open={revokeOpen}
        onOk={confirmRevoke}
        onCancel={() => {
          if (!revokeLoading) {
            setRevokeOpen(false);
            setRevokeRecord(null);
          }
        }}
        okText={intl.formatMessage({ id: "zimmetBilgileri.revoke.ok" })}
        cancelText={intl.formatMessage({ id: "zimmetBilgileri.revoke.cancel" })}
        confirmLoading={revokeLoading}
        okButtonProps={{ danger: true }}
      >
        <p>
          {intl.formatMessage(
            { id: "zimmetBilgileri.revoke.confirmBody" },
            {
              person: revokeRecord?.personel ?? "",
              product: revokeRecord?.product ?? "",
            }
          )}
        </p>
      </Modal>
    </Space>
  );
};

export default AssetsTable;
