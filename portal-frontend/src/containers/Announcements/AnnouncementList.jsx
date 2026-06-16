import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useHistory } from "react-router-dom";
import { useIntl } from "react-intl";
import {
  Breadcrumb,
  Tag,
  Empty,
  Spin,
  Popconfirm,
  message,
  Tooltip,
  Input,
  Select,
  DatePicker,
  Button,
} from "antd";
import {
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/tr";
import "moment/locale/en-gb";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import IntlMessages from "@iso/components/utility/intlMessages";
import { Box, AnnouncementCard } from "./announcement-style";
import AddAnnouncement from "./AddAnnouncement";
import EditAnnouncement from "./EditAnnouncement";
import {
  GetAllAnnouncements,
  GetActiveAnnouncements,
  DeleteAnnouncement,
} from "../../Api/AnnouncementApi";
import { GetAllDepartments } from "../../Api/DepartmentApi";
import { GetUserJobDetailByUserId } from "../../Api/UserJobDetailApi";
import { unwrapDepartmentList } from "../../Data/jobBolumleri";
import {
  getRichContentPreview,
  stripHtmlTags,
} from "@iso/components/Custom/PortalContentEditor/portalRichContent";

const { RangePicker } = DatePicker;

const uniqueValues = (values) =>
  Array.from(
    new Set(
      values
        .map((value) => String(value || "").trim())
        .filter(Boolean)
    )
  );

const normalizeDepartments = (departments) =>
  (Array.isArray(departments) ? departments : [])
    .map((department) => ({
      id: department.id ?? department.Id,
      name: String(department.name ?? department.Name ?? "").trim(),
    }))
    .filter((department) => department.name);

const AnnouncementList = () => {
  const intl = useIntl();
  const history = useHistory();
  const userRole = useSelector((state) => state.Auth.role?.roleName);
  const authUserId = useSelector((state) => state.Auth.id);
  const authDepartment = useSelector((state) => state.Auth.department);
  const roleName = (userRole || "").toLowerCase();
  const isAdmin = roleName === "admin";
  const location = useLocation();

  const [announcements, setAnnouncements] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [createdRange, setCreatedRange] = useState(null);
  const [departmentCatalog, setDepartmentCatalog] = useState([]);
  const [currentUserDepartment, setCurrentUserDepartment] = useState(authDepartment || "");

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
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentUserDepartment(authDepartment || "");
  }, [authDepartment]);

  useEffect(() => {
    const loadDepartmentCatalog = async () => {
      try {
        if (isAdmin) {
          const deptRes = await GetAllDepartments();
          setDepartmentCatalog(normalizeDepartments(unwrapDepartmentList(deptRes)));
          return;
        }

        if (authDepartment) {
          setCurrentUserDepartment(authDepartment);
          return;
        }

        if (authUserId) {
          const jobRes = await GetUserJobDetailByUserId(authUserId);
          const job = jobRes?.data?.data ?? jobRes?.data?.Data ?? jobRes?.data;
          setCurrentUserDepartment(String(job?.department ?? job?.Department ?? "").trim());
        }
      } catch {
        setDepartmentCatalog([]);
      }
    };

    loadDepartmentCatalog();
  }, [isAdmin, authDepartment, authUserId]);

  useEffect(() => {
    const lower = searchText.toLowerCase();
    setFiltered(
      announcements.filter((a) => {
        const plainContent = stripHtmlTags(a.content).toLowerCase();
        const matchesSearch =
          !lower ||
          a.title?.toLowerCase().includes(lower) ||
          plainContent.includes(lower) ||
          a.createdByName?.toLowerCase().includes(lower) ||
          a.departmentName?.toLowerCase().includes(lower) ||
          a.serviceArea?.toLowerCase().includes(lower);

        const expired = isExpired(a.expiryDate);
        const scheduled = isScheduled(a);
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && a.isActive && !expired && !scheduled) ||
          (statusFilter === "scheduled" && scheduled) ||
          (statusFilter === "expired" && expired) ||
          (statusFilter === "passive" && !a.isActive);

        const audienceValue =
          a.serviceArea || a.departmentName || (a.isGeneral ? "__general" : "");
        const matchesDepartment =
          departmentFilter === "all" || audienceValue === departmentFilter;

        const matchesPriority =
          priorityFilter === "all" || a.priority === priorityFilter;

        const created = moment(a.createdAt);
        const matchesCreated =
          !createdRange ||
          !createdRange[0] ||
          !createdRange[1] ||
          (created.isValid() &&
            created.isSameOrAfter(createdRange[0], "day") &&
            created.isSameOrBefore(createdRange[1], "day"));

        return matchesSearch && matchesStatus && matchesDepartment && matchesPriority && matchesCreated;
      })
    );
  }, [searchText, announcements, statusFilter, departmentFilter, priorityFilter, createdRange]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlight = params.get("highlight");
    if (!highlight || filtered.length === 0) return;
    const id = String(highlight);
    const t = window.setTimeout(() => {
      const el = document.getElementById(`announcement-${id}`);
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [location.search, filtered]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = isAdmin
        ? await GetAllAnnouncements()
        : await GetActiveAnnouncements();
      const data = (response.data.data || []).map((item) => ({
        ...item,
        key: item.id,
      }));
      setAnnouncements(data);
      setFiltered(data);
    } catch {
      message.error(intl.formatMessage({ id: "announcements.list.loadError" }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await DeleteAnnouncement(id);
      message.success(intl.formatMessage({ id: "announcements.list.deleteSuccess" }));
      fetchData();
    } catch {
      message.error(intl.formatMessage({ id: "announcements.list.deleteError" }));
    }
  };

  const isExpired = (expiryDate) =>
    moment(expiryDate).endOf("day").isBefore(moment());

  const isScheduled = (announcement) =>
    announcement?.isActive && moment(announcement.publishDate).isAfter(moment());

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setPriorityFilter("all");
    setCreatedRange(null);
  };

  const usedDepartmentOptions = announcements
    .map((a) => a.serviceArea || a.departmentName || "")
    .filter(Boolean);
  const departmentOptions = uniqueValues([
    "__general",
    ...(isAdmin ? departmentCatalog.map((d) => d.name) : [currentUserDepartment]),
    ...(isAdmin || !currentUserDepartment ? usedDepartmentOptions : []),
  ]);
  const statusOptions = isAdmin
    ? [
        { value: "all", label: intl.formatMessage({ id: "announcements.filters.allStatuses" }) },
        { value: "active", label: intl.formatMessage({ id: "announcements.tag.active" }) },
        { value: "scheduled", label: intl.formatMessage({ id: "announcements.tag.scheduled" }) },
        { value: "expired", label: intl.formatMessage({ id: "announcements.tag.expired" }) },
        { value: "passive", label: intl.formatMessage({ id: "announcements.filters.passive" }) },
      ]
    : [
        { value: "all", label: intl.formatMessage({ id: "announcements.filters.allStatuses" }) },
        { value: "active", label: intl.formatMessage({ id: "announcements.tag.active" }) },
        { value: "passive", label: intl.formatMessage({ id: "announcements.filters.passive" }) },
      ];

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>
            <IntlMessages id="sidebar.announcements" />
          </Breadcrumb.Item>
        </Breadcrumb>

        <PageHeader>
          <IntlMessages id="sidebar.announcements" />
        </PageHeader>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Input
            className="portal-filter-search"
            placeholder={intl.formatMessage({ id: "announcements.list.searchPlaceholder" })}
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          {isAdmin && <AddAnnouncement refreshList={fetchData} />}
        </div>

        <div className="portal-filter-bar">
          <Select
            className="portal-filter-control"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 170 }}
            options={statusOptions}
          />
          <Select
            className="portal-filter-control"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            style={{ width: 180 }}
            options={[
              { value: "all", label: intl.formatMessage({ id: "announcements.filters.allDepartments" }) },
              ...departmentOptions.map((value) => ({
                value,
                label:
                  value === "__general"
                    ? intl.formatMessage({ id: "announcements.form.audienceEveryone" })
                    : value,
              })),
            ]}
          />
          <Select
            className="portal-filter-control"
            value={priorityFilter}
            onChange={setPriorityFilter}
            style={{ width: 160 }}
            options={[
              { value: "all", label: intl.formatMessage({ id: "announcements.filters.allPriorities" }) },
              { value: "high", label: intl.formatMessage({ id: "announcements.priority.high" }) },
              { value: "medium", label: intl.formatMessage({ id: "announcements.priority.medium" }) },
              { value: "low", label: intl.formatMessage({ id: "announcements.priority.low" }) },
            ]}
          />
          <RangePicker
            className="portal-filter-date"
            value={createdRange}
            onChange={setCreatedRange}
            format="DD.MM.YYYY"
            style={{ width: 260, maxWidth: "100%" }}
            placeholder={[
              intl.formatMessage({ id: "announcements.filters.createdStart" }),
              intl.formatMessage({ id: "announcements.filters.createdEnd" }),
            ]}
          />
          <Button
            className="portal-filter-clear"
            onClick={clearFilters}
          >
            {intl.formatMessage({ id: "announcements.filters.clear" })}
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <Empty
            description={intl.formatMessage({ id: "announcements.list.empty" })}
            style={{ padding: "60px 0" }}
          />
        ) : (
          <div>
            {filtered.map((announcement) => {
              const expired = isExpired(announcement.expiryDate);
              const scheduled = isScheduled(announcement);
              const priorityCfg =
                priorityConfig[announcement.priority] || priorityConfig.low;
              const isEveryoneAnnouncement =
                announcement.isGeneral &&
                !announcement.departmentId &&
                !(announcement.serviceArea && String(announcement.serviceArea).trim());

              return (
                <AnnouncementCard
                  id={`announcement-${announcement.id}`}
                  key={announcement.id}
                  priority={announcement.priority}
                  isExpired={expired ? 1 : 0}
                  onClick={() =>
                    history.push(`/dashboard/announcements/${announcement.id}`)
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      history.push(`/dashboard/announcements/${announcement.id}`);
                    }
                  }}
                >
                  <div className="announcement-title">
                    {priorityCfg.icon && (
                      <span
                        style={{
                          marginRight: 6,
                          color:
                            announcement.priority === "high" ? "#ff4d4f" : "#faad14",
                        }}
                      >
                        {priorityCfg.icon}
                      </span>
                    )}
                    {announcement.title}
                    {expired && (
                      <Tag color="default" style={{ marginLeft: 8, fontSize: 11 }}>
                        {intl.formatMessage({ id: "announcements.tag.expired" })}
                      </Tag>
                    )}
                    {scheduled && (
                      <Tag color="gold" style={{ marginLeft: 8, fontSize: 11 }}>
                        {intl.formatMessage({ id: "announcements.tag.scheduled" })}
                      </Tag>
                    )}
                    {!expired && !scheduled && announcement.isActive && (
                      <Tag color="success" style={{ marginLeft: 8, fontSize: 11 }}>
                        <CheckCircleOutlined style={{ marginRight: 3 }} />
                        {intl.formatMessage({ id: "announcements.tag.active" })}
                      </Tag>
                    )}
                    <Tag
                      color={priorityCfg.color}
                      style={{ marginLeft: 8, fontSize: 11 }}
                    >
                      {priorityCfg.label}
                    </Tag>
                  </div>

                  <div className="announcement-content">
                    {getRichContentPreview(announcement.content)}
                  </div>

                  <div className="announcement-meta">
                    {isAdmin && (
                      <span>
                        <UserOutlined style={{ marginRight: 4 }} />
                        {announcement.createdByName}
                      </span>
                    )}
                    {isAdmin && (
                      <span>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        {intl.formatMessage({ id: "announcements.meta.publishDate" })}{" "}
                        {moment(announcement.publishDate).format("DD MMM YYYY HH:mm")}
                      </span>
                    )}
                    <span>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {intl.formatMessage({ id: "announcements.meta.expires" })}{" "}
                      {moment(announcement.expiryDate).format("DD MMM YYYY")}
                    </span>
                    {(announcement.serviceArea || announcement.departmentName) && (
                      <Tag color="geekblue" style={{ margin: 0 }}>
                        {announcement.serviceArea || announcement.departmentName}
                      </Tag>
                    )}
                    {isEveryoneAnnouncement && (
                      <Tag color="purple" style={{ margin: 0 }}>
                        {intl.formatMessage({ id: "announcements.tag.general" })}
                      </Tag>
                    )}
                  </div>

                  {isAdmin && (
                    <div
                      className="announcement-actions"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <EditAnnouncement
                        announcement={announcement}
                        refreshList={fetchData}
                      />
                      <Popconfirm
                        title={intl.formatMessage({ id: "announcements.list.deleteConfirm" })}
                        onConfirm={() => handleDelete(announcement.id)}
                        okText={intl.formatMessage({ id: "notification.common.yes" })}
                        cancelText={intl.formatMessage({ id: "notification.common.no" })}
                      >
                        <Tooltip title={intl.formatMessage({ id: "announcements.list.deleteTooltip" })}>
                          <span
                            style={{
                              cursor: "pointer",
                              color: "#ff4d4f",
                              padding: "4px 8px",
                            }}
                          >
                            <DeleteOutlined />
                          </span>
                        </Tooltip>
                      </Popconfirm>
                    </div>
                  )}
                </AnnouncementCard>
              );
            })}
          </div>
        )}
      </Box>
    </LayoutWrapper>
  );
};

export default AnnouncementList;
