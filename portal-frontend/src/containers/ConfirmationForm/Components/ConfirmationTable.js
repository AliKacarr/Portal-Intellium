import React from "react";
import moment from "moment";
import { useIntl } from "react-intl";
import { Table, Space, Dropdown, Button, Badge, Avatar } from "antd";
import { buildApiUrl } from "../../../Api/host";
import { EllipsisOutlined, InfoCircleOutlined, EditOutlined, StopOutlined } from "@ant-design/icons";

// --- İZİN İSİMLENDİRME SÖZLÜĞÜ ---
const PERMISSION_NAMES = {
  "mazeret1": "confirmationForm.permissionNames.marriage",
  "mazeret2": "confirmationForm.permissionNames.death",
  "mazeret3": "confirmationForm.permissionNames.sickLeave",
  "mazeret4": "confirmationForm.permissionNames.milkLeave",
  "mazeret5": "confirmationForm.permissionNames.hourlyLeave",
  "mazeret6": "confirmationForm.permissionNames.maternityLeave",
  "Ücretli": "confirmationForm.permissionNames.paidLeave",
  "Ücretsiz": "confirmationForm.permissionNames.unpaidLeave"
};

const ConfirmationTable = ({
  data,
  setWillBeShowDetails,
  openDetailsDrawer,
  onEdit,
  onCancel,
}) => {
  const intl = useIntl();
  
  function getColorById(id) {
    const customColors = ["#6895D2","#A4CE95","#D04848","#F3B95F","#FDE767"];
    const index = id % customColors.length;
    return customColors[index];
  }

  const personelColumns = [
    {
      title: intl.formatMessage({ id: "confirmationForm.table.employee" }),
      dataIndex: ["user", "name"], 
      key: "userName",
      sorter: (a, b) => (a.user?.name || "").localeCompare(b.user?.name || ""),
      render: (text, record) => {
        const userName = record.user?.name || intl.formatMessage({ id: "confirmationForm.labels.unknown" });
        const userId = record.user?.id || 0;
        const userImage = record.user?.imageUrl;

        return (
            <Space>
            {userImage ? (
                <Avatar src={buildApiUrl(userImage)} />
            ) : (
                <Avatar style={{ backgroundColor: getColorById(userId) }}>
                {userName.charAt(0).toUpperCase()}
                </Avatar>
            )}
            <span style={{ margin: 5 }}>{userName}</span>
            </Space>
        );
      },
    },
    {
      title: intl.formatMessage({ id: "confirmationForm.table.permissionType" }),
      dataIndex: "permissionTypeDisplayName",
      sorter: (a, b) => a.permissionType.localeCompare(b.permissionType),
      render: (text, record) => {
        const permissionKey = PERMISSION_NAMES[record.permissionType];
        return text || (permissionKey ? intl.formatMessage({ id: permissionKey }) : record.permissionType);
      }
    },
    {
      title: intl.formatMessage({ id: "confirmationForm.table.start" }),
      dataIndex: "startTime",
      sorter: (a, b) => a.startTime.localeCompare(b.startTime),
      render: (date) => <span>{moment(date).format("DD.MM.YYYY")}</span>,
    },
    {
      title: intl.formatMessage({ id: "confirmationForm.table.end" }),
      dataIndex: "endTime",
      sorter: (a, b) => a.endTime.localeCompare(b.endTime),
      render: (date) => <span>{moment(date).format("DD.MM.YYYY")}</span>,
    },
    {
      title: intl.formatMessage({ id: "confirmationForm.table.status" }),
      dataIndex: "status",
      key: "status",
      sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
      render: (_, record) => {
        let color = "default";
        let text = record.status;

        if (record.status === "Pending") {
            color = "gold"; 
            text = intl.formatMessage({ id: "confirmationForm.status.pending" });
        } else if (record.status === "Confirmed") {
            color = "green"; 
            text = intl.formatMessage({ id: "confirmationForm.status.confirmed" });
        } else if (record.status === "Declined") {
            color = "red"; 
            text = intl.formatMessage({ id: "confirmationForm.status.declined" });
        }

        return <Badge color={color} status="success" text={text} />;
      },
    },
    {
      title: intl.formatMessage({ id: "confirmationForm.table.action" }),
      align: "center",
      render: (_, record) => {
        
        // Dropdown menüsünü oluştur
        const menuItems = [
            {
                key: "1",
                label: (
                    <div onClick={() => {
                        setWillBeShowDetails(record);
                        openDetailsDrawer(true);
                    }} style={{ display: 'flex', alignItems: 'center' }}>
                        <InfoCircleOutlined style={{ marginRight: 8 }} /> {intl.formatMessage({ id: "confirmationForm.actions.detail" })}
                    </div>
                )
            }
        ];

        // EĞER "ONAY BEKLİYOR" İSE VE "ONEDIT" FONKSİYONU GELDİYSE "DÜZENLE"Yİ EKLE
        if (record.status === "Pending" && onEdit) {
            menuItems.push({
                key: "2",
                label: (
                    <div onClick={() => onEdit(record)} style={{ display: 'flex', alignItems: 'center' }}>
                        <EditOutlined style={{ marginRight: 8 }} /> {intl.formatMessage({ id: "confirmationForm.actions.edit" })}
                    </div>
                )
            });
        }

        if (record.status === "Pending" && onCancel) {
            menuItems.push({
                key: "3",
                danger: true,
                label: (
                    <div onClick={() => onCancel(record)} style={{ display: 'flex', alignItems: 'center' }}>
                        <StopOutlined style={{ marginRight: 8 }} /> {intl.formatMessage({ id: "confirmationForm.actions.cancel" })}
                    </div>
                )
            });
        }

        return (
            <Dropdown menu={{ items: menuItems }} placement="bottom">
                <Button type="text" icon={<EllipsisOutlined />} />
            </Dropdown>
        );
      },
    },
  ];

  return (
    <Space style={{ width: "100%" }} direction="vertical">
      <Table
        rowKey="id"
        pagination={{
          style: { marginTop: "2rem" },
          position: ["bottomRight"],
          defaultPageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20"],
        }}
        columns={personelColumns}
        dataSource={data}
      />
    </Space>
  );
};

export default ConfirmationTable;