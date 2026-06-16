import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useIntl } from "react-intl";
import { Badge, Descriptions, Breadcrumb, Divider, Button } from "antd";
import IntlMessages from "@iso/components/utility/intlMessages";
import PageHeader from "@iso/components/utility/pageHeader";
import LayoutWrapper from "@iso/components/utility/layoutWrapper.js";
import ContentHolder from "@iso/components/utility/contentHolder";
import Box from "@iso/components/utility/box";
import { GetCustomerById } from "../../../Api/CustomerApi";
import moment from "moment";
import parsePhoneNumber from "libphonenumber-js";
import { Link } from "react-router-dom";

const CustomerDetails = () => {
  const intl = useIntl();
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    // Function to get customer details by making a request to the API
    const fetchCustomerDetails = async () => {
      try {
        const response = await GetCustomerById(id);
        setCustomer(response.data.data);
      } catch (error) {
        console.error("Error fetching customer details:", error.message);
      }
    };

    // Call the fetchCustomerDetails function
    fetchCustomerDetails();
  }, [id]);

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
  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>{intl.formatMessage({ id: "customer.common.customer" })} </Breadcrumb.Item>
          <Breadcrumb.Item>{intl.formatMessage({ id: "customer.common.customerDetail" })}</Breadcrumb.Item>
        </Breadcrumb>
        <PageHeader>
          <IntlMessages id="customer.common.customerDetail" />
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
        <ContentHolder style={{ padding: "10px 20px" }}>
          {customer && (
            <div>
              <Descriptions
                bordered
                size="small"
                column={{
                  xs: 1,
                  sm: 1,
                  md: 1,
                  lg: 2,
                  xl: 2,
                  xxl: 2,
                }}
              >
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.customerName" })} span={2}>
                  {customer.customerName}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.customerShortName" })} span={1}>
                  {customer.customerShortName}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.city" })} span={1}>
                  {customer.city}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.country" })} span={1}>
                  {customer.country}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.postalCode" })} span={1}>
                  {customer.postalCode}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.address" })} span={2}>
                  {customer.address}
                </Descriptions.Item>
              </Descriptions>
              <Divider />
              <Descriptions
                bordered
                size="small"
                column={{
                  xs: 1,
                  sm: 1,
                  md: 1,
                  lg: 2,
                  xl: 2,
                  xxl: 2,
                }}
              >
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.authorizedFullName" })}>
                  {customer.authorizedPersonFullName}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.authorizedRole" })}>
                  {customer.authorizedPersonTitle}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.authorizedPhone" })}>
                  {formatPhoneNumber(customer.authorizedPersonPhone)}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.authorizedEmail" })}>
                  {customer.authorizedPersonMail}
                </Descriptions.Item>
              </Descriptions>
              <Divider />
              <Descriptions
                bordered
                size="small"
                column={{
                  xs: 1,
                  sm: 1,
                  md: 1,
                  lg: 2,
                  xl: 2,
                  xxl: 2,
                }}
              >
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.bankInfo" })}>
                  {customer.bankName}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.bankAccountNo" })}>
                  {customer.bankAccountNumber}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.website" })}>
                  {customer.website}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.phone" })}>
                  {formatPhoneNumber(customer.phone)}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.taxDepartment" })}>
                  {customer.taxDepartment}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.taxNo" })}>
                  {customer.taxIdNumber}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.licenseType" })}>
                  {customer.licenceType}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.licenseKey" })}>
                  {customer.licenceKey}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.licenseStartDate" })}>
                  {moment(customer.licenceStartDate).format("DD.MM.YYYY")}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.licenseEndDate" })}>
                  {moment(customer.licenceFinishDate).format("DD.MM.YYYY")}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.licenseStatus" })}>
                  {customer.isActive ? (
                    <>
                      <Badge status="success" /> {intl.formatMessage({ id: "customer.status.active" })}
                    </>
                  ) : (
                    <>
                      <Badge status="error" /> {intl.formatMessage({ id: "customer.status.passive" })}
                    </>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={intl.formatMessage({ id: "customer.form.createdAt" })}>
                  {moment(customer.addetAt).format("DD.MM.YYYY")}
                </Descriptions.Item>
              </Descriptions>
            </div>
          )}
        </ContentHolder>
      </Box>
    </LayoutWrapper>
  );
};

export default CustomerDetails;
