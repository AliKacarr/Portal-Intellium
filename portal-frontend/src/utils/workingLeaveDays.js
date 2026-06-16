import moment from "moment";

/** Türkçe gösterim için ondalık virgül (örn. 2,5). */
export function formatTrDecimal(n) {
  if (n == null || Number.isNaN(Number(n))) return "";
  const x = Number(n);
  if (Number.isInteger(x)) return String(x);
  return x.toFixed(1).replace(".", ",");
}

/**
 * Tatil ve hafta sonlarını hariç tutarak izin talebinin iş günü karşılığı.
 * PermissionDetails / backend UserPermissionCalculate.CalculateActualLeaveDays ile uyumlu.
 *
 * @param {moment.Moment} start — talep başlangıcı (tarih + saat)
 * @param {moment.Moment} end — talep bitişi (tarih + saat)
 * @param {Array<{ startTime?: string, endTime?: string, StartTime?: string, EndTime?: string }>} holidays
 * @returns {number|null}
 */
export function calculateWorkingLeaveDays(start, end, holidays = []) {
  if (!start || !end || !moment.isMoment(start) || !moment.isMoment(end)) return null;
  if (!start.isValid() || !end.isValid()) return null;
  if (end.isBefore(start)) return null;

  const list = Array.isArray(holidays) ? holidays : [];

  const isHolidayDate = (d) =>
    list.some((h) => {
      const hStart = moment(h.startTime ?? h.StartTime).startOf("day");
      const hEnd = moment(h.endTime ?? h.EndTime).startOf("day");
      return d.clone().startOf("day").isBetween(hStart, hEnd, "day", "[]");
    });

  if (start.isSame(end, "day")) {
    const dayOfWeek = start.day();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend || isHolidayDate(start)) return 0;
    const duration = moment.duration(end.diff(start)).asHours();
    if (duration > 0 && duration < 6) return 0.5;
    return 1;
  }

  let days = 0;
  let current = start.clone().startOf("day");
  const endEndOfDay = end.clone().startOf("day");

  while (current.isSameOrBefore(endEndOfDay, "day")) {
    const dayOfWeek = current.day();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (!isWeekend && !isHolidayDate(current)) {
      if (current.isSame(start, "day")) {
        const dayEnd = current.clone().add(18, "hours");
        const h = moment.duration(dayEnd.diff(start)).asHours();
        if (h > 0 && h < 6) days += 0.5;
        else days += 1;
      } else if (current.isSame(end, "day")) {
        const dayStart = current.clone().add(9, "hours");
        const h = moment.duration(end.diff(dayStart)).asHours();
        if (h > 0 && h < 6) days += 0.5;
        else days += 1;
      } else {
        days += 1;
      }
    }
    current = current.add(1, "days");
  }

  return days;
}
