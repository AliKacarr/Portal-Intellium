import React, { useState, useEffect, useCallback } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import moment from "moment";
import "moment/locale/tr";
import "moment/locale/en-gb";
import { useSelector } from "react-redux";
import { useIntl } from "react-intl";
import { CalendarStyles, CalendarContainer } from "./holidayCalendar.styles.js";

import { GetAllHoliday } from "../../../../Api/HolidayApi";
import { getPermissionsByUserId } from "../../../../Api/PermissionApi";
import { GetPermissionTypes } from "../../../../Api/ParameterApi";

const localizer = momentLocalizer(moment);

const resolvePermissionTitle = (item, permissionTypeMap, intl) => {
  const typeId = item?.permissionTypeId ?? item?.PermissionTypeId;
  const dynamicType = permissionTypeMap.get(Number(typeId));
  const subPermission = dynamicType?.subPermission;
  const dynamicName =
    subPermission && subPermission.toLowerCase() !== "default"
      ? subPermission
      : dynamicType?.permission;

  const paidFull = intl.formatMessage({ id: "permission.calendar.leavePaidFull" });
  const unpaidFull = intl.formatMessage({ id: "permission.calendar.leaveUnpaidFull" });
  const leaveGeneric = intl.formatMessage({ id: "permission.calendar.leaveGeneric" });

  const permissionIdNames = {
    1: paidFull,
    2: unpaidFull,
    3: intl.formatMessage({ id: "permission.calendar.ref.mazeret1" }),
    4: intl.formatMessage({ id: "permission.calendar.ref.mazeret2" }),
    5: intl.formatMessage({ id: "permission.calendar.ref.mazeret3" }),
    6: intl.formatMessage({ id: "permission.calendar.ref.mazeret4" }),
    7: intl.formatMessage({ id: "permission.calendar.ref.mazeret5" }),
    8: intl.formatMessage({ id: "permission.calendar.ref.mazeret6" }),
  };

  const permissionRefNames = {
    mazeret1: intl.formatMessage({ id: "permission.calendar.ref.mazeret1" }),
    mazeret2: intl.formatMessage({ id: "permission.calendar.ref.mazeret2" }),
    mazeret3: intl.formatMessage({ id: "permission.calendar.ref.mazeret3" }),
    mazeret4: intl.formatMessage({ id: "permission.calendar.ref.mazeret4" }),
    mazeret5: intl.formatMessage({ id: "permission.calendar.ref.mazeret5" }),
    mazeret6: intl.formatMessage({ id: "permission.calendar.ref.mazeret6" }),
    Ücretli: paidFull,
    Ücretsiz: unpaidFull,
  };

  const rawTitle = (
    dynamicName ||
    item?.permissionTypeName ||
    item?.PermissionTypeName ||
    item?.permissionTypeRef?.subPermission ||
    item?.permissionTypeRef?.permission ||
    permissionIdNames[typeId] ||
    permissionRefNames[item?.permissionType] ||
    leaveGeneric
  );

  if (rawTitle === "Ücretli") return paidFull;
  if (rawTitle === "Ücretsiz") return unpaidFull;
  return rawTitle;
};

const HolidayCalendar = ({ refreshKey = 0, minHeight = 550, compact = false }) => {
  const intl = useIntl();
  const [events, setEvents] = useState([]);
  const [holidayDaysList, setHolidayDaysList] = useState([]);
  const id = useSelector((state) => state.Auth?.id);

  const culture = intl.locale.startsWith("tr") ? "tr" : "en";
  moment.locale(culture);

  const buildEvents = useCallback(async () => {
    let allEvents = [];
    const holidayDatesSet = new Set();
    let permissionTypeMap = new Map();

    try {
      const permissionTypesRes = await GetPermissionTypes();
      const list = permissionTypesRes?.data?.data ?? permissionTypesRes?.data ?? [];
      if (Array.isArray(list)) {
        permissionTypeMap = new Map(list.map((t) => [Number(t.id ?? t.Id), t]));
      }
    } catch (err) {
      console.error(err);
    }

    try {
      const holidayRes = await GetAllHoliday();
      if (holidayRes && holidayRes.data && holidayRes.data.data) {
        const holidays = [];

        holidayRes.data.data.forEach((item) => {
          const startDate = moment(item.startTime);
          const endDate = moment(item.endTime);

          if (startDate.isSame(endDate, "day")) {
            const dateStr = startDate.format("YYYY-MM-DD");
            holidayDatesSet.add(dateStr);

            holidays.push({
              title: item.name,
              start: startDate.toDate(),
              end: endDate.toDate(),
              allDay: true,
              resource: { type: "official" },
            });
          } else {
            let dayCounter = 1;
            let current = startDate.clone();

            while (current.isSameOrBefore(endDate, "day")) {
              const dateStr = current.format("YYYY-MM-DD");
              holidayDatesSet.add(dateStr);

              let eventTitle = item.name;
              const isReligiousHoliday =
                item.name.includes("Ramazan Bayramı") || item.name.includes("Kurban Bayramı");
              const isArife = item.name.includes("Arife");

              if (isReligiousHoliday && !isArife) {
                eventTitle = intl.formatMessage(
                  { id: "permission.calendar.officialHolidayDay" },
                  { name: item.name, day: dayCounter }
                );
              }

              holidays.push({
                title: eventTitle,
                start: current.toDate(),
                end: current.toDate(),
                allDay: true,
                resource: { type: "official" },
              });

              current.add(1, "days");

              if (isReligiousHoliday && !isArife) {
                dayCounter += 1;
              }
            }
          }
        });
        allEvents = [...allEvents, ...holidays];
      }
    } catch (err) {
      console.error(err);
    }

    setHolidayDaysList(Array.from(holidayDatesSet));

    if (id) {
      try {
        const permRes = await getPermissionsByUserId(id);
        const permissionData = permRes?.data || [];

        if (Array.isArray(permissionData)) {
          const permissions = [];

          permissionData.forEach((item) => {
            if (item.status === "Declined") {
              return;
            }

            let current = moment(item.startTime);
            const end = moment(item.endTime);
            const displayTitle = resolvePermissionTitle(item, permissionTypeMap, intl);

            const startDateStr = moment(item.startTime).format("YYYY-MM-DD");
            const endDateStr = moment(item.endTime).format("YYYY-MM-DD");

            while (current.isSameOrBefore(end, "day")) {
              const dayOfWeek = current.day();
              const dateStr = current.format("YYYY-MM-DD");

              let isHalfDayStart = false;
              let isHalfDayEnd = false;

              if (dateStr === startDateStr && moment(item.startTime).hour() >= 12) {
                isHalfDayStart = true;
              }
              if (
                dateStr === endDateStr &&
                moment(item.endTime).hour() > 0 &&
                moment(item.endTime).hour() <= 13
              ) {
                isHalfDayEnd = true;
              }

              if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidayDatesSet.has(dateStr)) {
                permissions.push({
                  title: displayTitle,
                  start: current.toDate(),
                  end: current.toDate(),
                  allDay: true,
                  resource: { type: "personal", status: item.status, isHalfDayStart, isHalfDayEnd },
                });
              }
              current.add(1, "days");
            }
          });

          allEvents = [...allEvents, ...permissions];
        }
      } catch (err) {
        console.error(err);
      }
    }
    setEvents(allEvents);
  }, [id, refreshKey, intl]);

  useEffect(() => {
    if (id) {
      buildEvents();
    }
  }, [id, buildEvents]);

  const eventPropGetter = (event) => {
    if (event.resource?.type === "official") {
      return {
        style: {
          backgroundColor: "#e53e3e",
          color: "white",
          borderRadius: "6px",
          border: "none",
          fontSize: "0.85rem",
          padding: "2px 5px",
        },
      };
    }

    if (event.resource?.type === "personal") {
      let bgColor = "#3182ce";

      if (event.resource?.status === "Pending") {
        bgColor = "#D69E2E";
      }

      let bgStyle = bgColor;
      let textAlign = "left";

      if (event.resource?.isHalfDayStart && event.resource?.isHalfDayEnd) {
        bgStyle = `linear-gradient(90deg, transparent 25%, ${bgColor} 25%, ${bgColor} 75%, transparent 75%)`;
        textAlign = "center";
      } else if (event.resource?.isHalfDayStart) {
        bgStyle = `linear-gradient(90deg, transparent 50%, ${bgColor} 50%)`;
        textAlign = "right";
      } else if (event.resource?.isHalfDayEnd) {
        bgStyle = `linear-gradient(90deg, ${bgColor} 50%, transparent 50%)`;
        textAlign = "left";
      }

      return {
        style: {
          background: bgStyle,
          color: "white",
          borderRadius: "6px",
          border: "none",
          fontSize: "0.85rem",
          padding: "2px 5px",
          textAlign,
          textShadow: bgStyle !== bgColor ? "0px 0px 3px rgba(0,0,0,0.8)" : "none",
        },
      };
    }
    return {};
  };

  const dayPropGetter = (date) => {
    const day = date.getDay();
    const dateStr = moment(date).format("YYYY-MM-DD");

    if (day === 0 || day === 6 || holidayDaysList.includes(dateStr)) {
      return {
        style: {
          backgroundColor: "#FAFAFA",
          color: "#A0AEC0",
        },
      };
    }
    return {};
  };

  const messages = {
    next: intl.formatMessage({ id: "permission.calendar.messages.next" }),
    previous: intl.formatMessage({ id: "permission.calendar.messages.previous" }),
    today: intl.formatMessage({ id: "permission.calendar.messages.today" }),
    month: intl.formatMessage({ id: "permission.calendar.messages.month" }),
    week: intl.formatMessage({ id: "permission.calendar.messages.week" }),
    day: intl.formatMessage({ id: "permission.calendar.messages.day" }),
    agenda: intl.formatMessage({ id: "permission.calendar.messages.agenda" }),
    date: intl.formatMessage({ id: "permission.calendar.messages.date" }),
    time: intl.formatMessage({ id: "permission.calendar.messages.time" }),
    event: intl.formatMessage({ id: "permission.calendar.messages.event" }),
    allDay: intl.formatMessage({ id: "permission.calendar.messages.allDay" }),
    showMore: (total) => intl.formatMessage({ id: "permission.calendar.messages.showMore" }, { total }),
  };

  return (
    <CalendarContainer>
      <CalendarStyles compact={compact}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ minHeight: `${minHeight}px` }}
          culture={culture}
          eventPropGetter={eventPropGetter}
          dayPropGetter={dayPropGetter}
          messages={messages}
        />
      </CalendarStyles>
    </CalendarContainer>
  );
};

export default HolidayCalendar;
