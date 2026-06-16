import React, { useEffect, useState } from "react";
import { Button, Input, List, Comment, Card, Avatar, message } from "antd";
import { useIntl } from "react-intl";
import {
  CreateTicketComment,
  GetAllComments,
} from "../../Api/TicketCommentApi";
import { buildApiUrl } from "../../Api/host";
import moment from "moment";
import TicketComment from "./TicketComment";
import "moment/locale/tr";
import { useSelector } from "react-redux";

moment.locale("tr");
const { TextArea } = Input;

const TicketCommentList = ({ ticketId, isActive }) => {
  const intl = useIntl();
  const [comments, setComments] = useState([]);
  const [commentContent, setCommentContent] = useState("");

  const loggedUser = useSelector((state) => state.Auth);
  const [createCommentApiProgress, setCreateCommentApiProgress] =
    useState(false);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    getComments();
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  const createCommentToTicket = async () => {
    const content = commentContent.trim();
    const commentData = {
      ticketId: ticketId,
      content,
      userId: loggedUser.id,
    };
    if (!content) {
      message.error(intl.formatMessage({ id: "tickets.comments.toast.empty" }));
      return;
    }
    try {
      setCreateCommentApiProgress(true);
      await CreateTicketComment(commentData);
      message.success(
        intl.formatMessage({ id: "tickets.comments.toast.addSuccess" })
      );
      getComments();
      setCommentContent("");
    } catch (error) {
      message.error(
        intl.formatMessage({ id: "tickets.comments.toast.addError" })
      );
    } finally {
      setCreateCommentApiProgress(false);
    }
  };

  const getComments = async () => {
    try {
      const response = await GetAllComments(ticketId);
      setComments(response.data.data.reverse());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

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

     return (
          <div>
               <Card
                    title={intl.formatMessage({ id: "tickets.comments.title" })}
                    size="small"
                    style={{ padding: 10 }}
               >
                    {isActive && (
                         <Comment
                              avatar={
                                   loggedUser.imageUrl ? (
                                        <Avatar
                                             src={buildApiUrl(loggedUser.imageUrl)}
                                             alt={loggedUser.name}
                                        />
                                   ) : (
                                        <Avatar
                                             style={{
                                                  backgroundColor: getColorById(loggedUser.id),
                                             }}
                                             alt={loggedUser.name}
                                        >
                                             {loggedUser.name.charAt(0).toUpperCase()}
                                        </Avatar>
                                   )
                              }
                              content={
                                   <>
                                        <TextArea
                                             autoSize={{ minRows: 3 }}
                                             onChange={(e) => setCommentContent(e.target.value)}
                                             value={commentContent}
                                             showCount
                                             maxLength={500}
                                        />

                <Button
                  style={{ marginTop: 8, background: "#50727B", color: "#fff" }}
                  htmlType="submit"
                  onClick={() => createCommentToTicket()}
                  loading={createCommentApiProgress}
                >
                  {intl.formatMessage({ id: "tickets.comments.add" })}
                </Button>
              </>
            }
          />
        )}

        {comments && (
          <List
            header={intl.formatMessage(
              { id: "tickets.comments.count" },
              { count: comments.length }
            )}
            itemLayout="vertical"
            dataSource={comments}
            renderItem={(comment) => (
              <li key={comment.id}>
                <TicketComment
                  comment={comment}
                  commentId={comment.id}
                  isReply={false}
                  refreshList={getComments}
                  isActive={isActive}
                >
                  {comment.ticketCommentReplies &&
                    comment.ticketCommentReplies.map((reply) => (
                      <TicketComment
                        key={reply.id}
                        comment={reply}
                        isReply={true}
                        commentId={comment.id}
                        refreshList={getComments}
                        isActive={false}
                      />
                    ))}
                </TicketComment>
              </li>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default TicketCommentList;
