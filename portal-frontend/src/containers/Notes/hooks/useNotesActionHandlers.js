import React, { useCallback, useMemo } from "react";
import { Tooltip } from "antd";
import {
  DeleteOutlined,
  ExportOutlined,
  FolderOpenOutlined,
  RollbackOutlined,
  TagsOutlined,
} from "@ant-design/icons";
import useNotesSidebarActions from "./useNotesSidebarActions";
import useNotesNoteActions from "./useNotesNoteActions";
import useNotesSharingActions from "./useNotesSharingActions";
import { getNoteFolderIds } from "../notesHelpers";

export default function useNotesActionHandlers(params) {
  const sidebarActions = useNotesSidebarActions({
    accessToken: params.accessToken,
    folders: params.folders,
    handleUnauthorized: params.handleUnauthorized,
    notesRef: params.notesRef,
    refreshAllNotes: params.refreshAllNotes,
    setActiveFolderId: params.setActiveFolderId,
    setActiveTagIds: params.setActiveTagIds,
    setFolders: params.setFolders,
    setLibraryFilter: params.setLibraryFilter,
    setNotes: params.setNotes,
    setOpenedFolders: params.setOpenedFolders,
    setSelectedNoteId: params.setSelectedNoteId,
    setTags: params.setTags,
    tags: params.tags,
    texts: params.texts,
  });

  const noteActions = useNotesNoteActions({
    accessToken: params.accessToken,
    activeFolderId: params.activeFolderId,
    folders: params.folders,
    handleUnauthorized: params.handleUnauthorized,
    libraryFilter: params.libraryFilter,
    locale: params.locale,
    notesRef: params.notesRef,
    refreshAllNotes: params.refreshAllNotes,
    selectedNote: params.selectedNote,
    selectedNoteId: params.selectedNoteId,
    selectedNoteRef: params.selectedNoteRef,
    setActiveFolderId: params.setActiveFolderId,
    setActiveTagIds: params.setActiveTagIds,
    setLibraryFilter: params.setLibraryFilter,
    setNotes: params.setNotes,
    setOpenedFolders: params.setOpenedFolders,
    setEditTagsModalVisible: params.setEditTagsModalVisible,
    setSelectedTagIdsDraft: params.setSelectedTagIdsDraft,
    setSelectedNoteId: params.setSelectedNoteId,
    setSelectedNoteDetail: params.setSelectedNoteDetail,
    setSharedNotes: params.setSharedNotes,
    setTrashNotes: params.setTrashNotes,
    setTags: params.setTags,
    selectedTagIdsDraft: params.selectedTagIdsDraft,
    tags: params.tags,
    texts: params.texts,
  });

  const sharingActions = useNotesSharingActions({
    accessToken: params.accessToken,
    handleUnauthorized: params.handleUnauthorized,
    selectedNote: params.selectedNote,
    selectedNoteId: params.selectedNoteId,
    setShareModalVisible: params.setShareModalVisible,
    setShareReadOnly: params.setShareReadOnly,
    setShareUserId: params.setShareUserId,
    setSharedUsersList: params.setSharedUsersList,
    setSharedUsersLoading: params.setSharedUsersLoading,
    sharedUsersList: params.sharedUsersList,
    texts: params.texts,
    shareReadOnly: params.shareReadOnly,
    shareUserId: params.shareUserId,
  });

  const moreActionsMenuItems = useMemo(() => {
    const note = params.selectedNote;
    const isRecipient =
      note?.readOnly === true ||
      note?.sharedBy != null ||
      note?.SharedBy != null;
    const disabledLabelStyle = { opacity: 0.5, cursor: "not-allowed" };
    const disabledItemStyle = {
      ...disabledLabelStyle,
      pointerEvents: "none",
    };
    const wrapDisabledLabel = (text) =>
      isRecipient ? (
        <Tooltip title={params.texts.sharedNoteNotOwnerHint}>
          <span style={disabledLabelStyle}>{text}</span>
        </Tooltip>
      ) : (
        text
      );

    const items = [
      {
        key: "edit-tags",
        icon: <TagsOutlined />,
        label: wrapDisabledLabel(params.texts.moreEditTags),
        disabled: isRecipient,
        style: isRecipient ? disabledItemStyle : undefined,
      },
      {
        key: "move",
        icon: <FolderOpenOutlined />,
        label: wrapDisabledLabel(params.texts.moreMove),
        disabled: isRecipient,
        style: isRecipient ? disabledItemStyle : undefined,
        children: params.folders.map((folder) => ({
          key: `move:${folder.id}`,
          label: folder.title,
        })),
      },
      ...(getNoteFolderIds(note).length > 0
        ? [
          {
            key: "remove-from-folder",
            icon: <FolderOpenOutlined />,
            label: wrapDisabledLabel(params.texts.moreRemoveFromFolder),
            disabled: isRecipient,
            style: isRecipient ? disabledItemStyle : undefined,
          },
        ]
        : []),
      {
        key: "export",
        icon: <ExportOutlined />,
        label: params.texts.moreExport,
        children: [
          { key: "export-pdf", label: params.texts.moreExportPdf },
          { key: "export-txt", label: params.texts.moreExportTxt },
        ],
      },
      { type: "divider" },
    ];

    if (params.selectedNoteDeleted) {
      items.push({
        key: "restore",
        icon: <RollbackOutlined />,
        label: params.texts.moreRestore,
      });
    } else {
      items.push({
        key: "delete",
        danger: true,
        icon: <DeleteOutlined />,
        label: params.texts.moreDelete,
      });
    }

    return items;
  }, [
    params.folders,
    params.selectedNote,
    params.selectedNoteDeleted,
    params.texts,
  ]);

  const shareMenuItems = useMemo(
    () => [
      {
        key: "share-note",
        label: params.texts.moreShare,
      },
    ],
    [params.texts]
  );

  const handleShareMenuClick = useCallback(
    ({ key }) => {
      if (!params.selectedNote) return;

      if (key === "share-note") {
        sharingActions.openShareModal();
        return;
      }
    },
    [noteActions, params.selectedNote, sharingActions]
  );

  const handleMoreMenuClick = useCallback(
    ({ key }) => {
      if (!params.selectedNote) return;
      const isReadOnlyShared = params.selectedNote.readOnly === true;
      if (isReadOnlyShared && ["edit-tags", "remove-from-folder"].includes(key)) return;
      if (isReadOnlyShared && typeof key === "string" && key.startsWith("move:")) return;

      if (key === "edit-tags") {
        noteActions.handleEditTagsSelected();
        return;
      }
      if (key === "delete") {
        noteActions.softDeleteSelected();
        return;
      }
      if (key === "restore") {
        noteActions.restoreFromTrash();
        return;
      }
      if (key === "export-pdf") {
        sharingActions.handleExport("pdf");
        return;
      }
      if (key === "export-txt") {
        sharingActions.handleExport("txt");
        return;
      }
      if (key === "remove-from-folder") {
        noteActions.removeSelectedNoteFromFolder();
        return;
      }
      if (typeof key === "string" && key.startsWith("move:")) {
        noteActions.moveSelectedNoteToFolder(key.slice(5));
      }
    },
    [noteActions, params.selectedNote, sharingActions]
  );

  return {
    ...sidebarActions,
    ...noteActions,
    ...sharingActions,
    moreActionsMenuItems,
    shareMenuItems,
    handleShareMenuClick,
    handleMoreMenuClick,
  };
}
