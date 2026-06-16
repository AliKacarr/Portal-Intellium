import styled from "styled-components";
import { palette } from "styled-theme";
import bgImage from "@iso/assets/images/sign.jpg";
import WithDirection from "@iso/lib/helpers/rtl";

const SignInStyleWrapper = styled.div`
  width: 100%;
  min-height: 100vh;
  height: 100vh;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  position: relative;
  background: url(${bgImage}) no-repeat center center;
  background-size: cover;

  &:before {
    content: "";
    width: 100%;
    height: 100%;
    display: flex;
    background-color: rgba(0, 0, 0, 0.6);
    position: absolute;
    z-index: 1;
    top: 0;
    left: ${(props) => (props["data-rtl"] === "rtl" ? "inherit" : "0")};
    right: ${(props) => (props["data-rtl"] === "rtl" ? "0" : "inherit")};
  }

  .isoLoginContentWrapper {
    width: 500px;
    height: 100%;
    overflow-y: auto;
    z-index: 10;
    position: relative;
  }

  .isoLoginContent {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    padding: 30px;
    position: relative;
    background-color: #ffffff;

    @media only screen and (max-width: 767px) {
      width: 100%;
      padding: s70px 20px;
    }

    .isoLogoWrapper {
      width: 100%;
      display: flex;
      margin: 60px auto;
      justify-content: center;
      flex-shrink: 0;

      a {
        font-size: 24px;
        font-weight: 300;
        line-height: 1;
        text-transform: uppercase;
        color: ${palette("secondary", 2)};
      }
    }

    .isoSignInForm {
      width: 100%;
      display: flex;
      flex-shrink: 0;
      flex-direction: column;

      .isoInputWrapper {
        margin-bottom: 20px;

        &:last-of-type {
          margin-bottom: 0;
        }

        input {
          &::-webkit-input-placeholder {
            color: ${palette("grayscale", 0)};
          }

          &:-moz-placeholder {
            color: ${palette("grayscale", 0)};
          }

          &::-moz-placeholder {
            color: ${palette("grayscale", 0)};
          }
          &:-ms-input-placeholder {
            color: ${palette("grayscale", 0)};
          }
        }
      }

      .isoHelperText {
        font-size: 12px;
        font-weight: 400;
        line-height: 1.2;
        color: ${palette("grayscale", 1)};
        padding-left: ${(props) =>
          props["data-rtl"] === "rtl" ? "inherit" : "13px"};
        padding-right: ${(props) =>
          props["data-rtl"] === "rtl" ? "13px" : "inherit"};
        margin: 15px 0;
        position: relative;
        display: flex;
        align-items: center;

        &:before {
          content: "*";
          color: ${palette("error", 0)};
          padding-right: 3px;
          font-size: 14px;
          line-height: 1;
          position: absolute;
          top: 2px;
          left: ${(props) => (props["data-rtl"] === "rtl" ? "inherit" : "0")};
          right: ${(props) => (props["data-rtl"] === "rtl" ? "0" : "inherit")};
        }
      }

      .isoHelperWrapper {
        margin-top: 35px;
        flex-direction: column;
      }

      .isoOtherLogin {
        padding-top: 40px;
        margin-top: 35px;
        border-top: 1px dashed ${palette("grayscale", 2)};

        > a {
          display: flex;
          margin-bottom: 10px;

          &:last-child {
            margin-bottom: 0;
          }
        }

        button {
          width: 100%;
          height: 42px;
          border: 0;
          font-weight: 500;

          &.btnAccountKit {
            ${"" /* background-color: rgb(150, 189, 235); */}
            margin-top: 15px;

            &:hover {
              ${"" /* background-color: ${palette('color', 6)}; */}
            }
          }
        }
      }

      .isoForgotPass {
        font-size: 12px;
        color: ${palette("text", 3)};
        text-decoration: none;

        &:hover {
          color: ${palette("primary", 0)};
        }
      }

      button {
        font-weight: 500;
      }
    }
  }

  .agreementUpdateNotice {
    margin-bottom: 16px;
    padding: 12px 14px;
    border: 1px solid #d6e4ff;
    border-radius: 10px;
    background: #f0f5ff;
    color: #1d39c4;
    font-size: 13px;
    line-height: 1.55;
  }

  .legalConsentSection {
    width: 100%;
  }

  .legalConsentRow {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 58px;
    margin-bottom: 10px;
    padding: 12px 14px;
    border: 1px solid #e6ecf5;
    border-radius: 14px;
    background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);

    .ant-checkbox-wrapper {
      margin: 0;
    }
  }

  .legalIcon {
    width: 32px;
    height: 32px;
    flex: 0 0 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: #edf4ff;
    color: #2f54eb;
    font-size: 11px;
    font-weight: 800;

    &.consent {
      background: #f0f7ff;
      color: #08979c;
    }
  }

  .legalTextButton {
    flex: 1;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
    color: #172033;

    strong {
      display: block;
      margin-bottom: 2px;
      font-size: 13px;
      font-weight: 700;
    }

    span {
      display: block;
      font-size: 11px;
      line-height: 1.35;
      color: #6b7280;
    }

    &:hover strong {
      color: #2f54eb;
    }

    &:disabled {
      cursor: not-allowed;
      opacity: 0.55;

      strong {
        color: #6b7280;
      }
    }
  }

  .legalStatus {
    flex-shrink: 0;
    padding: 3px 8px;
    border-radius: 999px;
    background: #fff1f0;
    color: #cf1322;
    font-size: 11px;
    font-weight: 600;

    &.accepted {
      background: #f6ffed;
      color: #389e0d;
    }
  }

  .legalModalTitle {
    display: flex;
    flex-direction: column;
    gap: 4px;

    span {
      color: #172033;
      font-weight: 700;
    }

    small {
      color: #8c8c8c;
      font-size: 12px;
      font-weight: 400;
    }
  }

  .legalModalText {
    max-height: min(62vh, 520px);
    overflow-y: auto;
    padding: 22px 24px 10px;
    color: #344054;
    line-height: 1.68;
  }

  .legalModalLead {
    margin-bottom: 16px;
    padding: 10px 12px;
    border-radius: 10px;
    background: #f0f5ff;
    color: #1d39c4;
    font-size: 12px;
    font-weight: 600;
  }

  .legalModalParagraphs {
    p {
      margin: 0 0 13px;
    }

    h3 {
      margin: 0 0 16px;
      color: #172033;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.2px;
      text-transform: uppercase;
    }

    ul {
      margin: 0 0 13px 18px;
      padding: 0;
    }

    li {
      margin: 0 0 7px;
      padding-left: 2px;
    }
  }

  .legalModalHint {
    padding: 10px 24px 14px;
    border-top: 1px solid #f0f0f0;
    color: #8c8c8c;
    font-size: 12px;

    &.success {
      color: #389e0d;
      font-weight: 600;
    }
  }
`;

export default WithDirection(SignInStyleWrapper);
