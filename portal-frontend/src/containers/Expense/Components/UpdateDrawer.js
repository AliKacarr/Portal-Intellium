import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Drawer, Button, Form, Space } from "antd";
import { PlusOutlined, SaveOutlined, SendOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import moment from "moment";

import ExpenseFormFields from "./ExpenseFormFields";
import ReceiptExtractStatusBar from "./ReceiptExtractStatusBar";
import { ExpenseEntryFields } from "./AddModal";
import {
  addExpense,
  addExpenses,
  deleteExpense,
  fetchExpenses,
  fetchIncompleteExpenseDraft,
  getErrorMessage,
  updateExpenseSuccess,
  deleteExpenseSuccess,
  updateExpense,
  upsertIncompleteExpenseDraft,
  deleteIncompleteExpenseDraft,
  upsertExpenseDraft,
} from "../redux/actionCreators";
import { StyledSelect } from "../Expense.styles";
import useExpenseListReceiptExtract from "../hooks/useExpenseListReceiptExtract";
import useExpenseUsers from "../hooks/useExpenseUsers";
import useExpenseCurrencies from "../hooks/useExpenseCurrencies";
import useExpenseSettings from "../hooks/useExpenseSettings";
import { resolveDefaultExpenseVatRate } from "../constants/expenseSettings";
import {
  buildInitialExpenseFormValues,
  buildResubmitExpensePayload,
  buildUpdateExpensePayload,
  createEmptyExpenseEntry,
  getComputedExpenseAmounts,
  omitExcludingVatAmount,
  pickComputedExpenseFormFields,
} from "../utils/expenseForm";
import {
  __markRequestRevisedForUi,
  __markExpensesRevisedForUi,
  getExpenseIdsInRequestBundle,
} from "../utils/expenseRequests";
import { scrollFormToFirstExpenseError } from "../utils/formScrollToFirstError";
import { getExpenseCopy } from "../utils/expenseI18n";
import { resolveExpenseRequestId } from "../utils/dashboardMetrics";
import {
  deleteDraftExpenseById,
  deleteDraftRequestById,
  createDraftExpenseId,
  createDraftRequestId,
  isDraftExpenseId,
  upsertDraftExpenses,
} from "../utils/expenseDrafts";
import {
  buildExpensePayload,
  convertFileToPngDataUrl,
  extractBase64FromDataUrl,
} from "../utils/expenseForm";

/** GET /incomplete/:id — payload çözümleme (ExpenseCreatePage ile uyumlu) */
const parseIncompleteDraftDocument = (draft) => {
  const raw =
    draft?.payload ??
    draft?.payload_json ??
    draft?.payloadJson ??
    draft?.payloadJSON ??
    draft?.Payload ??
    {};
  const payload =
    typeof raw === "string"
      ? (() => {
          try {
            return JSON.parse(raw);
          } catch {
            return {};
          }
        })()
      : raw || {};
  const rows = Array.isArray(payload?.expenses)
    ? payload.expenses
    : Array.isArray(payload?.Expenses)
    ? payload.Expenses
    : [];
  return {
    payload,
    rows,
    draftIdResolved: draft?.id ?? draft?.draftId ?? null,
  };
};

/** Taslak upsert gövdesi: kalemler varken backend toplam/KDV alanlarını kendisi hesaplasın */
const sanitizeDraftRowForPayload = (row = {}) => {
  const items = Array.isArray(row?.items) ? row.items : [];
  if (items.length > 0) {
    const {
      totalAmount,
      vat,
      vatRate,
      excludingVatAmount,
      ...rest
    } = row;
    return rest;
  }
  return row;
};

const normalizeApiExpenseRow = (row) => {
  if (!row || typeof row !== "object") return {};
  const items = Array.isArray(row.items)
    ? row.items
    : Array.isArray(row.Items)
    ? row.Items
    : [];
  return {
    ...row,
    items,
    description: row.description ?? row.Description,
    invoiceNumber: row.invoiceNumber ?? row.InvoiceNumber,
    invoiceDate: row.invoiceDate ?? row.InvoiceDate,
    totalAmount: row.totalAmount ?? row.TotalAmount,
    excludingVatAmount: row.excludingVatAmount ?? row.ExcludingVatAmount,
    vat: row.vat ?? row.Vat ?? row.VAT,
    vatRate: row.vatRate ?? row.VatRate,
    currencyCode: row.currencyCode ?? row.CurrencyCode,
    projectName: row.projectName ?? row.ProjectName,
    invoiceTitle: row.invoiceTitle ?? row.InvoiceTitle,
  };
};

function UpdateDrawer({
  open,
  close,
  info,
  showMessage,
  mode = "edit",
  rejectionReason = "",
}) {
  const copy = getExpenseCopy();
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const authUserId = useSelector((state) => state.Auth?.id);
  const isSubmitting = useSelector((state) => state.expenses.loading);
  const lastFilters = useSelector((state) => state.expenses.lastFilters);
  const { currentUserId, loadingUsers, userOptions } = useExpenseUsers();
  const { allowedCodes } = useExpenseCurrencies();
  const { vatRates } = useExpenseSettings();

  const isBatchResubmit = useMemo(
    () =>
      mode === "resubmit" &&
      Array.isArray(info?.expenses) &&
      info.expenses.length > 1,
    [info?.expenses, mode]
  );

  const isBatchDraft = useMemo(
    () =>
      mode === "draft" &&
      Array.isArray(info?.expenses) &&
      info.expenses.length >= 1,
    [info?.expenses, mode]
  );

  const isBatchIncomplete = useMemo(
    () =>
      mode === "incomplete" &&
      Array.isArray(info?.expenses) &&
      info.expenses.length >= 1,
    [info?.expenses, mode]
  );

  const singleExpenseSource = useMemo(() => {
    if (isBatchResubmit || isBatchDraft || isBatchIncomplete) return null;
    if (Array.isArray(info?.expenses) && info.expenses.length === 1) {
      return info.expenses[0];
    }
    return info;
  }, [info, isBatchDraft, isBatchResubmit, isBatchIncomplete]);

  /** Liste satırında info.expenses yok; GET ile çoklu satır gelirse Form.List aç */
  const [incompleteFromFetchHasList, setIncompleteFromFetchHasList] =
    useState(false);
  const [inlineReceiptExtractBusy, setInlineReceiptExtractBusy] =
    useState(false);

  useEffect(() => {
    if (!open) {
      setIncompleteFromFetchHasList(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const endIncompleteHydration = () => {
      if (mode !== "incomplete") {
        return;
      }
      requestAnimationFrame(() => {
        latestValuesRef.current = form.getFieldsValue(true);
        skipIncompleteAutosaveRef.current = false;
      });
    };

    if (mode === "incomplete") {
      skipIncompleteAutosaveRef.current = true;
    }

    if (isBatchResubmit && Array.isArray(info?.expenses)) {
      const firstVals = buildInitialExpenseFormValues({
        info: info.expenses[0],
        authUserId,
        currentUserId,
      });
      form.setFieldsValue({
        userId: firstVals.userId,
        expenses: info.expenses.map((exp) => {
          const v = buildInitialExpenseFormValues({
            info: exp,
            authUserId,
            currentUserId,
          });
          const { userId: _u, ...rest } = v;
          return rest;
        }),
      });
      endIncompleteHydration();
      return;
    }

    if (isBatchDraft && Array.isArray(info?.expenses)) {
      const firstVals = buildInitialExpenseFormValues({
        info: info.expenses[0],
        authUserId,
        currentUserId,
      });
      form.setFieldsValue({
        userId: firstVals.userId,
        expenses: info.expenses.map((exp) => {
          const v = buildInitialExpenseFormValues({
            info: exp,
            authUserId,
            currentUserId,
          });
          const { userId: _u, ...rest } = v;
          // Taslakta uploadRequired olmayacağı için upload'ı koruyoruz
          return rest;
        }),
      });
      endIncompleteHydration();
      return;
    }

    if (isBatchIncomplete && Array.isArray(info?.expenses)) {
      const firstVals = buildInitialExpenseFormValues({
        info: info.expenses[0],
        authUserId,
        currentUserId,
      });
      form.setFieldsValue({
        userId: firstVals.userId,
        expenses: info.expenses.map((exp) => {
          const v = buildInitialExpenseFormValues({
            info: exp,
            authUserId,
            currentUserId,
          });
          const { userId: _u, ...rest } = v;
          return rest;
        }),
      });
      endIncompleteHydration();
      return;
    }

    form.setFieldsValue(
      buildInitialExpenseFormValues({
        info: singleExpenseSource ?? info,
        authUserId,
        currentUserId,
      })
    );
    endIncompleteHydration();
  }, [
    authUserId,
    currentUserId,
    form,
    info,
    isBatchDraft,
    isBatchIncomplete,
    isBatchResubmit,
    mode,
    open,
    singleExpenseSource,
  ]);

  const resolveIncompleteDraftId = () => {
    if (mode !== "incomplete") return null;
    return (
      info?.__incompleteDraftId ||
      info?.expenses?.[0]?.__incompleteDraftId ||
      null
    );
  };

  const incompleteDraftIdRef = useRef(null);
  /** UUID taslak (draft/upsert) — OCR sonrası sessiz kayıtta dönen id */
  const expenseDraftIdRef = useRef(null);
  const draftAutosaveTimerRef = useRef(null);
  const latestValuesRef = useRef(null);
  const skipIncompleteAutosaveRef = useRef(false);
  const incompleteAutosaveTimerRef = useRef(null);

  const persistIncompleteDraftSilent = useCallback(async () => {
    const values = latestValuesRef.current || form.getFieldsValue(true);
    const targetUserId =
      values?.userId ?? currentUserId ?? authUserId ?? info?.userId;
    const draftId =
      incompleteDraftIdRef.current ?? resolveIncompleteDraftId();

    const buildRow = async (row, original = {}) => {
      const { upload: uploadList, ...rowSansUpload } = row || {};
      const uploadEntry = uploadList?.[0];
      const uploadFile = uploadEntry?.originFileObj || uploadEntry;
      const hasExistingUrl =
        typeof uploadEntry?.url === "string" && uploadEntry.url.trim() !== "";
      const canConvert =
        Boolean(uploadEntry?.originFileObj) || uploadFile instanceof Blob;
      const dataUrl = canConvert ? await convertFileToPngDataUrl(uploadFile) : "";
      const imageData =
        extractBase64FromDataUrl(hasExistingUrl ? uploadEntry.url : "") ||
        extractBase64FromDataUrl(dataUrl);
      return {
        ...original,
        ...rowSansUpload,
        userId: targetUserId,
        status: "Tamamlanmamış",
        createdUserId: authUserId,
        createdById: authUserId,
        imageData: imageData || original?.imageData,
      };
    };

    const useExpenseListShape =
      Array.isArray(values?.expenses) && values.expenses.length > 0;

    const payload = useExpenseListShape
      ? {
          userId: targetUserId,
          status: "Tamamlanmamış",
          expenses: await Promise.all(
            (values?.expenses || []).map((row, idx) =>
              buildRow(row, info?.expenses?.[idx] || {})
            )
          ),
        }
      : {
          userId: targetUserId,
          status: "Tamamlanmamış",
          expenses: [await buildRow(values, singleExpenseSource ?? info ?? {})],
        };

    const res = await dispatch(
      upsertIncompleteExpenseDraft({ draftId, payload, silent: true })
    );
    const returnedId = res?.draftId ?? res?.id ?? null;
    if (returnedId) {
      incompleteDraftIdRef.current = returnedId;
    }
  }, [
    authUserId,
    currentUserId,
    dispatch,
    form,
    info,
    singleExpenseSource,
  ]);

  /** Fiş OCR setFieldsValue ile doldurur; onValuesChange tetiklenmez (antd 4) — aynı debounce ile kaydet */
  const scheduleIncompleteAutosave = useCallback(() => {
    if (mode !== "incomplete") {
      return;
    }
    latestValuesRef.current = form.getFieldsValue(true);
    if (skipIncompleteAutosaveRef.current) {
      return;
    }
    if (incompleteAutosaveTimerRef.current) {
      clearTimeout(incompleteAutosaveTimerRef.current);
    }
    incompleteAutosaveTimerRef.current = setTimeout(() => {
      void persistIncompleteDraftSilent().catch(() => {});
    }, 900);
  }, [form, mode, persistIncompleteDraftSilent]);

  useEffect(() => {
    if (!open || mode !== "draft") return;
    const id =
      info?.__expenseDraftId || info?.expenses?.[0]?.__expenseDraftId || null;
    if (id) expenseDraftIdRef.current = id;
  }, [open, mode, info?.__expenseDraftId, info?.expenses]);

  const persistBatchExpenseDraftSilent = useCallback(async () => {
    if (mode !== "draft" || !isBatchDraft) return;
    const values = form.getFieldsValue(true);
    const targetUserId =
      values?.userId ?? currentUserId ?? authUserId ?? info?.userId;
    const draftId =
      expenseDraftIdRef.current ??
      info?.__expenseDraftId ??
      info?.expenses?.[0]?.__expenseDraftId ??
      null;

    const originals = Array.isArray(info?.expenses) ? info.expenses : [];
    const rid = info?.requestId || originals[0]?.requestId;
    const updatedDrafts = await Promise.all(
      (values?.expenses || []).map(async (row, idx) => {
        const original = originals[idx] || {};
        const uploadEntry = row?.upload?.[0];
        const uploadFile = uploadEntry?.originFileObj || uploadEntry;
        const hasExistingUrl =
          typeof uploadEntry?.url === "string" && uploadEntry.url.trim() !== "";
        const canConvert =
          Boolean(uploadEntry?.originFileObj) || uploadFile instanceof Blob;
        const dataUrl = canConvert ? await convertFileToPngDataUrl(uploadFile) : "";
        const imageData =
          extractBase64FromDataUrl(hasExistingUrl ? uploadEntry.url : "") ||
          extractBase64FromDataUrl(dataUrl);
        return {
          ...original,
          ...row,
          id: original?.id,
          requestId: rid,
          userId: targetUserId,
          status: "Taslak",
          createdUserId: authUserId,
          createdById: authUserId,
          imageData: imageData || original?.imageData,
          createdAt: original?.createdAt || new Date().toISOString(),
        };
      })
    );
    const payload = {
      userId: targetUserId,
      status: "Taslak",
      expenses: updatedDrafts.map(sanitizeDraftRowForPayload),
    };
    const res = await dispatch(
      upsertExpenseDraft({ draftId, payload, silent: true })
    );
    const returnedId = res?.draftId ?? res?.id ?? null;
    if (returnedId) {
      expenseDraftIdRef.current = returnedId;
    }
  }, [
    authUserId,
    currentUserId,
    dispatch,
    form,
    info,
    isBatchDraft,
    mode,
  ]);

  const persistSingleExpenseDraftSilent = useCallback(async () => {
    if (mode !== "draft" || isBatchDraft) return;
    const values = form.getFieldsValue(true);
    const targetUserId =
      values?.userId ?? currentUserId ?? authUserId ?? info?.userId;
    const draftId =
      expenseDraftIdRef.current ??
      info?.__expenseDraftId ??
      info?.expenses?.[0]?.__expenseDraftId ??
      null;

    const uploadEntry = values?.upload?.[0];
    const uploadFile = uploadEntry?.originFileObj || uploadEntry;
    const hasExistingUrl =
      typeof uploadEntry?.url === "string" && uploadEntry.url.trim() !== "";
    const canConvert =
      Boolean(uploadEntry?.originFileObj) || uploadFile instanceof Blob;
    const dataUrl = canConvert ? await convertFileToPngDataUrl(uploadFile) : "";
    const imageData =
      extractBase64FromDataUrl(hasExistingUrl ? uploadEntry.url : "") ||
      extractBase64FromDataUrl(dataUrl);

    const base =
      singleExpenseSource ??
      (Array.isArray(info?.expenses) && info.expenses.length === 1
        ? info.expenses[0]
        : info) ??
      {};
    const resolvedRequestId =
      base?.requestId ?? base?.RequestId ?? info?.requestId ?? createDraftRequestId();
    const resolvedId =
      base?.id ?? base?.Id ?? info?.id ?? createDraftExpenseId();

    const draft = {
      ...(base || {}),
      ...(values || {}),
      id: resolvedId,
      requestId: resolvedRequestId,
      userId: targetUserId,
      status: "Taslak",
      createdUserId: authUserId,
      createdById: authUserId,
      imageData: imageData || base?.imageData,
      createdAt: base?.createdAt || new Date().toISOString(),
    };
    const payload = {
      userId: targetUserId,
      status: "Taslak",
      expenses: [sanitizeDraftRowForPayload(draft)],
    };
    const res = await dispatch(
      upsertExpenseDraft({ draftId, payload, silent: true })
    );
    const nextDraftId = res?.draftId ?? res?.id ?? draftId;
    if (nextDraftId) {
      expenseDraftIdRef.current = nextDraftId;
    }
  }, [
    authUserId,
    currentUserId,
    dispatch,
    form,
    info,
    isBatchDraft,
    mode,
    singleExpenseSource,
  ]);

  const scheduleBatchDraftAutosave = useCallback(() => {
    if (mode !== "draft" || !isBatchDraft) return;
    if (draftAutosaveTimerRef.current) {
      clearTimeout(draftAutosaveTimerRef.current);
    }
    draftAutosaveTimerRef.current = setTimeout(() => {
      void persistBatchExpenseDraftSilent().catch(() => {});
    }, 900);
  }, [mode, isBatchDraft, persistBatchExpenseDraftSilent]);

  const scheduleSingleDraftAutosave = useCallback(() => {
    if (mode !== "draft" || isBatchDraft) return;
    if (draftAutosaveTimerRef.current) {
      clearTimeout(draftAutosaveTimerRef.current);
    }
    draftAutosaveTimerRef.current = setTimeout(() => {
      void persistSingleExpenseDraftSilent().catch(() => {});
    }, 900);
  }, [mode, isBatchDraft, persistSingleExpenseDraftSilent]);

  const listReceiptExtractOcrEnabled = useMemo(
    () =>
      open &&
      ((mode === "incomplete" &&
        (isBatchIncomplete || incompleteFromFetchHasList)) ||
        (mode === "draft" && isBatchDraft) ||
        (mode === "resubmit" && isBatchResubmit)),
    [
      open,
      mode,
      isBatchIncomplete,
      incompleteFromFetchHasList,
      isBatchDraft,
      isBatchResubmit,
    ]
  );

  const onListReceiptExtractApplied = useCallback(() => {
    if (mode === "incomplete") {
      scheduleIncompleteAutosave();
    } else if (mode === "draft" && isBatchDraft) {
      scheduleBatchDraftAutosave();
    }
  }, [mode, isBatchDraft, scheduleIncompleteAutosave, scheduleBatchDraftAutosave]);

  const {
    receiptExtractBusy: listReceiptExtractBusy,
    receiptExtractPhase: listReceiptExtractPhase,
    receiptExtractElapsedSec: listReceiptExtractElapsedSec,
    receiptExtractPendingRowIndexes: listReceiptExtractPendingRowIndexes,
    cancelReceiptExtract: cancelListReceiptExtract,
  } = useExpenseListReceiptExtract(form, {
    listName: "expenses",
    enabled: listReceiptExtractOcrEnabled,
    onReceiptExtractApplied: onListReceiptExtractApplied,
  });

  const receiptExtractFooterBusy =
    listReceiptExtractBusy || inlineReceiptExtractBusy;

  const flushIncompleteAutosave = useCallback(async () => {
    if (mode !== "incomplete" || skipIncompleteAutosaveRef.current) {
      return;
    }
    if (incompleteAutosaveTimerRef.current) {
      clearTimeout(incompleteAutosaveTimerRef.current);
      incompleteAutosaveTimerRef.current = null;
    }
    latestValuesRef.current = form.getFieldsValue(true);
    try {
      await persistIncompleteDraftSilent();
    } catch {
      // autosave sessiz
    }
  }, [form, mode, persistIncompleteDraftSilent]);

  useEffect(() => {
    if (!open || mode !== "incomplete") {
      return;
    }
    incompleteDraftIdRef.current =
      resolveIncompleteDraftId() ?? incompleteDraftIdRef.current;
  }, [open, mode, info?.__incompleteDraftId, info?.expenses]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        void flushIncompleteAutosave();
      }
    };
    const onPageHide = () => void flushIncompleteAutosave();
    window.addEventListener("pagehide", onPageHide);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onPageHide);
      document.removeEventListener("visibilitychange", onVisibility);
      if (incompleteAutosaveTimerRef.current) {
        clearTimeout(incompleteAutosaveTimerRef.current);
      }
      if (draftAutosaveTimerRef.current) {
        clearTimeout(draftAutosaveTimerRef.current);
      }
    };
  }, [flushIncompleteAutosave]);

  useEffect(() => {
    if (!open || mode !== "incomplete") {
      return;
    }
    const draftId = String(
      incompleteDraftIdRef.current ?? resolveIncompleteDraftId() ?? ""
    ).trim();
    if (!draftId) {
      return;
    }

    let cancelled = false;
    skipIncompleteAutosaveRef.current = true;

    (async () => {
      const draft = await dispatch(fetchIncompleteExpenseDraft(draftId));
      if (cancelled) {
        return;
      }

      if (!draft) {
        requestAnimationFrame(() => {
          latestValuesRef.current = form.getFieldsValue(true);
          skipIncompleteAutosaveRef.current = false;
        });
        return;
      }

      const { rows, payload, draftIdResolved } = parseIncompleteDraftDocument(draft);
      incompleteDraftIdRef.current = String(draftIdResolved ?? draftId);

      if (!rows.length) {
        requestAnimationFrame(() => {
          latestValuesRef.current = form.getFieldsValue(true);
          skipIncompleteAutosaveRef.current = false;
        });
        return;
      }

      const ownerFromPayload = payload?.userId ?? payload?.UserId;

      if (rows.length > 1) {
        setIncompleteFromFetchHasList(true);
        const base = {
          ...createEmptyExpenseEntry(),
          ...normalizeApiExpenseRow(rows[0]),
        };
        const firstVals = buildInitialExpenseFormValues({
          info: base,
          authUserId,
          currentUserId,
        });
        form.setFieldsValue({
          userId: ownerFromPayload ?? firstVals.userId,
          expenses: rows.map((r) => {
            const infoRow = {
              ...createEmptyExpenseEntry(),
              ...normalizeApiExpenseRow(r),
            };
            const v = buildInitialExpenseFormValues({
              info: infoRow,
              authUserId,
              currentUserId,
            });
            const { userId: _u, ...rest } = v;
            return rest;
          }),
        });
      } else {
        setIncompleteFromFetchHasList(false);
        const infoRow = {
          ...createEmptyExpenseEntry(),
          ...normalizeApiExpenseRow(rows[0]),
        };
        form.setFieldsValue(
          buildInitialExpenseFormValues({
            info: infoRow,
            authUserId,
            currentUserId,
          })
        );
        if (ownerFromPayload != null) {
          form.setFieldValue("userId", ownerFromPayload);
        }
      }

      requestAnimationFrame(() => {
        latestValuesRef.current = form.getFieldsValue(true);
        skipIncompleteAutosaveRef.current = false;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    authUserId,
    currentUserId,
    dispatch,
    form,
    mode,
    open,
    info?.__incompleteDraftId,
    info?.expenses,
  ]);

  const handleSaveIncomplete = async () => {
    try {
      const values = form.getFieldsValue(true);
      const targetUserId =
        values?.userId ?? currentUserId ?? authUserId ?? info?.userId;
      const draftId =
        incompleteDraftIdRef.current ?? resolveIncompleteDraftId();

      const buildRow = async (row, original = {}) => {
        const { upload: uploadList, ...rowSansUpload } = row || {};
        const uploadEntry = uploadList?.[0];
        const uploadFile = uploadEntry?.originFileObj || uploadEntry;
        const hasExistingUrl =
          typeof uploadEntry?.url === "string" && uploadEntry.url.trim() !== "";
        const canConvert =
          Boolean(uploadEntry?.originFileObj) || uploadFile instanceof Blob;
        const dataUrl = canConvert ? await convertFileToPngDataUrl(uploadFile) : "";
        const imageData =
          extractBase64FromDataUrl(hasExistingUrl ? uploadEntry.url : "") ||
          extractBase64FromDataUrl(dataUrl);
        return {
          ...original,
          ...rowSansUpload,
          userId: targetUserId,
          status: "Tamamlanmamış",
          createdUserId: authUserId,
          createdById: authUserId,
          imageData: imageData || original?.imageData,
        };
      };

      const useExpenseListShape =
        Array.isArray(values?.expenses) && values.expenses.length > 0;

      const payload = useExpenseListShape
        ? {
            userId: targetUserId,
            status: "Tamamlanmamış",
            expenses: await Promise.all(
              (values?.expenses || []).map((row, idx) =>
                buildRow(row, info?.expenses?.[idx] || {})
              )
            ),
          }
        : {
            userId: targetUserId,
            status: "Tamamlanmamış",
            expenses: [await buildRow(values, singleExpenseSource ?? info ?? {})],
          };

      const res = await dispatch(
        upsertIncompleteExpenseDraft({ draftId, payload, silent: false })
      );
      if (!res) {
        showMessage("error", copy.updateError || "Update failed.");
        return;
      }
      const returnedId = res?.draftId ?? res?.id ?? null;
      if (returnedId) {
        incompleteDraftIdRef.current = returnedId;
      }
      await dispatch(fetchExpenses(lastFilters || {}));
      close(false);
      showMessage("success", copy.updateSuccess || "Draft expense updated.");
    } catch (error) {
      console.error("Error saving incomplete:", error);
      showMessage("error", getErrorMessage(error, copy.updateError || "Update failed."));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields(undefined, {
        scrollToFirstError: { behavior: "smooth", block: "center" },
      });
      const isResubmitMode = mode === "resubmit";
      const isDraftMode = mode === "draft";
      const isIncompleteMode = mode === "incomplete";
      const targetUserId =
        values?.userId ?? currentUserId ?? authUserId ?? info?.userId;
      const fallbackMealPersonNames =
        userOptions.find(
          (userOption) => String(userOption.value) === String(targetUserId)
        )?.label || copy.user;

      if (isResubmitMode && isBatchResubmit) {
        const originals = info.expenses || [];
        // UI anında "Revize edildi" gösterebilsin diye eski kayıtları da işaretle.
        __markExpensesRevisedForUi(originals);
        // Form.List satırlarında userId yok (üstteki Masraf Sahibi alanında); aksi halde
        // buildResubmitExpensePayload row.userId ?? authUserId ile her zaman giriş yapanı yazar.
        const ownerUserId = targetUserId;
        const payloads = await Promise.all(
          values.expenses.map((row, idx) =>
            buildResubmitExpensePayload(
              { ...row, userId: row?.userId ?? ownerUserId },
              originals[idx] || {},
              authUserId,
              fallbackMealPersonNames,
              allowedCodes
            )
          )
        );
        const rid =
          info?.requestId ??
          info?.RequestId ??
          originals[0]?.requestId ??
          originals[0]?.RequestId ??
          resolveExpenseRequestId(originals[0] ?? {});
        const withRid = rid
          ? payloads.map((p) => ({
              ...p,
              requestId: rid,
              RequestId: rid,
            }))
          : payloads;

        const createdExpenses = await dispatch(addExpenses(withRid));
        const ids = getExpenseIdsInRequestBundle(info);
        for (const id of ids) {
          await dispatch(deleteExpense(id));
        }
        if (rid) {
          __markRequestRevisedForUi(String(rid));
        }
        __markExpensesRevisedForUi([...(Array.isArray(createdExpenses) ? createdExpenses : []), ...originals]);
        // İşaret localStorage'a yazılır ama render tetiklemez; statünün hemen güncellenmesi için yeniden çek.
        await dispatch(fetchExpenses(lastFilters || {}));
        close(false);
        showMessage(
          "success",
          payloads.length > 1
            ? `${payloads.length} fatura yeniden gönderildi.`
            : `${payloads[0].invoiceNumber} ${copy.resubmitSuccess}`
        );
        return;
      }

      if (isDraftMode) {
        if (isBatchDraft) {
          const originals = Array.isArray(info?.expenses) ? info.expenses : [];
          const payloads = await Promise.all(
            (values?.expenses || []).map((row, idx) =>
              buildExpensePayload(
                row,
                targetUserId,
                fallbackMealPersonNames,
                allowedCodes
              ).then((p) => {
                const rid = info?.requestId || originals[0]?.requestId;
                return rid ? { ...p, requestId: rid, RequestId: rid } : p;
              })
            )
          );
          await dispatch(addExpenses(payloads));
          if (info?.requestId) {
            // local draft storage + store'dan düşür
            const removed = deleteDraftRequestById(info.requestId);
            originals.forEach((e) => {
              const id = e?.id ?? e?.Id ?? e?.expenseId ?? e?.ExpenseId;
              if (id) dispatch(deleteExpenseSuccess(id));
            });
            void removed;
          }
          await dispatch(fetchExpenses(lastFilters || {}));
          close(false);
          showMessage("success", `${payloads.length} masraf talep edildi.`);
          return;
        }

        // Tekil taslağı gerçek masrafa çevir.
        const payload = await buildExpensePayload(
          values,
          targetUserId,
          fallbackMealPersonNames,
          allowedCodes
        );
        const created = await dispatch(addExpense(payload));
        const draftId = info?.id;
        const draftRequestId = info?.requestId;
        if (draftId && isDraftExpenseId(String(draftId))) {
          deleteDraftExpenseById(draftId);
          dispatch(deleteExpenseSuccess(draftId));
        } else if (draftRequestId) {
          deleteDraftRequestById(draftRequestId);
        }
        await dispatch(fetchExpenses(lastFilters || {}));
        close(false);
        showMessage("success", `${payload.invoiceNumber} ${copy.addSuccessSingle}`);
        return created;
      }

      if (isIncompleteMode) {
        const draftId =
          incompleteDraftIdRef.current ?? resolveIncompleteDraftId();
        const submitAsExpenseList =
          Array.isArray(values?.expenses) && values.expenses.length > 0;
        if (submitAsExpenseList) {
          const originals = Array.isArray(info?.expenses) ? info.expenses : [];
          const payloads = await Promise.all(
            (values?.expenses || []).map((row, idx) =>
              buildExpensePayload(
                row,
                targetUserId,
                fallbackMealPersonNames,
                allowedCodes
              ).then((p) => {
                const rid = info?.requestId || originals[0]?.requestId;
                return rid ? { ...p, requestId: rid, RequestId: rid } : p;
              })
            )
          );
          await dispatch(addExpenses(payloads));
          if (draftId) {
            await dispatch(deleteIncompleteExpenseDraft(draftId));
          }
          await dispatch(fetchExpenses(lastFilters || {}));
          close(false);
          showMessage("success", `${payloads.length} masraf talep edildi.`);
          return;
        }

        const payload = await buildExpensePayload(
          values,
          targetUserId,
          fallbackMealPersonNames,
          allowedCodes
        );
        const created = await dispatch(addExpense(payload));
        if (draftId) {
          await dispatch(deleteIncompleteExpenseDraft(draftId));
        }
        await dispatch(fetchExpenses(lastFilters || {}));
        close(false);
        showMessage("success", `${payload.invoiceNumber} ${copy.addSuccessSingle}`);
        return created;
      }

      const expensePayload = isResubmitMode
        ? await buildResubmitExpensePayload(
            values,
            singleExpenseSource ?? info,
            authUserId,
            fallbackMealPersonNames,
            allowedCodes
          )
        : buildUpdateExpensePayload(
            values,
            singleExpenseSource ?? info,
            authUserId,
            {},
            allowedCodes
          );

      if (isResubmitMode) {
        const originalSingle =
          singleExpenseSource ?? info?.expenses?.[0] ?? info;
        __markExpensesRevisedForUi(originalSingle ? [originalSingle] : []);
        const createdExpense = await dispatch(addExpense(expensePayload));
        const idToDelete =
          info?.id ??
          info?.expenses?.[0]?.id ??
          singleExpenseSource?.id;
        if (idToDelete) {
          await dispatch(deleteExpense(idToDelete));
        }
        const requestId =
          info?.requestId ??
          info?.RequestId ??
          info?.RequestID ??
          expensePayload?.requestId ??
          resolveExpenseRequestId(singleExpenseSource ?? info ?? {});
        if (requestId) {
          __markRequestRevisedForUi(String(requestId));
        }
        __markExpensesRevisedForUi(
          [
            ...(createdExpense ? [createdExpense] : []),
            ...(originalSingle ? [originalSingle] : []),
          ].filter(Boolean)
        );
        // İşaret localStorage'a yazılır ama render tetiklemez; statünün hemen güncellenmesi için yeniden çek.
        await dispatch(fetchExpenses(lastFilters || {}));
      } else {
        const updateId =
          info?.id ?? info?.expenses?.[0]?.id ?? singleExpenseSource?.id;
        await dispatch(updateExpense(updateId, expensePayload));
      }
      close(false);
      showMessage(
        "success",
        `${expensePayload.invoiceNumber} ${
          isResubmitMode ? copy.resubmitSuccess : copy.updateSuccess
        }`
      );
    } catch (error) {
      if (error?.errorFields) {
        scrollFormToFirstExpenseError(form, error);
        return;
      }

      console.error("Error validating fields or handling submit:", error);
      showMessage(
        "error",
        getErrorMessage(
          error,
          mode === "resubmit" ? copy.resubmitError : copy.updateError
        )
      );
    }
  };

  const handleSaveDraft = async () => {
    try {
      const values = form.getFieldsValue(true);
      const targetUserId =
        values?.userId ?? currentUserId ?? authUserId ?? info?.userId;
      const draftId =
        info?.__expenseDraftId || info?.expenses?.[0]?.__expenseDraftId || null;

      if (isBatchDraft) {
        const originals = Array.isArray(info?.expenses) ? info.expenses : [];
        const rid = info?.requestId || originals[0]?.requestId;
        const updatedDrafts = await Promise.all(
          (values?.expenses || []).map(async (row, idx) => {
            const original = originals[idx] || {};
            const uploadEntry = row?.upload?.[0];
            const uploadFile = uploadEntry?.originFileObj || uploadEntry;
            const hasExistingUrl =
              typeof uploadEntry?.url === "string" && uploadEntry.url.trim() !== "";
            const canConvert =
              Boolean(uploadEntry?.originFileObj) || uploadFile instanceof Blob;
            const dataUrl = canConvert ? await convertFileToPngDataUrl(uploadFile) : "";
            const imageData =
              extractBase64FromDataUrl(hasExistingUrl ? uploadEntry.url : "") ||
              extractBase64FromDataUrl(dataUrl);
            return {
              ...original,
              ...row,
              id: original?.id,
              requestId: rid,
              userId: targetUserId,
              status: "Taslak",
              createdUserId: authUserId,
              createdById: authUserId,
              imageData: imageData || original?.imageData,
              createdAt: original?.createdAt || new Date().toISOString(),
            };
          })
        );
        // DB draft (uuid) - tek draft kaydı içinde expenses array olarak sakla
        const payload = {
          userId: targetUserId,
          status: "Taslak",
          expenses: updatedDrafts.map(sanitizeDraftRowForPayload),
        };
        const res = await dispatch(
          upsertExpenseDraft({ draftId, payload, silent: false })
        );
        const nextDraftId = res?.draftId ?? res?.id ?? draftId;
        if (nextDraftId) expenseDraftIdRef.current = nextDraftId;
        // Anlık UI güncellemesi (fetch beklemeden)
        updatedDrafts.forEach((d) => dispatch(updateExpenseSuccess(d)));
      } else {
        const uploadEntry = values?.upload?.[0];
        const uploadFile = uploadEntry?.originFileObj || uploadEntry;
        const hasExistingUrl =
          typeof uploadEntry?.url === "string" && uploadEntry.url.trim() !== "";
        const canConvert =
          Boolean(uploadEntry?.originFileObj) || uploadFile instanceof Blob;
        const dataUrl = canConvert ? await convertFileToPngDataUrl(uploadFile) : "";
        const imageData =
          extractBase64FromDataUrl(hasExistingUrl ? uploadEntry.url : "") ||
          extractBase64FromDataUrl(dataUrl);

        const base =
          singleExpenseSource ??
          (Array.isArray(info?.expenses) && info.expenses.length === 1
            ? info.expenses[0]
            : info) ??
          {};
        const resolvedRequestId =
          base?.requestId ?? base?.RequestId ?? info?.requestId ?? createDraftRequestId();
        const resolvedId =
          base?.id ?? base?.Id ?? info?.id ?? createDraftExpenseId();

        const draft = {
          ...(base || {}),
          ...(values || {}),
          id: resolvedId,
          requestId: resolvedRequestId,
          userId: targetUserId,
          status: "Taslak",
          createdUserId: authUserId,
          createdById: authUserId,
          imageData: imageData || base?.imageData,
          createdAt: base?.createdAt || new Date().toISOString(),
        };
        const payload = {
          userId: targetUserId,
          status: "Taslak",
          expenses: [sanitizeDraftRowForPayload(draft)],
        };
        const res = await dispatch(
          upsertExpenseDraft({ draftId, payload, silent: false })
        );
        // draftId'yi listede taşıyabilmek için store'u da güncelle
        const nextDraftId = res?.draftId ?? res?.id ?? draftId;
        if (nextDraftId) expenseDraftIdRef.current = nextDraftId;
        dispatch(updateExpenseSuccess({ ...draft, __expenseDraftId: nextDraftId }));
      }
      await dispatch(fetchExpenses(lastFilters || {}));
      close(false);
      showMessage("success", "Taslak olarak kaydedildi.");
    } catch (error) {
      console.error("Error saving draft:", error);
      showMessage("error", getErrorMessage(error, "Taslak kaydedilemedi."));
    }
  };

  const handleValuesChange = (changedValues, allValues) => {
    try {
      if (isBatchResubmit) {
        const changedExpenses = changedValues.expenses;

        if (!changedExpenses || !Array.isArray(changedExpenses)) {
          return;
        }

        const nextExpenses = [...(allValues.expenses || [])];
        let hasUpdates = false;

        changedExpenses.forEach((changedExpense, index) => {
          if (!changedExpense) {
            return;
          }

          const hasItems =
            Array.isArray(nextExpenses[index]?.items) &&
            nextExpenses[index].items.length > 0;

          const totalAmountChanged = Object.prototype.hasOwnProperty.call(
            changedExpense,
            "totalAmount"
          );
          const vatRateChanged = Object.prototype.hasOwnProperty.call(
            changedExpense,
            "vatRate"
          );
          const invoiceTitleChanged = Object.prototype.hasOwnProperty.call(
            changedExpense,
            "invoiceTitle"
          );
          const mealPersonCountChanged = Object.prototype.hasOwnProperty.call(
            changedExpense,
            "mealPersonCount"
          );

          const hasAmountChange =
            vatRateChanged || invoiceTitleChanged || mealPersonCountChanged
              ? true
              : totalAmountChanged && !hasItems;

          if (!hasAmountChange) {
            return;
          }

          let expenseRow = omitExcludingVatAmount({
            ...nextExpenses[index],
            amountInputMode: "totalAmount",
          });
          if (Object.prototype.hasOwnProperty.call(changedExpense, "invoiceTitle")) {
            expenseRow = {
              ...expenseRow,
              vatRate: resolveDefaultExpenseVatRate(
                expenseRow.invoiceTitle,
                vatRates
              ),
            };
          }

          const amounts = getComputedExpenseAmounts(expenseRow);
          nextExpenses[index] = {
            ...expenseRow,
            ...pickComputedExpenseFormFields(amounts),
          };
          hasUpdates = true;
        });

        if (hasUpdates) {
          form.setFieldsValue({
            ...allValues,
            expenses: nextExpenses,
          });
        }
        return;
      }

      const hasItems = Array.isArray(allValues?.items) && allValues.items.length > 0;

      const totalAmountChanged = Object.prototype.hasOwnProperty.call(
        changedValues,
        "totalAmount"
      );
      const vatRateChanged = Object.prototype.hasOwnProperty.call(
        changedValues,
        "vatRate"
      );
      const invoiceTitleChanged = Object.prototype.hasOwnProperty.call(
        changedValues,
        "invoiceTitle"
      );
      const mealPersonCountChanged = Object.prototype.hasOwnProperty.call(
        changedValues,
        "mealPersonCount"
      );

      const hasAmountChange =
        vatRateChanged || invoiceTitleChanged || mealPersonCountChanged
          ? true
          : totalAmountChanged && !hasItems;

      if (!hasAmountChange) {
        return;
      }

      let merged = omitExcludingVatAmount({
        ...allValues,
        amountInputMode: "totalAmount",
      });
      if (Object.prototype.hasOwnProperty.call(changedValues, "invoiceTitle")) {
        merged = {
          ...merged,
          vatRate: resolveDefaultExpenseVatRate(merged.invoiceTitle, vatRates),
        };
      }

      const amounts = getComputedExpenseAmounts(merged);
      form.setFieldsValue({
        amountInputMode: "totalAmount",
        ...pickComputedExpenseFormFields(amounts),
      });
    } finally {
      if (mode === "incomplete") {
        latestValuesRef.current = form.getFieldsValue(true);
        if (!skipIncompleteAutosaveRef.current) {
          if (incompleteAutosaveTimerRef.current) {
            clearTimeout(incompleteAutosaveTimerRef.current);
          }
          incompleteAutosaveTimerRef.current = setTimeout(() => {
            void persistIncompleteDraftSilent().catch(() => {});
          }, 900);
        }
      }
    }
  };

  const initialInvoiceDate = singleExpenseSource?.invoiceDate
    ? moment(singleExpenseSource.invoiceDate)
    : info?.invoiceDate
      ? moment(info.invoiceDate)
      : null;

  const drawerWidth =
    typeof window === "undefined"
      ? 960
      : window.innerWidth < 768
        ? window.innerWidth - 24
        : Math.min(window.innerWidth * 0.78, 1120);

  return (
    <Drawer
      size="large"
      width={
        isBatchResubmit || mode === "draft" || mode === "incomplete"
          ? drawerWidth
          : undefined
      }
      open={open}
      onClose={() => {
        if (mode === "incomplete") {
          void flushIncompleteAutosave();
        }
        close(false);
      }}
      forceRender
      destroyOnClose
      styles={{
        body: isBatchResubmit
          ? { maxHeight: "75vh", overflowY: "auto" }
          : undefined,
      }}
      extra={
        <Space>
          {mode === "draft" ? (
            <Button
              icon={<SaveOutlined />}
              onClick={handleSaveDraft}
              disabled={isSubmitting || receiptExtractFooterBusy}
            >
              Güncelle
            </Button>
          ) : null}
          {mode === "incomplete" ? (
            <Button
              icon={<SaveOutlined />}
              onClick={handleSaveIncomplete}
              disabled={isSubmitting || receiptExtractFooterBusy}
            >
              Güncelle
            </Button>
          ) : null}
          <Button
            icon={<SendOutlined />}
            onClick={handleSubmit}
            className="modal-input"
            type="primary"
            loading={isSubmitting}
            disabled={receiptExtractFooterBusy}
            style={{
              display: "flex",
              alignItems: "center",
              borderRadius: ".3rem",
            }}
          >
            {mode === "resubmit"
              ? copy.resubmitExpense
              : mode === "draft"
                ? "Masraf talep et"
                : mode === "incomplete"
                  ? "Masraf talep et"
                : copy.update}
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        scrollToFirstError={{ behavior: "smooth", block: "center" }}
      >
        {listReceiptExtractOcrEnabled ? (
          <ReceiptExtractStatusBar
            phase={listReceiptExtractPhase}
            elapsedSec={listReceiptExtractElapsedSec}
            titlePreparing={copy.receiptExtractPhasePreparing}
            titleScanning={copy.receiptExtractPhaseScanning}
            cancelLabel={copy.receiptExtractCancel}
            onCancel={cancelListReceiptExtract}
          />
        ) : null}
        {mode === "resubmit" && rejectionReason ? (
          <Alert
            style={{ marginBottom: 20 }}
            type="warning"
            showIcon
            message={copy.rejectionReason}
            description={rejectionReason}
          />
        ) : null}

        <Form.Item
          name="userId"
          label={copy.userSelectLabel}
          rules={[{ required: true, message: copy.userSelectRequired }]}
        >
          <StyledSelect
            options={userOptions}
            loading={loadingUsers}
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={copy.userSelectPlaceholder}
          />
        </Form.Item>

        {isBatchResubmit ? (
          <Form.List name="expenses">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <ExpenseEntryFields
                    key={field.key}
                    field={field}
                    index={index}
                    form={form}
                    remove={remove}
                    canRemove={fields.length > 1}
                    uploadRequired={false}
                    receiptExtractBusy={receiptExtractFooterBusy}
                    receiptExtractPendingRowIndexes={listReceiptExtractPendingRowIndexes}
                    receiptExtractPhase={listReceiptExtractPhase}
                    receiptExtractElapsedSec={listReceiptExtractElapsedSec}
                    cancelReceiptExtract={cancelListReceiptExtract}
                  />
                ))}
                <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => add(createEmptyExpenseEntry())}
                    disabled={receiptExtractFooterBusy}
                    style={{
                      borderRadius: 16,
                      border: "1.5px dashed rgba(47,137,217,0.65)",
                      color: "#0f172a",
                      height: 44,
                      padding: "0 16px",
                      fontWeight: 600,
                      background: "rgba(47,137,217,0.06)",
                    }}
                  >
                    Yeni masraf ekle
                  </Button>
                </div>
              </>
            )}
          </Form.List>
        ) : isBatchDraft || isBatchIncomplete || incompleteFromFetchHasList ? (
          <Form.List name="expenses">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field, index) => (
                  <ExpenseEntryFields
                    key={field.key}
                    field={field}
                    index={index}
                    form={form}
                    remove={remove}
                    canRemove={fields.length > 1}
                    uploadRequired={isBatchIncomplete || incompleteFromFetchHasList}
                    receiptExtractBusy={receiptExtractFooterBusy}
                    receiptExtractPendingRowIndexes={listReceiptExtractPendingRowIndexes}
                    receiptExtractPhase={listReceiptExtractPhase}
                    receiptExtractElapsedSec={listReceiptExtractElapsedSec}
                    cancelReceiptExtract={cancelListReceiptExtract}
                  />
                ))}
                <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => add(createEmptyExpenseEntry())}
                    disabled={receiptExtractFooterBusy}
                    style={{
                      borderRadius: 16,
                      border: "1.5px dashed rgba(47,137,217,0.65)",
                      color: "#0f172a",
                      height: 44,
                      padding: "0 16px",
                      fontWeight: 600,
                      background: "rgba(47,137,217,0.06)",
                    }}
                  >
                    Yeni masraf ekle
                  </Button>
                </div>
              </>
            )}
          </Form.List>
        ) : (
          <ExpenseFormFields
            form={form}
            initialInvoiceDate={initialInvoiceDate}
            showUpload={mode === "resubmit" || mode === "draft" || mode === "incomplete"}
            uploadRequired={mode !== "draft"}
            onReceiptExtractApplied={
              mode === "incomplete"
                ? scheduleIncompleteAutosave
                : mode === "draft"
                  ? scheduleSingleDraftAutosave
                  : undefined
            }
            onReceiptExtractLoadingChange={(s) =>
              setInlineReceiptExtractBusy(Boolean(s?.busy))
            }
          />
        )}
      </Form>
    </Drawer>
  );
}

export default UpdateDrawer;
