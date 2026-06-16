import React, { useEffect, useState } from "react";
import { useParams, useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import {
  Breadcrumb,
  Button,
  Form,
  Input,
  Empty,
  Spin,
  Tag,
  message,
  Avatar,
  Popconfirm,
  Typography,
  Modal,
  List,
} from "antd";
import {
  ArrowLeftOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
  SendOutlined,
  DeleteOutlined,
  CommentOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import moment from "moment";
import "moment/locale/tr";
import "moment/locale/en-gb";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import PortalContentView from "@iso/components/Custom/PortalContentEditor/PortalContentView";
import IntlMessages from "@iso/components/utility/intlMessages";
import { Box, NewsDetailWrapper } from "./news-style";
import { hasNewsImage, newsImageSrc } from "./newsImageUrl";
import {
  GetNewsById,
  GetNewsByNewsId,
  AddNewsComment,
  DeleteNewsComment,
  GetNewsViewers,
} from "../../Api/NewsApi";

const { TextArea } = Input;
const ADMIN_WORKER_ROLES = ["admin", "worker"];
const COMMENT_REPLY_FIELDS = ["replies", "children", "newsCommentReplies", "commentReplies"];

const getCommentReplies = (comment) => {
  for (const field of COMMENT_REPLY_FIELDS) {
    if (Array.isArray(comment?.[field])) {
      return comment[field];
    }
  }

  return [];
};

const getCommentParentId = (comment) =>
  comment?.parentCommentId ||
  comment?.parentId ||
  comment?.parentNewsCommentId ||
  comment?.replyToCommentId ||
  null;

const normalizeComments = (comments = []) => {
  const commentMap = new Map();
  const rootComments = [];

  comments.forEach((comment) => {
    const nestedReplies = getCommentReplies(comment);
    commentMap.set(comment.id, { ...comment, replies: nestedReplies.map((reply) => ({ ...reply, replies: [] })) });
  });

  commentMap.forEach((comment) => {
    const parentId = getCommentParentId(comment);

    if (parentId && commentMap.has(parentId)) {
      const parentComment = commentMap.get(parentId);
      parentComment.replies = [...getCommentReplies(parentComment), { ...comment, replies: [] }];
      return;
    }

    rootComments.push(comment);
  });

  return rootComments;
};

const countComments = (comments = []) =>
  comments.reduce((total, comment) => total + 1 + getCommentReplies(comment).length, 0);

const NewsDetail = () => {
  const intl = useIntl();
  const { id } = useParams();
  const history = useHistory();
  const userRole = useSelector((state) => state.Auth.role?.roleName);
  const userId = useSelector((state) => state.Auth.id);
  const isAdminOrWorker = ADMIN_WORKER_ROLES.includes(userRole);

  const [form] = Form.useForm();
  const [news, setNews] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState(null);
  const [replyContents, setReplyContents] = useState({});
  const [replySubmittingId, setReplySubmittingId] = useState(null);
  const [viewersModalVisible, setViewersModalVisible] = useState(false);
  const [viewersList, setViewersList] = useState([]);
  const [viewersLoading, setViewersLoading] = useState(false);
  const [coverImageFailed, setCoverImageFailed] = useState(false);

  useEffect(() => {
    moment.locale(intl.locale?.toLowerCase().startsWith("tr") ? "tr" : "en");
  }, [intl.locale]);

  useEffect(() => {
    setCoverImageFailed(false);
    fetchNews();
    fetchComments();
  }, [id]);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await GetNewsById(id);
      setNews(response.data.data);
    } catch {
      message.error(intl.formatMessage({ id: "news.detail.loadError" }));
    } finally {
      setLoading(false);
    }
  };

  const fetchViewers = async () => {
    setViewersLoading(true);
    setViewersModalVisible(true);
    try {
      const response = await GetNewsViewers(id);
      setViewersList(response.data.data || []);
    } catch {
      message.error("Görüntüleyenler yüklenirken hata oluştu.");
    } finally {
      setViewersLoading(false);
    }
  };

  const fetchComments = async () => {
    setCommentLoading(true);
    try {
      const response = await GetNewsByNewsId(id);
      setComments(normalizeComments(response.data.data || []));
    } catch {
      setComments([]);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddComment = async (values) => {
    setSubmitting(true);
    try {
      await AddNewsComment({ content: values.content, newsId: Number(id) });
      message.success(intl.formatMessage({ id: "news.messages.commentAdded" }));
      form.resetFields();
      fetchComments();
    } catch {
      message.error(intl.formatMessage({ id: "news.messages.commentAddError" }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCommentReply = async (commentId) => {
    const content = replyContents[commentId]?.trim();

    if (!content) {
      message.error(intl.formatMessage({ id: "news.comments.addRule" }));
      return;
    }

    setReplySubmittingId(commentId);
    try {
      await AddNewsComment({ content, newsId: Number(id), parentCommentId: commentId });
      message.success(intl.formatMessage({ id: "news.messages.commentAdded" }));
      setReplyContents((currentContents) => ({ ...currentContents, [commentId]: "" }));
      setActiveReplyCommentId(null);
      fetchComments();
    } catch {
      message.error(intl.formatMessage({ id: "news.messages.commentAddError" }));
    } finally {
      setReplySubmittingId(null);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await DeleteNewsComment(commentId);
      message.success(intl.formatMessage({ id: "news.messages.commentDeleted" }));
      fetchComments();
    } catch {
      message.error(intl.formatMessage({ id: "news.messages.commentDeleteError" }));
    }
  };

  const renderCommentItem = (comment, depth = 0) => {
    const canReply = depth === 0;
    const replies = canReply ? getCommentReplies(comment) : [];
    const isReplyFormOpen = activeReplyCommentId === comment.id;
    const canDeleteComment = isAdminOrWorker || Number(comment.userId) === Number(userId);

    return (
      <div key={comment.id} className={`comment-item${depth > 0 ? " comment-reply" : ""}`}>
        <div className="comment-header">
          <div className="comment-user">
            <Avatar size={32} icon={<UserOutlined />} />
            <div>
              <span className="comment-author">
                {comment.userName || intl.formatMessage({ id: "news.comments.userFallback" })}
              </span>
              <span className="comment-date">{moment(comment.createdAt).fromNow()}</span>
            </div>
          </div>
          <div className="comment-actions">
            {canReply && (
              <Button
                type="link"
                size="small"
                onClick={() => setActiveReplyCommentId(isReplyFormOpen ? null : comment.id)}
              >
                {intl.formatMessage({ id: "news.comments.reply" })}
              </Button>
            )}
            {canDeleteComment && (
              <Popconfirm
                title={intl.formatMessage({ id: "news.comments.deleteConfirm" })}
                onConfirm={() => handleDeleteComment(comment.id)}
                okText={intl.formatMessage({ id: "notification.common.yes" })}
                cancelText={intl.formatMessage({ id: "notification.common.no" })}
              >
                <Button type="text" icon={<DeleteOutlined />} size="small" danger />
              </Popconfirm>
            )}
          </div>
        </div>
        <div className="comment-content">{comment.content}</div>

        {isReplyFormOpen && (
          <div className="comment-reply-form">
            <TextArea
              rows={2}
              value={replyContents[comment.id] || ""}
              placeholder={intl.formatMessage({ id: "news.comments.replyPlaceholder" })}
              onChange={(event) =>
                setReplyContents((currentContents) => ({
                  ...currentContents,
                  [comment.id]: event.target.value,
                }))
              }
            />
            <div className="comment-reply-form-actions">
              <Button
                type="primary"
                size="small"
                loading={replySubmittingId === comment.id}
                icon={<SendOutlined />}
                onClick={() => handleAddCommentReply(comment.id)}
              >
                {intl.formatMessage({ id: "news.comments.submit" })}
              </Button>
              <Button size="small" onClick={() => setActiveReplyCommentId(null)}>
                {intl.formatMessage({ id: "news.comments.cancel" })}
              </Button>
            </div>
          </div>
        )}

        {replies.length > 0 && <div className="comment-replies">{replies.map((reply) => renderCommentItem(reply, 1))}</div>}
      </div>
    );
  };

  return (
    <LayoutWrapper>
      <Box style={{ marginTop: "-20px" }}>
        <Breadcrumb style={{ margin: "6px 0 20px 0" }}>
          <Breadcrumb.Item>
            <span
              style={{ cursor: "pointer", color: "#1890ff" }}
              onClick={() => history.push("/dashboard/news")}
            >
              <IntlMessages id="sidebar.news" />
            </span>
          </Breadcrumb.Item>
          {news && <Breadcrumb.Item>{news.title}</Breadcrumb.Item>}
        </Breadcrumb>

        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => history.push("/dashboard/news")}
          style={{ marginBottom: 16 }}
        >
          {intl.formatMessage({ id: "news.detail.back" })}
        </Button>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Spin size="large" />
          </div>
        ) : !news ? (
          <Empty description={intl.formatMessage({ id: "news.detail.notFound" })} style={{ padding: "60px 0" }} />
        ) : (
          <NewsDetailWrapper>
            {hasNewsImage(news.imageUrl) && !coverImageFailed && (
              <img
                src={newsImageSrc(news.imageUrl)}
                alt={news.title}
                className="news-detail-image"
                onError={() => setCoverImageFailed(true)}
              />
            )}

            <div className="news-detail-title">{news.title}</div>

            <div className="news-detail-meta">
              {isAdminOrWorker && (
                <span>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {news.createdByName}
                </span>
              )}
              <span>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {moment(news.publishDate).format("DD MMMM YYYY, HH:mm")}
              </span>
              {isAdminOrWorker && (
                <span 
                  onClick={fetchViewers} 
                  style={{ cursor: "pointer", color: "#1890ff" }}
                  title="Görüntüleyenleri Gör"
                >
                  <EyeOutlined style={{ marginRight: 4 }} />
                  {intl.formatMessage({ id: "news.detail.views" }, { count: news.viewCount })}
                </span>
              )}
              {news.departmentName && <Tag color="geekblue">{news.departmentName}</Tag>}
              {news.newsCategoryName && <Tag color="purple">{news.newsCategoryName}</Tag>}
            </div>

            {news.tags && (
              <div style={{ marginBottom: 16 }}>
                <TagsOutlined style={{ marginRight: 6, color: "#888" }} />
                {news.tags.split(",").map((tag) => (
                  <Tag key={tag.trim()} color="blue" style={{ marginBottom: 2 }}>
                    {tag.trim()}
                  </Tag>
                ))}
              </div>
            )}

            <PortalContentView content={news.content} className="news-detail-content" />

            {news.isCommentable && (
              <div className="comments-section">
                <Typography.Title level={5} style={{ marginBottom: 16 }}>
                  <CommentOutlined style={{ marginRight: 8 }} />
                  {intl.formatMessage({ id: "news.comments.title" }, { count: countComments(comments) })}
                </Typography.Title>

                {commentLoading ? (
                  <div style={{ textAlign: "center", padding: 20 }}>
                    <Spin />
                  </div>
                ) : comments.length === 0 ? (
                  <Empty
                    description={intl.formatMessage({ id: "news.comments.empty" })}
                    style={{ padding: "20px 0" }}
                  />
                ) : (
                  <div>{comments.map((comment) => renderCommentItem(comment))}</div>
                )}

                <div style={{ marginTop: 20 }}>
                  <Form form={form} onFinish={handleAddComment} layout="vertical">
                    <Form.Item
                      name="content"
                      rules={[
                        {
                          required: true,
                          message: intl.formatMessage({ id: "news.comments.addRule" }),
                        },
                      ]}
                    >
                      <TextArea rows={3} placeholder={intl.formatMessage({ id: "news.comments.placeholder" })} />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 0 }}>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitting}
                        icon={<SendOutlined />}
                      >
                        {intl.formatMessage({ id: "news.comments.submit" })}
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              </div>
            )}
          </NewsDetailWrapper>
        )}

        <Modal
          title="Görüntüleyenler"
          open={viewersModalVisible}
          onCancel={() => setViewersModalVisible(false)}
          footer={null}
          destroyOnClose
        >
          <List
            loading={viewersLoading}
            itemLayout="horizontal"
            dataSource={viewersList}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Avatar icon={<UserOutlined />} />}
                  title={item.userName}
                  description={moment(item.viewedAt).format("DD.MM.YYYY HH:mm")}
                />
              </List.Item>
            )}
            locale={{ emptyText: "Henüz görüntüleyen yok." }}
          />
        </Modal>
      </Box>
    </LayoutWrapper>
  );
};

export default NewsDetail;
