import React, { useRef } from "react";
import { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import {
  Button,
  Form,
  Breadcrumb,
  Switch,
  message,
  Space,
  Input,
  Row,
  Col,
  Upload,
  Card,
  Tag,
  Checkbox,
  Typography,
  Divider,
  Spin,
  Drawer,
  Tabs,
} from "antd";
import PageHeader from "@iso/components/utility/pageHeader";
import {
  CheckCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  MailOutlined,
  PlusOutlined,
  SaveOutlined,
  SyncOutlined,
  TeamOutlined,
  UnorderedListOutlined,
  UploadOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import Select, { SelectOption } from "@iso/components/uielements/select";
import Box from "@iso/components/utility/box";
import LayoutWrapper from "@iso/components/utility/layoutWrapper.js";
import ContentHolder from "@iso/components/utility/contentHolder";
// import spacetime from "spacetime";
import TimezoneSelect, { allTimezones } from "react-timezone-select";
import { Link } from "react-router-dom";
import { diller } from "../../../Data/languages";
import { addUser, ChangeUserImage, getRoles } from "../../../Api/UserApi";
import { GetAllCustomerAsBasic } from "../../../Api/CustomerApi";
import {
  createUsersFromCvImport,
  deleteCvUserImportItems,
  getCvUserImportItems,
  uploadCvUserImport,
} from "../../../Api/CvUserImportApi";
import { generatePassword } from "../../../components/PasswordGenerator/passwordGenerator";

const Option = SelectOption;
const { Dragger } = Upload;
const { Text, Title } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const splitFullName = (fullName = "") => {
  const nameParts = fullName.trim().split(" ").filter(Boolean);
  return {
    name: nameParts.slice(0, -1).join(" ") || nameParts[0] || "",
    surname: nameParts.length > 1 ? nameParts[nameParts.length - 1] : "",
  };
};

const getCandidateFormValues = (candidate = {}) => {
  const nameParts = splitFullName(candidate.name);
  const profile = candidate.profile || {};
  const phoneNumber =
    profile.telNo ||
    profile.TelNo ||
    profile.phoneNumber ||
    profile.phone ||
    profile.telefon ||
    "";

  return {
    account: {
      username: candidate.name || "",
      email: candidate.email || "",
      password: candidate.account?.password || "",
      language: candidate.language || "Türkçe",
      userRole: candidate.account?.userRole,
      customer: candidate.account?.customer,
      currentTitle: candidate.role || candidate.account?.currentTitle || "",
      timezone: candidate.account?.timezone || "Europe/Istanbul",
      isActive: candidate.account?.isActive ?? true,
    },
    profile: {
      name: profile.name || nameParts.name,
      surname: profile.surname || nameParts.surname,
      adress: profile.adress || "",
      country: profile.country || "",
      province: profile.province || "",
      district: profile.district || "",
      telNo: phoneNumber,
      githubUrl: profile.githubUrl || "",
      linkedInUrl: profile.linkedInUrl || "",
    },
    jobExperiences: candidate.jobExperiences || [],
    educations: candidate.educations || [],
    languages: candidate.languages || [],
    certificates: candidate.certificates || [],
  };
};

const buildCandidateFromFormValues = (candidate, values, customers, roles) => {
  const selectedCustomer = customers.find(
    (customer) => customer.customerId === values.account?.customer
  );
  const selectedRole = roles.find((role) => role.id === values.account?.userRole);

  return {
    ...candidate,
    name: values.account?.username,
    email: values.account?.email,
    language: values.account?.language,
    role: values.account?.currentTitle,
    company: selectedCustomer?.customerName || values.account?.customer,
    skills: candidate.skills,
    account: {
      ...values.account,
      customerName: selectedCustomer?.customerName,
      roleName: selectedRole?.roleName,
    },
    profile: values.profile,
    jobExperiences: values.jobExperiences,
    educations: values.educations,
    languages: values.languages,
    certificates: values.certificates,
    localEdited: true,
  };
};

const normalizeCandidateFromApi = (candidate = {}) => {
  const account = candidate.account || {};
  const rawProfile = candidate.profile || {};
  const profile = {
    ...rawProfile,
    telNo:
      rawProfile.telNo ||
      rawProfile.TelNo ||
      rawProfile.phoneNumber ||
      rawProfile.phone ||
      rawProfile.telefon ||
      "",
  };
  const username = account.username || [profile.name, profile.surname].filter(Boolean).join(" ");

  return {
    name: username,
    email: account.email || "",
    role: account.currentTitle || "",
    language: account.language || "Türkçe",
    skills: candidate.skills || [],
    account: {
      ...account,
      password: account.password || generatePassword(),
    },
    profile,
    jobExperiences: candidate.jobExperiences || [],
    educations: candidate.educations || [],
    languages: candidate.languages || [],
    certificates: candidate.certificates || [],
  };
};

const mapImportStatusToCardStatus = (status) => {
  if (status === "Completed") return "ready";
  if (status === "Applied") return "applied";
  if (status === "Failed") return "error";
  return "loading";
};

const mapImportItemToCandidate = (item) => {
  const parsedCandidate = normalizeCandidateFromApi(item.candidate || {});

  return {
    ...parsedCandidate,
    id: item.id,
    batchId: item.batchId,
    fileName: item.fileName,
    status: mapImportStatusToCardStatus(item.status),
    importStatus: item.status,
    errorMessage: item.errorMessage,
    createdUserId: item.createdUserId,
  };
};

const normalizeRoleName = (roleName = "") => {
  return roleName.toLocaleLowerCase("tr-TR").trim();
};

const findDefaultUserRole = (roles = []) => {
  return roles.find((role) =>
    ["user", "kullanıcı", "kullanici"].includes(normalizeRoleName(role.roleName))
  );
};

const buildCreateUsersPayload = (candidates, customers, roles) => ({
  candidates: candidates.map((candidate) => {
    const defaultUserRole = findDefaultUserRole(roles);
    const roleId =
      candidate.account?.userRole ||
      roles.find((role) => role.roleName === candidate.account?.roleName)?.id ||
      defaultUserRole?.id ||
      roles[0]?.id;
    const customerId =
      candidate.account?.customer ||
      customers.find((customer) => customer.customerName === candidate.company)
        ?.customerId ||
      customers[0]?.customerId;

    return {
      itemId: candidate.id,
      candidate: {
        account: {
          ...candidate.account,
          userRole: roleId,
          customer: customerId,
        },
        profile: candidate.profile,
        skills: candidate.skills || [],
        jobExperiences: candidate.jobExperiences || [],
        educations: candidate.educations || [],
        languages: candidate.languages || [],
        certificates: candidate.certificates || [],
      },
    };
  }),
});

function CreateUser() {
  const intl = useIntl();
  //// şifre göster-gizle
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [candidatePasswordVisible, setCandidatePasswordVisible] =
    React.useState(false);
  //// Form sıfırlama
  const [form] = Form.useForm();
  const [candidateForm] = Form.useForm();

  const createPassword = () => {
    const password = generatePassword();
    form.setFieldValue("password", password);
    setPassword(password);
    setPasswordVisible(true);
  };

  const createCandidatePassword = () => {
    const password = generatePassword();
    candidateForm.setFieldsValue({
      account: {
        ...candidateForm.getFieldValue("account"),
        password,
      },
    });
    setCandidatePasswordVisible(true);
  };

  //// Mesaj
  const [messageApi, contextHolder] = message.useMessage();
  const pendingCvFilesRef = useRef(new Map());
  const uploadTimerRef = useRef();
  const uploadQueueRef = useRef(Promise.resolve());

  //// Form Kontrol
  const validateEmail = (rule, value, callback) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value || emailRegex.test(value)) {
      callback(); // Geçerli
    } else {
      callback(intl.formatMessage({ id: "user.form.invalidEmail" }));
    }
  };

  // Use Effect
  const getUserRoles = async () => {
    const response = await getRoles();
    setRoles(response.data.data);
  };

  const getCustomersList = async () => {
    const response = await GetAllCustomerAsBasic();
    setCustomers(response.data.data);
  };

  const extractUserIdFromRegisterResponse = (response) => {
    const directId =
      response?.data?.id ||
      response?.data?.user?.id ||
      response?.data?.data?.id;
    if (directId) return Number(directId);

    const rawToken =
      response?.data?.accessToken ||
      response?.data?.AccessToken ||
      response?.data?.data?.accessToken ||
      response?.data?.data?.AccessToken;

    if (!rawToken || typeof rawToken !== "string") return null;

    try {
      const tokenPayload = rawToken.split(".")[1];
      if (!tokenPayload) return null;
      const normalizedPayload = tokenPayload.replace(/-/g, "+").replace(/_/g, "/");
      const decodedPayload = JSON.parse(atob(normalizedPayload));
      const candidateId =
        decodedPayload?.nameid ||
        decodedPayload?.sub ||
        decodedPayload?.userId ||
        decodedPayload?.id ||
        decodedPayload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];

      return candidateId ? Number(candidateId) : null;
    } catch (error) {
      return null;
    }
  };

  const onFinish = async (values) => {
    // Form submit işlemleri burada gerçekleştirilebilir

    const tzValue = timezone?.value ?? timezone;
    const formDataUser = {
      name,
      email,
      language,
      password: values.password?.trim() || null,
      userRoleId,
      isActive,
      customerId,
      timezone: tzValue,
      birthDate: new Date("2000-01-01").toISOString(),
      addetAt: new Date().toISOString(),
    };

    try {
      const response = await addUser(formDataUser);
      const createdUserId = extractUserIdFromRegisterResponse(response);

      if (pendingImageFile && createdUserId) {
        const imageFormData = new FormData();
        imageFormData.append("image", pendingImageFile);
        imageFormData.append("userId", createdUserId);
        await ChangeUserImage(imageFormData);
      } else if (pendingImageFile && !createdUserId) {
        messageApi.open({
          type: "warning",
          content: intl.formatMessage({ id: "user.create.photoWithoutIdWarning" }),
        });
      }

      messageApi.open({
        type: "success",
        content: values.password?.trim()
          ? intl.formatMessage({ id: "user.create.successWithPassword" })
          : intl.formatMessage({ id: "user.create.successEmailLink" }),
      });
      form.resetFields();
      setPassword();
      setName();
      setEmail();
      setLanguage();
      setUserRoleId();
      setCustomerId();
      onDeleteProfileImage();
    } catch (e) {
      const backendMsg =
        e?.response?.data?.message || e?.response?.data || intl.formatMessage({ id: "user.form.unknownError" });
      console.error("Register error:", e?.response?.status, backendMsg);
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "user.create.createFailedPrefix" }, { msg: backendMsg }),
      });
    }
  };

  useEffect(() => {
    getUserRoles();
    getCustomersList();
  }, []);

  //////////////////
  const [customers, setCustomers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [name, setName] = useState();
  const [email, setEmail] = useState();
  const [language, setLanguage] = useState();
  const [password, setPassword] = useState();
  const [userRoleId, setUserRoleId] = useState();
  const [isActive, setIsActive] = useState(true);
  const [customerId, setCustomerId] = useState();
  const [fileList, setFileList] = useState([]);
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [previewObjectUrl, setPreviewObjectUrl] = useState(null);
  const [cvCandidates, setCvCandidates] = useState([]);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [editingCandidateId, setEditingCandidateId] = useState();

  // Timezone için
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  // const [datetime, setDatetime] = useState(spacetime.now());

  // // useMemo(() => {
  // //   const tzValue = timezone.value ?? timezone;
  // //   setDatetime(datetime.goto(tzValue));
  // // }, [timezone]);

  const beforeProfileUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error(intl.formatMessage({ id: "user.form.jpgPngOnly" }));
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error(intl.formatMessage({ id: "user.form.maxFileSize10" }));
    }

    return isJpgOrPng && isLt10M ? false : Upload.LIST_IGNORE;
  };

  const onProfileUploadChange = ({ file }) => {
    const localFile = file?.originFileObj || file;
    if (!(localFile instanceof File)) return;

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }
    const nextPreviewUrl = URL.createObjectURL(localFile);
    setPreviewObjectUrl(nextPreviewUrl);
    setPendingImageFile(localFile);
    setFileList([
      {
        uid: file.uid || `new-${Date.now()}`,
        name: localFile.name,
        status: "done",
        url: nextPreviewUrl,
      },
    ]);
  };

  const onDeleteProfileImage = () => {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }
    setPendingImageFile(null);
    setFileList([]);
    return false;
  };

  useEffect(() => {
    return () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    };
  }, [previewObjectUrl]);

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>{intl.formatMessage({ id: "user.form.photoUpload" })}</div>
    </div>
  );

  const selectedCandidates = cvCandidates.filter((candidate) =>
    selectedCandidateIds.includes(candidate.id)
  );
  const selectedReadyCandidates = selectedCandidates.filter(
    (candidate) => candidate.status === "ready"
  );
  const selectableCandidateIds = cvCandidates
    .filter((candidate) => candidate.status !== "applied")
    .map((candidate) => candidate.id);
  const isAllCandidatesSelected =
    selectableCandidateIds.length > 0 &&
    selectableCandidateIds.every((id) => selectedCandidateIds.includes(id));
  const isAllCvParsed =
    cvCandidates.length > 0 &&
    cvCandidates.every((candidate) =>
      ["ready", "error", "applied"].includes(candidate.status)
    );
  const editingCandidate = cvCandidates.find(
    (candidate) => candidate.id === editingCandidateId
  );

  const syncCandidateItems = React.useCallback((items = []) => {
    setCvCandidates((previousCandidates) => {
      const previousById = new Map(
        previousCandidates.map((candidate) => [candidate.id, candidate])
      );

      return items.map((item) => {
        const mappedCandidate = mapImportItemToCandidate(item);
        const previousCandidate = previousById.get(mappedCandidate.id);

        if (previousCandidate?.localEdited && mappedCandidate.status === "ready") {
          return {
            ...mappedCandidate,
            ...previousCandidate,
            fileName: mappedCandidate.fileName,
            importStatus: mappedCandidate.importStatus,
            status: mappedCandidate.status,
          };
        }

        return mappedCandidate;
      });
    });
  }, []);

  const refreshStoredCvCandidates = React.useCallback(async () => {
    const response = await getCvUserImportItems();
    const items = response.data.data || [];
    syncCandidateItems(items);
    setSelectedCandidateIds((previousIds) =>
      previousIds.filter((id) => items.some((item) => item.id === id))
    );
  }, [syncCandidateItems]);

  useEffect(() => {
    refreshStoredCvCandidates().catch((error) => {
      console.error("CV import list error:", error);
    });
  }, [refreshStoredCvCandidates]);

  useEffect(() => {
    const hasLoadingCvCandidates = cvCandidates.some(
      (candidate) => candidate.status === "loading"
    );

    if (!hasLoadingCvCandidates) return undefined;

    const intervalId = window.setInterval(() => {
      refreshStoredCvCandidates().catch((error) => {
        console.error("CV import list status error:", error);
      });
    }, 2000);

    return () => window.clearInterval(intervalId);
  }, [cvCandidates, refreshStoredCvCandidates]);

  useEffect(() => {
    const pendingFiles = pendingCvFilesRef.current;

    return () => {
      if (uploadTimerRef.current) {
        window.clearTimeout(uploadTimerRef.current);
      }
      pendingFiles.clear();
    };
  }, []);

  const handleCandidateSelect = (candidateId) => {
    setSelectedCandidateIds((previousIds) =>
      previousIds.includes(candidateId)
        ? previousIds.filter((id) => id !== candidateId)
        : [...previousIds, candidateId]
    );
  };

  const selectAllCandidates = () => {
    setSelectedCandidateIds((previousIds) => [
      ...new Set([...previousIds, ...selectableCandidateIds]),
    ]);
  };

  const uploadCvFiles = async (files) => {
    try {
      const orderedFiles = [...files].sort((left, right) =>
        (left.name || "").localeCompare(right.name || "", "tr-TR", {
          numeric: true,
          sensitivity: "base",
        })
      );
      const response = await uploadCvUserImport(orderedFiles);
      const batch = response.data.data;
      const uploadedItemIds = batch.items.map((item) => item.id);

      setSelectedCandidateIds((previousIds) => [
        ...new Set([...previousIds, ...uploadedItemIds]),
      ]);
      await refreshStoredCvCandidates();

      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "user.create.cvQueued" }, { count: batch.items.length }),
      });
    } catch (error) {
      const backendMsg =
        error?.response?.data?.message ||
        error?.response?.data ||
        intl.formatMessage({ id: "user.create.cvUploadFailed" });
      messageApi.open({
        type: "error",
        content: backendMsg,
      });
    }
  };

  const enqueueCvUpload = (files) => {
    uploadQueueRef.current = uploadQueueRef.current
      .catch(() => undefined)
      .then(() => uploadCvFiles(files));
  };

  const handleCvBeforeUpload = (file) => {
    const fileKey = `${file.uid || file.name}-${file.name}-${file.size}`;
    pendingCvFilesRef.current.set(fileKey, file);

    if (uploadTimerRef.current) {
      window.clearTimeout(uploadTimerRef.current);
    }

    uploadTimerRef.current = window.setTimeout(() => {
      const files = Array.from(pendingCvFilesRef.current.values());
      pendingCvFilesRef.current.clear();
      uploadTimerRef.current = undefined;

      if (files.length) {
        enqueueCvUpload(files);
      }
    }, 300);

    return false;
  };

  const getCandidateRoleId = (candidate) => {
    if (
      candidate.account?.userRole &&
      roles.some((role) => role.id === candidate.account.userRole)
    ) {
      return candidate.account.userRole;
    }

    const matchedRole = roles.find(
      (role) =>
        normalizeRoleName(role.roleName) ===
        normalizeRoleName(candidate.account?.roleName || "user")
    );
    const defaultUserRole = findDefaultUserRole(roles);

    return matchedRole?.id || defaultUserRole?.id || roles[0]?.id;
  };

  const getCandidateCustomerId = (candidate) => {
    if (
      candidate.account?.customer &&
      customers.some(
        (customer) => customer.customerId === candidate.account.customer
      )
    ) {
      return candidate.account.customer;
    }

    const matchedCustomer = customers.find(
      (customer) =>
        customer.customerName?.toLocaleLowerCase("tr-TR") ===
        (candidate.company || "Intellium").toLocaleLowerCase("tr-TR")
    );

    return matchedCustomer?.customerId || customers[0]?.customerId;
  };

  const openCandidateEdit = (candidate) => {
    if (candidate.status !== "ready") {
      return;
    }

    setEditingCandidateId(candidate.id);
    setCandidatePasswordVisible(false);
    const candidateValues = getCandidateFormValues(candidate);
    candidateForm.setFieldsValue({
      ...candidateValues,
      account: {
        ...candidateValues.account,
        userRole: getCandidateRoleId(candidate),
        customer: getCandidateCustomerId(candidate),
      },
    });
  };

  const closeCandidateEdit = () => {
    setEditingCandidateId();
    setCandidatePasswordVisible(false);
    candidateForm.resetFields();
  };

  const saveCandidateDetails = (values) => {
    setCvCandidates((previousCandidates) =>
      previousCandidates.map((candidate) =>
        candidate.id === editingCandidateId
          ? buildCandidateFromFormValues(candidate, values, customers, roles)
          : candidate
      )
    );
    messageApi.open({
      type: "success",
      content: intl.formatMessage({ id: "user.create.personUpdated" }),
    });
    closeCandidateEdit();
  };

  const deleteSelectedCandidates = () => {
    if (!selectedCandidateIds.length) {
      messageApi.open({
        type: "warning",
        content: intl.formatMessage({ id: "user.create.selectCardToDelete" }),
      });
      return;
    }

    deleteCvUserImportItems({ itemIds: selectedCandidateIds })
      .then(() => {
        setCvCandidates((previousCandidates) =>
          previousCandidates.filter(
            (candidate) => !selectedCandidateIds.includes(candidate.id)
          )
        );
        setSelectedCandidateIds([]);
        messageApi.open({
          type: "success",
          content: intl.formatMessage({ id: "user.create.cardsDeleted" }),
        });
      })
      .catch((error) => {
        const backendMsg =
          error?.response?.data?.message ||
          error?.response?.data ||
          intl.formatMessage({ id: "user.create.cardsDeleteFailed" });
        messageApi.open({
          type: "error",
          content: backendMsg,
        });
      });
  };

  const createSelectedCandidates = async () => {
    if (!selectedReadyCandidates.length) {
      messageApi.open({
        type: "warning",
        content: intl.formatMessage({ id: "user.create.selectReadyToCreate" }),
      });
      return;
    }

    try {
      const response = await createUsersFromCvImport(
        buildCreateUsersPayload(selectedReadyCandidates, customers, roles)
      );
      const result = response.data.data;
      const failureText = result.failures?.length
        ? intl.formatMessage({ id: "user.create.usersFailedSuffix" }, { count: result.failures.length })
        : "";

      messageApi.open({
        type: result.failures?.length ? "warning" : "success",
        content:
          intl.formatMessage({ id: "user.create.usersCreated" }, { count: result.createdCount }) + failureText,
      });

      const createdItemIds = (result.createdUsers || [])
        .map((createdUser) => createdUser.itemId)
        .filter(Boolean);
      setCvCandidates((previousCandidates) =>
        previousCandidates.filter(
          (candidate) => !createdItemIds.includes(candidate.id)
        )
      );
      await refreshStoredCvCandidates();

      setSelectedCandidateIds([]);
    } catch (error) {
      const backendMsg =
        error?.response?.data?.message ||
        error?.response?.data ||
        intl.formatMessage({ id: "user.create.selectedUsersCreateFailed" });
      messageApi.open({
        type: "error",
        content: backendMsg,
      });
    }
  };

  return (
    <LayoutWrapper>
      {contextHolder}
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "user.create.breadcrumbUser" })}</Breadcrumb.Item>
          <Breadcrumb.Item>{intl.formatMessage({ id: "user.create.breadcrumbCreate" })}</Breadcrumb.Item>
        </Breadcrumb>
        <PageHeader>
          {intl.formatMessage({ id: "user.create.pageTitle" })}
        </PageHeader>
        <div
          className="isoProjectTableBtn"
          style={{ width: "100%", textAlign: "right", marginTop: "-70px" }}
        >
          <Link to={`/dashboard/UserList`}>
            <Button
              type="primary"
              className="mateAddProjectBtn user-page-header-action-btn"
              icon={<UnorderedListOutlined />}
            >
              {intl.formatMessage({ id: "user.edit.backToList" })}
            </Button>
          </Link>
        </div>
        <ContentHolder style={{ padding: "10px 20px" }}>
          <Row gutter={[28, 20]} align="top">
            <Col xs={24} xl={10}>
              <Form
                form={form}
                onFinish={onFinish}
                labelCol={{
                  span: 10,
                }}
                wrapperCol={{
                  span: 20,
                }}
                layout="horizontal"
                style={{
                  maxWidth: 650,
                }}
              >
                <Form.Item label={intl.formatMessage({ id: "user.form.profilePhoto" })} style={{ marginBottom: 18 }}>
                  <Space direction="vertical" style={{ width: "100%" }} size={8}>
                    <Space align="start">
                      <Upload
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        listType="picture-card"
                        fileList={fileList}
                        maxCount={1}
                        beforeUpload={beforeProfileUpload}
                        onChange={onProfileUploadChange}
                        onRemove={onDeleteProfileImage}
                        showUploadList={{ showPreviewIcon: false }}
                      >
                        {fileList.length >= 1 ? null : uploadButton}
                      </Upload>

                      {fileList.length > 0 && (
                        <Space direction="vertical">
                          <Upload
                            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                            showUploadList={false}
                            beforeUpload={beforeProfileUpload}
                            onChange={onProfileUploadChange}
                            maxCount={1}
                          >
                            <Button icon={<EditOutlined />}>{intl.formatMessage({ id: "user.common.change" })}</Button>
                          </Upload>
                          <Button icon={<DeleteOutlined />} onClick={onDeleteProfileImage}>
                            {intl.formatMessage({ id: "user.common.delete" })}
                          </Button>
                        </Space>
                      )}
                    </Space>

                    {fileList.length > 0 && (
                      <Typography.Text>
                        {intl.formatMessage({ id: "user.form.fileLabel" })}{" "}
                        {fileList[0]?.name || intl.formatMessage({ id: "user.form.unnamedFile" })}
                      </Typography.Text>
                    )}
                  </Space>
                </Form.Item>

                <Form.Item
                  label={intl.formatMessage({ id: "user.form.fullName" })}
                  name="fullname"
                  style={{ marginBottom: 18}}
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({ id: "user.form.required" }),
                    },
                  ]}
                >
                  <Input
                    placeholder={intl.formatMessage({ id: "user.form.fullName" })}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="off"
                  />
                </Form.Item>

                <Form.Item
                  label={intl.formatMessage({ id: "user.form.email" })}
                  style={{ marginBottom: 18 }}
                  name="e-mail"
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({ id: "user.form.required" }),
                    },
                    {
                      validator: validateEmail,
                    },
                  ]}
                >
                  <Input
                    placeholder={intl.formatMessage({ id: "user.form.emailPlaceholder" })}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Form.Item>
                <Form.Item
                  label={intl.formatMessage({ id: "user.form.password" })}
                  name="password"
                  style={{ marginBottom: 18 }}
                >
                  <Space.Compact style={{ width: "100%" }}>
                    <Input.Password
                      placeholder={intl.formatMessage({ id: "user.form.password" })}
                      type="password"
                      onChange={(e) => setPassword(e.target.value)}
                      value={password}
                      visibilityToggle={{
                        visible: passwordVisible,
                        onVisibleChange: setPasswordVisible,
                      }}
                    />

                    <Button
                      type="default"
                      icon={<SyncOutlined />}
                      onClick={() => createPassword()}
                      aria-label={intl.formatMessage({ id: "user.form.generatePasswordAria" })}
                    />
                  </Space.Compact>
                </Form.Item>
                <Form.Item
                  label={intl.formatMessage({ id: "user.form.language" })}
                  name="language"
                  style={{ marginBottom: 18 }}
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({ id: "user.form.required" }),
                    },
                  ]}
                >
                  <Select
                    showSearch
                    onChange={(e) => setLanguage(e)}
                    filterOption={diller}
                    placeholder={intl.formatMessage({ id: "user.form.selectLanguage" })}
                    style={{ width: "100%" }}
                  >
                    {diller.map((dil, index) => (
                      <Option key={index} value={dil.ad}>
                        {dil.ad}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  label={intl.formatMessage({ id: "user.form.userRole" })}
                  style={{ marginBottom: 18 }}
                  name="userRole"
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({ id: "user.form.required" }),
                    },
                  ]}
                >
                  <Select
                    placeholder={intl.formatMessage({ id: "user.form.selectRole" })}
                    onChange={(e) => setUserRoleId(e)}
                    style={{ width: "100%" }}
                  >
                    {roles.map((role, index) => (
                      <Option key={index} value={role.id}>
                        {role.roleName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item
                  label={intl.formatMessage({ id: "user.form.company" })}
                  name="customer"
                  style={{ marginBottom: 18 }}
                  rules={[
                    {
                      required: true,
                      message: intl.formatMessage({ id: "user.form.required" }),
                    },
                  ]}
                >
                  <Select
                    placeholder={intl.formatMessage({ id: "user.form.selectCompany" })}
                    onChange={(e) => setCustomerId(e)}
                    style={{ width: "100%" }}
                  >
                    {customers.map((customer, index) => (
                      <Option key={index} value={customer.customerId}>
                        {customer.customerName}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label={intl.formatMessage({ id: "user.form.timezone" })} style={{ marginBottom: 18 }}>
                  <div style={{ width: "100%" }}>
                    <TimezoneSelect
                      value={timezone}
                      onChange={setTimezone}
                      labelStyle="altName"
                      timezones={{
                        ...allTimezones,
                        "America/Lima": "Pittsburgh",
                        "Europe/Berlin": "Frankfurt",
                      }}
                    />
                  </div>
                </Form.Item>

                <Form.Item label={intl.formatMessage({ id: "user.form.accountStatus" })} style={{ marginBottom: 18 }}>
                  <Switch
                    onChange={(e) => setIsActive(e)}
                    style={{ width: "20%" }}
                    checkedChildren={intl.formatMessage({ id: "user.common.active" })}
                    unCheckedChildren={intl.formatMessage({ id: "user.common.inactive" })}
                    defaultChecked
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 18 }}>
                  <Space>
                    <Button
                      type="primary"
                      icon={<UserAddOutlined />}
                      style={{
                        marginLeft: "230px",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                      htmlType="submit"
                    >
                      {intl.formatMessage({ id: "user.create.submitButton" })}
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Col>

            <Col xs={24} xl={14}>
              <div
                style={{
                  border: "1px solid #e8edf3",
                  borderRadius: 8,
                  padding: 18,
                  background: "#fbfcfe",
                  minHeight: 360,
                }}
              >
                <Row gutter={[16, 16]} align="middle">
                  <Col xs={24} md={15}>
                    <Title level={4} style={{ margin: 0, color: "#344054" }}>
                      {intl.formatMessage({ id: "user.create.cvSectionTitle" })}
                    </Title>
                    <Text type="secondary">
                      {intl.formatMessage({ id: "user.create.cvSectionSubtitle" })}
                    </Text>
                  </Col>
                  <Col xs={24} md={9} style={{ textAlign: "right" }}>
                    <Tag color="blue" style={{ marginRight: 0 }}>
                      {intl.formatMessage(
                        { id: "user.create.selectedPeopleCount" },
                        { count: selectedReadyCandidates.length }
                      )}
                    </Tag>
                  </Col>
                </Row>
         

                <Divider style={{ margin: "14px 0" }} />

                <Dragger
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  showUploadList={false}
                  beforeUpload={handleCvBeforeUpload}
                  style={{
                    borderRadius: 8,
                    background: "#f4f8ff",
                    padding: "6px 0",
                  }}
                >
                  <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
                    <UploadOutlined />
                  </p>
                  <p className="ant-upload-text" style={{ marginBottom: 4 }}>
                    {intl.formatMessage({ id: "user.create.draggerText" })}
                  </p>
                  <p className="ant-upload-hint">
                    {intl.formatMessage({ id: "user.create.draggerHint" })}
                  </p>
                  <p className="ant-upload-hint" style={{ marginTop: 4 }}>
                    Kabul edilen dosya türleri: PDF, DOC, DOCX, TXT.
                  </p>
                </Dragger>

                <Row gutter={[14, 14]} style={{ marginTop: 16 }}>
                  {cvCandidates.map((candidate) => (
                    <Col xs={24} lg={12} key={candidate.id}>
                      <Card
                        size="small"
                        onClick={() => openCandidateEdit(candidate)}
                        role="button"
                        tabIndex={candidate.status === "ready" ? 0 : -1}
                        style={{
                          borderRadius: 8,
                          borderColor: selectedCandidateIds.includes(candidate.id)
                            ? "#2f80ed"
                            : "#e8edf3",
                          height: "100%",
                          cursor:
                            candidate.status === "ready" ? "pointer" : "default",
                        }}
                        title={
                          <Space>
                            <Checkbox
                              checked={selectedCandidateIds.includes(
                                candidate.id
                              )}
                              disabled={candidate.status === "applied"}
                              onClick={(event) => event.stopPropagation()}
                              onChange={() => handleCandidateSelect(candidate.id)}
                            />
                            <FileTextOutlined style={{ color: "#2f80ed" }} />
                            <Text strong>{candidate.fileName}</Text>
                          </Space>
                        }
                      >
                        {candidate.status === "loading" ? (
                          <Space
                            direction="vertical"
                            size={8}
                            style={{ width: "100%", minHeight: 118 }}
                          >
                            <Spin />
                            <Text strong>{intl.formatMessage({ id: "user.create.cardLoadingTitle" })}</Text>
                            <Text type="secondary">
                              {intl.formatMessage({ id: "user.create.cardLoadingHint" })}
                            </Text>
                          </Space>
                        ) : candidate.status === "error" ? (
                          <Space
                            direction="vertical"
                            size={8}
                            style={{ width: "100%", minHeight: 118 }}
                          >
                            <Text strong type="danger">
                              {intl.formatMessage({ id: "user.create.cardErrorTitle" })}
                            </Text>
                            <Text type="secondary">
                              {candidate.errorMessage || intl.formatMessage({ id: "user.create.cardAiError" })}
                            </Text>
                          </Space>
                        ) : candidate.status === "applied" ? (
                          <Space
                            direction="vertical"
                            size={8}
                            style={{ width: "100%", minHeight: 118 }}
                          >
                            <Space>
                              <UserAddOutlined style={{ color: "#344054" }} />
                              <Text strong>{candidate.name}</Text>
                              <Tag color="blue">{intl.formatMessage({ id: "user.create.tagCreated" })}</Tag>
                            </Space>
                            <Text type="secondary">
                              <MailOutlined /> {candidate.email}
                            </Text>
                            <Text>
                              {intl.formatMessage({ id: "user.create.userIdLabel" }, { id: candidate.createdUserId })}
                            </Text>
                          </Space>
                        ) : (
                          <Space
                            direction="vertical"
                            size={8}
                            style={{ width: "100%" }}
                          >
                            <Space>
                              <UserAddOutlined style={{ color: "#344054" }} />
                              <Text strong>{candidate.name}</Text>
                              <Tag color="green">{intl.formatMessage({ id: "user.create.tagReady" })}</Tag>
                            </Space>
                            <Text type="secondary">
                              <MailOutlined /> {candidate.email}
                            </Text>
                            <Text>
                              <TeamOutlined />{" "}
                              {candidate.role || intl.formatMessage({ id: "user.create.noPosition" })} /{" "}
                              {candidate.company ||
                                customers[0]?.customerName ||
                                intl.formatMessage({ id: "user.create.companyPending" })}
                            </Text>
                            <Space wrap>
                              <Tag>{candidate.language}</Tag>
                              {(candidate.skills || []).map((skill) => (
                                <Tag key={skill}>{skill}</Tag>
                              ))}
                            </Space>
                          </Space>
                        )}
                      </Card>
                    </Col>
                  ))}
                </Row>

                <Divider style={{ margin: "16px 0" }} />

                <Row gutter={[12, 12]} align="middle">
                  <Col xs={24}>
                    <Space direction="vertical" size={0}>
                      <Text strong>{intl.formatMessage({ id: "user.create.adminPendingTitle" })}</Text>
                      <Text type="secondary">
                        {isAllCvParsed
                          ? intl.formatMessage({ id: "user.create.allCvDone" })
                          : intl.formatMessage({ id: "user.create.canCreateWithoutWait" })}
                      </Text>
                    </Space>
                  </Col>
                  <Col xs={24}>
                    <Space
                      style={{
                        width: "100%",
                        justifyContent: "flex-end",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Button
                        onClick={selectAllCandidates}
                        disabled={!selectableCandidateIds.length || isAllCandidatesSelected}
                      >
                        Tümünü Seç
                      </Button>
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={deleteSelectedCandidates}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        {intl.formatMessage({ id: "user.create.deleteSelected" })}
                      </Button>
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={createSelectedCandidates}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                        }}
                      >
                        {intl.formatMessage({ id: "user.create.createSelected" })}
                      </Button>
                    </Space>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </ContentHolder>
      </Box>
      <Drawer
        title={
          editingCandidate
            ? intl.formatMessage({ id: "user.create.drawerTitleNamed" }, { name: editingCandidate.name })
            : intl.formatMessage({ id: "user.create.drawerTitleDefault" })
        }
        width={760}
        open={Boolean(editingCandidateId)}
        onClose={closeCandidateEdit}
        destroyOnClose
        footer={
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button icon={<CloseOutlined />} onClick={closeCandidateEdit}>
              {intl.formatMessage({ id: "user.create.drawerCancel" })}
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => candidateForm.submit()}
            >
              {intl.formatMessage({ id: "user.create.drawerSave" })}
            </Button>
          </Space>
        }
      >
        <Form
          form={candidateForm}
          layout="vertical"
          onFinish={saveCandidateDetails}
        >
          <Tabs defaultActiveKey="account">
            <TabPane tab={intl.formatMessage({ id: "user.create.drawerTabAccount" })} key="account">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={intl.formatMessage({ id: "user.form.fullName" })}
                    name={["account", "username"]}
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({ id: "user.create.ruleUsernameRequired" }),
                      },
                    ]}
                  >
                    <Input placeholder={intl.formatMessage({ id: "user.form.fullName" })} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    label={intl.formatMessage({ id: "user.form.email" })}
                    name={["account", "email"]}
                    rules={[
                      {
                        required: true,
                        message: intl.formatMessage({ id: "user.create.ruleEmailRequired" }),
                      },
                      {
                        validator: validateEmail,
                      },
                    ]}
                  >
                    <Input placeholder={intl.formatMessage({ id: "user.form.emailShortPlaceholder" })} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={intl.formatMessage({ id: "user.form.password" })}>
                    <Space.Compact style={{ width: "100%" }}>
                      <Form.Item
                        name={["account", "password"]}
                        noStyle
                        rules={[
                          {
                            required: true,
                            message: intl.formatMessage({ id: "user.create.rulePasswordRequired" }),
                          },
                        ]}
                      >
                        <Input.Password
                          placeholder={intl.formatMessage({ id: "user.form.password" })}
                          visibilityToggle={{
                            visible: candidatePasswordVisible,
                            onVisibleChange: setCandidatePasswordVisible,
                          }}
                        />
                      </Form.Item>
                      <Button
                        type="default"
                        icon={<SyncOutlined />}
                        onClick={() => createCandidatePassword()}
                        aria-label={intl.formatMessage({ id: "user.form.generatePasswordAria" })}
                      />
                    </Space.Compact>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={intl.formatMessage({ id: "user.form.language" })} name={["account", "language"]}>
                    <Select
                      showSearch
                      filterOption={diller}
                      placeholder={intl.formatMessage({ id: "user.form.selectLanguage" })}
                      style={{ width: "100%" }}
                    >
                      {diller.map((dil, index) => (
                        <Option key={index} value={dil.ad}>
                          {dil.ad}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={intl.formatMessage({ id: "user.form.userRole" })} name={["account", "userRole"]}>
                    <Select placeholder={intl.formatMessage({ id: "user.form.selectRole" })} style={{ width: "100%" }}>
                      {roles.map((role, index) => (
                        <Option key={index} value={role.id}>
                          {role.roleName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={intl.formatMessage({ id: "user.form.company" })} name={["account", "customer"]}>
                    <Select placeholder={intl.formatMessage({ id: "user.form.selectCompany" })} style={{ width: "100%" }}>
                      {customers.map((customer, index) => (
                        <Option key={index} value={customer.customerId}>
                          {customer.customerName}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={intl.formatMessage({ id: "user.create.labelCurrentTitle" })} name={["account", "currentTitle"]}>
                    <Input placeholder={intl.formatMessage({ id: "user.create.placeholderCurrentTitle" })} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={intl.formatMessage({ id: "user.form.timezone" })}>
                    <div style={{ width: "100%" }}>
                      <TimezoneSelect
                        value={candidateForm.getFieldValue(["account", "timezone"]) ?? timezone}
                        onChange={(nextTz) => {
                          candidateForm.setFieldsValue({
                            account: {
                              ...(candidateForm.getFieldValue("account") || {}),
                              timezone: nextTz?.value ?? nextTz,
                            },
                          });
                        }}
                        labelStyle="altName"
                        timezones={{
                          ...allTimezones,
                          "America/Lima": "Pittsburgh",
                          "Europe/Berlin": "Frankfurt",
                        }}
                      />
                    </div>
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab={intl.formatMessage({ id: "user.create.drawerTabProfile" })} key="profile">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item label={intl.formatMessage({ id: "user.create.labelName" })} name={["profile", "name"]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={intl.formatMessage({ id: "user.create.labelSurname" })} name={["profile", "surname"]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label="Pozisyon / Ünvan" name={["account", "currentTitle"]}>
                    <Input placeholder="Pozisyon / Ünvan" />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label={intl.formatMessage({ id: "user.create.labelAddress" })} name={["profile", "adress"]}>
                    <TextArea rows={3} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label={intl.formatMessage({ id: "user.create.labelCountry" })} name={["profile", "country"]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label={intl.formatMessage({ id: "user.create.labelCity" })} name={["profile", "province"]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item label={intl.formatMessage({ id: "user.create.labelDistrict" })} name={["profile", "district"]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24}>
                  <Form.Item label={intl.formatMessage({ id: "user.create.labelMobile" })} name={["profile", "telNo"]}>
                    <Input placeholder={intl.formatMessage({ id: "user.create.placeholderMobile" })} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={intl.formatMessage({ id: "user.create.labelGithub" })} name={["profile", "githubUrl"]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item label={intl.formatMessage({ id: "user.create.labelLinkedin" })} name={["profile", "linkedInUrl"]}>
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            </TabPane>

            <TabPane tab={intl.formatMessage({ id: "user.create.drawerTabJobExp" })} key="jobExperiences">
              <Form.List name="jobExperiences">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" style={{ width: "100%" }} size={16}>
                    {fields.map((field) => (
                      <Card
                        key={field.key}
                        size="small"
                        title={intl.formatMessage({ id: "user.create.jobExpCardTitle" }, { n: field.name + 1 })}
                        extra={
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          >
                            {intl.formatMessage({ id: "user.common.delete" })}
                          </Button>
                        }
                      >
                        <Row gutter={12}>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.jobLabelCompany" })} name={[field.name, "companyName"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.jobLabelDuty" })} name={[field.name, "duty"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.jobLabelTitle" })} name={[field.name, "jobTitle"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.jobLabelStart" })} name={[field.name, "startDate"]}>
                              <Input placeholder={intl.formatMessage({ id: "user.create.datePlaceholder" })} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.jobLabelEnd" })} name={[field.name, "departureDate"]}>
                              <Input placeholder={intl.formatMessage({ id: "user.create.datePlaceholder" })} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>
                      {intl.formatMessage({ id: "user.create.jobExpAdd" })}
                    </Button>
                  </Space>
                )}
              </Form.List>
            </TabPane>

            <TabPane tab={intl.formatMessage({ id: "user.create.drawerTabEducation" })} key="educations">
              <Form.List name="educations">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" style={{ width: "100%" }} size={16}>
                    {fields.map((field) => (
                      <Card
                        key={field.key}
                        size="small"
                        title={intl.formatMessage({ id: "user.create.eduCardTitle" }, { n: field.name + 1 })}
                        extra={
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          >
                            {intl.formatMessage({ id: "user.common.delete" })}
                          </Button>
                        }
                      >
                        <Row gutter={12}>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.eduCompleted" })} name={[field.name, "completedEducation"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.eduSchool" })} name={[field.name, "school"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.eduDepartment" })} name={[field.name, "department"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.eduScholarship" })} name={[field.name, "scholarship"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.eduGpa" })} name={[field.name, "gradePoint"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.eduStart" })} name={[field.name, "startDate"]}>
                              <Input placeholder={intl.formatMessage({ id: "user.create.datePlaceholder" })} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={8}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.eduGraduation" })} name={[field.name, "endDate"]}>
                              <Input placeholder={intl.formatMessage({ id: "user.create.datePlaceholder" })} />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>
                      {intl.formatMessage({ id: "user.create.eduAdd" })}
                    </Button>
                  </Space>
                )}
              </Form.List>
            </TabPane>

            <TabPane tab={intl.formatMessage({ id: "user.create.drawerTabLang" })} key="languages">
              <Form.List name="languages">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" style={{ width: "100%" }} size={16}>
                    {fields.map((field) => (
                      <Card
                        key={field.key}
                        size="small"
                        title={intl.formatMessage({ id: "user.create.langCardTitle" }, { n: field.name + 1 })}
                        extra={
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          >
                            {intl.formatMessage({ id: "user.common.delete" })}
                          </Button>
                        }
                      >
                        <Row gutter={12}>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.langForeign" })} name={[field.name, "foreignLanguage"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.langRead" })} name={[field.name, "read"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.langSpeak" })} name={[field.name, "speaking"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.langWrite" })} name={[field.name, "write"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.langDoc" })} name={[field.name, "documentPath"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>
                      {intl.formatMessage({ id: "user.create.langAdd" })}
                    </Button>
                  </Space>
                )}
              </Form.List>
            </TabPane>

            <TabPane tab={intl.formatMessage({ id: "user.create.drawerTabCerts" })} key="certificates">
              <Form.List name="certificates">
                {(fields, { add, remove }) => (
                  <Space direction="vertical" style={{ width: "100%" }} size={16}>
                    {fields.map((field) => (
                      <Card
                        key={field.key}
                        size="small"
                        title={intl.formatMessage({ id: "user.create.certCardTitle" }, { n: field.name + 1 })}
                        extra={
                          <Button
                            danger
                            size="small"
                            icon={<DeleteOutlined />}
                            onClick={() => remove(field.name)}
                          >
                            {intl.formatMessage({ id: "user.common.delete" })}
                          </Button>
                        }
                      >
                        <Row gutter={12}>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.certInfo" })} name={[field.name, "certificateName"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.certNo" })} name={[field.name, "certificateNo"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.certInstitution" })} name={[field.name, "institutionName"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.certReceived" })} name={[field.name, "startTime"]}>
                              <Input placeholder={intl.formatMessage({ id: "user.create.datePlaceholder" })} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.certValidUntil" })} name={[field.name, "endTime"]}>
                              <Input placeholder={intl.formatMessage({ id: "user.create.datePlaceholder" })} />
                            </Form.Item>
                          </Col>
                          <Col xs={24} md={12}>
                            <Form.Item label={intl.formatMessage({ id: "user.create.certScore" })} name={[field.name, "certificateExamMark"]}>
                              <Input />
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}
                    <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>
                      {intl.formatMessage({ id: "user.create.certAdd" })}
                    </Button>
                  </Space>
                )}
              </Form.List>
            </TabPane>

          </Tabs>
        </Form>
      </Drawer>
    </LayoutWrapper>
  );
}

export default CreateUser;
