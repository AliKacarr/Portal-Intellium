import React from "react";
import { VCardWidgetWrapper } from "./vCardWidget.styles";
import { Avatar, Tag } from "antd";
import { buildApiUrl } from "../../../Api/host";
import { SafetyCertificateOutlined } from "@ant-design/icons";

export default function ({ src, name, title, description, style, id, size }) {
  /// Badge color
  function getColorById(id) {
    // Renkler dizisi
    const customColors = [
      "#6895D2",
      "#A4CE95",
      "#D04848",
      "#F3B95F",
      "#FDE767",
    ];

    // ID'ye göre indeks hesaplanması
    const index = id % customColors.length;

    // ID'ye göre belirlenen renk döndürülmesi
    return customColors[index];
  }

  return (
    <VCardWidgetWrapper className="isoVCardWidgetWrapper" style={style}>
      <div className="isoVCardImage">
        {src ? (
          <Avatar
            size={size}
            src={buildApiUrl(src)}
          />
        ) : (
          <Avatar
            size={size}
            style={{
              backgroundColor: getColorById(id), // Fonksiyonun döndürdüğü değer
            }}
          >
            {name.charAt(0).toUpperCase()}
          </Avatar>
        )}
      </div>

      <div className="isoVCardBody">
        <h3 className="isoName">{name}</h3>
        <span className="isoDesgTitle">{title}</span>

        <Tag
          style={{
            border: "none",
            borderRadius: "5px",
            background: "linear-gradient(125deg, #4e54c8,  #8f94fb)",
            margin: "25px 0px",
            padding: "3px 8px",
          }}
          icon={<SafetyCertificateOutlined />}
          color="#55acee"
        >
          {description}
        </Tag>
      </div>
    </VCardWidgetWrapper>
  );
}
