import React from "react";
import { Breadcrumb, Col, Row, Tabs } from "antd";
import { useIntl } from "react-intl";
import LayoutWrapper from "@iso/components/utility/layoutWrapper.js";
import PageHeader from "@iso/components/utility/pageHeader";
import { Box } from "../Project/project.styles";
import "./ParameterManagement.css";
import LabelsComponent from "./components/Labels";
import BoardCategoriesComponent from "./components/BoardCategories";
import ProjectTypesComponent from "./components/ProjectTypes";
import PermissionTypesComponent from "./components/PermissionTypes";
import NewsCategoriesComponent from "./components/NewsCategories";
import AgreementTextsComponent from "./components/AgreementTexts";
import RequestParametersComponent from "./components/RequestParameters";

export default function ParameterManagement() {
  const intl = useIntl();

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }} className="breadcrumb">
          <Breadcrumb.Item>
            {intl.formatMessage({ id: "parametre.breadcrumb.dashboard" })}
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            {intl.formatMessage({ id: "parametre.breadcrumb.parameters" })}
          </Breadcrumb.Item>
        </Breadcrumb>
        <PageHeader>{intl.formatMessage({ id: "parametre.pageHeader" })}</PageHeader>
        <Tabs
          className="parametre-tabs"
          defaultActiveKey="1"
          size="small"
          style={{ marginTop: "16px" }}
          items={[
            {
              key: "1",
              label: intl.formatMessage({ id: "parametre.tabs.scrumBoard" }),
              children: (
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <LabelsComponent />
                  </Col>
                  <Col xs={24} md={12}>
                    <BoardCategoriesComponent />
                  </Col>
                </Row>
              ),
            },
            {
              key: "2",
              label: intl.formatMessage({ id: "parametre.tabs.project" }),
              children: (
                <Row gutter={[24, 24]}>
                  <Col xs={24} md={12}>
                    <ProjectTypesComponent />
                  </Col>
                </Row>
              ),
            },
            {
              key: "3",
              label: intl.formatMessage({ id: "parametre.tabs.permissionParams" }),
              children: (
                <Row gutter={[24, 24]}>
                  <Col xs={24}>
                    <PermissionTypesComponent />
                  </Col>
                </Row>
              ),
            },
            {
              key: "4",
              label: intl.formatMessage({ id: "parametre.tabs.newsParams" }),
              children: (
                <Row gutter={[24, 24]}>
                  <Col xs={24}>
                    <NewsCategoriesComponent />
                  </Col>
                </Row>
              ),
            },
            {
              key: "5",
              label: "KVKK ve Rıza Metinleri",
              children: (
                <Row gutter={[24, 24]}>
                  <Col xs={24}>
                    <AgreementTextsComponent />
                  </Col>
                </Row>
              ),
            },
            {
              key: "6",
              label: "Talep Parametreleri",
              children: (
                <Row gutter={[24, 24]}>
                  <Col xs={24}>
                    <RequestParametersComponent />
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Box>
    </LayoutWrapper>
  );
}
