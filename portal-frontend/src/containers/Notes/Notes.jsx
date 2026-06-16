import React from "react";
import { Spin } from "antd";
import LayoutWrapper from "@iso/components/utility/layoutWrapper";
import { NotesLayout, LayoutLoadingWrap, LayoutRoot } from "./Notes.styles";
import NotesSidebarPanel from "./Components/NotesSidebarPanel";
import NotesListPanel from "./Components/NotesListPanel";
import NotesEditorPanel from "./Components/NotesEditorPanel";
import NotesModals from "./Components/NotesModals";
import useNotesController from "./hooks/useNotesController";

export default function Notes() {
  const controller = useNotesController();

  if (!controller.accessToken && !controller.loading) {
    return null;
  }

  if (controller.loading) {
    return (
      <LayoutWrapper style={{ padding: 0 }}>
        <LayoutLoadingWrap>
          <Spin size="large" tip={controller.texts.loadingNotes} />
        </LayoutLoadingWrap>
      </LayoutWrapper>
    );
  }

  return (
    <LayoutWrapper style={{ padding: 0 }}>
      <LayoutRoot>
        <NotesLayout>
          <NotesSidebarPanel {...controller.sidebar} />
          <NotesListPanel {...controller.list} />
          <NotesEditorPanel {...controller.editor} />
        </NotesLayout>
        <NotesModals {...controller.modals} />
      </LayoutRoot>
    </LayoutWrapper>
  );
}
