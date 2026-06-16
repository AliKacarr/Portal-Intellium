import React, { useState } from "react";
import { useIntl } from "react-intl";
//Ant design
import { Space, Select, Input, Button } from "antd";
import "antd/dist/antd.css";
//Icons
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";

const Searchbar = ({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  // Props ile gelen dinamik seçenekler
  categoriesOptions = [],
  statusOptions = [] 
}) => {
  const intl = useIntl();
  const [filterActivate, setFilterActive] = useState(false);

  return (
    <Space style={{ width: "100%" }} direction="vertical">
      <Space.Compact className="assets__searchbar-container" size="middle" style={{ display: 'flex' }}>
        <Input
          onChange={(e) => setSearch(e.target.value)}
          prefix={<SearchOutlined />}
          style={{
            width: !filterActivate ? "100%" : "50%",
            marginRight: "1rem",
            borderRadius: "2rem",
          }}
          bordered
          placeholder={intl.formatMessage({ id: "confirmationForm.search.placeholder" })}
          value={search}
        />
        
        <Button
          onClick={() => setFilterActive(!filterActivate)}
          icon={<FilterOutlined />}
          type={filterActivate ? "primary" : "default"}
          style={{ borderRadius: filterActivate ? "2rem 0 0 2rem" : "2rem" }}
        >
          {intl.formatMessage({ id: "confirmationForm.search.filter" })}
        </Button>

        {/* --- İZİN TÜRÜ --- */}
        <Select
          showSearch
          style={{
            width: !filterActivate ? "0px" : "25%",
            display: !filterActivate ? "none" : "inline-block",
            opacity: !filterActivate ? 0 : 1,
            transition: "all 0.3s"
          }}
          placeholder={intl.formatMessage({ id: "confirmationForm.search.permissionType" })}
          optionFilterProp="label" // Arama label üzerinden yapılsın
          // Confirmation.js'den gelen seçenekleri kullan
          options={categoriesOptions}
          allowClear
          value={selectedCategory}
          onChange={(value) => setSelectedCategory(value)}
        />

        {/* --- STATÜ --- */}
        <Select
          style={{
            width: !filterActivate ? "0px" : "25%",
            display: !filterActivate ? "none" : "inline-block",
            opacity: !filterActivate ? 0 : 1,
            transition: "all 0.3s"
          }}
          placeholder={intl.formatMessage({ id: "confirmationForm.search.status" })}
          options={statusOptions}
          allowClear
          value={selectedStatus}
          onChange={(value) => setSelectedStatus(value)}
        />
      </Space.Compact>
    </Space>
  );
};

export default Searchbar;