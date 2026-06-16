import { useCallback, useEffect, useMemo, useState } from "react";
import { message as antdMessage } from "antd";
import { useDispatch, useSelector } from "react-redux";

import { fetchExpenses } from "../redux/actionCreators";
import {
  isKnownExpenseCategory,
  resolveExpenseCategoryValue,
} from "../constants/expenseOptions";
import useExpenseUsers from "./useExpenseUsers";
import useExpenseCategories from "./useExpenseCategories";
import { exportExpensesByType } from "../utils/dashboardExport";
import {
  buildCategoryOptions,
  buildFilterSummaryItems,
  calculateCategoryBreakdown,
  calculateDelta,
  filterExpenses,
  formatCompactCurrency as formatCompactCurrencyAmount,
  getEffectiveExpenseAmount,
  parseAmount,
  sortExpenses,
} from "../utils/dashboardMetrics";
import {
  DEFAULT_EXPENSE_CURRENCY,
  getDistinctCurrencyCodes,
  getExpenseCurrencyCode,
} from "../utils/expenseCurrency";
import {
  buildExpenseStatusOptions,
  getExpenseCopy,
  resolveExpenseStatusReason,
  translateExpenseCategory,
  translateExpenseStatus,
} from "../utils/expenseI18n";
import { buildExpenseRequests } from "../utils/expenseRequests";

const hasValue = (value) =>
  value !== undefined && value !== null && value !== "";

const getExpenseCreatorId = (expense) =>
  expense?.createdUser?.id ??
  expense?.createdUserId ??
  expense?.createdById ??
  expense?.createdBy?.id ??
  expense?.insertUserId ??
  expense?.createdByUserId ??
  expense?.insertUser?.id ??
  expense?.createdByUser?.id;

const getExpenseCreatorName = (expense, userLabelById, fallbackLabel) =>
  expense?.creatorName ||
  expense?.createdUserName ||
  expense?.createdByName ||
  expense?.insertUserName ||
  expense?.createdUser?.name ||
  expense?.createdBy?.name ||
  expense?.createdUser?.fullName ||
  expense?.createdBy?.fullName ||
  expense?.insertUser?.name ||
  expense?.createdByUser?.name ||
  expense?.insertUser?.fullName ||
  expense?.createdByUser?.fullName ||
  userLabelById[String(getExpenseCreatorId(expense))] ||
  fallbackLabel;

export default function useExpenseDashboard(options = {}) {
  const copy = getExpenseCopy();
  const unknownUserLabel = copy.unknownUser;
  const userLabelPrefix = copy.user;
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.Auth);
  const userId = auth?.id ?? auth?.Id;
  const authDisplayId = auth?.id ?? auth?.Id;
  const authDisplayName =
    auth?.name ?? auth?.fullName ?? auth?.Name ?? auth?.FullName;
  const isAdmin = auth?.role?.roleName === "admin";
  const isWorkerMode = options.viewMode === "worker";
  const isAdminMode = options.viewMode === "admin";
  const canManageAllExpenses = isAdmin && !isWorkerMode;
  const {
    data: expenses,
    loading,
    error,
  } = useSelector((state) => state.expenses);
  const { userOptions: allUserOptions } = useExpenseUsers();
  const { categories: managedCategories } = useExpenseCategories();
  const visibleCategoryValueSet = useMemo(
    () =>
      new Set(
        (managedCategories || []).flatMap((category) =>
          category.visible !== false
            ? [category.value, ...(category.aliases || [])]
            : []
        )
      ),
    [managedCategories]
  );

  const [addExpenseModalOpen, setAddExpenseModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(undefined);
  const [selectedStatus, setSelectedStatus] = useState(undefined);
  const [selectedUserId, setSelectedUserId] = useState(undefined);
  const [selectedPeriod, setSelectedPeriod] = useState(undefined);
  const [selectedSort, setSelectedSort] = useState("createdDesc");
  const [minAmount, setMinAmount] = useState(undefined);
  const [maxAmount, setMaxAmount] = useState(undefined);
  const [dateRange, setDateRange] = useState([null, null]);
  /** Karışık para birimlerinde grafik/özet tek birimde */
  const [chartCurrencyFilter, setChartCurrencyFilter] = useState(
    DEFAULT_EXPENSE_CURRENCY
  );
  const amountRange = useMemo(
    () => ({
      minAmount,
      maxAmount,
    }),
    [minAmount, maxAmount]
  );

  // minAmount / maxAmount burada yok: sadece istemci tarafı filterExpenses ile uygulanır.
  // Böylece tutar yazılırken / alan dışına tıklanınca tüm sayfa fetch + loading olmaz; yalnızca liste yeniden süzülür.
  const apiFilters = useMemo(
    () => ({
      userId: canManageAllExpenses
        ? selectedUserId
        : isWorkerMode
        ? undefined
        : userId,
      period: selectedPeriod,
      status: selectedStatus,
      sortByPinnedFirst: true,
      onlyCurrentUser: !canManageAllExpenses,
      useAdminSource: isAdmin && isWorkerMode,
      /** Excel/PDF export — getAllForAdmin ile aynı kapsam (userId / includeAllUsers) */
      canUseAdminView: isAdmin && canManageAllExpenses,
      authUserId: userId,
    }),
    [
      canManageAllExpenses,
      isAdmin,
      isWorkerMode,
      selectedUserId,
      userId,
      selectedPeriod,
      selectedStatus,
    ]
  );

  useEffect(() => {
    if (userId) {
      dispatch(fetchExpenses(apiFilters));
    }
  }, [dispatch, userId, apiFilters]);

  useEffect(() => {
    if (error) {
      antdMessage.error(error);
    }
  }, [error]);

  /**
   * useMessage() + messageApi.open bazen Modal/async sonrası getPrefixCls hatası veriyor.
   * Statik message API ConfigProvider ile uyumlu ve aynı görünümü korur.
   */
  const showMessage = (type, content) => {
    const fn = antdMessage[type];
    if (typeof fn === "function") {
      fn(content);
      return;
    }
    antdMessage.open({ type, content });
  };

  const userLabelById = useMemo(() => {
    const fromOptions = Object.fromEntries(
      (allUserOptions || []).map((userOption) => [
        String(userOption.value),
        userOption.label,
      ])
    );
    // Giriş yapan kullanıcıyı ekle (ekleyen kişi çözümlemesi için, öz. admin olmayan görünümde)
    if (authDisplayId != null && authDisplayName) {
      return {
        ...fromOptions,
        [String(authDisplayId)]: authDisplayName,
      };
    }
    return fromOptions;
  }, [allUserOptions, authDisplayId, authDisplayName]);

  const enrichedExpenses = useMemo(
    () =>
      (expenses || []).map((expense) => ({
        ...expense,
        invoiceTitle: isKnownExpenseCategory(expense.invoiceTitle)
          ? resolveExpenseCategoryValue(expense.invoiceTitle || "Diğer")
          : "Diğer",
        ownerName:
          expense.ownerName ||
          expense.userName ||
          expense.fullName ||
          expense.user?.name ||
          expense.createdUser?.name ||
          userLabelById[String(expense.userId)] ||
          (expense.userId
            ? `${userLabelPrefix} #${expense.userId}`
            : unknownUserLabel),
        rejectionReason: resolveExpenseStatusReason(expense),
        creatorName: getExpenseCreatorName(
          expense,
          userLabelById,
          unknownUserLabel
        ),
      })),
    [expenses, unknownUserLabel, userLabelById, userLabelPrefix]
  );

  const scopedExpenses = useMemo(
    () =>
      canManageAllExpenses
        ? enrichedExpenses
        : enrichedExpenses.filter((expense) => {
            const creatorId = getExpenseCreatorId(expense);
            const isOwner = String(expense.userId) === String(userId);

            if (creatorId !== undefined && creatorId !== null) {
              return String(creatorId) === String(userId) || isOwner;
            }

            return isOwner;
          }),
    [canManageAllExpenses, enrichedExpenses, userId]
  );

  const baseFilteredExpenses = useMemo(
    () =>
      filterExpenses(scopedExpenses, {
        searchTerm,
        selectedCategory,
        selectedStatus,
        selectedUserId,
        amountRange,
        dateRange,
        period: selectedPeriod,
        minAmount,
        maxAmount,
      }),
    [
      scopedExpenses,
      searchTerm,
      selectedCategory,
      selectedStatus,
      selectedUserId,
      amountRange,
      dateRange,
      selectedPeriod,
      minAmount,
      maxAmount,
    ]
  );

  const visibleFilteredExpenses = useMemo(
    () =>
      baseFilteredExpenses.filter((expense) =>
        visibleCategoryValueSet.has(expense.invoiceTitle || "Diğer")
      ),
    [baseFilteredExpenses, visibleCategoryValueSet]
  );

  const filteredExpenses = useMemo(
    () => sortExpenses(visibleFilteredExpenses, selectedSort),
    [visibleFilteredExpenses, selectedSort]
  );

  const distinctCurrencyCodes = useMemo(
    () => getDistinctCurrencyCodes(filteredExpenses),
    [filteredExpenses]
  );

  useEffect(() => {
    if (distinctCurrencyCodes.length === 0) {
      return;
    }
    if (distinctCurrencyCodes.length === 1) {
      setChartCurrencyFilter(distinctCurrencyCodes[0]);
      return;
    }
    setChartCurrencyFilter((prev) =>
      distinctCurrencyCodes.includes(prev)
        ? prev
        : distinctCurrencyCodes.includes(DEFAULT_EXPENSE_CURRENCY)
        ? DEFAULT_EXPENSE_CURRENCY
        : distinctCurrencyCodes[0]
    );
  }, [distinctCurrencyCodes]);

  const chartScopedExpenses = useMemo(() => {
    if (distinctCurrencyCodes.length <= 1) {
      return filteredExpenses;
    }
    return filteredExpenses.filter(
      (expense) => getExpenseCurrencyCode(expense) === chartCurrencyFilter
    );
  }, [filteredExpenses, distinctCurrencyCodes, chartCurrencyFilter]);

  const metricsCurrencyCode = useMemo(() => {
    if (distinctCurrencyCodes.length <= 1) {
      return distinctCurrencyCodes[0] || DEFAULT_EXPENSE_CURRENCY;
    }
    return chartCurrencyFilter;
  }, [distinctCurrencyCodes, chartCurrencyFilter]);

  const formatCompactCurrency = useCallback(
    (value) => formatCompactCurrencyAmount(value, metricsCurrencyCode),
    [metricsCurrencyCode]
  );

  useEffect(() => {
    if (selectedCategory && !visibleCategoryValueSet.has(selectedCategory)) {
      setSelectedCategory(undefined);
    }
  }, [selectedCategory, visibleCategoryValueSet]);

  const totalAmount = useMemo(
    () =>
      chartScopedExpenses.reduce(
        (sum, expense) => sum + getEffectiveExpenseAmount(expense),
        0
      ),
    [chartScopedExpenses]
  );

  const pendingExpenses = useMemo(
    () =>
      chartScopedExpenses.filter((expense) => expense.status === "Beklemede"),
    [chartScopedExpenses]
  );

  const approvedExpenses = useMemo(
    () =>
      chartScopedExpenses.filter((expense) => expense.status === "Onaylandı"),
    [chartScopedExpenses]
  );

  /**
   * Düzeltilmesi Gerekenler: revize bekleyenler, seçili dönemde **oluşturulmuş** masraflar
   * (fiş tarihi değil; ana tablodaki durum filtresi burada uygulanmaz).
   */
  const rejectedExpenses = useMemo(() => {
    const list = filterExpenses(scopedExpenses, {
      searchTerm,
      selectedCategory,
      selectedStatus: undefined,
      selectedUserId,
      amountRange,
      dateRange,
      period: selectedPeriod,
      periodSource: "created",
      minAmount,
      maxAmount,
    }).filter((expense) =>
      visibleCategoryValueSet.has(expense.invoiceTitle || "Diğer")
    );
    return sortExpenses(
      list.filter((expense) => expense.status === "Revize Bekliyor"),
      selectedSort
    );
  }, [
    scopedExpenses,
    searchTerm,
    selectedCategory,
    selectedUserId,
    amountRange,
    dateRange,
    selectedPeriod,
    minAmount,
    maxAmount,
    visibleCategoryValueSet,
    selectedSort,
  ]);

  /** Revize bekleyenleri talep (requestId) bazında grupla. */
  const rejectedRequests = useMemo(
    () => buildExpenseRequests(rejectedExpenses, selectedSort),
    [rejectedExpenses, selectedSort]
  );

  const rejectedExpensesForMetrics = useMemo(
    () =>
      chartScopedExpenses.filter((expense) => expense.status === "Onaylanmadı"),
    [chartScopedExpenses]
  );

  const approvedTotal = useMemo(
    () =>
      approvedExpenses.reduce(
        (sum, expense) => sum + getEffectiveExpenseAmount(expense),
        0
      ),
    [approvedExpenses]
  );

  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(chartScopedExpenses),
    [chartScopedExpenses]
  );

  const filterUserOptions = useMemo(() => {
    if (canManageAllExpenses) {
      return allUserOptions;
    }

    const distinctExpenseUsers = Array.from(
      new Map(
        scopedExpenses
          .filter(
            (expense) =>
              expense?.userId !== undefined &&
              expense?.userId !== null &&
              visibleCategoryValueSet.has(expense.invoiceTitle || "Diğer")
          )
          .map((expense) => [
            String(expense.userId),
            {
              value: expense.userId,
              label: expense.ownerName || userLabelById[String(expense.userId)],
            },
          ])
      ).values()
    );

    return distinctExpenseUsers.length > 1 ? distinctExpenseUsers : [];
  }, [
    allUserOptions,
    canManageAllExpenses,
    scopedExpenses,
    userLabelById,
    visibleCategoryValueSet,
  ]);

  const topCategory = categoryBreakdown[0];
  const averageAmount = chartScopedExpenses.length
    ? totalAmount / chartScopedExpenses.length
    : 0;
  const totalDelta = calculateDelta(chartScopedExpenses);
  const approvedDelta = calculateDelta(chartScopedExpenses, "Onaylandı");
  const pendingShare = chartScopedExpenses.length
    ? (pendingExpenses.length / chartScopedExpenses.length) * 100
    : 0;
  const categoryOptions = buildCategoryOptions(
    filteredExpenses,
    managedCategories
  );
  const filterSummaryItems = buildFilterSummaryItems({
    filteredExpenses: chartScopedExpenses,
    averageAmount,
    topCategory,
    rejectedExpenses: rejectedExpensesForMetrics,
    metricsCurrencyCode,
  });

  const activeFilterCount = [
    selectedCategory,
    selectedStatus,
    selectedUserId,
    selectedPeriod,
    selectedSort !== "dateDesc" ? selectedSort : undefined,
    minAmount,
    maxAmount,
    dateRange[0],
    searchTerm.trim(),
  ].filter(hasValue).length;

  const reportScopeLabel = useMemo(() => {
    if (canManageAllExpenses) {
      if (selectedUserId) {
        return `${copy.filterUser}: ${
          userLabelById[String(selectedUserId)] || selectedUserId
        }`;
      }
      return copy.reportScopeAllUsers;
    }
    if (isWorkerMode) {
      return copy.reportScopeWorkerView;
    }
    return copy.reportScopeOwnRecords;
  }, [
    canManageAllExpenses,
    selectedUserId,
    isWorkerMode,
    userLabelById,
    copy.filterUser,
    copy.reportScopeAllUsers,
    copy.reportScopeWorkerView,
    copy.reportScopeOwnRecords,
  ]);

  const activeFilters = [
    activeFilterCount ? `${copy.activeFilter}: ${activeFilterCount}` : null,
    selectedCategory
      ? `${copy.filterCategory}: ${translateExpenseCategory(selectedCategory)}`
      : null,
    selectedStatus
      ? `${copy.filterStatus}: ${translateExpenseStatus(selectedStatus)}`
      : null,
    selectedUserId
      ? `${copy.filterUser}: ${
          userLabelById[String(selectedUserId)] || selectedUserId
        }`
      : null,
    selectedPeriod ? `${copy.filterPeriod}: ${selectedPeriod}` : null,
    selectedSort && selectedSort !== "dateDesc"
      ? `${copy.filterSort}: ${copy[`sortOption_${selectedSort}`]}`
      : null,
    hasValue(minAmount)
      ? `${copy.filterMinAmount}: ${formatCompactCurrency(minAmount)}`
      : null,
    hasValue(maxAmount)
      ? `${copy.filterMaxAmount}: ${formatCompactCurrency(maxAmount)}`
      : null,
    searchTerm.trim() ? `${copy.filterSearch}: ${searchTerm.trim()}` : null,
  ].filter(Boolean);

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSelectedStatus(undefined);
    setSelectedUserId(undefined);
    setSelectedPeriod(undefined);
    setSelectedSort("createdDesc");
    setMinAmount(undefined);
    setMaxAmount(undefined);
    setDateRange([null, null]);
    setSearchTerm("");
  };

  const handleReportMenuClick = async ({ key }) => {
    if (key === "csv" && !filteredExpenses.length) {
      showMessage("warning", copy.noDownloadableExpenses);
      return;
    }

    try {
      const generatedAt = new Date().toLocaleString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const successMessage = await exportExpensesByType(
        key,
        key === "pdf" ? chartScopedExpenses : filteredExpenses,
        parseAmount,
        {
          accessToken: auth?.accessToken,
          apiFilters,
          pdfReportContext:
            key === "pdf"
              ? {
                  scopeLabel: reportScopeLabel,
                  generatedAt,
                  totalAmount,
                  totalDelta,
                  pendingCount: pendingExpenses.length,
                  pendingShare,
                  approvedTotal,
                  approvedDelta,
                  approvedCount: approvedExpenses.length,
                  metricsCurrencyCode,
                  showChartCurrencyFilter: distinctCurrencyCodes.length > 1,
                  filterSummaryItems,
                  activeFilters,
                }
              : undefined,
        }
      );
      showMessage("success", successMessage);
    } catch {
      showMessage("error", copy.exportError);
    }
  };

  return {
    loading,
    expenses: enrichedExpenses,
    filteredExpenses,
    chartScopedExpenses,
    distinctCurrencyCodes,
    chartCurrencyFilter,
    setChartCurrencyFilter,
    showChartCurrencyFilter: distinctCurrencyCodes.length > 1,
    metricsCurrencyCode,
    totalAmount,
    pendingExpenses,
    approvedExpenses,
    rejectedExpenses,
    rejectedRequests,
    approvedTotal,
    categoryBreakdown,
    topCategory,
    totalDelta,
    approvedDelta,
    pendingShare,
    categoryOptions,
    filterSummaryItems,
    activeFilterCount,
    activeFilters,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    selectedUserId,
    setSelectedUserId,
    selectedPeriod,
    setSelectedPeriod,
    selectedSort,
    setSelectedSort,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    amountRange,
    setAmountRange: (nextRange = {}) => {
      setMinAmount(nextRange?.minAmount);
      setMaxAmount(nextRange?.maxAmount);
    },
    dateRange,
    setDateRange,
    userOptions: filterUserOptions,
    filtersOpen,
    toggleFilters: () => setFiltersOpen((currentValue) => !currentValue),
    addExpenseModalOpen,
    openAddExpenseModal: () => setAddExpenseModalOpen(true),
    closeAddExpenseModal: () => setAddExpenseModalOpen(false),
    isAdmin: isAdminMode || canManageAllExpenses,
    categoryModalOpen,
    openCategoryModal: () => setCategoryModalOpen(true),
    closeCategoryModal: () => setCategoryModalOpen(false),
    clearFilters,
    handleReportMenuClick,
    showMessage,
    formatCompactCurrency,
    parseAmount,
    expenseStatusOptions: buildExpenseStatusOptions(),
  };
}
