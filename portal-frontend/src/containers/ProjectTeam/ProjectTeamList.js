import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import {
  Button,
  Avatar,
  Tooltip,
  Space,
  Input,
  Breadcrumb,
  Popconfirm,
} from "antd";
import { Link } from "react-router-dom";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import TableWrapper from "../Tables/AntTables/AntTables.styles";
import CardWrapper, { Box } from "./ProjectTeam.styles";
import { useIntl } from "react-intl";
import Scrollbars from "react-custom-scrollbars";
import { ProfileOutlined, SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import ProjectTeamCreate from "./ProjectTeamCreate";
import { GetProjectTeams, DeleteProjectTeam } from "../../Api/ProjectTeamApi";
import { buildApiUrl } from "../../Api/host";
import { useSelector } from "react-redux";

export default function Projects() {
  const intl = useIntl();
  const loggedUser = useSelector((state) => state.Auth);

  function getColorById(id) {
    const customColors = [
      "#6895D2",
      "#A4CE95",
      "#D04848",
      "#F3B95F",
      "#FDE767",
    ];
    const index = id % customColors.length;
    return customColors[index];
  }

  const [dataSource, setDataSource] = useState([]);
  const [deleteApiProgress, setDeleteApiProgress] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const response = await GetProjectTeams();
      const modifiedData = response.data.data.map((item) => ({
        ...item,
        key: item.id,
      }));
      setDataSource(modifiedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  const onDeleteTeam = useCallback(async (teamId) => {
    setDeleteApiProgress(true);
    try {
      await DeleteProjectTeam(teamId);
      setDataSource((prevData) =>
        prevData.filter((item) => item.key !== teamId)
      );
    } catch (error) {}
    setDeleteApiProgress(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);

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
              id: "projectTeam.list.searchPlaceholder",
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
              {intl.formatMessage({ id: "projectTeam.list.search" })}
            </Button>
            <Button
              onClick={() => clearFilters && handleReset(clearFilters)}
              size="small"
              style={{
                width: 90,
              }}
            >
              {intl.formatMessage({ id: "projectTeam.list.reset" })}
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
        title: intl.formatMessage({ id: "projectTeam.col.teamName" }),
        dataIndex: "name",
        key: "name",
        width: 200,
        ...getColumnSearchProps("name"),
      },
      {
        title: intl.formatMessage({ id: "projectTeam.col.projectName" }),
        dataIndex: "projectName",
        key: "projectName",
        width: 400,
        ...getColumnSearchProps("projectName"),
      },
      {
        title: intl.formatMessage({ id: "projectTeam.col.members" }),
        dataIndex: "members",
        key: "projeEkibi",
        width: 100,
        render: (users) => (
          <Avatar.Group
            maxCount={4}
            maxStyle={{ color: "#0d47a1", backgroundColor: "#bbdefb" }}
          >
            {users &&
              users.map((user) => (
                <Tooltip key={user.id} title={user.name} placement="top">
                  {user.imageUrl ? (
                    <Avatar
                      src={buildApiUrl(user.imageUrl)}
                    />
                  ) : (
                    <Avatar
                      style={{
                        backgroundColor: getColorById(user.id),
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                </Tooltip>
              ))}
          </Avatar.Group>
        ),
      },
      {
        title: " ",
        dataIndex: "view",
        key: "view",
        width: 100,
        render: (text, projectTeam) =>
          projectTeam ? (
            <div className="isoProjectBtnView">
              <Tooltip title={intl.formatMessage({ id: "projectTeam.tooltip.detail" })}>
                <Link to={`/dashboard/projectTeamDetail/${projectTeam.id}`}>
                  <Space>
                    <Button type="text" title="">
                      <ProfileOutlined style={{ fontSize: 18 }} />
                    </Button>
                  </Space>
                </Link>
              </Tooltip>
              {(loggedUser?.id === projectTeam?.projectLeader?.id ||
                loggedUser?.role?.roleName === "admin") && (
                <Tooltip title={intl.formatMessage({ id: "projectTeam.tooltip.delete" })}>
                  <Popconfirm
                    title={intl.formatMessage({ id: "projectTeam.delete.confirm" })}
                    onConfirm={() => onDeleteTeam(projectTeam.id)}
                    okButtonProps={{ loading: deleteApiProgress }}
                    okText={intl.formatMessage({ id: "projectTeam.confirm.yes" })}
                    cancelText={intl.formatMessage({ id: "projectTeam.confirm.no" })}
                  >
                    <Button danger type="text" className="projectDltBtn" title="">
                      <i className="ion-android-delete" />
                    </Button>
                  </Popconfirm>
                </Tooltip>
              )}
            </div>
          ) : null,
      },
    ],
    [intl, getColumnSearchProps, loggedUser, deleteApiProgress, onDeleteTeam]
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
              {intl.formatMessage({ id: "projectTeam.list.breadcrumb1" })}
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              {intl.formatMessage({ id: "projectTeam.list.breadcrumb2" })}
            </Breadcrumb.Item>
          </Breadcrumb>
          <ProjectTeamCreate refreshList={fetchData} />
        </Space>

        <PageHeader>{intl.formatMessage({ id: "projectTeam.list.title" })}</PageHeader>
        {dataSource && (
          <CardWrapper title={intl.formatMessage({ id: "projectTeam.card.tableTitle" })}>
            <div className="isoProjectTable">
              <Scrollbars
                style={{ width: "100%", height: "calc(100vh - 70px)" }}
              >
                <TableWrapper
                  dataSource={dataSource}
                  columns={columns}
                  pagination={{ pageSize: 10 }}
                  className="projectListTable"
                />
              </Scrollbars>
            </div>
          </CardWrapper>
        )}
      </Box>
    </LayoutWrapper>
  );
}
