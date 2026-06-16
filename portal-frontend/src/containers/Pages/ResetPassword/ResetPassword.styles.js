import styled from "styled-components";
import { palette } from "styled-theme";
import bgImage from "@iso/assets/images/sign.jpg";
import WithDirection from "@iso/lib/helpers/rtl";

const ResetPasswordStyleWrapper = styled.div`
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
    height: auto;
    display: flex;
    background-color: rgba(0, 0, 0, 0.3);
    position: absolute;
    z-index: 1;
    top: 0;
    left: ${(props) => (props["data-rtl"] === "rtl" ? "inherit" : "0")};
    right: ${(props) => (props["data-rtl"] === "rtl" ? "0" : "inherit")};
  }

  .isoFormContentWrapper {
    width: 500px;
    height: 100%;
    overflow-y: auto;
    z-index: 10;
    position: relative;
  }

  .isoFormContent {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    padding: 70px 50px;
    position: relative;
    background-color: #ffffff;

    @media only screen and (max-width: 767px) {
      width: 100%;
      padding: 70px 20px;
    }

    .isoLogoWrapper {
      width: 100%;
      display: flex;
      margin-bottom: 42px;
      justify-content: center;

      a {
        font-size: 24px;
        font-weight: 300;
        line-height: 1;
        text-transform: uppercase;
        color: ${palette("secondary", 2)};
        letter-spacing: 1px;
      }
    }

    .isoFormHeadText {
      width: 100%;
      display: flex;
      flex-direction: column;
      margin-bottom: 15px;
      justify-content: center;

      h3 {
        font-size: 16px;
        font-weight: 700;
        line-height: 1.2;
        margin: 0 0 12px;
        color: ${palette("text", 0)};
      }

      p {
        font-size: 13px;
        font-weight: 400;
        line-height: 1.2;
        margin: 0;
        color: ${palette("text", 2)};
      }
    }

    .isoResetPassForm {
      width: 100%;
      display: flex;
      flex-shrink: 0;
      flex-direction: column;

      .isoInputWrapper {
        margin-bottom: 10px;

        &:last-child {
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

        button {
          height: 42px;
          width: 100%;
          font-weight: 500;
          font-size: 13px;
        }
      }

      .legalConsentSection {
        width: 100%;
        margin: 8px 0 18px;
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
        transition: all 0.2s ease;

        &:hover {
          border-color: #b7cdfb;
          box-shadow: 0 10px 28px rgba(47, 84, 235, 0.1);
          transform: translateY(-1px);
        }

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

        &:hover {
          strong {
            color: #2f54eb;
          }
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
    }
  }

  .legalModalTitle {
    display: flex;
    flex-direction: column;
    gap: 4px;

    span {
      font-size: 17px;
      font-weight: 700;
      color: #172033;
    }

    small {
      font-size: 12px;
      font-weight: 400;
      color: #7a8499;
    }
  }

  .legalModalText {
    height: min(46vh, 330px);
    overflow-y: auto;
    padding: 18px 22px;
    background: linear-gradient(180deg, #f8fbff 0%, #ffffff 28%);
    color: ${palette("text", 1)};
    font-size: 13px;
    line-height: 1.72;

    &::-webkit-scrollbar {
      width: 9px;
    }

    &::-webkit-scrollbar-track {
      background: #edf2f7;
      border-radius: 999px;
    }

    &::-webkit-scrollbar-thumb {
      background: #9db5d9;
      border-radius: 999px;
    }
  }

  .legalModalLead {
    margin-bottom: 14px;
    padding: 12px 14px;
    border: 1px solid #dbeafe;
    border-radius: 12px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 12px;
    font-weight: 600;
  }

  .legalModalParagraphs {
    padding: 16px 18px;
    border: 1px solid #eef2f7;
    border-radius: 14px;
    background: #ffffff;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);

    h3 {
      margin: 0 0 16px;
      color: #172033;
      font-size: 15px;
      font-weight: 800;
      letter-spacing: 0.2px;
      text-transform: uppercase;
    }

    p {
      margin: 0 0 13px;

      &:last-child {
        margin-bottom: 0;
      }
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
    padding: 12px 22px 16px;
    border-top: 1px solid #eef2f7;
    background: #ffffff;
    font-size: 12px;
    color: #7a8499;

    &.success {
      color: #389e0d;
      font-weight: 600;
    }
  }
`;

export default WithDirection(ResetPasswordStyleWrapper);
