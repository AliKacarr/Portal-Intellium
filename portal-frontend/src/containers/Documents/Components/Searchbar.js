import React from "react";
import { useIntl } from "react-intl";
//Ant design
import { Space, Input, Button } from "antd";
import "antd/dist/antd.css";
import "../customStyles.css";
//==== Ant design ====
//Icons
import {
  SearchOutlined,
  FolderOutlined,
  FileOutlined,
  UploadOutlined,
} from "@ant-design/icons";
//==== Icons ====

const Searchbar = ({
  openCreateFolderModal,
  openCreateFileModal,
  openUploadFileModal,
  search,
  setSearch,
  rightExtra,
}) => {
  const intl = useIntl();
  return (
    <Space style={{ width: "100%" }} direction="vertical">
      <div
        className="documents__searchbar-container"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          width: "100%",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 360px", minWidth: 260 }}>
          <Input
            prefix={<SearchOutlined />}
            style={{ width: "100%", borderRadius: "2rem" }}
            onChange={(e) => setSearch(e.target.value)}
            value={search}
            bordered
            placeholder={intl.formatMessage({ id: "documents.search.placeholder" })}
            allowClear
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flex: "0 0 auto",
            flexWrap: "wrap",
            justifyContent: "flex-end",
          }}
        >
          {rightExtra}
          <Button
            className="btn-with-icon-spacing"
            onClick={() => openCreateFolderModal(true)}
            icon={<FolderOutlined />}
            style={{ borderRadius: "2rem" }}
          >
            {intl.formatMessage({ id: "documents.actions.newFolder" })}
          </Button>
          <Button
            className="btn-with-icon-spacing"
            onClick={() => openCreateFileModal(true)}
            icon={<FileOutlined />}
            style={{ borderRadius: "2rem" }}
          >
            {intl.formatMessage({ id: "documents.actions.newFile" })}
          </Button>
          <Button
            className="btn-with-icon-spacing"
            type="primary"
            onClick={() => openUploadFileModal(true)}
            icon={<UploadOutlined />}
            style={{ borderRadius: "2rem" }}
          >
            {intl.formatMessage({ id: "documents.actions.uploadFile" })}
          </Button>
        </div>
      </div>
    </Space>
  );
};

export default Searchbar;
