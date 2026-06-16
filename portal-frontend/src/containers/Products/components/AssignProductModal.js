import React, { useState, useEffect, useMemo } from "react";
import { Modal, Form, Select, Button, message, Descriptions, Divider, Input, Row, Col, Spin } from "antd";
import axios from "axios";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { host } from "../../../Api/host";
import { getJobByUserId } from "../../../Api/ProfileApi";
import { alanlar } from "../../../Data/profileEditData";

const DEPARTMENTS = ["Ar&Ge", "Merkez", "Dış Kaynak"];

const AssignProductModal = ({ open, close, product, refreshData }) => {
  const intl = useIntl();
  const [form] = Form.useForm();

  const [allUsersWithJobs, setAllUsersWithJobs] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  const [selectedDept, setSelectedDept] = useState(null);
  const [selectedService, setSelectedService] = useState(null);

  const { id: currentAdminId, accessToken } = useSelector((state) => state.Auth);
  const token = accessToken || localStorage.getItem("token");

  const axiosAuth = useMemo(
    () =>
      axios.create({
        baseURL: host,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [token]
  );

  useEffect(() => {
    const initData = async () => {
      setFetchingData(true);
      try {
        const userRes = await axiosAuth.get("/api/Users/getuserlist");
        const userPayload = userRes?.data;
        const rawUsers = Array.isArray(userPayload)
          ? userPayload
          : Array.isArray(userPayload?.data)
          ? userPayload.data
          : [];

        const detailedUsers = await Promise.all(
          rawUsers.map(async (u) => {
            try {
              const jobRes = await getJobByUserId(u.id);
              const jobData = jobRes?.data?.data || {};

              return {
                value: u.id,
                label: u.name || u.fullName || intl.formatMessage({ id: "products.userFallback" }, { id: u.id }),
                department: jobData.department,
                serviceArea: jobData.serviceArea,
              };
            } catch {
              return { value: u.id, label: u.name, department: null, serviceArea: null };
            }
          })
        );

        setAllUsersWithJobs(detailedUsers);
        setFilteredUsers(detailedUsers);
      } catch (err) {
        console.error("Veri hazırlama hatası:", err);
        message.error(intl.formatMessage({ id: "products.userListLoadFailed" }));
      } finally {
        setFetchingData(false);
      }
    };

    if (open) {
      form.resetFields();
      setSelectedDept(null);
      setSelectedService(null);
      initData();
    }
  }, [open, axiosAuth, form, intl]);

  useEffect(() => {
    if (!open) return;

    let result = allUsersWithJobs;

    if (selectedDept) {
      result = result.filter((u) => u.department === selectedDept);
    }

    if (selectedService) {
      result = result.filter((u) => u.serviceArea === selectedService);
    }

    setFilteredUsers(result);

    const currentReceiver = form.getFieldValue("receiverUserId");
    const exists = result.find((u) => u.value === currentReceiver);
    if (currentReceiver && !exists) {
      form.setFieldsValue({ receiverUserId: null, department: "", serviceArea: "" });
    }
  }, [open, selectedDept, selectedService, allUsersWithJobs, form]);

  const handleReceiverChange = (userId) => {
    const selectedUser = allUsersWithJobs.find((u) => u.value === userId);
    if (selectedUser) {
      form.setFieldsValue({
        department: selectedUser.department || "-",
        serviceArea: selectedUser.serviceArea || "-",
      });
    } else {
      form.setFieldsValue({ department: "", serviceArea: "" });
    }
  };

  const onFinish = async (values) => {
    setLoading(true);

    let finalAdminId = currentAdminId;
    if (!finalAdminId) {
      try {
        const lsUser = JSON.parse(localStorage.getItem("user") || "{}");
        finalAdminId = lsUser.id || lsUser.userId || 0;
      } catch {}
    }

    if (!finalAdminId || finalAdminId === 0) {
      message.error(intl.formatMessage({ id: "products.sessionError" }));
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ProductId: product.id,
        ReceiverUserId: values.receiverUserId,
        DeliveredUserId: finalAdminId,
        Description: values.description,
      };

      const res = await axiosAuth.post("/api/debit/add", payload);

      if (res.data.success) {
        message.success(intl.formatMessage({ id: "products.assignSuccess" }));
        close();
        window.setTimeout(() => {
          refreshData?.();
        }, 0);
      } else {
        message.error(res.data.message || intl.formatMessage({ id: "products.assignError" }));
      }
    } catch (err) {
      console.error(err);
      message.error(intl.formatMessage({ id: "products.assignFailed" }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({ id: "products.assignTitle" })}
      open={open}
      onCancel={close}
      footer={null}
      destroyOnClose
      width={800}
    >
      {product && (
        <>
          <Descriptions title={intl.formatMessage({ id: "products.selectedProduct" })} size="small" bordered column={2}>
            <Descriptions.Item label={intl.formatMessage({ id: "products.labelProduct" })}>
              {product.category} - {product.brand} {product.model}
            </Descriptions.Item>
            <Descriptions.Item label={intl.formatMessage({ id: "products.labelSerial" })}>{product.serialNumber}</Descriptions.Item>
          </Descriptions>
          <Divider />
        </>
      )}

      <Spin spinning={fetchingData} tip={intl.formatMessage({ id: "products.spinPreparingUsers" })}>
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <div
            style={{
              backgroundColor: "#f9f9f9",
              padding: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #eee",
            }}
          >
            <p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#666", fontSize: "13px" }}>
              {intl.formatMessage({ id: "products.filterStaffTitle" })}
            </p>
            <Row gutter={16} style={{ marginBottom: 15 }}>
              <Col span={12}>
                <Form.Item label={intl.formatMessage({ id: "products.selectDepartment" })} style={{ marginBottom: 0 }}>
                  <Select
                    placeholder={intl.formatMessage({ id: "products.allDepartments" })}
                    allowClear
                    onChange={(val) => setSelectedDept(val)}
                    value={selectedDept}
                  >
                    {DEPARTMENTS.map((d) => (
                      <Select.Option key={d} value={d}>
                        {d}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label={intl.formatMessage({ id: "products.selectServiceArea" })} style={{ marginBottom: 0 }}>
                  <Select
                    placeholder={intl.formatMessage({ id: "products.allDepartments" })}
                    allowClear
                    onChange={(val) => setSelectedService(val)}
                    value={selectedService}
                    showSearch
                    optionFilterProp="children"
                  >
                    {alanlar.map((s, index) => (
                      <Select.Option key={index} value={s}>
                        {s}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider style={{ margin: "15px 0" }} />

            <p style={{ margin: "0 0 10px 0", fontWeight: "bold", color: "#666", fontSize: "13px" }}>
              {intl.formatMessage({ id: "products.selectStaffTitle" })}
            </p>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="receiverUserId"
                  label={intl.formatMessage({ id: "products.receiverStaff" })}
                  rules={[{ required: true, message: intl.formatMessage({ id: "products.selectStaffRequired" }) }]}
                  style={{ marginBottom: 0 }}
                  help={
                    selectedDept || selectedService
                      ? intl.formatMessage({ id: "products.filterResultCount" }, { count: filteredUsers.length })
                      : ""
                  }
                >
                  <Select
                    showSearch
                    placeholder={intl.formatMessage({ id: "products.searchStaffPlaceholder" })}
                    optionFilterProp="label"
                    options={filteredUsers}
                    onChange={handleReceiverChange}
                    notFoundContent={intl.formatMessage({ id: "products.staffNotFound" })}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="department" label={intl.formatMessage({ id: "products.labelDepartment" })} style={{ marginBottom: 0 }}>
                  <Input
                    disabled
                    style={{ color: "#555", cursor: "default", backgroundColor: "#fff" }}
                    placeholder={intl.formatMessage({ id: "products.autoFilled" })}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="serviceArea" label={intl.formatMessage({ id: "products.labelServiceArea" })} style={{ marginBottom: 0 }}>
                  <Input
                    disabled
                    style={{ color: "#555", cursor: "default", backgroundColor: "#fff" }}
                    placeholder={intl.formatMessage({ id: "products.autoFilled" })}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Form.Item name="description" label={intl.formatMessage({ id: "products.notesOptional" })}>
            <Input.TextArea placeholder={intl.formatMessage({ id: "products.notesPlaceholder" })} rows={3} />
          </Form.Item>

          <div style={{ textAlign: "right", marginTop: 20 }}>
            <Button onClick={close} style={{ marginRight: 8 }}>
              {intl.formatMessage({ id: "products.cancelShort" })}
            </Button>
            <Button type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: "#722ed1", borderColor: "#722ed1" }}>
              {intl.formatMessage({ id: "products.assign" })}
            </Button>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
};

export default AssignProductModal;
