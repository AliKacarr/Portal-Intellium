// src/containers/EmergencyContact/EmergencyContact.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useIntl } from "react-intl";
import "./customStyles.css";
import {
  Typography,
  Space,
  Input,
  Tooltip,
  Row,
  Col,
  Breadcrumb,
  Dropdown,
  Modal,
  Form,
  Button,
  message,
} from "antd";
import {
  EllipsisOutlined,
  DeleteOutlined,
  PhoneOutlined,
  DesktopOutlined,
  CopyOutlined,
  MailOutlined,
  EnvironmentOutlined,
  MessageOutlined,
  PlusCircleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  EditOutlined,
} from "@ant-design/icons";

import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";

import {
  ContentWrapper,
  StyledDivider,
  ContactCard,
  CardHeader,
  CardBody,
  ContactInfoRow,
  InfoAction,
  Avatar,
  CardContent,
  ActionMenu,
} from "./EmergencyContact.styles";

import Box from "@iso/components/utility/box";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import DeleteModal from "./Components/DeleteModal";
import { useSelector } from "react-redux";

import {
  getEmergencyContactsByUserId,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  setPrimaryEmergencyContact,
} from "../../Api/EmergencyContactApi";

const { Title, Paragraph, Text } = Typography;

/* ---------- helpers ---------- */
const toApi = (ui) => ({
  id: ui.id ?? 0,
  userId: ui.userId,
  fullName: ui.name?.trim(),
  relationShip: ui.relashionship?.trim(),
  phoneNumber: ui.phoneNum || "",
  workPhoneNumber: ui.homeNum || "",
  eMail: (ui.email || "").trim(),
  address: ui.adress,
  isPrimary: !!ui.isPrimary,
});

const fromApi = (api) => ({
  id: api.id,
  userId: api.userId,
  name: api.fullName,
  relashionship: api.relationShip,
  phoneNum: api.phoneNumber,
  homeNum: api.workPhoneNumber,
  email: api.eMail,
  adress: api.address,
  isPrimary: api.isPrimary,
});

const emptyUI = (userId, lastId = 0) => ({
  id: lastId + 1,
  userId,
  name: "",
  email: "",
  phoneNum: "",
  homeNum: "",
  adress: "",
  relashionship: "",
  isPrimary: false,
});

const sortPrimaryFirst = (arr) =>
  [...arr].sort(
    (a, b) => b.isPrimary - a.isPrimary || a.name.localeCompare(b.name)
  );

// Renk fonksiyonu
const getColorById = (id) => {
  const customColors = ["#D04848", "#F3B95F", "#FDE767", "#A4CE95", "#6895D2"];
  const index = id % customColors.length;
  return customColors[index];
};
/* ----------------------------- */

const EmergencyContact = () => {
  const intl = useIntl();
  const loggedUser = useSelector((state) => state.Auth);
  const userId = loggedUser?.id;

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();
  const [delOpen, setDelOpen] = useState(false);
  const [willDeleteId, setWillDeleteId] = useState(null);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const hoverTimer = useRef(null);

  useEffect(() => () => clearTimeout(hoverTimer.current), []);
  useEffect(() => { fetchList(); }, [userId]);

  const ensurePrimaryIfSingle = async (items) => {
    if (items.length === 1 && !items[0].isPrimary) {
      try {
        await setPrimaryEmergencyContact(items[0].id);
        setList([{ ...items[0], isPrimary: true }]);
      } catch {
        message.warning(intl.formatMessage({ id: "emergencyContact.autoPrimaryFailed" }));
      }
    }
  };

  const fetchList = async () => {
    if (!Number.isFinite(Number(userId))) return;
    try {
      setLoading(true);
      const res = await getEmergencyContactsByUserId(userId);
      const data = res?.data?.data ?? [];
      const mapped = sortPrimaryFirst(data.map(fromApi));
      setList(mapped);
      ensurePrimaryIfSingle(mapped);
    } catch (e) {
      message.info(e?.response?.data?.message || intl.formatMessage({ id: "emergencyContact.fetchFailed" }));
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const newDefaults = useMemo(
    () => emptyUI(userId, list[list.length - 1]?.id || 0),
    [userId, list]
  );

  const openAdd = () => {
    setEditing(null);
    form.setFieldsValue(newDefaults);
    setModalOpen(true);
  };

  const openEdit = (rec) => {
    setEditing(rec);
    form.setFieldsValue(rec);
    setModalOpen(true);
  };

  const onSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editing) {
        await updateEmergencyContact(toApi({ ...editing, ...values, userId }));
        message.success(intl.formatMessage({ id: "emergencyContact.updateSuccess" }));
      } else {
        await addEmergencyContact(toApi({ ...values, userId }));
        message.success(intl.formatMessage({ id: "emergencyContact.addSuccess" }));
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      await fetchList();
    } catch (e) {
      message.error(e?.response?.data?.message || intl.formatMessage({ id: "emergencyContact.operationFailed" }));
    }
  };

  const onDelete = async () => {
    try {
      await deleteEmergencyContact(willDeleteId);
      message.success(intl.formatMessage({ id: "emergencyContact.deleteSuccess" }));
      setDelOpen(false);
      setWillDeleteId(null);
      await fetchList();
    } catch (e) {
      message.error(e?.response?.data?.message || intl.formatMessage({ id: "emergencyContact.deleteFailed" }));
    }
  };

  const onMakePrimary = async (id) => {
    try {
      await setPrimaryEmergencyContact(id);
      message.success(intl.formatMessage({ id: "emergencyContact.primarySuccess" }));
      await fetchList();
    } catch (e) {
      message.error(e?.response?.data?.message || intl.formatMessage({ id: "emergencyContact.primaryFailed" }));
    }
  };

  const copyText = (text, type) => {
    navigator.clipboard.writeText(text);
    message.success(intl.formatMessage({ id: "emergencyContact.copied" }, { type }));
  };

  const sendMail = (email) => {
    window.open(`mailto:${email}?subject=${encodeURIComponent(intl.formatMessage({ id: "emergencyContact.emailSubject" }))}`);
  };

  const handleMouseEnter = (id) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      setExpandedCardId(id);
    }, 100);
  };

  const handleMouseLeave = () => {
    clearTimeout(hoverTimer.current);
    setExpandedCardId(null);
  };

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px", minHeight: "85vh" }}>
        <Row align="bottom" justify="space-between">
          <Col>
            <Breadcrumb style={{ marginBottom: 20 }}>
              <Breadcrumb.Item>{intl.formatMessage({ id: "emergencyContact.profile" })}</Breadcrumb.Item>
              <Breadcrumb.Item>{intl.formatMessage({ id: "emergencyContact.title" })}</Breadcrumb.Item>
            </Breadcrumb>
            <Typography>
              <Title level={2} style={{ margin: 0 }}>
                {intl.formatMessage({ id: "emergencyContact.title" })}
              </Title>
              <Paragraph style={{ color: "#8c8c8c", margin: 0 }}>
                {intl.formatMessage({ id: "emergencyContact.subtitle" })}
              </Paragraph>
            </Typography>
          </Col>
          <Col>
            <Space align="center" size="large">
              <Paragraph style={{ margin: 0, color: "#acacac" }}>
                <UserOutlined /> {intl.formatMessage({ id: "emergencyContact.contactCount" })} : {list.length}
              </Paragraph>
              <Tooltip
                title={
                  list.length >= 3
                    ? intl.formatMessage({ id: "emergencyContact.maxThree" })
                    : ""
                }
              >
                <span>
                  <Button
                    onClick={openAdd}
                    icon={<PlusCircleOutlined />}
                    type="primary"
                    disabled={list.length >= 3}
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    {intl.formatMessage({ id: "emergencyContact.addNewPerson" })}
                  </Button>
                </span>
              </Tooltip>
            </Space>
          </Col>
        </Row>

        <StyledDivider />

        <ContentWrapper>
          <Row gutter={[32, 32]} wrap justify="start">
            {list.map((c) => (
              <Col span={8} key={c.id}>
                <ContactCard
                  className={c.isPrimary ? "primary-contact" : ""}
                  onMouseEnter={() => handleMouseEnter(c.id)}
                  onMouseLeave={handleMouseLeave}
                >
                  <CardHeader />
                  <Avatar bgColor={getColorById(c.id)}>
                    {c.name ? c.name.charAt(0).toUpperCase() : "?"}
                  </Avatar>

                  <ActionMenu>
                    <Dropdown
                      menu={{
                        items: [
                          {
                            key: "edit",
                            label: (
                              <a onClick={() => openEdit(c)}>
                                <EditOutlined style={{ marginRight: 8 }} />
                                {intl.formatMessage({ id: "emergencyContact.edit" })}
                              </a>
                            ),
                          },
                          { type: "divider" },
                          {
                            key: "delete",
                            danger: true,
                            label: (
                              <a
                                onClick={() => {
                                  setDelOpen(true);
                                  setWillDeleteId(c.id);
                                }}
                              >
                                <DeleteOutlined style={{ marginRight: 8 }} />
                                {intl.formatMessage({ id: "emergencyContact.delete" })}
                              </a>
                            ),
                          },
                        ],
                      }}
                      placement="bottomRight"
                    >
                      <Button
                        type="text"
                        shape="circle"
                        style={{ color: "white" }}
                        icon={<EllipsisOutlined />}
                      />
                    </Dropdown>
                    {c.isPrimary ? (
                      <Tooltip placement="top" title={intl.formatMessage({ id: "emergencyContact.primary" })} color="#87d068">
                        <CheckCircleOutlined
                          style={{
                            color: "#fff",
                            fontSize: "1rem",
                            background: "#87d068",
                            borderRadius: "50%",
                            padding: "3px",
                          }}
                        />
                      </Tooltip>
                    ) : (
                      <Tooltip placement="top" title={intl.formatMessage({ id: "emergencyContact.makePrimary" })}>
                        <CheckCircleOutlined
                          style={{
                            fontSize: "1rem",
                            color: "white",
                            opacity: 0.7,
                            cursor: "pointer",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMakePrimary(c.id);
                          }}
                        />
                      </Tooltip>
                    )}
                  </ActionMenu>

                  <CardContent>
                    <Title
                      level={5}
                      style={{
                        margin: 0,
                        fontWeight: 600,
                        fontSize: "18px",
                      }}
                    >
                      {c.name}
                    </Title>
                    <Text type="secondary">{c.relashionship}</Text>

                    {expandedCardId === c.id && (
                      <CardBody>
                        <ContactInfoRow>
                          <PhoneOutlined /> <Text>{c.phoneNum}</Text>
                          <InfoAction>
                            <Tooltip title={intl.formatMessage({ id: "emergencyContact.copy" })}>
                              <CopyOutlined
                                onClick={() => copyText(c.phoneNum, "Telefon")}
                              />
                            </Tooltip>
                          </InfoAction>
                        </ContactInfoRow>

                        {c.homeNum && (
                          <ContactInfoRow>
                            <DesktopOutlined /> <Text>{c.homeNum}</Text>
                            <InfoAction>
                              <Tooltip title="Kopyala">
                                <CopyOutlined
                                  onClick={() =>
                                    copyText(c.homeNum, intl.formatMessage({ id: "emergencyContact.workPhone" }))
                                  }
                                />
                              </Tooltip>
                            </InfoAction>
                          </ContactInfoRow>
                        )}
                        <ContactInfoRow>
                          <MailOutlined />{" "}
                          <Text>{(c.email || "").toLowerCase()}</Text>
                          <InfoAction>
                            <Tooltip title={intl.formatMessage({ id: "emergencyContact.sendEmail" })}>
                              <MessageOutlined
                                onClick={() => sendMail(c.email)}
                              />
                            </Tooltip>
                          </InfoAction>
                        </ContactInfoRow>
                        {c.adress && (
                          <ContactInfoRow>
                            <EnvironmentOutlined />
                            <Text className="address-text">{c.adress}</Text>
                          </ContactInfoRow>
                        )}
                      </CardBody>
                    )}
                  </CardContent>
                </ContactCard>
              </Col>
            ))}
          </Row>
        </ContentWrapper>

        <Modal
          title={editing ? intl.formatMessage({ id: "emergencyContact.editPerson" }) : intl.formatMessage({ id: "emergencyContact.newPersonInfo" })}
          centered
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
            form.resetFields();
          }}
          okText={editing ? intl.formatMessage({ id: "emergencyContact.save" }) : intl.formatMessage({ id: "emergencyContact.add" })}
          onOk={onSubmit}
          destroyOnClose
        >
          <Form layout="vertical" form={form} initialValues={newDefaults}>
            <Space direction="vertical" size="small" style={{ display: "flex" }}>
              <Form.Item style={{ margin: 0 }}>
                <Form.Item
                  name="name"
                  label={intl.formatMessage({ id: "emergencyContact.fullName" })}
                  rules={[{ required: true }]}
                  style={{
                    display: "inline-block",
                    width: "calc(50% - 8px)",
                    margin: "0 8px 0 0",
                  }}
                >
                  <Input placeholder={intl.formatMessage({ id: "emergencyContact.fullNamePlaceholder" })} />
                </Form.Item>
                <Form.Item
                  name="relashionship"
                  label={intl.formatMessage({ id: "emergencyContact.relationship" })}
                  rules={[{ required: true }]}
                  style={{
                    display: "inline-block",
                    width: "calc(50% - 8px)",
                    margin: 0,
                  }}
                >
                  <Input placeholder={intl.formatMessage({ id: "emergencyContact.relationshipPlaceholder" })} />
                </Form.Item>
              </Form.Item>
              <Form.Item
                style={{ margin: "1rem 0 0 0" }}
                label={intl.formatMessage({ id: "emergencyContact.contactInfo" })}
              >
                <Form.Item
                  name="phoneNum"
                  label={intl.formatMessage({ id: "emergencyContact.phoneNumber" })}
                  rules={[
                    { required: true },
                    {
                      validator: (_, value) =>
                        value && isValidPhoneNumber(value)
                          ? Promise.resolve()
                          : Promise.reject(new Error(intl.formatMessage({ id: "emergencyContact.validPhone" }))),
                    },
                  ]}
                  style={{ display: "inline-block", width: "calc(50% - 8px)" }}
                >
                  <PhoneInput
                    defaultCountry="TR"
                    international
                    placeholder={intl.formatMessage({ id: "emergencyContact.phonePlaceholder" })}
                  />
                </Form.Item>
                <Form.Item
                  name="homeNum"
                  label={intl.formatMessage({ id: "emergencyContact.workPhoneLabel" })}
                  rules={[
                    {
                      validator: (_, value) =>
                        !value || isValidPhoneNumber(value)
                          ? Promise.resolve()
                          : Promise.reject(new Error(intl.formatMessage({ id: "emergencyContact.validPhone" }))),
                    },
                  ]}
                  style={{
                    display: "inline-block",
                    width: "calc(50% - 8px)",
                    margin: "0 8px",
                  }}
                >
                  <PhoneInput
                    defaultCountry="TR"
                    international
                    placeholder={intl.formatMessage({ id: "emergencyContact.workPhonePlaceholder" })}
                  />
                </Form.Item>
                <Form.Item
                  name="email"
                  label={intl.formatMessage({ id: "emergencyContact.email" })}
                  rules={[{ required: true, type: "email" }]}
                  style={{ margin: "8px 0 0 0" }}
                >
                  <Input
                    type="email"
                    placeholder={intl.formatMessage({ id: "emergencyContact.emailPlaceholder" })}
                    prefix={<MailOutlined />}
                  />
                </Form.Item>
              </Form.Item>
              <Form.Item
                name="adress"
                rules={[{ required: true }]}
                label={intl.formatMessage({ id: "emergencyContact.address" })}
                style={{ margin: "1rem 0 0 0" }}
              >
                <Input.TextArea
                  rows={3}
                  placeholder={intl.formatMessage({ id: "emergencyContact.addressPlaceholder" })}
                  maxLength={150}
                  showCount
                />
              </Form.Item>
            </Space>
          </Form>
        </Modal>

        <DeleteModal
          open={delOpen}
          onOk={onDelete}
          onCancel={() => setDelOpen(false)}
        />
      </Box>
    </LayoutWrapper>
  );
};

export default EmergencyContact;