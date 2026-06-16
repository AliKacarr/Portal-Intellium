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

const PollCard = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-top: 3px solid ${(props) =>
    props.isExpired ? "#d9d9d9" : props.hasVoted ? "#52c41a" : "#1890ff"};
  height: 100%;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.14);
    transform: translateY(-2px);
  }

  .poll-title {
    font-size: 15px;
    font-weight: 600;
    color: ${palette("text", 0)};
    margin-bottom: 6px;
  }

  .poll-question {
    font-size: 12px;
    color: ${palette("text", 3)};
    margin-bottom: 12px;
    font-style: italic;
  }

  .poll-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: ${palette("text", 3)};
    flex-wrap: wrap;
    margin-top: 8px;
  }
`;

const PollDetailWrapper = styled.div`
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 32px;

  .poll-detail-title {
    font-size: 22px;
    font-weight: 700;
    color: ${palette("text", 0)};
    margin-bottom: 8px;
  }

  .poll-detail-meta {
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

  .poll-option {
    margin-bottom: 12px;

    .option-label {
      font-size: 14px;
      color: ${palette("text", 1)};
      margin-bottom: 4px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
`;

export { Box, PollCard, PollDetailWrapper };
