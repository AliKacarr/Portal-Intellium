import styled from "styled-components";
import { richListCss } from "./richListStyles";

export const PortalEditorWrap = styled.div`
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
`;

export const PortalEditorToolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
`;

export const ToolbarDivider = styled.div`
  width: 1px;
  align-self: stretch;
  background: #e5e7eb;
  margin: 0 2px;
`;

export const PortalRichEditor = styled.div`
  min-height: ${(p) => p.$minHeight}px;
  padding: 12px;
  outline: none;
  color: #1f2937;
  font-size: 15px;
  line-height: 1.7;
  overflow-wrap: break-word;
  word-break: break-word;

  p {
    margin: 0 0 14px;
  }

  ${richListCss}

  &:empty::before {
    content: attr(data-placeholder);
    color: #bfbfbf;
    pointer-events: none;
  }
`;
