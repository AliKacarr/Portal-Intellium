import React, { useState, useEffect, useRef } from "react";
import { useIntl } from "react-intl";
import { Link, useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import LayoutWrapper from "@iso/components/utility/layoutWrapper.js";
import {
  ClearOutlined,
  CloseOutlined,
  PlusCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import Box from "@iso/components/utility/box";
import { Breadcrumb, Table, Button, Space, Avatar, Tag, Input, message } from "antd";
import PageHeader from "@iso/components/utility/pageHeader";
import { buildApiUrl } from "../../Api/host";
import { UserListe } from "../../Api/UserApi";
import { GetAllCustomerAsBasic } from "../../Api/CustomerApi";
import { EditOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";

export default function UserList() {
  const intl = useIntl();
  //////////// Arama Fonksiyonu

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={intl.formatMessage({ id: "user.common.search" })}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: "block",
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            {intl.formatMessage({ id: "user.common.search" })}
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            {intl.formatMessage({ id: "user.common.reset" })}
          </Button>

          <Button
            type="link"
            size="small"
            icon={<CloseOutlined />}
            onClick={() => {
              close();
            }}
          >
            {intl.formatMessage({ id: "user.common.close" })}
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? "#1677ff" : undefined,
        }}
      />
    ),
    onFilter: (value, record) => {
      const val = record[dataIndex];
      return (val != null ? String(val) : "").toLowerCase().includes(value.toLowerCase());
    },
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: "#ffc069",
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });
  ///////////

  const accessToken = useSelector((state) => state.Auth?.accessToken);

  //// UseState
  const [data, setData] = useState([]);
  const [customers, setCustomers] = useState([]);

  const normalizeUserRow = (r, index) => {
    if (!r || typeof r !== "object") return null;
    const id = r.id ?? r.Id ?? r.key ?? index;
    const customer = r.customer ?? r.Customer;
    const userRole = r.userRole ?? r.UserRole;
    const customerName = customer?.customerName ?? customer?.CustomerName ?? "";
    const roleName = userRole?.roleName ?? userRole?.RoleName ?? "";
    return {
      ...r,
      key: id,
      id,
      name: r.name ?? r.Name ?? "",
      email: r.email ?? r.Email ?? "",
      isActive: r.isActive ?? r.IsActive ?? false,
      imageUrl: r.imageUrl ?? r.ImageUrl ?? "",
      customer,
      userRole,
      customerName,
      roleName,
    };
  };

  useEffect(() => {
    const userListe1 = async () => {
      if (!accessToken) {
        setData([]);
        return;
      }
      try {
        const response = await UserListe(accessToken);
        const raw = response?.data?.data ?? response?.data ?? [];
        const list = Array.isArray(raw) ? raw.map(normalizeUserRow).filter(Boolean) : [];
        setData(list);
      } catch (error) {
        setData([]);
        const status = error?.response?.status;
        const msg = error?.response?.data?.message ?? error?.response?.data?.Message ?? error?.message;
        if (status === 500) {
          message.error(intl.formatMessage({ id: "user.list.loadError500" }));
        } else if (status === 401) {
          message.error(intl.formatMessage({ id: "user.list.loadError401" }));
        } else {
          message.error(msg || intl.formatMessage({ id: "user.list.loadErrorGeneric" }));
        }
      }
    };
    const customerListe = async () => {
      try {
        const response = await GetAllCustomerAsBasic();
        setCustomers(response.data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    customerListe();
    userListe1();
  }, [accessToken, intl]);

  /// Badge color
  function getColorById(id) {
    // Renkler dizisi
    const customColors = [
      "#6895D2",
      "#A4CE95",
      "#D04848",
      "#F3B95F",
      "#FDE767",
    ];

    // ID'ye göre indeks hesaplanması
    const index = id % customColors.length;

    // ID'ye göre belirlenen renk döndürülmesi
    return customColors[index];
  }

  /// kullanıcı düzenlemeye gönder
  const history = useHistory();
  const handleRowClick = (rowId) => {
    history.push(`/dashboard/editUser/${rowId}`);
  };

  const columns = [
    { title: intl.formatMessage({ id: "user.list.columnId" }), dataIndex: "id", key: "id", width: 30, align: "center" },
    {
      title: intl.formatMessage({ id: "user.list.columnAvatar" }),
      dataIndex: "imageUrl",
      key: "avatar",
      width: 40,
      align: "center",
      render: (url, record) =>
        record.imageUrl ? (
          <Avatar size="large" src={buildApiUrl(url)} />
        ) : (
          <Avatar size="large" style={{ backgroundColor: getColorById(record.id) }}>
            {record.name ? record.name.charAt(0).toUpperCase() : ""}
          </Avatar>
        ),
    },
    {
      title: intl.formatMessage({ id: "user.list.columnUsername" }),
      dataIndex: "name",
      key: "name",
      width: 140,
      sorter: (a, b) => (a.name || "").localeCompare(b.name || ""),
      ellipsis: true,
      ...getColumnSearchProps("name"),
    },
    {
      title: intl.formatMessage({ id: "user.list.columnEmail" }),
      dataIndex: "email",
      key: "email",
      width: 220,
      ellipsis: true,
      render: (email) => (
        <span style={{ display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {email ?? ""}
        </span>
      ),
    },
    {
      title: intl.formatMessage({ id: "user.list.columnCompany" }),
      dataIndex: "customerName",
      key: "customerName",
      width: 170,
      sorter: (a, b) => String(a.customerName || "").localeCompare(b.customerName || ""),
      ellipsis: true,
      filters: customers.map((c) => ({ text: c.customerName ?? "", value: c.customerName ?? "" })),
      onFilter: (value, record) => String(record.customerName || "").includes(value),
    },
    {
      title: intl.formatMessage({ id: "user.list.columnRole" }),
      dataIndex: "roleName",
      key: "roleName",
      width: 140,
      align: "center",
      defaultSortOrder: "ascend",
      sorter: (a, b) => String(a.roleName || "").localeCompare(b.roleName || ""),
      render: (roleName, record) => (
        <Tag
          color={getColorById(record.userRole?.id)}
          style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {roleName ? String(roleName).replace(/^./, (char) => char.toUpperCase()) : ""}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: "user.list.columnEdit" }),
      key: "action",
      width: 45,
      align: "center",
      render: (_, record) => (
        <Button type="text" onClick={() => handleRowClick(record.id)}>
          <EditOutlined />
        </Button>
      ),
    },
    {
      title: intl.formatMessage({ id: "user.list.columnAccountStatus" }),
      dataIndex: "isActive",
      key: "isActive",
      width: 80,
      align: "center",
      sorter: (a, b) => (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0),
      render: (v) =>
        v ? (
          <Tag color="#87d068">{intl.formatMessage({ id: "user.common.active" })}</Tag>
        ) : (
          <Tag color="#f50">{intl.formatMessage({ id: "user.common.inactive" })}</Tag>
        ),
    },
  ];

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "user.list.breadcrumbUser" })}</Breadcrumb.Item>
          <Breadcrumb.Item>{intl.formatMessage({ id: "user.list.breadcrumbList" })}</Breadcrumb.Item>
        </Breadcrumb>
        <div style={{ width: "100%", textAlign: "right", marginTop: "-43px" }}>
          <Link to={`CreateUser`}>
            <Button
              type="primary"
              className="user-page-header-action-btn"
              icon={<PlusCircleOutlined style={{ fontSize: "18px" }} />}
            >
              {intl.formatMessage({ id: "user.list.createButton" })}
            </Button>
          </Link>
        </div>
        <PageHeader>
          <p>{intl.formatMessage({ id: "user.list.pageTitle" })}</p>
        </PageHeader>

        <div style={{ minHeight: 0, overflow: "auto", maxHeight: "calc(100vh - 220px)" }}>
          <Table
            size="small"
            rowKey="id"
            columns={columns}
            dataSource={data}
            style={{ margin: "10px 20px" }}
            scroll={{ x: 950, y: 600 }}
            tableLayout="fixed"
          />
        </div>
      </Box>
    </LayoutWrapper>
  );
}
