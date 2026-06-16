import React from "react";
import {
    Space,
    Breadcrumb,
    Tabs,
} from "antd";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import { Box } from "./Logs.styles";
import IntlMessages from "@iso/components/utility/intlMessages";
import UserActivitiesTable from "./UserActivitiesTable";
import SessionTable from "./SessionTable";
import ErrorTable from "./ErrorTable";
import UserRegistrationsTable from "./UserRegistrationsTable";
import { useIntl } from "react-intl";

const Logs = () => {
    const intl = useIntl();

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
                            <IntlMessages id="sidebar.logs" />
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <IntlMessages id="sidebar.logsList" />
                        </Breadcrumb.Item>
                    </Breadcrumb>
                </Space>

                <PageHeader>
                    <IntlMessages id="sidebar.logs" />
                </PageHeader>

                <Tabs
                    defaultActiveKey="1"
                    items={[
                        { key: "1", label: intl.formatMessage({ id: "log.tabs.userActivities" }), children: <UserActivitiesTable /> },
                        { key: "2", label: intl.formatMessage({ id: "log.tabs.sessions" }), children: <SessionTable /> },
                        { key: "3", label: intl.formatMessage({ id: "log.tabs.errors" }), children: <ErrorTable /> },
                        { key: "4", label: intl.formatMessage({ id: "log.tabs.userRegistrations" }), children: <UserRegistrationsTable /> },
                    ]}
                />
            </Box>
        </LayoutWrapper>
    );

};

export default Logs;
