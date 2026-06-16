import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Breadcrumb, Table, Button, Select, message, Space, Popconfirm, Tag, Tooltip,
  Card, Typography, Pagination, Row, Col, Spin,
} from "antd";
import {
  EditOutlined, PlusCircleOutlined, WarningOutlined, ExclamationCircleOutlined,
  ProfileOutlined // Detay ikonu
} from "@ant-design/icons";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import Column from "antd/lib/table/Column";
import { Box } from "../HealthInfo/HealthInfo.styles";
import moment from "moment";
import 'moment/locale/tr';

import Searchbar from "./Components/Searchbar";

import {
  getAllHealthInfoWithUser,
  deleteHealthInfoById,
} from "../../Api/HealthInfoApi";
import { UserListe } from "../../Api/UserApi";
import axios from "axios";
import { host } from "../../Api/host";
import { useIntl } from "react-intl";

const { Option } = Select;
const { Text } = Typography;
moment.locale('tr');

// --- Orijinal Renk Paleti (Senin kodundaki gibi) ---
const COLORS = [ "#A02334", "#FFAD60", "#96CEB4", "#758A93", "#E9B63B", "#C66E52", "#9ECAD6", "#748DAE", "#6f42c1", "#17a2b8", "#20c997", ];
const getColorForString = (str) => { 
  if (!str) return "default"; 
  let hash = 0; 
  for (let i = 0; i < str.length; i++) { 
    hash = str.charCodeAt(i) + ((hash << 5) - hash); 
  } 
  const index = Math.abs(hash % COLORS.length); 
  return COLORS[index]; 
};
// --- ---

const CARDS_PER_PAGE = 4;
const TABLE_PAGE_SIZE = 15;

const HealthInfoAdmin = () => {
  const intl = useIntl();
  const { accessToken } = useSelector((state) => state.Auth);
  const [data, setData] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredData, setFilteredData] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedInsurance, setSelectedInsurance] = useState("");
  const [selectedRowKey, setSelectedRowKey] = useState(null);
  const mainTableRef = useRef(null);
  const [currentCardPage, setCurrentCardPage] = useState(1);
  const [mainTablePage, setMainTablePage] = useState(1);
  const history = useHistory();
  const token = accessToken || localStorage.getItem("token");
  const axiosAuth = useMemo(
    () =>
      axios.create({
        baseURL: host,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [token]
  );

   const expiringPolicies = useMemo(() => {
     const today = moment().startOf('day');
     if (!Array.isArray(data)) return [];
     return data
       .map(item => {
         const endDate = item?.insuranceEndDate ? moment(item.insuranceEndDate).startOf('day') : null;
         const daysRemaining = (endDate && endDate.isValid()) ? endDate.diff(today, 'days') : Infinity;
         return { ...item, daysRemaining };
       })
       .filter(item => typeof item.daysRemaining === 'number' && item.daysRemaining <= 15)
       .sort((a, b) => a.daysRemaining - b.daysRemaining);
   }, [data]);

   const paginatedExpiringPolicies = useMemo(() => {
     const startIndex = (currentCardPage - 1) * CARDS_PER_PAGE;
     return expiringPolicies.slice(startIndex, startIndex + CARDS_PER_PAGE);
   }, [expiringPolicies, currentCardPage]);

   const userOptions = useMemo(() => {
     if (!Array.isArray(data)) return [];
     const uniqueUsers = [...new Set(data.map((item) => item?.user?.name).filter(Boolean))];
     return uniqueUsers.map((user) => ({ label: user, value: user }));
   }, [data]);

   const insuranceOptions = useMemo(() => {
     if (!Array.isArray(data)) return [];
     const uniqueInsurances = [...new Set(data.map((item) => item?.insuranceCompanyName).filter(Boolean))];
     return uniqueInsurances.map((ins) => ({ label: ins, value: ins }));
   }, [data]);

   const fetchData = async () => {
    setLoading(true);
    try {
      const [healthResponse, userResponse] = await Promise.all([
getAllHealthInfoWithUser(),
UserListe(accessToken)
      ]);
      const healthData = healthResponse?.data?.data?.map((item) => ({ ...item, key: item?.id ?? Math.random() })) || [];
      const userPayload = userResponse?.data;
      const userData = Array.isArray(userPayload)
        ? userPayload
        : userPayload?.data || [];
      setData(healthData);
      setFilteredData(healthData);
      setUsers(userData);
    } catch (error) {
      console.error("Error fetching health info admin data:", error);
      message.error(intl.formatMessage({ id: "healthInfoAdmin.messages.fetchFailed" }));
      setData([]); setFilteredData([]); setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!Array.isArray(data)) { setFilteredData([]); return; }
    const filtered = data.filter((item) => {
      const userName = item?.user?.name?.toLowerCase() || '';
      const companyName = item?.insuranceCompanyName?.toLowerCase() || '';
      const policyNo = item?.insurancePolicyNo?.toLowerCase() || '';
      const s = (search || "").toLowerCase();
      const userMatch = selectedUser ? (item?.user?.name === selectedUser) : true;
      const insuranceMatch = selectedInsurance ? (item?.insuranceCompanyName === selectedInsurance) : true;
      const searchMatch = userName.includes(s) || companyName.includes(s) || policyNo.includes(s);
      return userMatch && insuranceMatch && searchMatch;
    });
    setFilteredData(filtered);
    setMainTablePage(1);
  }, [search, selectedUser, selectedInsurance, data]);

    const handleRowClick = (id) => {
     if (!id) return;
     const index = filteredData.findIndex(item => item.id === id);
     if (index === -1) return;
     const targetPage = Math.ceil((index + 1) / TABLE_PAGE_SIZE);
     setMainTablePage(targetPage);
     setSelectedRowKey(id);
     setTimeout(() => { setSelectedRowKey(null); }, 2500);
   };

    useEffect(() => {
      if (selectedRowKey && mainTableRef.current) {
        const scrollTimer = setTimeout(() => {
          try {
            const key = String(selectedRowKey);
            const safeKey = typeof CSS !== "undefined" && CSS.escape ? CSS.escape(key) : key.replace(/"/g, '\\"');
            const rowElement = mainTableRef.current?.querySelector(`.ant-table-row[data-row-key="${safeKey}"]`);
            if (rowElement) {
              rowElement.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
            } else {
              mainTableRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
          } catch (e) {
            // selector kırılırsa sayfayı düşürmeyelim
            try {
              mainTableRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
            } catch {}
          }
        }, 150);
        return () => clearTimeout(scrollTimer);
      }
    }, [selectedRowKey, mainTablePage]);

   const handleCardPageChange = (page) => {
     setCurrentCardPage(page);
   };

    const handleDelete = async (id) => {
     if(!id) return;
     try {
       const result = await deleteHealthInfoById(id, accessToken);
       if (result?.data?.success) {
         message.success(result.data.message || intl.formatMessage({ id: "healthInfoAdmin.messages.deleteSuccess" }));
         fetchData();
       } else {
         message.error(result?.data?.message || intl.formatMessage({ id: "healthInfoAdmin.messages.deleteFailed" }));
       }
     } catch (error) {
       console.error("Delete health info record error:", error);
       message.error(error?.response?.data?.message || intl.formatMessage({ id: "healthInfoAdmin.messages.deleteError" }));
     }
   };

  return (
    <LayoutWrapper>
       <style>{`
        .selected-row-highlight > td { background-color: #e8e8e8 !important; transition: background-color 0.5s ease-in-out; }
        .ant-table-row > td { transition: background-color 0.5s ease-in-out; }
        .action-cell { display: flex; justify-content: center; align-items: center; gap: 4px; }
      `}</style>

      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "16px 0" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "healthInfoAdmin.breadcrumb.management" })}</Breadcrumb.Item>
          <Breadcrumb.Item>{intl.formatMessage({ id: "healthInfoAdmin.breadcrumb.title" })}</Breadcrumb.Item>
        </Breadcrumb>
        <PageHeader>{intl.formatMessage({ id: "healthInfoAdmin.pageTitle" })}</PageHeader>

        {/* --- 1. RESPONSIVE KART ALANI --- */}
         {loading ? <Spin style={{display: 'block', marginBottom: '24px'}}/> : expiringPolicies.length > 0 && (
          <div style={{ marginBottom: '24px', marginTop: '16px' }}>
             <div style={{ paddingBottom: '8px', borderBottom: '1px solid #f0f0f0', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
               <ExclamationCircleOutlined style={{ marginRight: 8, color: '#faad14' }} />
               <Text strong style={{ color: '#8c8c8c' }}>
                {intl.formatMessage({ id: "healthInfoAdmin.expiringPolicies.title" }, { count: expiringPolicies.length })}
               </Text>
             </div>
             <div style={{ minHeight: '75px' }}>
                 <Row gutter={[16, 16]}>
                 {Array.from({ length: CARDS_PER_PAGE }).map((_, index) => {
                     const policy = paginatedExpiringPolicies[index];
                     const policyExists = !!policy;
                     const daysRemaining = policyExists ? policy.daysRemaining : 0;
                     const isExpired = daysRemaining < 0;
                     const userName = policyExists ? (policy.user?.name || intl.formatMessage({ id: "healthInfoAdmin.common.na" })) : '';
                     const companyName = policyExists ? (policy.insuranceCompanyName || intl.formatMessage({ id: "healthInfoAdmin.common.na" })) : '';

                     return (
                     // xs=24 (Mobil: 1 kart), sm=12 (Tablet: 2 kart), lg=6 (PC: 4 kart)
                     <Col xs={24} sm={12} md={12} lg={6} key={policyExists ? policy.id : `placeholder-${index}`}>
                         {policyExists ? (
                         <Card hoverable onClick={() => handleRowClick(policy.id)} size="small" style={{cursor: 'pointer', width: '100%'}}>
                             <div style={{ display: 'flex', alignItems: 'center', minHeight: '38px' }}>
                                <Tooltip title={isExpired
                                  ? intl.formatMessage({ id: "healthInfoAdmin.expiringPolicies.expiredTooltip" }, { days: Math.abs(daysRemaining) })
                                  : intl.formatMessage({ id: "healthInfoAdmin.expiringPolicies.remainingDaysTooltip" }, { days: daysRemaining })}
                                >
                                     <WarningOutlined style={{ color: isExpired ? '#cf1322' : '#faad14', fontSize: '24px', marginRight: '16px', flexShrink: 0 }} />
                                 </Tooltip>
                                 <div style={{ flex: 1, overflow: 'hidden' }}>
                                     <Text strong ellipsis style={{ display: 'block' }} title={userName}>{userName}</Text>
                                     <Text type="secondary" style={{ display: 'block', fontSize: '12px' }} ellipsis title={companyName}>{companyName}</Text>
                                 </div>
                                 <Text type={isExpired ? "danger": "warning"} strong style={{marginLeft: '8px', whiteSpace: 'nowrap', flexShrink: 0}}>
                                    {isExpired
                                      ? intl.formatMessage({ id: "healthInfoAdmin.expiringPolicies.expired" })
                                      : intl.formatMessage({ id: "healthInfoAdmin.expiringPolicies.days" }, { days: daysRemaining })}
                                 </Text>
                             </div>
                         </Card>
                         ) : ( <div style={{ minHeight: '58px' }} /> )}
                     </Col>
                     );
                 })}
                 </Row>
             </div>
             {expiringPolicies.length > CARDS_PER_PAGE && (
               <Pagination
                 simple
                 current={currentCardPage}
                 pageSize={CARDS_PER_PAGE}
                 total={expiringPolicies.length}
                 onChange={handleCardPageChange}
                 style={{ textAlign: 'center', marginTop: '16px' }}
               />
             )}
          </div>
        )}

        {/* --- 2. RESPONSIVE ARAMA VE BUTON ALANI --- */}
        {/* Mobilde alt alta, PC'de yan yana */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }} align="middle" justify="space-between">
          <Col xs={24} md={18} lg={20}>
            <Searchbar
              search={search} setSearch={setSearch}
              selectedCategory={selectedUser} setSelectedCategory={setSelectedUser} categoriesOptions={userOptions}
              selectedStatus={selectedInsurance} setSelectedStatus={setSelectedInsurance} statusOptions={insuranceOptions}
            />
          </Col>
          <Col xs={24} md={6} lg={4}>
             <Button 
                type="primary" 
                onClick={() => history.push('/dashboard/admin-healthinfo/add')} 
                icon={<PlusCircleOutlined />} 
                style={{ width: '100%', display: "flex", alignItems: "center", justifyContent: "center" }}
             > 
                {intl.formatMessage({ id: "healthInfoAdmin.actions.addNewRecord" })}
             </Button>
          </Col>
        </Row>

        {/* --- 3. RESPONSIVE TABLO (Scroll Eklendi) --- */}
        <div ref={mainTableRef}>
          <Table
            dataSource={filteredData}
            loading={loading}
            rowKey="id"
            rowClassName={(record) => record.id === selectedRowKey ? 'selected-row-highlight' : ''}
            size="small"
            // --- YENİ: Mobilde tablonun taşmasını engeller ---
            scroll={{ x: 1000 }} 
            pagination={{
              pageSize: TABLE_PAGE_SIZE,
              current: mainTablePage,
              onChange: (page) => setMainTablePage(page),
            }}
          >
            <Column title={intl.formatMessage({ id: "healthInfoAdmin.table.user" })} dataIndex={["user", "name"]} render={(name) => name || intl.formatMessage({ id: "healthInfoAdmin.common.na" })} sorter={(a, b) => (a.user?.name || '').localeCompare(b.user?.name || '')} />
            <Column title={intl.formatMessage({ id: "healthInfoAdmin.table.insuranceCompany" })} dataIndex="insuranceCompanyName" key="insuranceCompanyName" render={(text) => text ? <Tag color={getColorForString(text)}>{text}</Tag> : intl.formatMessage({ id: "healthInfoAdmin.common.na" })} sorter={(a, b) => (a.insuranceCompanyName || '').localeCompare(b.insuranceCompanyName || '')} />
            <Column title={intl.formatMessage({ id: "healthInfoAdmin.table.policyNumber" })} dataIndex="insurancePolicyNo" key="insurancePolicyNo" render={(text) => text || intl.formatMessage({ id: "healthInfoAdmin.common.na" })} sorter={(a, b) => (a.insurancePolicyNo || '').localeCompare(b.insurancePolicyNo || '')} />
            <Column title={intl.formatMessage({ id: "healthInfoAdmin.table.policyType" })} dataIndex="policyType" key="policyType" render={(text) => text || '-'} sorter={(a, b) => (a.policyType || '').localeCompare(b.policyType || '')} />
            <Column title={intl.formatMessage({ id: "healthInfoAdmin.table.startDate" })} dataIndex="insuranceBeginDate" render={(date) => date && moment(date).isValid() ? moment(date).format("DD.MM.YYYY") : intl.formatMessage({ id: "healthInfoAdmin.common.na" })} sorter={(a, b) => moment(a.insuranceBeginDate || 0).diff(moment(b.insuranceBeginDate || 0))} />
            <Column title={intl.formatMessage({ id: "healthInfoAdmin.table.endDate" })} dataIndex="insuranceEndDate" render={(date) => { if (!date) return intl.formatMessage({ id: "healthInfoAdmin.common.na" }); const today = moment().startOf('day'); const endDate = moment(date).startOf('day'); if (!endDate.isValid()) return intl.formatMessage({ id: "healthInfoAdmin.common.invalidDate" }); const daysRemaining = endDate.diff(today, 'days'); const formattedDate = endDate.format("DD.MM.YYYY"); if (daysRemaining < 0) { return (<Space><span>{formattedDate}</span><Tooltip title={intl.formatMessage({ id: "healthInfoAdmin.expiringPolicies.expiredTooltipPast" }, { days: Math.abs(daysRemaining) })}><WarningOutlined style={{ color: '#cf1322' }} /></Tooltip></Space>); } else if (daysRemaining <= 15) { return (<Space><span>{formattedDate}</span><Tooltip title={intl.formatMessage({ id: "healthInfoAdmin.expiringPolicies.remainingToEnd" }, { days: daysRemaining })}><WarningOutlined style={{ color: '#faad14' }} /></Tooltip></Space>); } return formattedDate; }} sorter={(a, b) => moment(a.insuranceEndDate || 0).diff(moment(b.insuranceEndDate || 0))} />
            <Column title={intl.formatMessage({ id: "healthInfoAdmin.table.policyStatus" })} dataIndex="policyStatus" key="policyStatus" render={(text) => text || '-'} sorter={(a, b) => (a.policyStatus || '').localeCompare(b.policyStatus || '')} />

            <Column
              title={intl.formatMessage({ id: "healthInfoAdmin.table.action" })}
              key="action"
              align="center"
              width={100}
              fixed="right" // Aksiyon sütununu sağa sabitle
              render={(text, record) => (
                <div className="action-cell">
                  <Tooltip title={intl.formatMessage({ id: "healthInfoAdmin.actions.viewDetails" })}>
                    <Button
                       type="text"
                       size="small"
                       icon={<ProfileOutlined />} 
                       onClick={() => history.push(`/dashboard/admin-healthinfo/details/${record?.id}`)}
                       disabled={!record?.id}
                    />
                  </Tooltip>
                  <Tooltip title={intl.formatMessage({ id: "healthInfoAdmin.actions.edit" })}>
                    <Button type="text" size="small" icon={<EditOutlined />} onClick={() => history.push(`/dashboard/admin-healthinfo/edit/${record?.id}`)} disabled={!record?.id} />
                  </Tooltip>
                  <Popconfirm title={intl.formatMessage({ id: "healthInfoAdmin.actions.deleteConfirm" })} okText={intl.formatMessage({ id: "healthInfoAdmin.common.yes" })} cancelText={intl.formatMessage({ id: "healthInfoAdmin.common.no" })} onConfirm={() => handleDelete(record?.id)} disabled={!record?.id}>
                    <Tooltip title={intl.formatMessage({ id: "healthInfoAdmin.actions.delete" })}>
                      <Button danger type="text" size="small" icon={<i className="ion-android-delete" style={{fontSize: '16px'}} />} disabled={!record?.id} />
                    </Tooltip>
                  </Popconfirm>
                </div>
              )}
            />
          </Table>
        </div>
      </Box>
    </LayoutWrapper>
  );
};

export default HealthInfoAdmin;