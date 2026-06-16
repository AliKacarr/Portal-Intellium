import React, { useState } from "react";
import { Form } from "@ant-design/compatible";
import "@ant-design/compatible/assets/index.css";
import {
  Comment,
  Avatar,
  Button,
  Input,
  Tooltip,
  Popconfirm,
  message,
} from "antd";
import moment from "moment";
import { IconSvg } from "@iso/components/ScrumBoard/IconSvg/IconSvg";
import RemoveIcon from "@iso/assets/images/icon/02-icon.svg";
import { CommentListWrapper } from "./Comments.style";
import { isEmptyArray } from "formik";
import "moment/locale/tr";
import { addTaskComment, deleteTaskComment } from "../../../Api/ScrumBoardApi";
import { buildApiUrl } from "../../../Api/host";
import { useDispatch, useSelector } from "react-redux";
import scrumBoardActions from "@iso/redux/scrumBoard/actions";

const Comments = (props) => {
  moment.locale("tr");
  const TextArea = Input.TextArea;

  const dispatch = useDispatch();
  const { comments, taskId } = props;
  const [submitting, setSubmitting] = useState(false);
  const [value, setValue] = useState("");
  const currentUser = useSelector((store) => store.Auth);

  const onDeleteComment = async (id) => {
    try {
      const response = await deleteTaskComment(id);
      dispatch(scrumBoardActions.reloadTaskComments(true));
      message.success(response.data.message);
      dispatch(scrumBoardActions.decrementTaskCommentCount(taskId));
    } catch (error) {
      message.error("Yorum silinirken hata meydana geldi");
    }
  };

  const handleSubmit = async () => {
    if (!value) {
      return;
    }

    setSubmitting(true);

    const comment = {
      userId: currentUser.id,
      taskId: taskId,
      content: value,
    };

    try {
      const response = await addTaskComment(comment);
      dispatch(scrumBoardActions.reloadTaskComments(true));
      message.success(response.data.message);
      dispatch(scrumBoardActions.incrementTaskCommentCount(taskId));
    } catch (error) {
      message.error(message.error("Yorum eklenirken hata meydana geldi"));
    }
    setSubmitting(false);
    setValue(undefined);
  };

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

  return (
    <div>
      <Comment
        avatar={
          currentUser.imageUrl ? (
            <Avatar
              src={buildApiUrl(currentUser.imageUrl)}
            />
          ) : (
            <Avatar
              style={{
                backgroundColor: getColorById(currentUser.id),
              }}
            >
              {currentUser.name.charAt(0).toUpperCase()}
            </Avatar>
          )
        }
        content={
          <div>
            <Form.Item style={{ marginBottom: 5 }}>
              <TextArea
                autoSize={{ minRows: 3 }}
                onChange={(e) => setValue(e.target.value)}
                value={value}
              />
            </Form.Item>
            <Form.Item>
              <Button
                htmlType="submit"
                loading={submitting}
                onClick={handleSubmit}
                type="primary"
              >
                Yorum yap
              </Button>
            </Form.Item>
          </div>
        }
      />

      {!isEmptyArray(comments) > 0 && (
        <CommentListWrapper>
          {comments &&
            comments.map((comment, index) => (
              <Comment
                key={index}
                author={comment.user.name}
                content={
                  <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word"}}>
                    <span>{comment.content}</span>
                  </pre>
                }
                datetime={
                  <Tooltip
                    title={moment(comment.createdDate).format(
                      "DD.MM.YYYY HH:mm"
                    )}
                  >
                    <p style={{ fontSize: "13px", fontWeight: "400", color: "#979bbe" }}>
                      {moment(comment.createdDate).fromNow()}
                    </p>
                  </Tooltip>
                }
                avatar={
                  comment.user.imageUrl ? (
                    <Avatar
                      src={buildApiUrl(comment.user.imageUrl)}
                    />
                  ) : (
                    <Avatar
                      style={{
                        backgroundColor: getColorById(comment.user.id),
                      }}
                    >
                      {comment.user.name.charAt(0).toUpperCase()}
                    </Avatar>
                  )
                }
              >
                {comment.user.id === currentUser.id && (
                  <div style={{ position: "absolute", top: 15, right: 0 }}>
                    <Popconfirm
                      placement="topRight"
                      title="Yorumu silmek istediğinizden emin misiniz?"
                      okText="Evet"
                      cancelText="Hayır"
                      onConfirm={() => onDeleteComment(comment.id)}
                    >
                      <IconSvg
                        src={RemoveIcon}
                        mr={"0"}
                        width={25}
                        height={25}
                      />
                    </Popconfirm>
                  </div>
                )}
              </Comment>
            ))}
        </CommentListWrapper>
      )}
    </div>
  );
};

export default Comments;
