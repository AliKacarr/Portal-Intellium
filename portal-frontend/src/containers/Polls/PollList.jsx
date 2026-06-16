import React, { useEffect, useState } from "react";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import {
  Row,
  Col,
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
  CalendarOutlined,
  SearchOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/tr";
import "moment/locale/en-gb";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import IntlMessages from "@iso/components/utility/intlMessages";
import { Box, PollCard } from "./poll-style";
import AddPoll from "./AddPoll";
import EditPoll from "./EditPoll";
import { GetAllPolls, GetActivePolls, DeletePoll } from "../../Api/PollApi";
import { GetAllDepartments } from "../../Api/DepartmentApi";
import { GetUserJobDetailByUserId } from "../../Api/UserJobDetailApi";
import { unwrapDepartmentList } from "../../Data/jobBolumleri";

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

const PollList = () => {
  const intl = useIntl();
  const history = useHistory();
  const userRole = useSelector((state) => state.Auth.role?.roleName);
  const authUserId = useSelector((state) => state.Auth.id);
  const authDepartment = useSelector((state) => state.Auth.department);
  const roleName = (userRole || "").toLowerCase();
  const isAdmin = roleName === "admin";
  const isAdminOrWorker = ["admin", "worker"].includes(roleName);

  const [polls, setPolls] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [voteFilter, setVoteFilter] = useState("all");
  const [createdRange, setCreatedRange] = useState(null);
  const [departmentCatalog, setDepartmentCatalog] = useState([]);
  const [currentUserDepartment, setCurrentUserDepartment] = useState(authDepartment || "");

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
      polls.filter((p) => {
        const matchesSearch =
          !lower ||
          p.title?.toLowerCase().includes(lower) ||
          p.createdByName?.toLowerCase().includes(lower) ||
          p.departmentName?.toLowerCase().includes(lower);

        const now = moment();
        const notStarted = moment(p.startDate).isAfter(now);
        const expired = isExpired(p.endDate);
        const active = p.isActive && !notStarted && !expired;
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "active" && active) ||
          (statusFilter === "notStarted" && p.isActive && notStarted) ||
          (statusFilter === "ended" && expired) ||
          (statusFilter === "passive" && !p.isActive);

        const audienceValue = p.departmentName || (p.isGeneral ? "__general" : "");
        const matchesDepartment =
          departmentFilter === "all" || audienceValue === departmentFilter;

        const matchesVote =
          voteFilter === "all" ||
          (voteFilter === "voted" && p.hasVoted) ||
          (voteFilter === "notVoted" && !p.hasVoted);

        const created = moment(p.createdAt);
        const matchesCreated =
          !createdRange ||
          !createdRange[0] ||
          !createdRange[1] ||
          (created.isValid() &&
            created.isSameOrAfter(createdRange[0], "day") &&
            created.isSameOrBefore(createdRange[1], "day"));

        return matchesSearch && matchesStatus && matchesDepartment && matchesVote && matchesCreated;
      })
    );
  }, [searchText, polls, statusFilter, departmentFilter, voteFilter, createdRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = isAdmin ? await GetAllPolls() : await GetActivePolls();
      const raw = response.data?.data ?? response.data?.Data ?? [];
      const data = (Array.isArray(raw) ? raw : []).map((item) => ({
        ...item,
        key: item.id,
      }));
      setPolls(data);
      setFiltered(data);
    } catch {
      message.error(intl.formatMessage({ id: "polls.list.loadError" }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await DeletePoll(id);
      message.success(intl.formatMessage({ id: "polls.list.deleteSuccess" }));
      fetchData();
    } catch {
      message.error(intl.formatMessage({ id: "polls.list.deleteError" }));
    }
  };

  const isExpired = (endDate) => moment(endDate).isBefore(moment());

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setVoteFilter("all");
    setCreatedRange(null);
  };

  const usedDepartmentOptions = polls
    .map((p) => p.departmentName || "")
    .filter(Boolean);
  const departmentOptions = uniqueValues([
    "__general",
    ...(isAdmin ? departmentCatalog.map((d) => d.name) : [currentUserDepartment]),
    ...(isAdmin || !currentUserDepartment ? usedDepartmentOptions : []),
  ]);
  const statusOptions = isAdmin
    ? [
        { value: "all", label: intl.formatMessage({ id: "polls.filters.allStatuses" }) },
        { value: "active", label: intl.formatMessage({ id: "polls.list.tagActive" }) },
        { value: "notStarted", label: intl.formatMessage({ id: "polls.detail.tagNotStarted" }) },
        { value: "ended", label: intl.formatMessage({ id: "polls.list.tagEnded" }) },
        { value: "passive", label: intl.formatMessage({ id: "polls.tag.passive" }) },
      ]
    : [
        { value: "all", label: intl.formatMessage({ id: "polls.filters.allStatuses" }) },
        { value: "active", label: intl.formatMessage({ id: "polls.list.tagActive" }) },
        { value: "passive", label: intl.formatMessage({ id: "polls.tag.passive" }) },
      ];

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>
            <IntlMessages id="sidebar.polls" />
          </Breadcrumb.Item>
        </Breadcrumb>

        <PageHeader>
          <IntlMessages id="sidebar.polls" />
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
            placeholder={intl.formatMessage({ id: "polls.list.searchPlaceholder" })}
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          {isAdmin && <AddPoll refreshList={fetchData} />}
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
              { value: "all", label: intl.formatMessage({ id: "polls.filters.allDepartments" }) },
              ...departmentOptions.map((value) => ({
                value,
                label:
                  value === "__general"
                    ? intl.formatMessage({ id: "polls.form.audienceEveryone" })
                    : value,
              })),
            ]}
          />
          <Select
            className="portal-filter-control"
            value={voteFilter}
            onChange={setVoteFilter}
            style={{ width: 160 }}
            options={[
              { value: "all", label: intl.formatMessage({ id: "polls.filters.allVotes" }) },
              { value: "voted", label: intl.formatMessage({ id: "polls.list.tagVoted" }) },
              { value: "notVoted", label: intl.formatMessage({ id: "polls.filters.notVoted" }) },
            ]}
          />
          <RangePicker
            className="portal-filter-date"
            value={createdRange}
            onChange={setCreatedRange}
            format="DD.MM.YYYY"
            style={{ width: 260, maxWidth: "100%" }}
            placeholder={[
              intl.formatMessage({ id: "polls.filters.createdStart" }),
              intl.formatMessage({ id: "polls.filters.createdEnd" }),
            ]}
          />
          <Button
            className="portal-filter-clear"
            onClick={clearFilters}
          >
            {intl.formatMessage({ id: "polls.filters.clear" })}
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <Empty
            description={intl.formatMessage({ id: "polls.list.empty" })}
            style={{ padding: "60px 0" }}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {filtered.map((poll) => {
              const expired = isExpired(poll.endDate);

              return (
                <Col key={poll.id} xs={24} sm={12} md={8} lg={6}>
                  <PollCard
                    isExpired={expired ? 1 : 0}
                    hasVoted={poll.hasVoted ? 1 : 0}
                    onClick={() => history.push(`/dashboard/polls/${poll.id}`)}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        {poll.hasVoted && (
                          <Tag color="success" style={{ marginBottom: 6 }}>
                            <CheckCircleOutlined style={{ marginRight: 3 }} />
                            {intl.formatMessage({ id: "polls.list.tagVoted" })}
                          </Tag>
                        )}
                        {expired ? (
                          <Tag color="default" style={{ marginBottom: 6 }}>
                            {intl.formatMessage({ id: "polls.list.tagEnded" })}
                          </Tag>
                        ) : (
                          <Tag color="processing" style={{ marginBottom: 6 }}>
                            <ClockCircleOutlined style={{ marginRight: 3 }} />
                            {intl.formatMessage({ id: "polls.list.tagActive" })}
                          </Tag>
                        )}
                      </div>
                    </div>

                    <div className="poll-title">{poll.title}</div>
                    <div className="poll-question">
                      {intl.formatMessage({ id: "polls.list.questionCount" }, { count: poll.questionCount ?? 0 })}
                    </div>

                    <div className="poll-meta">
                      {isAdmin && (
                        <span>
                          <TeamOutlined style={{ marginRight: 4 }} />
                          {intl.formatMessage({ id: "polls.list.participants" }, { count: poll.totalParticipants })}
                        </span>
                      )}
                      <span>
                        <CalendarOutlined style={{ marginRight: 4 }} />
                        {moment(poll.endDate).format("DD MMM YYYY")}
                      </span>
                      {poll.departmentName && (
                        <Tag color="geekblue" style={{ margin: 0, fontSize: 11 }}>
                          {poll.departmentName}
                        </Tag>
                      )}
                    </div>

                    {isAdminOrWorker && (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          alignItems: "center",
                          gap: 4,
                          marginTop: 12,
                          paddingTop: 8,
                          borderTop: "1px solid #f0f0f0",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EditPoll
                          pollId={poll.id}
                          refreshList={fetchData}
                          buttonType="text"
                          buttonSize="small"
                          showLabel={false}
                        />
                        {isAdmin && (
                          <Popconfirm
                            title={intl.formatMessage({ id: "polls.list.deleteConfirm" })}
                            onConfirm={() => handleDelete(poll.id)}
                            okText={intl.formatMessage({ id: "notification.common.yes" })}
                            cancelText={intl.formatMessage({ id: "notification.common.no" })}
                          >
                            <Tooltip title={intl.formatMessage({ id: "polls.list.deleteTooltip" })}>
                              <span
                                style={{
                                  cursor: "pointer",
                                  color: "#ff4d4f",
                                  padding: "4px",
                                }}
                              >
                                <DeleteOutlined />
                              </span>
                            </Tooltip>
                          </Popconfirm>
                        )}
                      </div>
                    )}
                  </PollCard>
                </Col>
              );
            })}
          </Row>
        )}
      </Box>
    </LayoutWrapper>
  );
};

export default PollList;
