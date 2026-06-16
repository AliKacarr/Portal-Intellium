import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom/cjs/react-router-dom";
import {
  Button,
  Breadcrumb,
  Tag,
  Tooltip,
  Avatar,
  Input,
  Space,
  Table,
  Badge,
  DatePicker,
} from "antd";
import {
  CalendarOutlined,
  ExportOutlined,
  FileSearchOutlined,
  PlusCircleOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import Highlighter from "react-highlight-words";
import { Link } from "react-router-dom";
import { Box } from "./Ticket.styles";
import { GetAllTickets } from "./../../Api/TicketApi";
import { buildApiUrl } from "../../Api/host";
import moment from "moment";
import "moment/locale/tr";
import * as XLSX from "xlsx";
import { useIntl } from "react-intl";

// ✅ YENİ İMPORTLAR
import { useSelector, useDispatch } from "react-redux";
import { selectDeepLink, clearDeepLink } from "../../redux/deepLink/deepLinkSlice";

moment.locale("tr");
const { RangePicker } = DatePicker;

export default function TicketList() {
  // ✅ HOOK TANIMLARI (En üste aldım)
  const dispatch = useDispatch();
  const history = useHistory();
  const deepLink = useSelector(selectDeepLink);
  const intl = useIntl();

  // ✅ DEEP LINK KONTROLÜ (Sihirli Kısım)
  useEffect(() => {
    // notificationRouting.js dosyasında 'tickets' olarak tanımlamıştık
    if (deepLink?.route === 'tickets' && deepLink?.deepLinkId) {
        const targetId = deepLink.deepLinkId;

        // Redux'ı temizle
        dispatch(clearDeepLink());

        // Detay sayfasına yönlendir
        history.push(`/dashboard/ticketDetail/${targetId}`);
    }
  }, [deepLink, dispatch, history]);
  // -----------------------------------------------------------

  function safelyParseJSON(jsonString) {
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      return [];
    }
  }

  // Columns
  const columns = (
    searchInput,
    setSearchText,
    setSearchedColumn,
    searchText,
    searchedColumn
  ) => [
    {
      title: intl.formatMessage({ id: "tickets.columns.id" }),
      dataIndex: "id",
      key: "id",
      sorter: (a, b) => a.id - b.id,
      width: 30,
      align: "center",
    },
    {
      title: intl.formatMessage({ id: "tickets.columns.name" }),
      key: "name",
      width: 160,
      dataIndex: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      ...getColumnSearchProps("name"),
      render: (name) => (
        <Tooltip placement="topLeft" title={name}>
          <div
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {name}
          </div>
        </Tooltip>
      ),
    },
    {
      title: intl.formatMessage({ id: "tickets.columns.requestType" }),
      align: "center",
      key: "requestType",
      width: 140,
      dataIndex: "requestType",
      sorter: (a, b) => {
        const aRequestType = safelyParseJSON(a.requestType)[0] || "";
        const bRequestType = safelyParseJSON(b.requestType)[0] || "";
        return aRequestType.localeCompare(bRequestType);
      },
      render: (requestType) => {
        const parsedRequestType = safelyParseJSON(requestType);
        return parsedRequestType.length > 0 ? (
          parsedRequestType.map((type, index) => (
            <Tag
              key={index}
              style={{ minWidth: 70, borderRadius: 3, margin: 4 }}
              bordered={false}
              color={requestColor(type)}
            >
              {type}
            </Tag>
          ))
        ) : (
          <span style={{ color: "#999" }}>{intl.formatMessage({ id: "tickets.requestType.unspecified" })}</span>
        );
      },
    },

    {
      title: intl.formatMessage({ id: "tickets.columns.customer" }),
      key: "customer",
      width: 160,
      dataIndex: "customer",
      sorter: (a, b) =>
        a.customer.customerName.localeCompare(b.customer.customerName),
      ...getColumnSearchProps(
        "customer",
        ["customer", "customerName"],
        searchInput,
        setSearchText,
        setSearchedColumn,
        searchText,
        searchedColumn
      ),
      render: (customer) => (
        <Tooltip placement="topLeft" title={customer.customerName}>
          <div
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {customer.customerName}
          </div>
        </Tooltip>
      ),
    },

    {
      title: intl.formatMessage({ id: "tickets.columns.project" }),
      dataIndex: "project",
      key: "project",
      width: 180,
      sorter: (a, b) =>
        a.project.projectName.localeCompare(b.project.projectName),
      ...getColumnSearchProps(
        "project",
        ["project", "projectName"],
        searchInput,
        setSearchText,
        setSearchedColumn,
        searchText,
        searchedColumn
      ),
      render: (project) => (
        <Tooltip placement="topLeft" title={project.projectName}>
          <div
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {project.projectName}
          </div>
        </Tooltip>
      ),
    },

    {
      title: intl.formatMessage({ id: "tickets.columns.creationDate" }),
      dataIndex: "creationDate",
      key: "creationDate",
      render: (creationDate) => (
        <Tooltip title={moment(creationDate).format("HH:mm")}>
          <span>{moment(creationDate).format("DD MMMM YYYY")}</span>
        </Tooltip>
      ),
      width: 60,
      sorter: (a, b) => moment(a.creationDate).diff(moment(b.creationDate)),
      ...getColumnDateFilterProps("creationDate"),
    },
    {
      defaultSortOrder: "ascend",
      align: "center",
      title: intl.formatMessage({ id: "tickets.columns.status" }),
      dataIndex: "status",
      key: "status",
      width: 80,
      sorter: (a, b) => a.status - b.status,
      render: (status) => (
        <Space>
          {status === 0 ? (
            <Badge
              status="processing"
              color="#5AB2FF"
              text={intl.formatMessage({ id: "tickets.status.new" })}
            />
          ) : status === 1 ? (
            <Badge
              status="processing"
              color="#AD88C6"
              text={intl.formatMessage({ id: "tickets.status.assigned" })}
            />
          ) : (
            <Badge
              status="processing"
              color="#7ABA78"
              text={intl.formatMessage({ id: "tickets.status.resolved" })}
            />
          )}
        </Space>
      ),
    },
    {
      align: "center",
      title: intl.formatMessage({ id: "tickets.columns.assignedUser" }),
      width: 40,
      dataIndex: "assignedUser",
      key: "assignedUser",
      render: (assignedUser) =>
        assignedUser && assignedUser.imageUrl ? (
          <Tooltip title={assignedUser.name}>
            <Avatar
              size="large"
              src={buildApiUrl(assignedUser.imageUrl)}
            />
          </Tooltip>
        ) : assignedUser ? (
          <Tooltip title={assignedUser.name}>
            <Avatar
              size="large"
              style={{ backgroundColor: getColorById(assignedUser.id) }}
            >
              {assignedUser.name.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
        ) : null,
    },
    {
      align: "center",
      width: 40,
      key: "action",
      render: (text, record) => (
        <Space>
          <Button type="text" onClick={() => handleRowClick(record.id)}>
            <FileSearchOutlined />
          </Button>
        </Space>
      ),
    },
  ];

  // Tarihe Göre Filtreleme
  const [filteredInfo, setFilteredInfo] = useState({});

  const handleDateFilter = (dates, confirm, dataIndex) => {
    confirm();
    setFilteredInfo({
      ...filteredInfo,
      [dataIndex]: dates,
    });
  };
  const getColumnDateFilterProps = (dataIndex) => ({
    filterDropdown: ({ setSelectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <RangePicker
          showToday
          onChange={(dates) => setSelectedKeys(dates ? [dates] : [])}
          style={{ marginBottom: 8, borderRadius: 5, width: "100%" }}
        />
        <Space style={{ display: "flex", justifyContent: "space-around" }}>
          <Button
            type="primary"
            onClick={() =>
              handleDateFilter(setSelectedKeys[0], confirm, dataIndex)
            }
            size="small"
            style={{ width: 90 }}
          >
            {intl.formatMessage({ id: "tickets.filter.search" })}
          </Button>
          <Button
            onClick={() => handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            {intl.formatMessage({ id: "tickets.filter.reset" })}
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <CalendarOutlined style={{ color: filtered ? "#1890ff" : undefined }} /> // Takvim simgesi
    ),
    onFilter: (value, record) => {
      const [start, end] = value;
      const recordDate = moment(record[dataIndex]);
      return recordDate.isBetween(start, end, null, "[]");
    },
  });

  const [ticketData, setTicketData] = useState([]);
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      let response = await GetAllTickets();

      setTicketData(
        response.data.data.map((ticket) => {
          if (ticket.requestType === null) {
            return { ...ticket, requestType: "" };
          } else {
            return ticket;
          }
        })
      );
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const [filteredData, setFilteredData] = useState(ticketData);

  const handleTableChange = (pagination, filters, sorter, extra) => {
    if (extra.currentDataSource) {
      setFilteredData(extra.currentDataSource);
    }
  };

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
    setFilteredInfo({});
    setSearchText("");
  };
  const getColumnSearchProps = (dataIndex, nestedDataKey) => ({
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
          placeholder={intl.formatMessage({ id: "tickets.filter.search" })}
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
            {intl.formatMessage({ id: "tickets.filter.search" })}
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            {intl.formatMessage({ id: "tickets.filter.reset" })}
          </Button>

          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            {intl.formatMessage({ id: "tickets.filter.close" })}
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
      const searchField = nestedDataKey
        ? record[nestedDataKey[0]][nestedDataKey[1]]
        : record[dataIndex];
      return searchField.toString().toLowerCase().includes(value.toLowerCase());
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
  
  const handleRowClick = (row) => {
    history.push(`/dashboard/ticketDetail/${row}`);
  };

  // Renkler dizisi
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

  function requestColor(requestType) {
    const colors = Object.freeze({
      NEW_FEATURE: "#87AEEE",
      SUPPORT: "#FFA07A",
      IMPROVEMENT: "#88D498",
      ERROR: "#E65C54",
      DEFAULT: "#292D3E",
    });

    // Renkler dizisi
    switch (requestType) {
      case "Report a BUG":
        return colors.ERROR;
      case "Technical Support":
        return colors.SUPPORT;
      case "Suggest a New Feature":
        return colors.NEW_FEATURE;
      case "Suggest Improvement":
        return colors.IMPROVEMENT;
      default:
        return colors.DEFAULT;
    }
  }

  const handleExcelExport = async () => {
    try {
      if (!Array.isArray(filteredData) || ticketData.length === 0) {
        console.error("Geçersiz veya boş veri.");
        return;
      }

      // HTML etiketlerini temizleme fonksiyonu
      const stripHtmlTags = (html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        return doc.body.textContent || doc.body.innerText || "";
      };

      // Status değerini dönüştürme fonksiyonu
      const getStatusString = (status) => {
        switch (status) {
          case 0:
            return intl.formatMessage({ id: "tickets.status.newExport" });
          case 1:
            return intl.formatMessage({ id: "tickets.status.assigned" });
          case 2:
            return intl.formatMessage({ id: "tickets.status.resolved" });
          default:
            return intl.formatMessage({ id: "tickets.status.unknown" }); // Diğer durumlar için varsayılan bir değer
        }
      };

      // Veriyi düzleştir
      const flattenedData = filteredData.map((ticket) => ({
        id: ticket.id,
        name: ticket.name,
        description: stripHtmlTags(ticket.description), // HTML etiketlerini temizle,
        status: getStatusString(ticket.status), // Statüyü int formattan belirlenen string formata dönüştür
        project_name: ticket.project?.projectName || "",
        customer_name: ticket.customer?.customerName || "",
        creationDate: moment(ticket.creationDate).format("DD.MM.YYYY"), // Tarih formatlama
        assignedDate: ticket.assignedDate
          ? moment(ticket.assignedDate).format("DD.MM.YYYY") // Eğer atama tarihi varsa
          : intl.formatMessage({ id: "tickets.status.notAssignedYet" }), // Eğer atama tarihi yoksa
        resolutionDate: ticket.resolutionDate
          ? moment(ticket.resolutionDate).format("DD.MM.YYYY")
          : intl.formatMessage({ id: "tickets.status.notResolvedYet" }), // Eğer çözümlenme tarihi yoksa
        creatorUser_name: ticket.creatorUser?.name || "", // creatorUser.name
        assignedUser_name: ticket.assignedUser?.name || "", // assignedUser.name
        requestType: ticket.requestType || "",
      }));

      // Çalışma sayfası oluştur
      const worksheet = XLSX.utils.json_to_sheet(flattenedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      // Dosyayı indir
      XLSX.writeFile(workbook, "Portal-Biletler.xlsx");
    } catch (error) {
      console.error("Excel'e export edilirken bir hata oluştu:", error);
    }
  };

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "tickets.breadcrumb.ticket" })}</Breadcrumb.Item>
          <Breadcrumb.Item>{intl.formatMessage({ id: "tickets.breadcrumb.list" })}</Breadcrumb.Item>
        </Breadcrumb>

        <div
          style={{
            width: "100%",
            textAlign: "right",
            marginTop: "-43px",
            marginBottom: "20px",
          }}
        >
          <Space>
            <Link to={`addticket`}>
              <Button
                icon={<PlusCircleOutlined />}
                type="primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {intl.formatMessage({ id: "tickets.actions.create" })}
              </Button>
            </Link>
            <Button
              icon={<ExportOutlined />}
              onClick={handleExcelExport}
              type="link"
              style={{
                color: "#fff",
                backgroundColor: "#50ad88",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {intl.formatMessage({ id: "tickets.actions.export" })}
            </Button>
          </Space>
        </div>

        <Table
          size="small"
          dataSource={ticketData}
          onChange={handleTableChange}
          columns={columns(
            searchInput,
            setSearchText,
            setSearchedColumn,
            searchText,
            searchedColumn
          )}
          scroll={{ x: 900 }}
        />
      </Box>
    </LayoutWrapper>
  );
}