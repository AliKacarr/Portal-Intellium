import React from "react";
import { Empty, Table } from "antd";
import { useIntl } from "react-intl";
import moment from "moment";
import { parsePhoneNumber } from "libphonenumber-js";

const { Column } = Table;

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

const FamilyInfo = ({ family }) => {
  const intl = useIntl();

  return (
    <div>
      <Table
        dataSource={family}
        pagination={false}
        size="small"
        bordered
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={intl.formatMessage({ id: "profile.family.empty" })} />
          ),
        }}
        scroll={{
          x: 800,
          y: true,
        }}
      >
        <Column title={intl.formatMessage({ id: "profile.family.name" })} dataIndex="name" width={70} />
        <Column title={intl.formatMessage({ id: "profile.family.surname" })} dataIndex="surname" width={70} />
        <Column title={intl.formatMessage({ id: "profile.family.relation" })} dataIndex="relationship" width={50} />
        <Column
          title={intl.formatMessage({ id: "profile.family.phone" })}
          dataIndex="telNo"
          render={(number) => <span>{formatPhoneNumber(number)}</span>}
          width={60}
        />
        <Column
          title={intl.formatMessage({ id: "profile.family.birthDate" })}
          dataIndex="birthDate"
          key="dogumTarihi"
          width={70}
          render={(date) => <span>{moment(date).format("DD.MM.YYYY")}</span>}
        />
        <Column title={intl.formatMessage({ id: "profile.family.tc" })} dataIndex="tc" key="tc" width={70} />
      </Table>
    </div>
  );
};

export default FamilyInfo;
