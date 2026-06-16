import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Spin, Card, List, Button, Breadcrumb, message, Alert, Empty, Typography,
  Row, Col
} from "antd";
import { ArrowLeftOutlined, LinkOutlined, UserOutlined, TeamOutlined, DollarCircleOutlined, InfoCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import { Box } from "../HealthInfo/HealthInfo.styles";
import moment from "moment";
import 'moment/locale/tr';
import { getHealthInfoByIdWithUser } from "../../Api/HealthInfoApi";
import { host } from "../../Api/host";
import { useIntl } from "react-intl";

const { Meta } = List.Item; 
const { Text, Title, Paragraph } = Typography;
moment.locale('tr');

// Yardımcı Bileşen: Detay Satırı
const DetailItem = ({ label, children, span = 8 }) => (
  <Col xs={24} sm={24} md={span} lg={span} style={{ marginBottom: '16px' }}>
    <Text style={{ color: 'rgba(0, 0, 0, 0.45)', display: 'block', marginBottom: '4px' }}>
      {label}
    </Text>
    {typeof children === 'string' ? <Text>{children || '-'}</Text> : children || '-'}
  </Col>
);

const HealthInfoDetails = () => {
  const intl = useIntl();
  const { id } = useParams();
  const history = useHistory();
  const { accessToken } = useSelector((state) => state.Auth);
  const [loading, setLoading] = useState(true);
  const [healthInfoData, setHealthInfoData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getHealthInfoByIdWithUser(id, accessToken);
        if (response.data?.success && response.data?.data) {
          setHealthInfoData(response.data.data);
        } else {
          setError(response.data?.message || intl.formatMessage({ id: "healthInfoAdmin.details.fetchFailed" }));
          message.error(response.data?.message || intl.formatMessage({ id: "healthInfoAdmin.details.fetchFailed" }));
        }
      } catch (err) {
        console.error("Health info admin details fetch error:", err);
        setError(intl.formatMessage({ id: "healthInfoAdmin.details.serverError" }));
        message.error(intl.formatMessage({ id: "healthInfoAdmin.details.serverError" }));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    } else {
      setError(intl.formatMessage({ id: "healthInfoAdmin.details.invalidRecordId" }));
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return ( <LayoutWrapper> <Spin tip={intl.formatMessage({ id: "healthInfoAdmin.details.loading" })} style={{ display: 'block', marginTop: '50px' }} /> </LayoutWrapper> );
  }

  if (error) {
    return (
      <LayoutWrapper>
        <Box>
          <Alert message={intl.formatMessage({ id: "healthInfoAdmin.details.error" })} description={error} type="error" showIcon />
          <Button icon={<ArrowLeftOutlined />} onClick={() => history.goBack()} style={{ marginTop: 16 }}>
            {intl.formatMessage({ id: "healthInfoAdmin.common.back" })}
          </Button>
        </Box>
      </LayoutWrapper>
    );
  }

  if (!healthInfoData) {
    return (
      <LayoutWrapper>
        <Box>
          <Empty description={intl.formatMessage({ id: "healthInfoAdmin.details.notFound" })} />
            <Button icon={<ArrowLeftOutlined />} onClick={() => history.goBack()} style={{ marginTop: 16 }}>
            {intl.formatMessage({ id: "healthInfoAdmin.common.back" })}
          </Button>
        </Box>
      </LayoutWrapper>
    );
  }

  const { user, premiumDetails, dependents, documents, ...generalInfo } = healthInfoData;

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "16px 0" }}>
            <Breadcrumb.Item>{intl.formatMessage({ id: "healthInfoAdmin.breadcrumb.management" })}</Breadcrumb.Item>
            <Breadcrumb.Item><a href="/dashboard/admin-healthInfo">{intl.formatMessage({ id: "healthInfoAdmin.breadcrumb.title" })}</a></Breadcrumb.Item>
            <Breadcrumb.Item>{intl.formatMessage({ id: "healthInfoAdmin.details.breadcrumbDetails" })}</Breadcrumb.Item>
        </Breadcrumb>
        <PageHeader>{intl.formatMessage({ id: "healthInfoAdmin.details.title" })}</PageHeader>

        <div style={{ height: '24px' }} />

        {/* --- GENEL BİLGİLER --- */}
        <Card title={<><UserOutlined style={{marginRight: 8}} /> {intl.formatMessage({ id: "healthInfo.details.generalPolicyInfo" })}</>} style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.user" })}>{user?.name}</DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.insuranceCompanyName" })}>{generalInfo.insuranceCompanyName}</DetailItem>
            
            {/* --- YENİ EKLENEN ALANLAR --- */}
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.agencyName" })}>{generalInfo.agencyName}</DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.agencyContactPerson" })}>{generalInfo.agencyContactPerson}</DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.agencyContactPhone" })}>{generalInfo.agencyContactPhone}</DetailItem>
            {/* ---------------------------- */}

            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.policyNumber" })}>{generalInfo.insurancePolicyNo}</DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.policyType" })}>{generalInfo.policyType}</DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.insuranceBeginDate" })}>{generalInfo.insuranceBeginDate ? moment(generalInfo.insuranceBeginDate).format('DD MMMM YYYY') : '-'}</DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.insuranceEndDate" })}>{generalInfo.insuranceEndDate ? moment(generalInfo.insuranceEndDate).format('DD MMMM YYYY') : '-'}</DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.policyStatus" })}>{generalInfo.policyStatus}</DetailItem>
            
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.addedAt" })}>
                {generalInfo.addedAt ? moment.utc(generalInfo.addedAt).local().format('DD MMMM YYYY HH:mm') : '-'}
            </DetailItem>
            
          </Row>
        </Card>

        {/* --- KAPSAM BİLGİLERİ --- */}
        <Card title={<><InfoCircleOutlined style={{marginRight: 8}} /> {intl.formatMessage({ id: "healthInfo.details.coverageInfo" })}</>} style={{ marginBottom: 24 }}>
           <Row gutter={24}>
              <DetailItem label={intl.formatMessage({ id: "healthInfo.details.planName" })}>{generalInfo.planName}</DetailItem>
              <DetailItem label={intl.formatMessage({ id: "healthInfo.details.coverageArea" })}>{generalInfo.coverageArea}</DetailItem>
              <DetailItem label={intl.formatMessage({ id: "healthInfo.details.coverageLimit" })}>{generalInfo.coverageLimit}</DetailItem>
              <DetailItem label={intl.formatMessage({ id: "healthInfo.details.coveragePercentage" })}>{generalInfo.coveragePercentage}</DetailItem>
           </Row>
        </Card>

        {/* --- PRİM BİLGİLERİ --- */}
        {premiumDetails && (
            <Card title={<><DollarCircleOutlined style={{marginRight: 8}} /> {intl.formatMessage({ id: "healthInfo.details.premiumInfo" })}</>} style={{ marginBottom: 24 }}>
              <Row gutter={24}>
                <DetailItem label={intl.formatMessage({ id: "healthInfo.details.totalPremium" })}>{premiumDetails.totalPremium?.toLocaleString('tr-TR', { style: 'currency', 'currency': 'TRY' }) ?? '-'}</DetailItem>
                <DetailItem label={intl.formatMessage({ id: "healthInfo.details.employerContribution" })}>{premiumDetails.employerContribution?.toLocaleString('tr-TR', { style: 'currency', 'currency': 'TRY' }) ?? '-'}</DetailItem>
                <DetailItem label={intl.formatMessage({ id: "healthInfo.details.employeeContribution" })}>{premiumDetails.employeeContribution?.toLocaleString('tr-TR', { style: 'currency', 'currency': 'TRY' }) ?? '-'}</DetailItem>
                <DetailItem label={intl.formatMessage({ id: "healthInfo.details.monthlyDeduction" })}>{premiumDetails.monthlyDeduction?.toLocaleString('tr-TR', { style: 'currency', 'currency': 'TRY' }) ?? '-'}</DetailItem>
                <DetailItem label={intl.formatMessage({ id: "healthInfo.details.paymentType" })}>{premiumDetails.paymentType}</DetailItem>
                <DetailItem label={intl.formatMessage({ id: "healthInfo.details.installmentDetails" })}>{premiumDetails.installmentDetails}</DetailItem>
                <DetailItem label={intl.formatMessage({ id: "healthInfo.details.taxAdvantageInfo" })} span={24}>
                  <Paragraph style={{ margin: 0 }}>{premiumDetails.taxAdvantageInfo || '-'}</Paragraph>
                </DetailItem>
              </Row>
            </Card>
        )}

        {/* --- AİLE BİREYLERİ --- */}
        <Card title={<><TeamOutlined style={{marginRight: 8}} /> {intl.formatMessage({ id: "healthInfo.details.dependentsTitle" })}</>} style={{ marginBottom: 24 }}>
            {dependents && dependents.length > 0 ? (
                <Row gutter={[16, 16]}> 
                    {dependents.map((item, index) => (
                        <Col key={index} xs={24} sm={24} md={12} lg={8}>
                            <Card 
                                size="small"
                                title={<><UserOutlined style={{ marginRight: 8 }} /> <Text strong>{item.dependentName || 'N/A'}</Text></>} 
                                headStyle={{ backgroundColor: '#f9f9f9' }}
                                bodyStyle={{ padding: '16px' }} 
                            >
                                <Paragraph style={{ marginBottom: 12 }}>
                                  <TeamOutlined style={{ marginRight: 8 }} />
                                  <Text type="secondary">{intl.formatMessage({ id: "healthInfo.details.relationship" })}: </Text>
                                  <Text>{item.relationship || '-'}</Text> 
                                </Paragraph>
                                <Paragraph style={{ marginBottom: 12 }}>
                                  <InfoCircleOutlined style={{ marginRight: 8 }} />
                                  <Text type="secondary">{intl.formatMessage({ id: "healthInfo.details.status" })}: </Text>
                                  <Text>{item.coverageStatus || '-'}</Text>
                                </Paragraph>
                                <Paragraph style={{ marginBottom: 0 }}>
                                  <FileTextOutlined style={{ marginRight: 8 }} />
                                  <Text type="secondary">{intl.formatMessage({ id: "healthInfo.details.plan" })}: </Text>
                                  <Text>{item.planDetails || '-'}</Text>
                                </Paragraph>
                            </Card>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Empty description={intl.formatMessage({ id: "healthInfo.details.noDependents" })} />
            )}
        </Card>

        {/* --- POLİÇE BELGELERİ --- */}
        <Card title={<><FileTextOutlined style={{marginRight: 8}} /> {intl.formatMessage({ id: "healthInfo.details.documentsTitle" })}</>} style={{ marginBottom: 24 }}>
            {documents && documents.length > 0 ? (
                <Row gutter={[16, 16]}>
                    {documents.map((doc, index) => (
                        <Col key={index} xs={24} sm={24} md={12} lg={12}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                border: '1px solid #f0f0f0', 
                                padding: '12px', 
                                borderRadius: '4px', 
                                height: '100%' 
                            }}>
                                <Meta
                                    avatar={<FileTextOutlined style={{ fontSize: '18px', color: 'rgba(0,0,0,0.45)' }} />}
                                    title={<Text>{doc.filePath || intl.formatMessage({ id: "healthInfo.details.untitledDocument" })}</Text>}
                                    description={`${intl.formatMessage({ id: "healthInfo.details.type" })}: ${doc.documentType || '-'} | ${intl.formatMessage({ id: "healthInfo.details.uploadedAt" })}: ${moment.utc(doc.uploadedAt).local().format('DD.MM.YYYY HH:mm')}`}
                                    style={{ flexGrow: 1, minWidth: 0 }} 
                                />
                                <a href={`${host}/uploads/healthinfodocuments/${doc.filePath}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '16px', flexShrink: 0 }}>
                                    <Button type="link" icon={<LinkOutlined />}>{intl.formatMessage({ id: "healthInfo.details.viewOrDownload" })}</Button>
                                </a>
                            </div>
                        </Col>
                    ))}
                </Row>
            ) : (
                <Empty description={intl.formatMessage({ id: "healthInfo.details.noDocuments" })} />
            )}
        </Card>

        {/* Geri Butonu */}
        <Button icon={<ArrowLeftOutlined />} onClick={() => history.push("/dashboard/admin-healthInfo")} style={{ marginTop: 16 }}>
          {intl.formatMessage({ id: "healthInfoAdmin.details.backToList" })}
        </Button>
      </Box>
    </LayoutWrapper>
  );
};

export default HealthInfoDetails;