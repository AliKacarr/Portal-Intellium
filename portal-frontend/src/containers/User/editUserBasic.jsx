import React, { useCallback, useEffect, useState } from "react";
import { useIntl } from "react-intl";
import {
  Button,
  Upload,
  Form,
  Switch,
  message,
  Space,
  Input,
  Spin,
  Typography,
} from "antd";
import { diller } from "../../Data/languages";
import TimezoneSelect, { allTimezones } from "react-timezone-select";
import Select, { SelectOption } from "@iso/components/uielements/select";
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { generatePassword } from "../../components/PasswordGenerator/passwordGenerator";
import { buildApiUrl } from "../../Api/host";
import {
  ChangeUserImage,
  DeleteUserImage,
  getRoles,
  UserDetail,
  UserEdit,
} from "../../Api/UserApi";
import { GetAllCustomerAsBasic } from "../../Api/CustomerApi";

const Option = SelectOption;

const EditUserBasic = ({ user, setNameForBreadcrumb }) => {
  const intl = useIntl();
  const [form] = Form.useForm();

  ////////////////// state
  const [password, setPassword] = useState();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [roles, setRoles] = useState();
  const [isActive, setIsActive] = useState();
  const [fileList, setFileList] = useState([]);
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [pendingImageAction, setPendingImageAction] = useState("none");
  const [previewObjectUrl, setPreviewObjectUrl] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false); // şifre göster-gizle
  const [messageApi, contextHolder] = message.useMessage();
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  const getUserDetail = useCallback(async () => {
    try {
      const response = await UserDetail(user.id);
      const currentUser = response?.data?.data || user;

      setIsActive(currentUser.isActive);
      const currentTimezone =
        currentUser?.timezone ||
        currentUser?.account?.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTimezone(currentTimezone);
      if (currentUser.imageUrl) {
        getFileList(currentUser);
      } else {
        setFileList([]);
      }
    } catch (error) {
      setIsActive(user.isActive);
      if (user.imageUrl) {
        getFileList(user);
      } else {
        setFileList([]);
      }
    }
  }, [user]);

  const getFileList = (user) => {
    setFileList(() => [
      {
        id: user.id,
        uid: `existing-${user.id}`,
        name: user.imageUrl.split("/").pop() || `${user.name}-avatar`,
        url: buildApiUrl(user.imageUrl),
        status: "done",
      },
    ]);
  };

  const getCustomersList = useCallback(async () => {
    const response = await GetAllCustomerAsBasic();
    setCustomers(response.data.data);
  }, []);

  const getUserRoles = useCallback(async (a) => {
    const response = await getRoles(a);
    setRoles(response.data.data);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    getUserDetail();
    getUserRoles();
    getCustomersList();
  }, [user?.id, getUserDetail, getUserRoles, getCustomersList]);

  useEffect(() => {
    return () => {
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
      }
    };
  }, [previewObjectUrl]);

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error(intl.formatMessage({ id: "user.form.jpgPngOnly" }));
    }
    const isLt2M = file.size / 1024 / 1024 < 10;
    if (!isLt2M) {
      message.error(intl.formatMessage({ id: "user.form.maxFileSize10" }));
    }
    return isJpgOrPng && isLt2M ? false : Upload.LIST_IGNORE;
  };

  const onUploadChange = ({ file }) => {
    const localFile = file?.originFileObj || file;
    if (!(localFile instanceof File)) return;

    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
    }
    const nextPreviewUrl = URL.createObjectURL(localFile);
    setPreviewObjectUrl(nextPreviewUrl);
    setPendingImageFile(localFile);
    setPendingImageAction("replace");
    setFileList([
      {
        uid: file.uid || `new-${Date.now()}`,
        name: localFile.name,
        status: "done",
        url: nextPreviewUrl,
      },
    ]);
  };

  const createPassword = () => {
    const newPassword = generatePassword();
    form.setFieldsValue({ password: newPassword });
    setPassword(newPassword);
    setPasswordVisible(true);
  };

  // getCustomersList/getUserRoles üstte useCallback ile tanımlı

  //// Form Kontrol
  const validateEmail = (rule, value, callback) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value || emailRegex.test(value)) {
      callback(); // Geçerli
    } else {
      callback(intl.formatMessage({ id: "user.form.invalidEmail" }));
    }
  };

  const onDeleteImage = () => {
    if (previewObjectUrl) {
      URL.revokeObjectURL(previewObjectUrl);
      setPreviewObjectUrl(null);
    }
    setPendingImageFile(null);
    setPendingImageAction("delete");
    setFileList([]);
    message.info(intl.formatMessage({ id: "user.basic.deleteImageHint" }));
    return false;
  };


  const uploadButton = (
    <div>
      <PlusOutlined />
      <div
        style={{
          marginTop: 8,
        }}
      >
        {intl.formatMessage({ id: "user.form.photoUpload" })}
      </div>
    </div>
  );

  const getApiErrorText = (error) => {
    const d = error?.response?.data;
    if (d == null) return error?.message || intl.formatMessage({ id: "user.form.requestFailed" });
    if (typeof d === "string") return d;
    if (typeof d === "object") {
      if (d.message) return d.message;
      if (d.Message) return d.Message;
      if (d.title && d.errors) return `${d.title} (${JSON.stringify(d.errors)})`;
    }
    return intl.formatMessage({ id: "user.basic.editFailed" });
  };

  const onFinish = async (values) => {
    const tzValue = timezone?.value ?? timezone;
    const formDataUser = {
      id: Number(user.id),
      name: values.username,
      email: values.email,
      language: values.language,
      newPassword: values.password,
      userRoleId: Number(values.userRole),
      isActive: Boolean(isActive),
      customerId: Number(values.customer),
      timezone: tzValue,
    };
    setLoading(true);
    try {
      await UserEdit(formDataUser);
      let shouldNotifyImageUpdate = false;
      if (pendingImageAction === "replace" && pendingImageFile) {
        const formData = new FormData();
        formData.append("image", pendingImageFile);
        formData.append("userId", user.id);
        await ChangeUserImage(formData);
        shouldNotifyImageUpdate = true;
      } else if (pendingImageAction === "delete") {
        await DeleteUserImage(user.id);
        shouldNotifyImageUpdate = true;
      }

      setNameForBreadcrumb(values.username);
      setPendingImageAction("none");
      setPendingImageFile(null);
      if (previewObjectUrl) {
        URL.revokeObjectURL(previewObjectUrl);
        setPreviewObjectUrl(null);
      }
      await getUserDetail();
      if (shouldNotifyImageUpdate) {
        window.dispatchEvent(new Event("user-image-updated"));
      }
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "user.basic.photoUpdateSuccess" }),
      });
    } catch (e) {
      messageApi.open({
        type: "error",
        content: getApiErrorText(e),
      });
    }
    setLoading(false);
  };

  return (
    <div>
      {contextHolder}
      {user ? (
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
                  id="upload-input"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  listType="picture-card"
                  fileList={fileList}
                  maxCount={1}
                  beforeUpload={beforeUpload}
                  onChange={onUploadChange}
                  onRemove={onDeleteImage}
                  showUploadList={{ showPreviewIcon: false }}
                >
                  {fileList.length >= 1 ? null : uploadButton}
                </Upload>

                {fileList.length > 0 && (
                  <Space direction="vertical">
                    <Upload
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      showUploadList={false}
                      beforeUpload={beforeUpload}
                      onChange={onUploadChange}
                      maxCount={1}
                    >
                      <Button icon={<EditOutlined />}>{intl.formatMessage({ id: "user.common.change" })}</Button>
                    </Upload>
                    <Button icon={<DeleteOutlined />} onClick={onDeleteImage}>
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
            name="username"
            style={{ marginBottom: 18}}
            initialValue={user.name}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "user.form.required" }),
              },
            ]}
          >
            <Input placeholder={intl.formatMessage({ id: "user.form.fullName" })} />
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({ id: "user.form.email" })}
            style={{ marginBottom: 18 }}
            name="email" // Form.Item'ın name özelliğini ekledim
            initialValue={user.email}
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
            <Input name="e-mail" placeholder={intl.formatMessage({ id: "user.form.emailPlaceholder" })} />
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
                value={password}
                // onChange={(e) => setPassword(e.target.value)}
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
            initialValue={user.language}
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
            label="Kullanıcı Rolü"
            style={{ marginBottom: 18 }}
            name="userRole"
            initialValue={user.userRole.id}
            rules={[
              {
                required: true,
                message: "Bu alan boş bırakılamaz!",
              },
            ]}
          >
            <Select placeholder="Rol Seçiniz" style={{ width: "100%" }}>
              {roles &&
                roles.map((role, index) => (
                  <Option key={index} value={role.id}>
                    {role.roleName}
                  </Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            label={intl.formatMessage({ id: "user.form.company" })}
            name="customer"
            initialValue={user.customer.customerId}
            style={{ marginBottom: 18 }}
            rules={[
              {
                required: true,
                message: intl.formatMessage({ id: "user.form.required" }),
              },
            ]}
          >
            <Select placeholder={intl.formatMessage({ id: "user.form.selectCompany" })} style={{ width: "100%" }}>
              {customers.map((customer, index) => (
                <Option key={index} value={customer.customerId}>
                  {customer.customerName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({ id: "user.form.timezone" })}
            style={{ marginBottom: 18 }}
            initialValue={timezone}
          >
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
              style={{ width: "60px" }}
              checkedChildren={intl.formatMessage({ id: "user.common.active" })}
              unCheckedChildren={intl.formatMessage({ id: "user.common.inactive" })}
              checked={isActive}
            />
          </Form.Item>

          <Form.Item
            style={{ marginBottom: 18 }}
            wrapperCol={{
              offset: 10,
            }}
          >
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
            >
              {intl.formatMessage({ id: "user.common.save" })}
            </Button>
          </Form.Item>
        </Form>
      ) : (
        <Space size="large">
          <Spin size="large" />
        </Space>
      )}
    </div>
  );
};

export default EditUserBasic;
