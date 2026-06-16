import React, { useEffect, useState } from "react";
import { Tag, Tooltip, Modal, Input, Button, DatePicker, Select, message } from "antd";
import moment from "moment";
import { GetFilteredActivities } from "../../Api/LogApi";
import TableWrapper from "../Tables/AntTables/AntTables.styles";
import Scrollbars from "react-custom-scrollbars";
import { useIntl } from "react-intl";

const { RangePicker } = DatePicker;
const { Option } = Select;

const UserActivitiesTable = () => {
    const intl = useIntl();
    const [logs, setLogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;

    const initialFilters = { requestUrl: "", dateRange: [], statusCode: "" };
    const [filters, setFilters] = useState(initialFilters);

    const [isPayloadModalVisible, setIsPayloadModalVisible] = useState(false);
    const [selectedPayload, setSelectedPayload] = useState(null);
    const [isResponseModalVisible, setIsResponseModalVisible] = useState(false);
    const [selectedResponse, setSelectedResponse] = useState(null);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async (page = 1) => {
        try {
            const requestData = {
                requestUrl: filters.requestUrl,
                startDate: filters.dateRange[0] ? filters.dateRange[0].format("YYYY-MM-DD") : null,
                endDate: filters.dateRange[1] ? filters.dateRange[1].format("YYYY-MM-DD") : null,
                statusCode: filters.statusCode ? Number(filters.statusCode) : null,
                page: page,
                limit: pageSize,
            };
            const response = await GetFilteredActivities(requestData);
            setLogs(response.data.data);
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
    };

    const handleApplyFilters = () => {
        fetchLogs(1);
    };

    const showPayloadModal = (payload) => {
        setSelectedPayload(payload);
        setIsPayloadModalVisible(true);
    };

    const showResponseModal = (response) => {
        setSelectedResponse(response);
        setIsResponseModalVisible(true);
    };

    const columns = [
        { title: intl.formatMessage({ id: "log.userActivities.columns.activityId" }), dataIndex: "id", key: "activityId", width: 100 },
        { title: intl.formatMessage({ id: "log.userActivities.columns.sessionId" }), dataIndex: "sessionId", key: "sessionId", width: 100 },
        { title: intl.formatMessage({ id: "log.userActivities.columns.requestUrl" }), dataIndex: "requestUrl", key: "requestUrl", width: 200 },
        {
            title: intl.formatMessage({ id: "log.userActivities.columns.payload" }),
            dataIndex: "payload",
            key: "payload",
            width: 200,
            render: (payload) => (
                <span
                    onClick={() => showPayloadModal(payload)}
                    style={{ cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: "350px", color: "#7C7C7C" }}
                >
                    {payload}
                </span>
            ),
        },
        {
            title: intl.formatMessage({ id: "log.userActivities.columns.time" }),
            dataIndex: "time",
            key: "time",
            width: 100,
            render: (time) => (
                <Tooltip title={moment(time).format("HH:mm")}>
                    <span>{moment(time).format("DD.MM.YYYY")}</span>
                </Tooltip>
            ),
        },
        {
            title: intl.formatMessage({ id: "log.userActivities.columns.statusCode" }),
            dataIndex: "statusCode",
            key: "statusCode",
            width: 100,
            render: (status) => (
                <Tag style={{ borderRadius: 4 }} color={(status >= 200 && status < 400) ? "green" : "red"}>{status}</Tag>
            ),
        },
        {
            title: intl.formatMessage({ id: "log.userActivities.columns.response" }),
            dataIndex: "response",
            key: "response",
            width: 200,
            render: (response) => (
                <span
                    onClick={() => showResponseModal(response)}
                    style={{ cursor: "pointer", color: "#7C7C7C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: "280px" }}
                >
                    {response}
                </span>
            ),
        },
    ];

    return (
        <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <Input
                    placeholder={intl.formatMessage({ id: "log.userActivities.filters.requestUrl" })}
                    value={filters.requestUrl}
                    onChange={(e) => handleFilterChange("requestUrl", e.target.value)}
                    style={{ width: "200px" }}
                />
                <RangePicker
                    value={filters.dateRange}
                    onChange={(dates) => {
                        if (dates) {
                            handleFilterChange("dateRange", dates);
                        } else {
                            handleFilterChange("dateRange", []);
                        }
                    }}
                    allowClear={true}
                />
                <Select
                    placeholder={intl.formatMessage({ id: "log.userActivities.filters.statusCode" })}
                    value={filters.statusCode}
                    onChange={(value) => handleFilterChange("statusCode", value)}
                    style={{ width: "150px" }}
                >
                    <Option value="">{intl.formatMessage({ id: "log.common.all" })}</Option>
                    <Option value="200">200</Option>
                    <Option value="400">400</Option>
                    <Option value="500">500</Option>
                </Select>
                <Button type="primary" onClick={handleApplyFilters}>{intl.formatMessage({ id: "log.common.filter" })}</Button>
                <Button type="default" onClick={handleResetFilters}>{intl.formatMessage({ id: "log.common.reset" })}</Button>
            </div>

            <Scrollbars style={{ width: "100%", height: "calc(100vh - 10px)" }}>
                <TableWrapper
                    dataSource={logs}
                    columns={columns}
                    rowKey={(record) => record?.id ?? `${record?.sessionId ?? "s"}-${record?.time ?? "t"}-${record?.requestUrl ?? "u"}`}
                    pagination={{
                        showSizeChanger: false,
                        current: currentPage,
                        pageSize: pageSize,
                        total: totalPages * pageSize,
                        onChange: (page) => { fetchLogs(Number(page)) },
                    }}
                    className="logListTable"
                />
            </Scrollbars>

            <Modal title={intl.formatMessage({ id: "log.userActivities.modals.payloadTitle" })} open={isPayloadModalVisible} onCancel={() => setIsPayloadModalVisible(false)} footer={null} width={600}>
                <span style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: "400px", overflowY: "auto" }}>
                    {selectedPayload ? JSON.stringify(JSON.parse(selectedPayload), null, 2) : intl.formatMessage({ id: "log.common.noData" })}
                </span>
            </Modal>

            <Modal title={intl.formatMessage({ id: "log.userActivities.modals.responseTitle" })} open={isResponseModalVisible} onCancel={() => setIsResponseModalVisible(false)} footer={null} width={600}>
                <span style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: "400px", overflowY: "auto" }}>
                    {selectedResponse ? JSON.stringify(JSON.parse(selectedResponse), null, 2) : intl.formatMessage({ id: "log.common.noData" })}
                </span>
            </Modal>
        </>
    );
};

export default UserActivitiesTable;
