import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, DatePicker, Input, message, Select, Tag, Tooltip } from "antd";
import moment from "moment";
import Scrollbars from "react-custom-scrollbars";
import { useIntl } from "react-intl";
import { useSelector } from "react-redux";
import { UserListe } from "../../Api/UserApi";
import TableWrapper from "../Tables/AntTables/AntTables.styles";

const { RangePicker } = DatePicker;
const { Option } = Select;

const renderAgreementAcceptance = (acceptedAt, version) => {
  const parsed = acceptedAt ? moment(acceptedAt) : null;
  if (!parsed?.isValid()) return "-";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      <Tooltip title={parsed.format("DD.MM.YYYY HH:mm:ss")}>
        <span>{parsed.format("DD.MM.YYYY HH:mm")}</span>
      </Tooltip>
      {version ? <Tag color="blue">v{version}</Tag> : null}
    </div>
  );
};

const normalizeUser = (user) => ({
  id: user?.id ?? user?.Id,
  name: user?.name ?? user?.Name ?? "",
  email: user?.email ?? user?.Email ?? "",
  addedAt: user?.addedAt ?? user?.AddetAt ?? user?.addetAt ?? user?.createdAt ?? null,
  kvkkAcceptedAt: user?.kvkkAcceptedAt ?? user?.KvkkAcceptedAt ?? null,
  kvkkVersion: user?.kvkkVersion ?? user?.KvkkVersion ?? null,
  explicitConsentAcceptedAt: user?.explicitConsentAcceptedAt ?? user?.ExplicitConsentAcceptedAt ?? null,
  explicitConsentVersion: user?.explicitConsentVersion ?? user?.ExplicitConsentVersion ?? null,
  isActive: Boolean(user?.isActive ?? user?.IsActive),
  roleName:
    user?.roleName ??
    user?.RoleName ??
    user?.userRole?.roleName ??
    user?.userRole?.RoleName ??
    user?.UserRole?.RoleName ??
    "",
  customerName:
    user?.customerName ??
    user?.CustomerName ??
    user?.customer?.customerName ??
    user?.customer?.CustomerName ??
    user?.Customer?.CustomerName ??
    "",
});

const UserRegistrationsTable = () => {
  const intl = useIntl();
  const accessToken = useSelector((state) => state?.Auth?.accessToken);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const initialFilters = { search: "", dateRange: [], status: "" };
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await UserListe(accessToken);
      const list = Array.isArray(response?.data) ? response.data : [];
      setUsers(
        list
          .map(normalizeUser)
          .sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0))
      );
    } catch (error) {
      message.error(error.response?.data?.message || intl.formatMessage({ id: "log.messages.fetchError" }));
    } finally {
      setLoading(false);
    }
  }, [accessToken, intl]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const search = appliedFilters.search.trim().toLowerCase();
    const [start, end] = appliedFilters.dateRange || [];

    return users.filter((user) => {
      const matchesSearch =
        !search ||
        `${user.name} ${user.email} ${user.roleName} ${user.customerName}`.toLowerCase().includes(search);

      const matchesStatus =
        appliedFilters.status === "" ||
        (appliedFilters.status === "active" ? user.isActive : !user.isActive);

      const addedMoment = user.addedAt ? moment(user.addedAt) : null;
      const matchesDate =
        !start ||
        !end ||
        (addedMoment?.isValid() &&
          addedMoment.isSameOrAfter(start.clone().startOf("day")) &&
          addedMoment.isSameOrBefore(end.clone().endOf("day")));

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [users, appliedFilters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setAppliedFilters(filters);
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setCurrentPage(1);
  };

  const columns = [
    { title: intl.formatMessage({ id: "log.userRegistrations.columns.userId" }), dataIndex: "id", key: "id", width: 90 },
    { title: intl.formatMessage({ id: "log.userRegistrations.columns.name" }), dataIndex: "name", key: "name", width: 200 },
    { title: intl.formatMessage({ id: "log.userRegistrations.columns.email" }), dataIndex: "email", key: "email", width: 240 },
    { title: intl.formatMessage({ id: "log.userRegistrations.columns.role" }), dataIndex: "roleName", key: "roleName", width: 160 },
    { title: intl.formatMessage({ id: "log.userRegistrations.columns.company" }), dataIndex: "customerName", key: "customerName", width: 220 },
    {
      title: intl.formatMessage({ id: "log.userRegistrations.columns.createdAt" }),
      dataIndex: "addedAt",
      key: "addedAt",
      width: 170,
      render: (value) => {
        const parsed = value ? moment(value) : null;
        if (!parsed?.isValid()) return "-";
        return (
          <Tooltip title={parsed.format("DD.MM.YYYY HH:mm:ss")}>
            <span>{parsed.format("DD.MM.YYYY HH:mm")}</span>
          </Tooltip>
        );
      },
    },
    {
      title: intl.formatMessage({ id: "log.userRegistrations.columns.kvkkAcceptedAt" }),
      key: "kvkkAcceptedAt",
      width: 180,
      render: (_, record) => renderAgreementAcceptance(record.kvkkAcceptedAt, record.kvkkVersion),
    },
    {
      title: intl.formatMessage({ id: "log.userRegistrations.columns.explicitConsentAcceptedAt" }),
      key: "explicitConsentAcceptedAt",
      width: 210,
      render: (_, record) =>
        renderAgreementAcceptance(record.explicitConsentAcceptedAt, record.explicitConsentVersion),
    },
    {
      title: intl.formatMessage({ id: "log.userRegistrations.columns.status" }),
      dataIndex: "isActive",
      key: "isActive",
      width: 110,
      render: (isActive) => (
        <Tag style={{ borderRadius: 4 }} color={isActive ? "green" : "red"}>
          {isActive
            ? intl.formatMessage({ id: "log.userRegistrations.status.active" })
            : intl.formatMessage({ id: "log.userRegistrations.status.passive" })}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
        <Input
          placeholder={intl.formatMessage({ id: "log.userRegistrations.filters.search" })}
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          style={{ width: "240px" }}
        />
        <RangePicker
          value={filters.dateRange}
          onChange={(dates) => handleFilterChange("dateRange", dates || [])}
          allowClear
        />
        <Select
          placeholder={intl.formatMessage({ id: "log.userRegistrations.filters.status" })}
          value={filters.status}
          onChange={(value) => handleFilterChange("status", value)}
          style={{ width: "150px" }}
        >
          <Option value="">{intl.formatMessage({ id: "log.common.all" })}</Option>
          <Option value="active">{intl.formatMessage({ id: "log.userRegistrations.status.active" })}</Option>
          <Option value="passive">{intl.formatMessage({ id: "log.userRegistrations.status.passive" })}</Option>
        </Select>
        <Button type="primary" onClick={handleApplyFilters}>
          {intl.formatMessage({ id: "log.common.filter" })}
        </Button>
        <Button type="default" onClick={handleResetFilters}>
          {intl.formatMessage({ id: "log.common.reset" })}
        </Button>
      </div>

      <Scrollbars style={{ width: "100%", height: "calc(100vh - 10px)" }}>
        <TableWrapper
          dataSource={filteredUsers}
          columns={columns}
          rowKey={(record) => record.id}
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            showSizeChanger: false,
            current: currentPage,
            pageSize,
            total: filteredUsers.length,
            onChange: (page) => setCurrentPage(Number(page)),
          }}
          className="logListTable"
        />
      </Scrollbars>
    </>
  );
};

export default UserRegistrationsTable;
