import { useCallback, useEffect, useRef } from "react";
import { syncListMarkerFontSize } from "./portalRichContent";

function stripFontSizeFromNode(root) {
  if (!root) return;
  const elements = [];
  if (root.nodeType === Node.ELEMENT_NODE) elements.push(root);
  if (root.querySelectorAll) elements.push(...root.querySelectorAll("*"));
  elements.forEach((el) => {
    el.style?.removeProperty?.("font-size");
    el.style?.removeProperty?.("line-height");
    if (el.getAttribute?.("style") === "") el.removeAttribute("style");
  });
}

/** Seçili metne font-size uygular (liste maddesinde yalnızca metin büyür; işaret syncListMarkerFontSize ile). */
function applyFontSizeToRange(range, sizePx) {
  const size = `${Number(sizePx) || 14}px`;

  if (range.collapsed) {
    const span = document.createElement("span");
    span.style.fontSize = size;
    span.style.lineHeight = "1.3";
    span.appendChild(document.createTextNode("\u200b"));
    range.insertNode(span);
    const caret = document.createRange();
    caret.setStart(span.firstChild, 1);
    caret.collapse(true);
    return caret;
  }

  const span = document.createElement("span");
  span.style.fontSize = size;
  span.style.lineHeight = "1.3";

  try {
    const fragment = range.extractContents();
    stripFontSizeFromNode(fragment);
    span.appendChild(fragment);
    range.insertNode(span);

    const selectionRange = document.createRange();
    selectionRange.selectNodeContents(span);
    return selectionRange;
  } catch (_) {
    try {
      range.surroundContents(span);
      const selectionRange = document.createRange();
      selectionRange.selectNodeContents(span);
      return selectionRange;
    } catch (_) {
      return null;
    }
  }
}

/** Notlar editörü ile aynı contentEditable komutları (görsel hariç). */
export default function usePortalRichEditor({ editorRef, onContentChange }) {
  const lastRangeRef = useRef(null);

  useEffect(() => {
    const editor = editorRef?.current;
    if (!editor) return;

    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      if (!editor.contains(range.startContainer)) return;
      if (!range.collapsed) {
        lastRangeRef.current = range.cloneRange();
      } else if (!lastRangeRef.current || lastRangeRef.current.collapsed) {
        lastRangeRef.current = range.cloneRange();
      }
    };

    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [editorRef]);

  const syncEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    syncListMarkerFontSize(editor);
    onContentChange?.(editor.innerHTML);
  }, [editorRef, onContentChange]);

  const saveSelectionBeforeFontSize = useCallback(() => {
    const editor = editorRef?.current;
    if (!editor) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (editor.contains(range.startContainer)) {
      lastRangeRef.current = range.cloneRange();
    }
  }, [editorRef]);

  const getSelectedFontSize = useCallback(() => {
    const editor = editorRef?.current;
    if (!editor) return null;
    const range = lastRangeRef.current;
    if (!range) return null;
    try {
      let node = range.startContainer;
      if (node.nodeType === 3) node = node.parentElement;
      if (!node) return null;

      let el = node.nodeType === 1 ? node : node.parentElement;
      while (el && el !== editor) {
        if (el.style?.fontSize) {
          const px = parseInt(el.style.fontSize, 10);
          if (!Number.isNaN(px)) return px;
        }
        el = el.parentElement;
      }

      const target = node.nodeType === 1 ? node : node.parentElement;
      if (!target) return null;
      const px = parseInt(window.getComputedStyle(target).fontSize, 10);
      return Number.isNaN(px) ? null : px;
    } catch (_) {
      return null;
    }
  }, [editorRef]);

  const runEditorCommand = useCallback(
    (command, value = null) => {
      const editor = editorRef.current;
      if (!editor) return;

      editor.focus();
      const range = lastRangeRef.current;
      const hasListSelection =
        range &&
        !range.collapsed &&
        (() => {
          const container = document.createElement("div");
          container.appendChild(range.cloneContents());
          return /<(?:li|ol|ul)\b/i.test(container.innerHTML);
        })();

      if (hasListSelection && (command === "bold" || command === "italic")) {
        const allLis = editor.querySelectorAll("ol li, ul li");
        const selectedLis = [...allLis].filter((li) => range.intersectsNode(li));
        if (selectedLis.length > 0) {
          const prop = command === "bold" ? "fontWeight" : "fontStyle";
          const toggleVal = command === "bold" ? "bold" : "italic";
          const removeVal = "normal";
          const allBold = selectedLis.every((li) => {
            const s = li.style?.[prop] || window.getComputedStyle(li)[prop];
            return command === "bold" ? s === "bold" || s === "700" : s === "italic" || s === "oblique";
          });
          const applyVal = allBold ? removeVal : toggleVal;
          selectedLis.forEach((li) => {
            li.style[prop] = applyVal;
          });
          syncEditor();
          return;
        }
      }

      document.execCommand(command, false, value);
      if (command === "insertOrderedList" || command === "insertUnorderedList") {
        const editor = editorRef.current;
        if (editor) syncListMarkerFontSize(editor);
      }
      syncEditor();
    },
    [editorRef, syncEditor]
  );

  const applyFontSize = useCallback(
    (pixels) => {
      const editor = editorRef.current;
      if (!editor) return;

      const range = lastRangeRef.current;
      if (!range) return;

      const apply = () => {
        editor.focus();
        const selection = window.getSelection();
        if (!selection) return;

        let workingRange = range;
        try {
          if (range.startContainer?.isConnected !== false) {
            selection.removeAllRanges();
            selection.addRange(range);
            workingRange = selection.getRangeAt(0);
          } else {
            return;
          }
        } catch (_) {
          return;
        }

        const nextRange = applyFontSizeToRange(workingRange, pixels);
        if (nextRange) {
          try {
            selection.removeAllRanges();
            selection.addRange(nextRange);
            lastRangeRef.current = nextRange.cloneRange();
          } catch (_) {}
        }

        syncEditor();
      };

      requestAnimationFrame(apply);
    },
    [editorRef, syncEditor]
  );

  const handleEditorInput = useCallback(() => {
    syncEditor();
  }, [syncEditor]);

  const handleEditorKeyDown = useCallback(
    (event) => {
      if (event.key !== "Enter" || event.shiftKey) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      let node = selection.anchorNode;
      if (!node) return;
      if (node.nodeType === 3) node = node.parentElement;

      const listItem = node?.closest ? node.closest("li") : null;
      if (!listItem) return;

      const currentText = listItem.textContent.replace(/\u200b/g, "").trim();
      if (currentText !== "") return;

      event.preventDefault();
      document.execCommand("outdent", false, null);
      syncEditor();
    },
    [syncEditor]
  );

  return {
    runEditorCommand,
    applyFontSize,
    saveSelectionBeforeFontSize,
    getSelectedFontSize,
    handleEditorInput,
    handleEditorKeyDown,
  };
}
