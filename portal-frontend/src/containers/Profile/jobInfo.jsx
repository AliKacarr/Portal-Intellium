import React from "react";
import { Table, Descriptions, Divider, Empty } from "antd";
import { useIntl } from "react-intl";
import moment from "moment";
import calculateYear from "../../library/helpers/calculateYear";

const { Column, ColumnGroup } = Table;

const JobInfo = ({ jobInfo, experience }) => {
  const intl = useIntl();
  const ongoing = intl.formatMessage({ id: "profile.ongoing" });

  return (
    <div>
      {jobInfo ? (
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
          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.id" })} span={3}>
            {jobInfo.userId}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.otherId" })} span={2}>
            {jobInfo.anotherId}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.jobCode" })} span={1}>
            {jobInfo.jobCode}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.startDate" })} span={2}>
            {moment(jobInfo.startDate).format("DD.MM.YYYY")}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.seniority" })} span={1}>
            {intl.formatMessage(
              { id: "profile.job.seniorityFormat" },
              { years: calculateYear(jobInfo.startDate).years, months: calculateYear(jobInfo.startDate).months }
            )}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.recruitmentSource" })} span={jobInfo.isActive ? 3 : 1}>
            {jobInfo.recruitmentSource}
          </Descriptions.Item>
          {!jobInfo.isActive && (
            <>
              <Descriptions.Item label={intl.formatMessage({ id: "profile.job.departureDate" })} span={1}>
                {moment(jobInfo.departureDate).format("DD.MM.YYYY")}
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: "profile.job.departureReason" })} span={1}>
                {jobInfo.departureReason}
              </Descriptions.Item>
            </>
          )}

          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.workingStatus" })} span={1}>
            {jobInfo.workingStatus}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.paymentType" })} span={1}>
            {jobInfo.paymentType}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.location" })} span={1}>
            {jobInfo.location}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.department" })} span={1}>
            {jobInfo.department}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.serviceArea" })} span={1}>
            {jobInfo.serviceArea}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.jobTitle" })} span={3}>
            {jobInfo.jobTitle}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.level" })} span={2}>
            {jobInfo.level}
          </Descriptions.Item>
          <Descriptions.Item label={intl.formatMessage({ id: "profile.job.manager" })} span={1}>
            {jobInfo.managerName}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={intl.formatMessage({ id: "profile.job.emptyJob" })} />
      )}

      <Divider />
      <Table
        pagination={false}
        size="small"
        dataSource={experience}
        bordered
        scroll={{
          x: 800,
          y: true,
        }}
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={intl.formatMessage({ id: "profile.job.emptyExperience" })} />
          ),
        }}
      >
        <ColumnGroup title={intl.formatMessage({ id: "profile.job.experienceGroupTitle" })} align="left">
          <Column title={intl.formatMessage({ id: "profile.job.company" })} dataIndex="companyName" />
          <Column title={intl.formatMessage({ id: "profile.job.duty" })} dataIndex="duty" />
          <Column title={intl.formatMessage({ id: "profile.job.expJobTitle" })} dataIndex="jobTitle" />
          <Column
            title={intl.formatMessage({ id: "profile.job.expStart" })}
            dataIndex="startDate"
            render={(date) => <span>{moment(date).format("DD.MM.YYYY")}</span>}
          />
          <Column
            title={intl.formatMessage({ id: "profile.job.expEnd" })}
            dataIndex="departureDate"
            render={(date) => (date ? moment(date).format("DD.MM.YYYY") : ongoing)}
          />
        </ColumnGroup>
      </Table>
    </div>
  );
};

export default JobInfo;
