"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/app/lib/supabase";
import { toLocalYYYYMMDD } from "@/app/lib/utils";
import { saveData } from "@/app/lib/storage";

interface UseEventsParams {
  activeUserId: string | null;
  userProfile: any;
  categories: any[];
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
}

export function useEvents({
  activeUserId,
  userProfile,
  categories,
  setCategories,
}: UseEventsParams) {
  const [events, setEvents] = useState<any[]>([]);

  // 予定一覧の取得（ローカル優先 ＋ クラウドバックグラウンド同期）
  const fetchEvents = useCallback(async () => {
    if (!activeUserId) return;

    let rawData: any[] = [];
    const isPremiumUser = activeUserId === "YOUR_SUPABASE_USER_UID" || userProfile?.isPremium === true;

    const localData = localStorage.getItem("events");
    if (localData) {
      rawData = JSON.parse(localData);
    }

    if (isPremiumUser) {
      try {
        const { data, error } = await (supabase.from("events") as any).select("*").eq("user_id", activeUserId);
        if (!error && data) {
          rawData = data;
          localStorage.setItem("events", JSON.stringify(data));

          let updatedCategories = [...categories];
          let isChanged = false;
          data.forEach((e: any) => {
            if (e.category && !updatedCategories.some((c) => c.name === e.category)) {
              updatedCategories.push({ name: e.category, color: e.metadata?.customColor || "#3b82f6", fields: [] });
              isChanged = true;
            }
          });
          if (isChanged) {
            setCategories(updatedCategories);
            saveData("os_categories", activeUserId, updatedCategories);
          }
        }
      } catch (err) {
        console.error("Cloud fetch failed, using local data", err);
      }
    }

    setEvents(
      rawData.map((e: any) => {
        const catObj = categories.find((c: any) => c.name === e.category);
        const catColor = catObj?.color || "#999999";
        let cColor = e.metadata?.customColor || catColor;

        const outline = e.metadata?.isOutline || false;
        const milestone = e.metadata?.isMilestone || false;
        const isBackground = e.metadata?.isAllDayBackground || false;

        const sStr = e.metadata?.startDateStr || (e.start_at ? e.start_at.split("T")[0] : toLocalYYYYMMDD(new Date(e.start_at || e.start)));
        const eStr = e.metadata?.endDateStr || (e.end_at ? e.end_at.split("T")[0] : sStr);

        let actualStart = e.start_at || e.start;
        let actualEnd = e.end_at || e.start_at || e.end;

        if (isBackground) {
          actualStart = sStr;
          const [y, m, d] = eStr.split("-").map(Number);
          const endObj = new Date(y, m - 1, d + 1);
          actualEnd = toLocalYYYYMMDD(endObj);
        }

        return {
          id: e.id,
          title: e.title,
          start: actualStart,
          end: actualEnd,
          allDay: isBackground,
          display: "block",
          backgroundColor: milestone ? "transparent" : cColor,
          borderColor: milestone ? "transparent" : cColor,
          classNames: [milestone ? "milestone-invisible-wrapper" : "", isBackground ? "solid-allday-event" : "", e.metadata?.isTentative ? "tentative-event" : ""],
          extendedProps: { ...e, outline, cColor, catObj, isMilestone: milestone, originalStart: actualStart },
        };
      }),
    );
  }, [activeUserId, userProfile, categories, setCategories]);

  // 単一予定の削除
  const deleteEvent = useCallback(
    async (selectedId: string) => {
      const currentLocal = JSON.parse(localStorage.getItem("events") || "[]");
      const updatedLocal = currentLocal.filter((ev: any) => ev.id !== selectedId);
      localStorage.setItem("events", JSON.stringify(updatedLocal));

      const isPremiumUser = activeUserId === "YOUR_SUPABASE_USER_UID" || userProfile?.isPremium === true;
      if (isPremiumUser) {
        await (supabase.from("events") as any).delete().eq("id", selectedId);
      }

      try {
        const { LocalNotifications } = require("@capacitor/local-notifications");
        if (selectedId) {
          await LocalNotifications.cancel({ notifications: [{ id: parseInt(selectedId.replace(/\D/g, "") || "0") }] });
        }
      } catch (error) {
        console.warn("通知のキャンセルに失敗しました", error);
      }

      await fetchEvents();
    },
    [activeUserId, userProfile, fetchEvents],
  );

  // 予定の一括削除
  const bulkDeleteEvents = useCallback(
    async (selectedIds: string[]) => {
      const currentLocal = JSON.parse(localStorage.getItem("events") || "[]");
      const updatedLocal = currentLocal.filter((ev: any) => !selectedIds.includes(ev.id));
      localStorage.setItem("events", JSON.stringify(updatedLocal));

      const isPremiumUser = activeUserId === "YOUR_SUPABASE_USER_UID" || userProfile?.isPremium === true;
      if (isPremiumUser) {
        for (const id of selectedIds) {
          await (supabase.from("events") as any).delete().eq("id", id);
        }
      }

      try {
        const { LocalNotifications } = require("@capacitor/local-notifications");
        const notificationsToCancel = selectedIds.map((id) => ({
          id: parseInt(id.replace(/\D/g, "") || "0"),
        }));
        if (notificationsToCancel.length > 0) {
          await LocalNotifications.cancel({ notifications: notificationsToCancel });
        }
      } catch (error) {
        console.warn("通知の一括キャンセルに失敗しました", error);
      }

      await fetchEvents();
    },
    [activeUserId, userProfile, fetchEvents],
  );

  return {
    events,
    setEvents,
    fetchEvents,
    deleteEvent,
    bulkDeleteEvents,
  };
}