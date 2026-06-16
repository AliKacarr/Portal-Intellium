import React, { useState, useEffect } from "react";
import { Input, Tooltip, Modal, Button, message } from "antd";
import { GetFilteredErrors } from "../../Api/LogApi";
import TableWrapper from "../Tables/AntTables/AntTables.styles";
import Scrollbars from "react-custom-scrollbars";
import { useIntl } from "react-intl";

const ErrorTable = () => {
    const intl = useIntl();
    const [errors, setErrors] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const pageSize = 10;
    const [typeFilter, setTypeFilter] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);

    useEffect(() => {
        fetchErrors();
    }, []);

    const fetchErrors = async (page = 1) => {
        try {
            const requestData = {
                type: typeFilter,
                page: page,
                limit: pageSize,
            };
            const response = await GetFilteredErrors(requestData);
            setErrors(response.data.data);
            setCurrentPage(response.data.pageNumber);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            message.error(error.response?.data?.message || intl.formatMessage({ id: "log.messages.fetchError" }));
        }
    };

    const handleFilterChange = (e) => {
        setTypeFilter(e.target.value);
    };

    const handleApplyFilter = () => {
        fetchErrors(1);
    };

    const handleResetFilter = async () => {
        setTypeFilter("");
        await fetchErrors(1);
    };

    const showMessageModal = (message) => {
        setSelectedMessage(message);
        setIsModalVisible(true);
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedMessage(null);
    };

    const columns = [
        { title: intl.formatMessage({ id: "log.errors.columns.errorId" }), dataIndex: "id", key: "errorId", width: 100 },
        { title: intl.formatMessage({ id: "log.errors.columns.type" }), dataIndex: "type", key: "type", width: 200 },
        {
            title: intl.formatMessage({ id: "log.errors.columns.message" }),
            dataIndex: "message",
            key: "message",
            render: (message) => (
                <span
                    onClick={() => showMessageModal(message)}
                    style={{ cursor: "pointer", color: "#7C7C7C", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: "300px" }}
                >
                    {message}
                </span>
            ),
        },
        {
            title: intl.formatMessage({ id: "log.errors.columns.stackTraceId" }),
            dataIndex: "stackTraceId",
            key: "stackTraceId",
            width: 100,
            render: (stackTrace) => (
                <Tooltip title={stackTrace}>
                    <span>{stackTrace}</span>
                </Tooltip>
            ),
        },
        { title: intl.formatMessage({ id: "log.errors.columns.activityId" }), dataIndex: "activityId", key: "activityId" },
    ];

    return (
        <>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                <Input
                    placeholder={intl.formatMessage({ id: "log.errors.filters.errorType" })}
                    value={typeFilter}
                    onChange={handleFilterChange}
                    style={{ width: "200px" }}
                />
                <Button type="primary" onClick={handleApplyFilter}>{intl.formatMessage({ id: "log.common.filter" })}</Button>
                <Button type="default" onClick={handleResetFilter}>{intl.formatMessage({ id: "log.common.reset" })}</Button>
            </div>

            <Scrollbars style={{ width: "100%", height: "calc(100vh - 10px)" }}>
                <TableWrapper
                    dataSource={errors}
                    columns={columns}
                    pagination={{
                        showSizeChanger: false,
                        current: currentPage,
                        pageSize: pageSize,
                        total: totalPages * pageSize,
                        onChange: (page) => { fetchErrors(Number(page)) },
                    }}
                    className="logListTable"
                />
            </Scrollbars>

            <Modal
                title={intl.formatMessage({ id: "log.errors.modals.errorMessageTitle" })}
                open={isModalVisible}
                onCancel={handleCloseModal}
                footer={null}
                width={600}
            >
                <span style={{ whiteSpace: "pre-wrap", wordWrap: "break-word", maxHeight: "400px", overflowY: "auto" }}>
                    {selectedMessage || intl.formatMessage({ id: "log.errors.modals.noMessage" })}
                </span>
            </Modal>
        </>
    );
};

export default ErrorTable;
