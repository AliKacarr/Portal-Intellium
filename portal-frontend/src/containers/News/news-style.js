import styled from "styled-components";
import { palette } from "styled-theme";
import WithDirection from "@iso/lib/helpers/rtl";
import BoxComponent from "@iso/components/utility/box";

const BoxWrapper = styled(BoxComponent)`
  .isoProjectTableBtn {
    display: flex;
    margin-bottom: 30px;
    a {
      margin-left: auto;
    }
  }

  .portal-filter-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .portal-filter-search,
  .portal-filter-date,
  .portal-filter-control .ant-select-selector,
  .portal-filter-clear {
    border-radius: 10px !important;
    border-color: #e5e7eb !important;
    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
    transition: all 0.2s ease;
  }

  .portal-filter-search:hover,
  .portal-filter-date:hover,
  .portal-filter-control:hover .ant-select-selector,
  .portal-filter-clear:hover {
    border-color: #91caff !important;
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.12);
  }

  .portal-filter-search,
  .portal-filter-date,
  .portal-filter-control .ant-select-selector,
  .portal-filter-clear {
    height: 34px !important;
  }

  .portal-filter-control .ant-select-selector {
    display: flex;
    align-items: center;
  }

  .portal-filter-control .ant-select-selection-item,
  .portal-filter-control .ant-select-selection-placeholder {
    line-height: 32px !important;
    font-weight: 500;
  }

  .portal-filter-clear {
    padding: 0 14px;
    font-weight: 500;
  }
`;

const Box = WithDirection(BoxWrapper);

const NewsCard = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 100%;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
    transform: translateY(-2px);
  }

  .news-image {
    width: 100%;
    height: 180px;
    object-fit: cover;
    background: ${palette("secondary", 1)};
  }

  .news-image-placeholder {
    width: 100%;
    height: 180px;
    background: ${palette("secondary", 1)};
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    color: ${palette("text", 3)};
  }

  .news-content {
    padding: 16px;
  }

  .news-title {
    font-size: 15px;
    font-weight: 600;
    color: ${palette("text", 0)};
    margin-bottom: 8px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .news-meta {
    font-size: 12px;
    color: ${palette("text", 3)};
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .news-excerpt {
    font-size: 13px;
    color: ${palette("text", 1)};
    margin: 8px 0;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const NewsDetailWrapper = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 32px;

  .news-detail-image {
    width: 100%;
    max-height: 400px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 24px;
  }

  .news-detail-title {
    font-size: 24px;
    font-weight: 700;
    color: ${palette("text", 0)};
    margin-bottom: 12px;
  }

  .news-detail-meta {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid ${palette("border", 0)};
    flex-wrap: wrap;
    color: ${palette("text", 3)};
    font-size: 13px;
  }

  .news-detail-content {
    font-size: 15px;
    line-height: 1.8;
    color: ${palette("text", 1)};
    margin-bottom: 32px;
  }

  .comments-section {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid ${palette("border", 0)};
  }

  .comment-item {
    padding: 12px 0;
    border-bottom: 1px solid ${palette("border", 0)};

    &.comment-reply {
      margin-left: 40px;
      padding-left: 16px;
      border-left: 2px solid ${palette("border", 0)};
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .comment-user {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .comment-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .comment-author {
      font-weight: 600;
      color: ${palette("text", 0)};
    }

    .comment-date {
      font-size: 12px;
      color: ${palette("text", 3)};
      margin-left: 8px;
    }

    .comment-content {
      margin-top: 6px;
      color: ${palette("text", 1)};
      overflow-wrap: anywhere;
      white-space: pre-wrap;
    }

    .comment-replies {
      margin-top: 8px;
    }

    .comment-reply-form {
      margin-top: 12px;
      margin-left: 40px;
    }

    .comment-reply-form-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
  }

  @media only screen and (max-width: 575px) {
    .comment-item {
      &.comment-reply,
      .comment-reply-form {
        margin-left: 16px;
      }

      .comment-header {
        flex-direction: column;
      }

      .comment-actions {
        margin-left: 40px;
      }
    }
  }
`;

const AdminActionBar = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-bottom: 16px;
`;

export { Box, NewsCard, NewsDetailWrapper, AdminActionBar };
