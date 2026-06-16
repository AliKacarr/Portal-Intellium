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

const AnnouncementCard = styled.div`
  background: #fff;
  border-radius: 8px;
  border-top: 4px solid ${(props) =>
    props.priority === "high"
      ? "#ff4d4f"
      : props.priority === "medium"
      ? "#faad14"
      : "#52c41a"};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  cursor: pointer;
  opacity: ${(props) => (props.isExpired ? 0.6 : 1)};

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16);
    transform: translateY(-2px);
  }

  .announcement-title {
    font-size: 16px;
    font-weight: 600;
    color: ${palette("text", 0)};
    margin-bottom: 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .announcement-content {
    font-size: 14px;
    color: ${palette("text", 1)};
    line-height: 1.6;
    margin-bottom: 16px;
    flex-grow: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .announcement-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: ${palette("text", 3)};
    flex-wrap: wrap;
    margin-bottom: 12px;
  }

  .announcement-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid ${palette("border", 0)};
  }
`;

const AnnouncementDetailWrapper = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 32px;
  border-top: 4px solid ${(props) =>
    props.priority === "high"
      ? "#ff4d4f"
      : props.priority === "medium"
      ? "#faad14"
      : "#52c41a"};

  .announcement-detail-title {
    font-size: 24px;
    font-weight: 700;
    color: ${palette("text", 0)};
    margin-bottom: 12px;
  }

  .announcement-detail-meta {
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

  .announcement-detail-content {
    font-size: 15px;
    line-height: 1.8;
    color: ${palette("text", 1)};
  }
`;

export { Box, AnnouncementCard, AnnouncementDetailWrapper };
