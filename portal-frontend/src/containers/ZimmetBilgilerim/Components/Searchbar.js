import React, { useState } from "react";
import { useIntl } from "react-intl";
//Antdesign
import { Space, Select, Input, Button } from "antd";
import "antd/dist/antd.css";
import "../customStyles.css";

//==== Antdesign ====
//Icons
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
//==== Icons ====

const Searchbar = ({
  search,
  setSearch,
  setSelectedCategory,
  setSelectedStatus,
  // ✅ YENİ: Dinamik veriler props olarak geliyor
  categoriesOptions, 
  statusOptions,
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
          placeholder={intl.formatMessage({ id: "zimmetBilgilerim.search.placeholder" })}
          value={search}
        />
        <Button
          onClick={() => setFilterActive(!filterActivate)}
          icon={<FilterOutlined />}
          className={
            filterActivate ? "filter-button-active" : "filter-button-disabled"
          }
          style={{ borderRadius: filterActivate ? "2rem 0 0 2rem" : "2rem" }}
        >
          {intl.formatMessage({ id: "zimmetBilgilerim.search.filter" })}
        </Button>
        
        {/* KATEGORİ SEÇİMİ */}
        <Select
          prefix={<SearchOutlined />}
          showSearch
          style={{
            width: !filterActivate ? "0px" : "25%",
            display: !filterActivate ? "none" : "inline-block",
          }}
          placeholder="Kategoriler"
          optionFilterProp="children"
          filterOption={(input, option) =>
            (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
          }
          filterSort={(optionA, optionB) =>
            (optionA?.label ?? "")
              .toLowerCase()
              .localeCompare((optionB?.label ?? "").toLowerCase())
          }
          options={categoriesOptions} // ✅ Dinamik Veri
          allowClear
          onChange={(value) => {
            setSelectedCategory(value);
          }}
        />

        {/* STATÜ SEÇİMİ */}
        <Select
          style={{
            width: !filterActivate ? "0px" : "25%",
            display: !filterActivate ? "none" : "inline-block",
          }}
          placeholder={intl.formatMessage({ id: "zimmetBilgilerim.search.status" })}
          className="assets__bordered-select"
          optionFilterProp="children"
          filterSort={(optionA, optionB) =>
            (optionA?.label ?? "")
              .toLowerCase()
              .localeCompare((optionB?.label ?? "").toLowerCase())
          }
          options={statusOptions} // ✅ Dinamik Veri
          allowClear
          onChange={(value) => {
            setSelectedStatus(value);
          }}
        />
      </Space.Compact>
    </Space>
  );
};

export default Searchbar;