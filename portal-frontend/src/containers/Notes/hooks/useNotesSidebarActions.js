import { useCallback } from "react";
import { message } from "antd";
import { slugifyTag } from "../notesUtils";
import { tagPalette } from "../notesInitialData";
import { createTag as apiCreateTag, getTags as apiGetTags } from "../../../Api/TagsApi";
import { deleteFolder as apiDeleteFolder, createFolder as apiCreateFolder } from "../../../Api/NotesApi";
import {
  extractList,
  getNoteFolderIds,
  normalizeId,
} from "../notesHelpers";
import { openConfirmDialog, openTextInputDialog } from "../notesDialogs";

export default function useNotesSidebarActions({
  accessToken,
  folders,
  handleUnauthorized,
  notesRef,
  refreshAllNotes,
  setActiveFolderId,
  setActiveTagIds,
  setFolders,
  setLibraryFilter,
  setNotes,
  setOpenedFolders,
  setSelectedNoteId,
  setTags,
  tags,
  texts,
}) {
  const openFolderForNote = useCallback(
    (folderId, noteId) => {
      const normalizedFolderId = normalizeId(folderId);
      if (!normalizedFolderId) return;
      setLibraryFilter("all");
      setActiveFolderId(normalizedFolderId);
      setOpenedFolders((prev) => ({ ...prev, [normalizedFolderId]: true }));
      setSelectedNoteId(noteId);
    },
    [setActiveFolderId, setLibraryFilter, setOpenedFolders, setSelectedNoteId]
  );

  const handleFolderSelect = useCallback(
    (folder) => {
      const normalizedFolderId = normalizeId(folder?.id);
      if (!normalizedFolderId) {
        setActiveFolderId("all");
        return;
      }
      setActiveFolderId((prev) =>
        normalizeId(prev) === normalizedFolderId ? "all" : normalizedFolderId
      );
    },
    [setActiveFolderId]
  );

  const toggleFolderOpen = useCallback(
    (folderId) => {
      const normalizedFolderId = normalizeId(folderId);
      if (!normalizedFolderId) return;
      setOpenedFolders((prev) => ({
        ...prev,
        [normalizedFolderId]: !prev[normalizedFolderId],
      }));
    },
    [setOpenedFolders]
  );

  const handleAddFolder = useCallback(async () => {
    const name = await openTextInputDialog({
      title: texts.addFolderPrompt,
      placeholder: texts.addFolderPrompt,
      okText: texts.createButton,
      cancelText: texts.cancelButton,
    });
    if (!name) return;

    if (!accessToken) {
      message.warning("Giriş yapmalısınız.");
      return;
    }

    try {
      const created = await apiCreateFolder(accessToken, name);
      const nextId = String(created.id ?? created.Id ?? created.title ?? name);
      
      const newFolder = { id: nextId, title: name };
      setFolders((prev) => [...prev, newFolder]);
      setOpenedFolders((prev) => ({ ...prev, [nextId]: false }));
      setActiveFolderId(nextId);
    } catch (err) {
      if (err?.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      message.error(err?.response?.data?.message || "Klasör oluşturulamadı.");
    }
  }, [
    accessToken,
    handleUnauthorized,
    folders,
    setActiveFolderId,
    setFolders,
    setOpenedFolders,
    texts.addFolderPrompt,
    texts.cancelButton,
    texts.createButton,
  ]);

  const handleDeleteFolder = useCallback(
    async (folderId) => {
      const normalizedFolderId = normalizeId(folderId);
      if (!normalizedFolderId) return;

      const folderExists = folders.some(
        (item) => normalizeId(item.id) === normalizedFolderId
      );
      if (!folderExists) return;

      const confirmed = await openConfirmDialog({
        title: texts.deleteFolder,
        content: texts.deleteFolderConfirm,
        okText: texts.deleteButton,
        cancelText: texts.cancelButton,
        danger: true,
      });
      if (!confirmed) return;

      const folder = folders.find(
        (item) => normalizeId(item.id) === normalizedFolderId
      );
      const folderTitle = folder?.title ?? normalizedFolderId;

      if (accessToken) {
        try {
          await apiDeleteFolder(accessToken, folderTitle);
        } catch (err) {
          if (err?.response?.status === 401) {
            handleUnauthorized();
            return;
          }
          const msg =
            err?.response?.data?.message ??
            err?.response?.data?.Message ??
            err?.response?.data?.title ??
            err?.response?.data?.Title;
          message.error(msg || texts.folderDeleteNotPersisted);
          return;
        }
      }

      const remainingFolders = folders.filter(
        (item) => normalizeId(item.id) !== normalizedFolderId
      );
      const folderTitleById = new Map(
        remainingFolders.map((item) => [normalizeId(item.id), item.title])
      );

      setFolders(remainingFolders);
      setOpenedFolders((prev) => {
        const next = { ...prev };
        delete next[normalizedFolderId];
        return next;
      });
      setActiveFolderId((prev) =>
        normalizeId(prev) === normalizedFolderId ? "all" : prev
      );
      setLibraryFilter((prev) => (prev === "shared" ? prev : "all"));

      setNotes((prev) =>
        prev.map((note) => {
          const currentFolderIds = getNoteFolderIds(note);
          if (!currentFolderIds.includes(normalizedFolderId)) return note;

          const nextFolderIds = currentFolderIds.filter((id) => id !== normalizedFolderId);
          const nextFolderId = nextFolderIds[0] ?? null;
          const nextFolderPath =
            nextFolderId ? folderTitleById.get(nextFolderId) || "" : "";

          return {
            ...note,
            folderIds: nextFolderIds,
            folderId: nextFolderId,
            folderPath: nextFolderPath,
          };
        })
      );

      message.success(texts.folderDeletedSuccess);
    },
    [
      accessToken,
      folders,
      handleUnauthorized,
      notesRef,
      setActiveFolderId,
      setFolders,
      setLibraryFilter,
      setNotes,
      setOpenedFolders,
      texts.deleteFolderConfirm,
      texts.deleteFolder,
      texts.deleteButton,
      texts.folderDeleteNotPersisted,
      texts.folderDeletedSuccess,
      texts.cancelButton,
    ]
  );

  const toggleTagFilter = useCallback(
    (tagId) => {
      setActiveTagIds((prev) =>
        prev.includes(tagId)
          ? prev.filter((id) => id !== tagId)
          : [...prev, tagId]
      );
    },
    [setActiveTagIds]
  );

  const handleAddTag = useCallback(async () => {
    const title = await openTextInputDialog({
      title: texts.addTagPrompt,
      placeholder: texts.addTagPrompt,
      okText: texts.createButton,
      cancelText: texts.cancelButton,
    });
    if (!title) return;

    if (!accessToken) {
      message.warning(texts.loginRequiredForTags);
      return;
    }

    const duplicate = tags.some(
      (tag) => String(tag.name || "").trim().toLowerCase() === title.toLowerCase()
    );
    if (duplicate) {
      message.warning(texts.duplicateTag);
      return;
    }

    try {
      const colorCode = tagPalette[tags.length % tagPalette.length];
      await apiCreateTag(accessToken, title, colorCode);

      const tagsData = await apiGetTags(accessToken).catch(() => null);
      const backendTags = extractList(tagsData)
        .map((tag, index) => ({
          id: tag.id ?? tag.Id,
          name: tag.title || tag.Title || tag.name || tag.Name || String(tag.id ?? tag.Id),
          color:
            tag.colorCode ?? tag.ColorCode ?? tag.color ?? tag.Color ?? tagPalette[index % tagPalette.length],
        }))
        .filter((tag) => tag.id != null && tag.id !== "");

      if (backendTags.length > 0) {
        setTags((prev) => {
          const backendIdSet = new Set(backendTags.map((tag) => String(tag.id)));
          const fallbackTags = prev.filter((tag) => !backendIdSet.has(String(tag.id)));
          return [...backendTags, ...fallbackTags];
        });
      }

      message.success(texts.tagCreated);
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      if (err.response?.status === 409) {
        message.warning(texts.duplicateTag);
        return;
      }

      const errorMessage =
        err.message && err.message !== "Tag title is required"
          ? err.message
          : err.response?.data?.message ||
            err.response?.data?.title ||
            (typeof err.response?.data === "string" ? err.response.data : null) ||
            (err.responseData && (err.responseData?.message || err.responseData?.title || (typeof err.responseData === "string" ? err.responseData : null)));
      const statusText = (err.status || err.response?.status) ? ` (HTTP ${err.status || err.response?.status})` : "";
      const debugHint = Array.isArray(err.attempts) && err.attempts.length > 0
        ? ` ${texts.attemptedRoute}: ${err.attempts[err.attempts.length - 1].url}`
        : "";

      message.error(
        `${errorMessage || texts.tagCreateFailed}${statusText}${debugHint}`
      );
    }
  }, [
    accessToken,
    handleUnauthorized,
    setTags,
    tags,
    texts.addTagPrompt,
    texts.cancelButton,
    texts.createButton,
    texts.loginRequiredForTags,
    texts.duplicateTag,
    texts.tagCreated,
    texts.tagCreateFailed,
    texts.attemptedRoute,
  ]);

  const handleLibrarySelect = useCallback(
    (nextFilter) => {
      setLibraryFilter(nextFilter);
      setActiveFolderId("all");
    },
    [setActiveFolderId, setLibraryFilter]
  );

  const handleLoadAllNotes = useCallback(() => {
    if (!accessToken) return;

    refreshAllNotes().catch((err) => {
      if (err.response?.status === 401) {
        handleUnauthorized();
      }
    });
  }, [accessToken, handleUnauthorized, refreshAllNotes]);

  return {
    openFolderForNote,
    handleFolderSelect,
    toggleFolderOpen,
    handleAddFolder,
    handleDeleteFolder,
    toggleTagFilter,
    handleAddTag,
    handleLibrarySelect,
    handleLoadAllNotes,
  };
}
