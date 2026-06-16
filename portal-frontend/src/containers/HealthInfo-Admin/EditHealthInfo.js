import React, { useState, useEffect } from "react";
import {
  Breadcrumb, Button, Form, Input, DatePicker, Select, message, Upload, Spin, Alert,
  InputNumber, Space, Row, Col, Typography, Divider, Popconfirm, List, Empty
} from "antd";
import {
  UploadOutlined, InfoCircleOutlined, FileTextOutlined, LinkOutlined, DeleteOutlined,
  MinusCircleOutlined, PlusOutlined, UserOutlined, TeamOutlined, DollarCircleOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import { useHistory, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import { Box } from "../HealthInfo/HealthInfo.styles"; 
import moment from "moment";
import 'moment/locale/tr'; 
import { getHealthInfoByIdWithUser, updateHealthInfo } from "../../Api/HealthInfoApi";
import { UserListe } from "../../Api/UserApi";
import { host } from "../../Api/host";
import SecureLS from "secure-ls";

// --- YENİ EKLENEN IMPORTLAR (Telefon Inputu İçin) ---
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./customStyles.css"; // EmergencyContact'taki stil dosyasının aynı yerde olduğunu varsayıyorum
import { useIntl } from "react-intl";
// ---------------------------------------------------

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
moment.locale('tr');

const EditHealthInfo = () => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initialData, setInitialData] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [deletedDocumentIds, setDeletedDocumentIds] = useState([]);
  const [deletedDependentIds, setDeletedDependentIds] = useState([]);
  const history = useHistory();
  const { id } = useParams();
  const ls = useState(() => new SecureLS({ encodingType: "aes" }))[0];
  const { accessToken } = useSelector((state) => state.Auth);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      setDeletedDocumentIds([]);
      setDeletedDependentIds([]);
      try {
const token =
  accessToken ||
  ls.get("accessToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken");

const userResponse = await UserListe(token);

if (cancelled) return;
         const userData = userResponse?.data?.data || userResponse?.data || [];
         if (Array.isArray(userData)) { setUsers(userData); }
         else { console.error("User list format is invalid!"); setUsers([]); }

const healthResponse = await getHealthInfoByIdWithUser(id);

if (cancelled) return;
        if (healthResponse.data?.success && healthResponse.data?.data) {
          const fetchedData = healthResponse.data.data;
          setInitialData(fetchedData);

          form.setFieldsValue({
            userId: fetchedData.user?.id,
            insuranceCompanyName: fetchedData.insuranceCompanyName,
            agencyName: fetchedData.agencyName,
            agencyContactPerson: fetchedData.agencyContactPerson,
            agencyContactPhone: fetchedData.agencyContactPhone,
            insurancePolicyNo: fetchedData.insurancePolicyNo,
            policyType: fetchedData.policyType,
            insuranceBeginDate: fetchedData.insuranceBeginDate ? moment(fetchedData.insuranceBeginDate) : null,
            insuranceEndDate: fetchedData.insuranceEndDate ? moment(fetchedData.insuranceEndDate) : null,
            policyStatus: fetchedData.policyStatus,
            planName: fetchedData.planName,
            coverageArea: fetchedData.coverageArea,
            coverageLimit: fetchedData.coverageLimit,
            coveragePercentage: fetchedData.coveragePercentage,
            premiumDetails: fetchedData.premiumDetails ? {
              totalPremium: fetchedData.premiumDetails.totalPremium,
              employerContribution: fetchedData.premiumDetails.employerContribution,
              employeeContribution: fetchedData.premiumDetails.employeeContribution,
              monthlyDeduction: fetchedData.premiumDetails.monthlyDeduction,
              taxAdvantageInfo: fetchedData.premiumDetails.taxAdvantageInfo,
              paymentType: fetchedData.premiumDetails.paymentType,
              installmentDetails: fetchedData.premiumDetails.installmentDetails,
            } : {},
            dependents: fetchedData.dependents || [],
          });

          setExistingDocuments(fetchedData.documents || []);
          setFileList([]);

        } else {
          if (!cancelled) {
            message.error(intl.formatMessage({ id: "healthInfoAdmin.form.recordFetchFailed" }) + ": " + (healthResponse.data?.message || "Unknown Error"));
            history.push("/dashboard/admin-healthinfo");
          }
        }
      } catch (error) {
        if (!cancelled) {
          message.error(intl.formatMessage({ id: "healthInfoAdmin.form.dataFetchError" }));
          console.error("Edit health info fetch data error:", error);
          history.push("/dashboard/admin-healthinfo");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (id) { fetchData(); }
    else { message.error(intl.formatMessage({ id: "healthInfoAdmin.details.invalidRecordId" })); history.push("/dashboard/admin-healthinfo"); }
    return () => { cancelled = true; };
  }, [id, form, history]);

  const handleFormSubmit = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const formData = new FormData();

      formData.append('Id', id);
      formData.append('UserId', values.userId);
      formData.append('InsuranceCompanyName', values.insuranceCompanyName);
      if (values.agencyName) formData.append('AgencyName', values.agencyName);
      if (values.agencyContactPerson) formData.append('AgencyContactPerson', values.agencyContactPerson);
      if (values.agencyContactPhone) formData.append('AgencyContactPhone', values.agencyContactPhone);

      formData.append('InsurancePolicyNo', values.insurancePolicyNo);
      formData.append('InsuranceBeginDate', values.insuranceBeginDate.format('YYYY-MM-DD'));
      formData.append('InsuranceEndDate', values.insuranceEndDate.format('YYYY-MM-DD'));
      if (values.policyType) formData.append('PolicyType', values.policyType);
      if (values.policyStatus) formData.append('PolicyStatus', values.policyStatus);
      if (values.planName) formData.append('PlanName', values.planName);
      if (values.coverageArea) formData.append('CoverageArea', values.coverageArea);
      if (values.coverageLimit) formData.append('CoverageLimit', values.coverageLimit);
      if (values.coveragePercentage) formData.append('CoveragePercentage', values.coveragePercentage);

      if (values.premiumDetails) {
        Object.keys(values.premiumDetails).forEach(key => {
          if (values.premiumDetails[key] !== null && values.premiumDetails[key] !== undefined) {
            formData.append(`PremiumDetails.${key.charAt(0).toUpperCase() + key.slice(1)}`, values.premiumDetails[key]);
          }
        });
      }

      if (values.dependents && values.dependents.length > 0) {
        values.dependents.forEach((dependent, index) => {
          if (dependent) {
             formData.append(`Dependents[${index}].Id`, dependent.id || 0);
             formData.append(`Dependents[${index}].DependentName`, dependent.dependentName);
             formData.append(`Dependents[${index}].Relationship`, dependent.relationship);
             if (dependent.coverageStatus) formData.append(`Dependents[${index}].CoverageStatus`, dependent.coverageStatus);
             if (dependent.planDetails) formData.append(`Dependents[${index}].PlanDetails`, dependent.planDetails);
          }
        });
      }
       deletedDependentIds.forEach((deletedId, index) => {
           formData.append(`DeletedDependentIds[${index}]`, deletedId);
       });

      fileList.forEach(file => { if(file.originFileObj){ formData.append('Files', file.originFileObj); } });
      deletedDocumentIds.forEach((deletedId, index) => { formData.append(`DeletedDocumentIds[${index}]`, deletedId); });

      await updateHealthInfo(formData);
      message.success(intl.formatMessage({ id: "healthInfoAdmin.form.updateSuccess" }));
      // history.push bileşeni unmount eder; finally içinde setSubmitting uyarı üretirdi
      setSubmitting(false);
      history.push("/dashboard/admin-healthinfo");

    } catch (errorInfo) {
      if (errorInfo.errorFields) { message.error(intl.formatMessage({ id: "healthInfoAdmin.form.fillRequired" })); }
      else { console.error("Edit health info form submit error:", errorInfo); const errorMsg = errorInfo?.response?.data?.message || intl.formatMessage({ id: "healthInfoAdmin.form.operationFailed" }); message.error(errorMsg); }
      setSubmitting(false);
    }
  };

  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList.filter(f => f.originFileObj));
  };

  const handleDeleteExistingDocument = (documentId) => {
      setExistingDocuments(prev => prev.filter(doc => doc.id !== documentId));
      setDeletedDocumentIds(prev => [...prev, documentId]);
      message.info(intl.formatMessage({ id: "healthInfoAdmin.form.documentMarkedForDelete" }));
  };

   const handleRemoveDependent = (removeFunc, name, field) => {
        const dependentId = form.getFieldValue(['dependents', name, 'id']);
        if (dependentId && dependentId > 0) {
            setDeletedDependentIds(prev => [...prev, dependentId]);
             message.info(intl.formatMessage({ id: "healthInfoAdmin.form.dependentMarkedForDelete" }));
        }
        removeFunc(name);
    };

  const uploadProps = {
    fileList: fileList,
    onChange: handleFileChange,
    beforeUpload: () => false,
    multiple: true,
  };


  if (loading) {
    return ( <LayoutWrapper> <Spin tip={intl.formatMessage({ id: "healthInfoAdmin.form.loadingData" })} style={{ display: 'block', marginTop: '50px' }} /> </LayoutWrapper> );
  }

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px", padding: '24px' }}>
        <Breadcrumb style={{ margin: "0 0 16px 0" }}>
           <Breadcrumb.Item>{intl.formatMessage({ id: "healthInfoAdmin.breadcrumb.management" })}</Breadcrumb.Item>
           <Breadcrumb.Item><a href="/dashboard/admin-healthinfo">{intl.formatMessage({ id: "healthInfoAdmin.breadcrumb.title" })}</a></Breadcrumb.Item>
           <Breadcrumb.Item>{intl.formatMessage({ id: "healthInfoAdmin.form.editHealthInfo" })}</Breadcrumb.Item>
        </Breadcrumb>
        <PageHeader style={{ paddingLeft: 0, paddingBottom: 0, marginBottom: 0 }}>
             {intl.formatMessage({ id: "healthInfoAdmin.form.editHealthInfo" })}
        </PageHeader>

        <div style={{ height: '24px' }} />

        <Form form={form} layout="vertical" name="edit_health_info_form_compact_v5">

          {/* --- Genel Bilgiler --- */}
          <Title level={5} style={{ marginBottom: 0 }}><UserOutlined style={{ marginRight: 8 }}/>{intl.formatMessage({ id: "healthInfo.details.generalPolicyInfo" })}</Title>
          <Divider style={{ marginTop: 8, marginBottom: 24 }}/>
          <Row gutter={24}>
              <Col xs={24} sm={12}>
                <Form.Item name="userId" label={intl.formatMessage({ id: "healthInfo.details.user" })} rules={[{ required: true, message: intl.formatMessage({ id: "healthInfoAdmin.form.selectUserRequired" }) }]} style={{ marginBottom: 16 }}>
                  <Select placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.selectUser" })} showSearch filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}>
                    {users.map((user) => (<Option key={user.id} value={user.id}>{user.name}</Option>))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="insuranceCompanyName" label={intl.formatMessage({ id: "healthInfo.details.insuranceCompanyName" })} rules={[{ required: true, message: intl.formatMessage({ id: "healthInfoAdmin.form.requiredField" }) }]} style={{ marginBottom: 16 }}>
                  <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.insuranceCompanyPlaceholder" })}/>
                </Form.Item>
              </Col>

              {/* --- YENİ ACENTE ALANLARI --- */}
              <Col xs={24} sm={12}>
                <Form.Item name="agencyName" label={intl.formatMessage({ id: "healthInfo.details.agencyName" })} rules={[{ required: true, message: intl.formatMessage({ id: "healthInfoAdmin.form.agencyNameRequired" }) }]} style={{ marginBottom: 16 }}>
                  <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.agencyNamePlaceholder" })}/>
                </Form.Item>
              </Col>
              <Col xs={24} sm={6}>
                <Form.Item name="agencyContactPerson" label={intl.formatMessage({ id: "healthInfo.details.agencyContactPerson" })} rules={[{ required: true, message: intl.formatMessage({ id: "healthInfoAdmin.form.agencyContactPersonRequired" }) }]} style={{ marginBottom: 16 }}>
                  <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.agencyContactPersonPlaceholder" })}/>
                </Form.Item>
              </Col>

              {/* --- TELEFON INPUTU GÜNCELLENDİ --- */}
              <Col xs={24} sm={6}>
                <Form.Item 
                    name="agencyContactPhone" 
                    label={intl.formatMessage({ id: "healthInfo.details.agencyContactPhone" })} 
                    rules={[
                        { required: true, message: intl.formatMessage({ id: "healthInfoAdmin.form.phoneRequired" }) },
                        { validator: (_, value) => value && isValidPhoneNumber(value) ? Promise.resolve() : Promise.reject(new Error(intl.formatMessage({ id: "healthInfoAdmin.form.validPhoneRequired" }))) }
                    ]} 
                    style={{ marginBottom: 16 }}
                >
                  <PhoneInput
                    defaultCountry="TR"
                    international
                    placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.phonePlaceholder" })}
                  />
                </Form.Item>
              </Col>
              {/* ----------------------------------- */}

              <Col xs={24} sm={12}>
                <Form.Item name="insurancePolicyNo" label={intl.formatMessage({ id: "healthInfo.details.policyNumber" })} rules={[{ required: true, message: intl.formatMessage({ id: "healthInfoAdmin.form.requiredField" }) }]} style={{ marginBottom: 16 }}>
                  <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.policyNumberPlaceholder" })}/>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="policyType" label={intl.formatMessage({ id: "healthInfo.details.policyType" })} style={{ marginBottom: 16 }}>
                  <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.policyTypePlaceholder" })}/>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="insuranceBeginDate"
                  label={intl.formatMessage({ id: "healthInfo.details.insuranceBeginDate" })}
                  dependencies={["insuranceEndDate"]}
                  rules={[
                    { required: true, message: intl.formatMessage({ id: "healthInfoAdmin.form.requiredField" }) },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const end = getFieldValue("insuranceEndDate");
                        if (!value || !end) return Promise.resolve();
                        if (value.isAfter(end, "day")) {
                          return Promise.reject(
                            new Error(intl.formatMessage({ id: "healthInfoAdmin.form.beginAfterEndError" }))
                          );
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                  style={{ marginBottom: 16 }}
                >
                  <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.selectDate" })} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="insuranceEndDate"
                  label={intl.formatMessage({ id: "healthInfo.details.insuranceEndDate" })}
                  dependencies={["insuranceBeginDate"]}
                  rules={[
                    { required: true, message: intl.formatMessage({ id: "healthInfoAdmin.form.requiredField" }) },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        const begin = getFieldValue("insuranceBeginDate");
                        if (!value || !begin) return Promise.resolve();
                        if (value.isBefore(begin, "day")) {
                          return Promise.reject(
                            new Error(intl.formatMessage({ id: "healthInfoAdmin.form.endBeforeBeginError" }))
                          );
                        }
                        return Promise.resolve();
                      },
                    }),
                  ]}
                  style={{ marginBottom: 16 }}
                >
                  <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.selectDate" })} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                 <Form.Item name="policyStatus" label={intl.formatMessage({ id: "healthInfo.details.policyStatus" })} style={{ marginBottom: 16 }}>
                  <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.policyStatusPlaceholder" })}/>
                </Form.Item>
              </Col>
          </Row>

           {/* --- Kapsam Bilgileri --- */}
          <Title level={5} style={{ marginBottom: 0 }}><InfoCircleOutlined style={{ marginRight: 8 }}/>{intl.formatMessage({ id: "healthInfo.details.coverageInfo" })}</Title>
          <Divider style={{ marginTop: 8, marginBottom: 24 }}/>
           <Row gutter={24}>
                 <Col xs={24} sm={12}>
                     <Form.Item name="planName" label={intl.formatMessage({ id: "healthInfo.details.planName" })} style={{ marginBottom: 16 }}>
                        <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.planNamePlaceholder" })}/>
                     </Form.Item>
                 </Col>
                 <Col xs={24} sm={12}>
                     <Form.Item name="coverageArea" label={intl.formatMessage({ id: "healthInfo.details.coverageArea" })} style={{ marginBottom: 16 }}>
                        <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.coverageAreaPlaceholder" })}/>
                     </Form.Item>
                 </Col>
                 <Col xs={24} sm={12}>
                     <Form.Item name="coverageLimit" label={intl.formatMessage({ id: "healthInfo.details.coverageLimit" })} style={{ marginBottom: 16 }}>
                        <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.coverageLimitPlaceholder" })}/>
                     </Form.Item>
                 </Col>
                 <Col xs={24} sm={12}>
                     <Form.Item name="coveragePercentage" label={intl.formatMessage({ id: "healthInfo.details.coveragePercentage" })} style={{ marginBottom: 16 }}>
                        <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.coveragePercentagePlaceholder" })}/>
                     </Form.Item>
                 </Col>
           </Row>

          {/* --- Prim Detayları --- */}
          <Title level={5} style={{ marginBottom: 0 }}><DollarCircleOutlined style={{ marginRight: 8 }}/>{intl.formatMessage({ id: "healthInfo.details.premiumInfo" })}</Title>
          <Divider style={{ marginTop: 8, marginBottom: 24 }}/>
           <Row gutter={24}>
                 <Col xs={24} sm={12} md={8}>
                    <Form.Item name={['premiumDetails', 'totalPremium']} label={intl.formatMessage({ id: "healthInfo.details.totalPremium" })} style={{ marginBottom: 16 }}>
                      <InputNumber style={{ width: '100%' }} placeholder="Tutar" min={0} step={0.01} addonAfter="₺"/>
                    </Form.Item>
                 </Col>
                 <Col xs={24} sm={12} md={8}>
                    <Form.Item name={['premiumDetails', 'employerContribution']} label={intl.formatMessage({ id: "healthInfo.details.employerContribution" })} style={{ marginBottom: 16 }}>
                       <InputNumber style={{ width: '100%' }} placeholder="Tutar" min={0} step={0.01} addonAfter="₺"/>
                    </Form.Item>
                 </Col>
                 <Col xs={24} sm={12} md={8}>
                    <Form.Item name={['premiumDetails', 'employeeContribution']} label={intl.formatMessage({ id: "healthInfo.details.employeeContribution" })} style={{ marginBottom: 16 }}>
                       <InputNumber style={{ width: '100%' }} placeholder="Tutar" min={0} step={0.01} addonAfter="₺"/>
                    </Form.Item>
                 </Col>
                 <Col xs={24} sm={12} md={8}>
                    <Form.Item name={['premiumDetails', 'monthlyDeduction']} label={intl.formatMessage({ id: "healthInfo.details.monthlyDeduction" })} style={{ marginBottom: 16 }}>
                       <InputNumber style={{ width: '100%' }} placeholder="Tutar (varsa)" min={0} step={0.01} addonAfter="₺"/>
                    </Form.Item>
                 </Col>
                 <Col xs={24} sm={12} md={8}>
                     <Form.Item name={['premiumDetails', 'paymentType']} label={intl.formatMessage({ id: "healthInfo.details.paymentType" })} style={{ marginBottom: 16 }}>
                       <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.paymentTypePlaceholder" })}/>
                    </Form.Item>
                 </Col>
                  <Col xs={24} sm={12} md={8}>
                     <Form.Item name={['premiumDetails', 'installmentDetails']} label={intl.formatMessage({ id: "healthInfo.details.installmentDetails" })} style={{ marginBottom: 16 }}>
                       <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.installmentDetailsPlaceholder" })}/>
                    </Form.Item>
                 </Col>
                 <Col xs={24}>
                    <Form.Item name={['premiumDetails', 'taxAdvantageInfo']} label={intl.formatMessage({ id: "healthInfo.details.taxAdvantageInfo" })} style={{ marginBottom: 16 }}>
                       <TextArea rows={2} placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.taxAdvantagePlaceholder" })}/>
                    </Form.Item>
                 </Col>
           </Row>

          {/* --- Poliçeye Bağlı Ek Kişiler --- */}
          <Title level={5} style={{ marginBottom: 0 }}><TeamOutlined style={{ marginRight: 8 }}/>{intl.formatMessage({ id: "healthInfo.details.dependentsTitle" })}</Title>
          <Divider style={{ marginTop: 8, marginBottom: 24 }}/>
          <div style={{ marginBottom: 24 }}>
            <Form.List name="dependents">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, fieldKey, ...restField }, index) => (
                    <Row key={key} gutter={16} align="bottom" style={{ marginBottom: fields.length > 1 ? 16 : 8 }}>
                       <Form.Item {...restField} name={[name, 'id']} hidden fieldKey={[fieldKey, 'id']}> <Input /> </Form.Item>
                       <Col xs={24} sm={12} md={6}>
                          <Form.Item {...restField} name={[name, 'dependentName']} fieldKey={[fieldKey, 'dependentName']} label={`${intl.formatMessage({ id: "healthInfoAdmin.form.fullName" })} (${index + 1})`} rules={[{ required: true, message: intl.formatMessage({ id: "healthInfoAdmin.form.nameRequired" }) }]} style={{ marginBottom: 8 }}>
                             <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.dependentNamePlaceholder" })} />
                          </Form.Item>
                       </Col>
                       <Col xs={24} sm={12} md={5}>
                          <Form.Item {...restField} name={[name, 'relationship']} fieldKey={[fieldKey, 'relationship']} label={intl.formatMessage({ id: "healthInfo.details.relationship" })} rules={[{ required: true, message: intl.formatMessage({ id: "healthInfoAdmin.form.relationshipRequired" }) }]} style={{ marginBottom: 8 }}>
                             <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.relationshipPlaceholder" })} />
                          </Form.Item>
                       </Col>
                       <Col xs={24} sm={12} md={5}>
                          <Form.Item {...restField} name={[name, 'coverageStatus']} fieldKey={[fieldKey, 'coverageStatus']} label={intl.formatMessage({ id: "healthInfo.details.status" })} style={{ marginBottom: 8 }}>
                             <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.coverageStatusPlaceholder" })} />
                          </Form.Item>
                       </Col>
                       <Col xs={24} sm={12} md={6}>
                          <Form.Item {...restField} name={[name, 'planDetails']} fieldKey={[fieldKey, 'planDetails']} label={intl.formatMessage({ id: "healthInfo.details.plan" })} style={{ marginBottom: 8 }}>
                             <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.planDetailsPlaceholder" })} />
                          </Form.Item>
                       </Col>
                       <Col flex="none">
                          <Form.Item label=" " style={{ marginBottom: 8 }}>
                            <MinusCircleOutlined onClick={() => handleRemoveDependent(remove, name, fieldKey)} style={{ color: 'red', fontSize: '18px', cursor: 'pointer' }}/>
                          </Form.Item>
                       </Col>
                    </Row>
                  ))}
                  <Form.Item style={{ marginTop: fields.length > 0 ? 16 : 0 }}>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      {intl.formatMessage({ id: "healthInfoAdmin.form.addDependent" })}
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </div>

          {/* --- Poliçe Belgeleri --- */}
          <Title level={5} style={{ marginBottom: 0 }}><FileTextOutlined style={{ marginRight: 8 }}/>{intl.formatMessage({ id: "healthInfo.details.documentsTitle" })}</Title>
          <Divider style={{ marginTop: 8, marginBottom: 24 }}/>
           <Row gutter={24}>
               <Col xs={24}>
                   {/* Mevcut Belgeler */}
                   {existingDocuments.length > 0 && (
                       <div style={{ marginBottom: '20px' }}>
                           <Text strong>{intl.formatMessage({ id: "healthInfoAdmin.form.existingDocuments" })}</Text>
                           <List
                               size="small"
                               dataSource={existingDocuments}
                               renderItem={doc => (
                                   <List.Item
                                       key={doc.id}
                                       actions={[
                                            <Popconfirm
                                                title={intl.formatMessage({ id: "healthInfoAdmin.form.confirmDocumentDelete" })}
                                                onConfirm={() => handleDeleteExistingDocument(doc.id)}
                                                okText={intl.formatMessage({ id: "healthInfoAdmin.common.yesDelete" })} cancelText={intl.formatMessage({ id: "healthInfoAdmin.common.no" })}
                                            >
                                                <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                                            </Popconfirm>
                                       ]}
                                   >
                                       <List.Item.Meta
                                           avatar={<LinkOutlined />}
                                           title={<a href={`${host}/uploads/healthinfodocuments/${doc.filePath}`} target="_blank" rel="noopener noreferrer">{doc.filePath}</a>}
                                           description={`${intl.formatMessage({ id: "healthInfo.details.type" })}: ${doc.documentType || '-'} | ${intl.formatMessage({ id: "healthInfo.details.uploadedAt" })}: ${moment(doc.uploadedAt).format('DD.MM.YYYY HH:mm')}`}
                                       />
                                   </List.Item>
                               )}
                           />
                       </div>
                   )}

                   {/* Yeni Belge Yükleme */}
                    <Form.Item
                        label={
                            <span>
                                {intl.formatMessage({ id: "healthInfoAdmin.form.addNewDocument" })} <Text type="secondary" style={{marginLeft: '8px', fontWeight: 'normal'}}>({intl.formatMessage({ id: "healthInfoAdmin.form.addNewDocumentHint" })})</Text>
                            </span>
                        }
                        style={{ marginBottom: 16 }}
                    >
                        <Upload {...uploadProps}>
                            <Button icon={<UploadOutlined />}>{intl.formatMessage({ id: "healthInfoAdmin.form.selectFiles" })}</Button>
                        </Upload>
                    </Form.Item>
               </Col>
           </Row>

          {/* Gönderme Butonları */}
          <Form.Item style={{ textAlign: "right", marginTop: "24px", marginBottom: 0 }}>
            <Button onClick={() => history.push("/dashboard/admin-healthinfo")} style={{ marginRight: 8 }}>{intl.formatMessage({ id: "healthInfoAdmin.common.cancel" })}</Button>
            <Button type="primary" onClick={handleFormSubmit} loading={submitting}>{intl.formatMessage({ id: "healthInfoAdmin.common.update" })}</Button>
          </Form.Item>
        </Form>
      </Box>
    </LayoutWrapper>
  );
};

export default EditHealthInfo;