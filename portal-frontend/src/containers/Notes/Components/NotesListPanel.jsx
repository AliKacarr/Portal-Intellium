import React from "react";
import { Empty, message, Select, Tag } from "antd";
import {
  BellOutlined,
  FolderOpenOutlined,
  PushpinOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  NotesColumn,
  ColumnHeader,
  NoteListBody,
  SearchInput,
  SearchPrefixWrap,
  NoteListItem,
  NoteCardGrid,
  NoteDateTopRight,
  NoteMetaRight,
  NoteTagsWrap,
  NoteTitle,
  NotePreview,
  NoteFooterRow,
  NoteFooterItem,
  NoteFooterText,
  MoreTagText,
} from "../Notes.styles";
import { getNoteDisplayTags } from "../notesHelpers";
import { toPlainText } from "../notesUtils";

const SORT_OPTIONS = [
  { value: "createdAt|desc", labelKey: "sortCreatedDesc" },
  { value: "createdAt|asc", labelKey: "sortCreatedAsc" },
  { value: "updatedAt|desc", labelKey: "sortUpdatedDesc" },
  { value: "updatedAt|asc", labelKey: "sortUpdatedAsc" },
  { value: "title|asc", labelKey: "sortTitleAsc" },
  { value: "title|desc", labelKey: "sortTitleDesc" },
  { value: "contentLength|desc", labelKey: "sortContentDesc" },
  { value: "contentLength|asc", labelKey: "sortContentAsc" },
];

function NotesListPanel({
  texts,
  searchText,
  onSearchChange,
  sortBy,
  order,
  onSortChange,
  filteredNotes,
  selectedNoteId,
  onSelectNote,
  getTagById,
  libraryFilter,
  sharedNotesLoading,
  trashNotesLoading,
  pinnedCount,
  onPinNote,
  sharedSubFilter,
  onSharedSubFilterChange,
}) {
  const isSharedView = libraryFilter === "shared";
  const isTrashView = libraryFilter === "trash";
  const showLoading =
    (isSharedView && sharedNotesLoading) || (isTrashView && trashNotesLoading);
  const showEmpty = !showLoading && filteredNotes.length === 0;
  const sortValue = sortBy && order ? `${sortBy}|${order}` : "updatedAt|desc";

  return (
    <NotesColumn>
      <ColumnHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <SearchInput
            size="small"
            placeholder={texts.searchPlaceholder}
            prefix={
              <SearchPrefixWrap>
                <SearchOutlined />
              </SearchPrefixWrap>
            }
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          {onSortChange && (
            <Select
              size="small"
              placeholder={texts.sortPlaceholder}
              value={sortValue}
              onChange={onSortChange}
              options={SORT_OPTIONS.map((opt) => ({
                value: opt.value,
                label: texts[opt.labelKey] ?? opt.value,
              }))}
              style={{ width: "100%" }}
              getPopupContainer={(n) => n?.parentNode ?? document.body}
            />
          )}
        </div>
      </ColumnHeader>

      {isSharedView && (
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
          {[
            { key: 'all', label: texts.sharedTabAll },
            { key: 'received', label: texts.sharedTabReceived },
            { key: 'sent', label: texts.sharedTabSent },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => onSharedSubFilterChange && onSharedSubFilterChange(tab.key)}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                padding: '8px 4px',
                fontSize: 12,
                fontWeight: sharedSubFilter === tab.key ? 600 : 400,
                color: sharedSubFilter === tab.key ? '#2563eb' : '#6b7280',
                borderBottom: sharedSubFilter === tab.key ? '2px solid #2563eb' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      <NoteListBody>
        {showLoading ? (
          <Empty
            description={texts.sharedNotesLoading}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 36 }}
          />
        ) : showEmpty ? (
          <Empty
            description={texts.emptyList}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 36 }}
          />
        ) : (
          filteredNotes.map((note) => {
            const noteTags = getNoteDisplayTags(note, getTagById);
            const previewText = toPlainText(note.content);
            const previewCanonical = String(previewText ?? "")
              .replace(/\u200B/g, "")
              .trim();
            const safePreviewText =
              previewCanonical === "0" && noteTags.length === 0 ? "" : previewText;
            const sharedByRaw = note.sharedBy ?? note.SharedBy ?? null;
            const sharedByName =
              typeof sharedByRaw === "string" ? sharedByRaw.trim() : "";
            const hasSharedBy =
              sharedByName.length > 0 &&
              sharedByName !== "0" &&
              sharedByName.toLowerCase() !== "null" &&
              sharedByName.toLowerCase() !== "undefined";
            const hasReadOnlyFlag =
              note.readOnly !== undefined || note.ReadOnly !== undefined;
            const readOnly = note.readOnly === true || note.ReadOnly === true;
            const isReceivedShare = hasSharedBy;
            const isPinned = !!note.isPinned;
            const showPin = !isSharedView && !isTrashView && onPinNote;
            const nowMs = Date.now();
            const reminders = Array.isArray(note.reminders)
              ? note.reminders
              : Array.isArray(note.Reminders)
              ? note.Reminders
              : [];
            const hasActiveReminder =
              reminders.some((r) => {
                const sentAt = r?.sentAt ?? r?.SentAt ?? null;
                if (sentAt) return false;
                const at = r?.reminderAt ?? r?.ReminderAt ?? null;
                const ms = at ? new Date(at).getTime() : NaN;
                return Number.isFinite(ms) && ms > nowMs;
              }) ||
              (() => {
                const at = note.reminderAt ?? note.ReminderAt ?? null;
                const ms = at ? new Date(at).getTime() : NaN;
                return Number.isFinite(ms) && ms > nowMs;
              })();

            return (
              <NoteListItem
                key={note.id}
                $active={String(note.id) === String(selectedNoteId)}
                onClick={() => onSelectNote(note.id)}
              >
                {showPin && (
                  <button
                    type="button"
                    aria-label={isPinned ? texts.unpinAriaLabel : texts.pinAriaLabel}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 1,
                      border: "none",
                      background: "none",
                      cursor: "pointer",
                      padding: 4,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isPinned && pinnedCount >= 2) {
                        message.warning(texts.maxPinReached);
                        return;
                      }
                      onPinNote(note.id, !isPinned);
                    }}
                  >
                    <PushpinOutlined
                      style={{
                        fontSize: 14,
                        color: isPinned ? "#2563eb" : "#9ca3af",
                      }}
                    />
                  </button>
                )}
                {hasActiveReminder && (
                  <div
                    title={texts.activeReminderTooltip}
                    style={{
                      position: "absolute",
                      bottom: 8,
                      right: 8,
                      zIndex: 1,
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      background: "rgba(220, 38, 38, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#dc2626",
                    }}
                  >
                    <BellOutlined style={{ fontSize: 13 }} />
                  </div>
                )}
                <div
                  style={{
                    position: "relative",
                    paddingRight: 24,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <NoteCardGrid>
                    <NoteTitle title={note.title || ""}>{note.title}</NoteTitle>
                    <NoteDateTopRight
                      title={`${texts.lastModifiedLabel} ${note.updatedAt || "—"}`}
                    >
                      {note.updatedAt || "—"}
                    </NoteDateTopRight>

                    <NotePreview>{safePreviewText}</NotePreview>

                    <NoteMetaRight>
                      {(!!note.folderPath || hasSharedBy || noteTags.length > 0) && (
                        <NoteFooterRow>
                          {!!note.folderPath && (
                            <NoteFooterItem title={note.folderPath}>
                              <FolderOpenOutlined />
                              <NoteFooterText>{note.folderPath}</NoteFooterText>
                            </NoteFooterItem>
                          )}
                          {hasSharedBy && (
                            <NoteFooterItem
                              title={`${sharedByName}${
                                isSharedView && isReceivedShare && hasReadOnlyFlag
                                  ? ` • ${
                                      readOnly
                                        ? texts.sharedBadgeReadOnly
                                        : texts.sharedBadgeEditable
                                    }`
                                  : ""
                              }`}
                            >
                              <UserOutlined />
                              <NoteFooterText>
                                {sharedByName}
                              </NoteFooterText>
                              {isSharedView && isReceivedShare && hasReadOnlyFlag && (
                                <Tag
                                  color={readOnly ? "blue" : "green"}
                                  style={{
                                    borderRadius: 999,
                                    fontSize: 10,
                                    padding: "0 8px",
                                    marginInlineEnd: 0,
                                  }}
                                >
                                  {readOnly
                                    ? texts.sharedBadgeReadOnly
                                    : texts.sharedBadgeEditable}
                                </Tag>
                              )}
                            </NoteFooterItem>
                          )}
                          {noteTags.length > 0 && (
                            <NoteTagsWrap>
                              {noteTags[0] && (
                                <Tag
                                  color={noteTags[0].color}
                                  style={{
                                    borderRadius: 999,
                                    fontSize: 10,
                                    padding: "0 8px",
                                    marginInlineEnd: 0,
                                  }}
                                >
                                  {noteTags[0].name}
                                </Tag>
                              )}
                              {noteTags.length > 1 && (
                                <MoreTagText>+{noteTags.length - 1}</MoreTagText>
                              )}
                            </NoteTagsWrap>
                          )}
                        </NoteFooterRow>
                      )}
                    </NoteMetaRight>
                  </NoteCardGrid>
                </div>
              </NoteListItem>
            );
          })
        )}
      </NoteListBody>
    </NotesColumn>
  );
}

export default NotesListPanel;
