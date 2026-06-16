import { useCallback, useEffect, useRef, useState } from "react";
import { Form, message } from "antd";
import { useSelector } from "react-redux";

import { resolveDefaultExpenseVatRate } from "../constants/expenseSettings";
import { convertFileToPngDataUrlForExtract } from "../utils/expenseForm";
import { getExpenseCopy } from "../utils/expenseI18n";
import {
  applyReceiptExtractionToForm,
  fileToPngBase64Payload,
} from "../utils/mapReceiptExtractToForm";
import {
  getReceiptExtractErrorMessage,
  extractReceipt,
  isReceiptExtractApiKeyError,
  isReceiptExtractClientTimeout,
  isReceiptExtractRequestCancelled,
  postReceiptExtractBulk,
} from "../utils/receiptExtractApi";
import useExpenseSettings from "./useExpenseSettings";

const warnExtractFailure = (error, apiKeyWarnedRef) => {
  if (isReceiptExtractRequestCancelled(error)) {
    return;
  }
  const copy = getExpenseCopy();
  if (isReceiptExtractApiKeyError(error)) {
    if (!apiKeyWarnedRef.current) {
      apiKeyWarnedRef.current = true;
      message.warning(copy.receiptExtractUnavailable);
    }
    return;
  }
  if (isReceiptExtractClientTimeout(error)) {
    message.warning(copy.receiptExtractTimeout);
    return;
  }
  const serverMsg = getReceiptExtractErrorMessage(error, copy);
  message.warning(serverMsg || copy.receiptExtractUnavailable);
};

/**
 * Çoklu masraf (Form.List `expenses`) için fiş OCR: tek satırda /extract, birden fazla yeni dosyada /extract/bulk.
 * ExpenseFormFields üzerinde deferReceiptExtractToParent=true ile kullanın.
 *
 * Dönüş: yükleme durumu (buton kilitleme + ReceiptExtractStatusBar için).
 */
export default function useExpenseListReceiptExtract(form, options = {}) {
  const { listName = "expenses", enabled = true, onReceiptExtractApplied } =
    options;
  const accessToken = useSelector((s) => s.Auth?.accessToken);
  const { vatRates } = useExpenseSettings();
  const defaultVatRate = resolveDefaultExpenseVatRate(undefined, vatRates);
  const list = Form.useWatch(listName, form) || [];
  const processedUidByIndexRef = useRef({});
  const timerRef = useRef(null);
  const seqRef = useRef(0);
  const apiKeyWarnedRef = useRef(false);
  const abortRef = useRef(null);
  const elapsedTimerRef = useRef(null);

  const [phase, setPhase] = useState("idle");
  const [elapsedSec, setElapsedSec] = useState(0);
  /** OCR sürerken hangi `expenses` satır indeksleri işleniyor (defer modunda görsel yanı göstergesi için) */
  const [pendingRowIndexes, setPendingRowIndexes] = useState([]);

  const cancelReceiptExtract = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  useEffect(() => {
    if (phase === "idle") {
      setPendingRowIndexes([]);
      setElapsedSec(0);
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
      return;
    }
    setElapsedSec(0);
    elapsedTimerRef.current = setInterval(() => {
      setElapsedSec((n) => n + 1);
    }, 1000);
    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    };
  }, [phase]);

  useEffect(() => {
    if (!enabled || !accessToken || !form) {
      return undefined;
    }

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const rows = form.getFieldValue(listName) || [];
      const pending = [];
      rows.forEach((row, i) => {
        const f = row?.upload?.[0];
        if (!f?.originFileObj) return;
        if (processedUidByIndexRef.current[i] === f.uid) return;
        pending.push({ index: i, uid: f.uid, file: f.originFileObj });
      });
      if (!pending.length) return;

      setPendingRowIndexes(pending.map((p) => p.index));
      setPhase("preparing");

      const seq = ++seqRef.current;
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      const signal = ac.signal;
      const copy = getExpenseCopy();

      const finishOk = (ocrDurationMs) => {
        if (
          ocrDurationMs != null &&
          Number.isFinite(ocrDurationMs) &&
          ocrDurationMs > 0
        ) {
          const s = Math.max(1, Math.round(ocrDurationMs / 1000));
          message.success(
            copy.receiptExtractCompleted.replace("{seconds}", String(s)),
            4
          );
        }
      };

      try {
        if (pending.length === 1) {
          const { index, uid, file } = pending[0];
          if (seq !== seqRef.current) return;
          let payload;
          let ocrDurationMs;
          try {
            const res = await extractReceipt(accessToken, {
              file,
              signal,
              onPhase: (p) => setPhase(p),
            });
            payload = res?.payload;
            ocrDurationMs = res?.ocrDurationMs;
          } catch (e) {
            if (!isReceiptExtractRequestCancelled(e)) {
              warnExtractFailure(e, apiKeyWarnedRef);
            }
            return;
          } finally {
            setPhase("idle");
          }
          if (seq !== seqRef.current) return;
          if (
            applyReceiptExtractionToForm(form, [listName, index], payload, {
              defaultVatRate,
            })
          ) {
            onReceiptExtractApplied?.();
            finishOk(ocrDurationMs);
            processedUidByIndexRef.current[index] = uid;
          }
        } else {
          let payloads;
          try {
            payloads = await Promise.all(
              pending.map(async (p) => {
                const { base64, contentType } = await fileToPngBase64Payload(
                  p.file,
                  convertFileToPngDataUrlForExtract
                );
                return { ...p, base64, contentType };
              })
            );
          } catch {
            setPhase("idle");
            return;
          }
          if (seq !== seqRef.current) {
            setPhase("idle");
            return;
          }
          const valid = payloads.filter((x) => x.base64);
          if (!valid.length) {
            setPhase("idle");
            return;
          }

          setPhase("scanning");
          let bulk;
          try {
            bulk = await postReceiptExtractBulk(
              accessToken,
              valid.map((x) => ({
                imageBase64: x.base64,
                contentType: x.contentType,
              })),
              { signal }
            );
          } catch (e) {
            if (!isReceiptExtractRequestCancelled(e)) {
              warnExtractFailure(e, apiKeyWarnedRef);
            }
            setPhase("idle");
            return;
          } finally {
            setPhase("idle");
          }
          if (seq !== seqRef.current) return;

          const results = bulk?.results || [];
          finishOk(bulk?.ocrDurationMs);

          valid.forEach((p, j) => {
            const raw = Array.isArray(results) ? results[j] : null;
            if (
              raw &&
              applyReceiptExtractionToForm(form, [listName, p.index], raw, {
                defaultVatRate,
              })
            ) {
              onReceiptExtractApplied?.();
              processedUidByIndexRef.current[p.index] = p.uid;
            }
          });
        }
      } catch {
        setPhase("idle");
      }
    }, 120);

    return () => clearTimeout(timerRef.current);
  }, [
    list,
    accessToken,
    enabled,
    form,
    listName,
    defaultVatRate,
    onReceiptExtractApplied,
  ]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  const receiptExtractBusy = phase !== "idle";

  return {
    receiptExtractPhase: phase,
    receiptExtractBusy,
    receiptExtractElapsedSec: elapsedSec,
    receiptExtractPendingRowIndexes: pendingRowIndexes,
    cancelReceiptExtract,
  };
}
