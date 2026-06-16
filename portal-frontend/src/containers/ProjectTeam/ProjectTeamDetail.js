import { Descriptions, Breadcrumb, Avatar, Divider, List } from "antd";
import React, { useEffect, useState, useCallback } from "react";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import { useIntl } from "react-intl";
import { Box } from "./ProjectTeam.styles";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { GetTeamsById } from "../../Api/ProjectTeamApi";
import { buildApiUrl } from "../../Api/host";
import VirtualList from "rc-virtual-list";
import ProjectTeamEdit from "./ProjectTeamEdit";
import { useSelector } from "react-redux";

export default function Details() {
  const intl = useIntl();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const loggedUser = useSelector((state) => state.Auth);
  const history = useHistory();

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const layout = windowWidth < 550 ? "vertical" : "horizontal";

  const { id } = useParams();
  const [projectTeamsData, setProjectTeamsData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await GetTeamsById(id);
      setProjectTeamsData(response.data.data);
    } catch (error) {
      history.push("/dashboard/projectTeamList");
    }
  }, [id, history]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return (
    <LayoutWrapper>
      {projectTeamsData && (
        <Box style={{ marginTop: "-20px" }}>
          <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
            <Breadcrumb.Item>
              {intl.formatMessage({ id: "projectTeam.detail.breadcrumb1" })}
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              {intl.formatMessage({ id: "projectTeam.detail.breadcrumb2" })}
            </Breadcrumb.Item>
          </Breadcrumb>
          <PageHeader>{intl.formatMessage({ id: "projectTeam.detail.title" })}</PageHeader>
          <Descriptions
            bordered
            column={1}
            size="default"
            extra={
              (projectTeamsData.project.leader.id === loggedUser.id ||
                loggedUser.role.roleName === "admin") && (
                <ProjectTeamEdit
                  projectTeam={projectTeamsData}
                  refreshList={fetchData}
                />
              )
            }
            layout={layout}
            style={{ minWidth: 300 }}
            labelStyle={{ width: 185 }}
          >
            <Descriptions.Item
              label={intl.formatMessage({ id: "projectTeam.detail.label.teamName" })}
            >
              {projectTeamsData.name}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: "projectTeam.detail.label.leader" })}
            >
              <div>
                {projectTeamsData.project.leader.imageUrl ? (
                  <Avatar
                    src={buildApiUrl(projectTeamsData.project.leader.imageUrl)}
                    alt={projectTeamsData.name}
                  />
                ) : (
                  <Avatar
                    style={{
                      backgroundColor: getColorById(
                        projectTeamsData.project.leader.id
                      ),
                    }}
                    alt={projectTeamsData.project.leader.name}
                  >
                    {projectTeamsData.name.charAt(0).toUpperCase()}
                  </Avatar>
                )}

                <span style={{ marginLeft: 5 }}>
                  {projectTeamsData.project.leader.name}
                </span>
              </div>
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: "projectTeam.detail.label.projectName" })}
            >
              {projectTeamsData.project.projectName}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: "projectTeam.detail.label.description" })}
            >
              {projectTeamsData.description}
            </Descriptions.Item>
          </Descriptions>

          <Divider
            orientation="left"
            orientationMargin="20px"
            style={{ marginTop: 30 }}
          >
            {intl.formatMessage({ id: "projectTeam.detail.membersSection" })}
          </Divider>

          <List
            style={{
              border: "1px solid #ddd",
              borderRadius: 5,
            }}
          >
            <VirtualList
              style={{
                margin: "10px 20px",
              }}
              data={projectTeamsData.members}
              itemHeight={30}
            >
              {(member, index) => (
                <List.Item key={index}>
                  <List.Item.Meta
                    avatar={
                      member.imageUrl ? (
                        <Avatar
                          src={buildApiUrl(member.imageUrl)}
                        />
                      ) : (
                        <Avatar
                          style={{
                            backgroundColor: getColorById(member.id),
                          }}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </Avatar>
                      )
                    }
                    title={member.name}
                    description={member.projectRole}
                  />
                </List.Item>
              )}
            </VirtualList>
          </List>
        </Box>
      )}
    </LayoutWrapper>
  );
}
