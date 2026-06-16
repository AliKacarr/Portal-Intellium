import React, { useMemo } from "react";
import { Table, Empty } from "antd";
import { useIntl } from "react-intl";
import moment from "moment";

const EduInfo = ({ eduInfo }) => {
  const intl = useIntl();
  const ongoing = intl.formatMessage({ id: "profile.ongoing" });

  const columnseducation = useMemo(
    () => [
      {
        title: intl.formatMessage({ id: "profile.edu.completed" }),
        dataIndex: "completedEducation",
        key: "completedEducation",
        width: 150,
      },
      {
        title: intl.formatMessage({ id: "profile.edu.school" }),
        dataIndex: "school",
        key: "school",
        ellipsis: true,
        width: 250,
      },
      {
        title: intl.formatMessage({ id: "profile.edu.department" }),
        dataIndex: "department",
        key: "department",
        ellipsis: true,
        width: 250,
      },
      {
        title: intl.formatMessage({ id: "profile.edu.scholarship" }),
        dataIndex: "scholarship",
        key: "scholarship",
        width: 110,
      },
      {
        title: intl.formatMessage({ id: "profile.edu.grade" }),
        dataIndex: "gradePoint",
        key: "gradePoint",
        width: 100,
      },
      {
        title: intl.formatMessage({ id: "profile.edu.start" }),
        dataIndex: "startDate",
        render: (date) => (date ? moment(date).format("DD.MM.YYYY") : "-"),
        key: "startDate",
        width: 120,
      },
      {
        title: intl.formatMessage({ id: "profile.edu.end" }),
        dataIndex: "endDate",
        render: (date) => (date ? moment(date).format("DD.MM.YYYY") : ongoing),
        key: "endDate",
        width: 100,
      },
    ],
    [intl, ongoing]
  );

  return (
    <div>
      <Table
        locale={{
          emptyText: (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={intl.formatMessage({ id: "profile.edu.empty" })} />
          ),
        }}
        bordered
        scroll={{
          x: 1200,
          y: 500,
        }}
        columns={columnseducation}
        pagination={false}
        size={"small"}
        dataSource={eduInfo}
      />
    </div>
  );
};

export default EduInfo;
