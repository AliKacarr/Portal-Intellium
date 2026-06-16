import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import Box from "@iso/components/utility/box";
import LayoutWrapper from "@iso/components/utility/layoutWrapper.js";
import IntlMessages from "@iso/components/utility/intlMessages";
import PageHeader from "@iso/components/utility/pageHeader";
import { AddCustomer } from "../../../Api/CustomerApi";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Breadcrumb,
  Col,
  Row,
  message,
  Select,
  InputNumber,
  Space,
  Switch,
} from "antd";
import { ulke } from "../../../Data/ulkeData";
import { SyncOutlined } from "@ant-design/icons";
import { generatePassword } from "../../../components/PasswordGenerator/passwordGenerator";

const { TextArea } = Input;
const { Option } = Select;

export default function CreateCustomer() {
  const intl = useIntl();
  const [licenceKey, setlicenceKey] = useState();

  /// Lisans key oluştur
  const createLicenceKey = () => {
    updateCustomerData("licenceKey", generatePassword());
    setlicenceKey(generatePassword());
  };

  const [customerData, setCustomerData] = useState(null);
  const [messageApi, contextHolder] = message.useMessage();
  const { RangePicker } = DatePicker;

  const updateCustomerData = (inputName, inputValue) => {
    setCustomerData((prevCustomerData) => ({
      ...prevCustomerData,
      [inputName]: inputValue,
    }));
  };

  // initial values
  useEffect(() => {
    updateCustomerData("postalCode", "34000");
    updateCustomerData("country", "Turkiye");
    updateCustomerData("city", "Istanbul");
    updateCustomerData("isActive", true);
  }, []);

  const handleCreateCustomer = async () => {
    try {
      await AddCustomer(customerData);
      messageApi.success(intl.formatMessage({ id: "customer.message.createSuccess" }));
    } catch (error) {
      messageApi.error(intl.formatMessage({ id: "customer.message.createError" }));
    }
  };

  ///// sıralı ülke
  const siraliUlke = ulke.sort((a, b) => a.ad.localeCompare(b.ad));

  return (
    <LayoutWrapper>
      {contextHolder}
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "customer.common.customer" })}</Breadcrumb.Item>
          <Breadcrumb.Item>{intl.formatMessage({ id: "customer.common.customerCreate" })}</Breadcrumb.Item>
        </Breadcrumb>

        <PageHeader>
          <IntlMessages id="customer.common.customerCreate" />
        </PageHeader>

        <Form
          labelCol={{
            xs: { span: 6 },
            sm: { span: 8 },
            lg: { span: 8 },
          }}
          wrapperCol={{
            xs: { span: 24 },
            sm: { span: 24 },
            lg: { span: 24 },
          }}
          layout="horizontal"
          style={{ marginTop: 50, marginRight: 50 }}
          initialValues={{
            country: "Turkiye", // Default country
            city: "Istanbul", // Default city
            postalCode: 34000, // Posta kodu için başlangıç değeri
          }}
        >
          <Row gutter={[16, 16]}>
            <Col sm={24} md={24} lg={12}>
              <Form.Item
                label={intl.formatMessage({ id: "customer.form.customerName" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input
                  onChange={(e) => {
                    updateCustomerData("customerName", e.target.value);
                  }}
                />
              </Form.Item>
              <Form.Item
                label={intl.formatMessage({ id: "customer.form.shortName" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input
                  onChange={(e) => {
                    updateCustomerData("customerShortName", e.target.value);
                  }}
                />
              </Form.Item>
              <Form.Item
                label={intl.formatMessage({ id: "customer.form.address" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <TextArea
                  rows={3}
                  maxLength={300}
                  onChange={(e) => {
                    updateCustomerData("address", e.target.value);
                  }}
                />
              </Form.Item>

              <Form.Item
                name="country"
                label={intl.formatMessage({ id: "customer.form.country" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Select
                  defaultValue="Turkiye"
                  style={{
                    width: "100%",
                  }}
                  onChange={(e) => {
                    updateCustomerData("country", e);
                  }}
                >
                  {siraliUlke.map((ulkeObj, index) => (
                    <Option key={index} value={ulkeObj.ad}>
                      {ulkeObj.ad}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="city"
                label={intl.formatMessage({ id: "customer.form.city" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input
                  onChange={(e) => {
                    updateCustomerData("city", e.target.value);
                  }}
                />
              </Form.Item>

              <Form.Item label={intl.formatMessage({ id: "customer.form.postalCode" })} name="postalCode">
                <InputNumber
                  style={{ width: "30%" }}
                  defaultValue={34000}
                  onChange={(e) => {
                    e && updateCustomerData("postalCode", e.toString());
                  }}
                />
              </Form.Item>

              <Form.Item
                label={intl.formatMessage({ id: "customer.form.authorizedFullName" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input
                  onChange={(e) => {
                    updateCustomerData(
                      "authorizedPersonFullName",
                      e.target.value
                    );
                  }}
                />
              </Form.Item>

              <Form.Item
                name="authorizedPersonMail"
                label={intl.formatMessage({ id: "customer.form.authorizedEmail" })}
                rules={[
                  {
                    type: "email",
                    message: intl.formatMessage({ id: "customer.validation.emailInvalid" }),
                  },
                  {
                    required: true,
                    message: intl.formatMessage({ id: "customer.validation.emailRequired" }),
                  },
                ]}
              >
                <Input
                  onChange={(e) => {
                    updateCustomerData("authorizedPersonMail", e.target.value);
                  }}
                />
              </Form.Item>
              <Form.Item
                label={intl.formatMessage({ id: "customer.form.authorizedRole" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input
                  onChange={(e) => {
                    updateCustomerData("authorizedPersonTitle", e.target.value);
                  }}
                />
              </Form.Item>

              <Form.Item
                name="authorizedPersonPhone"
                label={intl.formatMessage({ id: "customer.form.authorizedPhone" })}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({ id: "customer.validation.phoneRequired" }),
                  },
                ]}
              >
                <PhoneInput
                  placeholder={intl.formatMessage({ id: "customer.placeholder.authorizedPhone" })}
                  defaultCountry="TR"
                  international
                  onChange={(value) =>
                    updateCustomerData("authorizedPersonPhone", value)
                  }
                />
              </Form.Item>
            </Col>
            <Col sm={24} md={24} lg={12}>
              <Form.Item label={intl.formatMessage({ id: "customer.form.bankInfo" })}>
                <Input
                  onChange={(e) => {
                    updateCustomerData("bankName", e.target.value);
                  }}
                />
              </Form.Item>
              <Form.Item label={intl.formatMessage({ id: "customer.form.bankAccountNo" })}>
                <Input
                  placeholder={intl.formatMessage({ id: "customer.placeholder.iban" })}
                  minLength={26}
                  maxLength={26}
                  onChange={(e) => {
                    updateCustomerData("bankAccountNumber", e.target.value);
                  }}
                />
              </Form.Item>
              <Form.Item label={intl.formatMessage({ id: "customer.form.website" })}>
                <Input
                  onChange={(e) => {
                    updateCustomerData("website", e.target.value);
                  }}
                />
              </Form.Item>

              <Form.Item
                name="phone"
                label={intl.formatMessage({ id: "customer.form.phone" })}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({ id: "customer.validation.phoneRequired" }),
                  },
                ]}
              >
                <PhoneInput
                  placeholder={intl.formatMessage({ id: "customer.placeholder.phone" })}
                  defaultCountry="TR"
                  international
                  onChange={(value) => updateCustomerData("phone", value)}
                />
              </Form.Item>

              <Form.Item
                label={intl.formatMessage({ id: "customer.form.taxDepartment" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input
                  onChange={(e) => {
                    updateCustomerData("taxDepartment", e.target.value);
                  }}
                />
              </Form.Item>
              <Form.Item
                label={intl.formatMessage({ id: "customer.form.taxNo" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input
                  onChange={(e) => {
                    updateCustomerData("taxIdNumber", e.target.value);
                  }}
                />
              </Form.Item>
              <Form.Item
                label={intl.formatMessage({ id: "customer.form.licenseType" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input
                  onChange={(e) => {
                    updateCustomerData("licenceType", e.target.value);
                  }}
                />
              </Form.Item>

              <Form.Item
                label={intl.formatMessage({ id: "customer.form.licenseKey" })}
                name="licenceKey"
                style={{ marginBottom: 18 }}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({ id: "customer.validation.requiredField" }),
                  },
                ]}
              >
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    onChange={(e) => {
                      updateCustomerData("licenceKey", e.target.value);
                    }}
                    value={licenceKey}
                  />

                  <Button onClick={() => createLicenceKey()}>
                    <SyncOutlined />
                  </Button>
                </Space.Compact>
              </Form.Item>

              <Form.Item label={intl.formatMessage({ id: "customer.form.licenseDate" })}>
                <RangePicker
                  style={{ width: "100%" }}
                  onChange={(e) => {
                    updateCustomerData("licenceStartDate", e[0]._d);
                    updateCustomerData("licenceFinishDate", e[1]._d);
                  }}
                />
              </Form.Item>

              <Form.Item label={intl.formatMessage({ id: "customer.form.customerStatus" })}>
                <Switch
                  onChange={(e) => updateCustomerData("isActive", e)}
                  style={{ width: 70 }}
                  checkedChildren={intl.formatMessage({ id: "customer.status.active" })}
                  unCheckedChildren={intl.formatMessage({ id: "customer.status.passive" })}
                  defaultChecked
                />
              </Form.Item>

              <Form.Item>
                <div style={{ width: "100%", textAlign: "right" }}>
                  <Button type="primary" onClick={handleCreateCustomer}>
                    <IntlMessages id="customer.common.customerCreate" />
                  </Button>
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Box>
    </LayoutWrapper>
  );
}
