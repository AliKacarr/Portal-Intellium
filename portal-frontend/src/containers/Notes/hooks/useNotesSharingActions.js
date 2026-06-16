import { useCallback } from "react";
import { message } from "antd";
import {
  exportNote as apiExportNote,
  shareNote as apiShareNote,
  getNoteShares,
  patchNoteShare,
  unshareNote,
} from "../../../Api/NotesApi";
import { toPlainText } from "../notesUtils";

export default function useNotesSharingActions({
  accessToken,
  handleUnauthorized,
  selectedNote,
  selectedNoteId,
  setShareModalVisible,
  setShareReadOnly,
  setShareUserId,
  setSharedUsersList,
  setSharedUsersLoading,
  shareReadOnly,
  shareUserId,
  texts,
}) {
  const handleShareSelected = useCallback(async () => {
    if (!selectedNote) return;

    const text = `${selectedNote.title}\n\n${toPlainText(selectedNote.content)}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: selectedNote.title, text });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        message.success(texts.copyToClipboardSuccess);
        return;
      }

      window.prompt(texts.copyPrompt, text);
    } catch (error) {
      if (error?.name !== "AbortError") {
        message.error(texts.shareError);
      }
    }
  }, [selectedNote, texts.copyPrompt, texts.copyToClipboardSuccess, texts.shareError]);

  const handleExport = useCallback(
    async (format) => {
      if (!selectedNote || !accessToken) return;

      try {
        const safeTitle = (selectedNote.title || texts.defaultNoteFileName).replace(
          /[^a-zA-Z0-9-_ğüşıöçĞÜŞİÖÇ\s]/gi,
          ""
        );
        const filename = `${safeTitle || texts.defaultNoteFileName}.${format}`;

        if (format === "pdf") {
          let html2pdf;
          try {
            html2pdf = (await import("html2pdf.js")).default || await import("html2pdf.js");
          } catch (e) {
            console.error("html2pdf failed to load", e);
            message.error(texts.pdfLoaderFailed);
            return;
          }

          const container = document.createElement("div");
          container.style.padding = "40px";
          container.style.fontFamily =
            "'Inter', 'Roboto', 'Segoe UI', Tahoma, sans-serif";
          container.style.color = "#333";
          container.style.backgroundColor = "#fff";

          const titleEl = document.createElement("h1");
          titleEl.innerText = selectedNote.title || texts.defaultNoteFileName;
          titleEl.style.fontSize = "24px";
          titleEl.style.marginBottom = "20px";
          titleEl.style.borderBottom = "1px solid #eaeaea";
          titleEl.style.paddingBottom = "10px";
          container.appendChild(titleEl);

          const contentEl = document.createElement("div");
          contentEl.innerHTML = selectedNote.content || "";
          contentEl.style.fontSize = "14px";
          contentEl.style.lineHeight = "1.6";
          // Fix for potential bullet point styling issues in rendering
          contentEl.querySelectorAll("ul").forEach((ul) => {
            ul.style.listStyleType = "disc";
            ul.style.paddingLeft = "20px";
            ul.style.marginBottom = "10px";
          });
          contentEl.querySelectorAll("ol").forEach((ol) => {
            ol.style.listStyleType = "decimal";
            ol.style.paddingLeft = "20px";
            ol.style.marginBottom = "10px";
          });

          // PDF'deki resimlerin sayfaya sığması için ölçeklendirme
          contentEl.querySelectorAll("img").forEach((img) => {
            img.style.maxWidth = "100%";
            img.style.height = "auto";
            img.style.display = "block";
            img.style.margin = "10px 0";
          });

          container.appendChild(contentEl);

          const options = {
            margin: [0.5, 0.5],
            filename: filename,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
          };

          await html2pdf().set(options).from(container).save();
        } else {
          await apiExportNote(accessToken, selectedNote.id, format, filename);
        }

        message.success(texts.exportSuccess);
      } catch (err) {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        message.error(texts.exportFailed);
      }
    },
    [
      accessToken,
      handleUnauthorized,
      selectedNote,
      texts.defaultNoteFileName,
      texts.exportFailed,
      texts.exportSuccess,
    ]
  );

  const handleShareNoteSubmit = useCallback(() => {
    const userId = Number(shareUserId);
    if (!selectedNoteId || !accessToken || !Number.isFinite(userId) || userId <= 0) {
      message.warning(texts.invalidShareUserId);
      return;
    }

    apiShareNote(accessToken, selectedNoteId, {
      userId,
      readOnly: !!shareReadOnly,
    })
      .then(() => {
        message.success(texts.shareSuccess);
        setShareUserId("");
        setShareReadOnly(false);
        if (setSharedUsersLoading) setSharedUsersLoading(true);
        getNoteShares(accessToken, selectedNoteId)
          .then((data) => {
            const rows = Array.isArray(data) ? data : [];
            if (setSharedUsersList) {
              setSharedUsersList(rows.map((row) => ({
                ...row,
                userId: row.userId ?? row.UserId ?? row.id,
                userName: row.userName ?? row.UserName ?? row.name ?? row.Name ?? texts.userUnknown,
                userEmail: row.userEmail ?? row.UserEmail ?? row.email ?? row.Email ?? "",
                readOnly: row.readOnly ?? row.ReadOnly ?? false,
              })));
            }
          })
          .catch(() => { })
          .finally(() => {
            if (setSharedUsersLoading) setSharedUsersLoading(false);
          });
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          handleUnauthorized();
          return;
        }
        const data = err.response?.data;
        const msg =
          (typeof data === "string" ? data : null) ||
          data?.message ||
          data?.title ||
          data?.Message ||
          data?.Title;
        message.error(msg || texts.shareFailed);
      });
  }, [
    accessToken,
    handleUnauthorized,
    selectedNoteId,
    setShareReadOnly,
    setShareUserId,
    setSharedUsersLoading,
    setSharedUsersList,
    shareReadOnly,
    shareUserId,
    texts.invalidShareUserId,
    texts.shareFailed,
    texts.shareSuccess,
  ]);

  const openShareModal = useCallback(() => {
    setShareModalVisible(true);
  }, [setShareModalVisible]);

  const fetchSharedUsers = useCallback(() => {
    if (!selectedNoteId || !accessToken) return;
    if (setSharedUsersLoading) setSharedUsersLoading(true);
    getNoteShares(accessToken, selectedNoteId)
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        if (setSharedUsersList) {
          setSharedUsersList(rows.map((row) => ({
            ...row,
            userId: row.userId ?? row.UserId ?? row.id,
            userName: row.userName ?? row.UserName ?? row.name ?? row.Name ?? texts.userUnknown,
            userEmail: row.userEmail ?? row.UserEmail ?? row.email ?? row.Email ?? "",
            readOnly: row.readOnly ?? row.ReadOnly ?? false,
          })));
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401 && handleUnauthorized) {
          handleUnauthorized();
          return;
        }
        const msg = err?.response?.data?.message ?? err?.response?.data?.Message ?? err?.response?.data?.title;
        message.error(msg ?? texts.shareListLoadFailed);
      })
      .finally(() => {
        if (setSharedUsersLoading) setSharedUsersLoading(false);
      });
  }, [accessToken, selectedNoteId, setSharedUsersList, setSharedUsersLoading, handleUnauthorized, texts]);

  const toggleSharedUserReadOnly = useCallback((userId, readOnly) => {
    if (!accessToken || !selectedNoteId) return;
    patchNoteShare(accessToken, selectedNoteId, userId, { readOnly })
      .then(() => {
        if (setSharedUsersList) {
          setSharedUsersList((prev) =>
            prev.map((row) => {
              const id = String(row.userId ?? row.UserId ?? row.id);
              return String(userId) === id ? { ...row, readOnly } : row;
            })
          );
        }
      })
      .catch((err) => {
        if (err?.response?.status === 401 && handleUnauthorized) {
          handleUnauthorized();
          return;
        }
        message.error(texts.shareUpdateFailed);
      });
  }, [accessToken, selectedNoteId, setSharedUsersList, handleUnauthorized, texts]);

  const removeSharedUser = useCallback((userId) => {
    if (!accessToken || !selectedNoteId) return;
    unshareNote(accessToken, selectedNoteId, userId)
      .then(() => {
        if (setSharedUsersList) {
          setSharedUsersList((prev) =>
            prev.filter((row) => String(row.userId ?? row.UserId ?? row.id) !== String(userId))
          );
        }
        message.success(texts.unshareSuccess);
      })
      .catch((err) => {
        if (err?.response?.status === 401 && handleUnauthorized) {
          handleUnauthorized();
          return;
        }
        message.error(texts.shareRemoveFailed);
      });
  }, [accessToken, selectedNoteId, setSharedUsersList, handleUnauthorized, texts]);

  const closeShareModal = useCallback(() => {
    setShareModalVisible(false);
    setShareUserId("");
    setShareReadOnly(false);
  }, [setShareModalVisible, setShareReadOnly, setShareUserId]);

  return {
    handleShareSelected,
    handleExport,
    handleShareNoteSubmit,
    openShareModal,
    fetchSharedUsers,
    toggleSharedUserReadOnly,
    removeSharedUser,
    closeShareModal,
  };
}
