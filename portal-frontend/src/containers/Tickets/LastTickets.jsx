import React, { useEffect, useState } from "react";
import { Box } from "./Ticket.styles";
import { Avatar, Button, Space, Table, Tag, Tooltip, Badge } from "antd";
import PageHeader from "@iso/components/utility/pageHeader";
import {
    GetLastTickets,
} from "../../Api/TicketApi";
import moment from "moment";
import "moment/locale/tr";
import { FileSearchOutlined } from "@ant-design/icons";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useIntl } from "react-intl";
import { buildApiUrl } from "../../Api/host";

moment.locale("tr");

const { Column } = Table;

const LastTickets = ({ refreshList, onRefreshList }) => {
    const intl = useIntl();
    const [ticketData, setTicketData] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    /* eslint-disable react-hooks/exhaustive-deps */
    useEffect(() => {
        if (refreshList) {
            fetchData();
            onRefreshList();
        }
    }, [refreshList]);
    /* eslint-enable react-hooks/exhaustive-deps */

    const history = useHistory();
    const handleRowClick = (row) => {
        history.push(`/dashboard/ticketDetail/${row}`);
    };

    function safelyParseJSON(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            return [];
        }
    }

    const fetchData = async () => {
        try {
            let response = await GetLastTickets(4);

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

    return (
        <Box>
            <PageHeader>{intl.formatMessage({ id: "tickets.last.title" })}</PageHeader>

            <Table
                size="small"
                style={{
                    margin: "20px 0px",
                }}
                dataSource={ticketData}
                scroll={{
                    x: 750,
                }}
                pagination={false}
            >
                <Column
                    align="center"
                    title={intl.formatMessage({ id: "tickets.columns.id" })}
                    dataIndex="id"
                    key="id"
                    width={30}
                />
                <Column
                    title={intl.formatMessage({ id: "tickets.columns.name" })}
                    key="name"
                    width={180}
                    dataIndex="name"
                />
                <Column
                    align="center"
                    title={intl.formatMessage({ id: "tickets.columns.requestType" })}
                    key="requestType"
                    width={120}
                    dataIndex="requestType"
                    render={(requestType) => {
                        const parsedRequestType = safelyParseJSON(requestType);
                        const unspecifiedLabel = (
                            <span style={{ color: "#888", fontSize: 12 }}>
                                {intl.formatMessage({ id: "tickets.last.requestType.unspecified" })}
                            </span>
                        );
                        if (!parsedRequestType.length) {
                            return unspecifiedLabel;
                        }
                        return parsedRequestType.map((type, index) => (
                            <Tag
                                key={index}
                                style={{ minWidth: 70, borderRadius: 3, margin: 4 }}
                                bordered={false}
                                color={requestColor(type)}
                            >
                                {type}
                            </Tag>
                        ));
                    }}
                />

                <Column
                    title={intl.formatMessage({ id: "tickets.columns.project" })}
                    dataIndex="project"
                    key="project"
                    width={120}
                    render={(project) => <span> {project.projectName} </span>}
                />
                <Column
                    align="center"
                    title={intl.formatMessage({ id: "tickets.columns.creationDate" })}
                    dataIndex="creationDate"
                    key="creationDate"
                    render={(creationDate) => (
                        <Tooltip title={moment(creationDate).format("HH:mm")}>
                            <span>{moment(creationDate).format("DD MMMM YYYY")}</span>
                        </Tooltip>
                    )}
                    width={100}
                />

                <Column
                    align="center"
                    title={intl.formatMessage({ id: "tickets.columns.status" })}
                    dataIndex="status"
                    key="status"
                    width={80}
                    render={(status) => (
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
                    )}
                />

                <Column
                    align="center"
                    title={intl.formatMessage({ id: "tickets.columns.assignedUser" })}
                    width={40}
                    dataIndex="assignedUser"
                    key="assignedUser"
                    render={(assignedUser) =>
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
                                    style={{
                                        backgroundColor: getColorById(assignedUser.id), // Fonksiyonun döndürdüğü değer
                                    }}
                                >
                                    {assignedUser.name.charAt(0).toUpperCase()}
                                </Avatar>
                            </Tooltip>
                        ) : null
                    }
                />
                <Column
                    align="center"
                    width={50}
                    key="action"
                    render={(text, record) => (
                        <Space>
                            <Button type="text" onClick={() => handleRowClick(record.id)}>
                                <FileSearchOutlined />
                            </Button>
                        </Space>
                    )}
                />
            </Table>
        </Box>
    );
};

export default LastTickets;
