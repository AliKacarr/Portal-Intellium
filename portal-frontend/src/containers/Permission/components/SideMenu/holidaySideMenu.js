import React, { useState } from "react";
import { Card, Modal, Table, Typography, Spin, Space } from "antd";
import {
  CalendarOutlined,
  UserOutlined,
  FileDoneOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/tr";
import { useIntl } from "react-intl";

moment.locale("tr");

const { Paragraph, Text } = Typography;

const CardHeader = ({ title, onInfo, icon, color, loading, intl }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 8,
      minHeight: 56,
    }}
  >
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        {icon}
        <span style={{ color: "#595959", fontSize: "14px", lineHeight: 1.2, fontWeight: 500 }}>{title}</span>
      </div>
    </div>
    {loading ? (
      <Spin size="small" />
    ) : onInfo ? (
      <InfoCircleOutlined
        role="button"
        tabIndex={0}
        onClick={onInfo}
        onKeyDown={(e) => e.key === "Enter" && onInfo()}
        style={{
          fontSize: 18,
          color: color || "#1890ff",
          cursor: "pointer",
          flexShrink: 0,
          marginTop: 2,
        }}
        aria-label={intl.formatMessage({ id: "permission.sideMenu.infoAria" }, { title })}
      />
    ) : null}
  </div>
);

const SideMenu = ({ stats, explanation, explanationLoading }) => {
  const intl = useIntl();
  const data = stats || {
    totalLeave: 0,
    remainingLeave: 0,
    usedLeave: 0,
    thisYear: 0,
  };
  const cardStyle = {
    textAlign: "left",
    borderRadius: "10px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    height: "100%",
    border: "1px solid #f0f0f0",
  };
  const iconStyle = { fontSize: "20px" };

  const [openTotal, setOpenTotal] = useState(false);
  const [openThisYear, setOpenThisYear] = useState(false);
  const [openUsed, setOpenUsed] = useState(false);
  const [openRemaining, setOpenRemaining] = useState(false);

  const rulesTable = explanation?.rulesTable || [];
  const thisYearDetail = explanation?.thisYearDetail;
  const annualAccruals = explanation?.annualAccruals || [];
  const usedDetails = explanation?.usedLeaveDetails || [];
  const hasJob = explanation?.hasJobStartDate;
  const statusSummary = usedDetails.reduce(
    (acc, item) => {
      const st = item?.status || "Pending";
      if (st === "Confirmed") acc.confirmed += 1;
      else if (st === "Declined") acc.declined += 1;
      else acc.pending += 1;
      return acc;
    },
    { confirmed: 0, declined: 0, pending: 0 }
  );
  const groupedByStatus = {
    confirmed: usedDetails.filter((x) => (x?.status || "Pending") === "Confirmed"),
    declined: usedDetails.filter((x) => (x?.status || "Pending") === "Declined"),
    pending: usedDetails.filter((x) => (x?.status || "Pending") === "Pending"),
  };

  const getRuleHighlightKey = () => {
    if (!thisYearDetail) return "";
    const seniority = thisYearDetail.seniorityYears;
    const age = thisYearDetail.age;
    if (seniority < 1) return "x < 1 yıl|—|0 gün";
    if (seniority >= 1 && seniority < 5) {
      if (age <= 18 || age >= 50) return "1 ≤ x < 5 yıl|≤ 18 yaş veya ≥ 50 yaş|20 gün";
      return "1 ≤ x < 5 yıl|18 < yaş < 50|14 gün";
    }
    if (seniority >= 5 && seniority < 15) return "5 ≤ x < 15 yıl|—|20 gün";
    return "x ≥ 15 yıl|—|26 gün";
  };
  const activeRuleKey = getRuleHighlightKey();

  const rulesColumns = [
    { title: intl.formatMessage({ id: "permission.sideMenu.rulesColSeniority" }), dataIndex: "seniorityRange", key: "s" },
    { title: intl.formatMessage({ id: "permission.sideMenu.rulesColAge" }), dataIndex: "ageCondition", key: "a" },
    { title: intl.formatMessage({ id: "permission.sideMenu.rulesColDays" }), dataIndex: "leaveDays", key: "d", align: "right" },
  ];

  const accrualColumns = [
    {
      title: intl.formatMessage({ id: "permission.sideMenu.usedColCompletedYear" }),
      dataIndex: "serviceYearIndex",
      key: "k",
      render: (v) => intl.formatMessage({ id: "permission.sideMenu.accrualYearTitle" }, { year: v }),
    },
    {
      title: intl.formatMessage({ id: "permission.sideMenu.usedColAnniversary" }),
      dataIndex: "anniversaryDate",
      key: "dt",
      render: (v) => (v ? moment(v).format("DD.MM.YYYY") : intl.formatMessage({ id: "parametre.permission.minMaxDash" })),
    },
    { title: intl.formatMessage({ id: "permission.sideMenu.usedColAgeThen" }), dataIndex: "ageAtAnniversary", key: "age" },
    { title: intl.formatMessage({ id: "permission.sideMenu.usedColEarned" }), dataIndex: "daysEarned", key: "days", align: "right" },
  ];

  const usedColumns = [
    {
      title: intl.formatMessage({ id: "permission.sideMenu.usedColRange" }),
      key: "range",
      render: (_, r) =>
        `${moment(r.startTime).format("DD.MM.YYYY HH:mm")} - ${moment(r.endTime).format("DD.MM.YYYY HH:mm")}`,
    },
    { title: intl.formatMessage({ id: "permission.sideMenu.usedColType" }), dataIndex: "permissionTypeName", key: "t" },
    {
      title: intl.formatMessage({ id: "permission.sideMenu.usedColAmount" }),
      dataIndex: "amount",
      key: "d",
      align: "right",
      render: (v, r) => `${typeof v === "number" ? v : 0} ${r.unit || ""}`,
    },
    {
      title: intl.formatMessage({ id: "permission.sideMenu.usedColStatus" }),
      key: "status",
      align: "right",
      render: (_, r) => {
        const label = r.statusLabel || intl.formatMessage({ id: "permission.sideMenu.statusPending" });
        const status = r.status || "Pending";
        let color = "#d48806";
        let bg = "#fff7e6";
        if (status === "Confirmed") {
          color = "#389e0d";
          bg = "#f6ffed";
        } else if (status === "Declined") {
          color = "#cf1322";
          bg = "#fff1f0";
        }
        return (
          <span
            style={{
              color,
              background: bg,
              border: `1px solid ${bg}`,
              borderRadius: 12,
              padding: "2px 10px",
              fontWeight: 500,
              fontSize: 12,
            }}
          >
            {label}
          </span>
        );
      },
    },
  ];

  const statCardWrap = {
    flex: "1 1 0",
    minWidth: 132,
    maxWidth: "100%",
  };

  const daysCount = (n) => intl.formatMessage({ id: "permission.sideMenu.daysCount" }, { count: n });

  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          padding: "4px 12px 0 16px",
          justifyContent: "flex-start",
        }}
      >
        <div style={statCardWrap}>
          <Card style={cardStyle} bodyStyle={{ padding: "16px 14px" }}>
            <CardHeader
              title={intl.formatMessage({ id: "permission.sideMenu.cardTotalPaid" })}
              loading={explanationLoading}
              color="#1677ff"
              onInfo={() => setOpenTotal(true)}
              icon={<CalendarOutlined style={{ ...iconStyle, color: "#1677ff" }} />}
              intl={intl}
            />
            <div style={{ fontSize: "20px", fontWeight: "bold", textAlign: "center" }}>
              {daysCount(data.totalLeave)}
            </div>
          </Card>
        </div>
        <div style={statCardWrap}>
          <Card style={cardStyle} bodyStyle={{ padding: "16px 14px" }}>
            <CardHeader
              title={intl.formatMessage({ id: "permission.sideMenu.cardThisYearEarned" })}
              loading={explanationLoading}
              color="#13c2c2"
              onInfo={() => setOpenThisYear(true)}
              icon={<UserOutlined style={{ ...iconStyle, color: "#13c2c2" }} />}
              intl={intl}
            />
            <div style={{ fontSize: "20px", fontWeight: "bold", textAlign: "center" }}>
              {daysCount(data.thisYear)}
            </div>
          </Card>
        </div>
        <div style={statCardWrap}>
          <Card style={cardStyle} bodyStyle={{ padding: "16px 14px" }}>
            <CardHeader
              title={intl.formatMessage({ id: "permission.sideMenu.cardRemaining" })}
              loading={explanationLoading}
              color="#fa8c16"
              onInfo={() => setOpenRemaining(true)}
              icon={<FileDoneOutlined style={{ ...iconStyle, color: "#fa8c16" }} />}
              intl={intl}
            />
            <div style={{ fontSize: "20px", fontWeight: "bold", textAlign: "center" }}>
              {daysCount(data.remainingLeave)}
            </div>
          </Card>
        </div>
        <div style={statCardWrap}>
          <Card style={cardStyle} bodyStyle={{ padding: "16px 14px" }}>
            <CardHeader
              title={intl.formatMessage({ id: "permission.sideMenu.cardUsed" })}
              loading={explanationLoading}
              color="#722ed1"
              onInfo={() => setOpenUsed(true)}
              icon={<CheckCircleOutlined style={{ ...iconStyle, color: "#722ed1" }} />}
              intl={intl}
            />
            <div style={{ fontSize: "20px", fontWeight: "bold", textAlign: "center" }}>
              {daysCount(data.usedLeave)}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        title={intl.formatMessage({ id: "permission.sideMenu.modalTotalTitle" })}
        open={openTotal}
        onCancel={() => setOpenTotal(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        {!hasJob ? (
          <Paragraph>{intl.formatMessage({ id: "permission.sideMenu.noJobParagraph" })}</Paragraph>
        ) : (
          <>
            <Paragraph style={{ marginBottom: 12, color: "#434343" }}>
              {intl.formatMessage({ id: "permission.sideMenu.totalExplain" })}
            </Paragraph>
            {explanation?.jobStartDate && (
              <Text style={{ color: "#262626", display: "block" }}>
                <span style={{ fontWeight: "bold" }}>{intl.formatMessage({ id: "permission.sideMenu.jobStartLabel" })}</span>{" "}
                {moment(explanation.jobStartDate).format("DD.MM.YYYY")}
                {thisYearDetail && (
                  <>
                    <br />
                    <span style={{ fontWeight: "bold" }}>{intl.formatMessage({ id: "permission.sideMenu.seniorityLabel" })}</span>{" "}
                    {intl.formatMessage({ id: "permission.sideMenu.seniorityYears" }, { years: thisYearDetail.seniorityYears })}
                  </>
                )}
                {explanation?.birthDate && (
                  <>
                    <br />
                    <br />
                    <span style={{ fontWeight: "bold" }}>{intl.formatMessage({ id: "permission.sideMenu.birthDateLabel" })}</span>{" "}
                    {moment(explanation.birthDate).format("DD.MM.YYYY")}
                  </>
                )}
                {thisYearDetail && explanation?.birthDate && (
                  <>
                    <br />
                    <span style={{ fontWeight: "bold" }}>{intl.formatMessage({ id: "permission.sideMenu.ageLabel" })}</span>{" "}
                    {thisYearDetail.age}
                  </>
                )}
              </Text>
            )}
            <Table
              style={{ marginTop: 16 }}
              size="small"
              pagination={false}
              rowKey={(r) => String(r.serviceYearIndex)}
              columns={accrualColumns}
              dataSource={annualAccruals}
              locale={{ emptyText: intl.formatMessage({ id: "permission.sideMenu.accrualEmpty" }) }}
            />
            <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
              <Text strong>{intl.formatMessage({ id: "permission.sideMenu.totalEarnedLabel" })}</Text>
              {daysCount(data.totalLeave)}
            </Paragraph>
          </>
        )}
      </Modal>

      <Modal
        title={intl.formatMessage({ id: "permission.sideMenu.modalThisYearTitle" })}
        open={openThisYear}
        onCancel={() => setOpenThisYear(false)}
        footer={null}
        width={720}
        destroyOnClose
      >
        <Paragraph style={{ marginBottom: 8, color: "#434343" }}>
          {intl.formatMessage({ id: "permission.sideMenu.thisYearIntro" })}
        </Paragraph>
        <Table
          size="small"
          pagination={false}
          rowKey={(r) => `${r.seniorityRange}|${r.ageCondition}|${r.leaveDays}`}
          columns={rulesColumns}
          dataSource={rulesTable}
          style={{ marginBottom: 16 }}
          rowClassName={(r) =>
            `${r.seniorityRange}|${r.ageCondition}|${r.leaveDays}` === activeRuleKey ? "permission-rule-active-row" : ""
          }
        />
        {!hasJob || !thisYearDetail ? (
          <Paragraph>{intl.formatMessage({ id: "permission.sideMenu.missingInfoParagraph" })}</Paragraph>
        ) : (
          <Space direction="vertical" size="small" style={{ width: "100%" }}>
            <div>
              <Text strong>{intl.formatMessage({ id: "permission.sideMenu.detailSeniority" })} </Text>
              <Text>{intl.formatMessage({ id: "permission.sideMenu.seniorityYears" }, { years: thisYearDetail.seniorityYears })}</Text>
            </div>
            <div>
              <Text strong>{intl.formatMessage({ id: "permission.sideMenu.detailAge" })} </Text>
              <Text>{thisYearDetail.age}</Text>
            </div>
            <div>
              <Text strong>{intl.formatMessage({ id: "permission.sideMenu.detailThisYear" })} </Text>
              <Text>{daysCount(thisYearDetail.thisYearDays)}</Text>
            </div>
          </Space>
        )}
      </Modal>

      <Modal
        title={intl.formatMessage({ id: "permission.sideMenu.modalUsedTitle" })}
        open={openUsed}
        onCancel={() => setOpenUsed(false)}
        footer={null}
        width={640}
        destroyOnClose
      >
        <Paragraph style={{ color: "#434343" }}></Paragraph>
        <Table
          size="small"
          pagination={{ pageSize: 5, showSizeChanger: false }}
          rowKey={(r) => `${r.permissionId}-${r.startTime}`}
          columns={usedColumns}
          dataSource={usedDetails}
          locale={{ emptyText: intl.formatMessage({ id: "permission.sideMenu.usedTableEmpty" }) }}
        />
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 12,
          }}
        >
          <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 }}>
            <Text strong style={{ color: "#389e0d", fontSize: 16 }}>
              {intl.formatMessage({ id: "permission.sideMenu.usedConfirmed" }, { count: statusSummary.confirmed })}
            </Text>
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: "#434343" }}>
              {groupedByStatus.confirmed.length === 0
                ? intl.formatMessage({ id: "permission.sideMenu.noRecords" })
                : groupedByStatus.confirmed.map((r) => (
                    <div key={`c-${r.permissionId}-${r.startTime}`} style={{ marginBottom: 4 }}>
                      {r.permissionTypeName}: {moment(r.startTime).format("DD.MM.YYYY")} - {moment(r.endTime).format("DD.MM.YYYY")} (
                      {typeof r.amount === "number" ? r.amount : 0} {r.unit || ""})
                    </div>
                  ))}
            </div>
          </div>
          <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 }}>
            <Text strong style={{ color: "#cf1322", fontSize: 16 }}>
              {intl.formatMessage({ id: "permission.sideMenu.usedDeclined" }, { count: statusSummary.declined })}
            </Text>
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: "#434343" }}>
              {groupedByStatus.declined.length === 0
                ? intl.formatMessage({ id: "permission.sideMenu.noRecords" })
                : groupedByStatus.declined.map((r) => (
                    <div key={`d-${r.permissionId}-${r.startTime}`} style={{ marginBottom: 4 }}>
                      {r.permissionTypeName}: {moment(r.startTime).format("DD.MM.YYYY")} - {moment(r.endTime).format("DD.MM.YYYY")} (
                      {typeof r.amount === "number" ? r.amount : 0} {r.unit || ""})
                    </div>
                  ))}
            </div>
          </div>
          <div style={{ border: "1px solid #f0f0f0", borderRadius: 8, padding: 12 }}>
            <Text strong style={{ color: "#d48806", fontSize: 16 }}>
              {intl.formatMessage({ id: "permission.sideMenu.usedPending" }, { count: statusSummary.pending })}
            </Text>
            <div style={{ marginTop: 10, fontSize: 14, lineHeight: 1.7, color: "#434343" }}>
              {groupedByStatus.pending.length === 0
                ? intl.formatMessage({ id: "permission.sideMenu.noRecords" })
                : groupedByStatus.pending.map((r) => (
                    <div key={`p-${r.permissionId}-${r.startTime}`} style={{ marginBottom: 4 }}>
                      {r.permissionTypeName}: {moment(r.startTime).format("DD.MM.YYYY")} - {moment(r.endTime).format("DD.MM.YYYY")} (
                      {typeof r.amount === "number" ? r.amount : 0} {r.unit || ""})
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        title={intl.formatMessage({ id: "permission.sideMenu.modalRemainingTitle" })}
        open={openRemaining}
        onCancel={() => setOpenRemaining(false)}
        footer={null}
        width={480}
        destroyOnClose
      >
        <Paragraph style={{ color: "#434343", marginBottom: 0 }}>
          {intl.formatMessage(
            { id: "permission.sideMenu.remainingSummary" },
            { total: data.totalLeave, used: data.usedLeave, remaining: data.remainingLeave }
          )}
        </Paragraph>
      </Modal>
      <style>
        {`
          .permission-rule-active-row td {
            background: #e6f7ff !important;
            font-weight: 600;
          }
        `}
      </style>
    </div>
  );
};

export default SideMenu;
