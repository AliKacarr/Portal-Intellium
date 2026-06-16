import moment from "moment";
import "moment/locale/tr";

import { getExpenseSettings } from "../constants/expenseSettings";
import { getExpenseLocale } from "./expenseI18n";

const capitalize = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

const getOldestAllowedInvoiceMonth = (
  referenceDate = moment(),
  previousPeriodCutoffDay = getExpenseSettings().previousPeriodCutoffDay
) =>
  referenceDate.date() <= previousPeriodCutoffDay
    ? referenceDate.clone().subtract(1, "month").startOf("month")
    : referenceDate.clone().startOf("month");

export const getInvoicePeriodLabel = (dateValue) => {
  if (!dateValue) {
    return "";
  }

  return capitalize(
    dateValue
      .clone()
      .locale(getExpenseLocale() === "en" ? "en" : "tr")
      .format("MMMM YYYY")
  );
};

export const isPastInvoiceMonth = (
  dateValue,
  referenceDate = moment(),
  previousPeriodCutoffDay = getExpenseSettings().previousPeriodCutoffDay
) => {
  if (!dateValue) {
    return false;
  }

  return dateValue
    .clone()
    .startOf("month")
    .isBefore(
      getOldestAllowedInvoiceMonth(referenceDate, previousPeriodCutoffDay)
    );
};

export const isFutureInvoiceDate = (dateValue) => {
  if (!dateValue) {
    return false;
  }

  return dateValue.clone().startOf("day").isAfter(moment().endOf("day"));
};

export const disablePastInvoiceMonths = (
  currentDate,
  referenceDate = moment(),
  previousPeriodCutoffDay = getExpenseSettings().previousPeriodCutoffDay
) =>
  Boolean(
    currentDate &&
      isPastInvoiceMonth(currentDate, referenceDate, previousPeriodCutoffDay)
  );

export const disableFutureInvoiceDates = (currentDate) =>
  Boolean(currentDate && isFutureInvoiceDate(currentDate));
