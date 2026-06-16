import React, { useState, useEffect } from "react";
import {
  Breadcrumb, Button, Form, Input, DatePicker, Select, message, Upload,
  InputNumber, Row, Col, Typography, Divider
} from "antd";
import { UploadOutlined, MinusCircleOutlined, PlusOutlined, UserOutlined, FileTextOutlined, TeamOutlined, DollarCircleOutlined, InfoCircleOutlined, RobotOutlined } from '@ant-design/icons';
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import { Box } from "../HealthInfo/HealthInfo.styles"; 
import moment from "moment";
import { addHealthInfo, parseHealthInfoWithAI } from "../../Api/HealthInfoApi";
import { UserListe } from "../../Api/UserApi";
import SecureLS from "secure-ls";

// --- YENİ EKLENEN IMPORTLAR (Telefon Inputu İçin) ---
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import "./customStyles.css"; // EmergencyContact'taki stil dosyasının aynı yerde olduğunu varsayıyorum, yoksa yolunu düzelt
import { useIntl } from "react-intl";
// ---------------------------------------------------

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

const AddHealthInfo = () => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [policyTckn, setPolicyTckn] = useState("");
  const history = useHistory();
  const ls = useState(() => new SecureLS({ encodingType: "aes" }))[0];
  const { accessToken } = useSelector((state) => state.Auth);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
const token =
  accessToken ||
  ls.get("accessToken") ||
  localStorage.getItem("token") ||
  localStorage.getItem("accessToken");

const userResponse = await UserListe(token);
        const userData = userResponse?.data?.data || userResponse?.data || [];
        if (Array.isArray(userData)) { setUsers(userData); }
        else { console.error("User list format is invalid!"); message.error(intl.formatMessage({ id: "healthInfoAdmin.form.userListFormatInvalid" })); setUsers([]); }
      } catch (error) { message.error(intl.formatMessage({ id: "healthInfoAdmin.form.userListFetchFailed" })); console.error("User list fetch error:", error); setUsers([]); }
    };
    fetchUsers();
  }, [acessToken, intl, ls]);

  const handleFormSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const formData = new FormData();

      formData.append('UserId', values.userId);
      formData.append('InsuranceCompanyName', values.insuranceCompanyName);
      
      // Yeni Acente Alanları
      formData.append('AgencyName', values.agencyName);
      formData.append('AgencyContactPerson', values.agencyContactPerson);
      formData.append('AgencyContactPhone', values.agencyContactPhone);

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
             formData.append(`Dependents[${index}].DependentName`, dependent.dependentName);
             formData.append(`Dependents[${index}].Relationship`, dependent.relationship);
             if (dependent.coverageStatus) formData.append(`Dependents[${index}].CoverageStatus`, dependent.coverageStatus);
             if (dependent.planDetails) formData.append(`Dependents[${index}].PlanDetails`, dependent.planDetails);
             formData.append(`Dependents[${index}].Id`, 0);
          }
        });
      }

      fileList.forEach(file => { formData.append('Files', file.originFileObj); });

await addHealthInfo(formData);
message.success(intl.formatMessage({ id: "healthInfoAdmin.form.addSuccess" }));
      history.push("/dashboard/admin-healthinfo");

    } catch (errorInfo) {
      if (errorInfo.errorFields) { message.error(intl.formatMessage({ id: "healthInfoAdmin.form.fillRequired" })); }
      else { console.error("Add health info form submit error:", errorInfo); const errorMsg = errorInfo?.response?.data?.message || intl.formatMessage({ id: "healthInfoAdmin.form.operationFailed" }); message.error(errorMsg); }
    } finally { setLoading(false); }
  };

  const handleAiParse = async () => {
    // Son yüklenen dosyayı al
    if (fileList.length === 0) {
      message.warning("Önce 'Dosyaları Seç' ile bir poliçe dosyası yükleyin.");
      return;
    }
    const lastFile = fileList[fileList.length - 1];
    const file = lastFile.originFileObj;
    if (!file) {
      message.error("Dosya bulunamadı, lütfen tekrar yükleyin.");
      return;
    }

    setAiLoading(true);
    message.loading({ content: "AI poliçe analiz ediyor...", key: "ai-parse", duration: 0 });

    try {
      const res = await parseHealthInfoWithAI(file);
      const result = res.data;

      if (!result.success || !result.data) {
        message.error({ content: result.error || "AI analiz başarısız!", key: "ai-parse" });
        return;
      }

      const d = result.data;

      // Form alanlarını doldur
      const fieldsToSet = {};
      if (d.Sigorta_Sirketi) fieldsToSet.insuranceCompanyName = d.Sigorta_Sirketi;
      if (d.Police_Numarasi) fieldsToSet.insurancePolicyNo = d.Police_Numarasi;
      if (d.Police_Turu) fieldsToSet.policyType = d.Police_Turu;
      if (d.Police_Durumu) fieldsToSet.policyStatus = d.Police_Durumu;
      if (d.Acente_Adi) fieldsToSet.agencyName = d.Acente_Adi;
      if (d.Acente_Yetkili) fieldsToSet.agencyContactPerson = d.Acente_Yetkili;
      if (d.Acente_Telefon) fieldsToSet.agencyContactPhone = d.Acente_Telefon;
      if (d.Plan_Adi) fieldsToSet.planName = d.Plan_Adi;
      if (d.Kapsam_Alani) fieldsToSet.coverageArea = d.Kapsam_Alani;
      if (d.Kapsam_Limiti) fieldsToSet.coverageLimit = d.Kapsam_Limiti;
      if (d.Teminat_Yuzdesi) fieldsToSet.coveragePercentage = d.Teminat_Yuzdesi;

      // Tarih parse
      if (d.Baslangic_Tarihi) {
        const parsed = moment(d.Baslangic_Tarihi, ["DD/MM/YYYY", "DD.MM.YYYY", "YYYY-MM-DD"]);
        if (parsed.isValid()) fieldsToSet.insuranceBeginDate = parsed;
      }
      if (d.Bitis_Tarihi) {
        const parsed = moment(d.Bitis_Tarihi, ["DD/MM/YYYY", "DD.MM.YYYY", "YYYY-MM-DD"]);
        if (parsed.isValid()) fieldsToSet.insuranceEndDate = parsed;
      }

      // Prim detayları
      const premiumDetails = {};
      if (d.Toplam_Prim) premiumDetails.totalPremium = parseFloat(d.Toplam_Prim) || null;
      if (d.Odeme_Turu) premiumDetails.paymentType = d.Odeme_Turu;
      if (d.Taksit_Detay) premiumDetails.installmentDetails = d.Taksit_Detay;
      if (Object.keys(premiumDetails).length > 0) fieldsToSet.premiumDetails = premiumDetails;

      // TCKN kutucuğunu doldur
      if (d.Sigortali_TCKN) setPolicyTckn(d.Sigortali_TCKN);

      // Kullanıcı eşleştirme: isim → TCKN fallback
      if (d.Sigortali_Adi && users.length > 0) {
        const normalize = (s) => (s || "").toLocaleLowerCase("tr-TR").replace(/ğ/g,"g").replace(/ş/g,"s").replace(/ı/g,"i").replace(/ö/g,"o").replace(/ü/g,"u").replace(/ç/g,"c").trim();
        const policyName = normalize(d.Sigortali_Adi);

        let candidates = users.filter((u) => {
          const userName = normalize(u.name);
          return userName === policyName || policyName.includes(userName) || userName.includes(policyName);
        });

        if (candidates.length === 1) {
          fieldsToSet.userId = candidates[0].id;
          message.info(`Kullanıcı eşleşti: ${candidates[0].name}`);
        } else if (candidates.length > 1 && d.Sigortali_TCKN) {
// Maskelenmiş TCKN ile daralt (ilk 3 + son 3 hane)
const masked = d.Sigortali_TCKN.replace(/\s/g, "");
          const first3 = masked.slice(0, 3);
          const last3 = masked.slice(-3);
          if (first3.length === 3 && last3.length === 3) {
            const refined = candidates.filter((u) => {
              const tc = (u.tc || "").trim();
              return tc.length >= 6 && tc.startsWith(first3) && tc.endsWith(last3);
            });
            if (refined.length === 1) {
              fieldsToSet.userId = refined[0].id;
              message.info(`Kullanıcı eşleşti (TCKN): ${refined[0].name}`);
            } else {
              message.warning("Birden fazla kullanıcı eşleşti, lütfen manuel seçin.");
            }
          }
        }
      }

      form.setFieldsValue(fieldsToSet);
      message.success({ content: `AI analiz tamamlandı! (${result.processing_time}s)`, key: "ai-parse" });
    } catch (err) {
      console.error("AI parse hatası:", err);
      message.error({ content: "AI servisi ile bağlantı kurulamadı!", key: "ai-parse" });
    } finally {
      setAiLoading(false);
    }
  };

  const uploadProps = {
     onRemove: file => {
      setFileList(prevList => {
        const index = prevList.findIndex(item => item.uid === file.uid);
        const newFileList = prevList.slice();
        newFileList.splice(index, 1);
        return newFileList;
      });
    },
    beforeUpload: (file) => {
      setFileList(prevList => [...prevList, {
          uid: file.uid, name: file.name, status: 'done', originFileObj: file
      }]);
      return false;
    },
    fileList,
    multiple: true,
  };

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px", padding: '24px' }}>
        <Breadcrumb style={{ margin: "0 0 16px 0" }}>
           <Breadcrumb.Item>{intl.formatMessage({ id: "healthInfoAdmin.breadcrumb.management" })}</Breadcrumb.Item>
           <Breadcrumb.Item><a href="/dashboard/admin-healthinfo">{intl.formatMessage({ id: "healthInfoAdmin.breadcrumb.title" })}</a></Breadcrumb.Item>
           <Breadcrumb.Item>{intl.formatMessage({ id: "healthInfoAdmin.form.newHealthInfo" })}</Breadcrumb.Item>
        </Breadcrumb>
        <PageHeader style={{ paddingLeft: 0, paddingBottom: 0, marginBottom: 0 }}>
            {intl.formatMessage({ id: "healthInfoAdmin.form.newHealthInfo" })}
        </PageHeader>

        <div style={{ height: '24px' }} />

        <Form form={form} layout="vertical" name="add_health_info_form_compact_v10">

          {/* --- Genel Poliçe Bilgileri --- */}
          <Title level={5} style={{ marginBottom: 0 }}><UserOutlined style={{ marginRight: 8 }}/>{intl.formatMessage({ id: "healthInfo.details.generalPolicyInfo" })}</Title>
          <Divider style={{ marginTop: 8, marginBottom: 24 }}/>
          <Row gutter={24}>
              <Col xs={24} sm={8}>
<Form.Item
  name="userId"
  label={intl.formatMessage({ id: "healthInfo.details.user" })}
  rules={[
    {
      required: true,
      message: intl.formatMessage({
        id: "healthInfoAdmin.form.selectUserRequired",
      }),
    },
  ]}
  style={{ marginBottom: 16 }}
>
  <Select
    placeholder={intl.formatMessage({
      id: "healthInfoAdmin.form.selectUser",
    })}
    showSearch
    filterOption={(input, option) => {
                    const text = (option?.label || option?.children || "").toString().toLowerCase();
                    return text.includes(input.toLowerCase());
                  }}>
                    {users.map((user) => {
                      const tcDisplay = user.tc ? ` (TC: ${user.tc.slice(0,3)}***${user.tc.slice(-3)})` : "";
                      return <Option key={user.id} value={user.id}>{user.name}{policyTckn ? tcDisplay : ""}</Option>;
                    })}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={4}>
                <Form.Item label="TCKN (Poliçe)" style={{ marginBottom: 16 }}>
                  <Input
                    value={policyTckn}
                    onChange={(e) => setPolicyTckn(e.target.value)}
                    placeholder="AI ile doldurulur"
                  />
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
                    // Stil ayarları gerekirse buraya veya css dosyasına eklenebilir
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
                  {fields.map(({ key, name, ...restField }, index) => (
                    <Row key={key} gutter={16} align="bottom" style={{ marginBottom: fields.length > 1 ? 16 : 8 }}>
                       <Col xs={24} sm={12} md={6}>
                          <Form.Item {...restField} name={[name, 'dependentName']} label={`${intl.formatMessage({ id: "healthInfoAdmin.form.fullName" })} (${index + 1})`} rules={[{ required: true, message: intl.formatMessage({ id: "healthInfoAdmin.form.nameRequired" }) }]} style={{ marginBottom: 8 }}>
                             <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.dependentNamePlaceholder" })} />
                          </Form.Item>
                       </Col>
                       <Col xs={24} sm={12} md={5}>
                          <Form.Item {...restField} name={[name, 'relationship']} label={intl.formatMessage({ id: "healthInfo.details.relationship" })} rules={[{ required: true, message: intl.formatMessage({ id: "healthInfoAdmin.form.relationshipRequired" }) }]} style={{ marginBottom: 8 }}>
                             <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.relationshipPlaceholder" })} />
                          </Form.Item>
                       </Col>
                       <Col xs={24} sm={12} md={5}>
                          <Form.Item {...restField} name={[name, 'coverageStatus']} label={intl.formatMessage({ id: "healthInfo.details.status" })} style={{ marginBottom: 8 }}>
                             <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.coverageStatusPlaceholder" })} />
                          </Form.Item>
                       </Col>
                       <Col xs={24} sm={12} md={6}>
                          <Form.Item {...restField} name={[name, 'planDetails']} label={intl.formatMessage({ id: "healthInfo.details.plan" })} style={{ marginBottom: 8 }}>
                             <Input placeholder={intl.formatMessage({ id: "healthInfoAdmin.form.planDetailsPlaceholder" })} />
                          </Form.Item>
                       </Col>
                       <Col flex="none">
                          <Form.Item label=" " style={{ marginBottom: 8 }}>
                            <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red', fontSize: '18px', cursor: 'pointer' }}/>
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
                    <Form.Item
                        label={
                            <span>
                                {intl.formatMessage({ id: "healthInfoAdmin.form.uploadDocuments" })} <Text type="secondary" style={{marginLeft: '8px', fontWeight: 'normal'}}>({intl.formatMessage({ id: "healthInfoAdmin.form.uploadDocumentsHint" })})</Text>
                            </span>
                        }
                        style={{ marginBottom: 16 }}
                    >
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <Upload {...uploadProps}>
<Button icon={<UploadOutlined />}>
  {intl.formatMessage({ id: "healthInfoAdmin.form.selectFiles" })}
</Button>
                          </Upload>
                          <Button
                            icon={<RobotOutlined />}
                            loading={aiLoading}
                            onClick={handleAiParse}
                            disabled={fileList.length === 0}
                            style={{ background: fileList.length > 0 ? '#722ed1' : undefined, borderColor: fileList.length > 0 ? '#722ed1' : undefined, color: fileList.length > 0 ? '#fff' : undefined }}
                          >
                            AI ile Doldur
                          </Button>
                        </div>
                    </Form.Item>
               </Col>
           </Row>

          <Form.Item style={{ textAlign: "right", marginTop: "24px", marginBottom: 0 }}>
            <Button onClick={() => history.push("/dashboard/admin-healthinfo")} style={{ marginRight: 8 }}>{intl.formatMessage({ id: "healthInfoAdmin.common.cancel" })}</Button>
            <Button type="primary" onClick={handleFormSubmit} loading={loading}>{intl.formatMessage({ id: "healthInfoAdmin.common.add" })}</Button>
          </Form.Item>
        </Form>
      </Box>
    </LayoutWrapper>
  );
};

export default AddHealthInfo;