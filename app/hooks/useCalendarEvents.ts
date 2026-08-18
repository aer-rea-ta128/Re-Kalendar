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
  const currentY = new Date().getFullYear();

  // 1. 記念日イベント
  const anniversaryEvents = useMemo(() => {
    return anniversaries.flatMap((a: any) =>
      [currentY - 1, currentY, currentY + 1].map((y: number) => ({
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
  }, [anniversaries, currentY]);

  // 2. ルーティンイベント
  const routineEvents = useMemo(() => {
    return monthlyRoutines.flatMap((r: any) => {
      const evts: any[] = [];
      const baseDate = new Date(`${currentY - 1}-01-01`);
      const endDate = new Date(`${currentY + 1}-12-31`);

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
          const lastDayOfMonth = new Date(currentY, m, 0).getDate();
          const targetDay = r.day > lastDayOfMonth ? lastDayOfMonth : r.day;
          let dateObj = new Date(currentY, m - 1, targetDay);
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
            id: `routine-${r.title}-${currentY}-${m}`,
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
  }, [monthlyRoutines, currentY, holidays]);

  // 3. サブスクイベント
  const subEvents = useMemo(() => {
    return subs.flatMap((sub: any) => {
      const evts: any[] = [];
      const years = [currentY - 1, currentY, currentY + 1];
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
  }, [subs, currentY]);

  // 4. 時間割・コマイベント
  const timetableEvents = useMemo(() => {
    const evts: any[] = [];
    if (weeklyTimetables.length === 0) return evts;

    const baseDate = new Date(`${currentYear || currentY}-${String(currentMonthNum || 1).padStart(2, "0")}-01`);
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
  }, [weeklyTimetables, currentYear, currentMonthNum, currentY, timetableTerms, exceptionDays, holidays, canceledClasses, viewType]);

  // 5. 最終表示用イベントの統合・移動ブロック生成・フィルタリング
  const displayEvents = useMemo(() => {
    return [...events, ...anniversaryEvents, ...routineEvents, ...subEvents, ...timetableEvents]
      .flatMap((e: any) => {
        const metadata = e.extendedProps?.metadata || e.metadata || {};
        const cColor = e.extendedProps?.cColor || e.backgroundColor || metadata.customColor || "var(--theme)";
        const results: any[] = [];

        if (metadata.isGathering && metadata.departureTime) {
          const [dh, dm] = metadata.departureTime.split(":").map(Number);
          const [gh, gm] = (metadata.gatheringTime || "12:00").split(":").map(Number);
          const wTime = parseInt(metadata.walkTime || walkTime || "0", 10);

          const moveStart = new Date(e.start);
          moveStart.setHours(dh, dm, 0);
          if (metadata.departureType !== "home") moveStart.setMinutes(moveStart.getMinutes() - wTime);

          const moveEnd = new Date(e.start);
          moveEnd.setHours(gh, gm, 0);

          results.push({
            id: `${e.id}-travel`,
            groupId: e.id,
            title: `${moveStart.getHours()}:${String(moveStart.getMinutes()).padStart(2, "0")} → ${metadata.gatheringTime}`,
            start: moveStart.toISOString(),
            end: moveEnd.toISOString(),
            allDay: false,
            backgroundColor: "transparent",
            borderColor: cColor,
            extendedProps: { isTransitEvent: true, cColor, transitType: metadata.departureType },
          });
        }

        if (metadata.customFields?.isTransit) {
          if (metadata.customFields.transitDepTime && metadata.customFields.transitArrTime) {
            const [dh, dm] = metadata.customFields.transitDepTime.split(":").map(Number);
            const [ah, am] = metadata.customFields.transitArrTime.split(":").map(Number);

            const tStart = new Date(e.start);
            tStart.setHours(dh, dm, 0);

            const tEnd = new Date(e.start);
            tEnd.setHours(ah, am, 0);
            if (tEnd < tStart) tEnd.setDate(tEnd.getDate() + 1);

            results.push({
              id: `${e.id}-transit-out`,
              groupId: e.id,
              title: `行き`,
              start: tStart.toISOString(),
              end: tEnd.toISOString(),
              allDay: false,
              backgroundColor: "transparent",
              borderColor: cColor,
              extendedProps: { isTransitEvent: true, cColor, transitType: metadata.customFields.transitType },
            });
          }

          if (metadata.customFields.hasReturnTransit && metadata.customFields.returnTransitDepTime && metadata.customFields.returnTransitArrTime) {
            const [dh, dm] = metadata.customFields.returnTransitDepTime.split(":").map(Number);
            const [ah, am] = metadata.customFields.returnTransitArrTime.split(":").map(Number);

            const retBase = e.end ? new Date(e.end) : new Date(e.start);
            if (e.allDay && e.end) retBase.setDate(retBase.getDate() - 1);

            const retStart = new Date(retBase);
            retStart.setHours(dh, dm, 0);

            const retEnd = new Date(retBase);
            retEnd.setHours(ah, am, 0);
            if (retEnd < retStart) retEnd.setDate(retEnd.getDate() + 1);

            results.push({
              id: `${e.id}-transit-ret`,
              groupId: e.id,
              title: `帰り`,
              start: retStart.toISOString(),
              end: retEnd.toISOString(),
              allDay: false,
              backgroundColor: "transparent",
              borderColor: cColor,
              extendedProps: { isTransitEvent: true, cColor, transitType: metadata.customFields.returnTransitType },
            });
          }
        }

        results.push({
          ...e,
          groupId: e.id,
          extendedProps: { ...e.extendedProps, originalStart: e.start },
        });
        return results;
      })
      .filter((e: any) => {
        if (viewType === "dayGridMonth" && e.extendedProps?.isTransitEvent) return false;
        if (viewType === "dayGridMonth" && e.extendedProps?.metadata?.isPureFinance) return false;

        const isSub = String(e.id).startsWith("sub-");
        if (isSub) return false;

        if (viewType === "dayGridMonth") {
          if (e.extendedProps?.isRoutine && e.extendedProps?.cycle !== "monthly") return false;
          if (calendarCategoryFilter !== "すべて" && e.extendedProps?.category !== calendarCategoryFilter) {
            return false;
          }
        }
        return true;
      });
  }, [events, anniversaryEvents, routineEvents, subEvents, timetableEvents, walkTime, viewType, calendarCategoryFilter]);

  return {
    anniversaryEvents,
    routineEvents,
    subEvents,
    timetableEvents,
    displayEvents,
  };
}