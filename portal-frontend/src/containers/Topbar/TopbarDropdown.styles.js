import styled from "styled-components";
import { palette } from "styled-theme";
import {
  transition,
  borderRadius,
  boxShadow,
} from "@iso/lib/helpers/style_utils";
import WithDirection from "@iso/lib/helpers/rtl";


const TopbarDropdownWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  margin: -12px -16px;
  width: 400px;
  min-width: 160px;
  flex-shrink: 0;
  ${borderRadius("5px")};
  ${boxShadow("0 2px 10px rgba(0,0,0,0.2)")};
  ${transition()};
  cursor: pointer;
  @media only screen and (max-width: 767px) {
    width: 350px;
  }

  .isoDropdownHeader {
    display: flex;
    justify-content: left;
    align-items: center;
    border-bottom: 1px solid #f1f1f1;
    margin-bottom: 0px;
    padding: 15px 10px;
    width: 100%;

    h3 {
      font-size: 14px;
      font-weight: 500;
      color: ${palette("text", 0)};
      text-align: center;
      margin-left: 10px;
    }
  }

  .isoDropdownBody {
    width: 100%;
    overflow-y: scroll;
    ::-webkit-scrollbar {
      width: 5px;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
      background: gray;
      border-radius: 30px;
    }
    height: 300px;
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
    background-color: #fff;

    a {
      text-decoration: none;
    }

    .notification-date {
      position: absolute;
      top: 16px;
      right: 10px;
    }

    .notification-content {
      width: 300px;
      @media only screen and (max-width: 767px) {
        width: 250px;
  }
    }
    .isoDropdownListItem {
      padding: 20px;
      text-decoration: none;
      display: flex;
      flex-direction: column;
      text-decoration: none;
      position: relative;
      text-align: ${(props) =>
    props["data-rtl"] === "rtl" ? "right" : "left"};
      width: 100%;
      border-bottom: 1px solid ${palette("border", 2)};
      ${transition()};

      &:hover {
        background-color: ${palette("grayscale", 3)};
      }
      

      .isoListHead {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
      }

      h5 {
        font-size: 13px;
        font-weight: 500;
        color: ${palette("text", 0)};
        margin-top: 0;
        margin-bottom: 3px;
      }

      p {
        font-size: 12px;
        font-weight: 400;
        color: ${palette("text", 2)};
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        
      }

      .isoDate {
        font-size: 11px;
        color: ${palette("grayscale", 1)};
        flex-shrink: 0;
      }
    }
  }

  .isoViewAllBtn {
    color: ${palette("text", 2)};
    padding: 5px 10px;
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    ${transition()};

    &:hover {
      color: ${palette("primary", 0)};
    }
    .isoViewAllBtnIcon {
      font-size: 20px;
    }
  }

  &.withImg {
    .isoDropdownListItem {
      display: flex;
      flex-direction: row;

      .isoImgWrapper {
        width: 35px;
        height: 35px;
        overflow: hidden;
        margin: ${(props) =>
    props["data-rtl"] === "rtl" ? "0 0 0 15px" : "0 15px 0 0"};
        display: -webkit-inline-flex;
        display: -ms-inline-flex;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background-color: ${palette("grayscale", 9)};
        ${borderRadius("50%")};

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .isoListContent {
        width: 100%;
        display: flex;
        flex-direction: column;

        .isoListHead {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        h5 {
          margin-bottom: 0;
          padding: ${(props) =>
    props["data-rtl"] === "rtl" ? "0 0 0 15px" : "0 15px 0 0"};
        }

        .isoDate {
          font-size: 11px;
          color: ${palette("grayscale", 1)};
          flex-shrink: 0;
        }

        p {
          white-space: normal;
          line-height: 1.5;
        }
      }
    }
  }

  &.topbarMail {
    @media only screen and (max-width: 519px) {
      right: -170px;
    }
  }

  &.topbarMessage {
    @media only screen and (max-width: 500px) {
      right: -69px;
    }
  }

  &.topbarAddtoCart {
    @media only screen and (max-width: 465px) {
      right: -55px;
    }

    .isoDropdownHeader {
      margin-bottom: 0;
    }

    .isoDropdownBody {
      background-color: ${palette("grayscale", 6)};
      display: flex;
      flex-direction: column;

      .isoNoItemMsg {
        height: 100%;
        min-height: 260px;
        display: flex;
        align-items: center;
        justify-content: center;

        span {
          font-size: 30px;
          font-weight: 300;
          color: ${palette("grayscale", 1)};
          line-height: 1.2;
        }
      }
    }
  }

  &.topbar-notification-panel {
    margin: 0;
    width: 380px;
    max-width: min(380px, calc(100vw - 24px));
    ${borderRadius("12px")};
    box-shadow: 0 10px 40px rgba(15, 23, 42, 0.12);
    border: 1px solid rgba(148, 163, 184, 0.2);
    cursor: default;
    overflow: hidden;

    .topbar-notification-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid #f1f5f9;
      background: linear-gradient(180deg, #fafbfc 0%, #ffffff 100%);
    }

    .topbar-notification-panel__title {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: ${palette("text", 0)};
      letter-spacing: -0.02em;
    }

    .topbar-notification-panel__headerRight {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-shrink: 0;
    }

    .topbar-notification-panel__clearAll {
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 13px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 8px;
      cursor: pointer;
      ${transition()};

      &:hover {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.08);
      }
    }

    .topbar-notification-panel__seeAll {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 10px;
      color: #64748b;
      ${transition()};

      &:hover {
        color: ${palette("primary", 0)};
        background: rgba(47, 137, 217, 0.08);
      }

      .isoViewAllBtnIcon {
        font-size: 18px;
      }
    }

    .topbar-notification-panel__body {
      max-height: 320px;
      overflow-y: auto;
      background: #fff;

      &::-webkit-scrollbar {
        width: 6px;
      }
      &::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 6px;
      }
    }

    .topbar-notification-item {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      border-bottom: 1px solid #f1f5f9;
      ${transition()};

      &:last-child {
        border-bottom: none;
      }

      &:hover {
        background: #f8fafc;
      }
    }

    .topbar-notification-item__avatar {
      flex-shrink: 0;
      padding-top: 2px;
    }

    .topbar-notification-item__main {
      flex: 1;
      min-width: 0;
      border: none;
      background: transparent;
      padding: 0;
      margin: 0;
      text-align: left;
      cursor: pointer;
      font: inherit;
      color: inherit;
    }

    .topbar-notification-item__row1 {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 4px;
    }

    .topbar-notification-item__title {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: ${palette("text", 0)};
      line-height: 1.35;
      margin: 0;
    }

    .topbar-notification-item__time {
      font-size: 11px;
      color: #94a3b8;
      white-space: nowrap;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .topbar-notification-item__snippet {
      margin: 0;
      font-size: 12px;
      line-height: 1.45;
      color: #64748b;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      letter-spacing: -0.01em;
    }

    .topbar-notification-item__delete {
      flex-shrink: 0;
      width: 32px;
      height: 32px;
      min-width: 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      margin-top: 0;
      ${transition()};
      opacity: 0;

      &:hover {
        color: #ef4444;
        background: rgba(239, 68, 68, 0.1);
      }
    }

    .topbar-notification-item:hover .topbar-notification-item__delete {
      color: #64748b;
      opacity: 1;
    }

    .topbar-notification-item:hover .topbar-notification-item__delete:hover {
      color: #ef4444;
    }

    .isoDropdownListItem {
      display: contents;
      padding: 0;
      border: none;
    }

    .notification-date {
      position: static;
    }
  }

  &.isoUserDropdown {
    padding: 7px 0;
    display: flex;
    flex-direction: column;
    background-color: #ffffff;
    width: 220px;
    min-width: 160px;
    flex-shrink: 0;
    ${borderRadius("5px")};
    ${boxShadow("0 2px 10px rgba(0,0,0,0.2)")};
    ${transition()};

    .isoDropdownLink {
      font-size: 13px;
      color: ${palette("text", 1)};
      line-height: 1.1;
      padding: 7px 15px;
      background-color: transparent;
      text-decoration: none;
      display: flex;
      justify-content: flex-start;
      ${transition()};

      &:hover {
        background-color: ${palette("secondary", 6)};
      }
    }
  }
`;

export default WithDirection(TopbarDropdownWrapper);
