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
  EyeOutlined,
  DeleteOutlined,
  FileTextOutlined,
  SearchOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/tr";
import "moment/locale/en-gb";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import IntlMessages from "@iso/components/utility/intlMessages";
import { Box, NewsCard } from "./news-style";
import { newsImageSrc } from "./newsImageUrl";
import AddNews from "./AddNews";
import EditNews from "./EditNews";
import { GetAllNews, DeleteNews } from "../../Api/NewsApi";
import { GetAllDepartments } from "../../Api/DepartmentApi";
import { GetAllNewsCategories, unwrapNewsCategoryList } from "../../Api/NewsCategoryApi";
import { GetMyUserJobDetail, GetUserJobDetailByUserId } from "../../Api/UserJobDetailApi";
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

const normalizeCategoryNames = (categories) =>
  uniqueValues(
    (Array.isArray(categories) ? categories : []).map(
      (category) => category.name ?? category.Name
    )
  );

const NewsList = () => {
  const intl = useIntl();
  const history = useHistory();
  const userRole = useSelector((state) => state.Auth.role?.roleName);
  const authUserId = useSelector((state) => state.Auth.id);
  const authDepartment = useSelector((state) => state.Auth.department);
  const roleName = (userRole || "").toLowerCase();
  const isAdmin = roleName === "admin";

  const [newsList, setNewsList] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [createdRange, setCreatedRange] = useState(null);
  const [departmentCatalog, setDepartmentCatalog] = useState([]);
  const [categoryCatalog, setCategoryCatalog] = useState([]);
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
    const loadFilterCatalogs = async () => {
      try {
        const catalogRequests = isAdmin
          ? [GetAllDepartments(), GetAllNewsCategories()]
          : [Promise.resolve(null), GetAllNewsCategories()];
        const [deptRes, catRes] = await Promise.all(catalogRequests);

        if (isAdmin) {
          setDepartmentCatalog(normalizeDepartments(unwrapDepartmentList(deptRes)));
        }
        setCategoryCatalog(normalizeCategoryNames(unwrapNewsCategoryList(catRes)));

        if (isAdmin || authDepartment) {
          if (authDepartment) setCurrentUserDepartment(authDepartment);
          return;
        }

        if (authUserId) {
          let job = null;
          try {
            const jobRes = await GetMyUserJobDetail();
            job = jobRes?.data?.data ?? jobRes?.data?.Data ?? jobRes?.data;
          } catch {
            const jobRes = await GetUserJobDetailByUserId(authUserId);
            job = jobRes?.data?.data ?? jobRes?.data?.Data ?? jobRes?.data;
          }
          setCurrentUserDepartment(String(job?.department ?? job?.Department ?? "").trim());
        }
      } catch {
        setDepartmentCatalog([]);
        if (isAdmin) setCategoryCatalog([]);
      }
    };

    loadFilterCatalogs();
  }, [isAdmin, authDepartment, authUserId]);

  useEffect(() => {
    const lower = searchText.toLowerCase();
    setFiltered(
      newsList.filter((n) => {
        const matchesSearch =
          !lower ||
          n.title?.toLowerCase().includes(lower) ||
          n.tags?.toLowerCase().includes(lower) ||
          n.createdByName?.toLowerCase().includes(lower) ||
          n.departmentName?.toLowerCase().includes(lower) ||
          n.newsCategoryName?.toLowerCase().includes(lower);

        const scheduled = isScheduledNews(n);
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "published" && n.isPublished && !scheduled && n.isActive) ||
          (statusFilter === "scheduled" && scheduled) ||
          (statusFilter === "draft" && !n.isPublished) ||
          (statusFilter === "passive" && !n.isActive);

        const audienceValue = n.departmentName || (n.isGeneral ? "__general" : "");
        const matchesDepartment =
          departmentFilter === "all" || audienceValue === departmentFilter;

        const categoryValue = n.newsCategoryName || "__none";
        const matchesCategory =
          categoryFilter === "all" || categoryValue === categoryFilter;

        const created = moment(n.createdAt);
        const matchesCreated =
          !createdRange ||
          !createdRange[0] ||
          !createdRange[1] ||
          (created.isValid() &&
            created.isSameOrAfter(createdRange[0], "day") &&
            created.isSameOrBefore(createdRange[1], "day"));

        return matchesSearch && matchesStatus && matchesDepartment && matchesCategory && matchesCreated;
      })
    );
  }, [searchText, newsList, statusFilter, departmentFilter, categoryFilter, createdRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pubRes = await GetAllNews(true);
      let data = (pubRes.data.data || []).map((item) => ({
        ...item,
        key: item.id,
      }));

      if (isAdmin) {
        const fullRes = await GetAllNews(false);
        const all = fullRes.data.data || [];
        const pubIds = new Set(data.map((n) => n.id));
        const adminOnly = all
          .filter((n) => !pubIds.has(n.id))
          .map((item) => ({ ...item, key: item.id }));
        data = [...adminOnly, ...data].sort(
          (a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime()
        );
      }

      setNewsList(data);
      setFiltered(data);
    } catch {
      message.error(intl.formatMessage({ id: "news.list.loadError" }));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await DeleteNews(id);
      message.success(intl.formatMessage({ id: "news.list.deleteSuccess" }));
      fetchData();
    } catch {
      message.error(intl.formatMessage({ id: "news.list.deleteError" }));
    }
  };

  const renderTags = (tags) => {
    if (!tags) return null;
    return tags.split(",").map((tag) => (
      <Tag key={tag.trim()} color="blue" style={{ marginBottom: 2 }}>
        {tag.trim()}
      </Tag>
    ));
  };

  const isScheduledNews = (news) =>
    news?.isPublished && moment(news.publishDate).isAfter(moment());

  const clearFilters = () => {
    setSearchText("");
    setStatusFilter("all");
    setDepartmentFilter("all");
    setCategoryFilter("all");
    setCreatedRange(null);
  };

  const usedDepartmentOptions = newsList
    .map((n) => n.serviceArea || n.departmentName || "")
    .filter(Boolean);
  const departmentOptions = uniqueValues([
    "__general",
    ...(isAdmin ? departmentCatalog.map((d) => d.name) : [currentUserDepartment]),
    ...(isAdmin || !currentUserDepartment ? usedDepartmentOptions : []),
  ]);

  const listHasNoCategory = newsList.some((n) => !n.newsCategoryName);
  const categoryOptions = uniqueValues([
    ...categoryCatalog,
    ...(listHasNoCategory ? ["__none"] : []),
  ]);
  const statusOptions = isAdmin
    ? [
        { value: "all", label: intl.formatMessage({ id: "news.filters.allStatuses" }) },
        { value: "published", label: intl.formatMessage({ id: "news.filters.published" }) },
        { value: "scheduled", label: intl.formatMessage({ id: "news.filters.scheduled" }) },
        { value: "draft", label: intl.formatMessage({ id: "news.filters.draft" }) },
        { value: "passive", label: intl.formatMessage({ id: "news.filters.passive" }) },
      ]
    : [
        { value: "all", label: intl.formatMessage({ id: "news.filters.allStatuses" }) },
        { value: "published", label: intl.formatMessage({ id: "news.filters.published" }) },
      ];

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>
            <IntlMessages id="sidebar.news" />
          </Breadcrumb.Item>
        </Breadcrumb>

        <PageHeader>
          <IntlMessages id="sidebar.news" />
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
            placeholder={intl.formatMessage({ id: "news.list.searchPlaceholder" })}
            prefix={<SearchOutlined />}
            style={{ width: 280 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
          {isAdmin && <AddNews refreshList={fetchData} />}
        </div>

        <div className="portal-filter-bar">
          {isAdmin && (
            <Select
              className="portal-filter-control"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 170 }}
              options={statusOptions}
            />
          )}
          <Select
            className="portal-filter-control"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            style={{ width: 180 }}
            options={[
              { value: "all", label: intl.formatMessage({ id: "news.filters.allDepartments" }) },
              ...departmentOptions.map((value) => ({
                value,
                label:
                  value === "__general"
                    ? intl.formatMessage({ id: "news.form.audienceEveryone" })
                    : value,
              })),
            ]}
          />
          <Select
            className="portal-filter-control"
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 180 }}
            options={[
              { value: "all", label: intl.formatMessage({ id: "news.filters.allCategories" }) },
              ...categoryOptions.map((value) => ({
                value,
                label:
                  value === "__none"
                    ? intl.formatMessage({ id: "news.filters.noCategory" })
                    : value,
              })),
            ]}
          />
          <RangePicker
            className="portal-filter-date"
            value={createdRange}
            onChange={setCreatedRange}
            format="DD.MM.YYYY"
            style={{ width: 260, maxWidth: "100%" }}
            placeholder={[
              intl.formatMessage({ id: "news.filters.createdStart" }),
              intl.formatMessage({ id: "news.filters.createdEnd" }),
            ]}
          />
          <Button
            className="portal-filter-clear"
            onClick={clearFilters}
          >
            {intl.formatMessage({ id: "news.filters.clear" })}
          </Button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Spin size="large" />
          </div>
        ) : filtered.length === 0 ? (
          <Empty description={intl.formatMessage({ id: "news.list.empty" })} style={{ padding: "60px 0" }} />
        ) : (
          <Row gutter={[16, 16]}>
            {filtered.map((news) => (
              <Col key={news.id} xs={24} sm={12} md={8} lg={6}>
                <NewsCard>
                  <div
                    onClick={() => history.push(`/dashboard/news/${news.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    {news.imageUrl ? (
                      <img src={newsImageSrc(news.imageUrl)} alt={news.title} className="news-image" />
                    ) : (
                      <div className="news-image-placeholder">
                        <FileTextOutlined />
                      </div>
                    )}
                    <div className="news-content">
                      <div className="news-title">{news.title}</div>
                      <div className="news-meta">
                        {isAdmin && (
                          <span>
                            <UserOutlined style={{ marginRight: 4 }} />
                            {news.createdByName}
                          </span>
                        )}
                        <span>
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          {moment(news.publishDate).format("DD MMM YYYY")}
                        </span>
                        {isAdmin && news.viewCount > 0 && (
                          <span>
                            <EyeOutlined style={{ marginRight: 4 }} />
                            {news.viewCount}
                          </span>
                        )}
                      </div>
                      {news.newsCategoryName ? (
                        <Tag color="purple" style={{ marginTop: 6, marginBottom: 4 }}>
                          {news.newsCategoryName}
                        </Tag>
                      ) : null}
                      {isAdmin && isScheduledNews(news) ? (
                        <Tag color="gold" style={{ marginTop: 6, marginBottom: 4 }}>
                          {intl.formatMessage({ id: "news.tag.scheduled" })}
                        </Tag>
                      ) : null}
                      {isAdmin && !news.isPublished ? (
                        <Tag color="default" style={{ marginTop: 6, marginBottom: 4 }}>
                          {intl.formatMessage({ id: "news.tag.draft" })}
                        </Tag>
                      ) : null}
                      <div style={{ marginTop: 6 }}>{renderTags(news.tags)}</div>
                    </div>
                  </div>

                  {isAdmin && (
                    <div
                      style={{
                        padding: "8px 16px",
                        borderTop: "1px solid #f0f0f0",
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 4,
                      }}
                    >
                      <EditNews news={news} refreshList={fetchData} />
                      <Popconfirm
                        title={intl.formatMessage({ id: "news.list.deleteConfirm" })}
                        onConfirm={() => handleDelete(news.id)}
                        okText={intl.formatMessage({ id: "notification.common.yes" })}
                        cancelText={intl.formatMessage({ id: "notification.common.no" })}
                      >
                        <Tooltip title={intl.formatMessage({ id: "news.list.deleteTooltip" })}>
                          <span style={{ cursor: "pointer", color: "#ff4d4f", padding: "4px" }}>
                            <DeleteOutlined />
                          </span>
                        </Tooltip>
                      </Popconfirm>
                    </div>
                  )}
                </NewsCard>
              </Col>
            ))}
          </Row>
        )}
      </Box>
    </LayoutWrapper>
  );
};

export default NewsList;
