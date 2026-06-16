import React, { useState } from "react";
import { useIntl } from "react-intl";
import { Space, Select, Input, Button } from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
import "antd/dist/antd.css";
import "../customStyles.css";

/**
 * Dinamik filtre barı
 * props:
 * - search, setSearch
 * - selectedCategory, setSelectedCategory
 * - selectedStatus, setSelectedStatus
 * - categoriesOptions: [{label,value}]
 * - statusOptions: [{label,value}]
 */
const Searchbar = ({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
  categoriesOptions = [],
  statusOptions = [],
}) => {
  const intl = useIntl();
  const [filterActivate, setFilterActive] = useState(false);

  return (
    <Space style={{ width: "100%" }} direction="vertical">
      <Space.Compact className="assets__searchbar-container" size="middle">
        <Input
          onChange={(e) => setSearch(e.target.value)}
          prefix={<SearchOutlined />}
          style={{
            width: !filterActivate ? "100%" : "50%",
            marginRight: "2rem",
            borderRadius: "2rem",
          }}
          bordered
          placeholder={intl.formatMessage({ id: "zimmetBilgileri.search.placeholder" })}
          value={search}
        />
        <Button
          onClick={() => setFilterActive(!filterActivate)}
          icon={<FilterOutlined />}
          className={filterActivate ? "filter-button-active" : "filter-button-disabled"}
          style={{ borderRadius: filterActivate ? "2rem 0 0 2rem" : "2rem" }}
        >
          {intl.formatMessage({ id: "zimmetBilgileri.search.filter" })}
        </Button>

        {/* Kategoriler (dinamik) */}
        <Select
          showSearch
          style={{
            width: !filterActivate ? 0 : "25%",
            display: !filterActivate ? "none" : "inline-block",
          }}
          placeholder="Kategoriler"
          options={categoriesOptions}
          allowClear
          value={selectedCategory || undefined}
          onChange={(value) => setSelectedCategory(value || "")}
          optionFilterProp="label"
          className="non-border"
        />

        {/* Statü (dinamik) */}
        <Select
          style={{
            width: !filterActivate ? 0 : "25%",
            display: !filterActivate ? "none" : "inline-block",
          }}
          placeholder={intl.formatMessage({ id: "zimmetBilgileri.search.status" })}
          options={statusOptions}
          allowClear
          value={selectedStatus || undefined}
          onChange={(value) => setSelectedStatus(value || "")}
          optionFilterProp="label"
          className="assets__bordered-select"
        />
      </Space.Compact>
    </Space>
  );
};

export default Searchbar;
