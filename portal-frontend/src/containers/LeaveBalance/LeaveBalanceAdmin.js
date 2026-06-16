import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  InputNumber,
  message,
  Tag,
  Space,
  Input,
  Tooltip,
  Avatar,
  Typography,
  Calendar,
  Card,
} from "antd";
import {
  EditOutlined,
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
  SaveOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import tr_TR from "antd/lib/calendar/locale/tr_TR";
import moment from "moment";
import "moment/locale/tr";
import PageHeader from "@iso/components/utility/pageHeader";
import { useSelector } from "react-redux";
import { UserListe } from "../../Api/UserApi";
import {
  getAllUserPermissions,
  adminUpdateLeaveBalance,
  getAdminCalendarEvents,
} from "../../Api/PermissionApi";
import "./LeaveBalanceAdmin.css";
import { useIntl } from "react-intl";

const { Text } = Typography;
moment.locale("tr");

function unwrapList(apiBody) {
  if (!apiBody) return [];
  if (Array.isArray(apiBody)) return apiBody;
  if (apiBody.data != null && Array.isArray(apiBody.data)) return apiBody.data;
  if (apiBody.Data != null && Array.isArray(apiBody.Data)) return apiBody.Data;
  if (apiBody.data?.data && Array.isArray(apiBody.data.data)) return apiBody.data.data;
  return [];
}

function statusColor(st) {
  if (st === "Confirmed") return "green";
  if (st === "Declined") return "red";
  if (st === "Pending") return "gold";
  return "default";
}

/**
 * Admin izin bakiyesi: tablo + takvim (+ kalan izin modal).
 * Onay süreçleri sayfasında gömülü kullanım için LayoutWrapper içermez.
 */
export function LeaveBalanceAdminPanel() {
  const intl = useIntl();
  const { accessToken } = useSelector((state) => state.Auth);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [form] = Form.useForm();

  const [calMonth, setCalMonth] = useState(() => moment());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calLoading, setCalLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!accessToken) {
      setTableData([]);
      message.error(intl.formatMessage({ id: "leaveBalance.messages.sessionMissing" }));
      return;
    }

    setLoading(true);
    try {
      const [usersRes, permRes] = await Promise.all([
        UserListe(accessToken),
        getAllUserPermissions(),
      ]);

      const users = usersRes?.data?.data ?? usersRes?.data ?? [];
      const perms = unwrapList(permRes);

      const merged = users.map((user) => {
        const perm = perms.find(
          (p) => String(p.userId) === String(user.id)
        );
        const rem = perm?.remainingLeave ?? perm?.RemainingLeave ?? null;
        return {
          key: user.id,
          userId: user.id,
          userName: `${user.firstName ?? user.name ?? ""} ${
            user.lastName ?? user.surname ?? ""
          }`.trim(),
          email: user.email ?? "-",
          profileImage: user.profileImagePath ?? null,
          permissionId: perm?.id ?? null,
          totalLeave: perm?.totalLeave ?? perm?.TotalLeave ?? null,
          remainingLeave: rem,
          usedLeave: perm?.usedLeave ?? perm?.UsedLeave ?? null,
          thisYear: perm?.thisYear ?? perm?.ThisYear ?? null,
          year: perm?.year ?? perm?.Year ?? null,
        };
      });

      setTableData(merged);
    } catch (err) {
      console.error("Leave balance data load error:", err);
      const status = err?.response?.status;
      if (status === 401) {
        message.error(intl.formatMessage({ id: "leaveBalance.messages.sessionExpired" }));
      } else {
        message.error(intl.formatMessage({ id: "leaveBalance.messages.loadError" }));
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const loadCalendar = useCallback(async (m) => {
    setCalLoading(true);
    try {
      const res = await getAdminCalendarEvents(
        m.clone().startOf("month").toDate(),
        m.clone().endOf("month").toDate()
      );
      const list = unwrapList(res);
      setCalendarEvents(list);
    } catch (e) {
      message.error(intl.formatMessage({ id: "leaveBalance.messages.calendarLoadError" }));
      setCalendarEvents([]);
    } finally {
      setCalLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    loadCalendar(calMonth);
  }, [calMonth, loadCalendar]);

  const eventsByDay = useMemo(() => {
    const map = new Map();
    (calendarEvents || []).forEach((ev) => {
      const startM = moment(ev.startTime);
      const endM = moment(ev.endTime);
      if (!startM.isValid() || !endM.isValid()) return;
      const start = startM.clone().startOf("day");
      const end = endM.clone().startOf("day");
      let c = start.clone();
      for (let i = 0; i < 400 && c.isSameOrBefore(end); i++) {
        const k = c.format("YYYY-MM-DD");
        if (!map.has(k)) map.set(k, []);
        map.get(k).push(ev);
        c = c.add(1, "day");
      }
    });
    return map;
  }, [calendarEvents]);

  const filteredData = tableData.filter((row) => {
    const q = searchText.toLowerCase();
    return (
      (row.userName && row.userName.toLowerCase().includes(q)) ||
      (row.email && row.email.toLowerCase().includes(q))
    );
  });

  const openEditModal = (record) => {
    setEditingRow(record);
    form.setFieldsValue({ remainingLeave: record.remainingLeave ?? 0 });
    setModalOpen(true);
  };

  const handleSave = async (values) => {
    if (!editingRow?.permissionId) {
      message.warning(intl.formatMessage({ id: "leaveBalance.messages.noPermissionRecord" }));
      return;
    }
    setSaveLoading(true);
    try {
      const res = await adminUpdateLeaveBalance({
        id: editingRow.permissionId,
        userId: editingRow.userId,
        totalLeave: editingRow.totalLeave ?? 0,
        usedLeave: editingRow.usedLeave ?? 0,
        thisYear: editingRow.thisYear ?? 0,
        remainingLeave: values.remainingLeave,
        year: editingRow.year ?? new Date().getFullYear(),
      });
      if (res && res.success === false) {
        message.error(res?.message || intl.formatMessage({ id: "leaveBalance.messages.updateFailed" }));
        return;
      }
      message.success(
        intl.formatMessage({ id: "leaveBalance.messages.updatedForUser" }, { user: editingRow.userName })
      );
      setModalOpen(false);
      fetchData();
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || intl.formatMessage({ id: "leaveBalance.messages.unknownError" });
      message.error(`${intl.formatMessage({ id: "leaveBalance.messages.updatePrefix" })}: ${msg}`);
    } finally {
      setSaveLoading(false);
    }
  };

  const columns = [
    {
      title: intl.formatMessage({ id: "leaveBalance.table.employee" }),
      key: "user",
      width: 220,
      className: "lba-col-user",
      render: (_, record) => (
        <Space align="start" className="lba-user-space">
          <Avatar
            src={record.profileImage}
            icon={<UserOutlined />}
            className="lba-avatar"
          />
          <div className="lba-user-text">
            <div className="lba-username" title={record.userName || undefined}>
              {record.userName || intl.formatMessage({ id: "leaveBalance.common.dash" })}
            </div>
            <div className="lba-email" title={record.email || undefined}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: intl.formatMessage({ id: "leaveBalance.table.total" }),
      dataIndex: "totalLeave",
      key: "totalLeave",
      align: "center",
      width: 90,
      render: (val) =>
        val != null ? (
          <Tag className="lba-tag lba-tag-total">{val}</Tag>
        ) : (
          <Text type="secondary">—</Text>
        ),
      sorter: (a, b) => (a.totalLeave ?? -1) - (b.totalLeave ?? -1),
    },
    {
      title: intl.formatMessage({ id: "leaveBalance.table.used" }),
      dataIndex: "usedLeave",
      key: "usedLeave",
      align: "center",
      width: 100,
      render: (v) => (v != null ? <Text>{v}</Text> : <Text type="secondary">—</Text>),
    },
    {
      title: intl.formatMessage({ id: "leaveBalance.table.remaining" }),
      dataIndex: "remainingLeave",
      key: "remainingLeave",
      align: "center",
      width: 90,
      render: (val) => {
        if (val == null) return <Text type="secondary">—</Text>;
        const isNegative = val < 0;
        const isLow = val >= 0 && val <= 3;
        return (
          <Tag
            className={`lba-tag ${
              isNegative
                ? "lba-tag-negative"
                : isLow
                ? "lba-tag-low"
                : "lba-tag-ok"
            }`}
          >
            {val}
          </Tag>
        );
      },
      sorter: (a, b) => (a.remainingLeave ?? -999) - (b.remainingLeave ?? -999),
    },
    {
      title: intl.formatMessage({ id: "leaveBalance.table.thisYearEntitlement" }),
      dataIndex: "thisYear",
      key: "thisYear",
      align: "center",
      width: 100,
      render: (val) =>
        val != null ? (
          <span className="lba-year-label">
            <CalendarOutlined /> {val}
          </span>
        ) : (
          <Text type="secondary">—</Text>
        ),
    },
    {
      title: intl.formatMessage({ id: "leaveBalance.table.year" }),
      dataIndex: "year",
      key: "year",
      width: 70,
      align: "center",
      render: (y) => (y != null ? y : "—"),
    },
    {
      title: intl.formatMessage({ id: "leaveBalance.table.action" }),
      key: "action",
      align: "center",
      width: 110,
      render: (_, record) => (
        <Tooltip
          title={
            record.permissionId == null
              ? intl.formatMessage({ id: "leaveBalance.tooltips.noPermissionRecord" })
              : intl.formatMessage({ id: "leaveBalance.tooltips.editRemaining" })
          }
        >
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            className="lba-edit-btn"
            disabled={record.permissionId == null}
            onClick={() => openEditModal(record)}
          >
            {intl.formatMessage({ id: "leaveBalance.actions.edit" })}
          </Button>
        </Tooltip>
      ),
    },
  ];

  const onCalPanel = (d) => {
    setCalMonth(d);
  };

  const dateCellRender = (value) => {
    const k = value.format("YYYY-MM-DD");
    const list = eventsByDay.get(k) || [];
    if (list.length === 0) return null;
    return (
      <ul className="lba-cal-day-list">
        {list.slice(0, 4).map((ev) => (
          <li key={ev.permissionId} className="lba-cal-item" title={ev.userName + " — " + ev.permissionTypeName}>
            <span className="lba-cal-user">{ev.userName?.split(" ")[0] || "?"}</span>{" "}
            <Tag className="lba-cal-pill" color={statusColor(ev.status)}>
              {ev.permissionTypeName}
            </Tag>
          </li>
        ))}
        {list.length > 4 && (
          <li className="lba-cal-more">{intl.formatMessage({ id: "leaveBalance.calendar.more" }, { count: list.length - 4 })}</li>
        )}
      </ul>
    );
  };

  return (
    <>
      <div className="lba-header-row">
        <PageHeader>{intl.formatMessage({ id: "leaveBalance.pageTitle" })}</PageHeader>
        <div className="lba-actions">
          <Input
            prefix={<SearchOutlined />}
            placeholder={intl.formatMessage({ id: "leaveBalance.searchPlaceholder" })}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="lba-search"
            allowClear
          />
          <Tooltip title={intl.formatMessage({ id: "leaveBalance.actions.refresh" })}>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchData}
              loading={loading}
              className="lba-refresh-btn"
            />
          </Tooltip>
        </div>
      </div>

      <div className="lba-table-wrapper">
        <Table
          className="lba-table"
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          rowClassName={(record) =>
            record.remainingLeave < 0 ? "lba-row-negative" : ""
          }
          scroll={{ x: 860 }}
          locale={{ emptyText: intl.formatMessage({ id: "leaveBalance.empty.noRecords" }) }}
          size="middle"
        />
      </div>

      <Card
        className="lba-cal-card"
        title={
          <span>
            <CalendarOutlined /> {intl.formatMessage({ id: "leaveBalance.calendar.monthlyTitle" })}
          </span>
        }
        extra={
          <Button size="small" onClick={() => loadCalendar(calMonth)} loading={calLoading}>
            {intl.formatMessage({ id: "leaveBalance.actions.refreshCalendar" })}
          </Button>
        }
      >
        {calLoading && <div className="lba-cal-skel">{intl.formatMessage({ id: "leaveBalance.common.loading" })}</div>}
        <Calendar
          className="lba-calendar"
          value={calMonth}
          onPanelChange={onCalPanel}
          locale={tr_TR}
          dateCellRender={dateCellRender}
        />
      </Card>

      <Modal
        title={
          <div className="lba-modal-title">
            <EditOutlined className="lba-modal-icon" />
            {intl.formatMessage({ id: "leaveBalance.modal.title" })}
          </div>
        }
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
        width={520}
        className="lba-modal"
      >
        {editingRow && (
          <div className="lba-modal-user-info">
            <Avatar
              src={editingRow.profileImage}
              icon={<UserOutlined />}
              size={40}
            />
            <div>
              <div className="lba-modal-username">{editingRow.userName}</div>
              <div className="lba-modal-email">{editingRow.email}</div>
            </div>
          </div>
        )}

        {editingRow && (
          <div className="lba-info-grid">
            <div>
              <span className="lba-info-l">{intl.formatMessage({ id: "leaveBalance.info.totalLeave" })}</span>
              <b>{editingRow.totalLeave ?? "—"}</b>
            </div>
            <div>
              <span className="lba-info-l">{intl.formatMessage({ id: "leaveBalance.info.used" })}</span>
              <b>{editingRow.usedLeave ?? "—"}</b>
            </div>
            <div>
              <span className="lba-info-l">{intl.formatMessage({ id: "leaveBalance.info.remaining" })}</span>
              <b>{editingRow.remainingLeave ?? "—"}</b>
             </div>
            <div>
              <span className="lba-info-l">{intl.formatMessage({ id: "leaveBalance.info.thisYearEntitlement" })}</span>
              <b>{editingRow.thisYear ?? "—"}</b>
            </div>
            <div>
              <span className="lba-info-l">{intl.formatMessage({ id: "leaveBalance.info.recordYear" })}</span>
              <b>{editingRow.year ?? "—"}</b>
            </div>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="lba-form"
        >
          <Form.Item
            name="remainingLeave"
            label={intl.formatMessage({ id: "leaveBalance.form.remainingDays" })}
            rules={[{ required: true, message: intl.formatMessage({ id: "leaveBalance.form.enterValue" }) }]}
            extra={intl.formatMessage({ id: "leaveBalance.form.extraInfo" })}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={-365}
              step={0.5}
              precision={1}
              className="lba-number-input"
              placeholder={intl.formatMessage({ id: "leaveBalance.form.zeroPlaceholder" })}
            />
          </Form.Item>

          <div className="lba-modal-footer">
            <Button onClick={() => setModalOpen(false)}>{intl.formatMessage({ id: "leaveBalance.common.cancel" })}</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={saveLoading}
              icon={<SaveOutlined />}
              className="lba-save-btn"
            >
              {intl.formatMessage({ id: "leaveBalance.common.save" })}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
