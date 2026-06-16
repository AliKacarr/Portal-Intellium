import React from "react";
import { Table, Empty } from "antd";
import { useIntl } from "react-intl";

const { Column } = Table;

const LangInfo = ({ language }) => {
  const intl = useIntl();

  return (
    <div>
      <Table
        pagination={false}
        size="small"
        dataSource={language}
        bordered
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={intl.formatMessage({ id: "profile.lang.empty" })} />
          ),
        }}
        scroll={{
          x: 600,
          y: true,
        }}
      >
        <Column title={intl.formatMessage({ id: "profile.lang.foreign" })} dataIndex="foreignLanguage" width={100} />
        <Column title={intl.formatMessage({ id: "profile.lang.read" })} dataIndex="read" width={80} />
        <Column title={intl.formatMessage({ id: "profile.lang.speak" })} dataIndex="speaking" width={80} />
        <Column title={intl.formatMessage({ id: "profile.lang.write" })} dataIndex="write" width={80} />
        <Column title={intl.formatMessage({ id: "profile.lang.document" })} dataIndex="documentPath" width={100} />
      </Table>
    </div>
  );
};

export default LangInfo;
