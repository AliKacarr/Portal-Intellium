import React, { useState, useEffect, useRef } from "react";
import { Link, useHistory } from "react-router-dom";
import { useIntl } from "react-intl";
import LayoutWrapper from "@iso/components/utility/layoutWrapper.js";
import {
  ProfileOutlined,
  PlusCircleOutlined,
  SearchOutlined,
  EditOutlined,
} from "@ant-design/icons";
import Box from "@iso/components/utility/box";
import { Button, Breadcrumb, Table, Space, Tag, Input } from "antd";
import IntlMessages from "@iso/components/utility/intlMessages";
import PageHeader from "@iso/components/utility/pageHeader";
import { GetAllCustomerAsRaw } from "../../../Api/CustomerApi";
import Highlighter from "react-highlight-words";
import parsePhoneNumber from "libphonenumber-js";

const { Column } = Table;

export default function CustomersList() {
  const intl = useIntl();
  const [customersData, setCustomersData] = useState([]);
  const history = useHistory();
  const handleRowClick = (row) => {
    history.push(`/dashboard/customer/${row}`);
  };

  const handleEditClick = (row) => {
    history.push(`/dashboard/editCustomer/${row}`);
  };

  const formatPhoneNumber = (number) => {
    try {
      const formattedNumber = parsePhoneNumber(number)
        .formatInternational()
        .replace(/(\+\d+)\s(\d+)\s(\d+)/, "$1 ($2) $3");

      return formattedNumber;
    } catch (error) {
      return number;
    }
  };
  const getAllCustomers = async () => {
    try {
      const response = await GetAllCustomerAsRaw();
      setCustomersData(response.data.data);
    } catch (error) {}
  };

  useEffect(() => {
    getAllCustomers();
  }, []);

  // phone number format
  /*
  const phoneNumber = parsePhoneNumber('+12133734253')

  phoneNumber.formatInternational() === '+1 213 373 4253'
  phoneNumber.formatNational() === '(213) 373-4253'
*/

  // Filter Search
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div
        style={{
          padding: 8,
        }}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <Input
          ref={searchInput}
          placeholder={intl.formatMessage({ id: "customer.search.inputPlaceholder" })}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
          style={{
            marginBottom: 8,
            display: "block",
          }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{
              width: 90,
            }}
          >
            {intl.formatMessage({ id: "customer.search.search" })}
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{
              width: 90,
            }}
          >
            {intl.formatMessage({ id: "customer.search.reset" })}
          </Button>

          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            {intl.formatMessage({ id: "customer.search.close" })}
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => (
      <SearchOutlined
        style={{
          color: filtered ? "#1677ff" : undefined,
        }}
      />
    ),
    onFilter: (value, record) =>
      record[dataIndex].toString().toLowerCase().includes(value.toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{
            backgroundColor: "#ffc069",
            padding: 0,
          }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ""}
        />
      ) : (
        text
      ),
  });

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Space
          direction="horizontal"
          style={{
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
            <Breadcrumb.Item>{intl.formatMessage({ id: "customer.common.customer" })}</Breadcrumb.Item>
            <Breadcrumb.Item>{intl.formatMessage({ id: "customer.common.customerList" })}</Breadcrumb.Item>
          </Breadcrumb>

          <Link to="createCustomer">
            <Button
              className="custom-button"
              type="primary"
              icon={<PlusCircleOutlined style={{ fontSize: "15px" }} />}
            >
              <IntlMessages id="customer.common.customerCreate" />
            </Button>
          </Link>
        </Space>
        <PageHeader>
          <IntlMessages id="customer.common.customerList" />
        </PageHeader>

        <Table
          dataSource={customersData}
          style={{ margin: "10px 20px" }}
          rowKey="customerId"
          size="default"
          scroll={{
            x: 900,
          }}
        >
          <Column
            title="ID"
            dataIndex="customerId"
            key="customerId"
            sorter={(a, b) => a.customerId - b.customerId}
            width={50}
          />
          <Column
            title={intl.formatMessage({ id: "customer.form.customerShortName" })}
            dataIndex="customerShortName"
            key="customerShortName"
            width={220}
            defaultSortOrder="ascend"
            sorter={(a, b) =>
              a.customerShortName.localeCompare(b.customerShortName)
            }
            filters={customersData.map((customer) => ({
              text: customer.customerShortName,
              value: customer.customerShortName,
            }))}
            onFilter={(value, record) =>
              record.customerShortName.includes(value)
            }
          />

          <Column
            title={intl.formatMessage({ id: "customer.table.authorizedPerson" })}
            dataIndex="authorizedPersonFullName"
            key="authorizedPersonFullName"
            width={220}
            {...getColumnSearchProps("authorizedPersonFullName")}
          />

          <Column
            title={intl.formatMessage({ id: "customer.table.authorizedPhone" })}
            dataIndex="authorizedPersonPhone"
            key="authorizedPersonPhone"
            width={200}
            render={(number) => <span>{formatPhoneNumber(number)}</span>}
          />
          <Column
            width={150}
            align="center"
            title={intl.formatMessage({ id: "customer.table.customerStatus" })}
            dataIndex="isActive"
            key="isActive"
            sorter={(a, b) => a.isActive - b.isActive}
            render={(text, record) => (
              <Space>
                {record.isActive ? (
                  <Tag color="#87d068">{intl.formatMessage({ id: "customer.status.active" })}</Tag>
                ) : (
                  <Tag color="#f50">{intl.formatMessage({ id: "customer.status.passive" })}</Tag>
                )}
              </Space>
            )}
          />
          <Column
            key="action"
            align="center"
            width={150}
            render={(text, record) => (
              <Space>
                <Button
                  type="text"
                  onClick={() => handleRowClick(record.customerId)}
                >
                  <ProfileOutlined style={{ fontSize: 18 }} />
                </Button>
                <Space>
                  <Button
                    type="text"
                    onClick={() => handleEditClick(record.customerId)}
                  >
                    <EditOutlined />
                  </Button>
                </Space>
              </Space>
            )}
          />
        </Table>
      </Box>
    </LayoutWrapper>
  );
}
