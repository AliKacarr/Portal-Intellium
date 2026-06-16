import React, { useState, useEffect } from "react";
import { useIntl } from "react-intl";
import Box from "@iso/components/utility/box";
import LayoutWrapper from "@iso/components/utility/layoutWrapper.js";
import IntlMessages from "@iso/components/utility/intlMessages";
import PageHeader from "@iso/components/utility/pageHeader";
import { GetCustomerById, CustomerEdit } from "../../../Api/CustomerApi";
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
  Space,
  Switch,
  Spin,
} from "antd";
import { ulke } from "../../../Data/ulkeData";
import { SyncOutlined } from "@ant-design/icons";
import { generatePassword } from "../../../components/PasswordGenerator/passwordGenerator";
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import moment from "moment";
import { Link } from "react-router-dom";

const { TextArea } = Input;
const { Option } = Select;

export default function EditCustomer() {
  const intl = useIntl();
  /// Lisans key oluştur
  const [licenceKey, setlicenceKey] = useState();

  const createLicenceKey = () => {
    setlicenceKey(generatePassword());
  };

  const [messageApi, contextHolder] = message.useMessage();
  const { RangePicker } = DatePicker;
  const [customer, setCustomer] = useState(null);
  const [isActive, setIsActive] = useState();

  const { id } = useParams();

  ///// use state
  const getCustomerDetail = async (id) => {
    const response = await GetCustomerById(id);
    setCustomer(response.data.data);
    setlicenceKey(response.data.data.licenceKey);
    setIsActive(response.data.data.isActive);
  };

  useEffect(() => {
    getCustomerDetail(id);
  }, [id]);

  /////////on finish
  const onFinish = async (values) => {
    const formDataCustomer = {
      customerId: id,
      licenceStartDate: values.licenceDate[0]._d,
      licenceFinishDate: values.licenceDate[1]._d,
      licenceKey,
      customerName: values.customerName,
      customerShortName: values.customerShortName,
      address: values.address,
      country: values.country,
      city: values.city,
      postalCode: values.postalCode,
      authorizedPersonFullName: values.authorizedPersonFullName,
      authorizedPersonMail: values.authorizedPersonMail,
      authorizedPersonTitle: values.authorizedPersonTitle,
      authorizedPersonPhone: values.authorizedPersonPhone,
      bankName: values.bankName,
      bankAccountNumber: values.bankAccountNumber,
      website: values.website,
      phone: values.phone,
      taxDepartment: values.taxDepartment,
      taxIdNumber: values.taxIdNumber,
      licenceType: values.licenceType,
      isActive,
    };

    try {
      await CustomerEdit(formDataCustomer);
      messageApi.open({
        type: "success",
        content: intl.formatMessage({ id: "customer.message.editSuccess" }),
      });
    } catch (e) {
      messageApi.open({
        type: "error",
        content: intl.formatMessage({ id: "customer.message.editError" }),
      });
    }
  };

  ///// sıralı ülke
  const siraliUlke = ulke.sort((a, b) => a.ad.localeCompare(b.ad));

  return customer ? (
    <LayoutWrapper>
      {contextHolder}
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "customer.common.customer" })}</Breadcrumb.Item>
          <Breadcrumb.Item>{intl.formatMessage({ id: "customer.common.customerEdit" })}</Breadcrumb.Item>
        </Breadcrumb>

        <PageHeader>
          <IntlMessages id="customer.common.customerEdit" />
        </PageHeader>
        <div
          className="isoProjectTableBtn"
          style={{ width: "100%", textAlign: "right", marginTop: "-70px" }}
        >
          <Link to={`/dashboard/customerList`}>
            <Button type="primary" className="mateAddProjectBtn">
              <IntlMessages id="customer.common.customerList" />
            </Button>
          </Link>
        </div>
        <Form
          onFinish={onFinish}
          initialValues={customer}
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
        >
          <Row gutter={[16, 16]}>
            <Col sm={24} md={24} lg={12}>
              <Form.Item
                name="customerName"
                label={intl.formatMessage({ id: "customer.form.customerName" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="customerShortName"
                label={intl.formatMessage({ id: "customer.form.shortName" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="address"
                label={intl.formatMessage({ id: "customer.form.address" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <TextArea rows={3} maxLength={300} />
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
                  style={{
                    width: "100%",
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
                <Input />
              </Form.Item>

              <Form.Item label={intl.formatMessage({ id: "customer.form.postalCode" })} name="postalCode">
                <Input style={{ width: "30%" }} />
              </Form.Item>

              <Form.Item
                name="authorizedPersonFullName"
                label={intl.formatMessage({ id: "customer.form.authorizedFullName" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input />
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
                <Input />
              </Form.Item>
              <Form.Item
                name="authorizedPersonTitle"
                label={intl.formatMessage({ id: "customer.form.authorizedRole" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input />
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
                  placeholder={intl.formatMessage({ id: "customer.placeholder.phone" })}
                  defaultCountry="TR"
                  international
                />
              </Form.Item>
            </Col>
            <Col sm={24} md={24} lg={12}>
              <Form.Item label={intl.formatMessage({ id: "customer.form.bankInfo" })} name="bankName">
                <Input />
              </Form.Item>
              <Form.Item label={intl.formatMessage({ id: "customer.form.bankAccountNo" })} name="bankAccountNumber">
                <Input
                  placeholder={intl.formatMessage({ id: "customer.placeholder.iban" })}
                  minLength={26}
                  maxLength={26}
                />
              </Form.Item>
              <Form.Item label={intl.formatMessage({ id: "customer.form.website" })} name="website">
                <Input />
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
                <PhoneInput placeholder={intl.formatMessage({ id: "customer.placeholder.phone" })} limitMaxLength={9} />
              </Form.Item>

              <Form.Item
                name="taxDepartment"
                label={intl.formatMessage({ id: "customer.form.taxDepartment" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="taxIdNumber"
                label={intl.formatMessage({ id: "customer.form.taxNo" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="licenceType"
                label={intl.formatMessage({ id: "customer.form.licenseType" })}
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input />
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
                  <Input value={licenceKey} />

                  <Button onClick={() => createLicenceKey()}>
                    <SyncOutlined />
                  </Button>
                </Space.Compact>
              </Form.Item>

              <Form.Item
                name="licenceDate"
                label={intl.formatMessage({ id: "customer.form.licenseDate" })}
                initialValue={[
                  moment(customer.licenceStartDate),
                  moment(customer.licenceFinishDate),
                ]}
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({ id: "customer.validation.requiredField" }),
                  },
                ]}
              >
                <RangePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>

              <Form.Item label={intl.formatMessage({ id: "customer.form.customerStatus" })} name="customerIsActive">
                <Switch
                  style={{ width: 70 }}
                  checkedChildren={intl.formatMessage({ id: "customer.status.active" })}
                  unCheckedChildren={intl.formatMessage({ id: "customer.status.passive" })}
                  checked={isActive}
                  onChange={setIsActive}
                />
              </Form.Item>

              <Form.Item>
                <div style={{ width: "100%", textAlign: "right" }}>
                  <Button type="primary" htmlType="submit">
                    <IntlMessages id="customer.common.customerEdit" />
                  </Button>
                </div>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Box>
    </LayoutWrapper>
  ) : (
    <Spin />
  );
}
