import styled from "styled-components";
import { grid } from "@iso/assets/styles/constants";

const DROPZONE_MIN_HEIGHT = "65vh";
const SCROLL_CONTAINER_MAX_HEIGHT = "calc(100vh - 180px)";

export const Wrapper = styled.div`
  background-color: ${({ isDraggingOver }) =>
    isDraggingOver ? "#e6eaf8" : "inherit"};
  display: flex;
  flex-direction: column;
  opacity: ${({ isDropDisabled }) => (isDropDisabled ? 0.5 : "inherit")};
  padding: 0 16px 16px;
  transition: background-color 0.1s ease, opacity 0.1s ease;
  user-select: none;
`;

export const DropZone = styled.div`
  /* Boş liste çökmesini engelle ve tüm ekranı kaplasın */
  min-height: ${DROPZONE_MIN_HEIGHT};
  margin-bottom: ${grid}px;
  display: flex;
  flex-direction: column;
`;

export const ScrollContainer = styled.div`
  overflow-x: hidden;
  overflow-y: overlay;
  max-height: ${SCROLL_CONTAINER_MAX_HEIGHT};
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
`;
