import React, { useRef, useState, useEffect } from "react";
import moment from "moment";
import { useIntl } from "react-intl";
import { host } from "../../../Api/host";

//Ant design
import { Drawer, Badge, Descriptions, Space, Button, Alert, Modal, Input, message, Statistic, Row, Col, Card } from "antd";

//Icons
import {
  PaperClipOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";

// Redux
import { useSelector } from "react-redux";

import {
  confirmPermission,
  refusePermission,
  newPermissionPdf,
  getTicket 
} from "../../../Api/PermissionApi";

import { GetAllHoliday } from "../../../Api/HolidayApi";
import { formatPhoneNumber } from "../../../library/helpers/validators/formatPhoneNumber";

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

const PermissionDetails = ({
  open,
  close,
  data,
  setWillBeShowDetails,
  openPdfDrawer,
  messageSuccess,
}) => {
  const intl = useIntl();
  const divRef = useRef(null);
  const { role } = useSelector((state) => state.Auth);

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  
  const [userLeaveStats, setUserLeaveStats] = useState(null);
  const [requestedDays, setRequestedDays] = useState(0);
  const [futureBalance, setFutureBalance] = useState(0);
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    if (open) {
      GetAllHoliday().then(res => {
         if (res?.data?.data) {
             setHolidays(res.data.data);
         }
      }).catch(err => console.error(intl.formatMessage({ id: "confirmationForm.errors.holidayFetch" }), err));
    }
  }, [open]);

  useEffect(() => {
    if (open && data?.userId) {
      getTicket(data.userId).then((res) => {
        if (res && res.data) {
          setUserLeaveStats(res.data);
        }
      });

      if (data.startTime && data.endTime) {
        const typeId = data.permissionTypeId;
        const typeStr = (data.permissionType || "").toLowerCase();
        
        // Ücretsiz ve Mazeret izinleri bakiyeden (TotalLeave/RemainingLeave) düşmez
        const isUnpaid = typeId === 2 || typeStr.includes("ücretsiz") || typeStr.includes("mazeret");
        if (isUnpaid) {
            setRequestedDays(0);
            return;
        }

        const start = moment(data.startTime);
        const end = moment(data.endTime);
        let days = 0;
        
        if (start.isSame(end, 'day')) {
             const dayOfWeek = start.day();
             const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
             
             const isHoliday = holidays.some(h => {
                 const hStart = moment(h.startTime).startOf('day');
                 const hEnd = moment(h.endTime).startOf('day');
                 return start.clone().startOf('day').isBetween(hStart, hEnd, 'day', '[]');
             });

             if (isWeekend || isHoliday) {
                 days = 0;
             } else {
                 const duration = moment.duration(end.diff(start)).asHours();
                 days = (duration > 0 && duration < 6) ? 0.5 : 1;
             }
        } else {
            let current = start.clone().startOf('day');
            const endEndOfDay = end.clone().startOf('day');

            while (current.isSameOrBefore(endEndOfDay, 'day')) {
                const dayOfWeek = current.day();
                const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const isHoliday = holidays.some(h => {
                     const hStart = moment(h.startTime).startOf('day');
                     const hEnd = moment(h.endTime).startOf('day');
                     return current.isBetween(hStart, hEnd, 'day', '[]');
                });

                if (!isWeekend && !isHoliday) {
                    if (current.isSame(start, 'day')) {
                        const dayEnd = current.clone().add(18, 'hours');
                        const h = moment.duration(dayEnd.diff(start)).asHours();
                        if (h > 0 && h < 6) days += 0.5;
                        else days += 1;
                    } else if (current.isSame(end, 'day')) {
                        const dayStart = current.clone().add(9, 'hours');
                        const h = moment.duration(end.diff(dayStart)).asHours();
                        if (h > 0 && h < 6) days += 0.5;
                        else days += 1;
                    } else {
                        days += 1;
                    }
                }
                current.add(1, 'days');
            }
        }
        setRequestedDays(days);
      }
    }
  }, [open, data, holidays]);

  useEffect(() => {
      if(userLeaveStats) {
          setFutureBalance((userLeaveStats.remainingLeave || 0) - requestedDays);
      }
  }, [userLeaveStats, requestedDays]);

  const shouldShowBalanceStats = () => {
      // Yeni sistem: PermissionTypeId sayısal geliyorsa sadece 1 (Ücretli İzin) ise göster.
      if (data?.permissionTypeId) {
          return data.permissionTypeId === 1;
      }
      
      // Eski sistem: Geriye dönük uyumluluk için metin kontrolü
      if (!data?.permissionType) return false;
      const type = data.permissionType.toLowerCase();
      if (type.includes("ücretsiz") || 
          type.includes("vefat") || 
          type.includes("mazeret")) { 
          return false;
      }
      return true;
  };

  const isAdvanceCase = data?.isAdvanceLeave || futureBalance < 0;

  const acceptPermission = async () => {
    try {
      await confirmPermission(data.id);
      messageSuccess(intl.formatMessage({ id: "confirmationForm.messages.approved" }), "success");
      close(false);
      window.location.reload(); 
    } catch (error) {
      console.error(intl.formatMessage({ id: "confirmationForm.errors.approve" }), error);
    }
  };

  const handleRejectClick = () => {
    setRejectReason(""); 
    setIsRejectModalOpen(true);
  };

  const submitReject = async () => {
    try {
      const reasonToSend = rejectReason.trim() === "" ? intl.formatMessage({ id: "confirmationForm.messages.reasonNotProvided" }) : rejectReason;
      await refusePermission(data.id, reasonToSend);
      setIsRejectModalOpen(false); 
      messageSuccess(intl.formatMessage({ id: "confirmationForm.messages.rejected" }), "success");
      close(false);
      window.location.reload(); 
    } catch (error) {
      console.error(intl.formatMessage({ id: "confirmationForm.errors.reject" }), error);
      message.error(intl.formatMessage({ id: "confirmationForm.errors.actionFailed" }));
      setIsRejectModalOpen(false);
    }
  };

  // --- GÜNCELLENEN FONKSİYON: PDF'İ YENİ SEKMEDE AÇ ---
  const handleExportClick = async () => {
    try {
      const response = await newPermissionPdf(data.id);

      // 1. Gelen veriden PDF tipinde bir Blob oluştur
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // 2. Tarayıcı belleğinde geçici bir URL oluştur
      const url = window.URL.createObjectURL(blob);
      
      // 3. Bu URL'i yeni sekmede aç (Popup engelleyicilere dikkat)
      window.open(url, '_blank');

      // Not: Kullanıcı etkileşimi (click) olduğu için modern tarayıcılar genelde izin verir.

    } catch (err) {
      console.error(intl.formatMessage({ id: "confirmationForm.errors.pdfOpen" }), err);
      message.error(intl.formatMessage({ id: "confirmationForm.errors.pdfOpenMessage" }));
    }
  };
  // ----------------------------------------------------

  const getFileName = (path) => {
      if (!path) return "";
      return path.split(/[\\/]/).pop();
  };

  const actionButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 110,
    height: 38,
    lineHeight: 1,
    fontWeight: 500,
  };

  return (
    <>
      <Drawer
        title={intl.formatMessage({ id: "confirmationForm.drawer.title" })}
        placement="right"
        onClose={() => close(false)}
        open={open}
        size="large"
        width={700} 
        extra={
          data?.status !== "Declined" && (
            <Space align="center">
              {/* --- GÜNCELLENEN BUTON --- */}
              <Button
                className="modal-input"
                icon={<EyeOutlined />} // İkon değişti
                type="dashed"
                style={{ color: "#F40F02" }}
                onClick={handleExportClick} 
              >
                {intl.formatMessage({ id: "confirmationForm.actions.viewReport" })}
              </Button>
            </Space>
          )
        }
      >
        <div ref={divRef}>
          <Space style={{ width: "100%" }} direction="vertical" size={20}>
            
            {/* --- BAKİYE KUTUSU --- */}
            {data?.status === "Pending" && shouldShowBalanceStats() && (
                <Alert
                    message={
                      isAdvanceCase
                        ? intl.formatMessage({ id: "confirmationForm.balance.advanceWarning" })
                        : intl.formatMessage({ id: "confirmationForm.balance.status" })
                    }
                    type={isAdvanceCase ? "warning" : "info"}
                    showIcon
                    icon={isAdvanceCase ? <WarningOutlined style={{ fontSize: 24 }} /> : <InfoCircleOutlined style={{ fontSize: 24 }} />}
                    style={{ 
                        border: isAdvanceCase ? '1px solid #ffe58f' : '1px solid #91d5ff', 
                        background: isAdvanceCase ? '#fffbe6' : '#e6f7ff' 
                    }}
                    description={
                        <div style={{ marginTop: 10 }}>
                            {isAdvanceCase 
                                ? <p>{intl.formatMessage({ id: "confirmationForm.balance.insufficient" })} <b>{intl.formatMessage({ id: "confirmationForm.balance.borrowed" })}</b></p>
                                : <p>{intl.formatMessage({ id: "confirmationForm.balance.sufficientPrefix" })} <b>{intl.formatMessage({ id: "confirmationForm.balance.sufficientBold" })}</b> {intl.formatMessage({ id: "confirmationForm.balance.sufficientSuffix" })}</p>
                            }
                            
                            <Row gutter={16} style={{ marginTop: 15, textAlign: 'center' }}>
                                {/* MEVCUT BAKİYE */}
                                <Col span={8}>
                                    <Card 
                                        size="small" 
                                        bordered={false} 
                                        style={{ 
                                            background: '#ffffff', 
                                            border: '1px solid #d9d9d9', 
                                            borderRadius: '6px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)' 
                                        }}
                                    >
                                        <Statistic 
                                            title={<span style={{color: '#595959', fontSize: '13px', fontWeight: '500'}}>{intl.formatMessage({ id: "confirmationForm.balance.current" })}</span>}
                                            value={userLeaveStats?.remainingLeave || 0} 
                                            precision={1}
                                            valueStyle={{ color: '#262626', fontWeight: 'bold', fontSize: '20px' }}
                                        />
                                    </Card>
                                </Col>

                                {/* DÜŞÜLECEK GÜN */}
                                <Col span={8}>
                                    <Card 
                                        size="small" 
                                        bordered={false} 
                                        style={{ 
                                            background: '#fff1f0', 
                                            border: '1px solid #ffa39e', 
                                            borderRadius: '6px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <Statistic 
                                            title={<span style={{color: '#cf1322', fontSize: '13px', fontWeight: '500'}}>{intl.formatMessage({ id: "confirmationForm.balance.deducted" })}</span>} 
                                            value={requestedDays} 
                                            precision={1}
                                            valueStyle={{ color: '#cf1322', fontWeight: 'bold', fontSize: '20px' }}
                                            prefix="-"
                                        />
                                    </Card>
                                </Col>

                                {/* KALAN BAKİYE */}
                                <Col span={8}>
                                    <Card 
                                        size="small" 
                                        bordered={false} 
                                        style={{ 
                                            background:'#f6ffed', 
                                            border:'1px solid #b7eb8f',
                                            borderRadius: '6px',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                        }}
                                    >
                                        <Statistic 
                                            title={<span style={{color:'#389e0d', fontSize: '13px', fontWeight: '500'}}>{intl.formatMessage({ id: "confirmationForm.balance.remaining" })}</span>} 
                                            value={futureBalance} 
                                            precision={1}
                                            valueStyle={{ color:'#389e0d', fontWeight: 'bold', fontSize: '20px' }}
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        </div>
                    }
                />
            )}

            <Descriptions
              column={2}
              labelStyle={{ fontWeight: "bolder" }}
              title={intl.formatMessage({ id: "confirmationForm.sections.delivery" })}
              layout="vertical"
              bordered
            >
              <Descriptions.Item label={intl.formatMessage({ id: "confirmationForm.table.status" })}>
                {data?.status === "Confirmed" ? (
                  <Badge color="green" status="success" text={intl.formatMessage({ id: "confirmationForm.status.confirmed" })} />
                ) : data?.status === "Declined" ? (
                  <Badge color="red" status="error" text={intl.formatMessage({ id: "confirmationForm.status.declined" })} />
                ) : (
                  <Badge color="gold" status="processing" text={intl.formatMessage({ id: "confirmationForm.status.pending" })} />
                )}
              </Descriptions.Item>
              
              {data?.status !== "Declined" && (
                <Descriptions.Item label={intl.formatMessage({ id: "confirmationForm.labels.approvalReport" })}>
                  <button
                    type="button"
                    onClick={() => openPdfDrawer(true)}
                    style={{
                      background: "transparent",
                      border: 0,
                      padding: 0,
                      color: "#1890ff",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                    }}
                  >
                    <PaperClipOutlined style={{ marginRight: "0.3rem" }} />
                    {intl.formatMessage({ id: "confirmationForm.labels.approvalReportFile" })}
                  </button>
                </Descriptions.Item>
              )}

              <Descriptions.Item
                span={data?.startTime && data?.endTime ? 1 : 2}
                label={intl.formatMessage({ id: "confirmationForm.labels.startDateTime" })}
              >
                {moment(data?.startTime).format("DD.MM.YYYY HH:mm")}
              </Descriptions.Item>
              <Descriptions.Item
                style={{ display: data?.endTime ? "block" : "none" }}
                label={intl.formatMessage({ id: "confirmationForm.labels.endDateTime" })}
                span={1}
              >
                {moment(data?.endTime).format("DD.MM.YYYY HH:mm")}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions
              column={2}
              labelStyle={{ fontWeight: "bolder" }}
              title={intl.formatMessage({ id: "confirmationForm.sections.permission" })}
              layout="vertical"
              bordered
            >
              <Descriptions.Item span={2} label={intl.formatMessage({ id: "confirmationForm.table.permissionType" })}>
                {data?.permissionTypeDisplayName || (PERMISSION_NAMES[data?.permissionType] ? intl.formatMessage({ id: PERMISSION_NAMES[data?.permissionType] }) : data?.permissionType)}
                {isAdvanceCase && shouldShowBalanceStats() && (
                    <span style={{color:'red', marginLeft: 10, fontWeight:'bold'}}>({intl.formatMessage({ id: "confirmationForm.labels.advance" })})</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: "confirmationForm.labels.description" })}>
                {data?.description}
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: "confirmationForm.labels.addressDuringLeave" })}>
                {data?.address}
              </Descriptions.Item>
              
              {data?.status === "Declined" && (
                  <Descriptions.Item label={intl.formatMessage({ id: "confirmationForm.labels.rejectReason" })} span={2}>
                      <span style={{ color: "red", fontWeight: "bold" }}>
                          {data?.rejectReason || intl.formatMessage({ id: "confirmationForm.messages.reasonNotProvidedDot" })}
                      </span>
                  </Descriptions.Item>
              )}
            </Descriptions>
            
            <Descriptions
              column={2}
              labelStyle={{ fontWeight: "bolder" }}
              title={intl.formatMessage({ id: "confirmationForm.sections.employee" })}
              layout="vertical"
              bordered
            >
              <Descriptions.Item label="#ID">{data?.userId}</Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: "confirmationForm.labels.fullName" })}>
                {data?.user?.name || data?.personel}
              </Descriptions.Item>
              <Descriptions.Item span={2} label={intl.formatMessage({ id: "confirmationForm.labels.email" })}>
                {data?.email}
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: "confirmationForm.labels.phone" })}>
                {data?.phoneNumber ? formatPhoneNumber(data.phoneNumber) : null}
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: "confirmationForm.labels.leaveDocuments" })}>
                {data?.documentPath ? (
                    <a 
                       href={`${host}/dosyalar/user-pdf-attachments/${getFileName(data.documentPath)}`} 
                       target="_blank"
                       rel="noopener noreferrer"
                       style={{ display: "flex", alignItems: "center", gap: "5px", color: "#1890ff" }}
                    >
                        <EyeOutlined /> 
                        {getFileName(data.documentPath)} 
                    </a>
                ) : (
                    <span style={{ color: "#ccc" }}>{intl.formatMessage({ id: "confirmationForm.labels.noFile" })}</span>
                )}
              </Descriptions.Item>
            </Descriptions>
          </Space>

          <div
            style={{
              marginTop: "30px",
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              padding: "10px",
            }}
          >
            {data?.status === "Pending" && role?.roleName === "admin" ? (
              <>
                <Button 
                  onClick={acceptPermission} 
                  type="primary" 
                  style={{ ...actionButtonStyle, backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  icon={<CheckCircleOutlined />}
                >
                  {intl.formatMessage({ id: "confirmationForm.actions.approve" })}
                </Button>
                
                <Button 
                  onClick={handleRejectClick} 
                  type="primary" 
                  danger
                  style={actionButtonStyle}
                  icon={<CloseCircleOutlined />}
                >
                  {intl.formatMessage({ id: "confirmationForm.actions.reject" })}
                </Button>
              </>
            ) : (
              <Alert
                message={
                  data?.status === "Confirmed" 
                    ? intl.formatMessage({ id: "confirmationForm.messages.requestConfirmed" }) 
                    : data?.status === "Declined"
                    ? intl.formatMessage({ id: "confirmationForm.messages.requestDeclined" })
                    : intl.formatMessage({ id: "confirmationForm.messages.requestPending" })
                }
                type={
                    data?.status === "Confirmed" ? "success" : 
                    data?.status === "Declined" ? "error" : 
                    "warning"
                }
                showIcon
                style={{ width: '100%', textAlign: 'center' }}
              />
            )}
          </div>
        </div>
      </Drawer>

      {/* REDDETME MODALI */}
      <Modal
        title={intl.formatMessage({ id: "confirmationForm.labels.rejectReason" })}
        open={isRejectModalOpen}
        onOk={submitReject}
        onCancel={() => setIsRejectModalOpen(false)}
        okText={intl.formatMessage({ id: "confirmationForm.actions.rejectAndSubmit" })}
        cancelText={intl.formatMessage({ id: "confirmationForm.actions.cancel" })}
        okButtonProps={{ danger: true }}
        destroyOnClose={true} 
      >
        <p>{intl.formatMessage({ id: "confirmationForm.messages.rejectPrompt" })}</p>
        <Input.TextArea 
            rows={4} 
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder={intl.formatMessage({ id: "confirmationForm.placeholders.rejectReason" })}
        />
      </Modal>
    </>
  );
};

export default PermissionDetails;