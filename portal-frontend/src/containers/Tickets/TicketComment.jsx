import { Avatar, Comment, Tooltip, Button, message } from "antd";
import moment from "moment";
import React, { useState } from "react";
import "moment/locale/tr";
import TextArea from "antd/lib/input/TextArea";
import { CreateTicketCommentReply } from "../../Api/TicketCommentApi";
import { buildApiUrl } from "../../Api/host";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";

moment.locale("tr");

const TicketComment = ({
  comment,
  isReply,
  children,
  commentId,
  refreshList,
  isActive,
}) => {
  const intl = useIntl();
  const [isCommentReply, setIsCommentReply] = useState(false);
  const [commentContent, setCommentContent] = useState("");
  const loggedUser = useSelector((state) => state.Auth);
  const [createCommentApiProgress, setCreateCommentApiProgress] =
    useState(false);
  const canReply = isActive && !isReply;

  const createCommentReply = async () => {
    const content = commentContent.trim();

    if (!content) {
      message.error(intl.formatMessage({ id: "tickets.comments.toast.empty" }));
      return;
    }

    const commentReplyData = {
      ticketCommentId: commentId,
      content,
      userId: loggedUser.id, // Login sistemi
    };

    try {
      setCreateCommentApiProgress(true);
      await CreateTicketCommentReply(commentReplyData);
      message.success(
        intl.formatMessage({ id: "tickets.comments.toast.addSuccess" })
      );
      setCommentContent("");
      setIsCommentReply(false);
      refreshList();
    } catch (error) {
      message.error(
        intl.formatMessage({ id: "tickets.comments.toast.replyError" })
      );
    } finally {
      setCreateCommentApiProgress(false);
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
               <Comment
                    actions={
                         (isActive && canReply)
                              ? [
                                     <span
                                          onClick={() => {
                                               setIsCommentReply(!isCommentReply);
                                          }}
                                          key={`comment-reply-${comment.id}`}
                                     >
                                          {intl.formatMessage({ id: "tickets.comments.reply" })}
                                     </span>,
                                ]
                              : []
                    }
                    author={comment.user.name}
                    avatar={
                         comment.user.imageUrl ? (
                              <Avatar
                                   size="large"
                                   src={buildApiUrl(comment.user.imageUrl)}
                              />
                         ) : (
                              <Avatar
                                   size="large"
                                   style={{
                                        backgroundColor: getColorById(comment.user.id),
                                   }}
                              >
                                   {comment.user.name.charAt(0).toUpperCase()}
                              </Avatar>
                         )
                    }
                    content={
                         <pre>
                              <span
                                   style={{
                                        overflowWrap: "break-word",
                                        whiteSpace: "pre-wrap",
                                        wordBreak: "break-word",
                                   }}
                              >
                                   {comment.content}
                              </span>
                         </pre>
                    }
                    datetime={
                         <Tooltip title={moment(comment.createdAt).format("DD.MM.YYYY HH:mm")}>
                              <span>{moment(comment.createdAt).fromNow()}</span>
                         </Tooltip>
                    }
               >
                    {isCommentReply && (
                         <Comment
                              avatar={
                                   loggedUser.imageUrl ? (
                                        <Avatar
                                             size="large"
                                             src={buildApiUrl(loggedUser.imageUrl)}
                                        />
                                   ) : (
                                        <Avatar
                                             size="large"
                                             style={{
                                                  backgroundColor: getColorById(loggedUser.id),
                                             }}
                                        >
                                             {loggedUser.name.charAt(0).toUpperCase()}
                                        </Avatar>)
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
                                             style={{
                                                  marginTop: 8,
                                                  background: "#50727B",
                                                  color: "#fff",
                                             }}
                                             type="text"
                                             onClick={() => createCommentReply()}
                                             loading={createCommentApiProgress}
                                        >
                                             {intl.formatMessage({ id: "tickets.comments.replyButton" })}
                                        </Button>
                                        <Button
                                             type="link"
                                             style={{
                                                  marginLeft: 8,
                                                  border: "1px solid gray",
                                                  color: "#565656",
                                             }}
                                             onClick={() => setIsCommentReply(false)}
                                        >
                                             {intl.formatMessage({ id: "tickets.comments.cancel" })}
                                        </Button>
                                   </>
                              }
                         />
                    )}
                    {!isReply && children}
               </Comment>
          </div>
     );
};

export default TicketComment;
