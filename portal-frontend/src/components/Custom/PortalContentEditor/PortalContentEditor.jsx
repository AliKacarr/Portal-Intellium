import React, { useEffect, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { Button, Dropdown } from "antd";
import {
  BoldOutlined,
  ItalicOutlined,
  UnorderedListOutlined,
  OrderedListOutlined,
} from "@ant-design/icons";
import usePortalRichEditor from "./usePortalRichEditor";
import { PORTAL_FONT_SIZES, toEditorHtml, syncListMarkerFontSize } from "./portalRichContent";
import {
  PortalEditorWrap,
  PortalEditorToolbar,
  PortalRichEditor,
  ToolbarDivider,
} from "./portalContentEditor.styles";
import "./portalContentEditor.css";

function PortalContentEditor({
  value,
  onChange,
  placeholder,
  minHeight = 160,
  readOnly = false,
}) {
  const editorRef = useRef(null);
  const lastPropValueRef = useRef(value);
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  const [displayedFontSize, setDisplayedFontSize] = useState(null);

  const onContentChange = useCallback(
    (html) => {
      lastPropValueRef.current = html;
      onChange?.(html);
    },
    [onChange]
  );

  const {
    runEditorCommand,
    applyFontSize,
    saveSelectionBeforeFontSize,
    getSelectedFontSize,
    handleEditorInput,
    handleEditorKeyDown,
  } = usePortalRichEditor({ editorRef, onContentChange });

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (value === lastPropValueRef.current && editor.innerHTML) return;
    lastPropValueRef.current = value;
    editor.innerHTML = toEditorHtml(value || "");
    syncListMarkerFontSize(editor);
  }, [value]);

  useEffect(() => {
    const onSelectionChange = () => {
      const sz = getSelectedFontSize?.();
      setDisplayedFontSize(sz);
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [getSelectedFontSize]);

  useEffect(() => {
    const handleMouseDown = () => saveSelectionBeforeFontSize();
    document.addEventListener("mousedown", handleMouseDown, true);
    return () => document.removeEventListener("mousedown", handleMouseDown, true);
  }, [saveSelectionBeforeFontSize]);

  return (
    <PortalEditorWrap className="portal-content-editor">
      {!readOnly && (
        <PortalEditorToolbar>
          <Dropdown
            open={fontSizeDropdownOpen}
            onOpenChange={setFontSizeDropdownOpen}
            trigger={["click"]}
            menu={{
              items: PORTAL_FONT_SIZES.map((n) => ({ key: String(n), label: String(n) })),
              onClick: ({ key }) => {
                applyFontSize(Number(key));
                setFontSizeDropdownOpen(false);
              },
            }}
          >
            <div
              role="button"
              tabIndex={0}
              onMouseDown={(e) => {
                e.preventDefault();
                saveSelectionBeforeFontSize();
              }}
              onClick={() => setFontSizeDropdownOpen((v) => !v)}
              className="portal-font-size-trigger"
            >
              <span className="portal-font-size-value">
                {displayedFontSize ?? "Boyut"}
              </span>
              <span className="portal-font-size-caret">▼</span>
            </div>
          </Dropdown>
          <ToolbarDivider />
          <Button
            type="text"
            size="small"
            icon={<BoldOutlined />}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runEditorCommand("bold")}
          />
          <Button
            type="text"
            size="small"
            icon={<ItalicOutlined />}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runEditorCommand("italic")}
          />
          <ToolbarDivider />
          <Button
            type="text"
            size="small"
            icon={<UnorderedListOutlined />}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runEditorCommand("insertUnorderedList")}
          />
          <Button
            type="text"
            size="small"
            icon={<OrderedListOutlined />}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => runEditorCommand("insertOrderedList")}
          />
        </PortalEditorToolbar>
      )}

      <PortalRichEditor
        ref={editorRef}
        $minHeight={minHeight}
        data-placeholder={placeholder || ""}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={readOnly ? undefined : handleEditorInput}
        onKeyDown={readOnly ? undefined : handleEditorKeyDown}
        className="portal-rich-editor-surface"
      />
    </PortalEditorWrap>
  );
}

PortalContentEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  minHeight: PropTypes.number,
  readOnly: PropTypes.bool,
};

export default PortalContentEditor;
