import React, { useState, useEffect, useMemo } from "react";
import tr_TR from "antd/lib/locale/tr_TR";
import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Select,
  TimePicker,
  Upload,
  message,
  Row,
  Col,
  Modal,      
  Checkbox,   
  Alert,
  Tooltip,
  Typography
} from "antd";
import axios from "axios";
import { buildApiUrl } from "../../../../Api/host";
// --- REDUX IMPORT ---
import { useSelector } from "react-redux"; 
import { GetPermissionTypes } from "../../../../Api/ParameterApi";
import { GetAllHoliday } from "../../../../Api/HolidayApi";
import { calculateWorkingLeaveDays, formatTrDecimal } from "../../../../utils/workingLeaveDays";

// --- PHONE INPUT IMPORT ---
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

import moment from "moment";
import "moment/locale/tr";
import { useIntl } from "react-intl";
moment.locale("tr");

const { Option } = Select;

const getDurationUnit = (obj) => (obj?.durationUnit ?? obj?.DurationUnit ?? 1);
const getMaxDuration = (obj) => (obj?.maxDuration ?? obj?.MaxDuration);
const getMinDuration = (obj) => (obj?.minDuration ?? obj?.MinDuration);
const isDivisible = (obj) => (obj?.isDivisible ?? obj?.IsDivisible ?? false);

// --- ESKİ TASARIM AYARLARI ---
const layout = {
  labelCol: { span: 9 },
  wrapperCol: { span: 15 },
};

const normFile = (e) => {
  if (Array.isArray(e)) return e;
  return e && e.fileList;
};

const HolidayForm = ({ onCreated, leaveBalance }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  
  const { id, email } = useSelector((state) => state.Auth);

  const [izinTipi, setİzinTipi] = useState(null);
  const [mazeretTipi, setMazeretTipi] = useState(null);
  const [mazeretList, setMazeretList] = useState([]);
  const [selectedMazeretObj, setSelectedMazeretObj] = useState(null);
  const [showTimeFields, setShowTimeFields] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [baslaValue, setBaslaValue] = useState(null);
  const [bitirValue, setBitirValue] = useState(null);
  const [baslangicSaatiValue, setBaslangicSaatiValue] = useState(null);
  const [holidays, setHolidays] = useState([]);

  const wBasla = Form.useWatch("basla", form);
  const wBitir = Form.useWatch("bitir", form);
  const wBaslangicTuru = Form.useWatch("baslangicTuru", form);
  const wBitisTuru = Form.useWatch("bitisTuru", form);
  const wBaslangicSaati = Form.useWatch("baslangicSaati", form);
  const wBitisSaati = Form.useWatch("bitisSaati", form);

  useEffect(() => {
    GetAllHoliday()
      .then((res) => {
        const d = res?.data?.data ?? res?.data ?? [];
        if (Array.isArray(d)) setHolidays(d);
      })
      .catch(() => setHolidays([]));
  }, []);

  // --- İZİN TİPLERİ LOAD ETTİRME ---
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await GetPermissionTypes();
        const data = response.data.data !== undefined ? response.data.data : response.data;
        setMazeretList(data.filter((item) => {
            const p = (item.permission || item.Permission || "").toLowerCase();
            return p === "mazeret";
        }));
      } catch (error) {
        console.error("Mazeret izinleri yüklenemedi", error);
      }
    };
    fetchPermissions();
  }, []);

  // --- TARİH KISITLAMA FONKSİYONLARI ---
  const disabledBaslaDate = (current) => {
    // Bugünden önceki günler seçilemez
    return current && current < moment().startOf("day");
  };

  const disabledBitirDate = (current) => {
    const today = moment().startOf("day");
    if (baslaValue) {
      const beforeStart = current < baslaValue.clone().startOf("day");
      const beforeToday = current < today;
      // Gün biriminde max süre varsa ve izin bölünebilirse, bitiş tarihine üst sınır uygula
      const maxDur = getMaxDuration(selectedMazeretObj);
      const du = getDurationUnit(selectedMazeretObj);
      if (du === 1 && maxDur != null && isDivisible(selectedMazeretObj)) {
        const maxDate = baslaValue.clone().add(Number(maxDur) - 1, 'days').endOf("day");
        return current && (beforeToday || beforeStart || current > maxDate);
      }
      return current && (beforeToday || beforeStart);
    }
    return current && current < today;
  };

  // --- HASTALIK: bugün kısıtı yok, sadece bitiş başlangıçtan önce seçilemesin ---
  const disabledBaslaDateHastalik = () => false; // hiçbir tarih devre dışı değil

  const disabledBitirDateHastalik = (current) => {
    if (baslaValue) {
      return current && current.isBefore(baslaValue.clone().startOf("day"));
    }
    return false;
  };

  // --- SAAT KISITLAMA FONKSİYONLARI (Süt İzni / Saatlik) ---
  const disabledBitisSaatiHours = () => {
    if (!baslangicSaatiValue) return [];
    const startHour = baslangicSaatiValue.hour();
    return Array.from({ length: startHour }, (_, i) => i);
  };

  const disabledBitisSaatiMinutes = (selectedHour) => {
    if (!baslangicSaatiValue) return [];
    const startHour = baslangicSaatiValue.hour();
    const startMinute = baslangicSaatiValue.minute();
    if (selectedHour === startHour) {
      return Array.from({ length: startMinute + 1 }, (_, i) => i);
    }
    return [];
  };

  // --- AVANS İZİN STATE'LERİ ---
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isAdvanceApproved, setIsAdvanceApproved] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);

  // --- TELEFONU PROFİLDEN ÇEKME ---
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;
      try {
        const response = await axios.get(
          buildApiUrl(`/api/UserProfileDetail/getByUserId/${id}`)
        );
        if (response.data && response.data.success) {
          const userProfile = response.data.data;
          const phoneFromProfile = userProfile.telNo || userProfile.TelNo || userProfile.phoneNumber;
          if (phoneFromProfile) {
            form.setFieldsValue({ phone: phoneFromProfile });
          }
        }
      } catch (error) {
        console.error("Profil detayları çekilemedi:", error);
      }
    };
    fetchUserProfile();
  }, [id, form]); 

  // --- FORM GÖNDERME MANTIĞI ---
  const submitFormLogic = async (values, isAdvanceConfirmed = false) => {
    setLoading(true);
    const key = "updatable";
    if(!isAdvanceConfirmed) message.loading({ content: intl.formatMessage({ id: "permission.form.submitting" }), key });

    try {
      if (!id) {
        message.error({ content: intl.formatMessage({ id: "permission.form.userNotFound" }), key });
        setLoading(false);
        return;
      }

      let permissionTypeId = 0;
      if (izinTipi === "ücretli") permissionTypeId = 1;
      else if (izinTipi === "ücretsiz") permissionTypeId = 2;
      else if (izinTipi === "kategori3") {
        permissionTypeId = mazeretTipi || 0;
      }

      if (!permissionTypeId) {
        message.error({ content: intl.formatMessage({ id: "permission.form.invalidType" }), key, duration: 3 });
        setLoading(false);
        return;
      }

      // --- Mazeret: min/max süre (parametreler) — saat modu: anında kontrol; gün modu: API (çalışma günü) ---
      if (izinTipi === "kategori3" && selectedMazeretObj && showTimeFields) {
        const minD = getMinDuration(selectedMazeretObj);
        const maxD = getMaxDuration(selectedMazeretObj);
        const dateSelected = moment(values.basla).format("YYYY-MM-DD");
        const tStart = moment(values.baslangicSaati).format("HH:mm:ss");
        const tEnd = moment(values.bitisSaati).format("HH:mm:ss");
        const startM = moment(`${dateSelected} ${tStart}`);
        const endM = moment(`${dateSelected} ${tEnd}`);
        const hours = endM.diff(startM, "hours", true);
        if (hours <= 0) {
          message.error({ content: intl.formatMessage({ id: "permission.form.endAfterStartHour" }), key, duration: 3 });
          setLoading(false);
          return;
        }
        if (minD != null && hours < Number(minD) - 1e-6) {
          message.error({ content: intl.formatMessage({ id: "permission.form.minHours" }, { min: minD }), key, duration: 4 });
          setLoading(false);
          return;
        }
        if (maxD != null && hours > Number(maxD) + 1e-6) {
          message.error({ content: intl.formatMessage({ id: "permission.form.maxHours" }, { max: maxD }), key, duration: 4 });
          setLoading(false);
          return;
        }
      }

      const formData = new FormData();

      if (fileList && fileList.length > 0) {
        fileList.forEach((file) => {
          formData.append("documentFile", file.originFileObj);
        });
      }

      // --- TARİH VE SAAT MANTIĞI ---
      let finalStartTime = "";
      let finalEndTime = "";

      if (showTimeFields) {
          const dateSelected = moment(values.basla).format("YYYY-MM-DD");
          const timeStart = moment(values.baslangicSaati).format("HH:mm:ss");
          const timeEnd = moment(values.bitisSaati).format("HH:mm:ss");
          finalStartTime = `${dateSelected} ${timeStart}`;
          finalEndTime = `${dateSelected} ${timeEnd}`;
      } 
      else {
          let startHour = "09:00:00"; 
          if (values.baslangicTuru === "yarim") startHour = "13:30:00"; 

          let endHour = "18:00:00";
          if (values.bitisTuru === "yarim") endHour = "12:30:00"; 

          const dateStart = moment(values.basla).format("YYYY-MM-DD");
          const dateEnd = values.bitir ? moment(values.bitir).format("YYYY-MM-DD") : dateStart;

          finalStartTime = `${dateStart} ${startHour}`;
          finalEndTime = `${dateEnd} ${endHour}`;
      }

      // --- API VERİLERİ ---
      formData.append("UserId", id); 
      formData.append("PermissionTypeId", permissionTypeId);
      formData.append("Address", values.address);
      formData.append("Email", email || "user@intellium.com"); 
      formData.append("PhoneNumber", values.phone);
      formData.append("StartTime", finalStartTime);
      formData.append("EndTime", finalEndTime);
      formData.append("Description", values.introduction);

      // Avans Onayı
      formData.append("IsAdvanceApproved", String(isAdvanceConfirmed));
      if (isAdvanceConfirmed) {
         formData.append("AdvanceLeaveConsentAt", moment().toISOString(true));
      }

      const response = await axios.post(
        buildApiUrl("/api/permission/add"),
        formData
      );

      if (response.data.success) {
        message.success({ content: intl.formatMessage({ id: "permission.form.successCreated" }), key, duration: 2 });
        form.resetFields();
        setFileList([]);
        setİzinTipi(null);
        setMazeretTipi(null);
        setSelectedMazeretObj(null);
        setShowTimeFields(false);
        form.setFieldsValue({ baslangicTuru: "tam", bitisTuru: "tam" });
        
        setIsAdvanceModalOpen(false);
        setIsAdvanceApproved(false);
        setPendingValues(null);
        if (onCreated) onCreated();
      } else {
        // --- AVANS KONTROLÜ ---
        if (response.data.message === "NOT_ENOUGH_LEAVE") {
            setPendingValues(values);
            setIsAdvanceModalOpen(true);
            message.destroy(); 
        } else {
            message.error({ content: response.data.message || intl.formatMessage({ id: "permission.form.errorGeneric" }), key, duration: 3 });
        }
      }

    } catch (error) {
      console.error("Error:", error);
      const errorMsg = error.response?.data?.message || "Sunucu hatası oluştu.";
      if(errorMsg === "NOT_ENOUGH_LEAVE") {
          setPendingValues(values);
          setIsAdvanceModalOpen(true);
          message.destroy();
      } else {
          message.error({ content: errorMsg, key, duration: 3 });
      }
    } finally {
        setLoading(false);
    }
  };

  // İlk tetikleme
  const onFinish = (values) => {
      submitFormLogic(values, false);
  };

  // Modaldan gelen onay
  const handleAdvanceSubmit = () => {
      if(!isAdvanceApproved) {
          message.warning(intl.formatMessage({ id: "permission.form.advanceConsentRequired" }));
          return;
      }
      submitFormLogic(pendingValues, true);
  };

  const handleUploadChange = ({ fileList: newFileList }) => setFileList(newFileList.slice(-1));

  const handleIzinTipiChange = (value) => {
    setİzinTipi(value);
    setMazeretTipi(null);
    setSelectedMazeretObj(null);
    setShowTimeFields(false);
    form.setFieldsValue({ basla: null, bitir: null });
    setBaslaValue(null);
    setBitirValue(null);
  };

  const handleMazeretTipiChange = (value) => {
    setMazeretTipi(value);
    const selectedItem = mazeretList.find(x => x.id === value);
    setSelectedMazeretObj(selectedItem);

    const du = getDurationUnit(selectedItem);
    setShowTimeFields(du === 2);

    form.setFieldsValue({ basla: null, bitir: null });
    setBaslaValue(null);
    setBitirValue(null);
  };

  // === PARAMETRE-GÜDÜMLÜ FORM DEĞİŞKENLERİ ===
  // Bitiş tarihi otomatik: gün biriminde, bölünemez ve maksimum gün tanımlıysa
  const maxDurForAuto = getMaxDuration(selectedMazeretObj);
  const durUnitSel = getDurationUnit(selectedMazeretObj);
  const isEndDateAutoCalculated = !!(
    selectedMazeretObj &&
    !isDivisible(selectedMazeretObj) &&
    durUnitSel === 1 &&
    maxDurForAuto != null &&
    maxDurForAuto !== ""
  );
  // Tam/Yarım gün seçicileri gösterilsin mi? (bölünebilir izinlerde evet)
  const showDayTypeSelectors = !selectedMazeretObj || isDivisible(selectedMazeretObj);

  const annualRemaining = Number(leaveBalance?.remainingLeave) || 0;
  const paidLeaveCap = annualRemaining;
  const paidCapLabel = Number.isInteger(paidLeaveCap) ? String(paidLeaveCap) : paidLeaveCap.toFixed(1);

  const formatPaidDisplay = (s) => {
    if (s === "Ücretli") return intl.formatMessage({ id: "parametre.permission.paidOptionPaid" });
    if (s === "Ücretsiz") return intl.formatMessage({ id: "parametre.permission.paidOptionUnpaid" });
    if (s === "SGK") return intl.formatMessage({ id: "parametre.permission.paidOptionSgk" });
    return s;
  };
  const dash = intl.formatMessage({ id: "parametre.permission.minMaxDash" });
  const hourUnit = intl.formatMessage({ id: "parametre.permission.unitHourSuffix" });
  const dayUnit = intl.formatMessage({ id: "parametre.permission.unitDaySuffix" });
  const dayWord = intl.formatMessage({ id: "parametre.permission.durationUnit.day" });
  const hourWord = intl.formatMessage({ id: "parametre.permission.durationUnit.hour" });

  const talepSureOzeti = useMemo(() => {
    if (!izinTipi) return null;
    if (showTimeFields) {
      if (!wBasla || !wBaslangicSaati || !wBitisSaati) return null;
      const dateSelected = moment(wBasla).format("YYYY-MM-DD");
      const ts = moment(wBaslangicSaati).format("HH:mm:ss");
      const te = moment(wBitisSaati).format("HH:mm:ss");
      const start = moment(`${dateSelected} ${ts}`);
      const end = moment(`${dateSelected} ${te}`);
      if (!end.isAfter(start)) return null;
      const hours = end.diff(start, "hours", true);
      if (hours <= 0) return null;
      return `${formatTrDecimal(hours)} ${intl.formatMessage({ id: "permission.form.hoursUnit" })}`;
    }
    if (!wBasla || !wBitir) return null;
    const turB = wBaslangicTuru ?? "tam";
    const turE = wBitisTuru ?? "tam";
    let startHour = "09:00:00";
    if (turB === "yarim") startHour = "13:30:00";
    let endHour = "18:00:00";
    if (turE === "yarim") endHour = "12:30:00";
    const dateStart = moment(wBasla).format("YYYY-MM-DD");
    const dateEnd = moment(wBitir).format("YYYY-MM-DD");
    const start = moment(`${dateStart} ${startHour}`);
    const end = moment(`${dateEnd} ${endHour}`);
    if (end.isBefore(start)) return null;
    const gun = calculateWorkingLeaveDays(start, end, holidays);
    if (gun === null) return null;
    return `${formatTrDecimal(gun)} ${intl.formatMessage({ id: "permission.form.workingDaysUnit" })}`;
  }, [
    intl,
    izinTipi,
    showTimeFields,
    wBasla,
    wBitir,
    wBaslangicTuru,
    wBitisTuru,
    wBaslangicSaati,
    wBitisSaati,
    holidays,
  ]);

  const talepSureRow =
    talepSureOzeti && (
      <Form.Item
        wrapperCol={{ offset: 9, span: 15 }}
        style={{ marginTop: 4, marginBottom: 22 }}
      >
        <Typography.Text style={{ fontSize: 14, color: "#262626" }}>
          {intl.formatMessage({ id: "permission.form.durationSummary" })}{" "}
          <Typography.Text strong style={{ color: "#1a1a1a" }}>{talepSureOzeti}</Typography.Text>
        </Typography.Text>
      </Form.Item>
    );

  return (
    <>
    <Form
      {...layout}
      form={form}
      name="holiday_form"
      onFinish={onFinish}
      initialValues={{ baslangicTuru: "tam", bitisTuru: "tam" }}
      style={{ maxWidth: 750, margin: "30px 0" }}
    >
        {/* 1. İzin Tipi */}
        <Form.Item label={intl.formatMessage({ id: "permission.form.leaveType" })} name="izinTipi" rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.leaveTypeRequired" }) }]}>
            <Select placeholder={intl.formatMessage({ id: "permission.form.selectPlaceholder" })} onChange={handleIzinTipiChange}>
            <Option value="ücretli">{intl.formatMessage({ id: "permission.form.optionPaid" })}</Option>
            <Option value="ücretsiz">{intl.formatMessage({ id: "permission.form.optionUnpaid" })}</Option>
            <Option value="kategori3">{intl.formatMessage({ id: "permission.form.optionExcuse" })}</Option>
            </Select>
        </Form.Item>

        
        {izinTipi === "kategori3" && (
            <Form.Item label={intl.formatMessage({ id: "permission.form.excuseType" })} name="mazeretTipi" rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.excuseTypeRequired" }) }]}>
                <Select onChange={handleMazeretTipiChange} placeholder={intl.formatMessage({ id: "permission.form.excusePlaceholder" })}>
                    {mazeretList.map(item => (
                        <Option key={item.id} value={item.id}>
                            {item.subPermission === "Vefat İzni" ? (
                                <Tooltip title={intl.formatMessage({ id: "permission.form.vefatTooltip" })}>
                                    <span>{intl.formatMessage({ id: "permission.form.vefatOptionLabel" })}</span>
                                </Tooltip>
                            ) : (
                                item.subPermission
                            )}
                        </Option>
                    ))}
                </Select>
            </Form.Item>
        )}

        {/* PARAMETRE BİLGİ KARTI */}
        {selectedMazeretObj && izinTipi === "kategori3" && (
            <Form.Item wrapperCol={{ offset: 9, span: 15 }}>
                <Alert
                    type="info"
                    showIcon
                    style={{ borderRadius: '6px' }}
                    message={intl.formatMessage({ id: "permission.form.rulesTitle" }, { name: selectedMazeretObj.subPermission })}
                    description={
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: 16, fontSize: '13px' }}>
                            <li>
                                {intl.formatMessage({ id: "permission.form.ruleUnit" })}{" "}
                                <strong>{getDurationUnit(selectedMazeretObj) === 2 ? hourWord : dayWord}</strong>
                                {(() => {
                                    const du = getDurationUnit(selectedMazeretObj);
                                    const minV = getMinDuration(selectedMazeretObj);
                                    const maxV = getMaxDuration(selectedMazeretObj);
                                    const div = isDivisible(selectedMazeretObj);
                                    if (du === 1 && !div && maxV != null) {
                                        return (
                                            <> — <strong>{intl.formatMessage({ id: "permission.form.ruleFixed" }, { days: maxV })}</strong></>
                                        );
                                    }
                                    if (minV != null || maxV != null) {
                                        const u = du === 2 ? hourUnit : dayUnit;
                                        return (
                                            <>
                                                {" "}
                                                — {intl.formatMessage({ id: "permission.form.ruleMin" })}{" "}
                                                <strong>{minV ?? dash}</strong>
                                                {u}, {intl.formatMessage({ id: "permission.form.ruleMax" })}{" "}
                                                <strong>{maxV ?? dash}</strong>
                                                {u}
                                            </>
                                        );
                                    }
                                    return null;
                                })()}
                            </li>
                            <li>{isDivisible(selectedMazeretObj) ? intl.formatMessage({ id: "permission.form.ruleDivisible" }) : intl.formatMessage({ id: "permission.form.ruleIndivisible" })}</li>
                       
                            {selectedMazeretObj.requiresDocument && <li style={{ color: '#fa8c16' }}><strong>{intl.formatMessage({ id: "permission.form.ruleDocRequired" })}</strong></li>}
                            <li>{intl.formatMessage({ id: "permission.form.rulePaidLabel" })} {formatPaidDisplay(selectedMazeretObj.isPaid)}</li>
                        </ul>
                    }
                />
            </Form.Item>
        )}

        {/* 2. TARİH SEÇİMİ */}
        {showTimeFields ? (
            <>
                <Form.Item label={intl.formatMessage({ id: "permission.form.leaveDate" })} name="basla" rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.dateRequired" }) }]}>
                    <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} locale={tr_TR} disabledDate={disabledBaslaDate} />
                </Form.Item>
                <Form.Item label={intl.formatMessage({ id: "permission.form.startTime" })} name="baslangicSaati" rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.timeRequired" }) }]}>
                    <TimePicker
                      format="HH:mm"
                      style={{ width: "100%" }}
                      placeholder={intl.formatMessage({ id: "permission.form.startTimePlaceholder" })}
                      onChange={(time) => {
                        setBaslangicSaatiValue(time);
                        // Başlangıç değişince bitiş saatini sıfırla
                        form.setFieldsValue({ bitisSaati: null });
                      }}
                    />
                </Form.Item>
                <Form.Item
                  label={intl.formatMessage({ id: "permission.form.endTime" })}
                  name="bitisSaati"
                  rules={[
                    { required: true, message: intl.formatMessage({ id: "permission.form.timeRequired" }) },
                    {
                      validator: (_, value) => {
                        if (!value || !baslangicSaatiValue) return Promise.resolve();
                        if (value.isSameOrBefore(baslangicSaatiValue)) {
                          return Promise.reject(intl.formatMessage({ id: "permission.form.timeAfterStart" }));
                        }
                        return Promise.resolve();
                      },
                    },
                  ]}
                >
                    <TimePicker
                      format="HH:mm"
                      style={{ width: "100%" }}
                      placeholder={intl.formatMessage({ id: "permission.form.endTimePlaceholder" })}
                      disabledHours={disabledBitisSaatiHours}
                      disabledMinutes={disabledBitisSaatiMinutes}
                    />
                </Form.Item>
                {talepSureRow}
            </>
        ) : isEndDateAutoCalculated ? (
            <>
                <Form.Item
                  label={
                    selectedMazeretObj?.subPermission === "Hastalık İzni"
                      ? intl.formatMessage({ id: "permission.form.reportStartDate" })
                      : intl.formatMessage({ id: "permission.form.leaveStartDate" })
                  }
                >
                    <Row gutter={8}>
                        <Col span={24}>
                            <Form.Item name="basla" noStyle rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.dateRequired" }) }]}>
                                <DatePicker
                                  format="DD.MM.YYYY"
                                  style={{ width: "100%" }}
                                  locale={tr_TR}
                                  placeholder={intl.formatMessage({ id: "permission.form.startDatePlaceholder" })}
                                  disabledDate={selectedMazeretObj?.subPermission === "Hastalık İzni" ? disabledBaslaDateHastalik : disabledBaslaDate}
                                  onChange={(date) => {
                                    setBaslaValue(date);
                                    if (date) {
                                      const endDate = date.clone().add(Number(maxDurForAuto) - 1, "days");
                                      form.setFieldsValue({ bitir: endDate });
                                      setBitirValue(endDate);
                                    } else {
                                      form.setFieldsValue({ bitir: null });
                                      setBitirValue(null);
                                    }
                                  }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form.Item>
                <Form.Item wrapperCol={{ offset: 9, span: 15 }}>
                  <Typography.Text
                    style={{
                      display: "block",
                      fontSize: 14,
                      lineHeight: 1.55,
                      color: "rgba(0, 0, 0, 0.78)",
                      fontWeight: 500,
                    }}
                  >
                    {bitirValue && baslaValue
                      ? intl.formatMessage(
                          { id: "permission.form.endDateAuto" },
                          { date: bitirValue.format("DD.MM.YYYY"), days: Number(maxDurForAuto) }
                        )
                      : intl.formatMessage({ id: "permission.form.fixedDurationHint" }, { days: Number(maxDurForAuto) })}
                  </Typography.Text>
                </Form.Item>
                <Form.Item name="bitir" style={{ display: "none" }} rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.bitirHiddenRequired" }) }]}>
                  <DatePicker format="DD.MM.YYYY" />
                </Form.Item>
                {talepSureRow}
            </>
        ) : (
            <>
                {/* Başlangıç Satırı */}
                <Form.Item label={selectedMazeretObj?.subPermission === "Hastalık İzni" ? intl.formatMessage({ id: "permission.form.reportStartDate" }) : intl.formatMessage({ id: "permission.form.start" })}>
                    <Row gutter={8}>
                        <Col span={showDayTypeSelectors ? 12 : 24}>
                            <Form.Item name="basla" noStyle rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.dateRequired" }) }]}>
                                <DatePicker
                                  format="DD.MM.YYYY"
                                  style={{ width: "100%" }}
                                  locale={tr_TR}
                                  placeholder={intl.formatMessage({ id: "permission.form.datePickPlaceholder" })}
                                  disabledDate={selectedMazeretObj?.subPermission === "Hastalık İzni" ? disabledBaslaDateHastalik : disabledBaslaDate}
                                  onChange={(date) => {
                                    setBaslaValue(date);
                                    const bitir = form.getFieldValue("bitir");
                                    if (bitir && date && bitir.isBefore(date, "day")) {
                                      form.setFieldsValue({ bitir: null });
                                      setBitirValue(null);
                                    }
                                  }}
                                />
                            </Form.Item>
                        </Col>
                        {showDayTypeSelectors && (
                        <Col span={12}>
                            <Form.Item name="baslangicTuru" noStyle>
                                <Select style={{ width: "100%" }}>
                                    <Option value="tam">{intl.formatMessage({ id: "permission.form.fullDayMorning" })}</Option>
                                    <Option value="yarim">{intl.formatMessage({ id: "permission.form.halfDayAfternoonStart" })}</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        )}
                    </Row>
                </Form.Item>

                {/* Bitiş Satırı */}
                <Form.Item label={selectedMazeretObj?.subPermission === "Hastalık İzni" ? intl.formatMessage({ id: "permission.form.reportEndDate" }) : intl.formatMessage({ id: "permission.form.end" })}>
                    <Row gutter={8}>
                        <Col span={showDayTypeSelectors ? 12 : 24}>
                            <Form.Item name="bitir" noStyle rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.dateRequired" }) }]}>
                                <DatePicker
                                  format="DD.MM.YYYY"
                                  style={{ width: "100%" }}
                                  locale={tr_TR}
                                  placeholder={intl.formatMessage({ id: "permission.form.datePickPlaceholder" })}
                                  disabledDate={selectedMazeretObj?.subPermission === "Hastalık İzni" ? disabledBitirDateHastalik : disabledBitirDate}
                                  onChange={(date) => setBitirValue(date)}
                                />
                            </Form.Item>
                        </Col>
                        {showDayTypeSelectors && (
                        <Col span={12}>
                            <Form.Item name="bitisTuru" noStyle>
                                <Select style={{ width: "100%" }}>
                                    <Option value="tam">{intl.formatMessage({ id: "permission.form.fullDayEveningEnd" })}</Option>
                                    <Option value="yarim">{intl.formatMessage({ id: "permission.form.halfDayNoonEnd" })}</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        )}
                    </Row>
                </Form.Item>
                {talepSureRow}
            </>
        )}
        
        {/* 3. DİĞER ALANLAR */}
        
        {/* --- GÜNCELLENEN KISIM: ZORUNLU ADRES --- */}
        <Form.Item 
            name="address" 
            label={intl.formatMessage({ id: "permission.form.locationLabel" })}
            rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.locationRequired" }) }]}
        >
            <Input.TextArea rows={2} placeholder={intl.formatMessage({ id: "permission.form.locationPlaceholder" })} />
        </Form.Item>

        <Form.Item 
            name="phone" 
            label={intl.formatMessage({ id: "permission.form.phone" })} 
            rules={[
            { required: true, message: intl.formatMessage({ id: "permission.form.phoneRequired" }) },
            { validator: (_, val) => val && !isValidPhoneNumber(val) ? Promise.reject(intl.formatMessage({ id: "permission.form.phoneInvalid" })) : Promise.resolve() }
            ]} 
        >
            <PhoneInput defaultCountry="TR" placeholder={intl.formatMessage({ id: "permission.form.phonePlaceholder" })} international withCountryCallingCode style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
            name="documentFile"
            label={selectedMazeretObj?.subPermission === "Hastalık İzni" ? intl.formatMessage({ id: "permission.form.report" }) : intl.formatMessage({ id: "permission.form.document" })}
            valuePropName="fileList"
            getValueFromEvent={normFile}
            rules={[{ required: selectedMazeretObj?.requiresDocument, message: intl.formatMessage({ id: "permission.form.documentRequired" }) }]}
        >
            <Upload listType="picture-card" maxCount={1} fileList={fileList} onChange={handleUploadChange} beforeUpload={() => false} showUploadList={{ showPreviewIcon: false }}>
                <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                    <PlusOutlined />
                    <div style={{ marginTop: 8, fontSize: '12px' }}>{intl.formatMessage({ id: "permission.form.uploadAdd" })}</div>
                </div>
            </Upload>
        </Form.Item>

        <Form.Item name="introduction" label={intl.formatMessage({ id: "permission.form.description" })} rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.descriptionRequired" }) }]}>
            <Input.TextArea rows={3} placeholder={intl.formatMessage({ id: "permission.form.descriptionPlaceholder" })} />
        </Form.Item>
        
        <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 9 }}>
            <Button type="primary" htmlType="submit" loading={loading} style={{ minWidth: '150px' }}>
                {intl.formatMessage({ id: "permission.form.submitRequest" })}
            </Button>
        </Form.Item>
    </Form>

    {/* --- AVANS İZİN MODALI --- */}
        <Modal
            title={intl.formatMessage({ id: "permission.form.advanceModalTitle" })}
            open={isAdvanceModalOpen}
            onCancel={() => setIsAdvanceModalOpen(false)}
            footer={[
                <Button key="back" onClick={() => setIsAdvanceModalOpen(false)}>
                    {intl.formatMessage({ id: "permission.form.advanceModalCancel" })}
                </Button>,
                <Button 
                    key="submit" 
                    type="primary" 
                    danger
                    loading={loading}
                    disabled={!isAdvanceApproved} 
                    onClick={handleAdvanceSubmit}
                >
                    {intl.formatMessage({ id: "permission.form.advanceModalSubmit" })}
                </Button>,
            ]}
            width={600}
        >
             <Alert
                message={intl.formatMessage({ id: "permission.form.advanceInsufficientTitle" })}
                description={intl.formatMessage({ id: "permission.form.advanceInsufficientDesc" }, { days: paidCapLabel })}
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
            />
            
            <div style={{ 
                maxHeight: '250px', 
                overflowY: 'auto', 
                background: '#f9f9f9', 
                padding: '15px', 
                marginBottom: '15px', 
                borderRadius: '6px', 
                border: '1px solid #eee',
                fontSize: '13px',
                lineHeight: '1.5'
            }}>
                <h4 style={{textAlign:'center', marginBottom:'10px'}}>{intl.formatMessage({ id: "permission.form.advanceConsentHeading" })}</h4>
                <p>
                    {intl.formatMessage({ id: "permission.form.advanceConsentP1" })}
                </p>
                <p>
                    {intl.formatMessage({ id: "permission.form.advanceConsentP2" })}
                </p>
            </div>

            <Checkbox 
                checked={isAdvanceApproved} 
                onChange={(e) => setIsAdvanceApproved(e.target.checked)}
            >
                {intl.formatMessage({ id: "permission.form.advanceCheckbox" })}
            </Checkbox>
        </Modal>
    </>
  );
};

export default HolidayForm;