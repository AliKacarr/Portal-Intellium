import React, { useState, useEffect, useMemo, useRef } from "react";
import { Checkbox, Modal, Form, Input, Select } from "antd";
import { useIntl } from "react-intl";
//Redux
import { useSelector, shallowEqual, useDispatch } from "react-redux";
import { createFolder, folderDocument } from "../redux/actionCreators/fileFoldersActionCreator";
//==== Redux ====

//Extra
import { v4 as uniqueId } from "uuid";
//==== Extra ====
//Icons
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { buildApiUrl } from "../../../Api/host";
import axios from "axios";
import { host } from "../../../Api/host";
import SecureLS from "secure-ls";
//==== Icons ====


const CreateFolderModal = ({ open, close, actionMessage, targetUserId }) => {
  const intl = useIntl();
  const { Item } = Form;
  const [form] = Form.useForm();
  const [isPublic, setIsPublic] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [shareUserOptions, setShareUserOptions] = useState([{ label: intl.formatMessage({ id: "documents.common.everyone" }), value: "all" }]);
  const isMounted = useRef(true);
  const pendingDocumentsRefreshRef = useRef(false);
  const { userFolders, currentFolder, currentFolderData } = useSelector(
    (state) => ({
      userFolders: state.filefolders.userFolders,
      currentFolder: state.filefolders.currentFolder,
      currentFolderData: state.filefolders.userFolders.find(
        (folder) => folder.Id === state.filefolders.currentFolder
      ),
    }),
    shallowEqual
  );
  const dispatch = useDispatch();

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
    form.setFieldValue("folder_privacy", "private");
    form.setFieldValue("share_list", ["all"]);
  }, [open, form]);

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
      } catch {
        if (isMounted.current) setShareUserOptions([{ label: intl.formatMessage({ id: "documents.common.everyone" }), value: "all" }]);
      }
    };
    fetchUsers();
  }, [open, isPublic, axiosAuth]);
  const checkFolderAlreadyExists = (name) => {
    const folderPresent = userFolders
      ?.filter((folder) => folder.name === name)
      .find(
        (folder) => folder.name === name && folder.parent === currentFolder
      );
    if (folderPresent) {
      return true;
    } else return false;
  };
  const handleOk = () => {
    if (!checkFolderAlreadyExists(form.getFieldValue("folder_name")?.trim())) {
      form.submit();
    } else {
      actionMessage(
        form.getFieldValue("folder_name") +
        ` ${intl.formatMessage({ id: "documents.errors.sameFolderName" })}`,
        "error"
      );
    }
  };
  const handleCancel = () => {
    setIsPublic(false);
    setIsCustom(false);
    close(false);
  };
  const checkPrivacy = () => {
    if (form.getFieldValue("folder_privacy") === "public") {
      setIsPublic(true);
    } else {
      form.setFieldValue("share_list", ["all"]);
      setIsPublic(false);
    }
  };
  const onFinish = async (values) => {
    const FolderName = values.folder_name.trim();
    const extension = "folder";

    if (checkFolderAlreadyExists(FolderName)) {
      actionMessage(
        `${FolderName} ${intl.formatMessage({ id: "documents.errors.sameFolderName" })}`,
        "error"
      );
      return;
    }

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
    const data = {
      UserId: userId,
      CustomerId: 0,
      Name: FolderName,
      Description: "",
      Position: "",
      Action: "Created",
      Color: isCustom ? values.folder_color : "rgb(37,112,182)",
      ShareWith: shareList.join(","),
      Privacy: "private",
      Type: extension,
      TipData: `data:folder;base64,${btoa("folder")}`,
      Path: currentFolderData ? `${currentFolderData.path}/${FolderName}` : `/docs/${FolderName}`,
      Parent: currentFolder && currentFolder !== "root" ? Number(currentFolder) : 0,
      IsActive: true,
    };

    try {
      await axiosAuth.post("/api/Document/add", data);
      if (!isMounted.current) return;
      actionMessage(`${FolderName} ${intl.formatMessage({ id: "documents.messages.createdSuccess" })}`, "success");
      pendingDocumentsRefreshRef.current = true;
      window.setTimeout(() => {
        if (isMounted.current) close(false);
      }, 0);
    } catch (error) {
      if (!isMounted.current) return;
      console.error("API Error:", error);
      actionMessage(intl.formatMessage({ id: "documents.errors.createFolderFailed" }), "error");
    }
  };

  return (
    <>
      <Modal
        className="documents__popup-modal"
        centered
        destroyOnClose
        title={intl.formatMessage({ id: "documents.actions.createNewFolder" })}
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
          name="new_folder"
          form={form}
          initialValues={{
            folder_color: "#000000",
            folder_privacy: "private",
            share_list: ["all"],
          }}
        >
          <Item
            label={intl.formatMessage({ id: "documents.labels.folderName" })}
            name={"folder_name"}
            rules={[
              { required: "true", message: intl.formatMessage({ id: "documents.validation.folderNameRequired" }) },
            ]}
          >
            <Input className="modal-input" placeholder={intl.formatMessage({ id: "documents.placeholders.enterFolderName" })} />
          </Item>
          {/* Paylaş/Gizlilik şimdilik kapalı */}
          <Item style={{ margin: !isCustom && "0" }}>
            <Checkbox
              checked={isCustom}
              onChange={(e) => {
                setIsCustom(e.target.checked);
                form.setFieldValue("folder_color", "#000000");
              }}
            >
              {intl.formatMessage({ id: "documents.actions.customize" })}
            </Checkbox>
          </Item>
          <Item
            label={intl.formatMessage({ id: "documents.labels.folderColor" })}
            style={{ display: isCustom ? "block" : "none", margin: "0" }}
            name={"folder_color"}
          >
            <input type="color" />
          </Item>
        </Form>
      </Modal>
    </>
  );
};

export default CreateFolderModal;
