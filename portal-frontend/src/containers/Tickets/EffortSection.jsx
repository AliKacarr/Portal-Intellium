import React, { useEffect, useState } from "react";
import { Button, Card, Popconfirm, Table, Tag } from "antd";
import moment from "moment";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import AddEffortButton from "./AddEffortButton";
import { DeleteTicketEffort, GetAllEffortByTicketById } from "../../Api/TicketEffortApi";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";

const EffortSection = ({ ticketId, isModalOpen, setIsModalOpen, assignedUserId }) => {
  const intl = useIntl();
  const [effortData, setEffortData] = useState([]);
  const loggedUser = useSelector((state) => state.Auth);

  const canSeeActions =
    loggedUser?.role?.roleName === "admin" || loggedUser?.id === assignedUserId;


  const getAllEfforts = async () => {
    try {
      const response = await GetAllEffortByTicketById(ticketId);
      setEffortData(response.data.data);
    } catch (error) { }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (loggedUser.role.roleName === "admin" ||
      loggedUser.id === assignedUserId) {
      getAllEfforts();
    }
  }, [ticketId]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const handleDeleteEffort = async (ticketEffortId) => {
    try {
      await DeleteTicketEffort(ticketEffortId);

      setEffortData((prevEfforts) => prevEfforts.filter(effort => effort.id !== ticketEffortId));

    } catch (error) {
      console.error("Silme işlemi başarısız:", error);
    }
  };
  const columns = [
    {
      title: intl.formatMessage({ id: "tickets.effort.table.date" }),
      dataIndex: "createdAt",
      align: "center",
      width: "150px",
      key: "date",
      render: (createdAt) => (
        <span>{moment(createdAt).format("DD.MM.YYYY")}</span>
      ),
      sorter: (a, b) =>
        moment(b.date, "DD.MM.YYYY").diff(moment(a.date, "DD.MM.YYYY")),
    },
    {
      title: intl.formatMessage({ id: "tickets.effort.table.time" }),
      dataIndex: "createdAt",
      align: "center",
      width: "100px",
      key: "time",
      render: (createdAt) => (
        <Tag icon={<ClockCircleOutlined />}>
          {moment(createdAt).format("HH:mm")}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({ id: "tickets.effort.table.description" }),
      align: "center",
      dataIndex: "description",
      key: "description",
    },
    {
      title: intl.formatMessage({ id: "tickets.effort.table.minutes" }),
      align: "center",
      width: "100px",
      dataIndex: "effortMinutes",
      key: "effort",
    },
    {
      title: intl.formatMessage({ id: "tickets.effort.table.billable" }),
      width: "150px",
      align: "center",
      dataIndex: "isBillable",
      key: "billable",
      render: (billable) =>
        billable ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>
            {intl.formatMessage({ id: "tickets.effort.table.billableYes" })}
          </Tag>
        ) : (
          <Tag color="default" icon={<MinusCircleOutlined />}>
            {intl.formatMessage({ id: "tickets.effort.table.billableNo" })}
          </Tag>
        ),
    },
    ...(canSeeActions
      ? [
        {
          title: intl.formatMessage({ id: "tickets.effort.table.actions" }),
          key: "actions",
          width: 100,
          align: "center",
          render: (_, record) => (
            <div style={{ display: "flex", gap: "8px" }}>
              <Popconfirm
                title={intl.formatMessage({
                  id: "tickets.effort.table.deleteConfirm",
                })}
                okText={intl.formatMessage({
                  id: "tickets.effort.table.deleteOk",
                })}
                cancelText={intl.formatMessage({
                  id: "tickets.effort.table.deleteCancel",
                })}
                onConfirm={() => handleDeleteEffort(record.id)}
              >
                <Button danger type="text" className="projectDltBtn" title="">
                  <i className="ion-android-delete" />
                </Button>
              </Popconfirm>
            </div>
          ),
        },
      ]
      : []),
  ];

  return (
    <>
      <AddEffortButton
        ticketId={ticketId}
        setEffortData={setEffortData}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />

      {(effortData.length > 0 && (loggedUser.role.roleName === "admin" ||
        loggedUser.id === assignedUserId)) && (
          <Card
            title={intl.formatMessage({ id: "tickets.effort.cardTitle" })}
            size="small"
            style={{ margin: "20px 0", width: "100%" }}
          >
            <Table
              size="small"
              columns={columns}
              dataSource={effortData}
              pagination={false}
              bordered
            />
          </Card>
        )}
    </>
  );
};

export default EffortSection;
