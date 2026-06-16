import React, { useEffect, useMemo, useRef, useState } from "react";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

import {
  ChartPanelBody,
  ChartCarouselDot,
  ChartCarouselDots,
  ChartCarouselStage,
  ChartMotionWrap,
  DonutChart,
  DonutInner,
  DonutLabel,
  DonutMeta,
  DonutValue,
  LegendDot,
  LegendItem,
  LegendList,
  LegendValue,
  Panel,
  PanelHeader,
  PanelHeading,
  PanelNavButton,
  PanelSubtitle,
  PanelTitle,
} from "../Expense.styles";
import { buildDonutBackground } from "../utils/dashboardPresentation";
import { getExpenseCopy } from "../utils/expenseI18n";
import {
  calculateCategoryBreakdown,
  getEffectiveExpenseAmount,
} from "../utils/dashboardMetrics";

const STATUS_VIEWS = [
  { key: "all", status: null },
  { key: "approved", status: "Onaylandı" },
  { key: "rejected", status: "Onaylanmadı" },
  { key: "pending", status: "Beklemede" },
];

const ExpenseCategoryBreakdownPanel = ({ expenses, formatCompactCurrency }) => {
  const copy = getExpenseCopy();
  const [activeViewIndex, setActiveViewIndex] = useState(0);
  const [autoRotatePaused, setAutoRotatePaused] = useState(false);
  const interactionTimeoutRef = useRef(null);
  const emptyBreakdown = useMemo(
    () => [{ label: copy.noCategoryData, percentage: 0, color: "#dbe7f6" }],
    [copy.noCategoryData]
  );

  const views = useMemo(
    () =>
      STATUS_VIEWS.map((view) => {
        const filteredExpenses = view.status
          ? (expenses || []).filter((expense) => expense.status === view.status)
          : expenses || [];
        const breakdown = calculateCategoryBreakdown(filteredExpenses);
        const totalAmount = filteredExpenses.reduce(
          (sum, expense) => sum + getEffectiveExpenseAmount(expense),
          0
        );

        return {
          ...view,
          label:
            {
              all: copy.categoryBreakdownAll,
              approved: copy.categoryBreakdownApproved,
              rejected: copy.categoryBreakdownRejected,
              pending: copy.categoryBreakdownPending,
            }[view.key] || copy.categoryBreakdownAll,
          breakdown,
          totalAmount,
          topCategory: breakdown[0],
        };
      }),
    [
      copy.categoryBreakdownAll,
      copy.categoryBreakdownApproved,
      copy.categoryBreakdownPending,
      copy.categoryBreakdownRejected,
      expenses,
    ]
  );
  const baseBreakdown = useMemo(
    () => calculateCategoryBreakdown(expenses || []),
    [expenses]
  );

  useEffect(() => {
    if (autoRotatePaused || views.length <= 1) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setActiveViewIndex((currentIndex) => (currentIndex + 1) % views.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [autoRotatePaused, views.length]);

  useEffect(
    () => () => {
      if (interactionTimeoutRef.current) {
        window.clearTimeout(interactionTimeoutRef.current);
      }
    },
    []
  );

  const currentView = views[activeViewIndex] || views[0];
  const referenceBreakdown = baseBreakdown.length ? baseBreakdown : emptyBreakdown;
  const currentBreakdownMap = new Map(
    (currentView?.breakdown || []).map((item) => [item.key, item])
  );
  const visibleBreakdown = referenceBreakdown.map((item) => {
    const currentItem = currentBreakdownMap.get(item.key);

    return currentItem
      ? currentItem
      : {
          ...item,
          amount: 0,
          count: 0,
          percentage: 0,
        };
  });
  const donutBackground = buildDonutBackground(visibleBreakdown);
  const shouldShowViewLabel = currentView?.key !== "all";

  const pauseAutoRotateTemporarily = () => {
    setAutoRotatePaused(true);

    if (interactionTimeoutRef.current) {
      window.clearTimeout(interactionTimeoutRef.current);
    }

    interactionTimeoutRef.current = window.setTimeout(() => {
      setAutoRotatePaused(false);
      interactionTimeoutRef.current = null;
    }, 10000);
  };

  const handleNavigate = (direction) => {
    pauseAutoRotateTemporarily();
    setActiveViewIndex((currentIndex) => {
      const nextIndex = currentIndex + direction;

      if (nextIndex < 0) {
        return views.length - 1;
      }

      return nextIndex % views.length;
    });
  };

  const handleSelectView = (index) => {
    pauseAutoRotateTemporarily();
    setActiveViewIndex(index);
  };

  return (
    <Panel>
      <PanelHeader>
        <PanelHeading>
          <PanelTitle>{copy.categoryBreakdownTitle}</PanelTitle>
          <PanelSubtitle>
            {currentView?.topCategory
              ? `${currentView.topCategory.label} ${copy.categoryBreakdownTopShare}`
              : copy.categoryBreakdownNoData}
          </PanelSubtitle>
        </PanelHeading>
      </PanelHeader>

      <ChartPanelBody>
        <ChartCarouselStage>
          <PanelNavButton
            type="button"
            onClick={() => handleNavigate(-1)}
            aria-label={`${copy.categoryBreakdownTitle} previous`}
          >
            <LeftOutlined />
          </PanelNavButton>

          <ChartMotionWrap key={`${currentView?.key}-${activeViewIndex}`}>
            <DonutChart $background={donutBackground}>
              <DonutInner>
                <DonutValue>
                  {formatCompactCurrency(currentView?.totalAmount || 0)}
                </DonutValue>
                <DonutLabel>
                  {shouldShowViewLabel
                    ? currentView?.label
                    : copy.categoryBreakdownTotalLabel}
                </DonutLabel>
                {shouldShowViewLabel ? (
                  <DonutMeta>{copy.totalExpense}</DonutMeta>
                ) : null}
              </DonutInner>
            </DonutChart>

          </ChartMotionWrap>

          <PanelNavButton
            type="button"
            onClick={() => handleNavigate(1)}
            aria-label={`${copy.categoryBreakdownTitle} next`}
          >
            <RightOutlined />
          </PanelNavButton>
        </ChartCarouselStage>

        <ChartCarouselDots>
          {views.map((view, index) => (
            <ChartCarouselDot
              key={view.key}
              $active={index === activeViewIndex}
              onClick={() => handleSelectView(index)}
              aria-label={`${copy.categoryBreakdownTitle} ${view.label}`}
            />
          ))}
        </ChartCarouselDots>

        <LegendList>
          {visibleBreakdown.map((item) => (
            <LegendItem key={item.label}>
              <LegendDot $color={item.color} />
              <span>{item.label}</span>
              <LegendValue>{item.percentage.toFixed(0)}%</LegendValue>
            </LegendItem>
          ))}
        </LegendList>
      </ChartPanelBody>
    </Panel>
  );
};

export default ExpenseCategoryBreakdownPanel;
