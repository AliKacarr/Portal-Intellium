import { useCallback } from "react";
import { escapeHtml } from "../notesUtils";
import usePortalRichEditor from "@iso/components/Custom/PortalContentEditor/usePortalRichEditor";

export default function useNotesEditorActions({
  editorRef,
  imageInputRef,
  selectedNote,
  updateSelectedNote,
}) {
  const onContentChange = useCallback(
    (html) => {
      if (!selectedNote) return;
      updateSelectedNote({ content: html });
    },
    [selectedNote, updateSelectedNote]
  );

  const {
    runEditorCommand,
    applyFontSize,
    saveSelectionBeforeFontSize,
    getSelectedFontSize,
    handleEditorInput,
    handleEditorKeyDown,
  } = usePortalRichEditor({ editorRef, onContentChange });

  const handleInsertImageClick = useCallback(() => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  }, [imageInputRef]);

  const handleInsertImage = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const source = reader.result;
        if (typeof source !== "string") return;

        const safeName = escapeHtml(file.name || "image");
        runEditorCommand("insertHTML", `<img src="${source}" alt="${safeName}" />`);
      };

      reader.readAsDataURL(file);
      event.target.value = "";
    },
    [runEditorCommand]
  );

  return {
    runEditorCommand,
    applyFontSize,
    saveSelectionBeforeFontSize,
    getSelectedFontSize,
    handleEditorInput,
    handleEditorKeyDown,
    handleInsertImageClick,
    handleInsertImage,
  };
}
