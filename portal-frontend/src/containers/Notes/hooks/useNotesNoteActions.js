import { useCallback, useEffect, useRef } from "react";
import { message, Modal } from "antd";
import {
  addFolderToNote as apiAddFolderToNote,
  removeFolderFromNote as apiRemoveFolderFromNote,
  removeNoteFromFolder as apiRemoveNoteFromFolder,
  createNote as apiCreateNote,
  updateNote as apiUpdateNote,
  deleteNote as apiDeleteNote,
  permanentlyDeleteNote as apiPermanentlyDeleteNote,
  addTagToNote as apiAddTagToNote,
  removeTagFromNote as apiRemoveTagFromNote,
  setNoteReminder as apiSetNoteReminder,
  addNoteReminder as apiAddNoteReminder,
  deleteNoteReminder as apiDeleteNoteReminder,
} from "../../../Api/NotesApi";
import { deleteTag as apiDeleteTag, getTags as apiGetTags } from "../../../Api/TagsApi";
import { findFolderById, findFolderPathById } from "../notesUtils";
import {
  buildNotePayload,
  buildNotePayloadForPut,
  formatNoteDate,
  getNoteFolderIds,
  mergeTagsFromApi,
  normalizeId,
  normalizeCreatedNote,
  normalizeNotesList,
} from "../notesHelpers";
import { openConfirmDialog } from "../notesDialogs";
import { rememberPermanentlyDeletedNoteId } from "../notesStorage";

const SAVE_DEBOUNCE_MS = 800;

export default function useNotesNoteActions({
  accessToken,
  activeFolderId,
  folders,
  handleUnauthorized,
  libraryFilter,
  locale,
  notesRef,
  refreshAllNotes,
  selectedNote,
  selectedNoteId,
  selectedNoteRef,
  setActiveFolderId,
  setActiveTagIds,
  setLibraryFilter,
  setNotes,
  setOpenedFolders,
  setEditTagsModalVisible,
  setSelectedTagIdsDraft,
  setSelectedNoteId,
  setSelectedNoteDetail,
  setSharedNotes,
  setTrashNotes,
  setTags,
  selectedTagIdsDraft,
  tags,
  texts,
}) {
  const saveTimeoutRef = useRef(null);
  const pendingPatchRef = useRef({});

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const updateSelectedNote = useCallback(
    (patch) => {
      pendingPatchRef.current = { ...pendingPatchRef.current, ...patch };
      const updatedAt = formatNoteDate(new Date(), locale);

      setNotes((prev) =>
        prev.map((note) =>
          note.id === selectedNoteId
            ? { ...note, ...patch, updatedAt }
            : note
        )
      );

      if (libraryFilter === "shared") {
        setSharedNotes((prev) =>
          prev.map((note) =>
            String(note.id) === String(selectedNoteId)
              ? { ...note, ...patch, updatedAt }
              : note
          )
        );
        setSelectedNoteDetail((prev) =>
          prev && String(prev.id) === String(selectedNoteId)
            ? { ...prev, ...patch, updatedAt }
            : prev
        );
      }

      if (!accessToken || !selectedNoteId) return;

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(() => {
        const note = selectedNoteRef?.current ?? notesRef.current.find((n) => n.id === selectedNoteId);
        if (!note || String(note.id) !== String(selectedNoteId)) return;

        const merged = { ...note, ...pendingPatchRef.current };
        pendingPatchRef.current = {};
        const isSharedRecipient =
          note.readOnly === true ||
          note.sharedBy != null ||
          note.SharedBy != null;
        const payload = buildNotePayloadForPut(merged, {
          sharedRecipient: isSharedRecipient,
        });

        apiUpdateNote(accessToken, note.id, payload)
          .then((resData) => {
            const list = normalizeNotesList(
              Array.isArray(resData) ? resData : [resData],
              locale
            );
            const normalized = list[0];
            if (!normalized) return;

            setNotes((prev) => {
              const next = prev.map((n) =>
                String(n.id) === String(normalized.id)
                  ? { ...n, ...normalized }
                  : n
              );
              next.sort(
                (a, b) =>
                  new Date(b.updatedAtRaw || b.updatedAt || 0).getTime() -
                  new Date(a.updatedAtRaw || a.updatedAt || 0).getTime()
              );
              return next;
            });
            if (libraryFilter === "shared") {
              setSharedNotes((prev) => {
                const next = prev.map((n) =>
                  String(n.id) === String(normalized.id)
                    ? { ...n, ...normalized }
                    : n
                );
                next.sort(
                  (a, b) =>
                    new Date(b.updatedAtRaw || b.updatedAt || 0).getTime() -
                    new Date(a.updatedAtRaw || a.updatedAt || 0).getTime()
                );
                return next;
              });
              setSelectedNoteDetail((prev) =>
                prev && String(prev.id) === String(normalized.id)
                  ? normalized
                  : prev
              );
            }
          })
          .catch((err) => {
            if (err.response?.status === 401) {
              handleUnauthorized();
              return;
            }
            if (err.response?.status === 403) {
              const msg =
                err.response?.data?.message ??
                err.response?.data?.Message ??
                err.response?.data?.title ??
                err.response?.data?.Title;
              message.error(msg || texts.noteUpdateFailed);
              return;
            }
            message.error(texts.noteUpdateFailed);
          });
      }, SAVE_DEBOUNCE_MS);
    },
    [
      accessToken,
      handleUnauthorized,
      libraryFilter,
      locale,
      notesRef,
      selectedNoteId,
      selectedNoteRef,
      setNotes,
      setSelectedNoteDetail,
      setSharedNotes,
      texts.noteUpdateFailed,
    ]
  );

  const setReminderForSelected = useCallback(
    async (reminderAtIsoOrNull) => {
      const note = selectedNoteRef?.current;
      if (!accessToken || !note?.id) return;
      if (note.readOnly === true) {
        message.warning(texts.sharedNoteNotOwnerHint);
        return;
      }
      try {
        // Optimistic UI
        if (reminderAtIsoOrNull == null) {
          updateSelectedNote({ reminderAt: null, reminders: [] });
          const updated = await apiSetNoteReminder(accessToken, note.id, null);
          // Owned notes: editor selectedNote, notes listesinden geliyor → listeyi de güncelle
          setNotes((prev) =>
            prev.map((n) => (String(n.id) === String(note.id) ? { ...n, ...updated } : n))
          );
          setSharedNotes((prev) =>
            prev.map((n) => (String(n.id) === String(note.id) ? { ...n, ...updated } : n))
          );
          setSelectedNoteDetail((prev) =>
            prev && String(prev.id) === String(note.id) ? { ...prev, ...updated } : prev
          );
          return;
        }

        const updated = await apiAddNoteReminder(accessToken, note.id, reminderAtIsoOrNull);
        // Backend normalize edilmiş not döndürüyor; state'i tazele
        setNotes((prev) =>
          prev.map((n) => (String(n.id) === String(note.id) ? { ...n, ...updated } : n))
        );
        setSharedNotes((prev) =>
          prev.map((n) => (String(n.id) === String(note.id) ? { ...n, ...updated } : n))
        );
        setSelectedNoteDetail((prev) =>
          prev && String(prev.id) === String(note.id) ? { ...prev, ...updated } : prev
        );
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("set note reminder error:", e);
        const apiMsg =
          e?.response?.data?.message ??
          e?.response?.data?.Message ??
          e?.response?.data?.title ??
          e?.response?.data?.Title;
        message.error(apiMsg || texts.reminderSaveFailed);
      }
    },
    [accessToken, selectedNoteRef, updateSelectedNote, setNotes, setSharedNotes, setSelectedNoteDetail, texts]
  );

  const deleteReminderForSelected = useCallback(
    async (reminderId) => {
      const note = selectedNoteRef?.current;
      if (!accessToken || !note?.id || !reminderId) return;
      try {
        await apiDeleteNoteReminder(accessToken, note.id, reminderId);
        // Local state: kaldır
        const applyRemove = (prevNote) => {
          if (!prevNote || String(prevNote.id) !== String(note.id)) return prevNote;
          const nextReminders = Array.isArray(prevNote.reminders)
            ? prevNote.reminders.filter((r) => String(r.id) !== String(reminderId))
            : [];
          return {
            ...prevNote,
            reminders: nextReminders,
            reminderAt: nextReminders[0]?.reminderAt ?? null,
          };
        };
        setSelectedNoteDetail((prev) => applyRemove(prev));
        setNotes((prev) => prev.map((n) => applyRemove(n)));
        setSharedNotes((prev) => prev.map((n) => applyRemove(n)));
      } catch (e) {
        const apiMsg =
          e?.response?.data?.message ??
          e?.response?.data?.Message ??
          e?.response?.data?.title ??
          e?.response?.data?.Title;
        message.error(apiMsg || texts.reminderDeleteFailed);
      }
    },
    [accessToken, selectedNoteRef, setSelectedNoteDetail, setNotes, setSharedNotes, texts]
  );

  const handleNewNote = useCallback(async () => {
    if (!accessToken) {
      message.warning(texts.loginRequired);
      return;
    }

    let targetFolderId = null;
    if (activeFolderId !== "all") {
      const selectedFolder = findFolderById(folders, activeFolderId);
      if (selectedFolder) targetFolderId = normalizeId(selectedFolder.id);
    }

    const targetFolderPath =
      targetFolderId ? findFolderPathById(folders, targetFolderId) : texts.notesTitleAll;

    const folderIds = targetFolderId ? [targetFolderId] : [];

    const payload = {
      title: texts.untitledNote,
      folderId: targetFolderId,
      folderIds,
      folderPath: targetFolderPath || texts.notesTitleAll,
      tagIds: [],
      content: "",
      isFavorite: false,
      isDeleted: false,
    };

    try {
      const created = await apiCreateNote(accessToken, payload);
      const normalizedCreated = normalizeCreatedNote(
        created,
        targetFolderId,
        folderIds,
        locale
      );
      setNotes((prev) => [normalizedCreated, ...prev]);
      setSelectedNoteId(created.id);
      setLibraryFilter("all");
      setActiveFolderId(targetFolderId || "all");
      setActiveTagIds([]);
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      message.error(texts.noteCreateFailed);
    }
  }, [
    accessToken,
    activeFolderId,
    folders,
    handleUnauthorized,
    locale,
    setActiveFolderId,
    setActiveTagIds,
    setLibraryFilter,
    setNotes,
    setSelectedNoteId,
    texts.loginRequired,
    texts.noteCreateFailed,
    texts.notesTitleAll,
    texts.untitledNote,
  ]);

  const toggleFavorite = useCallback(() => {
    if (!selectedNote) return;
    updateSelectedNote({ isFavorite: !selectedNote.isFavorite });
  }, [selectedNote, updateSelectedNote]);

  const softDeleteSelected = useCallback(async () => {
    if (!selectedNoteId || !accessToken) return;

    try {
      await apiDeleteNote(accessToken, selectedNoteId);
      setNotes((prev) =>
        prev.map((note) =>
          note.id === selectedNoteId ? { ...note, isDeleted: true } : note
        )
      );
      setLibraryFilter("trash");
      setActiveFolderId("all");
      setSelectedNoteId(selectedNoteId);
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      message.error(texts.noteDeleteFailed);
    }
  }, [
    accessToken,
    handleUnauthorized,
    selectedNoteId,
    setActiveFolderId,
    setLibraryFilter,
    setNotes,
    setSelectedNoteId,
    texts.noteDeleteFailed,
  ]);

  const restoreFromTrash = useCallback(async () => {
    if (!selectedNote || !selectedNoteId || !accessToken) return;

    try {
      await apiUpdateNote(accessToken, selectedNoteId, {
        ...buildNotePayload(selectedNote),
        isDeleted: false,
      });

      setNotes((prev) => {
        const exists = prev.some((n) => String(n.id) === String(selectedNoteId));
        if (exists) {
          return prev.map((note) =>
            String(note.id) === String(selectedNoteId)
              ? { ...note, isDeleted: false }
              : note
          );
        }
        return [{ ...selectedNote, isDeleted: false }, ...prev];
      });
      if (setTrashNotes) {
        setTrashNotes((prev) =>
          prev.filter((n) => String(n.id) !== String(selectedNoteId))
        );
      }
      setLibraryFilter("all");
      setSelectedNoteId(selectedNoteId);
      message.success(texts.noteRestoreSuccess);
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      if (err.response?.status === 403) {
        const msg = err.response?.data?.message ?? err.response?.data?.Message ?? err.response?.data?.title ?? err.response?.data?.Title;
        message.error(msg || texts.noteRestoreFailed);
        return;
      }
      message.error(texts.noteRestoreFailed);
    }
  }, [
    accessToken,
    handleUnauthorized,
    selectedNote,
    selectedNoteId,
    setLibraryFilter,
    setNotes,
    setTrashNotes,
    setSelectedNoteId,
    texts.noteRestoreFailed,
    texts.noteRestoreSuccess,
  ]);

  const permanentlyDeleteSelected = useCallback(async () => {
    if (!selectedNote || !selectedNoteId || !accessToken) return;
    if (!selectedNote.isDeleted) return;

    const confirmed = await openConfirmDialog({
      title: texts.permanentlyDelete,
      content: texts.permanentlyDeleteConfirm,
      okText: texts.deleteButton,
      cancelText: texts.cancelButton,
      danger: true,
    });
    if (!confirmed) return;

    try {
      await apiPermanentlyDeleteNote(accessToken, selectedNoteId);
      rememberPermanentlyDeletedNoteId(selectedNoteId);

      setNotes((prev) =>
        prev.filter((note) => String(note.id) !== String(selectedNoteId))
      );
      if (setTrashNotes) {
        setTrashNotes((prev) =>
          prev.filter((note) => String(note.id) !== String(selectedNoteId))
        );
      }

      setSelectedNoteId((prevSelectedId) =>
        String(prevSelectedId) === String(selectedNoteId) ? null : prevSelectedId
      );

      message.success(texts.permanentlyDeleteSuccess);
    } catch (err) {
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      message.error(texts.permanentlyDeleteFailed);
    }
  }, [
    accessToken,
    handleUnauthorized,
    selectedNote,
    selectedNoteId,
    setNotes,
    setSelectedNoteId,
    texts.permanentlyDeleteConfirm,
    texts.permanentlyDelete,
    texts.permanentlyDeleteFailed,
    texts.permanentlyDeleteSuccess,
    texts.deleteButton,
    texts.cancelButton,
  ]);

  const handleEditTagsSelected = useCallback(() => {
    if (!selectedNote) return;
    if (selectedNote.readOnly === true) return;
    const tagIdMap = new Map(tags.map((tag) => [String(tag.id), tag.id]));
    const normalizedDraft = [
      ...new Set(
        (selectedNote.tagIds || [])
          .map((id) => tagIdMap.get(String(id)))
          .filter((id) => id !== undefined)
      ),
    ];
    setSelectedTagIdsDraft(normalizedDraft);
    setEditTagsModalVisible(true);
  }, [selectedNote, setEditTagsModalVisible, setSelectedTagIdsDraft, tags]);

  const handleSelectedTagIdsDraftChange = useCallback(
    (nextTagIds) => {
      const validIds = new Set(tags.map((tag) => tag.id));
      const sanitized = [...new Set((nextTagIds || []).filter((id) => validIds.has(id)))];
      setSelectedTagIdsDraft(sanitized);
    },
    [setSelectedTagIdsDraft, tags]
  );

  const closeEditTagsModal = useCallback(() => {
    setEditTagsModalVisible(false);
    setSelectedTagIdsDraft([]);
  }, [setEditTagsModalVisible, setSelectedTagIdsDraft]);

  const handleEditTagsSubmit = useCallback(() => {
    if (!selectedNote) return;

    const previousTagIds = selectedNote.tagIds || [];
    const validIds = new Set(tags.map((tag) => tag.id));
    const nextTagIds = [...new Set((selectedTagIdsDraft || []).filter((id) => validIds.has(id)))];
    const previousTagIdKeys = new Set(previousTagIds.map((id) => String(id)));
    const nextTagIdKeys = new Set(nextTagIds.map((id) => String(id)));

    const previousTags = selectedNote.tags;
    const previousTagsUpper = selectedNote.Tags;

    updateSelectedNote({ tagIds: nextTagIds, tags: undefined, Tags: undefined });
    setEditTagsModalVisible(false);
    setSelectedTagIdsDraft([]);

    if (!accessToken || !selectedNote.id) return;

    const addedIds = nextTagIds.filter((id) => !previousTagIdKeys.has(String(id)));
    const removedIds = previousTagIds.filter((id) => !nextTagIdKeys.has(String(id)));

    const getErrorMessage = (err) =>
      err?.response?.data?.message ??
      err?.response?.data?.Message ??
      err?.response?.data?.title ??
      err?.response?.data?.Title ??
      (typeof err?.response?.data === "string" ? err.response.data : null);

    const revertTagIds = () => updateSelectedNote({ tagIds: previousTagIds, tags: previousTags, Tags: previousTagsUpper });

    addedIds.forEach((tagId) => {
      apiAddTagToNote(accessToken, selectedNote.id, tagId).catch((err) => {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        if (err.response?.status === 403) {
          revertTagIds();
          message.error(getErrorMessage(err) || texts.tagAddFailed);
          return;
        }
        message.error(getErrorMessage(err) || texts.tagAddFailed);
      });
    });

    removedIds.forEach((tagId) => {
      apiRemoveTagFromNote(accessToken, selectedNote.id, tagId).catch((err) => {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        if (err.response?.status === 403) {
          revertTagIds();
          message.error(getErrorMessage(err) || texts.tagRemoveFailed);
          return;
        }
        message.error(getErrorMessage(err) || texts.tagRemoveFailed);
      });
    });
  }, [
    accessToken,
    handleUnauthorized,
    selectedNote,
    selectedTagIdsDraft,
    setEditTagsModalVisible,
    setSelectedTagIdsDraft,
    tags,
    texts.tagAddFailed,
    texts.tagRemoveFailed,
    updateSelectedNote,
  ]);

  const moveSelectedNoteToFolder = useCallback(
    async (folderId) => {
      if (!selectedNote || !accessToken) return;
      if (selectedNote.readOnly === true) return;

      const folder = findFolderById(folders, folderId);
      if (!folder) return;

      const targetFolderId = normalizeId(folder.id);
      if (!targetFolderId) return;
      const previousFolderIds = getNoteFolderIds(selectedNote);
      const previousFolderId = selectedNote.folderId ?? previousFolderIds[0] ?? null;
      const previousFolderPath = selectedNote.folderPath ?? "";
      const removableFolderIds = previousFolderIds.filter((id) => id !== targetFolderId);
      const latestSelected =
        notesRef.current.find((note) => String(note.id) === String(selectedNote.id)) ??
        selectedNote;

      const nextPayload = {
        ...buildNotePayload(latestSelected),
        folderId: targetFolderId,
        folderPath: folder.title ?? targetFolderId,
        folderIds: [targetFolderId],
      };

      setNotes((prev) =>
        prev.map((note) =>
          String(note.id) === String(selectedNote.id)
            ? {
              ...note,
              folderId: targetFolderId,
              folderPath: folder.title ?? targetFolderId,
              folderIds: [targetFolderId],
              updatedAt: formatNoteDate(new Date(), locale),
            }
            : note
        )
      );

      setActiveFolderId(targetFolderId);
      setOpenedFolders((prev) => ({ ...prev, [targetFolderId]: true }));

      const revertFolderState = () => {
        updateSelectedNote({
          folderId: previousFolderId,
          folderPath: previousFolderPath,
          folderIds: previousFolderIds,
        });
        setActiveFolderId(previousFolderId || "all");
      };

      try {
        await apiAddFolderToNote(accessToken, selectedNote.id, targetFolderId).catch((err) => {
          const status = err?.response?.status;
          if (status && [404, 405, 409].includes(status)) return;
          throw err;
        });

        await Promise.all(
          removableFolderIds.map((id) =>
            apiRemoveFolderFromNote(accessToken, selectedNote.id, id).catch((err) => {
              const status = err?.response?.status;
              if (status && [404, 405].includes(status)) return;
              throw err;
            })
          )
        );

        await apiUpdateNote(accessToken, selectedNote.id, nextPayload);
        const refreshed =
          typeof refreshAllNotes === "function"
            ? await refreshAllNotes().catch(() => null)
            : null;

        if (Array.isArray(refreshed)) {
          const refreshedNote = refreshed.find(
            (note) => String(note.id) === String(selectedNote.id)
          );
          if (refreshedNote) {
            const refreshedFolderIds = getNoteFolderIds(refreshedNote);

            if (!refreshedFolderIds.includes(targetFolderId)) {
              message.warning(texts.folderNotPersisted);
              return;
            }
          }
        }

        message.success(texts.noteMovedSuccess);
      } catch (err) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        if (err.response?.status === 403) {
          revertFolderState();
          const msg =
            err.response?.data?.message ??
            err.response?.data?.Message ??
            err.response?.data?.title ??
            err.response?.data?.Title;
          message.error(msg || texts.noteMoveFailed);
          return;
        }
        revertFolderState();
        message.error(texts.noteMoveFailed);
      }
    },
    [
      accessToken,
      folders,
      handleUnauthorized,
      locale,
      notesRef,
      refreshAllNotes,
      selectedNote,
      setActiveFolderId,
      setNotes,
      setOpenedFolders,
      texts.folderNotPersisted,
      texts.noteMoveFailed,
      texts.noteMovedSuccess,
      updateSelectedNote,
    ]
  );

  const removeTagEverywhere = useCallback(
    (tagId) => {
      if (!accessToken) return;

      Modal.confirm({
        title: texts.deleteTagConfirm,
        okText: texts.deleteTagConfirmOk,
        cancelText: texts.deleteTagConfirmCancel,
        onOk: () => {
          apiDeleteTag(accessToken, tagId)
            .then((res) => {
              const status = res?.status;
              if (status === 200 || status === 204) {
                setActiveTagIds((prev) => prev.filter((id) => String(id) !== String(tagId)));

                const filterTag = (note) => ({
                  ...note,
                  tagIds: (note.tagIds || []).filter((id) => String(id) !== String(tagId)),
                  TagIds: note.TagIds ? note.TagIds.filter((id) => String(id) !== String(tagId)) : undefined,
                  tags: note.tags ? note.tags.filter((t) => String(t?.id ?? t?.Id) !== String(tagId)) : undefined,
                  Tags: note.Tags ? note.Tags.filter((t) => String(t?.id ?? t?.Id) !== String(tagId)) : undefined,
                });

                setNotes((prev) => prev.map(filterTag));

                if (setSharedNotes) {
                  setSharedNotes((prev) => prev.map(filterTag));
                }
                if (setTrashNotes) {
                  setTrashNotes((prev) => prev.map(filterTag));
                }
                if (setSelectedNoteDetail) {
                  setSelectedNoteDetail((prev) => (prev ? filterTag(prev) : prev));
                }

                return apiGetTags(accessToken);
              }
            })
            .then((tagsData) => {
              if (tagsData != null) {
                setTags(mergeTagsFromApi(tagsData, notesRef.current || []));
              }
              message.success(texts.tagDeleteSuccess);
            })
            .catch((err) => {
              if (err?.response?.status === 401) {
                handleUnauthorized();
                return;
              }
              message.error(texts.tagDeleteFailed);
            });
        },
      });
    },
    [
      accessToken,
      handleUnauthorized,
      notesRef,
      setActiveTagIds,
      setNotes,
      setTags,
      texts.deleteTagConfirm,
      texts.deleteTagConfirmOk,
      texts.deleteTagConfirmCancel,
      texts.tagDeleteSuccess,
      texts.tagDeleteFailed,
    ]
  );

  const removeSelectedNoteFromFolder = useCallback(
    async () => {
      if (!selectedNote || !selectedNoteId || !accessToken) return;
      if (selectedNote.readOnly === true) return;

      try {
        const data = await apiRemoveNoteFromFolder(accessToken, selectedNote.id);
        const list = normalizeNotesList(Array.isArray(data) ? data : [data], locale);
        const updated = list[0] ?? {
          ...selectedNote,
          folderIds: [],
          folderId: null,
          folderPath: "",
        };

        setNotes((prev) =>
          prev.map((note) =>
            String(note.id) === String(selectedNoteId)
              ? { ...note, ...updated, id: note.id }
              : note
          )
        );
        setActiveFolderId("all");
        message.success(texts.noteRemovedFromFolderSuccess);
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
        message.error(msg || texts.noteRemovedFromFolderFailed);
      }
    },
    [
      accessToken,
      handleUnauthorized,
      locale,
      selectedNote,
      selectedNoteId,
      setActiveFolderId,
      setNotes,
      texts.noteRemovedFromFolderSuccess,
      texts.noteRemovedFromFolderFailed,
    ]
  );


  return {
    updateSelectedNote,
    setReminderForSelected,
    deleteReminderForSelected,
    handleNewNote,
    toggleFavorite,
    softDeleteSelected,
    restoreFromTrash,
    permanentlyDeleteSelected,
    handleEditTagsSelected,
    handleSelectedTagIdsDraftChange,
    closeEditTagsModal,
    handleEditTagsSubmit,
    moveSelectedNoteToFolder,
    removeSelectedNoteFromFolder,
    removeTagEverywhere,
  };
}
