import AppLocale from "@iso/config/translation";

import { store } from "../../../redux/store";
import {
  EXPENSE_PAYMENT_TYPE_VALUES,
  EXPENSE_STATUS_VALUES,
  getExpenseCategoryDefinitions,
} from "../constants/expenseOptions";

const EXPENSE_COPY_IDS = {
  workerTitle: "expense.workerTitle",
  workerSubtitle: "expense.workerSubtitle",
  workerSearchPlaceholder: "expense.workerSearchPlaceholder",
  adminTitle: "expense.adminTitle",
  adminSubtitle: "expense.adminSubtitle",
  adminSearchPlaceholder: "expense.adminSearchPlaceholder",
  backToAdmin: "expense.backToAdmin",
  viewAsWorker: "expense.viewAsWorker",
  management: "expense.management",
  managementTitle: "expense.managementTitle",
  managementRulesTitle: "expense.managementRulesTitle",
  managementRulesSubtitle: "expense.managementRulesSubtitle",
  managementMealAcceptedDailyAmount:
    "expense.managementMealAcceptedDailyAmount",
  managementMealAmountPlaceholder: "expense.managementMealAmountPlaceholder",
  previousPeriodCutoffDay: "expense.previousPeriodCutoffDay",
  previousPeriodCutoffDayPlaceholder:
    "expense.previousPeriodCutoffDayPlaceholder",
  previousPeriodCutoffDayRequired: "expense.previousPeriodCutoffDayRequired",
  managementVatRatesTitle: "expense.managementVatRatesTitle",
  managementVatRatesSubtitle: "expense.managementVatRatesSubtitle",
  managementVatRatePlaceholder: "expense.managementVatRatePlaceholder",
  vatRateValueRequired: "expense.vatRateValueRequired",
  vatRateExistsError: "expense.vatRateExistsError",
  vatRateMinOneError: "expense.vatRateMinOneError",
  addVatRate: "expense.addVatRate",
  managementCategoriesTitle: "expense.managementCategoriesTitle",
  managementCategoriesSubtitle: "expense.managementCategoriesSubtitle",
  saveManagementSettings: "expense.saveManagementSettings",
  managementSettingsSaved: "expense.managementSettingsSaved",
  mealAcceptedDailyAmountRequired: "expense.mealAcceptedDailyAmountRequired",
  manageCategories: "expense.manageCategories",
  categoryManagerTitle: "expense.categoryManagerTitle",
  categoryManagerSubtitle: "expense.categoryManagerSubtitle",
  addCategoryPlaceholder: "expense.addCategoryPlaceholder",
  addCategoryAction: "expense.addCategoryAction",
  totalCategories: "expense.totalCategories",
  visibleCategories: "expense.visibleCategories",
  hiddenCategories: "expense.hiddenCategories",
  topCategorySummary: "expense.topCategorySummary",
  noCategoryData: "expense.noCategoryData",
  categoryBreakdownTitle: "expense.categoryBreakdownTitle",
  categoryBreakdownNoData: "expense.categoryBreakdownNoData",
  categoryBreakdownTopShare: "expense.categoryBreakdownTopShare",
  categoryBreakdownTotalLabel: "expense.categoryBreakdownTotalLabel",
  categoryBreakdownAll: "expense.categoryBreakdownAll",
  categoryBreakdownApproved: "expense.categoryBreakdownApproved",
  categoryBreakdownRejected: "expense.categoryBreakdownRejected",
  categoryBreakdownPending: "expense.categoryBreakdownPending",
  categoryColumn: "expense.categoryColumn",
  usageColumn: "expense.usageColumn",
  shareColumn: "expense.shareColumn",
  visibilityColumn: "expense.visibilityColumn",
  typeColumn: "expense.typeColumn",
  actionsColumn: "expense.actionsColumn",
  visible: "expense.visible",
  hidden: "expense.hidden",
  systemCategory: "expense.systemCategory",
  customCategory: "expense.customCategory",
  deleteCategory: "expense.deleteCategory",
  deleteCategoryConfirm: "expense.deleteCategoryConfirm",
  categoryAdded: "expense.categoryAdded",
  categoryDeleted: "expense.categoryDeleted",
  categoryUpdated: "expense.categoryUpdated",
  categoryVisibilityUpdated: "expense.categoryVisibilityUpdated",
  categoryExistsError: "expense.categoryExistsError",
  categoryRequiredError: "expense.categoryRequiredError",
  editCategory: "expense.editCategory",
  emptyCategoryManager: "expense.emptyCategoryManager",
  advancedFilters: "expense.advancedFilters",
  filter: "expense.filter",
  reports: "expense.reports",
  addExpense: "expense.addExpense",
  recentExpenses: "expense.recentExpenses",
  showingRecords: "expense.showingRecords",
  showMore: "expense.showMore",
  date: "expense.date",
  description: "expense.description",
  category: "expense.category",
  amount: "expense.amount",
  status: "expense.status",
  action: "expense.action",
  pinToTop: "expense.pinToTop",
  unpin: "expense.unpin",
  pinned: "expense.pinned",
  edit: "expense.edit",
  delete: "expense.delete",
  detail: "expense.detail",
  confirmDelete: "expense.confirmDelete",
  yes: "expense.yes",
  cancel: "expense.cancel",
  noExpenseRecords: "expense.noExpenseRecords",
  incomingExpenses: "expense.incomingExpenses",
  reviewSubtitle: "expense.reviewSubtitle",
  expense: "expense.expense",
  expenseCountUnit: "expense.expenseCountUnit",
  user: "expense.user",
  operation: "expense.operation",
  approve: "expense.approve",
  reject: "expense.reject",
  rejectExpense: "expense.rejectExpense",
  revisionExpenseTitle: "expense.revisionExpenseTitle",
  revisionTooltip: "expense.revisionTooltip",
  revisionSuccess: "expense.revisionSuccess",
  revisionError: "expense.revisionError",
  revisionSubmit: "expense.revisionSubmit",
  rejectReasonPlaceholder: "expense.rejectReasonPlaceholder",
  revisionReasonPlaceholder: "expense.revisionReasonPlaceholder",
  noExpensesToReview: "expense.noExpensesToReview",
  rejectionReason: "expense.rejectionReason",
  redReasonLabel: "expense.redReasonLabel",
  reasonNotProvided: "expense.reasonNotProvided",
  rejectedExpensesTitle: "expense.rejectedExpensesTitle",
  rejectedExpensesEmpty: "expense.rejectedExpensesEmpty",
  rejectedExpensesCountSuffix: "expense.rejectedExpensesCountSuffix",
  tapToInspectRejected: "expense.tapToInspectRejected",
  rejectedDetails: "expense.rejectedDetails",
  resubmitExpense: "expense.resubmitExpense",
  resubmitSuccess: "expense.resubmitSuccess",
  resubmitError: "expense.resubmitError",
  unknownUser: "expense.unknownUser",
  noDescription: "expense.noDescription",
  general: "expense.general",
  noDate: "expense.noDate",
  userSelectLabel: "expense.userSelectLabel",
  userSelectPlaceholder: "expense.userSelectPlaceholder",
  userSelectRequired: "expense.userSelectRequired",
  addModalTitle: "expense.addModalTitle",
  batchTitle: "expense.batchTitle",
  batchSubtitle: "expense.batchSubtitle",
  recordReadySuffix: "expense.recordReadySuffix",
  expenseCardTitle: "expense.expenseCardTitle",
  expenseCardSubtitle: "expense.expenseCardSubtitle",
  remove: "expense.remove",
  invoiceNumber: "expense.invoiceNumber",
  invoiceNumberPlaceholder: "expense.invoiceNumberPlaceholder",
  invoiceNumberRequired: "expense.invoiceNumberRequired",
  invoiceDate: "expense.invoiceDate",
  invoiceDateRequired: "expense.invoiceDateRequired",
  invoicePeriod: "expense.invoicePeriod",
  invoicePeriodPlaceholder: "expense.invoicePeriodPlaceholder",
  company: "expense.company",
  companyPlaceholder: "expense.companyPlaceholder",
  companyRequired: "expense.companyRequired",
  otherCategoryRequired: "expense.otherCategoryRequired",
  categoryPlaceholder: "expense.categoryPlaceholder",
  categoryRequired: "expense.categoryRequired",
  otherCategoryPlaceholder: "expense.otherCategoryPlaceholder",
  paymentType: "expense.paymentType",
  paymentTypePlaceholder: "expense.paymentTypePlaceholder",
  expenseLineItemName: "expense.expenseLineItemName",
  amountSectionTitle: "expense.amountSectionTitle",
  amountInputHint: "expense.amountInputHint",
  amountEitherRequired: "expense.amountEitherRequired",
  excludingVat: "expense.excludingVat",
  excludingVatPlaceholder: "expense.excludingVatPlaceholder",
  excludingVatRequired: "expense.excludingVatRequired",
  vatRate: "expense.vatRate",
  vatRatePlaceholder: "expense.vatRatePlaceholder",
  vatRateRequired: "expense.vatRateRequired",
  vatAmount: "expense.vatAmount",
  vatAmountPlaceholder: "expense.vatAmountPlaceholder",
  acceptedDailyAmount: "expense.acceptedDailyAmount",
  acceptedDailyAmountPlaceholder: "expense.acceptedDailyAmountPlaceholder",
  uncoveredAmount: "expense.uncoveredAmount",
  uncoveredAmountPlaceholder: "expense.uncoveredAmountPlaceholder",
  total: "expense.total",
  totalPlaceholder: "expense.totalPlaceholder",
  personCount: "expense.personCount",
  personCountPlaceholder: "expense.personCountPlaceholder",
  personCountRequired: "expense.personCountRequired",
  descriptionPlaceholder: "expense.descriptionPlaceholder",
  descriptionRequired: "expense.descriptionRequired",
  invoiceImage: "expense.invoiceImage",
  invoiceImageRequired: "expense.invoiceImageRequired",
  uploadHintPrimary: "expense.uploadHintPrimary",
  uploadHintSecondary: "expense.uploadHintSecondary",
  receiptExtractUnavailable: "expense.receiptExtractUnavailable",
  receiptExtractTimeout: "expense.receiptExtractTimeout",
  receiptExtractPhasePreparing: "expense.receiptExtractPhasePreparing",
  receiptExtractPhaseScanning: "expense.receiptExtractPhaseScanning",
  receiptExtractFieldsLoading: "expense.receiptExtractFieldsLoading",
  receiptExtractExpectationHint: "expense.receiptExtractExpectationHint",
  receiptExtractCompleted: "expense.receiptExtractCompleted",
  receiptExtractCancel: "expense.receiptExtractCancel",
  receiptExtractErrMaxTokens: "expense.receiptExtractErrMaxTokens",
  receiptExtractErrParse: "expense.receiptExtractErrParse",
  receiptExtractErrUpstream: "expense.receiptExtractErrUpstream",
  receiptExtractErrQuota: "expense.receiptExtractErrQuota",
  receiptExtractErrNotConfigured: "expense.receiptExtractErrNotConfigured",
  receiptExtractErrEmptyModel: "expense.receiptExtractErrEmptyModel",
  receiptExtractErrEmptyImage: "expense.receiptExtractErrEmptyImage",
  receiptExtractErrMissingImage: "expense.receiptExtractErrMissingImage",
  addAnotherExpense: "expense.addAnotherExpense",
  createAllExpenses: "expense.createAllExpenses",
  update: "expense.update",
  pastInvoiceError: "expense.pastInvoiceError",
  futureInvoiceError: "expense.futureInvoiceError",
  addSuccessSingle: "expense.addSuccessSingle",
  addSuccessMultiple: "expense.addSuccessMultiple",
  addError: "expense.addError",
  updateSuccess: "expense.updateSuccess",
  updateError: "expense.updateError",
  approveSuccess: "expense.approveSuccess",
  approveError: "expense.approveError",
  rejectSuccess: "expense.rejectSuccess",
  rejectError: "expense.rejectError",
  clear: "expense.clear",
  sortBy: "expense.sortBy",
  sortPlaceholder: "expense.sortPlaceholder",
  sortOption_dateDesc: "expense.sortOption.dateDesc",
  sortOption_dateAsc: "expense.sortOption.dateAsc",
  sortOption_createdDesc: "expense.sortOption.createdDesc",
  sortOption_createdAsc: "expense.sortOption.createdAsc",
  sortOption_amountDesc: "expense.sortOption.amountDesc",
  sortOption_amountAsc: "expense.sortOption.amountAsc",
  sortInvoiceDateLabel: "expense.sortInvoiceDateLabel",
  sortInvoiceDateNewest: "expense.sortInvoiceDateNewest",
  sortInvoiceDateOldest: "expense.sortInvoiceDateOldest",
  period: "expense.period",
  selectPeriod: "expense.selectPeriod",
  selectUser: "expense.selectUser",
  selectStatus: "expense.selectStatus",
  minAmount: "expense.minAmount",
  maxAmount: "expense.maxAmount",
  minAmountPlaceholder: "expense.minAmountPlaceholder",
  maxAmountPlaceholder: "expense.maxAmountPlaceholder",
  dateRange: "expense.dateRange",
  totalExpense: "expense.totalExpense",
  totalExpenseSubtitle: "expense.totalExpenseSubtitle",
  comparedToLastMonth: "expense.comparedToLastMonth",
  pendingApprovals: "expense.pendingApprovals",
  pendingApprovalsSubtitle: "expense.pendingApprovalsSubtitle",
  withinOpenRecords: "expense.withinOpenRecords",
  approvedExpenses: "expense.approvedExpenses",
  approvedExpensesSubtitle: "expense.approvedExpensesSubtitle",
  recordCount: "expense.recordCount",
  summaryRecords: "expense.summaryRecords",
  summaryAverage: "expense.summaryAverage",
  summaryHighlight: "expense.summaryHighlight",
  summaryRejected: "expense.summaryRejected",
  summaryItemCount: "expense.summaryItemCount",
  noCategory: "expense.noCategory",
  activeFilter: "expense.activeFilter",
  filterCategory: "expense.filterCategory",
  filterStatus: "expense.filterStatus",
  filterUser: "expense.filterUser",
  filterPeriod: "expense.filterPeriod",
  filterSort: "expense.filterSort",
  filterMinAmount: "expense.filterMinAmount",
  filterMaxAmount: "expense.filterMaxAmount",
  filterSearch: "expense.filterSearch",
  noDownloadableExpenses: "expense.noDownloadableExpenses",
  exportError: "expense.exportError",
  csvDownload: "expense.csvDownload",
  excelDownload: "expense.excelDownload",
  pdfDownload: "expense.pdfDownload",
  csvDownloaded: "expense.csvDownloaded",
  excelDownloaded: "expense.excelDownloaded",
  pdfDownloaded: "expense.pdfDownloaded",
  generalReportTitle: "expense.generalReportTitle",
  generalReportScopePrefix: "expense.generalReportScopePrefix",
  generalReportGeneratedAt: "expense.generalReportGeneratedAt",
  generalReportTableTitle: "expense.generalReportTableTitle",
  reportScopeAllUsers: "expense.reportScopeAllUsers",
  reportScopeWorkerView: "expense.reportScopeWorkerView",
  reportScopeOwnRecords: "expense.reportScopeOwnRecords",
  printOpened: "expense.printOpened",
  originalInvoice: "expense.originalInvoice",
  downloadPdf: "expense.downloadPdf",
  owner: "expense.owner",
  createdBy: "expense.createdBy",
  generatedOn: "expense.generatedOn",
  invoiceSummary: "expense.invoiceSummary",
  invoiceInfoNote: "expense.invoiceInfoNote",
  currency: "expense.currency",
  totalInCurrency: "expense.totalInCurrency",
  vatInCurrency: "expense.vatInCurrency",
  metricsCurrencyScope: "expense.metricsCurrencyScope",
  chartCurrencyFilterPlaceholder: "expense.chartCurrencyFilterPlaceholder",
  mixedCurrencyHint: "expense.mixedCurrencyHint",
  currencyCodeColumn: "expense.currencyCodeColumn",
  currencyRequired: "expense.currencyRequired",
  requestLabel: "expense.requestLabel",
  draftTotalAmount: "expense.draftTotalAmount",
  approvedAmountLabel: "expense.approvedAmountLabel",
  overallPrice: "expense.overallPrice",
  mixedCurrencyTotalHint: "expense.mixedCurrencyTotalHint",
  kkegExists: "expense.kkegExists",
  kkegApprovalAmountTitle: "expense.kkegApprovalAmountTitle",
  saveAndApprove: "expense.saveAndApprove",
  requestExpenseLabel: "expense.requestExpenseLabel",
  invoiceItems: "expense.invoiceItems",
  itemsLoading: "expense.itemsLoading",
  itemNotFound: "expense.itemNotFound",
  lineItem: "expense.lineItem",
  quantity: "expense.quantity",
  unit: "expense.unit",
  vatUpper: "expense.vatUpper",
  totalUpper: "expense.totalUpper",
  kkegUpper: "expense.kkegUpper",
  invoiceOriginalTotal: "expense.invoiceOriginalTotal",
  kkegTotal: "expense.kkegTotal",
  expenseSummaryLabel: "expense.expenseSummaryLabel",
  expenseBasedInfo: "expense.expenseBasedInfo",
  personUnit: "expense.personUnit",
  invoiceLabel: "expense.invoiceLabel",
  companyLabel: "expense.companyLabel",
  currencyShortLabel: "expense.currencyShortLabel",
  expenseItemFallback: "expense.expenseItemFallback",
  imageNotFound: "expense.imageNotFound",
  participantNames: "expense.participantNames",
  invoiceDateUpper: "expense.invoiceDateUpper",
  expenseTypeUpper: "expense.expenseTypeUpper",
  receiptImage: "expense.receiptImage",
  verifiedImage: "expense.verifiedImage",
  verificationCode: "expense.verificationCode",
  editedAt: "expense.editedAt",
  approver: "expense.approver",
  accounting: "expense.accounting",
  page: "expense.page",
  requestSummaryUpper: "expense.requestSummaryUpper",
  requestNumberUpper: "expense.requestNumberUpper",
  mealDailyLimitByPerson: "expense.mealDailyLimitByPerson",
  payablePreview: "expense.payablePreview",
  payableEditable: "expense.payableEditable",
  maxLabel: "expense.maxLabel",
  payableCapWarningPrefix: "expense.payableCapWarningPrefix",
  payableCapWarningSuffix: "expense.payableCapWarningSuffix",
  receiptVerificationText: "expense.receiptVerificationText",
};

const CATEGORY_MESSAGE_IDS = {
  Ulaşım: "expense.category.transportation",
  Yemek: "expense.category.meal",
  Teknoloji: "expense.category.technology",
  Telekom: "expense.category.telecom",
  Diğer: "expense.category.other",
};

const PAYMENT_TYPE_MESSAGE_IDS = {
  "Kredi Kartı": "expense.paymentType.creditCard",
  Nakit: "expense.paymentType.cash",
  Havale: "expense.paymentType.transfer",
};

const STATUS_MESSAGE_IDS = {
  Onaylandı: "expense.status.approved",
  Beklemede: "expense.status.pending",
  Taslak: "expense.status.draft",
  "Tamamlanmamış": "expense.status.incomplete",
  "Revize Bekliyor": "expense.status.revisionPending",
  "Revize Edildi": "expense.status.revised",
  Onaylanmadı: "expense.status.rejected",
};

const getLocaleKey = () => {
  try {
    return store.getState()?.LanguageSwitcher?.language?.locale || "tr";
  } catch {
    return "tr";
  }
};

const getMessages = () =>
  AppLocale[getLocaleKey()]?.messages || AppLocale.tr?.messages || {};

const translate = (id, fallback = id) => getMessages()[id] || fallback;

export const getExpenseLocale = () => getLocaleKey();

export const getExpenseCopy = () =>
  Object.fromEntries(
    Object.entries(EXPENSE_COPY_IDS).map(([key, id]) => [
      key,
      translate(id, key),
    ])
  );

export const translateExpenseCategory = (value) =>
  translate(CATEGORY_MESSAGE_IDS[value], value);

export const getExpenseCategoryLabel = (value, extraCategory) => {
  const categoryLabel = translateExpenseCategory(value || "Diğer");
  void extraCategory;
  return categoryLabel;
};

/** Talep içindeki masrafların kategori etiketleri (Diğer + özel alt başlık dahil) */
export const getExpenseCategorySummaryLabel = (expense) => {
  const title = expense?.invoiceTitle || "Diğer";
  const extra = String(expense?.extraCategorie || "").trim();
  const base = translateExpenseCategory(title);
  if (String(title) === "Diğer" && extra) {
    return `${base}: ${extra}`;
  }
  return base;
};

/**
 * Talep içindeki benzersiz kategoriler (sıra fiş sırasıyla); pill rengi için invoiceTitle dahil.
 */
export const getUniqueExpenseCategoryEntries = (expenses = []) => {
  const list = Array.isArray(expenses) ? expenses : [];
  const entries = [];
  const seen = new Set();
  for (const e of list) {
    const label = getExpenseCategorySummaryLabel(e);
    const key = String(label || "").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    entries.push({
      label,
      invoiceTitle: e?.invoiceTitle || "Diğer",
    });
  }
  return entries;
};

/** Talep içindeki benzersiz kategori etiketleri (sıra, fiş sırasıyla) */
export const getUniqueExpenseCategoryLabels = (expenses = []) =>
  getUniqueExpenseCategoryEntries(expenses).map((x) => x.label);

/**
 * Çoklu masrafta seçilen kategorilerin özeti; en fazla `maxVisible` adet, fazlası "..." ile.
 */
export const formatRequestCategorySummary = (expenses = [], options = {}) => {
  const maxVisible = options.maxVisible ?? 3;
  const labels = getUniqueExpenseCategoryLabels(expenses);
  if (!labels.length) return "";
  const visible = labels.slice(0, maxVisible);
  const rest = labels.length - visible.length;
  return rest > 0 ? `${visible.join(", ")}...` : visible.join(", ");
};

/**
 * İlk kategori pill'de gösterildiğinde, yanında yazılacak kalan kategoriler (üst sınır formatRequestCategorySummary ile uyumlu).
 */
export const formatRequestCategorySummaryAfterFirst = (expenses = []) => {
  const labels = getUniqueExpenseCategoryLabels(expenses);
  if (labels.length <= 1) return "";
  const rest = labels.slice(1);
  const maxTotal = 3;
  const slotsAfterFirst = maxTotal - 1;
  const visibleRest = rest.slice(0, slotsAfterFirst);
  const hasMore = labels.length > maxTotal;
  if (!visibleRest.length) return "";
  return hasMore ? `${visibleRest.join(", ")}...` : visibleRest.join(", ");
};

/**
 * Red / revize talebi açıklaması (backend camelCase ve PascalCase alanları).
 */
export const resolveExpenseStatusReason = (expense) => {
  if (!expense || typeof expense !== "object") return "";
  const candidates = [
    expense.rejectionReason,
    expense.rejectReason,
    expense.RejectionReason,
    expense.RejectReason,
    expense.Reason,
    expense.reason,
    expense.revisionReason,
    expense.RevisionReason,
    expense.revisionMessage,
    expense.Message,
    expense.message,
    expense.statusReason,
    expense.StatusReason,
    expense.refuseReason,
    expense.refusalReason,
    expense.rejectDescription,
    expense.approvalNote,
    expense.note,
  ];
  for (const c of candidates) {
    const s = String(c ?? "").trim();
    if (s) return s;
  }
  return "";
};

export const translateExpensePaymentType = (value) =>
  translate(PAYMENT_TYPE_MESSAGE_IDS[value], value);

export const translateExpenseStatus = (value) =>
  translate(STATUS_MESSAGE_IDS[value], value);

export const buildExpenseCategoryOptions = (
  categoriesOrOptions,
  maybeOptions = {}
) => {
  const categories = Array.isArray(categoriesOrOptions)
    ? categoriesOrOptions
    : getExpenseCategoryDefinitions();
  const options = Array.isArray(categoriesOrOptions)
    ? maybeOptions
    : categoriesOrOptions || {};
  const { includeHidden = false } = options;

  return categories
    .filter((category) => includeHidden || category.visible)
    .map((category) => ({
      value: category.value,
      label: translateExpenseCategory(category.value),
    }));
};

export const buildExpensePaymentTypeOptions = () =>
  EXPENSE_PAYMENT_TYPE_VALUES.map((value) => ({
    value,
    label: translateExpensePaymentType(value),
  }));

export const buildExpenseStatusOptions = () =>
  EXPENSE_STATUS_VALUES.map((value) => ({
    value,
    label: translateExpenseStatus(value),
  }));

/** Birden fazla para birimi (MIX) — etiket ve tutar ön eki */
export const getMultiCurrencyDisplayLabel = () =>
  getExpenseLocale() === "en" ? "Multiple" : "Çoklu";

export const formatCurrencyCodeForDisplay = (currencyCode) => {
  const c = String(currencyCode || "").trim().toUpperCase();
  if (c === "MIX") return getMultiCurrencyDisplayLabel();
  return typeof currencyCode === "string" && currencyCode.trim()
    ? currencyCode.trim().toUpperCase()
    : "TRY";
};

export const formatExpenseCurrency = (
  value,
  { compact = false, currencyCode = "TRY" } = {}
) => {
  const locale = getExpenseLocale() === "en" ? "en-US" : "tr-TR";
  const raw =
    typeof currencyCode === "string" ? currencyCode.trim().toUpperCase() : "TRY";
  const isMixed = raw === "MIX";

  const numericValue =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : Number(value) || 0;

  const multiPrefix = `${getMultiCurrencyDisplayLabel()} `;

  if (isMixed) {
    if (compact && numericValue >= 1000) {
      const compactUnit =
        numericValue >= 1000000000
          ? { divisor: 1000000000, suffix: "B" }
          : numericValue >= 1000000
          ? { divisor: 1000000, suffix: "M" }
          : { divisor: 1000, suffix: "K" };
      const compactValue = numericValue / compactUnit.divisor;
      const formattedCompactValue = new Intl.NumberFormat(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: compactValue >= 100 ? 0 : 1,
      }).format(compactValue);

      return `${multiPrefix}${formattedCompactValue}${compactUnit.suffix}`;
    }

    return (
      multiPrefix +
      new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(numericValue)
    );
  }

  const code =
    typeof currencyCode === "string" && /^[A-Z]{3}$/.test(currencyCode.trim().toUpperCase())
      ? currencyCode.trim().toUpperCase()
      : "TRY";

  if (compact && numericValue >= 1000) {
    const compactUnit =
      numericValue >= 1000000000
        ? { divisor: 1000000000, suffix: "B" }
        : numericValue >= 1000000
        ? { divisor: 1000000, suffix: "M" }
        : { divisor: 1000, suffix: "K" };
    const compactValue = numericValue / compactUnit.divisor;
    const formattedCompactValue = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: compactValue >= 100 ? 0 : 1,
    }).format(compactValue);

    return `${code} ${formattedCompactValue}${compactUnit.suffix}`;
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

export const formatExpenseDate = (dateValue, options) => {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  if (!options) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }

  const { locale: localeOverride, ...intlOptions } = options || {};
  const locale =
    (localeOverride || getExpenseLocale()) === "en" ? "en-US" : "tr-TR";

  return new Intl.DateTimeFormat(locale, intlOptions).format(date);
};
