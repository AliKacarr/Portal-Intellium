import React, { useEffect, useState } from "react";
import { Alert, Button, DatePicker, Dropdown, Empty, Modal, Tag, Tooltip } from "antd";
import moment from "moment";
import {
  StarFilled,
  StarOutlined,
  BoldOutlined,
  ItalicOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
  PictureOutlined,
  ShareAltOutlined,
  EllipsisOutlined,
  RollbackOutlined,
  DeleteOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { getNoteDisplayTags } from "../notesHelpers";
import {
  NotesEditor,
  ColumnHeader,
  EditorHeaderHint,
  EditorHeaderActions,
  RestoreNoteButton,
  EmptySelectedNoteText,
  EditorBody,
  NoteTitleInput,
  SelectedTagsWrap,
  EditorToolbar,
  ToolbarDivider,
  RichEditor,
} from "../Notes.styles";

function NotesEditorPanel({
  texts,
  selectedNote,
  getTagById,
  onUpdateNote,
  onSetReminder,
  onDeleteReminder,
  onRestore,
  onPermanentlyDelete,
  onToggleFavorite,
  shareMenuItems,
  onShareMenuClick,
  onMoreMenuClick,
  moreMenuItems,
  onRunEditorCommand,
  onApplyFontSize,
  onBeforeFontSizeDropdown,
  getSelectedFontSize,
  onOpenImagePicker,
  imageInputRef,
  onInsertImage,
  editorRef,
  onEditorInput,
  onEditorKeyDown,
}) {
  const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 64];
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  const [displayedFontSize, setDisplayedFontSize] = useState(null);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminderDraft, setReminderDraft] = useState(null);

  useEffect(() => {
    if (!onBeforeFontSizeDropdown) return;
    const handleMouseDown = () => onBeforeFontSizeDropdown();
    document.addEventListener("mousedown", handleMouseDown, true);
    return () => document.removeEventListener("mousedown", handleMouseDown, true);
  }, [onBeforeFontSizeDropdown]);

  useEffect(() => {
    const onSelectionChange = () => {
      const sz = getSelectedFontSize?.();
      setDisplayedFontSize(sz);
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [getSelectedFontSize]);

  useEffect(() => {
    if (!selectedNote) return;
    // antd v4 DatePicker moment kullanır
    setReminderDraft(selectedNote.reminderAt ? moment(selectedNote.reminderAt) : null);
  }, [selectedNote?.id]);

  return (
    <NotesEditor>
      <ColumnHeader>
        {selectedNote ? (
          <>
            <EditorHeaderHint>
              {texts.createdDateLabel} {selectedNote.createdAt || "-"}
            </EditorHeaderHint>

            <EditorHeaderActions>
              {selectedNote.isDeleted ? (
                <>
                  <RestoreNoteButton
                    type="primary"
                    size="small"
                    icon={<RollbackOutlined />}
                    onClick={onRestore}
                  >
                    {texts.restoreNote}
                  </RestoreNoteButton>
                  <RestoreNoteButton
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={onPermanentlyDelete}
                  >
                    {texts.permanentlyDelete}
                  </RestoreNoteButton>
                </>
              ) : (
                <>
                  <Dropdown
                    menu={{ items: shareMenuItems, onClick: onShareMenuClick }}
                    trigger={["click"]}
                  >
                    <Button
                      type="text"
                      size="small"
                      icon={<ShareAltOutlined />}
                    />
                  </Dropdown>

                  {selectedNote.readOnly !== true && (
                    <Tooltip
                      title={
                        selectedNote.reminderAt
                          ? texts.reminderEdit
                          : texts.reminderSet
                      }
                    >
                      <Button
                        type="text"
                        size="small"
                        icon={
                          <BellOutlined
                            style={selectedNote.reminderAt ? { color: "#2563eb" } : undefined}
                          />
                        }
                        onClick={() => {
                          setReminderDraft(selectedNote.reminderAt ? moment(selectedNote.reminderAt) : null);
                          setReminderModalOpen(true);
                        }}
                      />
                    </Tooltip>
                  )}

                  <Button
                    type="text"
                    size="small"
                    icon={
                      selectedNote.isFavorite ? (
                        <StarFilled style={{ color: "#f59e0b" }} />
                      ) : (
                        <StarOutlined />
                      )
                    }
                    onClick={onToggleFavorite}
                  />
                </>
              )}

              {!selectedNote.isDeleted && (
                <Dropdown
                  menu={{ items: moreMenuItems, onClick: onMoreMenuClick }}
                  trigger={["click"]}
                >
                  <Button type="text" size="small" icon={<EllipsisOutlined />} />
                </Dropdown>
              )}
            </EditorHeaderActions>
          </>
        ) : (
          <EmptySelectedNoteText>{texts.noSelectedNote}</EmptySelectedNoteText>
        )}
      </ColumnHeader>

      <Modal
        title={texts.reminderModalTitle}
        open={reminderModalOpen}
        onCancel={() => setReminderModalOpen(false)}
        footer={null}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ opacity: 0.8, fontSize: 13 }}>
            {texts.reminderHint}
          </div>
          <DatePicker
            style={{ width: "100%" }}
            showTime={{ format: "HH:mm" }}
            format="DD.MM.YYYY HH:mm"
            value={reminderDraft || undefined}
            onChange={(val) => setReminderDraft(val || null)}
            placeholder={texts.reminderPlaceholder}
            disabledDate={(current) => {
              if (!current) return false;
              return current.isBefore(moment().startOf("day"));
            }}
            disabledTime={(current) => {
              if (!current) return {};
              const now = moment();
              if (!current.isSame(now, "day")) return {};
              const disabledHours = () => Array.from({ length: now.hour() }, (_, i) => i);
              const disabledMinutes = (selectedHour) => {
                if (selectedHour !== now.hour()) return [];
                return Array.from({ length: now.minute() + 1 }, (_, i) => i);
              };
              return { disabledHours, disabledMinutes };
            }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setReminderModalOpen(false)}>
              {texts.close}
            </Button>
            <Button
              type="primary"
              disabled={!reminderDraft}
              onClick={async () => {
                if (!onSetReminder || !reminderDraft) return;
                const isoWithOffset = reminderDraft.format("YYYY-MM-DDTHH:mm:ssZ");
                await onSetReminder(isoWithOffset);
                setReminderDraft(null); // kaydettikten sonra seçili kalmasın
              }}
            >
              {texts.reminderCreateBtn}
            </Button>
          </div>

          {/* Bu nota ait hatırlatıcı(lar) */}
          <div
            style={{
              marginTop: 6,
              paddingTop: 10,
              borderTop: "1px solid #f0f0f0",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13 }}>
              {texts.remindersTitle}
            </div>

            {Array.isArray(selectedNote?.reminders) && selectedNote.reminders.length > 0 ? (
              selectedNote.reminders
                .slice()
                .sort((a, b) => String(a.reminderAt).localeCompare(String(b.reminderAt)))
                .map((r) => (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: "#f8fafc",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {moment(r.reminderAt).format("DD.MM.YYYY HH:mm")}
                      </div>
                      <div style={{ fontSize: 12, opacity: 0.75 }}>
                        {texts.reminderListHint}
                      </div>
                    </div>

                    {selectedNote?.readOnly !== true && (
                      <Button
                        danger
                        size="small"
                        onClick={async () => {
                          await onDeleteReminder?.(r.id);
                        }}
                      >
                        {texts.reminderClear}
                      </Button>
                    )}
                  </div>
                ))
            ) : (
              <div style={{ fontSize: 13, opacity: 0.75 }}>
                {texts.reminderEmpty}
              </div>
            )}
          </div>
        </div>
      </Modal>

      <EditorBody>
        {selectedNote ? (
          <>
            {selectedNote.readOnly === true && (
              <Alert
                type="info"
                showIcon
                message={texts.sharedNoteReadOnlyWarning}
                style={{ marginBottom: 12 }}
              />
            )}
            <NoteTitleInput
              value={selectedNote.title}
              onChange={(event) => !selectedNote.readOnly && onUpdateNote({ title: event.target.value })}
              bordered={false}
              disabled={selectedNote.readOnly === true}
            />

            <SelectedTagsWrap>
              {getNoteDisplayTags(selectedNote, getTagById).map((tag) => (
                <Tag
                  key={tag.id}
                  color={tag.color}
                  style={{ borderRadius: 999, fontSize: 11, padding: "2px 10px" }}
                >
                  {tag.name}
                </Tag>
              ))}
            </SelectedTagsWrap>

            {!selectedNote.readOnly && (
            <EditorToolbar>
              <Dropdown
                open={fontSizeDropdownOpen}
                onOpenChange={setFontSizeDropdownOpen}
                trigger={["click"]}
                menu={{
                  items: FONT_SIZES.map((n) => ({ key: String(n), label: String(n) })),
                  onClick: ({ key }) => {
                    if (onApplyFontSize) onApplyFontSize(Number(key));
                    setFontSizeDropdownOpen(false);
                  },
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (onBeforeFontSizeDropdown) onBeforeFontSizeDropdown();
                  }}
                  onClick={() => setFontSizeDropdownOpen((v) => !v)}
                  style={{
                    minWidth: 90,
                    height: 28,
                    padding: "0 10px",
                    fontSize: 13,
                    lineHeight: "28px",
                    border: "1px solid #d9d9d9",
                    borderRadius: 6,
                    cursor: "pointer",
                    background: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayedFontSize ?? texts.fontSizeLabel}
                  </span>
                  <span style={{ flexShrink: 0, opacity: 0.5 }}>▼</span>
                </div>
              </Dropdown>
              <ToolbarDivider />
              <Button
                type="text"
                size="small"
                icon={<BoldOutlined />}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onRunEditorCommand("bold")}
              />
              <Button
                type="text"
                size="small"
                icon={<ItalicOutlined />}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onRunEditorCommand("italic")}
              />
              <ToolbarDivider />
              <Button
                type="text"
                size="small"
                icon={<UnorderedListOutlined />}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onRunEditorCommand("insertUnorderedList")}
              />
              <Button
                type="text"
                size="small"
                icon={<OrderedListOutlined />}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onRunEditorCommand("insertOrderedList")}
              />
              <ToolbarDivider />
              <Button
                type="text"
                size="small"
                icon={<PictureOutlined />}
                onMouseDown={(event) => event.preventDefault()}
                onClick={onOpenImagePicker}
              />
            </EditorToolbar>
            )}

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={onInsertImage}
              style={{ display: "none" }}
            />

            <RichEditor
              ref={editorRef}
              contentEditable={!selectedNote.readOnly}
              suppressContentEditableWarning
              onInput={selectedNote.readOnly ? undefined : onEditorInput}
              onKeyDown={selectedNote.readOnly ? undefined : onEditorKeyDown}
            />
          </>
        ) : (
          <Empty
            description={texts.emptyEditor}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </EditorBody>
    </NotesEditor>
  );
}

export default NotesEditorPanel;
