import React, { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import moment from "moment";
import "moment/locale/tr";

import tr_TR from "antd/lib/locale/tr_TR";
import { Space, Row, Col, message, Spin, Modal, Form, Input, Select, DatePicker, Button, Upload, Alert, TimePicker, Tooltip, Typography } from "antd";
import { UploadOutlined, InfoCircleOutlined, DeleteOutlined } from "@ant-design/icons";
import "antd/dist/antd.css";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import Box from "@iso/components/utility/box";
import { useIntl } from "react-intl";
import PageHeader from "@iso/components/utility/pageHeader";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

import Searchbar from "../ConfirmationForm/Components/Searchbar";
import PermissionDetails from "../ConfirmationForm/Components/PermissionDetails";
import ConfirmationTable from "../ConfirmationForm/Components/ConfirmationTable";
import { getPermissionsByUserId, updatePermission, cancelPendingPermission } from "../../Api/PermissionApi";
import { UserDetail } from "../../Api/UserApi";
import { GetPermissionTypes } from "../../Api/ParameterApi";

const { Option } = Select;
const { TextArea } = Input;
const formItemStyle = { marginBottom: '12px' };
const cleanVal = (val) => {
    if (val === "undefined" || val === null || val === undefined) return "";
    return val;
};

const getDurationUnit = (obj) => (obj?.durationUnit ?? obj?.DurationUnit ?? 1);
const getMaxDuration = (obj) => (obj?.maxDuration ?? obj?.MaxDuration);
const getMinDuration = (obj) => (obj?.minDuration ?? obj?.MinDuration);
const isDivisible = (obj) => (obj?.isDivisible ?? obj?.IsDivisible ?? false);
const requiresDocumentFn = (obj) => !!(obj?.requiresDocument ?? obj?.RequiresDocument);
const resolvePermissionDisplayName = (permission, permissionTypeMap, intl) => {
  const typeId = permission?.permissionTypeId ?? permission?.PermissionTypeId;
  const typeRow = permissionTypeMap.get(Number(typeId));
  const sub = typeRow?.subPermission ?? typeRow?.SubPermission;
  const main = typeRow?.permission ?? typeRow?.Permission;
  const paid = intl.formatMessage({ id: "permission.calendar.leavePaidFull" });
  const unpaid = intl.formatMessage({ id: "permission.calendar.leaveUnpaidFull" });
  const generic = intl.formatMessage({ id: "permission.calendar.leaveGeneric" });

  if (sub && String(sub).toLowerCase() !== "default") return sub;
  if (main === "Ücretli") return paid;
  if (main === "Ücretsiz") return unpaid;
  if (main) return main;

  const raw = permission?.permissionType ?? permission?.PermissionType ?? "";
  if (raw === "Ücretli") return paid;
  if (raw === "Ücretsiz") return unpaid;
  return raw || generic;
};

const MyRequests = () => {
  const intl = useIntl();
  const [openPdfDrawer, setOpenPdfDrawer] = useState(false);
  const { id, email } = useSelector((state) => state.Auth);
  const [myPermissions, setMyPermissions] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [form] = Form.useForm();
  const [editFile, setEditFile] = useState(null);
  const [izinTipi, setİzinTipi] = useState(null);
  const [mazeretTipi, setMazeretTipi] = useState(null);
  const [showTimeFields, setShowTimeFields] = useState(false);
  const [mazeretList, setMazeretList] = useState([]);
  const [allPermissionTypes, setAllPermissionTypes] = useState([]);
  const [selectedMazeretObj, setSelectedMazeretObj] = useState(null);
  const [baslaValue, setBaslaValue] = useState(null);
  const [bitirValue, setBitirValue] = useState(null);
  const [baslangicSaatiValue, setBaslangicSaatiValue] = useState(null);
  const [documentCleared, setDocumentCleared] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(undefined);
  const [selectedStatus, setSelectedStatus] = useState(undefined);

  const maxDurForAuto = getMaxDuration(selectedMazeretObj);
  const durUnitSel = getDurationUnit(selectedMazeretObj);
  const isEndDateAutoCalculated = !!(
    selectedMazeretObj &&
    !isDivisible(selectedMazeretObj) &&
    durUnitSel === 1 &&
    maxDurForAuto != null &&
    maxDurForAuto !== ""
  );
  const showDayTypeSelectors = !selectedMazeretObj || isDivisible(selectedMazeretObj);
  const requiresDoc = requiresDocumentFn(selectedMazeretObj);
  const isHastalik = selectedMazeretObj?.subPermission === "Hastalık İzni";
  const dash = intl.formatMessage({ id: "parametre.permission.minMaxDash" });
  const hourUnit = intl.formatMessage({ id: "parametre.permission.unitHourSuffix" });
  const dayUnit = intl.formatMessage({ id: "parametre.permission.unitDaySuffix" });
  const dayWord = intl.formatMessage({ id: "parametre.permission.durationUnit.day" });
  const hourWord = intl.formatMessage({ id: "parametre.permission.durationUnit.hour" });
  useEffect(() => {
    const load = async () => {
      try {
        const response = await GetPermissionTypes();
        const data = response.data?.data !== undefined ? response.data.data : response.data;
        if (!Array.isArray(data)) return;
        setAllPermissionTypes(data);
        setMazeretList(
          data.filter((item) => {
            const p = (item.permission || item.Permission || "").toLowerCase();
            return p === "mazeret";
          })
        );
      } catch (e) {
        console.error("Mazeret tipleri yüklenemedi", e);
      }
    };
    load();
  }, []);

  const permissionTypeMap = useMemo(
    () => new Map((allPermissionTypes || []).map((x) => [Number(x.id ?? x.Id), x])),
    [allPermissionTypes]
  );

  const getMyPermissions = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await getPermissionsByUserId(id);
      if(response && response.data) {
        const updatedPermissions = await Promise.all(
          response.data.map(async (permission) => {
             try {
                const userRes = await UserDetail(id);
                return {
                  ...permission,
                  permissionTypeDisplayName: resolvePermissionDisplayName(permission, permissionTypeMap, intl),
                  user: userRes.data.data,
                };
             } catch (e) {
                return {
                  ...permission,
                  permissionTypeDisplayName: resolvePermissionDisplayName(permission, permissionTypeMap, intl),
                  user: { name: intl.formatMessage({ id: "permission.myRequests.selfName" }) },
                };
             }
          })
        );
        
        // --- ID'ye GÖRE SIRALAMA (EN YENİ EN ÜSTTE) ---
        updatedPermissions.sort((a, b) => b.id - a.id);
        // ----------------------------------------------

        setMyPermissions(updatedPermissions);
        setFilteredData(updatedPermissions);
      }
    } catch (error) {
        console.error("Veri çekme hatası:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    getMyPermissions();
  }, [id, permissionTypeMap, intl]);

  const permissionOptions = useMemo(() => {
    if (!myPermissions) return [];
    const uniqueTypes = [...new Set(myPermissions.map(item => item.permissionTypeDisplayName || item.permissionType).filter(Boolean))];
    return uniqueTypes.map(type => ({ label: type, value: type }));
  }, [myPermissions]);

  const statusOptions = useMemo(
    () => [
      { label: intl.formatMessage({ id: "permission.myRequests.statusPending" }), value: "Pending" },
      { label: intl.formatMessage({ id: "permission.myRequests.statusConfirmed" }), value: "Confirmed" },
      { label: intl.formatMessage({ id: "permission.myRequests.statusDeclined" }), value: "Declined" },
    ],
    [intl]
  );

  useEffect(() => {
    if(!myPermissions) {
        setFilteredData([]);
        return;
    }
    const lowerSearch = search.toLowerCase();
    const filtered = myPermissions.filter((item) => {
      const displayType = item.permissionTypeDisplayName || item.permissionType || "";
      const categoryMatch = selectedCategory ? displayType === selectedCategory : true;
      const statusMatch = selectedStatus ? item.status === selectedStatus : true;
      const searchMatch =
        (displayType && displayType.toLowerCase().includes(lowerSearch)) ||
        (item.status && item.status.toLowerCase().includes(lowerSearch));
      return categoryMatch && statusMatch && searchMatch;
    });
    setFilteredData(filtered);
  }, [selectedCategory, selectedStatus, search, myPermissions]); 

  const disabledBaslaDate = (current) => current && current < moment().startOf("day");

  const disabledBitirDate = (current) => {
    const today = moment().startOf("day");
    if (baslaValue) {
      const beforeStart = current < baslaValue.clone().startOf("day");
      const beforeToday = current < today;
      const maxDur = getMaxDuration(selectedMazeretObj);
      const du = getDurationUnit(selectedMazeretObj);
      if (du === 1 && maxDur != null && isDivisible(selectedMazeretObj)) {
        const maxDate = baslaValue.clone().add(Number(maxDur) - 1, "days").endOf("day");
        return current && (beforeToday || beforeStart || current > maxDate);
      }
      return current && (beforeToday || beforeStart);
    }
    return current && current < today;
  };

  const disabledBaslaDateHastalik = () => false;

  const disabledBitirDateHastalik = (current) => {
    if (baslaValue) return current && current.isBefore(baslaValue.clone().startOf("day"));
    return false;
  };

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

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setDocumentCleared(false);
    setEditFile(null);
    setBaslaValue(null);
    setBitirValue(null);
    setBaslangicSaatiValue(null);
    setSelectedMazeretObj(null);
  };

  const handleIzinTipiChange = (value) => {
    setİzinTipi(value);
    setMazeretTipi(null);
    setSelectedMazeretObj(null);
    setShowTimeFields(false);
    form.setFieldsValue({ mazeretTipi: undefined, basla: null, bitir: null });
    setBaslaValue(null);
    setBitirValue(null);
  };

  const handleMazeretTipiChange = (value) => {
    setMazeretTipi(value);
    const selectedItem = mazeretList.find((x) => String(x.id) === String(value));
    setSelectedMazeretObj(selectedItem || null);
    const du = getDurationUnit(selectedItem);
    setShowTimeFields(du === 2);
    form.setFieldsValue({ basla: null, bitir: null, baslangicSaati: null, bitisSaati: null });
    setBaslaValue(null);
    setBitirValue(null);
    setBaslangicSaatiValue(null);
  };

  const handleCancelRequest = (record) => {
    if (record.status !== "Pending") return;
    Modal.confirm({
      title: intl.formatMessage({ id: "permission.myRequests.cancelTitle" }),
      content: intl.formatMessage({ id: "permission.myRequests.cancelContent" }),
      okText: intl.formatMessage({ id: "permission.myRequests.cancelOk" }),
      okType: "danger",
      cancelText: intl.formatMessage({ id: "permission.myRequests.cancelDismiss" }),
      onOk: async () => {
        try {
          const res = await cancelPendingPermission(id, record.id);
          if (res && res.success !== false) {
            message.success(res.message || intl.formatMessage({ id: "permission.myRequests.cancelSuccess" }));
            getMyPermissions();
          } else {
            message.error(res?.message || intl.formatMessage({ id: "permission.myRequests.cancelFailed" }));
          }
        } catch (e) {
          const msg =
            e?.response?.data?.message ||
            e?.response?.data?.Message ||
            e?.message ||
            intl.formatMessage({ id: "permission.myRequests.cancelError" });
          message.error(msg);
        }
      },
    });
  };

  const handleEditClick = (record) => {
    if (record.status !== "Pending") {
      message.warning(intl.formatMessage({ id: "permission.myRequests.editOnlyPending" }));
      return;
    }

    setEditingRecord(record);
    setEditFile(null);
    setDocumentCleared(false);

    let currentIzinTipi = "kategori3";
    if (record.permissionType === "Ücretli" || record.permissionType === "Ücretli İzin") currentIzinTipi = "ücretli";
    else if (record.permissionType === "Ücretsiz" || record.permissionType === "Ücretsiz İzin") currentIzinTipi = "ücretsiz";

    setİzinTipi(currentIzinTipi);

    const typeId = record.permissionTypeId ?? record.PermissionTypeId;
    let sel = null;
    if (currentIzinTipi === "kategori3" && typeId != null) {
      sel = mazeretList.find((x) => Number(x.id) === Number(typeId)) || null;
      setMazeretTipi(typeId);
      setSelectedMazeretObj(sel);
      setShowTimeFields(getDurationUnit(sel) === 2);
    } else {
      setMazeretTipi(null);
      setSelectedMazeretObj(null);
      setShowTimeFields(false);
    }

    const startMoment = moment(record.startTime);
    const endMoment = moment(record.endTime);
    setBaslaValue(startMoment);
    setBitirValue(endMoment);
    setBaslangicSaatiValue(startMoment);

    let baslangicTuru = "tam";
    let bitisTuru = "tam";
    if (startMoment.hour() === 13 && startMoment.minute() === 30) baslangicTuru = "yarim";
    if (endMoment.hour() === 12 && endMoment.minute() === 30) bitisTuru = "yarim";

    form.setFieldsValue({
      izinTipi: currentIzinTipi,
      mazeretTipi: currentIzinTipi === "kategori3" ? typeId : undefined,
      basla: startMoment,
      bitir: endMoment,
      baslangicTuru: baslangicTuru,
      bitisTuru: bitisTuru,
      baslangicSaati: startMoment,
      bitisSaati: endMoment,
      address: cleanVal(record.address),
      description: cleanVal(record.description),
      phone: cleanVal(record.phoneNumber),
    });

    setIsEditModalOpen(true);
  };

  useEffect(() => {
    if (!isEditModalOpen || !editingRecord || izinTipi !== "kategori3") return;
    const typeId = editingRecord.permissionTypeId ?? editingRecord.PermissionTypeId;
    if (typeId == null) return;
    const sel = mazeretList.find((x) => Number(x.id) === Number(typeId));
    if (sel) {
      setSelectedMazeretObj(sel);
      setShowTimeFields(getDurationUnit(sel) === 2);
    }
  }, [isEditModalOpen, editingRecord, izinTipi, mazeretList]);

  const handleEditFinish = async (values) => {
    setEditLoading(true);
    try {
      if (requiresDoc && !editFile && (!editingRecord?.documentPath || documentCleared)) {
        message.error(intl.formatMessage({ id: "permission.myRequests.requiredFields" }));
        setEditLoading(false);
        return;
      }

      let permissionTypeIdToSend = 0;
      if (values.izinTipi === "ücretli") permissionTypeIdToSend = 1;
      else if (values.izinTipi === "ücretsiz") permissionTypeIdToSend = 2;
      else {
        permissionTypeIdToSend = Number(values.mazeretTipi) || 0;
      }
      if (!permissionTypeIdToSend) {
        message.error(intl.formatMessage({ id: "permission.myRequests.invalidType" }));
        setEditLoading(false);
        return;
      }

      let finalStartTime = "";
      let finalEndTime = "";

      if (showTimeFields) {
        const minD = getMinDuration(selectedMazeretObj);
        const maxD = getMaxDuration(selectedMazeretObj);
        const dateSelected = moment(values.basla).format("YYYY-MM-DD");
        const tStart = moment(values.baslangicSaati).format("HH:mm:ss");
        const tEnd = moment(values.bitisSaati).format("HH:mm:ss");
        const startM = moment(`${dateSelected} ${tStart}`);
        const endM = moment(`${dateSelected} ${tEnd}`);
        const hours = endM.diff(startM, "hours", true);
        if (hours <= 0) {
          message.error(intl.formatMessage({ id: "permission.myRequests.endAfterStart" }));
          setEditLoading(false);
          return;
        }
        if (minD != null && hours < Number(minD) - 1e-6) {
          message.error(intl.formatMessage({ id: "permission.form.minHours" }, { min: minD }));
          setEditLoading(false);
          return;
        }
        if (maxD != null && hours > Number(maxD) + 1e-6) {
          message.error(intl.formatMessage({ id: "permission.form.maxHours" }, { max: maxD }));
          setEditLoading(false);
          return;
        }
        finalStartTime = `${dateSelected} ${tStart}`;
        finalEndTime = `${dateSelected} ${tEnd}`;
      } else {
        let startHour = "09:00:00";
        if (values.baslangicTuru === "yarim") startHour = "13:30:00";
        let endHour = "18:00:00";
        if (values.bitisTuru === "yarim") endHour = "12:30:00";
        const dateStart = moment(values.basla).format("YYYY-MM-DD");
        const dateEnd = values.bitir ? moment(values.bitir).format("YYYY-MM-DD") : dateStart;
        finalStartTime = `${dateStart} ${startHour}`;
        finalEndTime = `${dateEnd} ${endHour}`;
      }

      const startM = moment(finalStartTime, "YYYY-MM-DD HH:mm:ss");
      const endM = moment(finalEndTime, "YYYY-MM-DD HH:mm:ss");
      if (!endM.isAfter(startM)) {
        message.error(intl.formatMessage({ id: "permission.myRequests.endAfterStart" }));
        setEditLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("Id", editingRecord.id);
      formData.append("UserId", editingRecord.userId);
      formData.append("Email", email || "user@intellium.com");
      formData.append("PermissionTypeId", permissionTypeIdToSend);
      formData.append("StartTime", finalStartTime);
      formData.append("EndTime", finalEndTime);
      formData.append("PhoneNumber", values.phone);
      formData.append("Address", values.address);
      formData.append("Description", values.description);
      formData.append("Status", "Pending");
      formData.append("IsAllowed", "false");

      let documentPathToSend = editingRecord.documentPath || "";
      if (documentCleared) documentPathToSend = "";
      formData.append("DocumentPath", documentPathToSend);

      if (editFile) {
        formData.append("documentFile", editFile.originFileObj || editFile);
      }

      const response = await updatePermission(formData);

      const isSuccess =
        response?.data?.success === true || response?.success === true || response?.status === 200;

      if (isSuccess) {
        message.success(intl.formatMessage({ id: "permission.myRequests.updateSuccess" }));
        closeEditModal();
        getMyPermissions();
      } else {
        const errMsg = response?.data?.message || response?.message || intl.formatMessage({ id: "permission.myRequests.updateFailed" });
        message.error(errMsg);
      }
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      if (error.response && error.response.status === 200) {
        message.success(intl.formatMessage({ id: "permission.myRequests.updateSuccess" }));
        closeEditModal();
        getMyPermissions();
        setEditLoading(false);
        return;
      }
      const msg =
        error.response?.data?.errors?.Email?.[0] ||
        error.response?.data?.message ||
        error.message ||
        intl.formatMessage({ id: "permission.myRequests.updateError" });
      message.error(msg);
    } finally {
      setEditLoading(false);
    }
  };

  const uploadProps = {
    onRemove: () => {
      setEditFile(null);
      return true;
    },
    beforeUpload: (file) => {
      setEditFile(file);
      setDocumentCleared(false);
      return false;
    },
    fileList: editFile
      ? [{ uid: "-1", name: editFile.name || "belge", status: "done" }]
      : [],
    showUploadList: { showPreviewIcon: false },
  };

  const [openDetailsDrawer, setOpenDetailsDrawer] = useState(false);
  const [willBeShowDetails, setWillBeShowDetails] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const success = (content, type) => {
    messageApi.open({ type, content, duration: 3 });
  };

  return (
    <LayoutWrapper>
      {contextHolder}
      <PageHeader>{intl.formatMessage({ id: "permission.myRequests.pageTitle" })}</PageHeader>
      <Box>
        <Row>
          <Space style={{ width: "100%" }} direction="vertical" size={"middle"}>
            <Searchbar
              search={search} setSearch={setSearch}
              selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}
              selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus}
              categoriesOptions={permissionOptions} statusOptions={statusOptions}
            />
            {loading ? (
                <div style={{textAlign: 'center', padding: '20px'}}><Spin size="large" tip={intl.formatMessage({ id: "permission.myRequests.loading" })} /></div>
            ) : (
                <ConfirmationTable
                  data={filteredData}
                  openDrawer={setOpenPdfDrawer}
                  openDetailsDrawer={setOpenDetailsDrawer}
                  setWillBeShowDetails={setWillBeShowDetails}
                  onEdit={handleEditClick}
                  onCancel={handleCancelRequest}
                />
            )}
          </Space>
        </Row>
        
        <PermissionDetails
          open={openDetailsDrawer}
          close={setOpenDetailsDrawer}
          data={willBeShowDetails}
          setWillBeShowDetails={setWillBeShowDetails}
          openPdfDrawer={setOpenPdfDrawer}
          messageSuccess={success}
        />

        {/* --- DÜZENLEME MODALI --- */}
        <Modal
          title={intl.formatMessage({ id: "permission.myRequests.editModalTitle" })}
          open={isEditModalOpen}
          onCancel={closeEditModal}
          footer={null}
          destroyOnClose
          width={800}
        >
          <Form form={form} layout="vertical" onFinish={handleEditFinish} initialValues={{ baslangicTuru: "tam", bitisTuru: "tam" }}>
            <Row gutter={16}>
              <Col span={izinTipi === "kategori3" ? 12 : 24}>
                <Form.Item label={intl.formatMessage({ id: "permission.form.leaveType" })} name="izinTipi" rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.leaveTypeRequired" }) }]} style={formItemStyle}>
                  <Select placeholder={intl.formatMessage({ id: "permission.form.selectPlaceholder" })} onChange={handleIzinTipiChange}>
                    <Option value="ücretli">{intl.formatMessage({ id: "permission.form.optionPaid" })}</Option>
                    <Option value="ücretsiz">{intl.formatMessage({ id: "permission.form.optionUnpaid" })}</Option>
                    <Option value="kategori3">{intl.formatMessage({ id: "permission.form.optionExcuse" })}</Option>
                  </Select>
                </Form.Item>
              </Col>

              {izinTipi === "kategori3" && (
                <Col span={12}>
                  <Form.Item label={intl.formatMessage({ id: "permission.form.excuseType" })} name="mazeretTipi" rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.excuseTypeRequired" }) }]} style={formItemStyle}>
                    <Select onChange={handleMazeretTipiChange} placeholder={intl.formatMessage({ id: "permission.form.excusePlaceholder" })}>
                      {mazeretList.map((item) => (
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
                </Col>
              )}
            </Row>

            {selectedMazeretObj && izinTipi === "kategori3" && (
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 12, borderRadius: 6 }}
                message={intl.formatMessage({ id: "permission.myRequests.rulesMessage" }, { name: selectedMazeretObj.subPermission })}
                description={
                  <ul style={{ margin: "4px 0 0 0", paddingLeft: 16, fontSize: 13 }}>
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
                            <>
                              {" "}
                              — <strong>{intl.formatMessage({ id: "permission.form.ruleFixed" }, { days: maxV })}</strong>
                            </>
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
                  </ul>
                }
              />
            )}

            {showTimeFields ? (
              <div style={{ padding: 10, background: "#fcfcfc", borderRadius: 6, marginBottom: 12, border: "1px solid #f0f0f0" }}>
                <Row gutter={12}>
                  <Col span={24}>
                    <Form.Item label={intl.formatMessage({ id: "permission.form.leaveDate" })} name="basla" rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.dateRequired" }) }]} style={formItemStyle}>
                      <DatePicker format="DD.MM.YYYY" style={{ width: "100%" }} locale={tr_TR} disabledDate={isHastalik ? disabledBaslaDateHastalik : disabledBaslaDate} />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={12}>
                  <Col span={12}>
                    <Form.Item label={intl.formatMessage({ id: "permission.form.startTime" })} name="baslangicSaati" rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.timeRequired" }) }]} style={{ marginBottom: 0 }}>
                      <TimePicker
                        format="HH:mm"
                        style={{ width: "100%" }}
                        onChange={(t) => {
                          setBaslangicSaatiValue(t);
                          form.setFieldsValue({ bitisSaati: null });
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={intl.formatMessage({ id: "permission.form.endTime" })}
                      name="bitisSaati"
                      rules={[
                        { required: true, message: intl.formatMessage({ id: "permission.form.timeRequired" }) },
                        {
                          validator: (_, v) => {
                            const st = form.getFieldValue("baslangicSaati");
                            if (!v || !st) return Promise.resolve();
                            if (!v.isAfter(st)) return Promise.reject(new Error(intl.formatMessage({ id: "permission.form.timeAfterStart" })));
                            return Promise.resolve();
                          },
                        },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <TimePicker format="HH:mm" style={{ width: "100%" }} disabledHours={disabledBitisSaatiHours} disabledMinutes={disabledBitisSaatiMinutes} />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
            ) : isEndDateAutoCalculated ? (
              <div style={{ padding: 10, background: "#fcfcfc", borderRadius: 6, marginBottom: 12, border: "1px solid #f0f0f0" }}>
                <Form.Item label={isHastalik ? intl.formatMessage({ id: "permission.form.reportStartDate" }) : intl.formatMessage({ id: "permission.form.leaveStartDate" })}>
                  <Form.Item name="basla" noStyle rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.dateRequired" }) }]}>
                    <DatePicker
                      format="DD.MM.YYYY"
                      style={{ width: "100%" }}
                      locale={tr_TR}
                      placeholder={intl.formatMessage({ id: "permission.form.startTimePlaceholder" })}
                      disabledDate={isHastalik ? disabledBaslaDateHastalik : disabledBaslaDate}
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
                </Form.Item>
                <div style={{ fontSize: 13, color: "rgba(0,0,0,0.75)", marginBottom: 8 }}>
                  {bitirValue && baslaValue
                    ? intl.formatMessage(
                        { id: "permission.form.endDateAuto" },
                        { date: bitirValue.format("DD.MM.YYYY"), days: Number(maxDurForAuto) }
                      )
                    : intl.formatMessage({ id: "permission.form.fixedDurationHint" }, { days: Number(maxDurForAuto) })}
                </div>
                <Form.Item name="bitir" hidden rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.bitirHiddenRequired" }) }]}>
                  <DatePicker />
                </Form.Item>
              </div>
            ) : (
              izinTipi && (
                <div style={{ padding: 10, background: "#fcfcfc", borderRadius: 6, marginBottom: 12, border: "1px solid #f0f0f0" }}>
                  <Row gutter={12}>
                    <Col span={showDayTypeSelectors ? 10 : 24}>
                      <Form.Item
                        name="basla"
                        label={isHastalik ? intl.formatMessage({ id: "permission.form.reportStartDate" }) : intl.formatMessage({ id: "permission.form.start" })}
                        rules={[{ required: true, message: intl.formatMessage({ id: "permission.form.dateRequired" }) }]}
                        style={formItemStyle}
                      >
                        <DatePicker
                          format="DD.MM.YYYY"
                          style={{ width: "100%" }}
                          locale={tr_TR}
                          disabledDate={isHastalik ? disabledBaslaDateHastalik : disabledBaslaDate}
                          onChange={(date) => {
                            setBaslaValue(date);
                            const bEnd = form.getFieldValue("bitir");
                            if (bEnd && date && bEnd.isBefore(date, "day")) {
                              form.setFieldsValue({ bitir: null });
                              setBitirValue(null);
                            }
                          }}
                        />
                      </Form.Item>
                    </Col>
                    {showDayTypeSelectors && (
                      <Col span={14}>
                        <Form.Item name="baslangicTuru" label=" " style={formItemStyle}>
                          <Select style={{ width: "100%" }}>
                            <Option value="tam">{intl.formatMessage({ id: "permission.form.fullDayMorning" })}</Option>
                            <Option value="yarim">{intl.formatMessage({ id: "permission.form.halfDayAfternoonStart" })}</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                  <Row gutter={12}>
                    <Col span={showDayTypeSelectors ? 10 : 24}>
                      <Form.Item
                        name="bitir"
                        label={isHastalik ? intl.formatMessage({ id: "permission.form.reportEndDate" }) : intl.formatMessage({ id: "permission.form.end" })}
                        rules={[
                          { required: true, message: intl.formatMessage({ id: "permission.form.dateRequired" }) },
                          {
                            validator: (_, v) => {
                              const b = form.getFieldValue("basla");
                              if (!v || !b) return Promise.resolve();
                              if (v.startOf("day").isBefore(b.startOf("day"))) {
                                return Promise.reject(new Error(intl.formatMessage({ id: "permission.myRequests.bitirAfterBasla" })));
                              }
                              return Promise.resolve();
                            },
                          },
                        ]}
                        style={{ marginBottom: 0 }}
                      >
                        <DatePicker
                          format="DD.MM.YYYY"
                          style={{ width: "100%" }}
                          locale={tr_TR}
                          disabledDate={isHastalik ? disabledBitirDateHastalik : disabledBitirDate}
                          onChange={(date) => setBitirValue(date)}
                        />
                      </Form.Item>
                    </Col>
                    {showDayTypeSelectors && (
                      <Col span={14}>
                        <Form.Item name="bitisTuru" label=" " style={{ marginBottom: 0 }}>
                          <Select style={{ width: "100%" }}>
                            <Option value="tam">{intl.formatMessage({ id: "permission.form.fullDayEveningEnd" })}</Option>
                            <Option value="yarim">{intl.formatMessage({ id: "permission.form.halfDayNoonEnd" })}</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                    )}
                  </Row>
                </div>
              )
            )}

            <Row gutter={12}>
              <Col span={24}>
                <Form.Item name="address" label={intl.formatMessage({ id: "permission.form.locationLabel" })} rules={[{ required: true, message: intl.formatMessage({ id: "permission.myRequests.locationRequired" }) }]} style={formItemStyle}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item
                  name="phone"
                  label={intl.formatMessage({ id: "permission.form.phone" })}
                  style={formItemStyle}
                  rules={[
                    { required: true, message: intl.formatMessage({ id: "permission.form.phoneRequired" }) },
                    { validator: (_, val) => (val && !isValidPhoneNumber(val) ? Promise.reject(new Error(intl.formatMessage({ id: "permission.myRequests.phoneInvalid" }))) : Promise.resolve()) },
                  ]}
                >
                  <PhoneInput defaultCountry="TR" placeholder={intl.formatMessage({ id: "permission.form.phone" })} international withCountryCallingCode style={{ width: "100%" }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16} align="bottom">
              <Col span={16}>
                <Form.Item name="description" label={intl.formatMessage({ id: "permission.form.description" })} rules={[{ required: true, message: intl.formatMessage({ id: "permission.myRequests.descriptionRequired" }) }]} style={{ marginBottom: 0 }}>
                  <TextArea rows={4} style={{ resize: "none" }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  label={isHastalik ? intl.formatMessage({ id: "permission.myRequests.reportDoc" }) : intl.formatMessage({ id: "permission.form.document" })}
                  style={{ marginBottom: 0 }}
                  required={requiresDoc}
                >
                  <Upload {...uploadProps} maxCount={1}>
                    <Button icon={<UploadOutlined />} block>
                      {editingRecord?.documentPath && !documentCleared ? intl.formatMessage({ id: "permission.myRequests.uploadChange" }) : intl.formatMessage({ id: "permission.myRequests.uploadUpload" })}
                    </Button>
                  </Upload>
                  {editingRecord?.documentPath && !editFile && !documentCleared && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 11, color: "#666", lineHeight: 1.3 }}>
                        <InfoCircleOutlined style={{ marginRight: 4 }} />
                        {intl.formatMessage({ id: "permission.myRequests.currentDoc" })} <b>{editingRecord.documentPath.split(/[\\/]/).pop()}</b>
                      </div>
                      <Button type="link" danger size="small" icon={<DeleteOutlined />} onClick={() => setDocumentCleared(true)} style={{ paddingLeft: 0 }}>
                        {intl.formatMessage({ id: "permission.myRequests.removeDoc" })}
                      </Button>
                    </div>
                  )}
                </Form.Item>
              </Col>
            </Row>

            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 16, lineHeight: 1.5 }}>
              {intl.formatMessage({ id: "permission.myRequests.requiredNote" })}
            </Typography.Text>

            <div style={{ textAlign: "right", marginTop: 12 }}>
              <Button onClick={closeEditModal} style={{ marginRight: 8 }}>
                {intl.formatMessage({ id: "permission.myRequests.cancel" })}
              </Button>
              <Button type="primary" htmlType="submit" loading={editLoading}>
                {intl.formatMessage({ id: "permission.myRequests.update" })}
              </Button>
            </div>
          </Form>
        </Modal>

      </Box>
    </LayoutWrapper>
  );
};

export default MyRequests;