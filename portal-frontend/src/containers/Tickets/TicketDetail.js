import React, { useEffect, useState } from "react";
import {
  Badge,
  Descriptions,
  Breadcrumb,
  Card,
  Upload,
  Tag,
  Space,
  Avatar,
  Button,
} from "antd";
import { useSelector } from "react-redux";
import { FieldTimeOutlined } from "@ant-design/icons";
import { Box } from "./Ticket.styles";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PageHeader from "@iso/components/utility/pageHeader";
import EditTicket from "./EditTicket";
import { useParams } from "react-router-dom/cjs/react-router-dom.min";
import { GetTicketById } from "../../Api/TicketApi";
import moment from "moment";
import "moment/locale/tr";
import TicketCommentList from "./TicketCommentList";
import { GetTicketAttachments } from "../../Api/TicketAttachmentApi";
import { buildApiUrl } from "../../Api/host";
import AssignMeToTicketButton from "../../components/Ticket/AssignMeToTicketButton";
import MarkAsResolveButton from "../../components/Ticket/MarkAsResolveButton";
import { v4 as uuidv4 } from "uuid";
import UploadTicketAttachment from "../../components/Ticket/UploadTicketAttachment";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import EffortSection from "./EffortSection";
import { useIntl } from "react-intl";

moment.locale("tr");
//////////////

export default function Details() {
  const { id } = useParams();
  const intl = useIntl();
  const [ticketData, setTicketData] = useState(null);
  const [refreshDetail, setRefreshDetail] = useState(false);
  const [attachments, setAttachments] = useState();
  const [isEffortModalOpen, setIsEffortModalOpen] = useState(false);
  const loggedUser = useSelector((state) => state.Auth);

  function safelyParseJSON(jsonString) {
    try {
      if (!jsonString) return [];
      const parsed = JSON.parse(jsonString);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  const getTicketData = async () => {
    try {
      const response = await GetTicketById(id);
      setTicketData(response.data.data);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    }
  };

  const getTicketAttachmentsData = async () => {
    try {
      const response = await GetTicketAttachments(id);
      if (response.data.data.length > 0) {
        setAttachments(() =>
          response.data.data.map((attachment) => ({
            uid: attachment.id,
            name: attachment.name,
            url: buildApiUrl(attachment.attachmentPath),
            status: "done",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching ticket attachments:", error);
    }
  };

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    getTicketData();
    getTicketAttachmentsData();
  }, [id]);

  useEffect(() => {
    if (refreshDetail) {
      getTicketData();
      setRefreshDetail(false);
    }
  }, [refreshDetail]);
  /* eslint-enable react-hooks/exhaustive-deps */

  function requestColor(requestType) {
    const colors = Object.freeze({
      NEW_FEATURE: "#87AEEE",
      SUPPORT: "#FFA07A",
      IMPROVEMENT: "#88D498",
      ERROR: "#E65C54",
      DEFAULT: "#292D3E",
    });

    // Renkler dizisi
    switch (requestType) {
      case "Report a BUG":
        return colors.ERROR;
      case "Technical Support":
        return colors.SUPPORT;
      case "Suggest a New Feature":
        return colors.NEW_FEATURE;
      case "Suggest Improvement":
        return colors.IMPROVEMENT;
      default:
        return colors.DEFAULT;
    }
  }

  // Renkler dizisi
  function getColorById(id) {
    // Renkler dizisi
    const customColors = [
      "#6895D2",
      "#A4CE95",
      "#D04848",
      "#F3B95F",
      "#FDE767",
    ];

    // ID'ye göre indeks hesaplanması
    const index = id % customColors.length;

    // ID'ye göre belirlenen renk döndürülmesi
    return customColors[index];
  }

  //
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  /// responsive ayarlar
  const layout = windowWidth < 650 ? "vertical" : "horizontal";

  const column = windowWidth < 1024 ? 1 : 2;

  const margin = windowWidth < 1024 ? { margin: 0 } : { margin: "0 20px" };
  //

  return (
    <LayoutWrapper>
      {ticketData && (
        <Box style={{ marginTop: "-20px" }}>
          <Breadcrumb style={{ marginBottom: "20px" }}>
            <Breadcrumb.Item>{intl.formatMessage({ id: "tickets.detail.breadcrumb.ticket" })}</Breadcrumb.Item>
            <Breadcrumb.Item>{intl.formatMessage({ id: "tickets.detail.breadcrumb.detail" })}</Breadcrumb.Item>
            <Breadcrumb.Item>{ticketData.id}</Breadcrumb.Item>
          </Breadcrumb>
          <PageHeader>
            {intl.formatMessage({ id: "tickets.detail.pageTitle" })}
          </PageHeader>

          <div style={margin}>
            <Descriptions
              size="small"
              labelStyle={{ width: 200 }}
              bordered
              column={column}
              extra={
                <Space>
                  {!ticketData.assignedUser &&
                    ticketData.status !== 2 &&
                    (loggedUser.role.roleName === "admin" ||
                      loggedUser.role.roleName === "worker") && (
                      <AssignMeToTicketButton
                        ticketId={id}
                        projectId={ticketData.project.id}
                        refreshDetail={setRefreshDetail}
                      />
                    )}

                  {ticketData.status === 1 &&
                    (loggedUser.role.roleName === "admin" ||
                      loggedUser.id === ticketData.assignedUser.id) && (
                      <Button
                        type="dashed"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        icon={<FieldTimeOutlined />}
                        onClick={() => setIsEffortModalOpen(true)}
                      >
                        {intl.formatMessage({ id: "tickets.detail.effortEntry" })}
                      </Button>
                    )}

                  {ticketData.status !== 2 &&
                    (ticketData.creatorUser.id === loggedUser.id ||
                      (ticketData.assignedUser &&
                        ticketData.assignedUser.id === loggedUser.id)) && (
                      <UploadTicketAttachment
                        ticketId={ticketData.id}
                        refreshAttachment={getTicketAttachmentsData}
                      />
                    )}

                  {loggedUser.role.roleName === "admin" && (
                    <EditTicket
                      key={uuidv4()}
                      ticketData={ticketData}
                      refreshDetail={setRefreshDetail}
                    />
                  )}

                  {ticketData.status !== 2 &&
                    ticketData.creatorUser.id === loggedUser.id && (
                      <MarkAsResolveButton
                        ticketId={id}
                        refreshDetail={setRefreshDetail}
                      />
                    )}
                </Space>
              }
              layout={layout}
            >
              <Descriptions.Item label={intl.formatMessage({ id: "tickets.detail.labels.name" })}>
                {ticketData.name}
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: "tickets.detail.labels.status" })}>
                <Space>
                  {ticketData.status === 0 ? (
                    <Badge
                      status="processing"
                      color="#5AB2FF"
                      text={intl.formatMessage({ id: "tickets.status.new" })}
                    />
                  ) : ticketData.status === 1 ? (
                    <Badge
                      status="processing"
                      color="#AD88C6"
                      text={intl.formatMessage({ id: "tickets.status.assigned" })}
                    />
                  ) : (
                    <Badge
                      status="processing"
                      color="#7ABA78"
                      text={intl.formatMessage({ id: "tickets.status.resolved" })}
                    />
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label={intl.formatMessage({ id: "tickets.detail.labels.creator" })}>
                <div>
                  {ticketData.creatorUser.imageUrl ? (
                    <Avatar
                      src={buildApiUrl(ticketData.creatorUser.imageUrl)}
                    />
                  ) : (
                    <Avatar
                      style={{
                        backgroundColor: getColorById(
                          ticketData.creatorUser.id
                        ),
                      }}
                    >
                      {ticketData.creatorUser.name.charAt(0).toUpperCase()}
                    </Avatar>
                  )}
                  <span style={{ margin: 10 }}>
                    {ticketData.creatorUser.name}
                  </span>
                </div>
              </Descriptions.Item>

              {ticketData.assignedUser && (
                <Descriptions.Item label={intl.formatMessage({ id: "tickets.detail.labels.assignedUser" })}>
                  <div>
                    {ticketData.assignedUser.imageUrl ? (
                      <Avatar
                        src={buildApiUrl(ticketData.assignedUser.imageUrl)}
                      />
                    ) : (
                      <Avatar
                        style={{
                          backgroundColor: getColorById(
                            ticketData.assignedUser.id
                          ),
                        }}
                      >
                        {ticketData.assignedUser.name.charAt(0).toUpperCase()}
                      </Avatar>
                    )}
                    <span style={{ margin: 10 }}>
                      {ticketData.assignedUser.name}
                    </span>
                  </div>
                </Descriptions.Item>
              )}

              <Descriptions.Item label={intl.formatMessage({ id: "tickets.detail.labels.requestType" })}>
                {safelyParseJSON(ticketData.requestType).length > 0 ? (
                  safelyParseJSON(ticketData.requestType).map((type, index) => (
                    <Tag
                      key={`${type}-${index}`}
                      style={{
                        minWidth: 70,
                        borderRadius: 3,
                        textAlign: "center",
                      }}
                      bordered={false}
                      color={requestColor(type)}
                    >
                      {type}
                    </Tag>
                  ))
                ) : (
                  intl.formatMessage({ id: "tickets.requestType.unspecified" })
                )}
              </Descriptions.Item>

              <Descriptions.Item label={intl.formatMessage({ id: "tickets.detail.labels.projectName" })}>
                {ticketData.project.projectName}
              </Descriptions.Item>
              <Descriptions.Item label={intl.formatMessage({ id: "tickets.detail.labels.creationDate" })}>
                {moment(ticketData.creationDate).format("DD MMMM YYYY HH:mm")}
              </Descriptions.Item>

              {ticketData.assignedDate && (
                <Descriptions.Item label={intl.formatMessage({ id: "tickets.detail.labels.assignedDate" })}>
                  {moment(ticketData.assignedDate).format(
                    "DD MMMM YYYY  HH:mm"
                  )}
                </Descriptions.Item>
              )}

              {ticketData.resolutionDate && (
                <Descriptions.Item label={intl.formatMessage({ id: "tickets.detail.labels.resolutionDate" })}>
                  {moment(ticketData.resolutionDate).format(
                    "DD MMMM YYYY  HH:mm"
                  )}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Space
              direction="vertical"
              size="middle"
              style={{
                width: "100%",
              }}
            >
              <Card title={intl.formatMessage({ id: "tickets.detail.card.description" })} size="small">
                <ReactMarkdown
                  children={ticketData.description
                    .split("\n\n")
                    .map((paragraph) => paragraph.split("\n").join("  \n"))
                    .join("\n\n")}
                  remarkPlugins={[remarkGfm]}
                />
              </Card>
            </Space>

            {attachments && (
              <Space
                direction="vertical"
                size="middle"
                style={{
                  width: "100%",
                }}
              >
                <Badge.Ribbon text={intl.formatMessage({ id: "tickets.detail.attachments.ribbon" })} color="#A1C398">
                  <Card title={intl.formatMessage({ id: "tickets.detail.attachments.cardTitle" })} size="small">
                    <Upload
                      showUploadList={{
                        showDownloadIcon: true,
                        downloadIcon: intl.formatMessage({
                          id: "tickets.detail.attachments.downloadIcon",
                        }),
                        showRemoveIcon: false,
                      }}
                      fileList={attachments}
                    />
                  </Card>
                </Badge.Ribbon>
              </Space>
            )}

            {/* Efor Bölümü */}
            <EffortSection
              assignedUserId={ticketData.assignedUser?.id ?? null}
              ticketId={ticketData.id}
              isModalOpen={isEffortModalOpen}
              setIsModalOpen={setIsEffortModalOpen}
            />

            <Space
              direction="vertical"
              size="middle"
              style={{
                width: "100%",
              }}
            >
              <TicketCommentList
                ticketId={id}
                isActive={ticketData.status !== 2 ? true : false}
              />
            </Space>
          </div>
        </Box>
      )}
    </LayoutWrapper>
  );
}
