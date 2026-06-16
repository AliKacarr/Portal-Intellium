import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import { Button, Space, Input, Breadcrumb, Tag, Badge, Tooltip } from "antd";
import { Link, useHistory } from "react-router-dom";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import TableWrapper from "../Tables/AntTables/AntTables.styles";
import CardWrapper, { Box } from "./project.styles";
import { useIntl } from "react-intl";
import Scrollbars from "react-custom-scrollbars";
import { ProfileOutlined, SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import ProjeOlustur from "./projectCreate";
import { GetAllProject } from "../../Api/ProjectApi";
import { useSelector, useDispatch } from "react-redux";
import { selectDeepLink, clearDeepLink } from "../../redux/deepLink/deepLinkSlice";

export default function Projects() {
  const intl = useIntl();
  const userRole = useSelector((state) => state.Auth.role.roleName);
  const dispatch = useDispatch();
  const history = useHistory();
  const deepLink = useSelector(selectDeepLink);

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [dataSource, setDataSource] = useState([]);
  const searchInput = useRef(null);

  useEffect(() => {
    if (deepLink?.route === "projectList" && deepLink?.deepLinkId) {
      const targetId = deepLink.deepLinkId;
      dispatch(clearDeepLink());
      history.push(`/dashboard/projectDetail/${targetId}`);
    }
  }, [deepLink, dispatch, history]);

  const fetchData = useCallback(async () => {
    try {
      const response = await GetAllProject();
      const modifiedData = response.data.data.map((item) => ({
        ...item,
        key: item.id,
      }));
      setDataSource(modifiedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function requestColor(requestType) {
    const colors = Object.freeze({
      TECHNIC: "#6895D2",
      IMP: "#A4CE95",
      BUG: "#D04848",
      NEW: "#F3B95F",
      DEF: "#237",
    });

    switch (requestType) {
      case "Yeni Özellik Önerisi":
        return colors.NEW;
      case "İyileştirme Önerisi":
        return colors.IMP;
      case "Hata Bildirimi":
        return colors.BUG;
      case "Teknik Destek":
        return colors.TECHNIC;
      default:
        return colors.DEF;
    }
  }

  const handleSearch = useCallback((selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  }, []);

  const handleReset = useCallback((clearFilters) => {
    clearFilters();
    setSearchText("");
  }, []);

  const getColumnSearchProps = useCallback(
    (dataIndex) => ({
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
      }) => (
        <div
          style={{
            padding: 8,
          }}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <Input
            ref={searchInput}
            placeholder={intl.formatMessage({
              id: "project.list.searchPlaceholder",
            })}
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
              {intl.formatMessage({ id: "project.list.search" })}
            </Button>
            <Button
              onClick={() => clearFilters && handleReset(clearFilters)}
              size="small"
              style={{
                width: 90,
              }}
            >
              {intl.formatMessage({ id: "project.list.reset" })}
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
      onFilter: (value, record) =>
        record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
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
    }),
    [intl, handleSearch, handleReset, searchText, searchedColumn]
  );

  const columns = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: "project.col.projectName" }),
        dataIndex: "projectName",
        key: "projectName",
        width: "25%",
        ...getColumnSearchProps("projectName"),
      },
      {
        title: intl.formatMessage({ id: "project.col.category" }),
        dataIndex: "projectType",
        key: "projectType",
        width: "20%",
        render: (type) =>
          type && (
            <Tag
              bordered={false}
              color={requestColor(type.projectTypeName)}
              style={{ borderRadius: 4 }}
            >
              {type.projectTypeName}
            </Tag>
          ),
      },
      {
        title: intl.formatMessage({ id: "project.col.team" }),
        dataIndex: "projectTeams",
        key: "projectTeams",
        width: "20%",
        render: (teams) =>
          teams.map((team) => (
            <Tag color="#9BB0C1" style={{ borderRadius: 4 }} key={team.id}>
              {team.name}
            </Tag>
          )),
      },
      {
        title: intl.formatMessage({ id: "project.col.status" }),
        dataIndex: "isActive",
        key: "isActive",
        width: "15%",
        sorter: (a, b) => a.isActive - b.isActive,
        render: (isActive) =>
          !isActive ? (
            <Badge
              status="processing"
              text={intl.formatMessage({ id: "project.status.ongoing" })}
            />
          ) : (
            <Badge
              status="success"
              text={intl.formatMessage({ id: "project.status.completed" })}
            />
          ),
      },
      {
        title: "",
        dataIndex: "view",
        key: "view",
        width: "15%",
        render: (text, project) => (
          <div style={{ textAlign: "left", padding: "5px" }}>
            <Tooltip title={intl.formatMessage({ id: "project.tooltip.detail" })}>
              <Link to={`/dashboard/projectDetail/${project.id}`}>
                <Space>
                  <Button type="text" title="">
                    <ProfileOutlined style={{ fontSize: 18 }} />
                  </Button>
                </Space>
              </Link>
            </Tooltip>
          </div>
        ),
      },
    ],
    [intl, getColumnSearchProps]
  );

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Space
          direction="horizontal"
          style={{
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
            <Breadcrumb.Item>
              {intl.formatMessage({ id: "project.list.breadcrumb1" })}
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              {intl.formatMessage({ id: "project.list.breadcrumb2" })}
            </Breadcrumb.Item>
          </Breadcrumb>
          {userRole === "admin" && <ProjeOlustur refreshList={fetchData} />}
        </Space>
        <PageHeader>{intl.formatMessage({ id: "project.list.title" })}</PageHeader>

        <CardWrapper title={intl.formatMessage({ id: "project.card.tableTitle" })}>
          <div className="isoProjectTable">
            <Scrollbars style={{ width: "100%", height: "calc(100vh - 70px)" }}>
              <TableWrapper
                dataSource={dataSource}
                columns={columns}
                pagination={{ pageSize: 5 }}
                className="projectListTable"
              />
            </Scrollbars>
          </div>
        </CardWrapper>
      </Box>
    </LayoutWrapper>
  );
}
