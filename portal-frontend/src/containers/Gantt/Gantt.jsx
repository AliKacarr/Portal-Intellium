import React from "react";
import "gantt-task-react/dist/index.css";
import { Breadcrumb } from "antd";
import LayoutWrapper from "@iso/components/utility/layoutWrapper.js";
import Box from "@iso/components/utility/box";
import PageHeader from "@iso/components/utility/pageHeader";
import IntlMessages from "@iso/components/utility/intlMessages";
import GanttChart from "../../components/GanttComponent/Gantt";

const Gantt = () => {
  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item><IntlMessages id="gantt.home" /></Breadcrumb.Item>
          <Breadcrumb.Item><IntlMessages id="gantt.chart" /></Breadcrumb.Item>
        </Breadcrumb>
        <PageHeader>
          <IntlMessages id="sidebar.gantt" />
        </PageHeader>
        <GanttChart />
      </Box>
    </LayoutWrapper>
  );
};

export default Gantt;
