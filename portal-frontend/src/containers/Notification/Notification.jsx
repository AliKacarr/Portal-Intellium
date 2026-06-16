import React, { useState, useEffect, useCallback } from "react";
import { List, Avatar, Button, message, Popconfirm, Skeleton, Typography, Tooltip, Badge } from "antd";
import {
  CheckOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
  RadarChartOutlined,
  ProjectOutlined,
  FieldTimeOutlined,
  AlertOutlined,
  FileDoneOutlined,
  ScheduleOutlined,
  MedicineBoxOutlined,
  AuditOutlined,
  CodeSandboxOutlined,
  AppstoreOutlined,
  DollarOutlined,
  ReadOutlined,
  NotificationOutlined,
  PieChartOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { useIntl } from "react-intl";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  deleteAllNotifications,
  deleteNotification,
  getNotificationsByUser,
  MarkAsReadNotification,
} from "../../Api/NotificationApi";
import {
  getNotificationDisplayBody,
  getNotificationDisplayTitle,
  normalizeNotificationItem,
  parseNotificationsListFromResponse,
  parseNotificationsPageMeta,
} from "../../utils/notificationDto";
import {
  applyMomentLocale,
  getNotificationTargetPath,
  notificationFromNow,
  notificationTooltipTime,
  useNotificationTimeRefresh,
} from "../../helpers/notificationUtils";

const notificationTypes = {
  military: { icon: <RadarChartOutlined />, color: "#1890ff" },
  project: { icon: <ProjectOutlined />, color: "#722ed1" },
  time: { icon: <FieldTimeOutlined />, color: "#13c2c2" },
  alert: { icon: <AlertOutlined />, color: "#f5222d" },
  birthday: { icon: <AlertOutlined />, color: "#faad14" },
  ticket: { icon: <FileDoneOutlined />, color: "#52c41a" },
  permission: { icon: <ScheduleOutlined />, color: "#fa541c" },
  health: { icon: <MedicineBoxOutlined />, color: "#eb2f96" },
  insurance: { icon: <AuditOutlined />, color: "#2f54eb" },
  debit: { icon: <CodeSandboxOutlined />, color: "#722ed1" },
  scrumtask: { icon: <AppstoreOutlined />, color: "#fa8c16" },
  expense: { icon: <DollarOutlined />, color: "#2f89d9" },
  expensereminder: { icon: <DollarOutlined />, color: "#2f89d9" },
  expensereminder_admin: { icon: <DollarOutlined />, color: "#2f89d9" },
  expenserequest: { icon: <DollarOutlined />, color: "#2f89d9" },
  expense_revision_requested: { icon: <WarningOutlined />, color: "#f59e0b" },
  expense_rejected: { icon: <CloseCircleOutlined />, color: "#ef4444" },
  expense_approved: { icon: <CheckCircleOutlined />, color: "#22c55e" },
  news: { icon: <ReadOutlined />, color: "#13c2c2" },
  news_comment: { icon: <ReadOutlined />, color: "#08979c" },
  announcement: { icon: <NotificationOutlined />, color: "#d4380d" },
  poll: { icon: <PieChartOutlined />, color: "#531dab" },
  defaultType: { icon: <AlertOutlined />, color: "#d9d9d9" },
};

const NotificationContainer = styled.div`
  margin: auto;
  background: #fff;
  padding: 20px 100px;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
`;

const NotificationItem = styled(List.Item)`
  transition: all 0.3s ease;
  border-bottom: 1px solid #f0f0f0;
  padding: 15px;
  cursor: pointer;
  &:hover {
    background: #f9f9f9;
    transform: translateY(-2px);
  }
`;

const TimeText = styled(Typography.Text)`
  color: #888;
  font-size: 12px;
  margin-top: 5px;
  display: block;
`;

const LoadMoreWrapper = styled.div`
  text-align: center;
  margin-top: 10px;
`;

const ActionButton = styled(Button)`
  padding: 0;
  border: none;
  background: none;
  display: flex;
  align-items: center;
`;

function Notification() {
  const intl = useIntl();
  const history = useHistory();
  const accessToken = useSelector((state) => state?.Auth?.accessToken);

  useEffect(() => {
    applyMomentLocale(intl.locale);
  }, [intl.locale]);

  useNotificationTimeRefresh(30000);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({});
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);

  const getNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getNotificationsByUser(pageNumber, 10, accessToken);
      const rawList = parseNotificationsListFromResponse(response);
      const list = rawList.map(normalizeNotificationItem);
      setNotifications((prev) => (pageNumber === 1 ? list : [...prev, ...list]));
      setPagination(parseNotificationsPageMeta(response));
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [pageNumber, accessToken]);

  useEffect(() => {
    getNotifications();
  }, [getNotifications]);

  const onLoadMore = () => {
    if (pagination.pageNumber < pagination.totalPages) {
      setPageNumber((prev) => prev + 1);
    }
  };

  const markAsRead = useCallback(async (e, notificationId) => {
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId || n.Id === notificationId ? { ...n, isChecked: true } : n))
    );
    try {
      await MarkAsReadNotification(notificationId, accessToken);
    } catch {
      /* ignore */
    }
  }, [accessToken]);

  const reloadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getNotificationsByUser(1, 10, accessToken);
      const rawList = parseNotificationsListFromResponse(response);
      const list = rawList.map(normalizeNotificationItem);
      setNotifications(list);
      setPagination(parseNotificationsPageMeta(response));
      setPageNumber(1);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const handleDeleteOne = async (notificationId) => {
    if (!notificationId) return;
    try {
      await deleteNotification(notificationId, accessToken);
      setNotifications((prev) => prev.filter((n) => (n.id ?? n.Id) !== notificationId));
      message.success(intl.formatMessage({ id: "notification.messages.deleted" }));
    } catch (err) {
      message.error(
        err?.response?.status === 404
          ? intl.formatMessage({ id: "notification.messages.deleteNotSupported" })
          : intl.formatMessage({ id: "notification.messages.deleteFailed" })
      );
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotifications(accessToken);
      await reloadFirstPage();
      message.success(intl.formatMessage({ id: "notification.messages.clearedAll" }));
    } catch (err) {
      message.error(
        err?.response?.status === 404
          ? intl.formatMessage({ id: "notification.messages.bulkDeleteNotSupported" })
          : intl.formatMessage({ id: "notification.messages.bulkDeleteFailed" })
      );
    }
  };

  const openNotificationTarget = useCallback(
    async (notification) => {
      const id = notification.id ?? notification.Id;
      if (id && !notification.isChecked) {
        try {
          await MarkAsReadNotification(id, accessToken);
          setNotifications((prev) =>
            prev.map((n) => ((n.id ?? n.Id) === id ? { ...n, isChecked: true } : n))
          );
        } catch {
          /* ignore */
        }
      }
      history.push(getNotificationTargetPath(notification));
    },
    [history, accessToken]
  );

  const loadMore =
    pagination.pageNumber < pagination.totalPages ? (
      <LoadMoreWrapper>
        <button
          type="button"
          onClick={onLoadMore}
          disabled={loading}
          style={{
            padding: "10px 15px",
            border: "1px solid #1890ff",
            borderRadius: "5px",
            background: "none",
            color: "#1890ff",
            cursor: "pointer",
          }}
        >
          {intl.formatMessage({ id: "notification.actions.loadMore" })}
        </button>
      </LoadMoreWrapper>
    ) : null;

  return (
    <NotificationContainer>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Typography.Title level={3} style={{ margin: 0 }}>
          {intl.formatMessage({ id: "notification.title" })}
        </Typography.Title>
        {notifications.length > 0 ? (
          <Popconfirm
            title={intl.formatMessage({ id: "notification.confirm.clearAllTitle" })}
            okText={intl.formatMessage({ id: "notification.common.yes" })}
            cancelText={intl.formatMessage({ id: "notification.common.cancel" })}
            onConfirm={handleDeleteAll}
          >
            <Button type="default" danger>
              {intl.formatMessage({ id: "notification.actions.clearAll" })}
            </Button>
          </Popconfirm>
        ) : null}
      </div>

      <List
        loading={loading && pageNumber === 1}
        itemLayout="horizontal"
        loadMore={loadMore}
        dataSource={notifications}
        renderItem={(notification) => {
          const typeKey =
            typeof notification.type === "string"
              ? notification.type.trim().toLowerCase()
              : String(notification.type || "").toLowerCase();
          const { icon, color } =
            notificationTypes[typeKey] || notificationTypes.defaultType;
          const created =
            notification.createdDate ?? notification.createdAt ?? notification.CreatedAt;

          return (
            <NotificationItem
              role="button"
              tabIndex={0}
              onClick={() => void openNotificationTarget(notification)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  void openNotificationTarget(notification);
                }
              }}
              actions={[
                <Tooltip
                  title={
                    notification.isChecked
                      ? intl.formatMessage({ id: "notification.tooltips.read" })
                      : intl.formatMessage({ id: "notification.tooltips.markAsRead" })
                  }
                  key="mark-read"
                >
                  <ActionButton
                    type="text"
                    onClick={
                      !notification.isChecked
                        ? (e) => markAsRead(e, notification.id ?? notification.Id)
                        : undefined
                    }
                    icon={
                      <CheckOutlined
                        style={{
                          color: notification.isChecked ? "#52c41a" : "#1890ff",
                          fontSize: "20px",
                        }}
                      />
                    }
                  />
                </Tooltip>,
                <Popconfirm
                  key="delete"
                  title={intl.formatMessage({ id: "notification.confirm.deleteOneTitle" })}
                  okText={intl.formatMessage({ id: "notification.actions.delete" })}
                  cancelText={intl.formatMessage({ id: "notification.common.cancel" })}
                  onConfirm={() => handleDeleteOne(notification.id ?? notification.Id)}
                >
                  <Tooltip title={intl.formatMessage({ id: "notification.actions.delete" })}>
                    <ActionButton
                      type="text"
                      icon={<DeleteOutlined style={{ color: "#ff4d4f", fontSize: "18px" }} />}
                    />
                  </Tooltip>
                </Popconfirm>,
              ]}
            >
              <Skeleton avatar title={false} loading={loading && pageNumber === 1} active>
                <List.Item.Meta
                  avatar={
                    <Badge dot={!notification.isChecked} offset={[-2, 2]} color="red">
                      <Avatar size={40} style={{ backgroundColor: color, marginLeft: 10, marginTop: 5 }}>
                        {icon}
                      </Avatar>
                    </Badge>
                  }
                  title={
                    <Typography.Text>{getNotificationDisplayTitle(notification)}</Typography.Text>
                  }
                  description={
                    <Typography.Text style={{ color: "#777" }}>
                      {getNotificationDisplayBody(notification)}
                    </Typography.Text>
                  }
                />
              </Skeleton>
              <Tooltip title={notificationTooltipTime(created, intl.locale)}>
                <TimeText>{notificationFromNow(created, intl.locale)}</TimeText>
              </Tooltip>
            </NotificationItem>
          );
        }}
      />
    </NotificationContainer>
  );
}

export default Notification;
