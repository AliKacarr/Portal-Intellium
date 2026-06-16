import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import {
  Spin, Card, List, Button, Breadcrumb, message, Alert, Empty, Typography,
  Row, Col
} from "antd";
import { ArrowLeftOutlined, LinkOutlined, UserOutlined, TeamOutlined, DollarCircleOutlined, InfoCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
// Eğer bu dosya yoksa hata verir, path'in doğruluğundan emin ol:
import { Box } from "../HealthInfo/HealthInfo.styles"; 
import moment from "moment";
import 'moment/locale/tr';
import { getHealthInfoByIdWithUser } from "../../Api/HealthInfoApi";
import { host } from "../../Api/host";
import { useIntl } from "react-intl";

const { Meta } = List.Item; 
const { Text, Paragraph } = Typography;
moment.locale('tr');

// --- YARDIMCI: Tarih Formatlayıcı (Hata Önleyici) ---
// Bu fonksiyon, tarih null gelse veya bozuk gelse bile sayfayı çökertmez.
const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
        const date = moment.utc(dateString);
        if (!date.isValid()) return '-'; // Geçersiz tarih gelirse tire koy
        return date.local().format('DD MMMM YYYY HH:mm');
    } catch (error) {
        console.error("Date could not be formatted:", error);
        return '-';
    }
};

// --- YARDIMCI: Detay Satırı ---
const DetailItem = ({ label, children, span = 8 }) => (
  <Col xs={24} sm={24} md={span} lg={span} style={{ marginBottom: '16px' }}>
    <Text style={{ color: 'rgba(0, 0, 0, 0.45)', display: 'block', marginBottom: '4px' }}>
      {label}
    </Text>
    {/* Eğer children bir nesne ise (React elementi değilse) string'e çevirmeyi dener */}
    {React.isValidElement(children) ? children : (children || '-')}
  </Col>
);

const HealthInfoDetails = () => {
  const intl = useIntl();
  const { id } = useParams();
  const history = useHistory();
  const [loading, setLoading] = useState(true);
  const [healthInfoData, setHealthInfoData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getHealthInfoByIdWithUser(id);
        if (response?.data?.success && response?.data?.data) {
          setHealthInfoData(response.data.data);
        } else {
          const msg = response?.data?.message || intl.formatMessage({ id: "healthInfo.details.fetchFailed" });
          setError(msg);
          message.error(msg);
        }
      } catch (err) {
        console.error("Error while fetching detail data:", err);
        setError(intl.formatMessage({ id: "healthInfo.details.serverError" }));
        message.error(intl.formatMessage({ id: "healthInfo.details.serverErrorShort" }));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    } else {
      setError(intl.formatMessage({ id: "healthInfo.details.invalidRecordId" }));
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return ( <LayoutWrapper> <Spin tip={intl.formatMessage({ id: "healthInfo.details.loading" })} style={{ display: 'block', marginTop: '50px' }} /> </LayoutWrapper> );
  }

  if (error) {
    return (
      <LayoutWrapper>
        <Box>
          <Alert message={intl.formatMessage({ id: "healthInfo.details.errorTitle" })} description={error} type="error" showIcon />
          <Button icon={<ArrowLeftOutlined />} onClick={() => history.goBack()} style={{ marginTop: 16 }}>
            {intl.formatMessage({ id: "healthInfo.details.back" })}
          </Button>
        </Box>
      </LayoutWrapper>
    );
  }

  if (!healthInfoData) {
    return (
      <LayoutWrapper>
        <Box>
          <Empty description={intl.formatMessage({ id: "healthInfo.details.notFound" })} />
            <Button icon={<ArrowLeftOutlined />} onClick={() => history.goBack()} style={{ marginTop: 16 }}>
            {intl.formatMessage({ id: "healthInfo.details.back" })}
          </Button>
        </Box>
      </LayoutWrapper>
    );
  }

  // Destructuring yaparken güvenli olması için boş obje ataması (|| {}) eklemedim çünkü yukarıda kontrol ettik.
  const { user, premiumDetails, dependents, documents, ...generalInfo } = healthInfoData;

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "16px 0" }}>
            <Breadcrumb.Item>{intl.formatMessage({ id: "healthInfo.breadcrumb.profile" })}</Breadcrumb.Item>
            <Breadcrumb.Item><a href="/dashboard/healthInfo">{intl.formatMessage({ id: "healthInfo.breadcrumb.healthInfo" })}</a></Breadcrumb.Item>
            <Breadcrumb.Item>{intl.formatMessage({ id: "healthInfo.details.breadcrumbDetails" })}</Breadcrumb.Item>
        </Breadcrumb>
        <PageHeader>{intl.formatMessage({ id: "healthInfo.details.title" })}</PageHeader>

        <div style={{ height: '24px' }} /> 

        {/* --- GENEL BİLGİLER --- */}
        <Card title={<><UserOutlined style={{marginRight: 8}} /> {intl.formatMessage({ id: "healthInfo.details.generalPolicyInfo" })}</>} style={{ marginBottom: 24 }}>
          <Row gutter={24}>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.user" })}>{user?.name}</DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.insuranceCompanyName" })}>{generalInfo?.insuranceCompanyName}</DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.agencyName" })}>{generalInfo.agencyName}</DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.agencyContactPerson" })}>{generalInfo.agencyContactPerson}</DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.agencyContactPhone" })}>{generalInfo.agencyContactPhone}</DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.policyNumber" })}>{generalInfo?.insurancePolicyNo}</DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.policyType" })}>{generalInfo?.policyType}</DetailItem>
            
            {/* Tarihleri Güvenli Fonksiyonla Yazdırıyoruz */}
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.insuranceBeginDate" })}>
                {generalInfo?.insuranceBeginDate ? moment(generalInfo.insuranceBeginDate).format('DD MMMM YYYY') : '-'}
            </DetailItem>
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.insuranceEndDate" })}>
                {generalInfo?.insuranceEndDate ? moment(generalInfo.insuranceEndDate).format('DD MMMM YYYY') : '-'}
            </DetailItem>
            
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.policyStatus" })}>{generalInfo?.policyStatus}</DetailItem>
            
            {/* UTC -> LOCAL Dönüşümü (Güvenli) */}
            <DetailItem label={intl.formatMessage({ id: "healthInfo.details.addedAt" })}>
                {formatDate(generalInfo?.addedAt)}
            </DetailItem>
          </Row>
        </Card>

        {/* --- KAPSAM BİLGİLERİ --- */}
        <Card title={<><InfoCircleOutlined style={{marginRight: 8}} /> {intl.formatMessage({ id: "healthInfo.details.coverageInfo" })}</>} style={{ marginBottom: 24 }}>
           <Row gutter={24}>
              <DetailItem label={intl.formatMessage({ id: "healthInfo.details.planName" })}>{generalInfo?.planName}</DetailItem>
              <DetailItem label={intl.formatMessage({ id: "healthInfo.details.coverageArea" })}>{generalInfo?.coverageArea}</DetailItem>
              <DetailItem label={intl.formatMessage({ id: "healthInfo.details.coverageLimit" })}>{generalInfo?.coverageLimit}</DetailItem>
              <DetailItem label={intl.formatMessage({ id: "healthInfo.details.coveragePercentage" })}>{generalInfo?.coveragePercentage}</DetailItem>
           </Row>
        </Card>

        {/* --- PRİM BİLGİLERİ --- */}
        {premiumDetails && (
            <Card title={<><DollarCircleOutlined style={{marginRight: 8}} /> {intl.formatMessage({ id: "healthInfo.details.premiumInfo" })}</>} style={{ marginBottom: 24 }}>
              <Row gutter={24}>
                <DetailItem label={intl.formatMessage({ id: "healthInfo.details.totalPremium" })}>
                    {premiumDetails.totalPremium?.toLocaleString('tr-TR', { style: 'currency', 'currency': 'TRY' }) ?? '-'}
                </DetailItem>
                <DetailItem label={intl.formatMessage({ id: "healthInfo.details.employerContribution" })}>
                    {premiumDetails.employerContribution?.toLocaleString('tr-TR', { style: 'currency', 'currency': 'TRY' }) ?? '-'}
                </DetailItem>
                <DetailItem label={intl.formatMessage({ id: "healthInfo.details.employeeContribution" })}>
                    {premiumDetails.employeeContribution?.toLocaleString('tr-TR', { style: 'currency', 'currency': 'TRY' }) ?? '-'}
                </DetailItem>
                <DetailItem label={intl.formatMessage({ id: "healthInfo.details.monthlyDeduction" })}>
                    {premiumDetails.monthlyDeduction?.toLocaleString('tr-TR', { style: 'currency', 'currency': 'TRY' }) ?? '-'}
                </DetailItem>
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
                                title={<><UserOutlined style={{ marginRight: 8 }} /> <Text strong>{item?.dependentName || intl.formatMessage({ id: "healthInfo.common.na" })}</Text></>} 
                                headStyle={{ backgroundColor: '#f9f9f9' }}
                                bodyStyle={{ padding: '16px' }} 
                            >
                                <Paragraph style={{ marginBottom: 12 }}>
                                  <TeamOutlined style={{ marginRight: 8 }} />
                                  <Text type="secondary">{intl.formatMessage({ id: "healthInfo.details.relationship" })}: </Text>
                                  <Text>{item?.relationship || '-'}</Text> 
                                </Paragraph>
                                <Paragraph style={{ marginBottom: 12 }}>
                                  <InfoCircleOutlined style={{ marginRight: 8 }} />
                                  <Text type="secondary">{intl.formatMessage({ id: "healthInfo.details.status" })}: </Text>
                                  <Text>{item?.coverageStatus || '-'}</Text>
                                </Paragraph>
                                <Paragraph style={{ marginBottom: 0 }}>
                                  <FileTextOutlined style={{ marginRight: 8 }} />
                                  <Text type="secondary">{intl.formatMessage({ id: "healthInfo.details.plan" })}: </Text>
                                  <Text>{item?.planDetails || '-'}</Text>
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
                                    title={<Text>{doc?.filePath || intl.formatMessage({ id: "healthInfo.details.untitledDocument" })}</Text>}
                                    // UTC -> LOCAL Dönüşümü (Güvenli)
                                    description={`${intl.formatMessage({ id: "healthInfo.details.type" })}: ${doc?.documentType || '-'} | ${intl.formatMessage({ id: "healthInfo.details.uploadedAt" })}: ${formatDate(doc?.uploadedAt)}`}
                                    style={{ flexGrow: 1, minWidth: 0 }} 
                                />
                                <a href={`${host}/uploads/healthinfodocuments/${doc?.filePath}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '16px', flexShrink: 0 }}>
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

        <Button icon={<ArrowLeftOutlined />} onClick={() => history.goBack()} style={{ marginTop: 16 }}>
          {intl.formatMessage({ id: "healthInfo.details.back" })}
        </Button>
      </Box>
    </LayoutWrapper>
  );
};

export default HealthInfoDetails;