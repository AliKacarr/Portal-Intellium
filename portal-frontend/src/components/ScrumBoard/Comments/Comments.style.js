import styled from "styled-components";

export const CommentListWrapper = styled.div`
  .ant-comment-avatar {
    flex-shrink: 0;
    position: relative;
    margin-right: 16px;
    cursor: pointer;
    width: 35px;
    height: 35px;
  }
  .ant-comment-content-author {
    font-size: 14px;
    display: flex;
    justify-content: flex-start;
  }
  .ant-comment-content-author > a,
  .ant-comment-content-author > span {
    height: auto;
    padding-right: 8px;
    font-size: 16px;
    line-height: 30px;
    color: #788195;
    font-family: "Roboto";
    font-weight: 500;
  }
  .ant-comment-content-author-time > span {
    font-size: 14px;
    line-height: 30px;
    color: #8c90b5;
    font-family: "Roboto";
    font-weight: 400;
  }
  .ant-comment-content-detail {
    font-size: 14px;
    line-height: 22px;
    color: #2d3446;
    font-family: "Roboto";
    font-weight: 400;
  }
`;
