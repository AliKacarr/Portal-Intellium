import {
  Badge,
  Descriptions,
  Breadcrumb,
  Avatar,
  Card,
  Divider,
  Row,
  Col,
  Space,
} from "antd";
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import { useIntl } from "react-intl";
import { Box } from "./project.styles";
import moment from "moment";
import ProjectEdit from "./projectEdit";
import { GetById } from "../../Api/ProjectApi";
import { GetAllByProject } from "../../Api/ProjectTeamApi";
import { buildApiUrl } from "../../Api/host";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";

const ResponsiveContainer = styled.div`
  background-color: #f7f7f7;
  padding: 20px;

  @media (max-width: 768px) {
    padding: 10px;
  }

  @media (max-width: 480px) {
    padding: 5px;
  }
`;

export default function Details() {
  const intl = useIntl();
  const currentUser = useSelector((state) => state.Auth);
  const { id } = useParams();
  const [projectData, setProjectData] = useState(null);
  const [teamData, setTeamData] = useState([]);
  const history = useHistory();

  const fetchData = useCallback(async () => {
    try {
      const response = await GetById(id);
      setProjectData(response.data.data);
    } catch (error) {
      history.push("/dashboard/projectList");
    }
  }, [id, history]);

  const getTeamData = useCallback(async () => {
    try {
      const response = await GetAllByProject(id);
      setTeamData(response.data.data);
    } catch (error) {
      console.error("Error fetching project details:", error);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    getTeamData();
  }, [fetchData, getTeamData]);

  const cardPadding = (() => {
    if (window.innerWidth <= 480) {
      return "10px";
    } else if (window.innerWidth <= 768) {
      return "15px";
    } else {
      return "20px";
    }
  })();

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
      {projectData && (
        <Box style={{ marginTop: "-20px" }}>
          <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
            <Breadcrumb.Item>
              {intl.formatMessage({ id: "project.detail.breadcrumb1" })}
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              {intl.formatMessage({ id: "project.detail.breadcrumb2" })}
            </Breadcrumb.Item>
          </Breadcrumb>
          <PageHeader>{intl.formatMessage({ id: "project.detail.title" })}</PageHeader>

          <Descriptions
            bordered
            size="small"
            column={{
              xs: 1,
              sm: 1,
              md: 1,
              lg: 2,
              xl: 2,
            }}
            extra={
              (currentUser.role.roleName === "admin" ||
                currentUser.id === projectData.projectLeader.id) && (
                <ProjectEdit
                  projectData={projectData}
                  refreshDetail={fetchData}
                />
              )
            }
          >
            <>
              <Descriptions.Item
                label={intl.formatMessage({ id: "project.detail.label.name" })}
                span={2}
              >
                {projectData.projectName}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({ id: "project.detail.label.category" })}
              >
                {projectData.projectType.projectTypeName}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({ id: "project.detail.label.customer" })}
              >
                {projectData.customer.customerName}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({ id: "project.detail.label.leader" })}
              >
                {projectData.projectLeader.name}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({ id: "project.detail.label.status" })}
              >
                {!projectData.isActive ? (
                  <Badge
                    status="processing"
                    text={intl.formatMessage({ id: "project.status.ongoing" })}
                  />
                ) : (
                  <Badge
                    status="success"
                    text={intl.formatMessage({ id: "project.status.completed" })}
                  />
                )}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({ id: "project.detail.label.start" })}
              >
                {moment(projectData.startDate).format("DD.MM.YYYY")}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({ id: "project.detail.label.end" })}
              >
                {moment(projectData.finishDate).format("DD.MM.YYYY")}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({ id: "project.detail.label.description" })}
                span={2}
              >
                {projectData.description}
              </Descriptions.Item>
            </>
          </Descriptions>

          {teamData.length > 0 && (
            <>
              <Divider orientation="left" orientationMargin={20}>
                {intl.formatMessage({ id: "project.detail.teamSection" })}
              </Divider>
              <ResponsiveContainer>
                <Row gutter={[24, 24]}>
                  {teamData.map((team) => (
                    <Col span={8} xs={24} sm={24} md={24} lg={12} xl={8} key={team.id}>
                      <Card
                        title={team.name}
                        bordered={false}
                        style={{ borderRadius: 10 }}
                        bodyStyle={{
                          padding: cardPadding,
                        }}
                      >
                        {team.members.map((user) => (
                          <Space
                            key={user.id}
                            direction="vertical"
                            size="small"
                            style={{ display: "flex" }}
                          >
                            <Badge.Ribbon
                              text={user.projectRole}
                              color="#93B1A6"
                              style={{
                                fontSize: 12,
                              }}
                            >
                              <Space.Compact>
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

                                <span style={{ margin: 5 }}> {user.name}</span>
                              </Space.Compact>
                            </Badge.Ribbon>
                          </Space>
                        ))}
                      </Card>
                    </Col>
                  ))}
                </Row>
              </ResponsiveContainer>
            </>
          )}
        </Box>
      )}
    </LayoutWrapper>
  );
}
