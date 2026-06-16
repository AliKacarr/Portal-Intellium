import React from "react";
import { Descriptions, Empty } from "antd";
import { useIntl } from "react-intl";
import moment from "moment";
import calculateYear from "../../library/helpers/calculateYear";

const PersonalInfo = ({ personalInformation }) => {
  const intl = useIntl();

  if (!personalInformation) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={intl.formatMessage({ id: "profile.empty.profileDetail" })}
      />
    );
  }

  const cy = calculateYear(personalInformation.birthDate);

  return (
    <div>
      <Descriptions
        bordered
        size="medium"
        column={{
          xs: 1,
          sm: 1,
          md: 1,
          lg: 2,
          xl: 2,
          xxl: 3,
        }}
      >
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.fullName" })}>
          {personalInformation.name} {personalInformation.surname}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.preferredName" })}>
          {personalInformation.preferredName}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.birthDate" })}>
          {moment(personalInformation.birthDate).format("DD.MM.YYYY")}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.birthPlace" })}>
          {personalInformation.birthPlace}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.tc" })}>{personalInformation.tc}</Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.age" })}>
          {intl.formatMessage({ id: "profile.personal.ageFormat" }, { years: cy.years, months: cy.months })}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.maritalStatus" })}>
          {personalInformation.condition}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.nationality" })}>
          {personalInformation.nationality}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.gender" })}>{personalInformation.sex}</Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.disability" })}>
          {personalInformation.handicappedState}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.bloodType" })}>
          {personalInformation.bloodType}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.militaryStatus" })}>
          {personalInformation.militaryCase}
        </Descriptions.Item>
        {personalInformation.militaryDate && (
          <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.militaryDate" })}>
            {moment(personalInformation.militaryDate).format("DD.MM.YYYY")}
          </Descriptions.Item>
        )}

        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.bankName" })} span={1}>
          {personalInformation.bankName}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.bankAccount" })} span={1}>
          {personalInformation.bankAccountNo}
        </Descriptions.Item>
        <Descriptions.Item label={intl.formatMessage({ id: "profile.personal.iban" })} span={personalInformation.militaryDate ? 2 : 3}>
          {personalInformation.ibanNo}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};

export default PersonalInfo;
