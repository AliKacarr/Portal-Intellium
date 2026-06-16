import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { message } from "antd";
import { resolveNotesLocale, toEditorHtml, toPlainText } from "../notesUtils";
import notesMessageIds from "../../../config/translation/locales/tr/notes.json";
import {
  buildErrorHint,
  extractList,
  getNoteFolderIds,
  mergeFoldersFromNotes,
  mergeTagsFromApi,
  normalizeId,
  normalizeNotesList,
} from "../notesHelpers";
import {
  createInitialNotesFolderState,
  filterOutPermanentlyDeletedNotes,
  writeStoredFolders,
} from "../notesStorage";
import {
  getNote as apiGetNote,
  getNotes as apiGetNotes,
  getDeletedNotes as apiGetDeletedNotes,
  getSharedNotes as apiGetSharedNotes,
  getSharedNotesByMe as apiGetSharedNotesByMe,
  getSystemUsers as apiGetSystemUsers,
  pinNote as apiPinNote,
  getFolders as apiGetFolders,
} from "../../../Api/NotesApi";
import { getTags as apiGetTags } from "../../../Api/TagsApi";

const SEARCH_DEBOUNCE_MS = 400;
const INITIAL_LOAD_TIMEOUT_MS = 12000;

export default function useNotesData() {
  const intl = useIntl();
  const history = useHistory();
  const accessToken = useSelector((state) => state.Auth?.accessToken);
  const currentUserId = useSelector((state) => state.Auth?.id);
  const appLocale = useSelector((state) => state.LanguageSwitcher?.language?.locale);
  const notesLocale = resolveNotesLocale(appLocale);
  const texts = useMemo(() => {
    const prefix = "notes.";
    const out = {};
    for (const messageId of Object.keys(notesMessageIds)) {
      const suffix = messageId.startsWith(prefix)
        ? messageId.slice(prefix.length)
        : messageId;
      out[suffix] = intl.formatMessage({ id: messageId });
    }
    return out;
  }, [intl]);
  const initialFolderStateRef = useRef(null);
  if (initialFolderStateRef.current == null) {
    initialFolderStateRef.current = createInitialNotesFolderState();
  }

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [folders, setFolders] = useState(initialFolderStateRef.current.folders);
  const [tags, setTags] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [order, setOrder] = useState("desc");
  const [libraryFilter, setLibraryFilter] = useState("all");
  const [activeFolderId, setActiveFolderId] = useState("all");
  const [activeTagIds, setActiveTagIds] = useState([]);
  const [openedFolders, setOpenedFolders] = useState(
    initialFolderStateRef.current.openedFolders
  );

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareUserId, setShareUserId] = useState("");
  const [shareReadOnly, setShareReadOnly] = useState(false);
  const [sharedUsersList, setSharedUsersList] = useState([]);
  const [sharedUsersLoading, setSharedUsersLoading] = useState(false);
  const [sharedNotes, setSharedNotes] = useState([]);
  const [sharedNotesLoading, setSharedNotesLoading] = useState(false);
  const [sharedSubFilter, setSharedSubFilter] = useState("all"); // "all" | "received" | "sent"
  const [trashNotes, setTrashNotes] = useState([]);
  const [trashNotesLoading, setTrashNotesLoading] = useState(false);
  const [editTagsModalVisible, setEditTagsModalVisible] = useState(false);
  const [selectedTagIdsDraft, setSelectedTagIdsDraft] = useState([]);
  /** Paylaşılan not seçildiğinde GET /api/notes/{id} sonucu; detay içerik buradan gelir. */
  const [selectedNoteDetail, setSelectedNoteDetail] = useState(null);

  const editorRef = useRef(null);
  const imageInputRef = useRef(null);
  const previousSelectedNoteIdRef = useRef(selectedNoteId);
  const notesRef = useRef(notes);
  const searchDebounceRef = useRef(null);
  const lastSearchTermRef = useRef("");
  const authRedirectedRef = useRef(false);
  const mountedRef = useRef(true);
  const sortInitializedRef = useRef(false);

  notesRef.current = notes;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleUnauthorized = useCallback(() => {
    history.push("/signin");
  }, [history]);

  const selectedNote = useMemo(() => {
    if (libraryFilter === "shared") {
      if (
        selectedNoteDetail &&
        String(selectedNoteDetail.id) === String(selectedNoteId)
      ) {
        return selectedNoteDetail;
      }
      const fromShared = sharedNotes.find(
        (n) => String(n.id) === String(selectedNoteId)
      );
      if (fromShared) return fromShared;
    }
    if (libraryFilter === "trash") {
      const fromTrash = trashNotes.find(
        (n) => String(n.id) === String(selectedNoteId)
      );
      if (fromTrash) return fromTrash;
    }
    return notes.find((note) => note.id === selectedNoteId) || null;
  }, [notes, sharedNotes, trashNotes, libraryFilter, selectedNoteId, selectedNoteDetail]);

  const selectedNoteRef = useRef(null);
  selectedNoteRef.current = selectedNote;

  const getTagById = useCallback(
    (tagId) => tags.find((tag) => tag.id === tagId),
    [tags]
  );

  /** Tüm Notlar = GET /api/notes?sortBy=&order= (paylaşılan notlar burada gelmez). */
  const refreshAllNotes = useCallback(
    async (options = {}) => {
      if (!accessToken) return [];
      const s = options.sortBy ?? sortBy;
      const o = options.order ?? order;
      const data = await apiGetNotes(accessToken, { ...options, sortBy: s, order: o });
      if (!mountedRef.current) return [];
      const list = filterOutPermanentlyDeletedNotes(
        normalizeNotesList(extractList(data), notesLocale)
      );
      if (!mountedRef.current) return list;
      setNotes(list);
      setFolders((prev) => mergeFoldersFromNotes(prev, list));
      return list;
    },
    [accessToken, notesLocale, sortBy, order]
  );

  useEffect(() => {
    writeStoredFolders(folders);
  }, [folders]);

  const mergeSharedLists = useCallback(
    (withMeRaw, byMeRaw) => {
      const withMe = normalizeNotesList(extractList(withMeRaw || []), notesLocale);
      const byMe = normalizeNotesList(extractList(byMeRaw || []), notesLocale);
      const byId = new Map();
      [...withMe, ...byMe].forEach((note) => {
        const id = note.id != null ? String(note.id) : null;
        if (id && !byId.has(id)) byId.set(id, note);
      });
      return filterOutPermanentlyDeletedNotes(Array.from(byId.values()));
    },
    [notesLocale]
  );

  /** Paylaşılan notlar = GET /api/notes/shared + (isteğe bağlı) GET /api/notes/shared-by-me birleşimi. */
  const refreshSharedNotes = useCallback(async () => {
    if (!accessToken) return;
    setSharedNotesLoading(true);
    try {
      const [withMeData, byMeData] = await Promise.all([
        apiGetSharedNotes(accessToken),
        apiGetSharedNotesByMe(accessToken).catch(() => []),
      ]);
      if (!mountedRef.current) return;
      const list = mergeSharedLists(withMeData, byMeData);
      if (!mountedRef.current) return;
      setSharedNotes(list);
    } catch (err) {
      if (!mountedRef.current) return;
      if (err.response?.status === 401) {
        handleUnauthorized();
        return;
      }
      message.error(texts.sharedNotesLoadFailed);
    } finally {
      if (mountedRef.current) setSharedNotesLoading(false);
    }
  }, [
    accessToken,
    handleUnauthorized,
    mergeSharedLists,
    notesLocale,
    texts.sharedNotesLoadFailed,
  ]);

  /** Çöp kutusu: GET /api/notes/deleted?sortBy=&order= */
  const refreshTrashNotes = useCallback(
    async (options = {}) => {
      if (!accessToken) return;
      setTrashNotesLoading(true);
      const s = options.sortBy ?? sortBy;
      const o = options.order ?? order;
      try {
        const data = await apiGetDeletedNotes(accessToken, { sortBy: s, order: o });
        if (!mountedRef.current) return;
        const list = filterOutPermanentlyDeletedNotes(
          normalizeNotesList(extractList(data), notesLocale)
        );
        if (!mountedRef.current) return;
        setTrashNotes(list);
      } catch (err) {
        if (!mountedRef.current) return;
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        message.error(texts.notesLoadFailedPrefix + " " + (err.response?.data?.message || ""));
      } finally {
        if (mountedRef.current) setTrashNotesLoading(false);
      }
    },
    [accessToken, handleUnauthorized, notesLocale, sortBy, order, texts.notesLoadFailedPrefix]
  );

  useEffect(() => {
    if (!accessToken || libraryFilter !== "trash") return;
    refreshTrashNotes();
  }, [accessToken, libraryFilter, refreshTrashNotes]);

  const pinnedCount = useMemo(
    () => notes.filter((n) => n.isPinned).length,
    [notes]
  );

  /** Dropdown value "sortBy|order" ile tek seferde güncelle (örn. "title|asc"). */
  const setSortByOrder = useCallback((value) => {
    if (typeof value !== "string" || !value.includes("|")) return;
    const [s, o] = value.split("|");
    if (["updatedAt", "createdAt", "title", "contentLength"].includes(s)) setSortBy(s);
    if (o === "asc" || o === "desc") setOrder(o);
  }, []);

  const handlePinNote = useCallback(
    async (noteId, isPinned) => {
      if (!accessToken) return;
      if (isPinned && pinnedCount >= 2) {
        message.warning(texts.maxPinReached);
        return;
      }
      try {
        await apiPinNote(accessToken, noteId, isPinned);
        if (!mountedRef.current) return;
        setNotes((prev) =>
          prev.map((n) => (String(n.id) === String(noteId) ? { ...n, isPinned } : n))
        );
      } catch (err) {
        if (!mountedRef.current) return;
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        const msg =
          err.response?.status === 400
            ? err.response?.data?.message ?? err.response?.data?.Message ?? texts.maxPinReached
            : texts.noteUpdateFailed;
        message.error(msg || texts.maxPinReached);
      }
    },
    [accessToken, handleUnauthorized, pinnedCount, texts.maxPinReached, texts.noteUpdateFailed]
  );

  useEffect(() => {
    if (!accessToken) {
      setNotes([]);
      setTags([]);
      setSelectedNoteId(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    const forceStopLoadingTimer = setTimeout(() => {
      if (!mounted) return;
      setLoading(false);
      message.error(texts.backendConnectionCheck);
    }, INITIAL_LOAD_TIMEOUT_MS);

    Promise.all([
      refreshAllNotes(),
      apiGetTags(accessToken).catch(() => null),
      apiGetSystemUsers(accessToken).catch(() => null),
      apiGetFolders(accessToken).catch(() => [])
    ])
      .then(([notesList, tagsData, usersRes, foldersData]) => {
        if (!mounted) return;
        setTags(mergeTagsFromApi(tagsData, notesList));
        if (usersRes && usersRes.data) {
          setAllUsers(usersRes.data);
        } else if (Array.isArray(usersRes)) {
          setAllUsers(usersRes);
        } else {
          setAllUsers([]);
        }

        const backendFolders = extractList(foldersData).map(f => ({
           id: String(f.id ?? f.Id),
           title: f.title ?? f.Title ?? f.name ?? f.Name ?? String(f.id ?? f.Id)
        }));
        setFolders(prev => {
            const merged = [...prev];
            backendFolders.forEach(bf => {
                if (!merged.some(m => String(m.id) === String(bf.id))) {
                    merged.push(bf);
                }
            });
            return merged;
        });

        if (notesList.length > 0) {
          setSelectedNoteId((prev) => prev || notesList[0].id);
        }
        refreshSharedNotes();
        refreshTrashNotes();
      })
      .catch((err) => {
        if (!mounted) return;
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        setNotes([]);
        setTags([]);
        setSelectedNoteId(null);
        message.error(`${texts.notesLoadFailedPrefix} ${buildErrorHint(err, notesLocale)}`);
      })
      .finally(() => {
        clearTimeout(forceStopLoadingTimer);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      clearTimeout(forceStopLoadingTimer);
    };
  }, [
    accessToken,
    handleUnauthorized,
    notesLocale,
    refreshAllNotes,
    refreshSharedNotes,
    refreshTrashNotes,
    texts.backendConnectionCheck,
    texts.notesLoadFailedPrefix,
  ]);

  useEffect(() => {
    if (!accessToken) return;
    if (libraryFilter === "shared") return;

    const term = searchText.trim();
    if (term === "" && lastSearchTermRef.current === "") return;

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(() => {
      lastSearchTermRef.current = term;
      refreshAllNotes(term ? { search: term } : {})
        .then(() => {
          lastSearchTermRef.current = term;
        })
        .catch((err) => {
          if (err.response?.status === 401) handleUnauthorized();
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchText, accessToken, libraryFilter, refreshAllNotes, handleUnauthorized]);

  /** Sıralama değişince listeyi yeniden çek (ilk mount'ta çift istek olmasın diye ilk çalışmayı atla). */
  useEffect(() => {
    if (!accessToken || libraryFilter === "shared") return;
    if (!sortInitializedRef.current) {
      sortInitializedRef.current = true;
      return;
    }
    if (libraryFilter === "trash") {
      refreshTrashNotes({ sortBy, order }).catch((err) => {
        if (err.response?.status === 401) handleUnauthorized();
      });
    } else {
      refreshAllNotes({ sortBy, order }).catch((err) => {
        if (err.response?.status === 401) handleUnauthorized();
      });
    }
  }, [sortBy, order, accessToken, libraryFilter, refreshAllNotes, refreshTrashNotes, handleUnauthorized]);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (!loading && !accessToken && !authRedirectedRef.current) {
      authRedirectedRef.current = true;
      message.warning(texts.notesNeedLogin);
      history.push("/signin");
    }
  }, [accessToken, loading, history, texts.notesNeedLogin]);

  const folderFilterIdSet = useMemo(() => {
    const normalizedFolderId = normalizeId(activeFolderId);
    if (!normalizedFolderId || normalizedFolderId === "all") return null;
    return new Set([normalizedFolderId]);
  }, [activeFolderId]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (libraryFilter === "favorites" && (!note.isFavorite || note.isDeleted)) {
        return false;
      }
      if (libraryFilter === "trash" && !note.isDeleted) return false;
      if (libraryFilter === "all" && note.isDeleted) return false;

      if (folderFilterIdSet && folderFilterIdSet.size > 0) {
        const inFolder = getNoteFolderIds(note).some((folderId) =>
          folderFilterIdSet.has(folderId)
        );

        if (!inFolder) return false;
      }

      if (
        activeTagIds.length > 0 &&
        !activeTagIds.some((tagId) => note.tagIds?.includes(tagId))
      ) {
        return false;
      }

      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const noteBody = toPlainText(note.content).toLowerCase();
        if (
          !String(note.title || "").toLowerCase().includes(query) &&
          !noteBody.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [notes, libraryFilter, folderFilterIdSet, activeTagIds, searchText]);

  const sortNotesLocal = useCallback(
    (list) => {
      const dir = order === "asc" ? 1 : -1;
      const safeStr = (v) => String(v ?? "").toLowerCase();
      const safeTime = (v) => {
        if (!v) return 0;
        const t = new Date(v).getTime();
        return Number.isFinite(t) ? t : 0;
      };
      const contentLen = (note) => toPlainText(note?.content).length;

      const next = [...(list || [])];
      next.sort((a, b) => {
        if (sortBy === "updatedAt") {
          return (safeTime(a.updatedAtRaw || a.updatedAt) - safeTime(b.updatedAtRaw || b.updatedAt)) * dir;
        }
        if (sortBy === "createdAt") {
          return (safeTime(a.createdAtRaw || a.createdAt) - safeTime(b.createdAtRaw || b.createdAt)) * dir;
        }
        if (sortBy === "title") {
          const cmp = safeStr(a.title).localeCompare(safeStr(b.title), "tr");
          return cmp * dir;
        }
        if (sortBy === "contentLength") {
          return (contentLen(a) - contentLen(b)) * dir;
        }
        return 0;
      });
      return next;
    },
    [sortBy, order]
  );

  const sharedFilteredNotes = useMemo(() => {
    if (libraryFilter !== "shared") return [];
    let base = sharedNotes;
    if (sharedSubFilter === "received") {
      base = sharedNotes.filter((n) => n.sharedBy != null || n.SharedBy != null);
    } else if (sharedSubFilter === "sent") {
      base = sharedNotes.filter((n) => n.sharedBy == null && n.SharedBy == null);
    }

    return base.filter((note) => {
      if (activeTagIds.length > 0 && !activeTagIds.some((tagId) => note.tagIds?.includes(tagId))) {
        return false;
      }
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const noteBody = toPlainText(note.content).toLowerCase();
        if (!String(note.title || "").toLowerCase().includes(query) && !noteBody.includes(query)) {
          return false;
        }
      }
      return true;
    });
  }, [libraryFilter, sharedNotes, sharedSubFilter, activeTagIds, searchText]);

  const listNotes = useMemo(() => {
    if (libraryFilter === "shared") {
      return sortNotesLocal(sharedFilteredNotes);
    }
    if (libraryFilter === "trash") return trashNotes;
    return filteredNotes;
  }, [libraryFilter, sharedFilteredNotes, sortNotesLocal, trashNotes, filteredNotes]);

  useEffect(() => {
    if (listNotes.length === 0) {
      if (selectedNoteId !== null) setSelectedNoteId(null);
      return;
    }

    const selectedVisible = listNotes.some(
      (note) => String(note.id) === String(selectedNoteId)
    );
    if (!selectedVisible) {
      setSelectedNoteId(listNotes[0].id);
    }
  }, [listNotes, selectedNoteId, setSelectedNoteId]);

  /** Paylaşılan notlar listesinden not seçilince detayı GET /api/notes/{id} ile çek; selectedNote içeriği buna göre dolar. */
  useEffect(() => {
    if (libraryFilter !== "shared" || !selectedNoteId || !accessToken) {
      setSelectedNoteDetail(null);
      return;
    }
    let cancelled = false;
    const raw = apiGetNote(accessToken, selectedNoteId);
    Promise.resolve(raw)
      .then((data) => {
        if (cancelled || !mountedRef.current) return;
        const list = normalizeNotesList(
          Array.isArray(data) ? data : [data],
          notesLocale
        );
        const note = list[0] ?? null;
        setSelectedNoteDetail(note);
      })
      .catch(() => {
        if (!cancelled && mountedRef.current) setSelectedNoteDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, libraryFilter, notesLocale, selectedNoteId]);

  useEffect(() => {
    if (loading) return;

    const editor = editorRef.current;
    if (!editor) return;

    const selectedChanged = previousSelectedNoteIdRef.current !== selectedNoteId;
    previousSelectedNoteIdRef.current = selectedNoteId;

    if (!selectedChanged && document.activeElement === editor) return;

    const currentNote = selectedNote;
    if (!currentNote) {
      editor.innerHTML = "";
      return;
    }
    const nextHtml = toEditorHtml(currentNote.content || "");
    if (editor.innerHTML !== nextHtml) {
      editor.innerHTML = nextHtml;
    }
  }, [loading, selectedNoteId, selectedNote]);

  const libraryCounts = useMemo(() => {
    const all = notes.filter((note) => !note.isDeleted).length;
    const favorites = notes.filter((note) => note.isFavorite && !note.isDeleted).length;
    const trash = trashNotes.length;
    const shared = sharedNotes.length;
    return { all, favorites, trash, shared };
  }, [notes, sharedNotes, trashNotes]);

  const tagUsageCounts = useMemo(() => {
    const counts = {};
    notes
      .filter((note) => !note.isDeleted)
      .forEach((note) => {
        (note.tagIds || []).forEach((tagId) => {
          counts[tagId] = (counts[tagId] || 0) + 1;
        });
      });
    return counts;
  }, [notes]);

  const folderCounts = useMemo(() => {
    const counts = {};
    const visibleNotes = notes.filter((note) => !note.isDeleted);

    visibleNotes.forEach((note) => {
      getNoteFolderIds(note).forEach((folderId) => {
        counts[folderId] = (counts[folderId] || 0) + 1;
      });
    });

    return counts;
  }, [notes]);

  const notesByFolderId = useMemo(() => {
    const map = {};

    notes
      .filter((note) => !note.isDeleted)
      .forEach((note) => {
        getNoteFolderIds(note).forEach((folderId) => {
          if (!map[folderId]) map[folderId] = [];
          if (!map[folderId].some((n) => n.id === note.id)) {
            map[folderId].push(note);
          }
        });
      });

    return map;
  }, [notes]);

  return {
    accessToken,
    currentUserId,
    loading,
    notes,
    setNotes,
    folders,
    setFolders,
    tags,
    setTags,
    allUsers,
    selectedNoteId,
    setSelectedNoteId,
    searchText,
    setSearchText,
    sortBy,
    setSortBy,
    order,
    setOrder,
    libraryFilter,
    setLibraryFilter,
    activeFolderId,
    setActiveFolderId,
    activeTagIds,
    setActiveTagIds,
    openedFolders,
    setOpenedFolders,
    shareModalVisible,
    setShareModalVisible,
    shareUserId,
    setShareUserId,
    shareReadOnly,
    setShareReadOnly,
    sharedUsersList,
    setSharedUsersList,
    sharedUsersLoading,
    setSharedUsersLoading,
    editTagsModalVisible,
    setEditTagsModalVisible,
    selectedTagIdsDraft,
    setSelectedTagIdsDraft,
    editorRef,
    imageInputRef,
    notesRef,
    notesLocale,
    texts,
    handleUnauthorized,
    selectedNote,
    getTagById,
    refreshAllNotes,
    refreshSharedNotes,
    filteredNotes,
    listNotes,
    sharedNotes,
    setSharedNotes,
    setSelectedNoteDetail,
    sharedNotesLoading,
    sharedSubFilter,
    setSharedSubFilter,
    trashNotesLoading,
    setTrashNotes,
    refreshTrashNotes,
    selectedNoteRef,
    libraryCounts,
    pinnedCount,
    handlePinNote,
    setSortByOrder,
    tagUsageCounts,
    folderCounts,
    notesByFolderId,
    selectedNoteDeleted: !!selectedNote?.isDeleted,
  };
}
