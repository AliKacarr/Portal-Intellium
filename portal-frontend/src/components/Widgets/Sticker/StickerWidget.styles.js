import styled from "styled-components";
import { borderRadius } from "@iso/lib/helpers/style_utils";

const StickerWidgetWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  ${borderRadius("5px")};

  &.isCompact {
    .isoIconWrapper {
      width: 52px;
      i {
        font-size: 26px;
      }
    }
    .isoContentWrapper {
      padding: 14px 12px 14px 14px;
      .isoStatNumber {
        font-size: 16px;
        margin: 0 0 4px;
      }
      .isoLabel {
        font-size: 13px;
      }
    }
  }

  .isoIconWrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    flex-shrink: 0;
    background-color: rgba(0, 0, 0, 0.1);

    i {
      font-size: 30px;
    }
  }

  .isoContentWrapper {
    width: 100%;
    padding: 20px 15px 20px 20px;
    display: flex;
    flex-direction: column;

    .isoStatNumber {
      font-size: 18px;
      font-weight: 500;
      line-height: 1.1;
      margin: 0 0 5px;
    }

    .isoLabel {
      font-size: 14px;
      font-weight: 400;
      margin: 0;
      line-height: 1.2;
    }
  }
`;

export { StickerWidgetWrapper };
