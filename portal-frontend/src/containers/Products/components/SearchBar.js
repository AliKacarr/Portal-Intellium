import React, { useState } from "react";
import { Space, Select, Input, Button } from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { useIntl } from "react-intl";

const SearchBar = ({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  categoriesOptions = [],
  statusOptions = [],
  placeholder,
}) => {
  const intl = useIntl();
  const [filterActivate, setFilterActive] = useState(false);
  const searchPh = placeholder ?? intl.formatMessage({ id: "products.searchPlaceholder" });

  return (
    <Space style={{ width: "100%", marginBottom: 15 }} direction="vertical">
      <Space.Compact style={{ width: "100%", display: "flex" }} size="middle">
        <Input
          placeholder={searchPh}
          onChange={(e) => setSearch(e.target.value)}
          value={search}
          prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
          style={{
            width: !filterActivate ? "100%" : "50%",
            borderRadius: "20px",
            transition: "all 0.3s ease",
          }}
        />

        <Button
          onClick={() => setFilterActive(!filterActivate)}
          icon={<FilterOutlined />}
          type={filterActivate ? "primary" : "default"}
          style={{
            borderRadius: filterActivate ? "20px 0 0 20px" : "20px",
            transition: "all 0.3s ease",
            backgroundColor: filterActivate ? "#722ed1" : "white",
            borderColor: filterActivate ? "#722ed1" : "#d9d9d9",
            color: filterActivate ? "white" : "rgba(0, 0, 0, 0.85)",
          }}
        >
          {intl.formatMessage({ id: "products.filter" })}
        </Button>

        <Select
          showSearch
          style={{
            width: !filterActivate ? 0 : "25%",
            opacity: !filterActivate ? 0 : 1,
            transition: "all 0.3s ease",
            overflow: "hidden",
          }}
          placeholder={intl.formatMessage({ id: "products.selectCategory" })}
          options={categoriesOptions}
          allowClear
          value={selectedCategory || undefined}
          onChange={(value) => setSelectedCategory(value || "")}
          optionFilterProp="label"
        />

        <Select
          style={{
            width: !filterActivate ? 0 : "25%",
            opacity: !filterActivate ? 0 : 1,
            transition: "all 0.3s ease",
            overflow: "hidden",
            borderRadius: "0 20px 20px 0",
          }}
          placeholder={intl.formatMessage({ id: "products.selectStatus" })}
          options={statusOptions}
          allowClear
          value={selectedStatus || undefined}
          onChange={(value) => setSelectedStatus(value || "")}
          optionFilterProp="label"
        />
      </Space.Compact>
    </Space>
  );
};

export default SearchBar;
