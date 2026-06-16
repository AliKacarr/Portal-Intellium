import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import {
  Breadcrumb,
  Button,
  Tag,
  Empty,
  Spin,
  message,
  Typography,
  Progress,
  Radio,
  Space,
  Alert,
  Divider,
  Card,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SendOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/tr";
import "moment/locale/en-gb";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import IntlMessages from "@iso/components/utility/intlMessages";
import { Box, PollDetailWrapper } from "./poll-style";
import { GetPollById, VotePoll } from "../../Api/PollApi";
import EditPoll from "./EditPoll";

const OPTION_COLORS = ["#1890ff", "#722ed1", "#13c2c2", "#52c41a", "#fa8c16", "#f5222d"];

const PollDetail = () => {
  const intl = useIntl();
  const { id } = useParams();
  const history = useHistory();
  const userRole = useSelector((state) => state.Auth.role?.roleName);
  const roleName = (userRole || "").toLowerCase();
  const isAdmin = roleName === "admin";
  const isAdminOrWorker = ["admin", "worker"].includes(roleName);

  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    moment.locale(intl.locale?.toLowerCase().startsWith("tr") ? "tr" : "en");
  }, [intl.locale]);

  useEffect(() => {
    fetchPoll();
  }, [id]);

  const fetchPoll = async () => {
    setLoading(true);
    try {
      const response = await GetPollById(id);
      const data = response.data?.data ?? response.data?.Data;
      setPoll(data);
      if (data?.questions) {
        const voted = {};
        data.questions.forEach((q) => {
          if (q.userVotedOptionId) voted[q.id] = q.userVotedOptionId;
        });
        setSelectedOptions(voted);
      }
    } catch {
      message.error(intl.formatMessage({ id: "polls.detail.loadError" }));
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    const questions = poll?.questions || [];
    const votableQuestions = questions.filter((q) => !q.hasVoted);

    const missingVotes = votableQuestions.filter((q) => !selectedOptions[q.id]);
    if (missingVotes.length > 0) {
      message.warning(intl.formatMessage({ id: "polls.detail.voteSelectWarning" }));
      return;
    }

    const votes = votableQuestions.map((q) => ({
      pollQuestionId: q.id,
      pollOptionId: selectedOptions[q.id],
    }));

    if (votes.length === 0) {
      message.info(intl.formatMessage({ id: "polls.detail.alreadyVoted" }));
      return;
    }

    setSubmitting(true);
    try {
      await VotePoll({ pollId: Number(id), votes });
      message.success(intl.formatMessage({ id: "polls.detail.voteSuccess" }));
      fetchPoll();
    } catch (err) {
      const errMsg =
        err?.response?.data?.message || intl.formatMessage({ id: "polls.detail.voteError" });
      message.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const isExpired = (endDate) => moment(endDate).isBefore(moment());
  const isNotStarted = (startDate) => moment(startDate).isAfter(moment());

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>
            <span
              style={{ cursor: "pointer", color: "#1890ff" }}
              onClick={() => history.push("/dashboard/polls")}
            >
              <IntlMessages id="sidebar.polls" />
            </span>
          </Breadcrumb.Item>
          {poll && <Breadcrumb.Item>{poll.title}</Breadcrumb.Item>}
        </Breadcrumb>

        <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => history.push("/dashboard/polls")}
          >
            {intl.formatMessage({ id: "polls.detail.back" })}
          </Button>
          {isAdminOrWorker && poll && (
            <EditPoll
              pollId={poll.id}
              refreshList={fetchPoll}
              buttonType="default"
            />
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Spin size="large" />
          </div>
        ) : !poll ? (
          <Empty description={intl.formatMessage({ id: "polls.detail.notFound" })} style={{ padding: "60px 0" }} />
        ) : (
          <PollDetailWrapper>
            {(() => {
              const expired = isExpired(poll.endDate);
              const notStarted = isNotStarted(poll.startDate);
              const questions = poll.questions || [];
              const allVoted = questions.length > 0 && questions.every((q) => q.hasVoted);
              const anyVoted = questions.some((q) => q.hasVoted);
              const canVoteNow = !expired && !notStarted;
              const hasUnvotedQuestions = questions.some((q) => !q.hasVoted);
              const showVoteButton = canVoteNow && hasUnvotedQuestions;

              return (
                <>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                    {isAdminOrWorker && !poll.isActive && (
                      <Tag color="error">{intl.formatMessage({ id: "polls.tag.passive" })}</Tag>
                    )}
                    {expired ? (
                      <Tag color="default">{intl.formatMessage({ id: "polls.detail.tagEnded" })}</Tag>
                    ) : notStarted ? (
                      <Tag color="orange">{intl.formatMessage({ id: "polls.detail.tagNotStarted" })}</Tag>
                    ) : (
                      <Tag color="processing">
                        <ClockCircleOutlined style={{ marginRight: 3 }} />
                        {intl.formatMessage({ id: "polls.detail.tagActive" })}
                      </Tag>
                    )}
                    {allVoted && (
                      <Tag color="success">
                        <CheckCircleOutlined style={{ marginRight: 3 }} />
                        {intl.formatMessage({ id: "polls.detail.tagVoted" })}
                      </Tag>
                    )}
                    {poll.isGeneral && (
                      <Tag color="purple">{intl.formatMessage({ id: "polls.detail.tagGeneral" })}</Tag>
                    )}
                    {poll.departmentName && (
                      <Tag color="geekblue">{poll.departmentName}</Tag>
                    )}
                  </div>

                  <div className="poll-detail-title">{poll.title}</div>

                  <div className="poll-detail-meta">
                    {isAdmin && (
                      <span>
                        <UserOutlined style={{ marginRight: 4 }} />
                        {poll.createdByName}
                      </span>
                    )}
                    <span>
                      <CalendarOutlined style={{ marginRight: 4 }} />
                      {moment(poll.startDate).format("DD MMM YYYY")} –{" "}
                      {moment(poll.endDate).format("DD MMM YYYY")}
                    </span>
                    {isAdmin && (
                      <span>
                        <TeamOutlined style={{ marginRight: 4 }} />
                        {intl.formatMessage(
                          { id: "polls.detail.participants" },
                          { count: poll.totalParticipants }
                        )}
                      </span>
                    )}
                    <span>
                      <QuestionCircleOutlined style={{ marginRight: 4 }} />
                      {intl.formatMessage(
                        { id: "polls.detail.questionCount" },
                        { count: questions.length }
                      )}
                    </span>
                  </div>

                  {poll.content && (
                    <Typography.Paragraph style={{ color: "#666", marginBottom: 16 }}>
                      {poll.content}
                    </Typography.Paragraph>
                  )}

                  {notStarted && (
                    <Alert
                      type="info"
                      message={intl.formatMessage(
                        { id: "polls.detail.startsOn" },
                        { date: moment(poll.startDate).format("DD MMMM YYYY") }
                      )}
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  {allVoted && (
                    <Alert
                      type="success"
                      message={intl.formatMessage({ id: "polls.detail.alertVoted" })}
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}
                  {expired && !anyVoted && (
                    <Alert
                      type="warning"
                      message={intl.formatMessage({ id: "polls.detail.alertExpiredNoVote" })}
                      showIcon
                      style={{ marginBottom: 16 }}
                    />
                  )}

                  <Divider />

                  {questions.map((question, qIndex) => {
                    const showResults = question.hasVoted || expired;
                    const showVoting = canVoteNow && !question.hasVoted;

                    return (
                      <Card
                        key={question.id}
                        size="small"
                        style={{ marginBottom: 16, borderRadius: 8 }}
                        styles={{
                          header: {
                            background: question.hasVoted ? "#f6ffed" : "#fafafa",
                            borderRadius: "8px 8px 0 0",
                          }
                        }}
                        title={
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span
                              style={{
                                background: question.hasVoted ? "#52c41a" : "#1890ff",
                                color: "#fff",
                                borderRadius: "50%",
                                width: 22,
                                height: 22,
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {qIndex + 1}
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{question.text}</span>
                            {question.hasVoted && (
                              <Tag color="success" style={{ marginLeft: "auto", flexShrink: 0 }}>
                                <CheckCircleOutlined style={{ marginRight: 3 }} />
                                {intl.formatMessage({ id: "polls.detail.tagVoted" })}
                              </Tag>
                            )}
                          </div>
                        }
                      >
                        {showResults ? (
                          <div>
                            {(question.options || []).map((option, idx) => {
                              const isVoted = option.id === question.userVotedOptionId;
                              const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                              return (
                                <div key={option.id} className="poll-option" style={{ marginBottom: 12 }}>
                                  <div className="option-label">
                                    <span style={{ fontWeight: isVoted ? 700 : 400, color: isVoted ? color : "inherit" }}>
                                      {isVoted && <CheckCircleOutlined style={{ marginRight: 6, color }} />}
                                      {option.text}
                                    </span>
                                    <span style={{ color: "#888", fontWeight: 600, fontSize: 13 }}>
                                      {intl.formatMessage(
                                        { id: "polls.detail.optionVotes" },
                                        {
                                          count: option.voteCount,
                                          percent: option.votePercentage?.toFixed(1) || 0,
                                        }
                                      )}
                                    </span>
                                  </div>
                                  <Progress
                                    percent={option.votePercentage || 0}
                                    strokeColor={color}
                                    showInfo={false}
                                    style={{ marginBottom: 0 }}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : showVoting ? (
                          <Radio.Group
                            value={selectedOptions[question.id] || null}
                            onChange={(e) =>
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [question.id]: e.target.value,
                              }))
                            }
                            style={{ width: "100%" }}
                          >
                            <Space direction="vertical" style={{ width: "100%" }}>
                              {(question.options || []).map((option) => (
                                <Radio
                                  key={option.id}
                                  value={option.id}
                                  style={{
                                    padding: "10px 16px",
                                    background:
                                      selectedOptions[question.id] === option.id
                                        ? "#e6f7ff"
                                        : "#fafafa",
                                    border: `1px solid ${
                                      selectedOptions[question.id] === option.id
                                        ? "#1890ff"
                                        : "#d9d9d9"
                                    }`,
                                    borderRadius: 6,
                                    width: "100%",
                                    fontSize: 14,
                                  }}
                                >
                                  {option.text}
                                </Radio>
                              ))}
                            </Space>
                          </Radio.Group>
                        ) : notStarted ? (
                          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                            {intl.formatMessage({ id: "polls.detail.notStartedYet" })}
                          </Typography.Text>
                        ) : null}
                      </Card>
                    );
                  })}

                  {showVoteButton && (
                    <div style={{ marginTop: 8 }}>
                      <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={handleVote}
                        loading={submitting}
                        size="large"
                      >
                        {intl.formatMessage({ id: "polls.detail.voteButton" })}
                      </Button>
                    </div>
                  )}
                </>
              );
            })()}
          </PollDetailWrapper>
        )}
      </Box>
    </LayoutWrapper>
  );
};

export default PollDetail;
