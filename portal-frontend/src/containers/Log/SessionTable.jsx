import React, { useState, useEffect } from "react";
import { Tag, Modal, Input, Button, Select, message } from "antd";
import { GetFilteredSessions } from "../../Api/LogApi";
import TableWrapper from "../Tables/AntTables/AntTables.styles";
import Scrollbars from "react-custom-scrollbars";
import { useIntl } from "react-intl";

const { Option } = Select;

const SessionTable = () => {
    const intl = useIntl();
    const [sessions, setSessions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    const initialFilters = { userName: "", verified: "" };
    const [filters, setFilters] = useState(initialFilters);

    const [isTokenModalVisible, setIsTokenModalVisible] = useState(false);
    const [selectedToken, setSelectedToken] = useState(null);
    const [isUserAgentModalVisible, setIsUserAgentModalVisible] = useState(false);
    const [selectedUserAgent, setSelectedUserAgent] = useState(null);

    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async (page = 1) => {
        try {
            const requestData = {
                userName: filters.userName,
                verified: filters.verified === "" ? null : filters.verified === "true",
                page: page,
                limit: pageSize,
            };
            const response = await GetFilteredSessions(requestData);
            setSessions(response.data.data);
            setCurrentPage(response.data.pageNumber);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            message.error(error.response?.data?.message || intl.formatMessage({ id: "log.messages.fetchError" }));
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    const handleResetFilters = () => {
        setFilters(initialFilters);
        fetchSessions(1);
    };

    const handleApplyFilters = () => {
        fetchSessions(1);
    };

    const showTokenModal = (token) => {
        setSelectedToken(token);
        setIsTokenModalVisible(true);
    };

    const showUserAgentModal = (userAgent) => {
        setSelectedUserAgent(userAgent);
        setIsUserAgentModalVisible(true);
    };

    const handleCloseTokenModal = () => {
        setIsTokenModalVisible(false);
        setSelectedToken(null);
    };

    const handleCloseUserAgentModal = () => {
        setIsUserAgentModalVisible(false);
        setSelectedUserAgent(null);
    };

    const columns = [
        { title: intl.formatMessage({ id: "log.sessions.columns.sessionId" }), dataIndex: "id", key: "sessionId", width: 100 },
        { title: intl.formatMessage({ id: "log.sessions.columns.userId" }), dataIndex: "userId", key: "userId", width: 80 },
        { title: intl.formatMessage({ id: "log.sessions.columns.userName" }), dataIndex: "username", key: "username", width: 200 },
        {
            title: intl.formatMessage({ id: "log.sessions.columns.token" }),
            dataIndex: "token",
            key: "token",
            width: 200,
            render: (text) => (
                <span
                    onClick={() => showTokenModal(text)}
                    style={{ cursor: "pointer", color: "#7C7C7C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: "200px" }}
                >
                    {text}
                </span>
            ),
        },
        { title: intl.formatMessage({ id: "log.sessions.columns.ipAddress" }), dataIndex: "ipAddress", key: "IPAddress", width: 100 },
        {
            title: intl.formatMessage({ id: "log.sessions.columns.userAgent" }),
            dataIndex: "userAgent",
            key: "userAgent",
            width: 200,
            render: (text) => (
                <span
                    onClick={() => showUserAgentModal(text)}
                    style={{ cursor: "pointer", color: "#7C7C7C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: "200px" }}
                >
                    {text}
                </span>
            ),
        },
        {
            title: intl.formatMessage({ id: "log.sessions.columns.verified" }),
            dataIndex: "verified",
            key: "verified",
            render: (verified) => (
                <Tag style={{ borderRadius: 4 }} color={verified ? "green" : "red"}>
                    {verified ? intl.formatMessage({ id: "log.sessions.verified.true" }) : intl.formatMessage({ id: "log.sessions.verified.false" })}
                </Tag>
            ),
        },
    ];

    return (
        <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <Input
                    placeholder={intl.formatMessage({ id: "log.sessions.filters.userName" })}
                    value={filters.userName}
                    onChange={(e) => handleFilterChange("userName", e.target.value)}
                    style={{ width: "200px" }}
                />
                <Select
                    placeholder={intl.formatMessage({ id: "log.sessions.filters.verified" })}
                    value={filters.verified}
                    onChange={(value) => handleFilterChange("verified", value)}
                    style={{ width: "150px" }}
                >
                    <Option value="">{intl.formatMessage({ id: "log.common.all" })}</Option>
                    <Option value="true">{intl.formatMessage({ id: "log.sessions.verified.true" })}</Option>
                    <Option value="false">{intl.formatMessage({ id: "log.sessions.verified.false" })}</Option>
                </Select>
                <Button type="primary" onClick={handleApplyFilters}>{intl.formatMessage({ id: "log.common.filter" })}</Button>
                <Button type="default" onClick={handleResetFilters}>{intl.formatMessage({ id: "log.common.reset" })}</Button>
            </div>

            <Scrollbars style={{ width: "100%", height: "calc(100vh - 10px)" }}>
                <TableWrapper
                    dataSource={sessions}
                    columns={columns}
                    pagination={{
                        showSizeChanger: false,
                        current: currentPage,
                        pageSize: pageSize,
                        total: totalPages * pageSize,
                        onChange: (page) => { fetchSessions(Number(page)) },
                    }}
                    className="logListTable"
                />
            </Scrollbars>

            <Modal title={intl.formatMessage({ id: "log.sessions.modals.tokenTitle" })} open={isTokenModalVisible} onCancel={handleCloseTokenModal} footer={null} width={600}>
                <span style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: "400px", overflowY: "auto" }}>
                    {selectedToken || intl.formatMessage({ id: "log.common.noData" })}
                </span>
            </Modal>

            <Modal title={intl.formatMessage({ id: "log.sessions.modals.userAgentTitle" })} open={isUserAgentModalVisible} onCancel={handleCloseUserAgentModal} footer={null} width={600}>
                <span style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: "400px", overflowY: "auto" }}>
                    {selectedUserAgent || intl.formatMessage({ id: "log.common.noData" })}
                </span>
            </Modal>
        </>
    );
};

export default SessionTable;
