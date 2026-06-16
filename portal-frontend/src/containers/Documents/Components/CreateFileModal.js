import React, { useEffect, useRef, useState, useMemo } from "react";
import { Checkbox, Modal, Form, Input, Select } from "antd";
import { useIntl } from "react-intl";
// Redux
import { useSelector, shallowEqual, useDispatch } from "react-redux";
import { createFile, createDocument } from "../redux/actionCreators/fileFoldersActionCreator";
// Extra
import { v4 as uniqueId } from "uuid";
// Icons
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { buildApiUrl } from "../../../Api/host";
import axios from "axios";
import { host } from "../../../Api/host";
import SecureLS from "secure-ls";

const CreateFileModal = ({ open, close, actionMessage, targetUserId }) => {
  const intl = useIntl();
  const { Item } = Form;
  const [form] = Form.useForm();
  const [isPublic, setIsPublic] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [shareUserOptions, setShareUserOptions] = useState([{ label: intl.formatMessage({ id: "documents.common.everyone" }), value: "all" }]);
  const pendingDocumentsRefreshRef = useRef(false);
  const { userFiles, currentFolder, currentFolderData } = useSelector(
    (state) => ({
      userFiles: state.filefolders.userFiles,
      currentFolder: state.filefolders.currentFolder,
      currentFolderData: state.filefolders.userFolders.find(
        (folder) => folder.Id === state.filefolders.currentFolder
      ),
    }),
    shallowEqual
  );
  const isMounted = useRef(true);

  const axiosAuth = useMemo(() => {
    let token;
    try {
      const ls = new SecureLS({ encodingType: "aes" });
      token = ls.get("accessToken");
    } catch {
      token = undefined;
    }
    token = token || localStorage.getItem("token") || localStorage.getItem("accessToken");
    return axios.create({
      baseURL: host,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!open || !isPublic) return;
      try {
        const res = await axiosAuth.get("/api/Users/getuserlist");
        const payload = res?.data;
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
        const opts = [
          { label: intl.formatMessage({ id: "documents.common.everyone" }), value: "all" },
          ...list
            .filter((u) => u?.id != null)
            .map((u) => ({
              label: u.name || u.fullName || u.email || `${intl.formatMessage({ id: "documents.common.user" })} #${u.id}`,
              value: String(u.id),
            })),
        ];
        if (isMounted.current) setShareUserOptions(opts);
      } catch (e) {
        // Yetki yoksa veya hata varsa sadece "Herkes" kalsın
        if (isMounted.current) setShareUserOptions([{ label: intl.formatMessage({ id: "documents.common.everyone" }), value: "all" }]);
      }
    };
    fetchUsers();
  }, [open, isPublic, axiosAuth]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    // Paylaş özelliği şimdilik gizli → hep private
    setIsPublic(false);
    setIsCustom(false);
    form.setFieldsValue({ file_privacy: "private", share_list: ["all"] });
  }, [open, form]);

  const dispatch = useDispatch();

  const checkFileAlreadyExists = (name, ext) => {
    if (!ext) {
      name = name + ".txt";
    }
    const filePresent = userFiles
      ?.filter((file) => file.parent === currentFolder)
      .find((file) => file.name === name);
    return !!filePresent;
  };

  const handleOk = () => {
    form.submit();
  };

  const handleCancel = () => {
    setIsPublic(false);
    setIsCustom(false);
    close(false);
  };

  const checkPrivacy = (value) => {
    if (value === "public") {
      setIsPublic(true);
    } else {
      form.setFieldsValue({ share_list: ["all"] });
      setIsPublic(false);
    }
  };

  const onFinish = (values) => {
    if (!values.file_name || values.file_name.trim() === "") {
      actionMessage(intl.formatMessage({ id: "documents.errors.fileNameEmpty" }), "error");
      return;
    }

    const extension = values.file_name.includes(".") ? values.file_name.split('.').pop() : "txt";
    const fileName = extension ? values.file_name : `${values.file_name}.txt`;
    const textData = "";


    if (!checkFileAlreadyExists(values.file_name.trim(), extension)) {
      let userId = Number(targetUserId);
      if (!Number.isFinite(userId) || userId <= 0) {
        try {
          const ls = new SecureLS({ encodingType: "aes" });
          userId = Number(ls.get("id"));
        } catch {
          userId = 0;
        }
      }

      const shareList = ["all"]; // paylaş kapalı
      const parent = currentFolder && currentFolder !== "root" ? Number(currentFolder) : 0;

      // Boş içerik: btoa('') = '' ve backend eski halde eşleşmiyordu; payload her zaman data:...;base64, biçiminde
      const b64 = btoa(
        unescape(encodeURIComponent(textData))
      );
      const tipData = `data:text/plain;base64,${b64}`;

      const data = {
        UserId: userId,
        CustomerId: 0,
        Name: fileName,
        Description: "",
        Position: "",
        Action: "Created",
        Color: isCustom ? values.file_color : "rgb(37,112,182)",
        ShareWith: shareList.join(","),
        Privacy: "private",
        Type: extension,
        TipData: tipData,
        Path: `/docs/${fileName}`,
        Parent: parent,
        IsActive: true,
      };

      axiosAuth
        .post("/api/Document/add", data)
        .then(() => {
          if (!isMounted.current) return;
          const fileLabel = values.file_name;
          actionMessage?.(`${fileLabel} ${intl.formatMessage({ id: "documents.messages.created" })}`, "success");
          pendingDocumentsRefreshRef.current = true;
          window.setTimeout(() => {
            if (isMounted.current) close(false);
          }, 0);
        })
        .catch((error) => {
          if (!isMounted.current) return;
          console.error(intl.formatMessage({ id: "documents.errors.generic" }), error);
          actionMessage(error?.message || intl.formatMessage({ id: "documents.errors.generic" }), "error");
        });
    } else {
      actionMessage(`${values.file_name} ${intl.formatMessage({ id: "documents.errors.sameFileName" })}`, "error");
    }
  };


  return (
    <>
      <Modal
        className="documents__popup-modal"
        centered
        destroyOnClose={true}
        title={intl.formatMessage({ id: "documents.actions.createNewFile" })}
        open={open}
        onOk={handleOk}
        okText={intl.formatMessage({ id: "documents.actions.create" })}
        onCancel={handleCancel}
        afterClose={() => {
          if (!pendingDocumentsRefreshRef.current) return;
          pendingDocumentsRefreshRef.current = false;
          window.dispatchEvent(new Event("documents:refresh"));
        }}
        okButtonProps={{ className: "modal-input" }}
        cancelButtonProps={{ className: "modal-input" }}
      >
        <Form
          onFinish={onFinish}
          layout="vertical"
          name="new_file"
          form={form}
          initialValues={{
            file_color: "#000000",
            file_privacy: "private",
            share_list: ["all"],
          }}
        >
          <Item
            label={intl.formatMessage({ id: "documents.labels.fileName" })}
            name={"file_name"}
            rules={[
              { required: true, message: intl.formatMessage({ id: "documents.validation.fileNameRequired" }) },
            ]}
          >
            <Input className="modal-input" placeholder={intl.formatMessage({ id: "documents.placeholders.enterFileName" })} />
          </Item>
          {/* Paylaş/Gizlilik şimdilik kapalı */}
          <Item style={{ margin: !isCustom && "0" }}>
            <Checkbox
              checked={isCustom}
              onChange={(e) => {
                setIsCustom(e.target.checked);
                form.setFieldsValue({ file_color: "#000000" });
              }}
            >
              {intl.formatMessage({ id: "documents.actions.customize" })}
            </Checkbox>
          </Item>
          <Item
            label={intl.formatMessage({ id: "documents.labels.fileColor" })}
            style={{ display: isCustom ? "block" : "none", margin: "0" }}
            name={"file_color"}
          >
            <input type="color" />
          </Item>
        </Form>
      </Modal>
    </>
  );
};

export default CreateFileModal;
