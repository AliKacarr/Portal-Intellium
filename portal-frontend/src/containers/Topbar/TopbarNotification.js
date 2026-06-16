import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useIntl } from "react-intl";
import { Avatar, Badge, message, Popconfirm, Popover } from "antd";
import { useSelector } from "react-redux";
import TopbarDropdownWrapper from "./TopbarDropdown.styles";
import {
  deleteAllNotifications,
  deleteNotification,
  getNotificationsByUser,
  MarkAsReadNotification,
} from "../../Api/NotificationApi";
import { ArrowsAltOutlined, DeleteOutlined } from "@ant-design/icons";
import { Link, useHistory } from "react-router-dom";
import {
  applyMomentLocale,
  notificationFromNow,
  notificationTooltipTime,
  useNotificationTimeRefresh,
} from "../../helpers/notificationUtils";
import {
  RadarChartOutlined,
  ProjectOutlined,
  FieldTimeOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
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

import {
  getNotificationDisplayBody,
  getNotificationDisplayTitle,
  normalizeNotificationItem,
  parseNotificationsListFromResponse,
} from "../../utils/notificationDto";
import { getNotificationTargetPath } from "../../helpers/notificationUtils";

export default function TopbarNotification() {
  const intl = useIntl();

  useEffect(() => {
    applyMomentLocale(intl.locale);
  }, [intl.locale]);

  useNotificationTimeRefresh(30000);

  const [notifications, setNotifications] = useState([]);
  const [badgeCount, setBadgeCount] = useState(0);
  const [isPopoverOpen, setVisibility] = useState(false);

  const history = useHistory();

  const customizedTheme = useSelector((state) => state.ThemeSwitcher.topbarTheme);
  const accessToken = useSelector((state) => state?.Auth?.accessToken);

  const notificationTypes = useMemo(
    () => ({
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
      expense_revision_requested: { icon: <ExclamationCircleOutlined />, color: "#f59e0b" },
      expense_rejected: { icon: <CloseCircleOutlined />, color: "#ef4444" },
      expense_approved: { icon: <CheckCircleOutlined />, color: "#22c55e" },
      news: { icon: <ReadOutlined />, color: "#13c2c2" },
      news_comment: { icon: <ReadOutlined />, color: "#08979c" },
      announcement: { icon: <NotificationOutlined />, color: "#d4380d" },
      poll: { icon: <PieChartOutlined />, color: "#531dab" },
      defaultType: { icon: <AlertOutlined />, color: "#d9d9d9" },
    }),
    []
  );

  function handleOpenChange(newOpen) {
    setVisibility(newOpen);
    if (newOpen) {
      getNotifications();
    }
  }

  const mountedRef = useRef(true);

  const getNotifications = useCallback(async () => {
    try {
      const res = await getNotificationsByUser(1, 10, accessToken);
      if (!mountedRef.current) return;
      const rawList = parseNotificationsListFromResponse(res);
      const list = rawList.map(normalizeNotificationItem);
      setNotifications(list);
      const uncheckedCount = list.filter((n) => !n?.isChecked).length;
      setBadgeCount(uncheckedCount);
    } catch (error) {
      if (!mountedRef.current) return;
      setNotifications([]);
      setBadgeCount(0);
    }
  }, [accessToken]);

  useEffect(() => {
    mountedRef.current = true;
    getNotifications();

    const interval = setInterval(() => {
      getNotifications();
    }, 15000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [getNotifications]);

  const handleNotificationClick = async (notification) => {
    const id = notification?.id ?? notification?.Id;
    if (id && !notification.isChecked) {
      try {
        await MarkAsReadNotification(id, accessToken);
        setNotifications((prev) =>
          prev.map((n) => ((n?.id ?? n?.Id) === id ? { ...n, isChecked: true } : n))
        );
        setBadgeCount((c) => Math.max(0, c - 1));
      } catch {
        /* okunmadı olarak kalabilir */
      }
    }

    setVisibility(false);
    history.push(getNotificationTargetPath(notification));
  };

  const handleDeleteOne = async (e, notification) => {
    e?.stopPropagation?.();
    const id = notification?.id ?? notification?.Id;
    if (!id) return;
    try {
      await deleteNotification(id, accessToken);
      await getNotifications();
      message.success(intl.formatMessage({ id: "topbar.notification.deleteSuccess" }));
    } catch (err) {
      message.error(
        err?.response?.status === 404
          ? intl.formatMessage({ id: "topbar.notification.deleteNotFound" })
          : intl.formatMessage({ id: "topbar.notification.deleteError" })
      );
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAllNotifications(accessToken);
      await getNotifications();
      message.success(intl.formatMessage({ id: "topbar.notification.clearAllSuccess" }));
    } catch (err) {
      message.error(
        err?.response?.status === 404
          ? intl.formatMessage({ id: "topbar.notification.clearAllNotFound" })
          : intl.formatMessage({ id: "topbar.notification.clearAllError" })
      );
    }
  };

  const content = (
    <TopbarDropdownWrapper className="topbarNotification topbar-notification-panel isoDropdownWrapper">
      <div className="topbar-notification-panel__header">
        <h3 className="topbar-notification-panel__title">
          {intl.formatMessage({ id: "topbar.notification.panelTitle" })}
        </h3>
        <div className="topbar-notification-panel__headerRight">
          {notifications.length > 0 ? (
            <Popconfirm
              title={intl.formatMessage({ id: "topbar.notification.confirmDeleteAll" })}
              okText={intl.formatMessage({ id: "topbar.notification.okYes" })}
              cancelText={intl.formatMessage({ id: "topbar.notification.cancel" })}
              onConfirm={handleDeleteAll}
              placement="bottomRight"
            >
              <button type="button" className="topbar-notification-panel__clearAll">
                {intl.formatMessage({ id: "topbar.notification.clearAll" })}
              </button>
            </Popconfirm>
          ) : null}
          <Link
            className="topbar-notification-panel__seeAll"
            to="/dashboard/notification"
            title={intl.formatMessage({ id: "topbar.notification.seeAllTitle" })}
            aria-label={intl.formatMessage({ id: "topbar.notification.seeAllTitle" })}
          >
            <ArrowsAltOutlined className="isoViewAllBtnIcon" />
          </Link>
        </div>
      </div>
      <div className="topbar-notification-panel__body">
        {notifications && notifications.length > 0 ? (
          notifications.map((notification) => {
            const typeKey =
              typeof notification.type === "string"
                ? notification.type.trim().toLowerCase()
                : String(notification.type || "").toLowerCase();
            const { icon, color } =
              notificationTypes[typeKey] || notificationTypes.defaultType;

            return (
              <div
                className="topbar-notification-item"
                key={notification.id ?? notification.Id ?? `n-${notification.createdDate}`}
                style={{
                  backgroundColor: notification.isChecked ? "#fafafa" : "transparent",
                }}
              >
                <div className="topbar-notification-item__avatar">
                  <Badge dot={!notification.isChecked} offset={[-2, 2]} color="red">
                    <Avatar size={36} style={{ backgroundColor: color }}>
                      {icon}
                    </Avatar>
                  </Badge>
                </div>
                <button
                  type="button"
                  className="topbar-notification-item__main"
                  onClick={() => void handleNotificationClick(notification)}
                >
                  <div className="topbar-notification-item__row1">
                    <span className="topbar-notification-item__title">
                      {getNotificationDisplayTitle(notification)}
                    </span>
                    <span
                      className="topbar-notification-item__time"
                      title={notificationTooltipTime(
                        notification.createdDate ?? notification.createdAt,
                        intl.locale
                      )}
                    >
                      {notificationFromNow(
                        notification.createdDate ?? notification.createdAt,
                        intl.locale
                      )}
                    </span>
                  </div>
                  <p className="topbar-notification-item__snippet">
                    {getNotificationDisplayBody(notification)}
                  </p>
                </button>
                <Popconfirm
                  title={intl.formatMessage({ id: "topbar.notification.confirmDeleteOne" })}
                  okText={intl.formatMessage({ id: "topbar.notification.okDelete" })}
                  cancelText={intl.formatMessage({ id: "topbar.notification.cancel" })}
                  onConfirm={() => handleDeleteOne(null, notification)}
                  placement="leftTop"
                >
                  <button
                    type="button"
                    className="topbar-notification-item__delete"
                    aria-label={intl.formatMessage({ id: "topbar.notification.ariaDelete" })}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DeleteOutlined />
                  </button>
                </Popconfirm>
              </div>
            );
          })
        ) : (
          <div style={{ padding: "24px 16px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
            {intl.formatMessage({ id: "topbar.notification.empty" })}
          </div>
        )}
      </div>
    </TopbarDropdownWrapper>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={isPopoverOpen}
      onOpenChange={handleOpenChange}
      placement="bottomLeft"
      overlayStyle={{ maxWidth: 400 }}
      overlayInnerStyle={{ padding: 0 }}
    >
      <div className="isoIconWrapper">
        <i className="ion-android-notifications" style={{ color: customizedTheme.textColor }} />
        {badgeCount > 0 && <span>{badgeCount >= 10 ? "10+" : badgeCount}</span>}
      </div>
    </Popover>
  );
}
