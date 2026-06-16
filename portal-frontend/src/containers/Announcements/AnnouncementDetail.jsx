import React, { useEffect, useState, useMemo } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import {
  Breadcrumb,
  Button,
  Empty,
  Spin,
  Tag,
  message,
  Avatar,
  Modal,
  List,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/tr";
import "moment/locale/en-gb";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PortalContentView from "@iso/components/Custom/PortalContentEditor/PortalContentView";
import IntlMessages from "@iso/components/utility/intlMessages";
import { Box, AnnouncementDetailWrapper } from "./announcement-style";
import {
  GetAnnouncementById,
  GetAnnouncementViewers,
} from "../../Api/AnnouncementApi";

const ADMIN_WORKER_ROLES = ["admin", "worker"];

const AnnouncementDetail = () => {
  const intl = useIntl();
  const { id } = useParams();
  const history = useHistory();
  const userRole = useSelector((state) => state.Auth.role?.roleName);
  const isAdminOrWorker = ADMIN_WORKER_ROLES.includes(userRole);

  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewersModalVisible, setViewersModalVisible] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [viewersLoading, setViewersLoading] = useState(false);

  const priorityConfig = useMemo(
    () => ({
      high: {
        label: intl.formatMessage({ id: "announcements.priority.high" }),
        color: "red",
        icon: <ExclamationCircleOutlined />,
      },
      medium: {
        label: intl.formatMessage({ id: "announcements.priority.medium" }),
        color: "orange",
        icon: null,
      },
      low: {
        label: intl.formatMessage({ id: "announcements.priority.low" }),
        color: "green",
        icon: null,
      },
    }),
    [intl]
  );

  useEffect(() => {
    moment.locale(intl.locale?.toLowerCase().startsWith("tr") ? "tr" : "en");
  }, [intl.locale]);

  useEffect(() => {
    fetchAnnouncement();
  }, [id]);

  const fetchAnnouncement = async () => {
    setLoading(true);
    try {
      const response = await GetAnnouncementById(id);
      setAnnouncement(response.data.data);
    } catch {
      message.error("Duyuru yüklenirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const fetchViewers = async () => {
    setViewersLoading(true);
    setViewersModalVisible(true);
    try {
      const response = await GetAnnouncementViewers(id);
      setViewersList(response.data.data || []);
    } catch {
      message.error("Görüntüleyenler yüklenirken hata oluştu.");
    } finally {
      setViewersLoading(false);
    }
  };

  const isExpired = (expiryDate) =>
    moment(expiryDate).endOf("day").isBefore(moment());

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>
            <span
              style={{ cursor: "pointer", color: "#1890ff" }}
              onClick={() => history.push("/dashboard/announcements")}
            >
              <IntlMessages id="sidebar.announcements" />
            </span>
          </Breadcrumb.Item>
          {announcement && <Breadcrumb.Item>{announcement.title}</Breadcrumb.Item>}
        </Breadcrumb>

        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => history.push("/dashboard/announcements")}
          style={{ marginBottom: 16 }}
        >
          {intl.formatMessage({ id: "news.detail.back" })}
        </Button>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Spin size="large" />
          </div>
        ) : !announcement ? (
          <Empty description="Duyuru bulunamadı." style={{ padding: "60px 0" }} />
        ) : (
          <AnnouncementDetailWrapper priority={announcement.priority}>
            <div className="announcement-detail-title">
              {priorityConfig[announcement.priority]?.icon && (
                <span
                  style={{
                    marginRight: 8,
                    color: announcement.priority === "high" ? "#ff4d4f" : "#faad14",
                  }}
                >
                  {priorityConfig[announcement.priority].icon}
                </span>
              )}
              {announcement.title}
              {isExpired(announcement.expiryDate) && (
                <Tag color="default" style={{ marginLeft: 12, fontSize: 12, verticalAlign: "middle" }}>
                  {intl.formatMessage({ id: "announcements.tag.expired" })}
                </Tag>
              )}
              {!isExpired(announcement.expiryDate) && announcement.isActive && (
                <Tag color="success" style={{ marginLeft: 12, fontSize: 12, verticalAlign: "middle" }}>
                  <CheckCircleOutlined style={{ marginRight: 3 }} />
                  {intl.formatMessage({ id: "announcements.tag.active" })}
                </Tag>
              )}
            </div>

            <div className="announcement-detail-meta">
              {isAdminOrWorker && (
                <span>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {announcement.createdByName}
                </span>
              )}
              <span>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {intl.formatMessage({ id: "announcements.meta.expires" })}{" "}
                {moment(announcement.expiryDate).format("DD MMMM YYYY")}
              </span>
              {isAdminOrWorker && (
                <span
                  onClick={fetchViewers}
                  style={{ cursor: "pointer", color: "#1890ff" }}
                  title="Görüntüleyenleri Gör"
                >
                  <EyeOutlined style={{ marginRight: 4 }} />
                  {intl.formatMessage({ id: "news.detail.views" }, { count: announcement.viewCount })}
                </span>
              )}
              <Tag
                color={priorityConfig[announcement.priority]?.color || "green"}
              >
                {priorityConfig[announcement.priority]?.label}
              </Tag>
              {announcement.departmentName && (
                <Tag color="geekblue">{announcement.departmentName}</Tag>
              )}
              {announcement.isGeneral && (
                <Tag color="purple">
                  {intl.formatMessage({ id: "announcements.tag.general" })}
                </Tag>
              )}
            </div>

            <PortalContentView content={announcement.content} className="announcement-detail-content" />
          </AnnouncementDetailWrapper>
        )}

        <Modal
          title="Görüntüleyenler"
          open={viewersModalVisible}
          onCancel={() => setViewersModalVisible(false)}
          footer={null}
          destroyOnClose
        >
          <List
            loading={viewersLoading}
            itemLayout="horizontal"
            dataSource={viewersList}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={item.userName}
                  description={moment(item.viewedAt).format("DD.MM.YYYY HH:mm")}
                />
              </List.Item>
            )}
            locale={{ emptyText: "Henüz görüntüleyen yok." }}
          />
        </Modal>
      </Box>
    </LayoutWrapper>
  );
};

export default AnnouncementDetail;
