import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import IntlMessages from "@iso/components/utility/intlMessages";
import React, { useEffect, useState, useMemo } from "react";
import { Breadcrumb, Tag, Modal, message, Button, Select, Row, Col, Space, Card } from "antd";
import { ExclamationCircleFilled, PlusOutlined, CalendarOutlined, CheckOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { Box } from "./holidays-style";
import TableWrapper from "../Tables/AntTables/AntTables.styles";
import AddHoliday from "./AddHoliday";
import { GetAllHoliday, DeleteHoliday } from "../../Api/HolidayApi"; 
import moment from "moment";
import "moment/locale/tr";
import { useIntl } from "react-intl";

moment.locale("tr");

const { confirm } = Modal;
const { Option } = Select;

const Holidays = () => {
  const intl = useIntl();
  const [dataSource, setDataSource] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  
  // Varsayılan olarak şu anki yılı seçili getir
  const [selectedYear, setSelectedYear] = useState(moment().year());
  
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);

  // --- MEVCUT YILLARI HESAPLA ---
  const availableYears = useMemo(() => {
    const yearsSet = new Set([moment().year()]); 
    yearsSet.add(moment().year() + 1); // Gelecek yıl da olsun

    dataSource.forEach(item => {
        if (item.startTime) yearsSet.add(moment(item.startTime).year());
    });
    
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [dataSource]);

  useEffect(() => {
    fetchData();
  }, []);

  // Yıl değişince filtrele
  useEffect(() => {
      if(!dataSource) return;
      const filtered = dataSource.filter(item => moment(item.startTime).year() === selectedYear);
      setFilteredData(filtered);
  }, [dataSource, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await GetAllHoliday();
      const modifiedData = response.data.data
        .map((item) => ({
          ...item,
          key: item.id,
        }))
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      
      setDataSource(modifiedData);
    } catch (error) {
      console.error("Error fetching holidays:", error);
    } finally {
        setLoading(false);
    }
  };

  const showAddModal = () => setIsAddModalOpen(true);
  const showEditModal = (record) => {
    setSelectedHoliday(record);
    setIsEditModalOpen(true);
  };

  const handleDelete = (id) => {
    confirm({
      title: intl.formatMessage({ id: "holidays.confirm.title" }),
      icon: <ExclamationCircleFilled />,
      content: intl.formatMessage({ id: "holidays.confirm.deleteContent" }),
      okText: intl.formatMessage({ id: "holidays.common.yesDelete" }),
      okType: "danger",
      cancelText: intl.formatMessage({ id: "holidays.common.cancel" }),
      async onOk() {
        try {
          await DeleteHoliday(id);
          fetchData();
          messageApi.success(intl.formatMessage({ id: "holidays.messages.deleted" }));
        } catch (error) {
          messageApi.error(intl.formatMessage({ id: "holidays.messages.deleteFailed" }));
        }
      },
    });
  };

  const columns = [
    {
      title: intl.formatMessage({ id: "holidays.table.holidayName" }),
      dataIndex: "name",
      key: "holidayName",
      width: "300px",
      render: (name, record) => {
        const isPastHoliday = moment(record.endTime).isBefore(moment());
        return (
          <div style={{ color: isPastHoliday ? "#B5C0D0" : "inherit" }}>
            {isPastHoliday && <CheckOutlined style={{ color: "#829460", marginRight: 5 }} />}
            {name}
          </div>
        );
      },
    },
    {
      title: intl.formatMessage({ id: "holidays.table.status" }),
        key: "status",
        width: "120px",
        render: (_, record) => {
            const isPast = moment(record.endTime).isBefore(moment());
            return (
                <Tag color={isPast ? "default" : "green"}>
                    {isPast ? intl.formatMessage({ id: "holidays.status.past" }) : moment(record.startTime).fromNow()}
                </Tag>
            );
        }
    },
    {
      title: intl.formatMessage({ id: "holidays.table.startDate" }),
      dataIndex: "startTime",
      key: "startTime",
      width: "150px",
      render: (startTime) => (
        <span>{moment(startTime).format("DD MMMM YYYY")}</span>
      ),
    },
    {
      title: intl.formatMessage({ id: "holidays.table.endDate" }),
      dataIndex: "endTime",
      key: "endTime",
      width: "150px",
      render: (endTime) => (
        <span>{moment(endTime).format("DD MMMM YYYY")}</span>
      ),
    },
    {
      title: intl.formatMessage({ id: "holidays.table.actions" }),
      key: "actions",
      width: "100px",
      align: "center",
      render: (text, record) => (
        <Space size="middle">
          <a onClick={() => showEditModal(record)} style={{ color: '#333', fontSize: '16px' }}>
            <EditOutlined />
          </a>
          <a onClick={() => handleDelete(record.id)} style={{ color: '#f5222d', fontSize: '16px' }}>
             <DeleteOutlined />
          </a>
        </Space>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <LayoutWrapper>
        <Box style={{ marginTop: "-20px" }}>
          <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
            <Breadcrumb.Item>{intl.formatMessage({ id: "holidays.breadcrumb.holiday" })}</Breadcrumb.Item>
            <Breadcrumb.Item>{intl.formatMessage({ id: "holidays.breadcrumb.title" })}</Breadcrumb.Item>
          </Breadcrumb>

          <PageHeader>
            <IntlMessages id="holidays.pageTitle" />
          </PageHeader>

          {/* --- FİLTRE VE EKLEME ALANI --- */}
          <Card bodyStyle={{ padding: '15px' }} style={{ marginBottom: 20, background: '#f9f9f9' }}>
             <Row justify="space-between" align="middle" gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8}>
                    <Space>
                        <span style={{ fontWeight: 500 }}><CalendarOutlined /> {intl.formatMessage({ id: "holidays.selectYear" })}</span>
                        <Select 
                            value={selectedYear} 
                            onChange={setSelectedYear} 
                            style={{ width: 120 }}
                        >
                            {availableYears.map(year => (
                                <Option key={year} value={year}>{year}</Option>
                            ))}
                        </Select>
                    </Space>
                </Col>
                
                <Col xs={24} sm={12} md={16} style={{ textAlign: 'right' }}>
                    <Space wrap>
                        {/* Otomatik getir butonu kaldırıldı */}
                        <Button
                          type="primary"
                          className="btn-with-icon-spacing"
                          icon={<PlusOutlined />}
                          onClick={showAddModal}
                        >
                            {intl.formatMessage({ id: "holidays.actions.manualAdd" })}
                        </Button>
                    </Space>
                </Col>
             </Row>
          </Card>

          <TableWrapper
            dataSource={filteredData} 
            columns={columns}
            pagination={{ pageSize: 10 }}
            className="projectListTable"
            loading={loading}
          />

          <AddHoliday
            isModalOpen={isAddModalOpen}
            setIsModalOpen={setIsAddModalOpen}
            refreshlist={fetchData}
            isEditMode={false} 
          />

          <AddHoliday
            isModalOpen={isEditModalOpen}
            setIsModalOpen={setIsEditModalOpen}
            refreshlist={fetchData}
            initialValues={selectedHoliday}
            isEditMode={true} 
          />

        </Box>
      </LayoutWrapper>
    </>
  );
};

export default Holidays;