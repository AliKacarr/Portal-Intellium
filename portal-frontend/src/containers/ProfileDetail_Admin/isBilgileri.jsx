import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button, Col, DatePicker, Form, Input, message, Row, Select, Switch } from "antd";
import { useIntl } from "react-intl";
import { addUserJob, getJobByUserId, UserJobEdit } from "../../Api/ProfileApi";
import { UserDetail, UserEdit } from "../../Api/UserApi";
import moment from "moment";
import { alanlar } from "../../Data/profileEditData";
import { JOB_BOLUMU_NAMES } from "../../Data/jobBolumleri";
import { seviyeler } from "../../Data/profileEditData";

const toApiDateString = (value) => {
  if (!value) return null;
  const m = moment.isMoment(value) ? value : moment(value);
  if (!m.isValid()) return null;
  return m.format("YYYY-MM-DD");
};

const parseJobDateForForm = (value) => {
  if (!value) return null;
  if (moment.isMoment(value)) return value;
  const str = typeof value === "string" ? value : String(value);
  const datePart = str.includes("T") ? str.split("T")[0] : str.slice(0, 10);
  const parsed = moment(datePart, "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed : moment(value);
};

const IsBilgileri = ({ userId, isUserRole }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [workDetail, setWorkDetail] = useState({});
  const [isActive, setIsActive] = useState(true);
  const [currentUserInfo, setCurrentUserInfo] = useState({});
  const saveInProgressRef = useRef(false);

  const getJob = useCallback(async () => {
    try {
      const response = await getJobByUserId(userId);
      if (response.data.success) {
        const jobData = response.data.data;
        const updatedJobData = {
          ...jobData,
          startDate: jobData.startDate ? parseJobDateForForm(jobData.startDate) : null,
          endDate: jobData.endDate ? parseJobDateForForm(jobData.endDate) : null,
        };
        setIsActive(jobData.isActive);
        form.setFieldsValue(updatedJobData);
        setWorkDetail(updatedJobData);
      }
    } catch (error) {
      console.error("Error fetching job data:", error);
    }
  }, [userId, form]);

  const getUserMainInfo = useCallback(async () => {
    try {
      const response = await UserDetail(userId);
      if (response && response.data && response.data.data) {
        setCurrentUserInfo(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching user main data:", error);
    }
  }, [userId]);

  useEffect(() => {
    getJob();
    getUserMainInfo();
  }, [getJob, getUserMainInfo]);

  const onFinish = async (values) => {
    if (saveInProgressRef.current) return;
    saveInProgressRef.current = true;
    setLoading(true);

    const formDataUserJob = {
      id: workDetail.id || 0,
      userId: userId,
      startDate: toApiDateString(values.startDate),
      jobTitle: values.jobTitle,
      isActive: isActive,
      ...(isUserRole
        ? {}
        : {
            anotherId: values.anotherId,
            recruitmentSource: values.recruitmentSource,
            workingStatus: values.workingStatus,
            department: values.department,
            level: values.level,
            departureDate: toApiDateString(values.endDate),
            paymentType: values.paymentType,
            serviceArea: values.serviceArea,
            jobCode: values.jobCode,
            seniority: values.seniority,
            departureReason: values.reasonForLeaving,
            location: values.location,
            managerName: values.managerName,
          }),
    };

    const mainUserDto = {
      Id: userId,
      Name: currentUserInfo.name,
      Email: currentUserInfo.email,
      Language: currentUserInfo.language || "Türkçe",
      IsActive: isActive,
    };

    try {
      if (workDetail.id) {
        await UserJobEdit(formDataUserJob);
      } else {
        await addUserJob(formDataUserJob);
      }

      await UserEdit(mainUserDto);

      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.jobSaved" }),
      });

      getJob();
      getUserMainInfo();
    } catch (e) {
      console.error("Hata:", e);
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "profileDetailAdmin.message.genericError" }),
      });
    } finally {
      saveInProgressRef.current = false;
      setLoading(false);
    }
  };

  return (
    <div>
      {contextHolder}
      <Form
        onFinish={onFinish}
        form={form}
        labelCol={{ xs: { span: 6 }, sm: { span: 8 }, lg: { span: 8 } }}
        wrapperCol={{ xs: { span: 24 }, sm: { span: 24 }, lg: { span: 24 } }}
        layout="horizontal"
        style={{ marginTop: 20, marginRight: "2rem" }}
      >
        <Row gutter={16}>
          {isUserRole ? (
            <Col sm={24} md={24} lg={12}>
              <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.jobTitle" })} name="jobTitle">
                <Input />
              </Form.Item>
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.department" })} name="department">
                  <Select>
                    {JOB_BOLUMU_NAMES.map((b) => (
                      <Select.Option key={b} value={b}>
                        {b}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              <Form.Item wrapperCol={{ offset: 8 }}>
                <Button type="primary" htmlType="submit" loading={loading}>
                  {intl.formatMessage({ id: "profileDetailAdmin.save" })}
                </Button>
              </Form.Item>
            </Col>
          ) : (
            <>
              <Col sm={24} md={24} lg={12}>
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.otherId" })} name="anotherId">
                  <Input />
                </Form.Item>

                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.startDate" })} name="startDate">
                  <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
                </Form.Item>

                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.jobCode" })} name="jobCode">
                  <Input />
                </Form.Item>
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.seniority" })} name="seniority">
                  <Input />
                </Form.Item>

                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.recruitmentSource" })} name="recruitmentSource">
                  <Select>
                    <Select.Option value="Doğrudan">{intl.formatMessage({ id: "profileDetailAdmin.recruit.direct" })}</Select.Option>
                    <Select.Option value="Referans">{intl.formatMessage({ id: "profileDetailAdmin.recruit.reference" })}</Select.Option>
                    <Select.Option value="Ağ">{intl.formatMessage({ id: "profileDetailAdmin.recruit.network" })}</Select.Option>
                    <Select.Option value="IK Firma">{intl.formatMessage({ id: "profileDetailAdmin.recruit.agency" })}</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.employeeStatus" })} style={{ marginBottom: 18 }}>
                  <Switch
                    onChange={(e) => setIsActive(e)}
                    style={{ width: "60px" }}
                    checkedChildren={intl.formatMessage({ id: "profileDetailAdmin.switch.active" })}
                    unCheckedChildren={intl.formatMessage({ id: "profileDetailAdmin.switch.passive" })}
                    checked={isActive}
                  />
                </Form.Item>

                {!isActive && (
                  <>
                    <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.endDate" })} name="endDate">
                      <DatePicker style={{ width: "100%" }} format="DD.MM.YYYY" />
                    </Form.Item>
                    <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.leaveReason" })} name="reasonForLeaving">
                      <Input />
                    </Form.Item>
                  </>
                )}
              </Col>
              <Col sm={24} md={24} lg={12}>
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.workingStatus" })} name="workingStatus">
                  <Select>
                    <Select.Option value="Tam Zamanlı">{intl.formatMessage({ id: "profileDetailAdmin.work.fullTime" })}</Select.Option>
                    <Select.Option value="Yarı Zamanlı">{intl.formatMessage({ id: "profileDetailAdmin.work.partTime" })}</Select.Option>
                    <Select.Option value="Kontratlı">{intl.formatMessage({ id: "profileDetailAdmin.work.contract" })}</Select.Option>
                    <Select.Option value="Stajyer">{intl.formatMessage({ id: "profileDetailAdmin.work.intern" })}</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.payType" })} name="paymentType">
                  <Select>
                    <Select.Option value="Brüt">{intl.formatMessage({ id: "profileDetailAdmin.pay.gross" })}</Select.Option>
                    <Select.Option value="Net">{intl.formatMessage({ id: "profileDetailAdmin.pay.net" })}</Select.Option>
                    <Select.Option value="Fatura">{intl.formatMessage({ id: "profileDetailAdmin.pay.invoice" })}</Select.Option>
                  </Select>
                </Form.Item>
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.location" })} name="location">
                  <Input />
                </Form.Item>
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.department" })} name="department">
                  <Select>
                    {JOB_BOLUMU_NAMES.map((b) => (
                      <Select.Option key={b} value={b}>
                        {b}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.serviceArea" })} name="serviceArea">
                  <Select>
                    {alanlar.map((alan, index) => (
                      <Select.Option key={index} value={alan}>
                        {alan}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.label.jobTitle" })} name="jobTitle">
                  <Input />
                </Form.Item>
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.level" })} name="level">
                  <Select>
                    {seviyeler.map((seviye) => (
                      <Select.Option key={seviye.seviye} value={String(seviye.seviye)}>
                        {intl.formatMessage({ id: "profileDetailAdmin.job.levelOption" }, { level: seviye.seviye, range: seviye.yilAraligi })}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label={intl.formatMessage({ id: "profileDetailAdmin.job.manager" })} name="managerName">
                  <Input />
                </Form.Item>

                <Form.Item wrapperCol={{ offset: 8 }}>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    {intl.formatMessage({ id: "profileDetailAdmin.save" })}
                  </Button>
                </Form.Item>
              </Col>
            </>
          )}
        </Row>
      </Form>
    </div>
  );
};

export default IsBilgileri;
