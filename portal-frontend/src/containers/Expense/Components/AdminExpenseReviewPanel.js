import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Spin,
  Tag,
  Tooltip,
  Select,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EyeOutlined,
  FormOutlined,
} from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import axios from "axios";

import {
  AdminActions,
  AmountSummary,
  AmountSummaryLabel,
  AmountSummarySub,
  AmountText,
  CategoryPill,
  ExpenseCountChip,
  ExpenseCountChipLabel,
  ExpenseCountChipNumber,
  DescriptionCell,
  DescriptionMeta,
  DescriptionMetaRow,
  DescriptionTitle,
  LoadingState,
  Panel,
  PanelHeader,
  PanelHeading,
  PanelFooterActionRow,
  PanelMetaAction,
  PanelSubtitle,
  PanelTitle,
  ReviewTable,
  ReviewTableHead,
  ReviewTableRow,
  StatusPill,
} from "../Expense.styles";
import {
  approveExpenseRequest,
  deleteExpense,
  rejectExpenseRequest,
  revisionExpenseRequest,
  updateExpense,
} from "../redux/actionCreators";
import { host } from "../../../Api/host";
import {
  formatCurrency,
  getApprovedExpenseAmount,
  getExpenseAmountForSort,
  getRefundExpenseAmount,
  getMealAcceptedLimit,
  getOriginalExpenseAmount,
  parseAmount,
  resolveExpenseRequestId,
  sortExpenses,
} from "../utils/dashboardMetrics";
import { getExpenseCurrencyCode } from "../utils/expenseCurrency";
import {
  buildExpenseRequests,
  getExpenseIdsInRequestBundle,
  getRequestCurrencyCode,
} from "../utils/expenseRequests";
import { formatRequestDisplayCode8 } from "../../../utils/requestDisplayCode";
import {
  STATUS_TONE_MAP,
  getCategoryTone,
} from "../utils/dashboardPresentation";
import {
  formatCurrencyCodeForDisplay,
  formatExpenseDate,
  getExpenseCategoryLabel,
  getUniqueExpenseCategoryEntries,
  getExpenseCopy,
  translateExpenseStatus,
} from "../utils/expenseI18n";
const { TextArea } = Input;

const INITIAL_VISIBLE_RECORDS = 30;
const LOAD_MORE_RECORDS = 10;
const getErrorDetails = (error, fallbackMessage) => {
  const data = error?.response?.data || {};
  const message = data?.message || error?.message || fallbackMessage;
  const errors = Array.isArray(data?.errors)
    ? data.errors.map((item) => (typeof item === "string" ? item : item?.message))
    : [];
  return { message, errors: errors.filter(Boolean) };
};

const buildAdminExpensePayload = (expense, overrides = {}) => ({
  userId: expense.userId,
  id: expense.id,
  projectName: expense.projectName,
  description: expense.description,
  expenseType: expense.expenseType,
  excludingVatAmount: parseAmount(expense.excludingVatAmount),
  vatRate: parseAmount(expense.vatRate),
  vat: parseAmount(expense.vat),
  totalAmount: parseAmount(expense.totalAmount),
  invoiceDate: expense.invoiceDate,
  invoiceNumber: expense.invoiceNumber,
  invoiceTitle: expense.invoiceTitle,
  mealPersonCount: parseInt(expense.mealPersonCount, 10) || 1,
  mealPersonNames: expense.mealPersonNames,
  imageData: expense.imageData,
  status: expense.status,
  rejectReason: expense.rejectReason || expense.rejectionReason || "",
  rejectionReason: expense.rejectionReason || expense.rejectReason || "",
  statusReason: expense.statusReason || expense.rejectionReason || "",
  ...overrides,
});

const AdminExpenseReviewPanel = ({
  expenses,
  loading,
  onViewExpense,
  showMessage,
  sortOption = "dateDesc",
}) => {
  const copy = getExpenseCopy();
  const dispatch = useDispatch();
  const accessToken = useSelector((state) => state?.Auth?.accessToken);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectModalVariant, setRejectModalVariant] = useState("reject");
  const [rejectReason, setRejectReason] = useState("");
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [kkegModalOpen, setKkegModalOpen] = useState(false);
  const [kkegExpense, setKkegExpense] = useState(null);
  const [kkegItemIds, setKkegItemIds] = useState([]);
  const [kkegRequest, setKkegRequest] = useState(null);
  const [kkegActiveExpenseId, setKkegActiveExpenseId] = useState(null);
  const [kkegStateByExpenseId, setKkegStateByExpenseId] = useState({});
  const [kkegItemsLoading, setKkegItemsLoading] = useState(false);
  const [kkegItemsError, setKkegItemsError] = useState(null);
  const [payablePreviewAmount, setPayablePreviewAmount] = useState("");
  const [overrideTouched, setOverrideTouched] = useState(false);
  const [approveModalError, setApproveModalError] = useState(null);
  const [kkegSaving, setKkegSaving] = useState(false);
  const [visibleRecordCount, setVisibleRecordCount] = useState(
    INITIAL_VISIBLE_RECORDS
  );

  const handleDeleteExpense = async (expenseOrRequestRow) => {
    const ids = getExpenseIdsInRequestBundle(expenseOrRequestRow);
    if (!ids.length) {
      showMessage("error", copy.expenseIdMissing || "Expense id not found.");
      return;
    }
    const primary = Array.isArray(expenseOrRequestRow?.expenses)
      ? expenseOrRequestRow.expenses[0]
      : expenseOrRequestRow;
    const requestShort = formatRequestDisplayCode8(expenseOrRequestRow?.requestId);
    try {
      for (const id of ids) {
        await dispatch(deleteExpense(id));
      }
      const n = ids.length;
      showMessage(
        "success",
        n > 1
          ? `Talepteki ${n} masraf silindi${requestShort ? ` (…${requestShort})` : ""}.`
          : `${primary?.invoiceNumber || ids[0]} nolu masraf silindi`
      );
    } catch (error) {
      setApproveModalError(
        getErrorDetails(error, copy.deleteError || "Expense could not be deleted. Please try again.")
      );
      showMessage("error", "Masraf silinemedi.");
    }
  };

  const sortedExpenses = useMemo(
    () => sortExpenses(expenses || [], sortOption),
    [expenses, sortOption]
  );
  const requestRows = useMemo(
    () => buildExpenseRequests(sortedExpenses, sortOption),
    [sortedExpenses, sortOption]
  );
  const visibleRequests = requestRows.slice(0, visibleRecordCount);

  useEffect(() => {
    setVisibleRecordCount(INITIAL_VISIBLE_RECORDS);
  }, [expenses]);

  const ensureExpenseDetailLoaded = async (expenseId) => {
    if (!expenseId) return;
    if (kkegStateByExpenseId?.[expenseId]?.detailLoaded) return;
    try {
      const headers = accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : undefined;
      const response = await axios.get(`${host}/api/expense/getById/${expenseId}`, {
        headers,
      });
      const detailData = response?.data?.data ?? response?.data ?? null;
      setKkegStateByExpenseId((current) => {
        const prev = current?.[expenseId] || {};
        const nextDetail = detailData ? { ...(prev.detail || {}), ...detailData } : prev.detail;
        const nextKkegItemIds =
          detailData && Array.isArray(detailData?.items)
            ? detailData.items.filter((i) => i?.isKkeg).map((i) => i.id)
            : prev.kkegItemIds || [];
        return {
          ...(current || {}),
          [expenseId]: {
            ...prev,
            detail: nextDetail,
            kkegItemIds: Array.isArray(prev.kkegItemIds) ? prev.kkegItemIds : nextKkegItemIds,
            detailLoaded: Boolean(detailData),
          },
        };
      });
      if (detailData) {
        setKkegExpense((current) =>
          current?.id === expenseId ? { ...(current || {}), ...detailData } : current
        );
      }
    } catch (error) {
      setKkegItemsError(getErrorDetails(error, copy.itemsLoadError || "Items could not be loaded. Please try again."));
    }
  };

  const openKkegModal = async (requestRow) => {
    const requestExpenses = Array.isArray(requestRow?.expenses)
      ? requestRow.expenses
      : requestRow
        ? [requestRow]
        : [];
    const first = requestExpenses[0] || null;
    const initialState = {};
    requestExpenses.forEach((exp) => {
      const expenseId = exp?.id;
      if (!expenseId) return;
      initialState[expenseId] = {
        kkegItemIds: (Array.isArray(exp?.items) ? exp.items : [])
          .filter((item) => item?.isKkeg)
          .map((item) => item.id),
        approvedOverride: "",
        overrideTouched: false,
        detail: exp,
        detailLoaded: false,
      };
    });

    setKkegRequest({ requestId: requestRow?.requestId, expenses: requestExpenses });
    setKkegActiveExpenseId(first?.id || null);
    setKkegStateByExpenseId(initialState);
    setKkegExpense(first);
    setKkegItemsLoading(true);
    setKkegItemsError(null);
    setApproveModalError(null);
    setPayablePreviewAmount("");
    setOverrideTouched(false);
    setKkegItemIds(initialState?.[first?.id]?.kkegItemIds || []);
    setKkegModalOpen(true);

    try {
      await ensureExpenseDetailLoaded(first?.id);
    } catch (error) {
      setKkegItemsError(getErrorDetails(error, copy.itemsLoadError || "Items could not be loaded. Please try again."));
    } finally {
      setKkegItemsLoading(false);
    }

    if (!Array.isArray(first?.items) || first.items.length === 0) {
      setKkegExpense((current) => ({
        ...(current || {}),
        items: Array.isArray(current?.items) ? current.items : [],
      }));
    }
  };

  const closeKkegModal = () => {
    setKkegModalOpen(false);
    setKkegExpense(null);
    setKkegItemIds([]);
    setKkegRequest(null);
    setKkegActiveExpenseId(null);
    setKkegStateByExpenseId({});
    setKkegItemsLoading(false);
    setKkegItemsError(null);
    setApproveModalError(null);
    setPayablePreviewAmount("");
    setOverrideTouched(false);
    setKkegSaving(false);
  };

  const persistActiveKkegState = () => {
    const expenseId = kkegActiveExpenseId || kkegExpense?.id;
    if (!expenseId) return;
    setKkegStateByExpenseId((current) => ({
      ...(current || {}),
      [expenseId]: {
        ...(current?.[expenseId] || {}),
        kkegItemIds,
        approvedOverride: payablePreviewAmount,
        overrideTouched,
      },
    }));
  };

  const setActiveKkegExpense = async (expenseId) => {
    if (!expenseId) return;
    persistActiveKkegState();
    setKkegActiveExpenseId(expenseId);
    const nextState = kkegStateByExpenseId?.[expenseId] || {};
    setKkegExpense(nextState.detail || { id: expenseId });
    setKkegItemIds(Array.isArray(nextState.kkegItemIds) ? nextState.kkegItemIds : []);
    setPayablePreviewAmount(nextState.approvedOverride || "");
    setOverrideTouched(Boolean(nextState.overrideTouched));
    setKkegItemsLoading(true);
    setKkegItemsError(null);
    await ensureExpenseDetailLoaded(expenseId);
    setKkegItemsLoading(false);
  };

  const handleSaveKkegAndApprove = async () => {
    const requestId = kkegRequest?.requestId || kkegExpense?.requestId;
    if (!requestId) {
      setApproveModalError({ message: copy.requestIdMissing || "Request id not found.", errors: [] });
      setKkegSaving(false);
      return;
    }

    setKkegSaving(true);
    setApproveModalError(null);
    try {
      const requestExpenses = Array.isArray(kkegRequest?.expenses)
        ? kkegRequest.expenses
        : kkegExpense
          ? [kkegExpense]
          : [];

      const items = requestExpenses
        .map((e) => {
          const expenseId = e?.id ?? e?.Id ?? e?.expenseId ?? e?.ExpenseId;
          if (!expenseId) return null;
          const state = kkegStateByExpenseId?.[expenseId] || {};
          const overrideValue = parseAmount(state.approvedOverride);
          const shouldSendOverride = Boolean(state.overrideTouched);
          return {
            expenseId,
            kkegItemIds: Array.isArray(state.kkegItemIds) ? state.kkegItemIds : [],
            ...(shouldSendOverride
              ? { approvedTotalAmountOverride: overrideValue }
              : {}),
          };
        })
        .filter(Boolean);

      await dispatch(approveExpenseRequest({ requestId, items }));
      showMessage("success", `${copy.approveSuccess}`);
      closeKkegModal();
    } catch (error) {
      setApproveModalError(getErrorDetails(error, copy.approveError));
      setKkegSaving(false);
    }
  };

  const resolveModalRequestId = (requestRowOrExpense) => {
    const isRequest = Array.isArray(requestRowOrExpense?.expenses);
    const primary = isRequest
      ? requestRowOrExpense.expenses?.[0]
      : requestRowOrExpense;
    const fromRow = isRequest ? requestRowOrExpense?.requestId : null;
    const merged =
      fromRow ?? primary?.requestId ?? resolveExpenseRequestId(primary ?? {});
    const s = merged != null ? String(merged).trim() : "";
    return s || null;
  };

  const openRejectModal = (requestRowOrExpense) => {
    const isRequest = Array.isArray(requestRowOrExpense?.expenses);
    const primary = isRequest
      ? requestRowOrExpense.expenses?.[0]
      : requestRowOrExpense;
    setSelectedExpense(primary);
    setSelectedRequestId(resolveModalRequestId(requestRowOrExpense));
    setRejectReason(primary?.rejectionReason || primary?.rejectReason || "");
    setRejectModalVariant("reject");
    setRejectModalOpen(true);
  };

  const openRevisionModal = (requestRowOrExpense) => {
    const isRequest = Array.isArray(requestRowOrExpense?.expenses);
    const primary = isRequest
      ? requestRowOrExpense.expenses?.[0]
      : requestRowOrExpense;
    setSelectedExpense(primary);
    setSelectedRequestId(resolveModalRequestId(requestRowOrExpense));
    setRejectReason(primary?.rejectionReason || primary?.rejectReason || "");
    setRejectModalVariant("revision");
    setRejectModalOpen(true);
  };

  const handleRejectExpense = async () => {
    if (!selectedExpense) {
      return;
    }

    const normalizedReason = rejectReason.trim() || copy.reasonNotProvided;
    const normalizedExpenseType = String(
      selectedExpense?.expenseType || ""
    ).trim();
    try {
      if (selectedRequestId) {
        await dispatch(
          rejectExpenseRequest({
            requestId: selectedRequestId,
            reason: normalizedReason,
            expenseTypeFallback: normalizedExpenseType,
          })
        );
      } else {
        const updatedExpense = buildAdminExpensePayload(selectedExpense, {
          status: "Onaylanmadı",
          rejectReason: normalizedReason,
          rejectionReason: normalizedReason,
          statusReason: normalizedReason,
          expenseType: normalizedExpenseType,
        });
        await dispatch(updateExpense(selectedExpense.id, updatedExpense));
      }
      setRejectModalOpen(false);
      setSelectedExpense(null);
      setSelectedRequestId(null);
      setRejectReason("");
      showMessage(
        "success",
        `${selectedExpense.invoiceNumber} ${copy.rejectSuccess}`
      );
    } catch (error) {
      showMessage("error", copy.rejectError);
    }
  };

  const handleRevisionExpense = async () => {
    if (!selectedExpense) {
      return;
    }

    const normalizedReason = rejectReason.trim() || copy.reasonNotProvided;
    const normalizedExpenseType = String(
      selectedExpense?.expenseType || ""
    ).trim();
    try {
      if (selectedRequestId) {
        await dispatch(
          revisionExpenseRequest({
            requestId: selectedRequestId,
            reason: normalizedReason,
            expenseTypeFallback: normalizedExpenseType,
          })
        );
      } else {
        const updatedExpense = buildAdminExpensePayload(selectedExpense, {
          status: "Revize Bekliyor",
          rejectReason: normalizedReason,
          rejectionReason: normalizedReason,
          statusReason: normalizedReason,
          expenseType: normalizedExpenseType,
        });
        await dispatch(updateExpense(selectedExpense.id, updatedExpense));
      }
      setRejectModalOpen(false);
      setSelectedExpense(null);
      setSelectedRequestId(null);
      setRejectReason("");
      showMessage(
        "success",
        `${selectedExpense.invoiceNumber} ${copy.revisionSuccess}`
      );
    } catch (error) {
      const details = getErrorDetails(error, copy.revisionError);
      showMessage("error", details.message || copy.revisionError);
    }
  };

  // TOPLAM (brüt) backend'den item.totalAmount gelir; hesaplama yapmayın.
  const getItemTotal = (item) => parseAmount(item?.totalAmount);

  const getItemVatAmount = (item) => {
    const gross = getItemTotal(item);
    const kdvRate = parseAmount(item?.kdvRate);
    if (!gross || gross <= 0 || !kdvRate || kdvRate <= 0) return 0;
    const netLine = Math.round((gross / (1 + kdvRate / 100)) * 100) / 100;
    return Math.max(0, gross - netLine);
  };

  const kkegPreviewTotal = useMemo(
    () =>
      (Array.isArray(kkegExpense?.items) ? kkegExpense.items : [])
        .filter((item) => kkegItemIds.includes(item?.id))
        .reduce((sum, item) => sum + getItemTotal(item), 0),
    [kkegExpense, kkegItemIds]
  );
  const modalItemsTotal = useMemo(() => {
    const items = Array.isArray(kkegExpense?.items) ? kkegExpense.items : [];
    if (!items.length) return null;
    const total = items.reduce((sum, item) => sum + getItemTotal(item), 0);
    return Number.isFinite(total) ? total : null;
  }, [kkegExpense]);
  const modalOriginalTotal =
    modalItemsTotal != null ? modalItemsTotal : getOriginalExpenseAmount(kkegExpense);
  const mealAcceptedLimit = getMealAcceptedLimit(kkegExpense);
  const kkegModalCurrencyCode = getExpenseCurrencyCode(kkegExpense);
  const payableAfterKkeg = Math.max(0, modalOriginalTotal - kkegPreviewTotal);
  const modalPayableCap =
    mealAcceptedLimit != null
      ? Math.max(0, Math.min(payableAfterKkeg, mealAcceptedLimit))
      : payableAfterKkeg;
  const modalPayablePreviewCalculated =
    mealAcceptedLimit != null ? modalPayableCap : payableAfterKkeg;
  const modalPayablePreview = overrideTouched
    ? mealAcceptedLimit != null
      ? Math.max(0, Math.min(parseAmount(payablePreviewAmount), modalPayableCap))
      : Math.max(0, parseAmount(payablePreviewAmount))
    : parseAmount(modalPayablePreviewCalculated);

  useEffect(() => {
    if (!overrideTouched) {
      setPayablePreviewAmount(String(modalPayablePreviewCalculated));
    }
  }, [modalPayablePreviewCalculated, kkegExpense?.id, overrideTouched]);

  return (
    <>
      <Panel>
        <PanelHeader>
          <PanelHeading>
            <PanelTitle>{copy.incomingExpenses}</PanelTitle>
            <PanelSubtitle>
              {Math.min(visibleRequests.length, requestRows.length)} /{" "}
              {requestRows.length} {copy.showingRecords}
            </PanelSubtitle>
          </PanelHeading>
        </PanelHeader>

        {loading ? (
          <LoadingState>
            <Spin size="large" />
          </LoadingState>
        ) : requestRows.length ? (
          <>
            <ReviewTable>
              <ReviewTableHead>
                <span>{copy.expense}</span>
                <span>{copy.user}</span>
                <span>{copy.status}</span>
                <span>{copy.amount}</span>
                <span>{copy.operation}</span>
              </ReviewTableHead>

              {visibleRequests.map((requestRow) => {
                const requestExpenses = Array.isArray(requestRow?.expenses)
                  ? requestRow.expenses
                  : [];
                const primary = requestExpenses[0] || {};
                const statusTone =
                  STATUS_TONE_MAP[requestRow.status] || STATUS_TONE_MAP.Beklemede;
                const currencyCode = getRequestCurrencyCode(requestExpenses);
                const approvedSum = requestExpenses.reduce(
                  (sum, e) => sum + parseAmount(getRefundExpenseAmount(e)),
                  0
                );
                const originalSum = requestExpenses.reduce(
                  (sum, e) => sum + parseAmount(e?.totalAmount ?? e?.originalTotalAmount),
                  0
                );
                const categoryEntries =
                  getUniqueExpenseCategoryEntries(requestExpenses);
                const firstCategoryEntry = categoryEntries[0];
                const pillCategoryLabel =
                  firstCategoryEntry?.label ||
                  getExpenseCategoryLabel(
                    primary.invoiceTitle,
                    primary.extraCategorie
                  );
                const categoryTone = getCategoryTone(
                  firstCategoryEntry?.invoiceTitle ||
                    primary.invoiceTitle ||
                    copy.general
                );
                const extraCategoryEntries = categoryEntries.slice(1, 3);
                const hasMoreCategoryLabels = categoryEntries.length > 3;

                return (
                  <ReviewTableRow key={requestRow.requestId}>
                    <DescriptionCell>
                      <DescriptionTitle>
                        Talep {requestRow.requestId?.slice?.(-6) ?? ""}
                        {primary.projectName ? (
                          <>
                            {" "}
                            · {copy.company}: {primary.projectName}
                          </>
                        ) : null}
                      </DescriptionTitle>
                      <DescriptionMetaRow>
                        <CategoryPill
                          $background={categoryTone.background}
                          $color={categoryTone.color}
                        >
                          {pillCategoryLabel}
                        </CategoryPill>
                        {extraCategoryEntries.map((entry, idx) => {
                          const tone = getCategoryTone(
                            entry.invoiceTitle || copy.general
                          );
                          return (
                            <CategoryPill
                              key={`${entry.label}-${idx}`}
                              $background={tone.background}
                              $color={tone.color}
                            >
                              {entry.label}
                            </CategoryPill>
                          );
                        })}
                        {hasMoreCategoryLabels ? (
                          <span
                            style={{
                              marginLeft: 4,
                              fontSize: 13,
                              fontWeight: 700,
                              color: "#64748b",
                            }}
                          >
                            ...
                          </span>
                        ) : null}
                        <ExpenseCountChip style={{ marginLeft: 8 }}>
                          <ExpenseCountChipNumber>
                            {requestRow.expenseCount}
                          </ExpenseCountChipNumber>
                          <ExpenseCountChipLabel>
                            {copy.expenseCountUnit}
                          </ExpenseCountChipLabel>
                        </ExpenseCountChip>
                        {requestRow.hasKkeg === true ? (
                          <Tag color="volcano">K.K.E.G Var</Tag>
                        ) : null}
                      </DescriptionMetaRow>
                      {requestRow.status === "Onaylanmadı" ? (
                        <DescriptionMeta>
                          {copy.redReasonLabel}:{" "}
                          {primary.rejectionReason || copy.reasonNotProvided}
                        </DescriptionMeta>
                      ) : null}
                      {requestRow.status === "Revize Bekliyor" ? (
                        <DescriptionMeta>
                          {copy.rejectionReason}:{" "}
                          {primary.rejectionReason || copy.reasonNotProvided}
                        </DescriptionMeta>
                      ) : null}
                    </DescriptionCell>

                    <DescriptionCell>
                      <DescriptionTitle>
                        {primary.ownerName || copy.unknownUser}
                      </DescriptionTitle>
                      <DescriptionMeta>
                        {requestRow.latestInvoiceDate
                          ? formatExpenseDate(requestRow.latestInvoiceDate)
                          : copy.noDate}
                      </DescriptionMeta>
                    </DescriptionCell>

                    <StatusPill
                      $background={statusTone.background}
                      $color={statusTone.color}
                    >
                      {translateExpenseStatus(requestRow.status || "Beklemede")}
                    </StatusPill>

                    <AmountSummary>
                      <AmountSummaryLabel>{copy.approvedAmountLabel}</AmountSummaryLabel>
                      <AmountText
                        title={
                          currencyCode === "MIX"
                            ? copy.mixedCurrencyTotalHint
                            : formatCurrency(approvedSum, currencyCode)
                        }
                      >
                        {formatCurrency(approvedSum, currencyCode)}
                      </AmountText>
                      <AmountSummarySub>
                        {copy.overallPrice}:{" "}
                        {formatCurrency(originalSum, currencyCode)}
                      </AmountSummarySub>
                      <Tag style={{ marginTop: 6, fontSize: 11 }}>
                        {formatCurrencyCodeForDisplay(currencyCode)}
                      </Tag>
                    </AmountSummary>

                    <AdminActions>
                      {requestRow?.status === "Beklemede" ||
                      requestRow?.status === "Revize Edildi" ? (
                        <div className="admin-actions__group admin-actions__group--decision">
                          <Tooltip title={copy.approve}>
                            <Button
                              type="text"
                              icon={<CheckOutlined />}
                              className="admin-action-btn admin-action-btn--approve"
                              onClick={() => openKkegModal(requestRow)}
                              title={copy.approve}
                            />
                          </Tooltip>
                          <Tooltip title={copy.revisionTooltip}>
                            <Button
                              type="text"
                              icon={<FormOutlined />}
                              className="admin-action-btn admin-action-btn--revision"
                              onClick={() => openRevisionModal(requestRow)}
                              title={copy.revisionTooltip}
                            />
                          </Tooltip>
                          <Tooltip title={copy.reject}>
                            <Button
                              type="text"
                              icon={<CloseOutlined />}
                              className="admin-action-btn admin-action-btn--reject"
                              onClick={() => openRejectModal(requestRow)}
                              title={copy.reject}
                            />
                          </Tooltip>
                        </div>
                      ) : null}

                      <div className="admin-actions__group admin-actions__group--meta">
                        <Tooltip title={copy.detail}>
                          <Button
                            type="text"
                            icon={<EyeOutlined />}
                            className="admin-action-btn admin-action-btn--view"
                            onClick={() => onViewExpense(requestRow)}
                            title={copy.detail}
                          />
                        </Tooltip>

                        <Popconfirm
                          title={copy.confirmDelete}
                          okText={copy.yes}
                          cancelText={copy.cancel}
                          okButtonProps={{ danger: true }}
                          onConfirm={() => handleDeleteExpense(requestRow)}
                        >
                          <Tooltip title={copy.delete}>
                            <Button
                              danger
                              type="text"
                              icon={<DeleteOutlined />}
                              className="admin-action-btn admin-action-btn--delete"
                              title={copy.delete}
                            />
                          </Tooltip>
                        </Popconfirm>
                      </div>
                    </AdminActions>
                  </ReviewTableRow>
                );
              })}
            </ReviewTable>
            {visibleRecordCount < requestRows.length ? (
              <PanelFooterActionRow>
                <PanelMetaAction
                  type="button"
                  onClick={() =>
                    setVisibleRecordCount(
                      (currentValue) => currentValue + LOAD_MORE_RECORDS
                    )
                  }
                >
                  {copy.showMore}
                </PanelMetaAction>
              </PanelFooterActionRow>
            ) : null}
          </>
        ) : (
          <LoadingState>
            <Empty description={copy.noExpensesToReview} />
          </LoadingState>
        )}
      </Panel>

      <Modal
        title={
          rejectModalVariant === "revision"
            ? copy.revisionExpenseTitle
            : copy.rejectExpense
        }
        open={rejectModalOpen}
        onOk={
          rejectModalVariant === "revision"
            ? handleRevisionExpense
            : handleRejectExpense
        }
        onCancel={() => {
          setRejectModalOpen(false);
          setSelectedExpense(null);
          setRejectReason("");
        }}
        okText={
          rejectModalVariant === "revision" ? copy.revisionSubmit : copy.reject
        }
        cancelText={copy.cancel}
        okButtonProps={
          rejectModalVariant === "revision"
            ? { type: "primary" }
            : { danger: true }
        }
      >
        <TextArea
          rows={4}
          value={rejectReason}
          onChange={(event) => setRejectReason(event.target.value)}
          placeholder={
            rejectModalVariant === "revision"
              ? copy.revisionReasonPlaceholder
              : copy.rejectReasonPlaceholder
          }
        />
      </Modal>

      <Modal
        title={copy.kkegApprovalAmountTitle}
        open={kkegModalOpen}
        onCancel={closeKkegModal}
        onOk={handleSaveKkegAndApprove}
        okText={copy.saveAndApprove}
        cancelText={copy.cancel}
        okButtonProps={{ loading: kkegSaving }}
        destroyOnClose
        width={1080}
        style={{ maxWidth: "calc(100vw - 24px)" }}
        bodyStyle={{ paddingTop: 12 }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.isArray(kkegRequest?.expenses) && kkegRequest.expenses.length > 1 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                {copy.requestExpenseLabel}
              </div>
              <Select
                value={kkegActiveExpenseId || undefined}
                onChange={(value) => setActiveKkegExpense(value)}
                options={kkegRequest.expenses
                  .filter((e) => e?.id)
                  .map((e) => ({
                    value: e.id,
                    label: `${e.invoiceNumber || e.id} • ${
                      e.invoiceTitle || copy.general
                    }`,
                  }))}
                style={{ width: "100%" }}
              />
            </div>
          ) : null}
          <div style={{ fontWeight: 600 }}>{copy.invoiceItems}</div>
          {kkegItemsError ? (
            <Alert
              type="warning"
              message={kkegItemsError?.message}
              description={
                kkegItemsError?.errors?.length ? (
                  <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                    {kkegItemsError.errors.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                ) : null
              }
            />
          ) : null}
          {approveModalError ? (
            <Alert
              type="error"
              message={approveModalError?.message}
              description={
                approveModalError?.errors?.length ? (
                  <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                    {approveModalError.errors.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                ) : null
              }
            />
          ) : null}
          {kkegItemsLoading ? (
            <div style={{ opacity: "70%", fontSize: 13 }}>{copy.itemsLoading}</div>
          ) : (Array.isArray(kkegExpense?.items) ? kkegExpense.items : []).length ? (
            <div
              style={{
                width: "100%",
                overflowX: "auto",
                borderRadius: 14,
                border: "1px solid rgba(226,232,240,.9)",
                background: "#ffffff",
                boxShadow: "0 16px 34px rgba(2, 6, 23, 0.08)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  minWidth: 720,
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  tableLayout: "fixed",
                }}
              >
              <thead>
                <tr style={{ background: "linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      color: "#475569",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                    }}
                  >
                    {copy.lineItem}
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "10px 12px",
                      color: "#475569",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      width: 72,
                    }}
                  >
                    {copy.quantity}
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "10px 12px",
                      color: "#475569",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      width: 120,
                    }}
                  >
                    {copy.unit}
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "10px 12px",
                      color: "#475569",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      width: 86,
                    }}
                  >
                    {copy.vatUpper}
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "10px 12px",
                      color: "#475569",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      width: 130,
                    }}
                  >
                    {copy.vatAmount}
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "10px 12px",
                      color: "#475569",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      width: 130,
                    }}
                  >
                    {copy.totalUpper}
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "10px 12px",
                      color: "#475569",
                      fontSize: 12,
                      fontWeight: 800,
                      letterSpacing: ".06em",
                      textTransform: "uppercase",
                      width: 90,
                    }}
                  >
                    {copy.kkegUpper}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(kkegExpense?.items) ? kkegExpense.items : []).map(
                  (item, index) => {
                    const itemId = item?.id;
                    const checked = kkegItemIds.includes(itemId);
                    return (
                      <tr
                        key={itemId ?? `item-${index}`}
                        style={{
                          borderTop: "1px solid rgba(226,232,240,.7)",
                          background: index % 2 ? "rgba(248,250,252,.7)" : "#ffffff",
                        }}
                      >
                        <td
                          style={{
                            padding: "10px 12px",
                            fontWeight: 700,
                            color: "#0f172a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                          title={item?.itemName || `${copy.lineItem} ${index + 1}`}
                        >
                          {item?.itemName || `${copy.lineItem} ${index + 1}`}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "#0f172a" }}>
                          {item?.quantity ?? 0}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "#0f172a" }}>
                          {formatCurrency(item?.unitPrice, kkegModalCurrencyCode)}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "#0f172a" }}>
                          %{item?.kdvRate ?? 0}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right", color: "#0f172a" }}>
                          {formatCurrency(getItemVatAmount(item), kkegModalCurrencyCode)}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#0f172a" }}>
                          {formatCurrency(getItemTotal(item), kkegModalCurrencyCode)}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          <Checkbox
                            checked={checked}
                            onChange={(e) => {
                              if (!itemId) return;
                              setKkegItemIds((current) => {
                                const next = e.target.checked
                                  ? [...new Set([...current, itemId])]
                                  : current.filter((id) => id !== itemId);
                                const expenseId =
                                  kkegActiveExpenseId || kkegExpense?.id;
                                if (expenseId) {
                                  setKkegStateByExpenseId((prev) => ({
                                    ...(prev || {}),
                                    [expenseId]: {
                                      ...(prev?.[expenseId] || {}),
                                      kkegItemIds: next,
                                    },
                                  }));
                                }
                                return next;
                              });
                            }}
                          />
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
              </table>
            </div>
          ) : (
            <div style={{ opacity: "70%", fontSize: 13 }}>{copy.itemNotFound}</div>
          )}

          <div
            style={{
              marginTop: 10,
              padding: 14,
              borderRadius: 14,
              background: "linear-gradient(180deg, rgba(248,250,252,.92), rgba(241,245,249,.75))",
              border: "1px solid rgba(226,232,240,.9)",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,.9)",
                  border: "1px solid rgba(226,232,240,.9)",
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>
                  {copy.invoiceOriginalTotal}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
                  {formatCurrency(modalOriginalTotal, kkegModalCurrencyCode)}
                </div>
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(255,255,255,.9)",
                  border: "1px solid rgba(226,232,240,.9)",
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 600 }}>
                  {copy.kkegTotal}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
                  {formatCurrency(kkegPreviewTotal, kkegModalCurrencyCode)}
                </div>
              </div>
            </div>

            {mealAcceptedLimit != null ? (
              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: "rgba(47,137,217,0.06)",
                  border: "1px solid rgba(47,137,217,0.18)",
                  marginBottom: 10,
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.8, fontWeight: 700 }}>
                  {copy.mealDailyLimitByPerson}
                </div>
                <div style={{ marginTop: 2, fontWeight: 800 }}>
                  {formatCurrency(mealAcceptedLimit, kkegModalCurrencyCode)}
                </div>
              </div>
            ) : null}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 12,
                background: "rgba(31,118,199,0.10)",
                border: "1px solid rgba(31,118,199,0.22)",
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 11, opacity: 0.85, fontWeight: 700 }}>
                  {copy.payablePreview}
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 2 }}>
                  {formatCurrency(modalPayablePreview, kkegModalCurrencyCode)}
                </div>
              </div>
              <div style={{ fontSize: 11, opacity: 0.75, fontWeight: 700 }}>
                {kkegModalCurrencyCode}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, opacity: 0.7, fontWeight: 700, marginBottom: 6 }}>
                {copy.payableEditable}
                {mealAcceptedLimit != null ? (
                  <span style={{ marginLeft: 8, opacity: 0.8, fontWeight: 600 }}>
                    {copy.maxLabel}: {formatCurrency(modalPayableCap, kkegModalCurrencyCode)}
                  </span>
                ) : null}
              </div>
              <Input
                value={String(payablePreviewAmount)}
                onChange={(event) => {
                  setOverrideTouched(true);
                  const nextRaw = event.target.value;
                  const activeExpenseId = kkegActiveExpenseId || kkegExpense?.id;
                  if (mealAcceptedLimit != null) {
                    const nextParsed = parseAmount(nextRaw);
                    if (nextParsed > modalPayableCap) {
                      setPayablePreviewAmount(String(modalPayableCap));
                      if (activeExpenseId) {
                        setKkegStateByExpenseId((prev) => ({
                          ...(prev || {}),
                          [activeExpenseId]: {
                            ...(prev?.[activeExpenseId] || {}),
                            approvedOverride: String(modalPayableCap),
                            overrideTouched: true,
                          },
                        }));
                      }
                      showMessage(
                        "warning",
                        `${copy.payableCapWarningPrefix} ${formatCurrency(
                          modalPayableCap,
                          kkegModalCurrencyCode
                        )} ${copy.payableCapWarningSuffix}`
                      );
                      return;
                    }
                  }
                  setPayablePreviewAmount(nextRaw);
                  if (activeExpenseId) {
                    setKkegStateByExpenseId((prev) => ({
                      ...(prev || {}),
                      [activeExpenseId]: {
                        ...(prev?.[activeExpenseId] || {}),
                        approvedOverride: nextRaw,
                        overrideTouched: true,
                      },
                    }));
                  }
                }}
                addonAfter={kkegModalCurrencyCode}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AdminExpenseReviewPanel;
