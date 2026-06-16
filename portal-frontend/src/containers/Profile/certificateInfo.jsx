import React from "react";
import { Table, Empty } from "antd";
import { useIntl } from "react-intl";
import moment from "moment";

const { Column } = Table;

const CertificateInfo = ({ certificate }) => {
  const intl = useIntl();

  return (
    <div>
      <Table
        pagination={false}
        size="small"
        dataSource={certificate}
        bordered
        scroll={{
          x: 600,
          y: true,
        }}
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={intl.formatMessage({ id: "profile.cert.empty" })} />
          ),
        }}
      >
        <Column title={intl.formatMessage({ id: "profile.cert.no" })} dataIndex="certificateNo" width={60} />
        <Column title={intl.formatMessage({ id: "profile.cert.name" })} dataIndex="certificateName" width={120} />
        <Column title={intl.formatMessage({ id: "profile.cert.institution" })} dataIndex="institutionName" width={100} />
        <Column
          title={intl.formatMessage({ id: "profile.cert.start" })}
          dataIndex="startTime"
          width={80}
          render={(date) => <span>{moment(date).format("DD.MM.YYYY")}</span>}
        />
        <Column
          title={intl.formatMessage({ id: "profile.cert.end" })}
          dataIndex="endTime"
          width={80}
          render={(date) => <span>{moment(date).format("DD.MM.YYYY")}</span>}
        />
        <Column title={intl.formatMessage({ id: "profile.cert.score" })} dataIndex="certificateExamMark" width={60} />
      </Table>
    </div>
  );
};

export default CertificateInfo;
