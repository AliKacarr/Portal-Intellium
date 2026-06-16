import styled from "styled-components";
import { palette } from "styled-theme";
import {
  transition,
  borderRadius,
  boxShadow,
} from "@iso/lib/helpers/style_utils";
import WithDirection from "@iso/lib/helpers/rtl";

const ThemeSwitcherStyle = styled.div`
  background-color: #fff;
  width: 170px;
  height: calc(100% - 70px);
  padding: 0 0 50px;
  flex-shrink: 0;
  position: fixed;
  top: 70px;
  right: ${(props) => (props["data-rtl"] === "rtl" ? "inherit" : "-170px")};
  left: ${(props) => (props["data-rtl"] === "rtl" ? "-170px" : "inherit")};
  z-index: 1001;
  ${transition()};
  ${boxShadow("-1px 0 5px rgba(0,0,0,0.25)")};

  @media only screen and (max-width: 767px) {
    width: 270px;
    right: ${(props) => (props["data-rtl"] === "rtl" ? "inherit" : "-270px")};
    left: ${(props) => (props["data-rtl"] === "rtl" ? "-270px" : "inherit")};
  }

  &.active {
    right: ${(props) => (props["data-rtl"] === "rtl" ? "inherit" : "0")};
    left: ${(props) => (props["data-rtl"] === "rtl" ? "0" : "inherit")};
  }

  .switcher {
    right: ${(props) => (props["data-rtl"] === "rtl" ? "-98px" : "inherit")};
    left: ${(props) => (props["data-rtl"] === "rtl" ? "inherit" : "-98px")};
  }

  .closeButton {
    font-size: 18px;
    font-weight: 300;
    position: absolute;
    top: 12px;
    left: 12px;
    color: #fff;
    cursor: pointer;

    &:hover {
      color: #aaa;
    }
  }

  .componentTitleWrapper {
    padding: 15px 10px;
    height: 50px;
    background-color: ${palette("text", 0)};

    .componentTitle {
      padding-top: 3px;
      font-size: 14px;
      font-weight: 400;
      color: #fff;
      line-height: 1;
      width: 100%;
      text-align: center;
      display: flex;
      justify-content: center;
    }
  }

  .SwitcherBlockWrapper {
    width: 100%;
    height: 100%;
    padding-bottom: 105px;
    overflow: hidden;
    overflow-y: auto;
    display: flex;
    flex-direction: column;

    .themeSwitchBlock {
      width: 100%;
      display: -webkit-flex;
      display: -ms-flex;
      display: flex;
      flex-shrink: 0;
      flex-direction: column;
      margin-top: 30px;

      h4 {
        font-size: 14px;
        font-weight: 500;
        color: ${palette("text", 0)};
        line-height: 1.3;
        margin-bottom: 0;
        padding: 0 15px;
        text-transform: none;
      }

      .themeSwitchBtnWrapper {
        width: 100%;
        display: flex;
        align-items: center;
        padding: 15px 20px;

        button {
          width: 20px;
          height: 20px;
          display: flex;
          margin: ${(props) =>
            props["data-rtl"] === "rtl" ? "0 0 0 10px" : "0 10px 0 0"};
          border: 1px solid #e4e4e4;
          outline: 0;
          padding: 0;
          background: none;
          justify-content: center;
          position: relative;
          cursor: pointer;
          ${borderRadius("3px")};

          &.languageSwitch {
            border: 0;
            width: 30px;
            height: auto;

            &.selectedTheme {
              &:before,
              &:after {
                top: 2px;
                left: ${(props) =>
                  props["data-rtl"] === "rtl" ? "inherit" : "-3px"};
                right: ${(props) =>
                  props["data-rtl"] === "rtl" ? "-3px" : "inherit"};
              }
            }
          }

          img {
            width: 100%;
          }

          &.selectedTheme {
            &:before {
              content: "";
              width: 6px;
              height: 6px;
              display: -webkit-inline-flex;
              display: -ms-inline-flex;
              display: inline-flex;
              background-color: ${palette("color", 13)};
              position: absolute;
              top: -2px;
              left: ${(props) =>
                props["data-rtl"] === "rtl" ? "inherit" : "-2px"};
              right: ${(props) =>
                props["data-rtl"] === "rtl" ? "-2px" : "inherit"};
              ${borderRadius("50%")};
            }

            &:after {
              content: "";
              width: 6px;
              height: 6px;
              display: -webkit-inline-flex;
              display: -ms-inline-flex;
              display: inline-flex;
              border: 1px solid ${palette("color", 13)};
              background-color: ${palette("color", 13)};
              position: absolute;
              top: -2px;
              left: ${(props) =>
                props["data-rtl"] === "rtl" ? "inherit" : "-2px"};
              right: ${(props) =>
                props["data-rtl"] === "rtl" ? "-2px" : "inherit"};
              -webkit-animation: selectedAnimation 1.2s infinite ease-in-out;
              animation: selectedAnimation 1.2s infinite ease-in-out;
              ${borderRadius("50%")};
            }
          }
        }
      }
    }
  }

  .switcherToggleBtn {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    background-color: #ffffff;
    outline: 0;
    border: 0;
    position: absolute;
    text-align: center;
    top: 200px;
    left: ${(props) => (props["data-rtl"] === "rtl" ? "inherit" : "-50px")};
    right: ${(props) => (props["data-rtl"] === "rtl" ? "-50px" : "inherit")};
    cursor: pointer;
    border-radius: ${(props) =>
      props["data-rtl"] === "rtl" ? "0 3px 3px 0" : "3px 0 0 3px"};
    ${boxShadow("-2px 0 5px rgba(0,0,0,0.2)")};

    img {
      width: 23px;
    }
  }
`;

export default WithDirection(ThemeSwitcherStyle);
