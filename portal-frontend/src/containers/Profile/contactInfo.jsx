import React from "react";
import { Descriptions, Empty } from "antd";
import { useIntl } from "react-intl";
import { formatPhoneNumber } from "../../library/helpers/validators/formatPhoneNumber";

const ContactInfo = ({ personalInformation }) => {
  const intl = useIntl();

  return (
    <div>
      {personalInformation ? (
        <Descriptions
          bordered
          column={{
            xs: 1,
            sm: 1,
            md: 1,
            lg: 2,
            xl: 2,
            xxl: 3,
          }}
        >
          <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.address" })} span={3}>
            {personalInformation.adress}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.country" })} span={1}>
            {personalInformation.country}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.province" })} span={1}>
            {personalInformation.province}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.district" })} span={1}>
            {personalInformation.district}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.postalCode" })} span={2}>
            {personalInformation.postCode}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.mobile" })} span={1}>
            <span>{formatPhoneNumber(personalInformation.telNo)}</span>
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.home" })} span={2}>
            <span>{formatPhoneNumber(personalInformation.homePhone)}</span>
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.office" })} span={1}>
            <span>{formatPhoneNumber(personalInformation.office)}</span>
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.extension" })} span={3}>
            {personalInformation.interphone}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.otherEmail" })} span={3}>
            <a href={`mailto:${personalInformation.otherEmail}`}>{personalInformation.otherEmail}</a>
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.github" })} span={2}>
            <a href={personalInformation.githubUrl} target="_blank" rel="noopener noreferrer">
              {personalInformation.githubUrl}
            </a>
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.contact.linkedin" })} span={1}>
            <a href={personalInformation.linkedInUrl} target="_blank" rel="noopener noreferrer">
              {personalInformation.linkedInUrl}
            </a>
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={intl.formatMessage({ id: "profile.contact.empty" })} />
      )}
    </div>
  );
};

export default ContactInfo;
