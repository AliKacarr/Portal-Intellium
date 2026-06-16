import React, { useState, useEffect, useMemo } from "react";
import { useIntl } from "react-intl";
import { Table, Button, Space, Tooltip, Badge, Breadcrumb } from "antd";
import { 
  EditOutlined, 
  ArrowLeftOutlined 
} from "@ant-design/icons"; // SyncOutlined kaldırıldı
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import Box from "@iso/components/utility/box";
import PageHeader from "@iso/components/utility/pageHeader";
import { useHistory } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import { host } from "../../Api/host";
import moment from "moment";

// Bileşenler
import EditRequestModal from "./Components/EditRequestModal";
import "./customStyles.css";

const MyRequests = () => {
  const intl = useIntl();
  const history = useHistory();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const { id: currentUserId, accessToken } = useSelector((state) => state.Auth);
  const token = accessToken || localStorage.getItem("token");

  const axiosAuth = useMemo(() => axios.create({
      baseURL: host,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }), [token]);

  const fetchMyRequests = async () => {
    setLoading(true);
    try {
      const res = await axiosAuth.get("/api/DebitRequest/getall");
      if (res.data.success) {
        const myData = res.data.data.filter(r => r.userId === currentUserId);
        myData.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
        setRequests(myData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUserId) return undefined;
    fetchMyRequests();
    const onRefresh = () => fetchMyRequests();
    window.addEventListener("debit-requests:refresh", onRefresh);
    return () => window.removeEventListener("debit-requests:refresh", onRefresh);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- load when user id available
  }, [currentUserId]);

  const columns = [
    { 
        title: intl.formatMessage({ id: "zimmetBilgilerim.myRequests.colProduct" }), 
        dataIndex: "productLabel", 
        key: "productLabel",
        width: 260,
        render: (_, r) => (
          <span style={{ fontWeight: 600, color: "#444" }}>
            {r?.productLabel || r?.category}
          </span>
        )
    },
    { 
        title: intl.formatMessage({ id: "zimmetBilgilerim.myRequests.colDescription" }), 
        dataIndex: "description", 
        key: "description",
    },
    { 
        title: intl.formatMessage({ id: "zimmetBilgilerim.myRequests.colStatus" }), 
        dataIndex: "status", 
        key: "status",
        width: 120,
        render: (status, record) => {
            const rk = String(record?.requestKind ?? record?.RequestKind ?? "").toLowerCase();
            if (rk === "return" && status === "Bekliyor") {
              return (
                <Badge
                  status="processing"
                  text={intl.formatMessage({ id: "zimmetBilgilerim.status.returnRequest" })}
                />
              );
            }
            if (status === "Bekliyor") return <Badge status="processing" text={intl.formatMessage({ id: "zimmetBilgilerim.status.pending" })} />;
            if (status === "Teslim Bekleniyor") return <Badge status="warning" text={intl.formatMessage({ id: "zimmetBilgilerim.status.awaitingDelivery" })} />;
            if (status === "Teslim Alındı") return <Badge status="success" text={intl.formatMessage({ id: "zimmetBilgilerim.status.delivered" })} />;
            if (status === "Onaylandı") return <Badge status="success" text={intl.formatMessage({ id: "zimmetBilgilerim.status.approved" })} />;
            if (status === "Reddedildi") return <Badge status="error" text={intl.formatMessage({ id: "zimmetBilgilerim.status.rejected" })} />;
            if (status === "Stok Bekliyor") return <Badge status="warning" text={intl.formatMessage({ id: "zimmetBilgilerim.status.outOfStock" })} />;
            if (status === "Envanter Bekliyor") return <Badge status="warning" text={intl.formatMessage({ id: "zimmetBilgilerim.status.newProductRequest" })} />;
            return status;
        }
    },
    { 
        title: intl.formatMessage({ id: "zimmetBilgilerim.myRequests.colDate" }), 
        dataIndex: "requestDate", 
        width: 120,
        render: d => moment(d).format("DD.MM.YYYY") 
    },
    {
      title: intl.formatMessage({ id: "zimmetBilgilerim.myRequests.colAction" }),
      key: "action",
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Space>
            {record.status === "Bekliyor" && String(record?.requestKind ?? record?.RequestKind ?? "").toLowerCase() !== "return" ? (
                <div
                  className="zimmet-action-slot"
                  style={{
                    width: 40,
                    minHeight: 32,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Tooltip title={intl.formatMessage({ id: "zimmetBilgilerim.myRequests.tooltipEdit" })}>
                      <Button 
                          icon={<EditOutlined />} 
                          size="small" 
                          onClick={() => {
                              setSelectedRequest(record);
                              setEditModalOpen(true);
                          }}
                      />
                  </Tooltip>
                </div>
            ) : (
                <span style={{fontSize:'12px', color:'#999'}}>-</span>
            )}
        </Space>
      )
    }
  ];

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "zimmetBilgilerim.breadcrumb.root" })}</Breadcrumb.Item>
          <Breadcrumb.Item>{intl.formatMessage({ id: "zimmetBilgilerim.breadcrumb.requests" })}</Breadcrumb.Item>
        </Breadcrumb>

        <PageHeader>
          {intl.formatMessage({ id: "zimmetBilgilerim.requestsPageTitle" })}
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
            onClick={() => history.push("/dashboard/my-assets")}
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
            {intl.formatMessage({ id: "zimmetBilgilerim.backToAssets" })}
          </Button>
        </div>

        <Table
            className="zimmet-assets-table"
            dataSource={requests} 
            columns={columns} 
            rowKey="id" 
            loading={loading} 
            pagination={{pageSize: 10}}
            locale={{ emptyText: intl.formatMessage({ id: "zimmetBilgilerim.myRequests.empty" }) }}
            style={{marginTop: 10}}
        />

        <EditRequestModal 
            open={editModalOpen}
            close={() => setEditModalOpen(false)}
            request={selectedRequest}
            refreshData={fetchMyRequests}
        />

      </Box>
    </LayoutWrapper>
  );
};

export default MyRequests;