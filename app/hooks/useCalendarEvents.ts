"use client";

import { useMemo } from "react";
import { toLocalYYYYMMDD } from "@/app/lib/utils";

interface UseCalendarEventsParams {
  events: any[];
  anniversaries: any[];
  monthlyRoutines: any[];
  subs: any[];
  weeklyTimetables: any[];
  viewType: string;
  currentYear: string;
  currentMonthNum: string;
  timetableTerms: any[];
  exceptionDays: Record<string, "class" | "off">;
  holidays: Record<string, string>;
  canceledClasses: string[];
  walkTime: string;
  calendarCategoryFilter: string;
}

export function useCalendarEvents({
  events,
  anniversaries,
  monthlyRoutines,
  subs,
  weeklyTimetables,
  viewType,
  currentYear,
  currentMonthNum,
  timetableTerms,
  exceptionDays,
  holidays,
  canceledClasses,
  walkTime,
  calendarCategoryFilter,
}: UseCalendarEventsParams) {
  const baseYear = useMemo(() => Number(currentYear) || new Date().getFullYear(), [currentYear]);

  // 1. 記念日イベント
  const anniversaryEvents = useMemo(() => {
    if (!anniversaries || anniversaries.length === 0) return [];
    return anniversaries.flatMap((a: any) =>
      [baseYear - 1, baseYear, baseYear + 1].map((y: number) => ({
        id: `anniv-${a.title}-${y}`,
        title: `${a.title}`,
        start: `${y}-${a.date}`,
        allDay: true,
        backgroundColor: a.color,
        borderColor: a.color,
        display: "block",
        extendedProps: { isAnniversary: true, category: "記念日" },
      })),
    );
  }, [anniversaries, baseYear]);

  // 2. ルーティンイベント
  const routineEvents = useMemo(() => {
    if (!monthlyRoutines || monthlyRoutines.length === 0) return [];
    return monthlyRoutines.flatMap((r: any) => {
      const evts: any[] = [];
      const baseDate = new Date(`${baseYear - 1}-01-01`);
      const endDate = new Date(`${baseYear + 1}-12-31`);

      if (r.cycle === "daily") {
        for (let d = new Date(baseDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          evts.push({
            id: `routine-${r.title}-${toLocalYYYYMMDD(d)}`,
            title: `${r.title}`,
            start: toLocalYYYYMMDD(d),
            allDay: true,
            backgroundColor: r.color,
            borderColor: r.color,
            display: "block",
            extendedProps: { isRoutine: true, category: "ルーティン", cycle: "daily", metadata: { routineType: r.type || "task" } },
          });
        }
      } else if (r.cycle === "weekly") {
        for (let d = new Date(baseDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          if (d.getDay() === Number(r.dayOfWeek)) {
            evts.push({
              id: `routine-${r.title}-${toLocalYYYYMMDD(d)}`,
              title: `${r.title}`,
              start: toLocalYYYYMMDD(d),
              allDay: true,
              backgroundColor: r.color,
              borderColor: r.color,
              display: "block",
              extendedProps: { isRoutine: true, category: "ルーティン", cycle: "weekly", metadata: { routineType: r.type || "task" } },
            });
          }
        }
      } else {
        for (let i = 0; i < 12; i++) {
          const m = i + 1;
          const lastDayOfMonth = new Date(baseYear, m, 0).getDate();
          const targetDay = r.day > lastDayOfMonth ? lastDayOfMonth : r.day;
          let dateObj = new Date(baseYear, m - 1, targetDay);
          if (r.adjust === "prev") {
            let count = 0;
            while ((dateObj.getDay() === 0 || dateObj.getDay() === 6 || holidays[toLocalYYYYMMDD(dateObj)]) && count < 10) {
              dateObj.setDate(dateObj.getDate() - 1);
              count++;
            }
          } else if (r.adjust === "next") {
            let count = 0;
            while ((dateObj.getDay() === 0 || dateObj.getDay() === 6 || holidays[toLocalYYYYMMDD(dateObj)]) && count < 10) {
              dateObj.setDate(dateObj.getDate() + 1);
              count++;
            }
          }
          evts.push({
            id: `routine-${r.title}-${baseYear}-${m}`,
            title: `${r.title}`,
            start: toLocalYYYYMMDD(dateObj),
            allDay: true,
            backgroundColor: r.color,
            borderColor: r.color,
            display: "block",
            extendedProps: { isRoutine: true, category: "ルーティン", cycle: "monthly", metadata: { routineType: r.type || "task" } },
          });
        }
      }
      return evts;
    });
  }, [monthlyRoutines, baseYear, holidays]);

  // 3. サブスクイベント
  const subEvents = useMemo(() => {
    if (!subs || subs.length === 0) return [];
    return subs.flatMap((sub: any) => {
      const evts: any[] = [];
      const years = [baseYear - 1, baseYear, baseYear + 1];
      const catColor = "#8b5cf6";

      years.forEach((y) => {
        if (sub.cycle === "monthly") {
          for (let m = 1; m <= 12; m++) {
            evts.push({
              id: `sub-${sub.name}-${y}-${m}`,
              title: `🔄 ${sub.name}`,
              start: `${y}-${String(m).padStart(2, "0")}-${String(sub.date).padStart(2, "0")}`,
              allDay: true,
              backgroundColor: "transparent",
              borderColor: catColor,
              textColor: "var(--text-main)",
              display: "block",
              extendedProps: {
                category: sub.category || "サブスク",
                metadata: { customColor: catColor, isAllDayBackground: false, customFields: { isExpenseSet: true, standardExpenseAmount: sub.amount } },
              },
            });
          }
        } else if (sub.cycle === "yearly") {
          evts.push({
            id: `sub-${sub.name}-${y}`,
            title: `🔄 ${sub.name}`,
            start: `${y}-${sub.date}`,
            allDay: true,
            backgroundColor: "transparent",
            borderColor: catColor,
            textColor: "var(--text-main)",
            display: "block",
            extendedProps: {
              category: sub.category || "サブスク",
              metadata: { customColor: catColor, isAllDayBackground: false, customFields: { isExpenseSet: true, standardExpenseAmount: sub.amount } },
            },
          });
        }
      });
      return evts;
    });
  }, [subs, baseYear]);

  // 4. 時間割・コマイベント
  const timetableEvents = useMemo(() => {
    const evts: any[] = [];
    if (weeklyTimetables.length === 0) return evts;

    const baseDate = new Date(`${baseYear}-${String(currentMonthNum || 1).padStart(2, "0")}-01`);
    baseDate.setDate(baseDate.getDate() - 15);
    const endLimit = new Date(baseDate);
    endLimit.setDate(endLimit.getDate() + 60);

    const dailySummaryMap = new Map();

    for (let d = new Date(baseDate); d <= endLimit; d.setDate(d.getDate() + 1)) {
      const dateStr = toLocalYYYYMMDD(d);

      if (timetableTerms.length > 0) {
        const isInTerm = timetableTerms.some((term: any) => {
          const afterStart = !term.start || dateStr >= term.start;
          const beforeEnd = !term.end || dateStr <= term.end;
          return afterStart && beforeEnd;
        });
        if (!isInTerm) continue;
      }

      const exception = exceptionDays[dateStr];
      if (exception === "off") continue;
      if (holidays[dateStr] && exception !== "class") continue;

      const dayOfWeek = d.getDay();

      const dayRoutines = weeklyTimetables.filter((t) => {
        if (t.dayOfWeek !== dayOfWeek) return false;
        if (!t.termId || t.termId === "all") return true;
        const term = timetableTerms.find((termObj: any) => termObj.id === t.termId);
        if (!term) return true;
        const afterStart = !term.start || dateStr >= term.start;
        const beforeEnd = !term.end || dateStr <= term.end;
        return afterStart && beforeEnd;
      });
      if (dayRoutines.length === 0) continue;

      if (viewType === "dayGridMonth") {
        dayRoutines.forEach((r) => {
          const key = `${dateStr}-${r.categoryName}`;
          if (!dailySummaryMap.has(key)) {
            dailySummaryMap.set(key, { categoryName: r.categoryName, color: r.color, count: 1 });
          } else {
            dailySummaryMap.get(key).count++;
          }
        });
      } else {
        dayRoutines.forEach((r, idx) => {
          const uniqueId = `timetable-${dateStr}-${r.id}-${idx}`;
          if (canceledClasses.includes(uniqueId)) return;

          const startIso = new Date(`${dateStr}T${r.startH}:${r.startM}:00`).toISOString();
          const endIso = new Date(`${dateStr}T${r.endH}:${r.endM}:00`).toISOString();
          evts.push({
            id: uniqueId,
            title: r.title,
            start: startIso,
            end: endIso,
            allDay: false,
            backgroundColor: "transparent",
            borderColor: r.color,
            extendedProps: {
              isTimetable: true,
              cColor: r.color,
              category: r.categoryName,
              metadata: { location: r.location, lessonType: r.lessonType },
            },
          });
        });
      }
    }

    if (viewType === "dayGridMonth") {
      dailySummaryMap.forEach((val, key) => {
        const [dateStr, cat] = key.split("-");
        evts.push({
          id: `timetable-summary-${key}`,
          title: `${cat} (${val.count}コマ)`,
          start: dateStr,
          allDay: true,
          backgroundColor: val.color,
          borderColor: val.color,
          textColor: "#fff",
          extendedProps: {
            isTimetableSummary: true,
            cColor: val.color,
            category: cat,
            metadata: { isAllDayBackground: true },
          },
        });
      });
    }
    return evts;
  }, [weeklyTimetables, baseYear, currentMonthNum, timetableTerms, exceptionDays, holidays, canceledClasses, viewType]);

  // 5. 最終表示用イベントの統合・フィルタリング（1回のループで高速処理）
  const displayEvents = useMemo(() => {
    const rawAll = [...events, ...anniversaryEvents, ...routineEvents, ...subEvents, ...timetableEvents];
    const isMonthView = viewType === "dayGridMonth";
    const hasCatFilter = calendarCategoryFilter !== "すべて";
    const result: any[] = [];

    for (let i = 0; i < rawAll.length; i++) {
      const e = rawAll[i];
      if (String(e.id).startsWith("sub-")) continue;

      if (isMonthView) {
        if (e.extendedProps?.metadata?.isPureFinance) continue;
        if (e.extendedProps?.isRoutine && e.extendedProps?.cycle !== "monthly") continue;
        if (hasCatFilter && e.extendedProps?.category !== calendarCategoryFilter) continue;
      }

      result.push({
        ...e,
        groupId: e.id,
        extendedProps: { ...e.extendedProps, originalStart: e.start },
      });
    }

    return result;
  }, [events, anniversaryEvents, routineEvents, subEvents, timetableEvents, viewType, calendarCategoryFilter]);

  return {
    anniversaryEvents,
    routineEvents,
    subEvents,
    timetableEvents,
    displayEvents,
  };
}