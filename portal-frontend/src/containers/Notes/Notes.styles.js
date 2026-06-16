import { Button, Input } from "antd";
import styled from "styled-components";
import { richListCss } from "@iso/components/Custom/PortalContentEditor/richListStyles";

export const NotesLayout = styled.div`
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;

  @media only screen and (max-width: 991px) {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 170px);
  }
`;

export const NotesSidebar = styled.div`
  width: 260px;
  flex-shrink: 0;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;

  @media only screen and (max-width: 991px) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    max-height: none;
  }
`;

export const NotesColumn = styled.div`
  width: 320px;
  flex-shrink: 0;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  min-height: 0;

  @media only screen and (max-width: 991px) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    min-height: 300px;
  }
`;

export const NotesEditor = styled.div`
  flex: 1;
  min-width: 0;
  background: #ffffff;
  display: flex;
  flex-direction: column;
`;

export const ColumnHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const ColumnBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 12px 12px 16px;
`;

export const NoteListBody = styled(ColumnBody)`
  padding: 0;
  display: flex;
  flex-direction: column;
`;

export const SidebarSection = styled.div``;

export const NewNoteButton = styled(Button)`
  &.ant-btn {
    height: 46px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: none;
    border-radius: 10px;
    font-size: 17px;
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.01em;
    background: linear-gradient(135deg, #2289e6 0%, #2f69de 100%);
    box-shadow: 0 8px 16px rgba(37, 99, 235, 0.22);
  }

  &.ant-btn > .anticon,
  &.ant-btn > span {
    display: inline-flex;
    align-items: center;
    line-height: 1;
  }

  &.ant-btn > .anticon {
    font-size: 15px;
    margin: 0;
  }

  &.ant-btn:hover,
  &.ant-btn:focus {
    border: none;
    color: #fff;
    background: linear-gradient(135deg, #1f7ed4 0%, #2a5fd0 100%);
    box-shadow: 0 10px 18px rgba(37, 99, 235, 0.28);
  }
`;

export const SearchInput = styled(Input)`
  &.ant-input-affix-wrapper {
    height: 46px;
    border-radius: 10px;
    border: 1px solid #d6dde7;
    padding: 0 14px;
    background: #f8fafc;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
    transition: all 0.2s ease;
  }

  &.ant-input-affix-wrapper:hover {
    border-color: #b8c5d8;
    background: #ffffff;
  }

  &.ant-input-affix-wrapper-focused {
    border-color: #4c7fea;
    background: #ffffff;
    box-shadow: 0 0 0 3px rgba(76, 127, 234, 0.16);
  }

  .ant-input-prefix {
    margin-right: 10px;
    color: #94a3b8;
    font-size: 20px;
  }

  .ant-input {
    font-size: 16px;
    color: #374151;
    background: transparent;
  }

  .ant-input::placeholder {
    color: #9ca3af;
  }
`;

export const SidebarSectionTitle = styled.h3`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const SidebarList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const SidebarItemButton = styled.button`
  width: 100%;
  border: none;
  background: ${(props) => (props.$active ? "#e5edff" : "transparent")};
  color: ${(props) => (props.$active ? "#1d4ed8" : "#374151")};
  font-size: 13px;
  border-radius: 6px;
  padding: 6px 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background: ${(props) => (props.$active ? "#e5edff" : "#f3f4f6")};
  }
`;

export const FolderNoteList = styled.ul`
  list-style: none;
  margin: 4px 0 6px 26px;
  padding: 0 0 0 10px;
  border-left: 1px dashed #d1d5db;
`;

export const FolderNoteButton = styled.button`
  width: 100%;
  border: none;
  background: transparent;
  color: #6b7280;
  font-size: 12px;
  border-radius: 6px;
  padding: 5px 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  text-align: left;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    background: #eef2f7;
    color: #374151;
  }

  &.is-active {
    background: #e8f0ff;
    color: #1d4ed8;
  }
`;

export const EditorToolbar = styled.div`
  position: sticky;
  top: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px;
  margin-bottom: 12px;
  border: 1px solid #dbe1ea;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
`;

export const RichEditor = styled.div`
  flex: 1;
  min-width: 0;
  min-height: 260px;
  outline: none;
  border: none;
  color: #1f2937;
  font-size: 15px;
  line-height: 1.7;
  overflow-wrap: break-word;
  word-break: break-word;

  p {
    margin: 0 0 14px;
  }

  ${richListCss}

  img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 8px 0;
    display: block;
  }
`;

export const SidebarItemLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

export const SidebarItemMeta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
`;

export const TagDot = styled.span`
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
  background: ${(props) => props.$color || "#9ca3af"};
`;

export const NoteListItem = styled.div`
  position: relative;
  width: 100%;
  box-sizing: border-box;
  border-radius: 0;
  padding: 14px 14px 16px;
  min-height: 96px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  border-left: 3px solid
    ${(props) => (props.$active ? "#2563eb" : "transparent")};
  border-bottom: 1px solid #e5e7eb;
  background: ${(props) => (props.$active ? "#eff6ff" : "transparent")};
  transition: background 0.15s ease, border-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${(props) => (props.$active ? "#e0ecff" : "#f9fafb")};
  }

  @media only screen and (max-width: 991px) {
    padding: 14px 12px;
    min-height: 108px;
  }
`;

export const NoteCardGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "title date"
    "preview preview"
    "bottom bottom";
  row-gap: 8px;
  column-gap: 10px;
  min-width: 0;
`;

export const NoteDateTopRight = styled.span`
  grid-area: date;
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  font-size: 11px;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  white-space: nowrap;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const NoteTagsWrap = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: visible;

  .ant-tag {
    margin-inline-end: 0;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
  }
`;

export const NoteMetaRight = styled.div`
  grid-area: bottom;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

export const NoteFooterRow = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
  min-width: 0;
  overflow: visible;
`;

export const NoteMetaRightSpacer = styled.span`
  color: #e5e7eb;
`;

export const NoteMetaRightTags = styled(NoteTagsWrap)`
  flex: 0 1 auto;
  min-width: 0;
  justify-content: flex-end;
`;

export const NoteMetaRightStatus = styled.span`
  flex: 0 0 auto;
`;

export const NoteMetaRightInner = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
`;

export const NoteMetaRightDate = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  color: #9ca3af;
  white-space: nowrap;
  flex: 0 0 auto;
`;

export const NoteTagsWrapRight = styled.div`
  grid-area: tags;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  overflow: hidden;
`;

export const NoteTitle = styled.div`
  grid-area: title;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
  margin: 0;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NoteFooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px 10px;
  flex-wrap: wrap;
  white-space: normal;
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
`;

export const NoteFooterItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: #6b7280;

  .anticon {
    flex: 0 0 auto;
    color: #94a3b8;
  }

  .ant-tag {
    margin-inline-end: 0;
    flex: 0 0 auto;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-left: 6px;
  }
`;

export const NoteFooterText = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NoteFolderMeta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #0f766e;
  font-weight: 600;
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NoteFolderPathText = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

export const NoteSharedBy = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #6b7280;
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NoteSharedByName = styled.span`
  color: #1d4ed8;
  font-weight: 600;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NotePreview = styled.p`
  grid-area: preview;
  font-size: 14px;
  line-height: 1.55;
  color: #6b7280;
  margin: 0;
  min-width: 0;
  flex-shrink: 0;
  max-height: 1.55em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
`;

export const LayoutLoadingWrap = styled.div`
  padding: 0;
  width: 100%;
  height: calc(100vh - 136px);
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const LayoutRoot = styled.div`
  padding: 0;
  width: 100%;
  height: calc(100vh - 136px);
  display: block;
  overflow: hidden;
`;

export const SectionTitleLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export const SidebarActionButton = styled(Button)`
  &.ant-btn {
    color: #6b7280;
    padding: 0;
  }
`;

export const FolderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const FolderCaretButton = styled(Button)`
  &.ant-btn {
    width: 20px;
    min-width: 20px;
    height: 20px;
    padding: 0;
    color: #6b7280;
  }
`;

export const FolderDeleteButton = styled(Button)`
  &.ant-btn {
    width: 20px;
    min-width: 20px;
    height: 20px;
    padding: 0;
    color: #9ca3af;
  }

  &.ant-btn:hover,
  &.ant-btn:focus {
    color: #dc2626;
    background: #fee2e2;
  }
`;

export const SidebarHint = styled.div`
  font-size: 12px;
  color: #9ca3af;
  padding: 2px 4px;
`;

export const RemoveTagButton = styled.span`
  padding: 0;
  width: 16px;
  min-width: 16px;
  height: 16px;
  color: #9ca3af;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

export const EditorHeaderHint = styled.span`
  font-size: 11px;
  color: #6b7280;
`;

export const EditorHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const RestoreNoteButton = styled(Button)`
  &.ant-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    border-radius: 8px;
  }

  &.ant-btn > .anticon,
  &.ant-btn > span {
    display: inline-flex;
    align-items: center;
    line-height: 1;
  }

  &.ant-btn > .anticon {
    margin: 0;
  }
`;

export const EmptySelectedNoteText = styled.span`
  font-size: 12px;
  color: #6b7280;
`;

export const EditorBody = styled(ColumnBody)`
  display: flex;
  flex-direction: column;
`;

export const NoteTitleInput = styled(Input)`
  &.ant-input {
    font-size: 24px;
    font-weight: 600;
    padding: 0;
    margin-bottom: 8px;
  }

  &.ant-input[disabled] {
    color: #111827;
    -webkit-text-fill-color: #111827;
    opacity: 1;
    background: transparent;
    cursor: default;
  }
`;

export const SelectedTagsWrap = styled.div`
  margin-bottom: 14px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

export const ToolbarDivider = styled.div`
  width: 1px;
  align-self: stretch;
  background: #e5e7eb;
`;

export const SearchPrefixWrap = styled.span`
  color: #9ca3af;
`;

export const NoteTag = styled.span`
  border-radius: 999px;
  font-size: 10px;
  padding: 0 8px;
`;

export const NoteDateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-width: 0;
`;

export const MoreTagText = styled.span`
  font-size: 10px;
  color: #6b7280;
`;

export const NoteDateText = styled.span`
  font-size: 11px;
  color: #9ca3af;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  white-space: nowrap;
  margin-left: 2px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
`;

export const ModalForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ModalField = styled.div``;

export const ModalLabel = styled.label`
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
`;
