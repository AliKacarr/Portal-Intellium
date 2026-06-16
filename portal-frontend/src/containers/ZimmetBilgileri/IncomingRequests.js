import React, { useState, useEffect, useMemo } from "react";
import { useIntl } from "react-intl";
import { Table, Button, Space, message, Popconfirm, Tooltip, Breadcrumb, Badge, Modal } from "antd";
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ArrowLeftOutlined,
  InfoCircleOutlined,
  PlusOutlined
} from "@ant-design/icons"; // SyncOutlined kaldırıldı
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import Box from "@iso/components/utility/box";
import PageHeader from "@iso/components/utility/pageHeader";
import axios from "axios";
import { host } from "../../Api/host";
import moment from "moment";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";

import NewAssetModal from "./Components/NewAssetModal";
import "./customStyles.css";

const isReturnRequest = (r) =>
  String(r?.requestKind ?? r?.RequestKind ?? "").toLowerCase() === "return";

const IncomingRequests = () => {
  const intl = useIntl();
  const history = useHistory();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { accessToken } = useSelector((state) => state.Auth);
  const token = accessToken || localStorage.getItem("token");
  
  const axiosAuth = useMemo(() => axios.create({
      baseURL: host,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }), [token]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosAuth.get("/api/DebitRequest/getall");
      const ok = res?.data?.success === true || res?.data?.Success === true;
      if (ok) {
        const raw = res?.data?.data ?? res?.data?.Data ?? [];
        const pending = raw.filter(r => r.status === "Bekliyor" || r.status === "Stok Bekliyor" || r.status === "Envanter Bekliyor");
        pending.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
        setRequests(pending);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchRequests();
  }, []);

  const handleReject = async (id) => {
    try {
        await axiosAuth.post(`/api/DebitRequest/reject?id=${id}`);
        message.success(intl.formatMessage({ id: "zimmetBilgileri.incoming.rejectSuccess" }));
        fetchRequests();
    } catch (error) {
        message.error(intl.formatMessage({ id: "zimmetBilgileri.incoming.rejectError" }));
    }
  };

  const handleApproveClick = (record) => {
      if (isReturnRequest(record)) {
        Modal.confirm({
          title: intl.formatMessage({ id: "zimmetBilgileri.incoming.returnApproveTitle" }),
          content: intl.formatMessage({ id: "zimmetBilgileri.incoming.returnApproveBody" }),
          okText: intl.formatMessage({ id: "zimmetBilgileri.incoming.returnApproveOk" }),
          cancelText: intl.formatMessage({ id: "zimmetBilgileri.incoming.popRejectCancel" }),
          onOk: async () => {
            try {
              await axiosAuth.post(`/api/DebitRequest/complete?id=${record.id}`);
              message.success(intl.formatMessage({ id: "zimmetBilgileri.incoming.returnApproveSuccess" }));
              fetchRequests();
            } catch (e) {
              console.error(e);
              message.error(intl.formatMessage({ id: "zimmetBilgileri.incoming.returnApproveError" }));
            }
          },
        });
        return;
      }
      setSelectedRequest(record);
      setAssignModalOpen(true);
  };

  const onAssignSuccess = async () => {
      const requestId = selectedRequest?.id ?? selectedRequest?.Id;
      if (requestId) {
          try {
              const res = await axiosAuth.post(`/api/DebitRequest/complete?id=${requestId}`);
              const ok = res?.data?.success === true || res?.data?.Success === true;
              if (ok) {
                  message.success(intl.formatMessage({ id: "zimmetBilgileri.incoming.approveSuccess" }));
                  fetchRequests();
              } else {
                  message.info(intl.formatMessage({ id: "zimmetBilgileri.incoming.approveError" }));
                  fetchRequests();
              }
          } catch (e) {
              console.error(e);
              message.info(intl.formatMessage({ id: "zimmetBilgileri.incoming.approveError" }));
              fetchRequests();
          }
      }
      setAssignModalOpen(false);
      setSelectedRequest(null);
  };

  const columns = [
    { 
        title: intl.formatMessage({ id: "zimmetBilgileri.incoming.colPersonnel" }), 
        dataIndex: "userName", 
        key: "userName",
        render: (text) => <span style={{fontWeight:600}}>{text}</span> 
    },
    { 
        title: intl.formatMessage({ id: "zimmetBilgileri.incoming.colRequested" }), 
        key: "requested",
        width: 260,
        render: (_, r) => <span style={{ fontWeight: 600 }}>{r?.productLabel || r?.category}</span> 
    },
    {
      title: intl.formatMessage({ id: "zimmetBilgileri.incoming.colStatus" }),
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (st, record) => {
        if (isReturnRequest(record) && st === "Bekliyor") {
          return (
            <Badge
              status="processing"
              text={intl.formatMessage({ id: "zimmetBilgileri.incoming.typeReturnRequest" })}
            />
          );
        }
        if (st === "Bekliyor") return <Badge status="processing" text={intl.formatMessage({ id: "zimmetBilgileri.incoming.statusPending" })} />;
        if (st === "Stok Bekliyor") {
          return (
            <Badge
              status="warning"
              text={String(record?.productStatus || "").toLowerCase() === "zimmetli"
                ? intl.formatMessage({ id: "zimmetBilgileri.incoming.statusAssignedOther" })
                : intl.formatMessage({ id: "zimmetBilgileri.incoming.statusOutOfStock" })}
            />
          );
        }
        if (st === "Envanter Bekliyor") return <Badge status="warning" text={intl.formatMessage({ id: "zimmetBilgileri.incoming.statusNewProductRequest" })} />;
        return <Badge status="default" text={st} />;
      },
    },
    { 
        title: intl.formatMessage({ id: "zimmetBilgileri.incoming.colDescription" }), 
        dataIndex: "description", 
        key: "description" 
    },
    { 
        title: intl.formatMessage({ id: "zimmetBilgileri.incoming.colDate" }), 
        dataIndex: "requestDate", 
        width: 130,
        render: d => moment(d).format("DD.MM.YYYY") 
    },
    {
      title: intl.formatMessage({ id: "zimmetBilgileri.incoming.colAction" }),
      key: "action",
      width: 170,
      align: 'center',
      render: (_, record) => (
        <div
          className="zimmet-action-toolbar"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: 190, // sabit alan: satırlar arası kayma olmasın
            height: 34,
          }}
        >
          {/* Slot-1: Stoğa Ekle (varsa), yoksa placeholder (kayma engeli) */}
          <div
            className="zimmet-action-slot"
            style={{
              width: 38,
              height: 34,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {record.status === "Stok Bekliyor" || record.status === "Envanter Bekliyor" ? (
              <Tooltip title={intl.formatMessage({ id: "zimmetBilgileri.incoming.tooltipAddStock" })}>
                <Button
                  type="text"
                  size="middle"
                  style={{ width: 38, height: 34 }}
                  icon={<PlusOutlined style={{ color: "#1890ff", fontSize: 20 }} />}
                  onClick={() => {
                    try {
                      sessionStorage.setItem(
                        "debitRequestStockPrefill",
                        JSON.stringify(
                          record.status === "Stok Bekliyor"
                            ? {
                                debitRequestId: record?.id ?? record?.Id,
                                productId: record?.productId ?? record?.ProductId,
                                requestedCategory: record?.requestedCategory,
                                requestedBrand: record?.requestedBrand,
                                requestedModel: record?.requestedModel,
                              }
                            : {
                                debitRequestId: record?.id ?? record?.Id,
                                requestedCategory: record?.requestedCategory || record?.category,
                                requestedBrand: record?.requestedBrand,
                                requestedModel: record?.requestedModel,
                              }
                        )
                      );
                    } catch {}
                    history.push("/dashboard/products");
                  }}
                />
              </Tooltip>
            ) : (
              <span style={{ display: "inline-block", width: 38, height: 34 }} />
            )}
          </div>

          <div
            className="zimmet-action-slot"
            style={{
              width: 38,
              height: 34,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Tooltip title={isReturnRequest(record) ? intl.formatMessage({ id: "zimmetBilgileri.incoming.tooltipApproveReturn" }) : intl.formatMessage({ id: "zimmetBilgileri.incoming.tooltipApprove" })}>
              <Button
                type="text"
                size="middle"
                style={{ width: 38, height: 34 }}
                icon={<CheckCircleOutlined style={{ color: "#52c41a", fontSize: 20 }} />}
                onClick={() => handleApproveClick(record)}
              />
            </Tooltip>
          </div>

          <div
            className="zimmet-action-slot zimmet-action-slot--danger"
            style={{
              width: 38,
              height: 34,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Popconfirm
              title={intl.formatMessage({ id: "zimmetBilgileri.incoming.popRejectTitle" })}
              okText={intl.formatMessage({ id: "zimmetBilgileri.incoming.popRejectOk" })}
              cancelText={intl.formatMessage({ id: "zimmetBilgileri.incoming.popRejectCancel" })}
              onConfirm={() => handleReject(record.id)}
            >
              <Tooltip title={intl.formatMessage({ id: "zimmetBilgileri.incoming.tooltipReject" })}>
                <Button
                  type="text"
                  size="middle"
                  style={{ width: 38, height: 34 }}
                  icon={<CloseCircleOutlined style={{ color: "#ff4d4f", fontSize: 20 }} />}
                />
              </Tooltip>
            </Popconfirm>
          </div>

          {/* Slot-4: Admin uyarısı (varsa), yoksa placeholder */}
          <div
            className={record?.adminWarning ? "zimmet-action-slot zimmet-action-slot--icon" : "zimmet-action-slot"}
            style={{
              width: 24,
              height: 34,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {record?.adminWarning ? (
              <Tooltip title={record.adminWarning}>
                <span style={{ width: 24, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <InfoCircleOutlined style={{ color: "#faad14", fontSize: 18 }} />
                </span>
              </Tooltip>
            ) : (
              <span style={{ display: "inline-block", width: 24, height: 34 }} />
            )}
          </div>
        </div>
      )
    }
  ];

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "zimmetBilgileri.breadcrumb.root" })}</Breadcrumb.Item>
          <Breadcrumb.Item>{intl.formatMessage({ id: "zimmetBilgileri.breadcrumb.incoming" })}</Breadcrumb.Item>
        </Breadcrumb>

        <PageHeader>
          {intl.formatMessage({ id: "zimmetBilgileri.incomingPageTitle" })}
        </PageHeader>

        {/* ✅ YENİLE BUTONU KALDIRILDI */}
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            marginTop: "-6px",
            marginBottom: "18px",
          }}
        >
          <Button
            type="primary"
            ghost
            icon={<ArrowLeftOutlined />}
            onClick={() => history.push("/dashboard/assets")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 36,
              padding: "0 14px",
              borderRadius: 8,
              fontWeight: 600,
              margin: "8px 0",
            }}
          >
            {intl.formatMessage({ id: "zimmetBilgileri.incoming.backToList" })}
          </Button>
        </div>

        <Table
            className="zimmet-assets-table"
            dataSource={requests} 
            columns={columns} 
            rowKey="id" 
            loading={loading} 
            pagination={{pageSize: 10}} 
            locale={{ emptyText: intl.formatMessage({ id: "zimmetBilgileri.incoming.empty" }) }}
            style={{marginTop: 10}}
        />

        <NewAssetModal 
            open={assignModalOpen}
            close={() => setAssignModalOpen(false)}
preSelectedUserId={selectedRequest?.userId || selectedRequest?.UserId || selectedRequest?.requesterId || selectedRequest?.receiverUserId} 
            preSelectedUserName={selectedRequest?.userName || selectedRequest?.UserName}
            readOnlyReceiver={true}
            requestedProductId={selectedRequest?.productId ?? selectedRequest?.ProductId}
            requestedProductLabel={selectedRequest?.productLabel}
            messageSuccess={(msg) => { 
                message.success(msg); 
                onAssignSuccess(); 
            }} 
        />

      </Box>
    </LayoutWrapper>
  );
};

export default IncomingRequests;