"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import { Train, Footprints, MapPin, Clock, Star, Inbox, Settings, Settings2, Trash2, TrendingUp, TrendingDown, Target, History, PieChart, Image as ImageIcon, Repeat, Pin, Database, Palette, Gift, Calendar as CalendarIcon, Zap, Home, Edit3, Flag, Monitor, Dumbbell, Beer, Circle, Search, Calendar, Plane, Bus, FileText, Sun, Moon, CreditCard, Check, CheckCircle, Banknote, BookOpen, Users, Download, Share2, Sparkles, Unlock, Lock, Globe, Store, Smartphone, Landmark, ChevronUp, ChevronDown, Handshake, User, Bell } from "lucide-react";

import { DAY_NAMES, HOURS, MINUTES, INITIAL_PRESETS, VIEW_OPTIONS, FIELD_TYPES } from "@/app/lib/constants";
import { hexToRgba, toLocalYYYYMMDD } from "@/app/lib/utils";
import CategoryStudio from "@/app/components/CategoryStudio";
import Sidebar from "@/app/components/Sidebar";
import ProfileImageCropper from "@/app/components/ProfileImageCropper";
import AuthScreen from "@/app/components/AuthScreen";
import { requestNotificationPermission, scheduleEventNotification } from "@/app/lib/notifications";
import { syncDataToWidget } from "@/app/lib/widgetSync";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/app/lib/supabase";
import { createDataBackup } from "@/app/lib/backup";
import { registerPlugin } from "@capacitor/core";
import { loadData as storageLoadData, saveData } from "@/app/lib/storage";
import { App as CapacitorApp } from "@capacitor/app";
import AdvanceModal from "@/app/components/modals/AdvanceModal";
import TemplateModal from "@/app/components/modals/TemplateModal";
import DailyStoryModal from "@/app/components/modals/DailyStoryModal";
import RoutineModal from "@/app/components/modals/RoutineModal";
import FinanceModal from "@/app/components/modals/FinanceModal";
import ProfileModal from "@/app/components/modals/ProfileModal";
import EventModal from "@/app/components/modals/EventModal";
import Header from "@/app/components/layout/Header";
import DayCircleView from "@/app/components/calendar/DayCircleView";
import { useWageCalculator } from "@/app/hooks/useWageCalculator";
import { useEvents } from "@/app/hooks/useEvents";
import { useCalendarEvents } from "@/app/hooks/useCalendarEvents";
import CalendarBoard from "@/app/components/calendar/CalendarBoard";

export default function SmartLifeOS() {
  const { calculateWage } = useWageCalculator();
  const [activeUserId, setActiveUserId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const isNativeApp = Capacitor.isNativePlatform();
      if (!isNativeApp && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
        return "ここにコピーしたUIDを貼り付けてください";
      }
      const session = localStorage.getItem("os_active_session");
      return session ? JSON.parse(session).id : null;
    }
    return null;
  });

  const loadData = (key: string, defaultData: any) => {
    return storageLoadData(key, activeUserId, defaultData);
  };

  const [activeUserAvatar, setActiveUserAvatar] = useState<string>("");

  useEffect(() => {
    if (activeUserId) {
      const savedAvatar = storageLoadData("user_avatar", activeUserId, "");
      setActiveUserAvatar(savedAvatar);
    }
  }, [activeUserId]);

  const [anniversaries, setAnniversaries] = useState<{ title: string; date: string; color: string }[]>(() => loadData("os_anniversaries", []));
  const [monthlyRoutines, setMonthlyRoutines] = useState<{ title: string; day: number; color: string; adjust?: string; type?: string }[]>(() => loadData("os_routines", []));
  const [subs, setSubs] = useState<any[]>(() => loadData("os_subs", []));
  const [weeklyTimetables, setWeeklyTimetables] = useState<any[]>([]);
  const [viewType, setViewType] = useState("dayGridMonth");
  const [calendarCategoryFilter, setCalendarCategoryFilter] = useState("すべて");
  const [displayMode, setDisplayMode] = useState("normal");
  const [currentYear, setCurrentYear] = useState("");
  const [currentMonthNum, setCurrentMonthNum] = useState("");
  const [timetableTerms, setTimetableTerms] = useState<any[]>([]);
  const [exceptionDays, setExceptionDays] = useState<Record<string, "class" | "off">>(() => loadData("os_exceptionDays", {}));
  const [holidays, setHolidays] = useState<Record<string, string>>(() => loadData("os_holidays", {}));
  const [canceledClasses, setCanceledClasses] = useState<string[]>(() => loadData("os_canceledClasses", []));
  const [walkTime, setWalkTime] = useState(() => loadData("os_walkTime", "10"));
  const currentY = new Date().getFullYear();
  const DEFAULT_CATEGORIES = [
    { name: "仕事", color: "#4D96FF", fields: [{ id: "wage_1", name: "給与計算", type: "wage", wageRules: [{ start: "00:00", end: "23:59", wage: "1000" }] }] },
    { name: "飲み", color: "#FF6B6B", fields: [{ id: "f1", name: "飲んだ杯数", type: "number", unit: "杯" }] },
    { name: "趣味", color: "#1DD1A1", fields: [] },
    { name: "スポーツ観戦", color: "#f59e0b", allowPhoto: true, fields: [{ id: "score_1", name: "試合結果 (応援チーム - 相手)", type: "score" }] },
  ];
  const [categories, setCategories] = useState<any[]>(() => loadData("os_categories", DEFAULT_CATEGORIES));

  // ユーザープロフィールのState（eventsより前で初期化）
  const [userProfile, setUserProfile] = useState(() => loadData("user_profile", { email: "", phone: "", avatar: "" }));

  // 予定管理カスタムフック（categories と userProfile の直後で実行）
  const { events, setEvents, fetchEvents, deleteEvent, bulkDeleteEvents } = useEvents({
    activeUserId,
    userProfile,
    categories,
    setCategories,
  });

  // カレンダー表示イベント生成カスタムフック
  const { displayEvents, anniversaryEvents, routineEvents } = useCalendarEvents({
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
  });

  const [themeColor, setThemeColor] = useState<string>(() => loadData("os_themeColor", "#4D96FF"));
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [userColors, setUserColors] = useState<string[]>(() => loadData("os_userColors", []));
  const [customColorCursor, setCustomColorCursor] = useState("#000000");
  const [isEditingColors, setIsEditingColors] = useState(false);
  const [currentDayNum, setCurrentDayNum] = useState("");
  const [currentWeekStartStr, setCurrentWeekStartStr] = useState("");

  const [viewFilter, setViewFilter] = useState("すべて");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(0);

  const [isViewSelectorOpen, setIsViewSelectorOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isViewSelectorExpanded, setIsViewSelectorExpanded] = useState(false);

  const [openSections, setOpenSections] = useState<string[]>(["settings", "countdown"]);
  const [nickname, setNickname] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [overlapMode, setOverlapMode] = useState("compact");
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);

  const [isMounted, setIsMounted] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const isSwipingRef = useRef(false);
  const blockCalendarClick = useRef(false);
  const wasEventSelectedRef = useRef(false);

  useEffect(() => {
    const recordSelection = () => {
      wasEventSelectedRef.current = !!(document.querySelector(".fc-event-selected") || document.querySelector(".fc-event-resizer"));
    };
    document.addEventListener("touchstart", recordSelection, { capture: true, passive: true });
    document.addEventListener("mousedown", recordSelection, { capture: true, passive: true });
    return () => {
      document.removeEventListener("touchstart", recordSelection, { capture: true } as any);
      document.removeEventListener("mousedown", recordSelection, { capture: true } as any);
    };
  }, []);

  const isDraggingRef = useRef(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState<boolean>(true);

  useEffect(() => {
    const saved = localStorage.getItem("user_notification_enabled");
    if (saved !== null) {
      setIsNotificationEnabled(saved !== "false");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("user_notification_enabled", String(isNotificationEnabled));
  }, [isNotificationEnabled]);

  // 🌟 最適化: 予定データ本体(events)が更新された時のみ同期を発火（画面切り替え時の不要な通信をカット）
  useEffect(() => {
    if (!isDataLoaded || !events || events.length === 0) return;

    const timer = setTimeout(() => {
      try {
        if (typeof window === "undefined" || !Capacitor.isNativePlatform()) return;

        const todayStr = toLocalYYYYMMDD(new Date());
        const uniqueEventsMap = new Map();

        events
          .filter((e: any) => {
            const startStr = typeof e.start === "string" ? e.start.split("T")[0] : toLocalYYYYMMDD(new Date(e.start));
            return startStr >= todayStr && !e.extendedProps?.metadata?.isPureFinance;
          })
          .forEach((e: any) => {
            if (e.extendedProps?.isTravel || String(e.id).includes("-travel") || String(e.id).includes("-transit")) return;

            const key = `${e.title}_${e.start}`;
            if (!uniqueEventsMap.has(key)) {
              uniqueEventsMap.set(key, e);
            }
          });

        const widgetEvents = Array.from(uniqueEventsMap.values())
          .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime())
          .slice(0, 10)
          .map((e: any) => ({
            id: String(e.id).substring(0, 8),
            title: String(e.title || "予定").substring(0, 15),
            start: typeof e.start === "string" ? e.start : new Date(e.start).toISOString(),
            end: e.end ? (typeof e.end === "string" ? e.end : new Date(e.end).toISOString()) : null,
            extendedProps: {
              cColor: e.extendedProps?.cColor || e.backgroundColor || "#3b82f6",
              metadata: {
                isAllDayBackground: e.extendedProps?.metadata?.isAllDayBackground || false,
                isTransit: e.extendedProps?.metadata?.customFields?.isTransit || e.extendedProps?.metadata?.isTransit || false,
                transitType: e.extendedProps?.metadata?.customFields?.transitType || e.extendedProps?.metadata?.transitType || "train",
                transitDepTime: e.extendedProps?.metadata?.customFields?.transitDepTime || e.extendedProps?.metadata?.transitDepTime,
                transitArrTime: e.extendedProps?.metadata?.customFields?.transitArrTime || e.extendedProps?.metadata?.transitArrTime,
                hasReturnTransit: e.extendedProps?.metadata?.customFields?.hasReturnTransit || e.extendedProps?.metadata?.hasReturnTransit || false,
                returnTransitType: e.extendedProps?.metadata?.customFields?.returnTransitType || e.extendedProps?.metadata?.returnTransitType || "train",
                returnTransitDepTime: e.extendedProps?.metadata?.customFields?.returnTransitDepTime || e.extendedProps?.metadata?.returnTransitDepTime,
                returnTransitArrTime: e.extendedProps?.metadata?.customFields?.returnTransitArrTime || e.extendedProps?.metadata?.returnTransitArrTime,
              },
            },
          }));

        if (widgetEvents.length === 0) return;

        const jsonString = JSON.stringify(widgetEvents);
        const encodedData = encodeURIComponent(jsonString);

        const url = `smartlifeos://widget?data=${encodedData}`;
        const link = document.createElement("a");
        link.href = url;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log("✅ [Widget Sync] データ送信完了:", widgetEvents.length, "件");
      } catch (e) {
        console.error("❌ Widget sync failed", e);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [events, isDataLoaded]);

  // 🌟 【バグ修正】週カレンダー未選択状態からの追加 ＆ removeエラー修正
  useEffect(() => {
    if (typeof window !== "undefined" && Capacitor.isNativePlatform()) {
      let listenerHandle: any = null;

      CapacitorApp.addListener("appUrlOpen", (data: any) => {
        // 🌟 追加：URLスキームによる各カレンダーへのダイレクト遷移
        if (data.url && data.url.includes("month")) {
          setViewType("dayGridMonth");
          calendarRef.current?.getApi().changeView("dayGridMonth");
          return;
        } else if (data.url && data.url.includes("week")) {
          setViewType("timeGridWeek");
          calendarRef.current?.getApi().changeView("timeGridWeek");
          return;
        } else if (data.url && data.url.includes("today")) {
          setViewType("timeGridDay");
          calendarRef.current?.getApi().changeView("timeGridDay");
          calendarRef.current?.getApi().today();
          return;
        }

        if (data.url && data.url.includes("add-event")) {
          const today = toLocalYYYYMMDD(new Date());
          setMode("create");
          setSelectedId(null);
          setStartDate(today);
          setEndDate(today);

          const nowH = new Date().getHours();
          setStartH(String(nowH).padStart(2, "0"));
          setStartM("00");
          setEndH(String(Math.min(nowH + 1, 23)).padStart(2, "0"));
          setEndM("00");

          setTitle("");
          setLocation("");
          setCategoryName(categories[0]?.name || "仕事");
          setEventColor(categories[0]?.color || "#3b82f6");
          setMemo("");
          setPhotoUrls([]);
          setRating(0);
          setIsPinned(false);
          setIsTentative(false);
          setIsAllDayBackground(false);
          setIsMilestone(false);
          setIsGathering(false);
          setCustomFieldsData({});

          setIsModalOpen(true);
        }
      }).then((handle) => {
        listenerHandle = handle;
      });

      return () => {
        if (listenerHandle) {
          listenerHandle.remove();
        }
      };
    }
  }, [categories]);

  const handleTouchStart = (e: React.TouchEvent) => {
    // ガードを撤廃し、開始位置だけを記録する（範囲選択を妨害しない）
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDraggingRef.current) return;
    if ((e.target as HTMLElement).closest(".fc-event")) return;

    // 範囲選択中（マス目が青くハイライトされている状態）はスワイプ画面遷移を絶対に発動させない
    if (document.querySelector(".fc-highlight")) return;

    if (touchStartX.current === null || touchStartY.current === null) return;
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;

    const diffX = touchEndX.current - touchStartX.current;
    const diffY = touchEndY.current - touchStartY.current;

    // 🌟 修正：スワイプの閾値を少し広げ、ドラッグ中に誤爆しないようにする
    if (Math.abs(diffX) > 40 || Math.abs(diffY) > 40) {
      isSwipingRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null || touchStartY.current === null || touchEndY.current === null) {
      touchStartX.current = null;
      touchEndX.current = null;
      touchStartY.current = null;
      touchEndY.current = null;
      setTimeout(() => {
        isSwipingRef.current = false;
      }, 100);
      return;
    }

    if (isSwipingRef.current) {
      const diffX = touchEndX.current - touchStartX.current;
      const diffY = touchEndY.current - touchStartY.current;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        // 🌟 修正：スワイプ成立の判定を 80px に厳しくし、範囲選択と完全に共存させる
        if (diffX > 80) {
          let startRelativeX = touchStartX.current;
          const container = document.querySelector(".fixed-mobile-frame");
          if (container) startRelativeX = touchStartX.current - container.getBoundingClientRect().left;
          if (startRelativeX < 40) setIsSidebarOpen(true);
          else calendarRef.current?.getApi().prev();
        } else if (diffX < -80) {
          calendarRef.current?.getApi().next();
        }
      } else {
        if (viewType === "timeGridDay") {
          if (diffY > 80) {
            // 縦スワイプも厳しく
            const api = calendarRef.current?.getApi();
            if (api) {
              const d = api.getDate();
              d.setDate(d.getDate() - 7);
              api.gotoDate(d);
            }
          } else if (diffY < -80) {
            const api = calendarRef.current?.getApi();
            if (api) {
              const d = api.getDate();
              d.setDate(d.getDate() + 7);
              api.gotoDate(d);
            }
          }
        }
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
    touchEndY.current = null;
    setTimeout(() => {
      isSwipingRef.current = false;
    }, 100);
  };
  const [activeUserName, setActiveUserName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const isNativeApp = Capacitor.isNativePlatform();
      if (!isNativeApp && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
        return "開発テストユーザー";
      }
      const session = localStorage.getItem("os_active_session");
      return session ? JSON.parse(session).name : "";
    }
    return "";
  });
  const [isFinanceGraphOpen, setIsFinanceGraphOpen] = useState(false);
  const [isScheduleAssistantOpen, setIsScheduleAssistantOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [timetableTab, setTimetableTab] = useState<number>(1);
  const [newTermStart, setNewTermStart] = useState("");
  const [newTermEnd, setNewTermEnd] = useState("");

  useEffect(() => {
    if (isDataLoaded) saveData("os_canceledClasses", activeUserId, canceledClasses);
  }, [canceledClasses, isDataLoaded, activeUserId]);

  const [companions, setCompanions] = useState<string[]>([]);
  const [companionInput, setCompanionInput] = useState("");
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [storyDate, setStoryDate] = useState<string | null>(null);

  const [newTermName, setNewTermName] = useState("");
  const [editTimetableId, setEditTimetableId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [editTemplateIndex, setEditTemplateIndex] = useState<number | null>(null);
  const [templateForm, setTemplateForm] = useState<any>({});
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPanX, setCropPanX] = useState(50);
  const [cropPanY, setCropPanY] = useState(50);
  const [cropDragStart, setCropDragStart] = useState<{ x: number; y: number } | null>(null);
  const [touchDist, setTouchDistance] = useState<number | null>(null);

  const [advanceTab, setAdvanceTab] = useState<"unsettled" | "settled" | "partners">("unsettled");
  const [viewingPartner, setViewingPartner] = useState<string | null>(null);
  const [customPayees, setCustomPayees] = useState<string[]>(() => loadData("os_customPayees", []));
  const [newPayeeName, setNewPayeeName] = useState("");
  const [isTentative, setIsTentative] = useState(false);
  const [graphSpan, setGraphSpan] = useState<"month" | "week">("month");
  const [assistMode, setAssistMode] = useState<"send" | "receive">("send");
  const [assistTimeSlots, setAssistTimeSlots] = useState<string[]>([]);
  const [generatedText, setGeneratedText] = useState("");
  const [receiveText, setReceiveText] = useState("");

  const handleLogout = () => {
    if (confirm("ログアウトしますか？（ログアウトすると端末枠が1つ空きます）")) {
      const savedUsers = localStorage.getItem("os_local_users");
      const deviceId = localStorage.getItem("os_device_id");
      if (savedUsers && deviceId && activeUserId) {
        const users = JSON.parse(savedUsers);
        const updatedUsers = users.map((u: any) => {
          if (u.id === activeUserId) {
            return { ...u, devices: (u.devices || []).filter((d: string) => d !== deviceId) };
          }
          return u;
        });
        localStorage.setItem("os_local_users", JSON.stringify(updatedUsers));
      }
      localStorage.removeItem("os_active_session");
      setActiveUserId(null);
      setActiveUserName("");
    }
  };

  const [templates, setTemplates] = useState<any[]>([]);

  // ★ CategoryStudio用のState
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [isAnniversaryModalOpen, setIsAnniversaryModalOpen] = useState(false);
  const [newAnnivTitle, setNewAnnivTitle] = useState("");
  const [newAnnivMonth, setNewAnnivMonth] = useState("01");
  const [newAnnivDay, setNewAnnivDay] = useState("01");
  const [newAnnivColor, setNewAnnivColor] = useState("#FF9FF3");
  const [editAnnivIndex, setEditAnnivIndex] = useState<number | null>(null);

  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [newRoutineDay, setNewRoutineDay] = useState("25");
  const [newRoutineTitle, setNewRoutineTitle] = useState("");
  const [newRoutineType, setNewRoutineType] = useState("task");
  const [routineAmount, setRoutineAmount] = useState("");
  const [routineBonusAmount, setRoutineBonusAmount] = useState("");
  const [newRoutineColor, setNewRoutineColor] = useState("#FECA57");
  const [editRoutineIndex, setEditRoutineIndex] = useState<number | null>(null);
  // 👇 追加：ルーティンの周期
  const [newRoutineCycle, setNewRoutineCycle] = useState<"monthly" | "weekly" | "daily">("monthly");
  const [newRoutineDayOfWeek, setNewRoutineDayOfWeek] = useState("1"); // 1:月曜
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [analyticsSpan, setAnalyticsSpan] = useState<"month" | "year" | "pie_month" | "pie_year">("month");
  const [summarySpan, setSummarySpan] = useState<"month" | "year">("month");
  const [analyticsCat, setAnalyticsCat] = useState<string>("");
  // ダッシュボードを開いた時、自動的に「今年の今の月」がセットされるように修正
  const [analyticsYear, setAnalyticsYear] = useState(() => String(new Date().getFullYear()));
  const [analyticsMonth, setAnalyticsMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, "0"));
  const [visibleDashboardFields, setVisibleDashboardFields] = useState<Record<string, boolean>>({});

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryCategory, setGalleryCategory] = useState("すべて");

  const [externalCals, setExternalCals] = useState([
    {
      id: "ext1",
      name: "🎸 アーティスト公式情報",
      color: "#ec4899",
      active: false,
      events: [
        { title: "🎫 チケット先行", date: "2026-05-10" },
        { title: "🎤 東京ドーム公演", date: "2026-05-25" },
      ],
    },
    { id: "ext2", name: "⚽️ スポーツ・地域情報", color: "#0ea5e9", active: false, events: [{ title: "⚽️ ホーム戦", date: "2026-05-18" }] },
  ]);

  const [visibilityMode, setVisibilityMode] = useState<"all" | "public" | "private">("all");
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);

  const [aiUrl, setAiUrl] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const MOCK_MARKET_TEMPLATES = [
    { id: "m1", title: "ガチ筋トレ記録セット", author: "FitnessPro", downloads: 1240, color: "#f59e0b", desc: "部位別の重量と回数を記録するカスタムフィールド付き" },
    { id: "m2", title: "フリーランス確定申告用", author: "TaxMaster", downloads: 3500, color: "#3b82f6", desc: "経費と売上を自動仕分けする事業用カテゴリセット" },
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);

  // 💸 支出・サブスク専用のState
  const [expenseAmount, setExpenseAmount] = useState("");
  const [subName, setSubName] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subCycle, setSubCycle] = useState("monthly");
  const [subDate, setSubDate] = useState("1");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<"create" | "detail" | "dayOfWeekBulk" | "routine_detail" | "expense" | "subscription">("create");
  const [clipboardEvent, setClipboardEvent] = useState<any>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [categoryName, setCategoryName] = useState("仕事");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startH, setStartH] = useState("09");
  const [startM, setStartM] = useState("00");
  const [endH, setEndH] = useState("10");
  const [endM, setEndM] = useState("00");
  const [eventColor, setEventColor] = useState("");
  const [isOutline, setIsOutline] = useState(false);
  const [quickTemplates, setQuickTemplates] = useState<any[]>([]);

  useEffect(() => {
    // 🌟 loadData に置き換え
    const defaultTemplates = [
      { title: "プロ野球観戦", startH: "18", startM: "00", endH: "21", endM: "00", categoryName: "スポーツ観戦", eventColor: "#f59e0b", isAllDayBackground: false },
      { title: "飲み会", startH: "19", startM: "00", endH: "21", endM: "00", categoryName: "飲み", eventColor: "#FF6B6B", isAllDayBackground: false },
    ];
    const saved = loadData("os_quickTemplates", defaultTemplates);
    setQuickTemplates(saved);
    if (saved === defaultTemplates) {
      saveData("os_quickTemplates", activeUserId, defaultTemplates);
    }
  }, [activeUserId]);

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [memo, setMemo] = useState("");
  const [rating, setRating] = useState(0);
  const [isPinned, setIsPinned] = useState(false);
  const [isRecordDetailsOpen, setIsRecordDetailsOpen] = useState(false);

  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});
  const [repeatUntil, setRepeatUntil] = useState("");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const [isMilestone, setIsMilestone] = useState(false);
  const [isStocked, setIsStocked] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [homeLocation, setHomeLocation] = useState(() => loadData("os_home", ""));
  const draggableRef = useRef<HTMLDivElement>(null);
  const [isAllDayBackground, setIsAllDayBackground] = useState(false);
  const [useEventColorForTitle, setUseEventColorForTitle] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]); // 👈 初期値を空にする
  const toggleBlock = (b: string) => setExpandedBlocks((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  useEffect(() => {
    // 🌟 loadData に置き換え

    const savedColorSetting = loadData("os_useEventColorForTitle", false);
    setUseEventColorForTitle(savedColorSetting);
  }, [activeUserId]);

  const [targetType, setTargetType] = useState("money_month");
  const [targetValue, setTargetValue] = useState("50000");
  const [targetCategory, setTargetCategory] = useState("");
  const [isGathering, setIsGathering] = useState(false);
  const [gatheringTime, setGatheringTime] = useState("");
  const [departureTime, setDepartureTime] = useState("");
  const [departureType, setDepartureType] = useState("home");
  const [startPointType, setStartPointType] = useState(() => loadData("os_startPointType", "address"));
  const [nearestStation, setNearestStation] = useState(() => loadData("os_station", ""));
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [bulkStartMonth, setBulkStartMonth] = useState("");
  const [bulkEndMonth, setBulkEndMonth] = useState("");
  const [fontFamily, setFontFamily] = useState("standard");
  const [timeFormat, setTimeFormat] = useState("24h");
  const [headerPosition, setHeaderPosition] = useState<"top" | "bottom">(() => loadData("os_headerPosition", "top"));

  useEffect(() => {
    // 🌟 修正：空のデータではなく、ログインしているユーザーの金庫から確実にデータを読み込む
    if (activeUserId) {
      setCategories(loadData("os_categories", DEFAULT_CATEGORIES));
      setUserColors(loadData("os_userColors", []));
      setAnniversaries(loadData("os_anniversaries", []));
      setMonthlyRoutines(loadData("os_routines", []));
      setHomeLocation(loadData("os_home", ""));
      setNearestStation(loadData("os_station", ""));
      setWalkTime(loadData("os_walkTime", "10"));
      setStartPointType(loadData("os_startPointType", "address"));
      setSubs(loadData("os_subs", []));
      setHeaderPosition(loadData("os_headerPosition", "top"));
    }
  }, [activeUserId]);
  useEffect(() => {
    // 🌟 修正：localStorage.getItemを直接叩くとアップデート時にデータが消えるため削除。
    // データは既に各 useState の初期値として loadData で安全に取得されている。
    setIsDataLoaded(true);
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    saveData("os_categories", activeUserId, categories);
    saveData("os_themeColor", activeUserId, themeColor);
    saveData("os_userColors", activeUserId, userColors);
    saveData("os_subs", activeUserId, subs);
    saveData("os_anniversaries", activeUserId, anniversaries);
    saveData("os_routines", activeUserId, monthlyRoutines);
    saveData("os_home", activeUserId, homeLocation);
    saveData("os_station", activeUserId, nearestStation);
    saveData("os_walkTime", activeUserId, walkTime);
    saveData("os_startPointType", activeUserId, startPointType);
    saveData("os_customPayees", activeUserId, customPayees);
    saveData("os_timetables", activeUserId, weeklyTimetables);
    saveData("os_timetableTerms", activeUserId, timetableTerms);
    saveData("os_exceptionDays", activeUserId, exceptionDays);
    saveData("os_headerPosition", activeUserId, headerPosition);
  }, [categories, userColors, anniversaries, monthlyRoutines, homeLocation, nearestStation, walkTime, startPointType, isDataLoaded, themeColor, subs, customPayees, weeklyTimetables, timetableTerms, exceptionDays, headerPosition, activeUserId]);

  const activePresets: string[] = [...INITIAL_PRESETS, ...userColors];

  useEffect(() => {
    if (currentSearchIndex >= 0) {
      const el = document.getElementById(`search-item-${currentSearchIndex}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentSearchIndex]);
  useEffect(() => {
    const setupUrlListener = async () => {
      await CapacitorApp.addListener("appUrlOpen", (data) => {
        console.log("🔗 ウィジェットから起動:", data.url);

        // 新しい画面を開く際、既存のパネルや入力画面が被らないように閉じる
        if (typeof setIsSidebarOpen === "function") setIsSidebarOpen(false);
        if (typeof setIsModalOpen === "function") setIsModalOpen(false);
        if (typeof setIsViewSelectorExpanded === "function") setIsViewSelectorExpanded(false);

        // 少し遅延させることで、カレンダーの準備完了を待ってから確実に向きを変える
        setTimeout(() => {
          const calendarApi = calendarRef.current?.getApi();
          if (!calendarApi) return;

          if (data.url.includes("smartlifeos://today")) {
            setViewType("timeGridDay");
            calendarApi.changeView("timeGridDay"); // 🌟 直接APIを叩いて強制的にViewを変更
            calendarApi.today();
          } else if (data.url.includes("smartlifeos://week")) {
            // ※お使いの週ビューが dayGridWeek の場合は 'timeGridWeek' を 'dayGridWeek' に変更してください
            setViewType("timeGridWeek");
            calendarApi.changeView("timeGridWeek"); // 🌟 直接APIを叩いて強制的にViewを変更
            calendarApi.today();
          }
        }, 100);
      });
    };

    setupUrlListener();

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, []);

  // 🌟 追加：アプリを開いた瞬間（マウント時）に予定を自動で読み込む
  useEffect(() => {
    // 🌟 カテゴリ情報が読み込まれた直後に強制再描画させることで、真っ白になるバグを解消
    if (activeUserId && isDataLoaded && categories.length > 0) {
      fetchEvents();
    }
  }, [activeUserId, isDataLoaded, categories]);

  const handleDelete = async () => {
    if (confirm("本当に削除しますか？")) {
      if (customFieldsData.isTimetableEvent && selectedId) {
        setCanceledClasses([...canceledClasses, selectedId]);
        setIsModalOpen(false);
        return;
      }
      if (selectedId) {
        await deleteEvent(selectedId);
      }
      setIsModalOpen(false);
    }
  };

  const handleDuplicate = () => {
    setClipboardEvent({
      title,
      location,
      categoryName,
      startH,
      startM,
      endH,
      endM,
      eventColor,
      isOutline,
      customFieldsData,
      photoUrls,
      memo,
      rating,
      isPinned,
      isAllDayBackground,
      isMilestone,
      isGathering,
      gatheringTime,
      departureTime,
      departureType,
      startDate,
      endDate,
    });
    setIsModalOpen(false);
  };

  const handleQuickSave = async (t: any) => {
    // 省略（後ほど全体保存ロジックに統合可能ですが、今回はそのまま残します）
  };

  const applyTemplate = (t: any) => {
    setTitle(t.title);
    setCategoryName(t.categoryName);
    setStartH(t.startH);
    setStartM(t.startM);
    setEventColor(t.eventColor);
    setIsOutline(t.isOutline);
    setIsMilestone(t.isMilestone || false);
    setMemo(t.memo || "");
    setRating(t.rating || 0);
    setIsPinned(t.isPinned || false);
  };

  const syncWithCloud = async () => {
    alert("【同期準備完了】\n現在はローカルモードで動作しています。\n次回、アカウント機能（ログイン画面）を実装すると、ここにクラウド同期の処理が連携されます！");
  };

  const handleAiExtraction = async () => {
    if (!aiUrl.trim()) return alert("URLを入力してください");
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      const today = toLocalYYYYMMDD(new Date());
      setMode("create");
      setStartDate(today);
      setEndDate(today);
      setStartH("18");
      setStartM("30");
      setEndH("21");
      setEndM("00");
      setTitle("✨ AI抽出: サカナクション ライブツアー");
      setLocation("幕張メッセ");
      setMemo(`【AIによる自動抽出データ】\n参照元URL: ${aiUrl}\n\nチケット代: 8,800円 (別途システム手数料)`);
      setEventColor("#ec4899");

      const targetCat = categories.find((c) => c.name.includes("趣味")) ? "趣味" : categories.length > 0 ? categories[0].name : "";
      setCategoryName(targetCat);

      setIsModalOpen(true);
      setIsSidebarOpen(false);
      setAiUrl("");
      alert("AIがURLから予定の情報を抽出しました！内容を確認して保存してください。");
    }, 1500);
  };

  const handleAddAnniversary = () => {
    if (!newAnnivTitle.trim()) return;
    const mmdd = `${newAnnivMonth.padStart(2, "0")}-${newAnnivDay.padStart(2, "0")}`;
    if (editAnnivIndex !== null) {
      const updatedArr = [...anniversaries];
      updatedArr[editAnnivIndex] = { title: newAnnivTitle.trim(), date: mmdd, color: newAnnivColor };
      setAnniversaries(updatedArr);
      setEditAnnivIndex(null);
    } else {
      setAnniversaries([...anniversaries, { title: newAnnivTitle.trim(), date: mmdd, color: newAnnivColor }]);
    }
    setNewAnnivTitle("");
    setNewAnnivMonth("01");
    setNewAnnivDay("01");
    setIsAnniversaryModalOpen(false);
  };

  const handleAddRoutine = () => {
    if (!newRoutineTitle.trim()) return;
    const dNum = Number(newRoutineDay);
    const newRoutine = { title: newRoutineTitle.trim(), day: dNum, color: newRoutineColor, type: newRoutineType, cycle: newRoutineCycle, dayOfWeek: Number(newRoutineDayOfWeek) };

    if (editRoutineIndex !== null) {
      const updatedArr = [...monthlyRoutines];
      updatedArr[editRoutineIndex] = { ...newRoutine, adjust: updatedArr[editRoutineIndex].adjust };
      setMonthlyRoutines(updatedArr);
      setEditRoutineIndex(null);
    } else {
      setMonthlyRoutines([...monthlyRoutines, newRoutine]);
    }
    setNewRoutineTitle("");
    setNewRoutineDay("25");
    setNewRoutineType("task");
    setNewRoutineCycle("monthly");
    setIsRoutineModalOpen(false);
  };

  const handleCompleteRoutine = async () => {
    const todayStr = toLocalYYYYMMDD(new Date());
    const payload = {
      user_id: activeUserId, // 🌟 追加：誰の予定かを指定
      title: `${title} (達成)`,
      category: "ルーティン達成",
      start_at: new Date(`${todayStr}T12:00:00`).toISOString(),
      end_at: new Date(`${todayStr}T13:00:00`).toISOString(),
      metadata: { isRoutineCompletion: true, routineTitle: title },
    };
    await supabase.from("events").insert([payload] as any); // 🌟
    setIsModalOpen(false);
    fetchEvents();
  };

  const handleRecordRoutineMoney = async () => {
    const totalAmount = Number(routineAmount || 0) + Number(routineBonusAmount || 0);
    if (totalAmount <= 0) return alert("金額を入力してください");

    const todayStr = toLocalYYYYMMDD(new Date());
    const isIncome = customFieldsData.routineType === "income";
    const payload = {
      user_id: activeUserId,
      title: `${title}${routineBonusAmount ? " (特別支給含む)" : ""}`,
      category: "収支記録",
      start_at: new Date(`${todayStr}T10:00:00`).toISOString(),
      end_at: new Date(`${todayStr}T11:00:00`).toISOString(),
      metadata: {
        customColor: eventColor,
        customFields: {
          isIncomeSet: isIncome,
          standardIncomeAmount: isIncome ? String(totalAmount) : "",
          isSalary: isIncome, // 👈 追加：これを「給料」としてマークし、二重計上を防ぐ
          isExpenseSet: !isIncome,
          standardExpenseAmount: !isIncome ? String(totalAmount) : "",
          paymentMethod: !isIncome ? "bank" : undefined, // 支出ならデフォルト口座引落
        },
      },
    };
    await supabase.from("events").insert([payload] as any); // 🌟 as any を追加
    setIsModalOpen(false);
    fetchEvents();
    setRoutineAmount("");
    setRoutineBonusAmount("");
    alert(`${isIncome ? "収入" : "支出"}を帳簿に記録しました！`);
  };

  const executeBulkDelete = async () => {
    if (selectedForDelete.length === 0) return alert("削除する予定を選択してください。");
    if (confirm(`選択した ${selectedForDelete.length} 件の予定を本当に削除しますか？`)) {
      await bulkDeleteEvents(selectedForDelete);
      setIsDeleteMode(false);
      setSelectedForDelete([]);
    }
  };

  const jumpToEvent = (evt: any) => {
    const d = new Date(evt.start);
    setCurrentYear(String(d.getFullYear()));
    setCurrentMonthNum(String(d.getMonth() + 1));
    setCurrentDayNum(String(d.getDate()));
    if (viewType === "timeGridWeek") {
      const start = new Date(d);
      start.setDate(start.getDate() - ((start.getDay() - firstDayOfWeek + 7) % 7));
      calendarRef.current?.getApi().gotoDate(start);
    } else calendarRef.current?.getApi().gotoDate(d);
  };

  const handleSearchExecute = () => {
    if (!searchQuery.trim()) return (setSearchResults([]), setCurrentSearchIndex(-1));
    const lowerQ = searchQuery.toLowerCase();
    const results = events
      .filter((e: any) => {
        const tMatch = e.title.toLowerCase().includes(lowerQ);
        const locMatch = (e.extendedProps.metadata?.location || "").toLowerCase().includes(lowerQ);
        const catMatch = (e.extendedProps.category || "").toLowerCase().includes(lowerQ);
        const fieldMatch = e.extendedProps.metadata?.customFields && Object.values(e.extendedProps.metadata.customFields).some((val: any) => (typeof val === "object" && val !== null ? Object.values(val).some((v: any) => String(v).toLowerCase().includes(lowerQ)) : String(val).toLowerCase().includes(lowerQ)));
        return tMatch || locMatch || catMatch || fieldMatch;
      })
      .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());

    setSearchResults(results);
    if (results.length > 0) {
      setCurrentSearchIndex(0);
      jumpToEvent(results[0]);
    } else {
      setCurrentSearchIndex(-1);
      alert("該当する予定が見つかりませんでした");
    }
  };

  const nextSearchResult = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIdx);
    jumpToEvent(searchResults[nextIdx]);
  };
  const prevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIdx);
    jumpToEvent(searchResults[prevIdx]);
  };

  const handleToday = () => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    api.today();
    const d = api.getDate();
    setCurrentYear(String(d.getFullYear()));
    setCurrentMonthNum(String(d.getMonth() + 1));
    setCurrentDayNum(String(d.getDate()));
    if (viewType === "timeGridWeek") {
      const start = new Date(d);
      start.setDate(start.getDate() - ((start.getDay() - firstDayOfWeek + 7) % 7));
      calendarRef.current?.getApi().gotoDate(start);
    }
  };

  const getWeeksOfMonth = () => {
    if (!currentYear || !currentMonthNum) return [];
    const weeks: { dateStr: string; label: string }[] = [];
    const start = new Date(Number(currentYear), Number(currentMonthNum) - 1, 1);
    start.setDate(start.getDate() - ((start.getDay() - firstDayOfWeek + 7) % 7));
    let current = new Date(start);
    let weekNum = 1;
    while (current.getMonth() === Number(currentMonthNum) - 1 || weekNum === 1) {
      const endOfWeek = new Date(current);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      const label = `第${weekNum}週 (${current.getMonth() + 1}/${current.getDate()}〜${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()})`;
      weeks.push({ dateStr: toLocalYYYYMMDD(current), label });
      current.setDate(current.getDate() + 7);
      weekNum++;
    }
    return weeks;
  };

  const getDaysOfMonth = () => {
    if (!currentYear || !currentMonthNum) return [];
    return Array.from({ length: new Date(Number(currentYear), Number(currentMonthNum), 0).getDate() }, (_, i: number) => {
      const d = i + 1;
      const dateObj = new Date(Number(currentYear), Number(currentMonthNum) - 1, d);
      return { value: String(d), label: `${d}(${DAY_NAMES[dateObj.getDay()]})` };
    });
  };

  const handleYearMonthChange = (y: string, m: string) => {
    setCurrentYear(y);
    setCurrentMonthNum(m);
    if (viewType === "timeGridWeek") {
      const firstDate = new Date(Number(y), Number(m) - 1, 1);
      firstDate.setDate(firstDate.getDate() - ((firstDate.getDay() - firstDayOfWeek + 7) % 7));
      calendarRef.current?.getApi().gotoDate(firstDate);
    } else calendarRef.current?.getApi().gotoDate(`${y}-${m.padStart(2, "0")}-01`);
  };

  const handleDayChange = (day: string) => {
    setCurrentDayNum(day);
    calendarRef.current?.getApi().gotoDate(`${currentYear}-${currentMonthNum.padStart(2, "0")}-${day.padStart(2, "0")}`);
    setIsDayPickerOpen(false);
  };

  const handleDayHeaderClick = (dayIndex: number) => {
    setMode("dayOfWeekBulk");
    setSelectedDays([dayIndex]);
    const curMonth = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}`;
    setBulkStartMonth(curMonth);
    setBulkEndMonth(curMonth);
    setTitle("");
    setLocation("");
    setEventColor("");
    setIsOutline(false);
    setCustomFieldsData({});
    setPhotoUrls([]);
    setIsMilestone(false);
    setMemo("");
    setRating(0);
    setIsPinned(false);
    setStartH("09");
    setStartM("00");
    setEndH("10");
    setEndM("00");
    setIsModalOpen(true);
  };
  // 👇 重なりレベル計算関数（特定のイベントが他のイベントとどれだけ重なっているか）
  const calculateOverlapLevel = (event: any, events: any[]) => {
    if (events.length === 0) return 0;

    // イベントを開始時間順にソート（すでにされている前提）
    const sortedEvents = [...events];

    // 自分自身のインデックスを取得
    const eventIndex = sortedEvents.findIndex((e) => e.id === event.id);
    if (eventIndex === -1) return 0;

    let overlapCount = 0;
    const currentStart = new Date(event.start).getTime();

    // 自分より前のイベントとの重なりを調べる
    for (let i = 0; i < eventIndex; i++) {
      const prevEvent = sortedEvents[i];
      const prevEnd = new Date(prevEvent.end || new Date(prevEvent.start).getTime() + 3600000).getTime();

      if (prevEnd > currentStart) {
        overlapCount++;
      }
    }
    return overlapCount;
  };

  const handleSelect = (info: any) => {
    if (isDeleteMode) return;
    setIsViewSelectorExpanded(false);

    // 🌟 修正：スワイプ中なら予定入力をキャンセルし、タップ時のみ通す
    if (isSwipingRef.current) {
      isSwipingRef.current = false;
      return;
    }

    touchStartX.current = null;
    touchEndX.current = null;
    isSwipingRef.current = false;

    if (clipboardEvent) {
      setMode("create");
      const pasteStart = info.start;
      setStartDate(toLocalYYYYMMDD(pasteStart));

      // 👇 修正：元の予定の日数（期間）を計算して終了日に反映する！
      const origStart = new Date(clipboardEvent.startDate);
      const origEnd = new Date(clipboardEvent.endDate);
      const diffDays = Math.round((origEnd.getTime() - origStart.getTime()) / 86400000) || 0;
      const newEnd = new Date(pasteStart);
      newEnd.setDate(newEnd.getDate() + diffDays);
      setEndDate(toLocalYYYYMMDD(newEnd));

      setTitle(clipboardEvent.title);
      setLocation(clipboardEvent.location);
      setCategoryName(clipboardEvent.categoryName);
      setEventColor(clipboardEvent.eventColor);
      setIsOutline(clipboardEvent.isOutline);
      setCustomFieldsData(clipboardEvent.customFieldsData);
      setPhotoUrls(clipboardEvent.photoUrls);
      setMemo(clipboardEvent.memo);
      setRating(clipboardEvent.rating);
      setIsPinned(clipboardEvent.isPinned);
      setIsMilestone(clipboardEvent.isMilestone);
      setIsAllDayBackground(clipboardEvent.isAllDayBackground);
      setIsGathering(clipboardEvent.isGathering);
      setGatheringTime(clipboardEvent.gatheringTime);
      setDepartureTime(clipboardEvent.departureTime);
      setDepartureType(clipboardEvent.departureType);

      setStartH(clipboardEvent.startH);
      setStartM(clipboardEvent.startM);
      setEndH(clipboardEvent.endH);
      setEndM(clipboardEvent.endM);

      setClipboardEvent(null);
      setIsModalOpen(true);
      return;
    }

    setMode("create");
    setSelectedId(null);
    setTitle("");
    setLocation("");
    setIsGathering(false);
    setGatheringTime("");
    setDepartureTime("");
    setDepartureType(startPointType === "station" ? "train" : "home");
    setSelectedDays([]);
    setCategoryName(categories[0]?.name || "仕事");
    setEventColor(categories[0]?.color || "#3b82f6");
    setMemo("");
    setPhotoUrls([]);
    setRating(0);
    setIsPinned(false);
    setIsTentative(false);
    setIsStocked(false);
    setIsRecordDetailsOpen(false);
    setCustomFieldsData({});
    setExpandedBlocks([]);

    const startStr = toLocalYYYYMMDD(info.start);
    let endStr = toLocalYYYYMMDD(info.end);
    const adjEnd = new Date(info.end);

    const selectDiffDays = Math.round((new Date(info.end).getTime() - new Date(info.start).getTime()) / 86400000);

    if (viewType === "dayGridMonth" && selectDiffDays > 1) {
      // 🌟 複数日選択時は終日（1日単位）
      adjEnd.setDate(adjEnd.getDate() - 1);
      setStartDate(startStr);
      setEndDate(toLocalYYYYMMDD(adjEnd));
      setStartH("00");
      setStartM("00");
      setEndH("23");
      setEndM("59");
      setIsAllDayBackground(true);
    } else if (viewType === "dayGridMonth" || info.allDay) {
      // 🌟 1日のみの選択時は「時間指定」にする
      adjEnd.setDate(adjEnd.getDate() - 1);
      setStartDate(startStr);
      setEndDate(toLocalYYYYMMDD(adjEnd));

      const nowH = new Date().getHours();
      setStartH(String(nowH).padStart(2, "0"));
      setStartM("00");
      setEndH(String(Math.min(nowH + 1, 23)).padStart(2, "0"));
      setEndM("00");
      setIsAllDayBackground(false);
    } else {
      // 週・日カレンダーで「時間」を選択した場合は、これまで通り時間単位にする
      setStartDate(startStr);
      setEndDate(endStr);

      const sDate = new Date(info.start);
      const eDate = new Date(info.end);
      setStartH(String(sDate.getHours()).padStart(2, "0"));
      setStartM("00");
      setEndH(String(eDate.getHours()).padStart(2, "0"));
      setEndM("00");

      setIsAllDayBackground(false);
    }

    setRepeatUntil(toLocalYYYYMMDD(new Date(adjEnd.getFullYear(), adjEnd.getMonth() + 1, 0)));
    setIsModalOpen(true);
  };

  const handleEventClick = useCallback(
    (info: any) => {
      if (isSwipingRef.current || isSidebarOpen || isViewSelectorExpanded || isDayPickerOpen || blockCalendarClick.current) {
        setIsViewSelectorExpanded(false);
        return;
      }
      const { event } = info;

      setIsViewSelectorExpanded(false);

      if (String(event.id).startsWith("sub-")) {
        const [_, name, y, m] = String(event.id).split("-");
        const d = event.start.getDate();
        const dateStr = `${y}-${m ? m.padStart(2, "0") : "01"}-${String(d).padStart(2, "0")}`;

        setMode("expense");
        setStartDate(dateStr);
        setCategoryName(event.extendedProps.category);
        setTitle(`${name} (今月の支払い)`);
        setExpenseAmount(event.extendedProps.metadata?.customFields?.standardExpenseAmount || "");
        setCustomFieldsData({ transactionMode: "expense", isExpenseSet: true, paymentMethod: "credit" });
        setIsModalOpen(true);
        return;
      }

      if (isDeleteMode) {
        if (event.extendedProps.isAnniversary || event.extendedProps.isRoutine) return;
        const id = event.id;
        setSelectedForDelete((prev: string[]) => (prev.includes(id) ? prev.filter((i: string) => i !== id) : [...prev, id]));
        return;
      }

      if (event.extendedProps.isAnniversary) {
        const annivTitle = event.title;
        const idx = anniversaries.findIndex((a: any) => a.title === annivTitle);
        if (idx !== -1) {
          setEditAnnivIndex(idx);
          setNewAnnivTitle(anniversaries[idx].title);
          const [em, ed] = anniversaries[idx].date.split("-");
          setNewAnnivMonth(em);
          setNewAnnivDay(ed);
          setNewAnnivColor(anniversaries[idx].color);
          setIsAnniversaryModalOpen(true);
        }
        return;
      }
      if (event.extendedProps.isTimetableSummary) {
        // 月カレンダーで「大学(3コマ)」をタップしたら、その日の日カレンダーにジャンプ
        calendarRef.current?.getApi().changeView("timeGridDay", event.start);
        return;
      }

      if (event.extendedProps.isTimetable) {
        // 授業をタップした時
        setMode("detail");
        const props = event.extendedProps;
        setSelectedId(event.id);
        setTitle(event.title);
        setLocation(props.metadata?.location || "");
        setCategoryName(props.category);
        setEventColor(props.cColor);
        setCustomFieldsData({ isTimetableEvent: true, lessonType: props.metadata?.lessonType }); // 編集不可にするための目印
        setIsModalOpen(true);
        return;
      }

      if (event.extendedProps.isRoutine) {
        setMode("routine_detail");
        setTitle(event.title);
        setEventColor(event.backgroundColor || "var(--theme)");
        setCustomFieldsData({ routineType: event.extendedProps.metadata?.routineType || "task" });
        setIsModalOpen(true);
        return;
      }

      setMode("detail");
      const props = event.extendedProps;
      setSelectedId(props.id);
      setTitle(event.title);
      setLocation(props.metadata?.location || "");
      setCategoryName(props.category);
      setIsMilestone(props.isMilestone || false);

      setIsGathering(props.metadata?.isGathering || false);
      setGatheringTime(props.metadata?.gatheringTime || "");
      setDepartureTime(props.metadata?.departureTime || "");
      setDepartureType(props.metadata?.departureType || (startPointType === "station" ? "train" : "home"));
      setPhotoUrls(props.metadata?.photoUrls || (props.metadata?.photoUrl ? [props.metadata.photoUrl] : []));
      setMemo(props.metadata?.memo || "");
      setCompanions(props.metadata?.companions || []);
      setRating(props.metadata?.rating || 0);
      setIsPinned(props.metadata?.isPinned || false);
      setIsStocked(props.metadata?.isStocked || false);
      setIsTentative(props.metadata?.isTentative || false);
      setExpandedBlocks([]); // 👈 支出、集合出発、交通機関のすべてのメニューを閉じた状態で開く

      setIsRecordDetailsOpen(Boolean(props.metadata?.memo || props.metadata?.photoUrls?.length > 0));

      const startDateStr = props.metadata?.startDateStr || (props.start_at ? props.start_at.split("T")[0] : toLocalYYYYMMDD(event.start));
      const endDateStr = props.metadata?.endDateStr || (props.end_at ? props.end_at.split("T")[0] : toLocalYYYYMMDD(event.end || event.start));

      setStartDate(startDateStr);
      setEndDate(endDateStr);

      const s = new Date(props.start_at || event.start);
      const e = new Date(props.end_at || event.end || s);

      // 🌟 過去に「16:02」などの端数で保存されてしまったバグデータを救済するため、開いた瞬間に「00分」または「5分単位」に丸める
      let sMin = s.getMinutes();
      let eMin = e.getMinutes();
      if (sMin % 5 !== 0) sMin = 0;
      if (eMin % 5 !== 0) eMin = 0;

      setStartH(String(s.getHours()).padStart(2, "0"));
      setStartM(String(sMin).padStart(2, "0"));
      setEndH(String(e.getHours()).padStart(2, "0"));
      setEndM(String(eMin).padStart(2, "0"));
      setEventColor(props.metadata?.customColor || "");
      setIsOutline(props.metadata?.isOutline || false);
      setIsAllDayBackground(props.metadata?.isAllDayBackground || false);

      const loadedCf = props.metadata?.customFields || {};
      setCustomFieldsData({
        ...loadedCf,
        isTransit: loadedCf.isTransit ?? props.metadata?.isTransit ?? false,
        transitType: loadedCf.transitType || props.metadata?.transitType || "train",
        transitDepTime: loadedCf.transitDepTime || props.metadata?.transitDepTime || "10:00",
        transitArrTime: loadedCf.transitArrTime || props.metadata?.transitArrTime || "12:00",
        hasReturnTransit: loadedCf.hasReturnTransit ?? props.metadata?.hasReturnTransit ?? false,
        returnTransitType: loadedCf.returnTransitType || props.metadata?.returnTransitType || "train",
        returnTransitDepTime: loadedCf.returnTransitDepTime || props.metadata?.returnTransitDepTime || "18:00",
        returnTransitArrTime: loadedCf.returnTransitArrTime || props.metadata?.returnTransitArrTime || "20:00",
      });
      setIsModalOpen(true);
    },
    [isSidebarOpen, isViewSelectorExpanded, isDayPickerOpen, isDeleteMode, anniversaries, canceledClasses, startPointType],
  );

  const handleStartHChange = (val: string) => {
    setStartH(val);
    const sH = parseInt(val, 10);
    const sM = parseInt(startM, 10);
    const eH = parseInt(endH, 10);
    const eM = parseInt(endM, 10);
    if (sH * 60 + sM >= eH * 60 + eM) {
      let nextH = sH + 1;
      if (nextH > 23) nextH = 23;
      setEndH(String(nextH).padStart(2, "0"));
      setEndM(startM);
    }
  };

  const handleStartMChange = (val: string) => {
    setStartM(val);
    const sH = parseInt(startH, 10);
    const sM = parseInt(val, 10);
    const eH = parseInt(endH, 10);
    const eM = parseInt(endM, 10);
    if (sH * 60 + sM >= eH * 60 + eM) {
      let nextH = sH + 1;
      if (nextH > 23) nextH = 23;
      setEndH(String(nextH).padStart(2, "0"));
      setEndM(val);
    }
  };

  const handleCustomFieldChange = (fId: string, val: any) => {
    const newData = { ...customFieldsData, [fId]: val };
    setCustomFieldsData(newData);
    // 即時のデータベース保存を削除（「保存する」ボタンを押した時に一括で保存されるようになります）
  };

  const handleScoreChange = (fId: string, myVal: string, oppVal: string) => {
    let res = "";
    if (myVal !== "" && oppVal !== "") {
      const m = Number(myVal);
      const o = Number(oppVal);
      res = m > o ? "win" : m < o ? "lose" : "draw";
    }
    handleCustomFieldChange(fId, { my: myVal, opp: oppVal, res });
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setPhotoUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotoUrls((prev) => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };
  // 起動時に許可を取る
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handleSave = async () => {
    if (!startDate || !title) return;
    if (isSaving) return;
    setIsSaving(true);
    setIsModalOpen(false);

    const getISO = (d: string, h: string, m: string) => new Date(`${d}T${h}:${m}:00`).toISOString();
    const isPremiumUser = activeUserId === "YOUR_SUPABASE_USER_UID" || userProfile?.isPremium === true;

    try {
      const actualStartH = isAllDayBackground ? "00" : startH;
      const actualStartM = isAllDayBackground ? "00" : startM;
      const actualEndH = isAllDayBackground ? "23" : isMilestone ? startH : endH;
      const actualEndM = isAllDayBackground ? "59" : isMilestone ? startM : endM;
      const actualEndDate = isAllDayBackground ? endDate : isMilestone ? startDate : endDate;

      const finalStartObj = new Date(`${startDate}T${actualStartH}:${actualStartM}:00`);
      const finalEndObj = new Date(`${actualEndDate}T${actualEndH}:${actualEndM}:00`);
      if (finalEndObj <= finalStartObj && !isAllDayBackground) {
        finalEndObj.setDate(finalEndObj.getDate() + 1);
      }
      const finalStartISO = finalStartObj.toISOString();
      const finalEndISO = finalEndObj.toISOString();

      const newCustomFields = { ...customFieldsData };
      const catObj = categories.find((c: any) => c.name === categoryName);

      // 💰 給与計算ロジック（hooksへ委譲）
      catObj?.fields?.forEach((f: any) => {
        if (f.type === "wage" && f.wageRules) {
          let workStart = parseInt(actualStartH) * 60 + parseInt(actualStartM);
          let breakTime = parseInt(newCustomFields[f.id]?.breakTime || "0", 10);

          let pastWorkMinutes = 0;
          events.forEach((ev: any) => {
            if (ev.id === selectedId) return;
            const evDate = toLocalYYYYMMDD(new Date(ev.start));
            if (evDate === startDate && ev.extendedProps?.category === categoryName) {
              const evStartObj = new Date(ev.start);
              const evStartMin = evStartObj.getHours() * 60 + evStartObj.getMinutes();
              if (evStartMin < workStart) {
                const prevHours = ev.extendedProps?.metadata?.customFields?.[f.id]?.hours || 0;
                pastWorkMinutes += Math.round(Number(prevHours) * 60);
              }
            }
          });

          const result = calculateWage({
            actualStartH,
            actualStartM,
            actualEndH,
            actualEndM,
            breakTimeMinutes: breakTime,
            wageRules: f.wageRules,
            pastWorkMinutes,
            applyOvertime: newCustomFields[f.id]?.overtimePremium !== false,
            applyNight: newCustomFields[f.id]?.nightPremium !== false,
          });

          newCustomFields[f.id] = {
            ...newCustomFields[f.id],
            calculatedWage: result.calculatedWage,
            hours: result.hours,
          };
        }
      });

      const finalGatheringTime = gatheringTime || `${startH}:${startM}`;
      const finalDepartureTime = departureTime || `${String(Math.max(0, Number(startH) - 1)).padStart(2, "0")}:${startM}`;

      const metadata = {
        location,
        isGathering,
        gatheringTime: isGathering ? gatheringTime || `${startH}:${startM}` : "",
        departureTime: isGathering ? departureTime || `${String(Math.max(0, Number(startH) - 1)).padStart(2, "0")}:${startM}` : "",
        departureType,
        walkTime,
        customColor: eventColor || undefined,
        isOutline,
        customFields: newCustomFields,
        photoUrls,
        isMilestone,
        memo,
        rating,
        isPinned,
        isStocked,
        isAllDayBackground,
        startDateStr: startDate,
        endDateStr: endDate,
        user_id: activeUserId,
        isTentative,
        companions,
      };

      // 保存するデータの配列を準備
      let newEventsToSave: any[] = [];

      if (mode === "dayOfWeekBulk" && bulkStartMonth && bulkEndMonth && selectedDays.length > 0) {
        const [sYear, sMonth] = bulkStartMonth.split("-");
        const startDateObj = new Date(Number(sYear), Number(sMonth) - 1, 1);
        const [eYear, eMonth] = bulkEndMonth.split("-");
        const endDateObj = new Date(Number(eYear), Number(eMonth), 0, 23, 59, 59);
        for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
          if (d.getDay() === selectedDays[0]) {
            const ds = toLocalYYYYMMDD(d);
            newEventsToSave.push({ id: String(Date.now()) + Math.random().toString().slice(2, 6), user_id: activeUserId, title, category: categoryName, start_at: new Date(`${ds}T${actualStartH}:${actualStartM}:00`).toISOString(), end_at: new Date(`${ds}T${actualEndH}:${actualEndM}:00`).toISOString(), metadata });
          }
        }
      } else if (mode === "create" && selectedDays.length > 0 && repeatUntil) {
        const endLimit = new Date(repeatUntil);
        for (let d = new Date(startDate); d <= endLimit; d.setDate(d.getDate() + 1)) {
          if (selectedDays.includes(d.getDay())) {
            newEventsToSave.push({ id: String(Date.now()) + Math.random().toString().slice(2, 6), user_id: activeUserId, title, category: categoryName, start_at: new Date(`${toLocalYYYYMMDD(d)}T${actualStartH}:${actualStartM}:00`).toISOString(), end_at: new Date(`${toLocalYYYYMMDD(d)}T${actualEndH}:${actualEndM}:00`).toISOString(), metadata });
          }
        }
      } else {
        newEventsToSave.push({ id: selectedId || String(Date.now()), user_id: activeUserId, title, category: categoryName, start_at: finalStartISO, end_at: finalEndISO, metadata });
      }

      // 🌟 全ユーザー共通：ローカルストレージへ保存する処理
      const currentLocal = JSON.parse(localStorage.getItem("events") || "[]");
      let updatedLocal = [...currentLocal];

      if (mode === "create" || mode === "dayOfWeekBulk") {
        updatedLocal = [...updatedLocal, ...newEventsToSave];
      } else {
        // 編集の場合 (newEventsToSaveは1つだけ)
        updatedLocal = updatedLocal.map((ev: any) => (ev.id === selectedId ? newEventsToSave[0] : ev));
      }
      localStorage.setItem("events", JSON.stringify(updatedLocal));

      // 🌟 プレミアムアカウントのみ：DB(Supabase)へも保存（同期）
      if (isPremiumUser) {
        let dbError = null;
        if (mode === "create" || mode === "dayOfWeekBulk") {
          const { error } = await (supabase.from("events") as any).insert(newEventsToSave);
          dbError = error;
        } else {
          const { error } = await (supabase.from("events") as any).update(newEventsToSave[0]).eq("id", selectedId);
          dbError = error;
        }

        if (dbError) {
          console.error("Supabase Save Error:", dbError);
          // 🌟 修正: dbError を any 型として扱うか、message プロパティがあるかチェックする
          const errorMessage = (dbError as any).message || "不明なエラー";
          alert("クラウドへの同期に失敗しましたが、端末（ローカル）には保存されました。\nエラー詳細: " + errorMessage);
        }
      }

      // 🔔 通知の設定
      const offsets = customFieldsData.notificationOffsets || [10];
      for (const minutes of offsets) {
        await scheduleEventNotification(selectedId || "new-event", title, finalStartISO, minutes);
      }

      await fetchEvents();
    } catch (error) {
      console.error("Save Error:", error);
      alert("システムエラーにより保存に失敗しました。");
      setIsModalOpen(true);
    } finally {
      setIsSaving(false);
    }
  };

  const ColorSelector = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
    const [tempColor, setTempColor] = useState(value);
    useEffect(() => {
      setTempColor(value);
    }, [value]);
    const isChanged = tempColor !== value;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--input-bg)", padding: "12px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {activePresets.map((c: string, i: number) => (
            <div
              key={`color-${i}`}
              onClick={() => {
                onChange(c);
                setTempColor(c);
              }}
              style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: c, cursor: "pointer", border: tempColor === c ? "3px solid var(--text-main)" : "2px solid transparent", boxSizing: "border-box", boxShadow: `0 2px 6px ${c}50`, transition: "all 0.2s", flexShrink: 0 }}
            />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px dashed var(--border-color)" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-sub)" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: tempColor, border: "2px solid var(--border-color)", boxShadow: "0 2px 6px rgba(0,0,0,0.1)", flexShrink: 0, position: "relative", overflow: "hidden" }}>
              <input type="color" value={tempColor} onChange={(e) => setTempColor(e.target.value)} style={{ opacity: 0, position: "absolute", width: "200%", height: "200%", top: "-50%", left: "-50%", cursor: "pointer" }} />
            </div>
            色を選択
          </label>
          {isChanged && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onChange(tempColor);
                if (!userColors.includes(tempColor)) setUserColors([...userColors, tempColor]);
              }}
              style={{ background: "var(--theme)", color: "#fff", border: "none", borderRadius: "20px", padding: "6px 16px", fontSize: "0.75rem", fontWeight: "bold", cursor: "pointer", boxShadow: "0 4px 10px rgba(0,0,0,0.2)", animation: "fadeIn 0.2s" }}
            >
              確定
            </button>
          )}
        </div>
      </div>
    );
  };

  // 👇 支出タイプのスマートアイコン・セレクト
  const ExpenseTypeSelector = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) setIsOpen(false);
      };
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, [isOpen]);

    const options = [
      { id: "expense", label: "通常の支出", icon: TrendingDown, color: "#ef4444" },
      { id: "income", label: "収入・戻り", icon: TrendingUp, color: "#10b981" },
      { id: "advance", label: "立て替えた (貸し)", icon: Handshake, color: "#f59e0b" },
      { id: "borrow", label: "立て替えられた (借り)", icon: Users, color: "#3b82f6" },
    ];
    const current = options.find((o) => o.id === value) || options[0];
    const Icon = current.icon;

    return (
      <div ref={selectorRef} style={{ position: "relative", width: "100%", height: "100%" }}>
        {/* 👇 修正：border を 2px に統一し、Chevron アイコンが潰れないように flexShrink: 0 を付与 */}
        <div onClick={() => setIsOpen(!isOpen)} className="pop-input" style={{ width: "100%", height: "100%", fontSize: "0.75rem", padding: "0 8px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", border: isOpen ? "2px solid var(--theme)" : "2px solid var(--border-color)", background: "var(--input-bg)", minHeight: "unset" }}>
          <Icon size={14} color={current.color} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontWeight: "bold", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{current.label}</span>
          {isOpen ? <ChevronUp size={14} color="var(--text-sub)" style={{ flexShrink: 0 }} /> : <ChevronDown size={14} color="var(--text-sub)" style={{ flexShrink: 0 }} />}
        </div>
        {isOpen && (
          <div className="hide-scrollbar" style={{ position: "absolute", top: "100%", left: 0, width: "100%", minWidth: "140px", background: "var(--card-bg)", border: "1px solid var(--theme)", borderRadius: "12px", marginTop: "4px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", zIndex: 100, overflowY: "auto", maxHeight: "160px", padding: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
            {options.map((o) => {
              const OptIcon = o.icon;
              return (
                <div
                  key={o.id}
                  onClick={() => {
                    onChange(o.id);
                    setIsOpen(false);
                  }}
                  style={{ padding: "8px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-main)", background: value === o.id ? "var(--input-bg)" : "transparent", borderRadius: "8px", transition: "background 0.2s" }}
                >
                  <OptIcon size={14} color={o.color} style={{ flexShrink: 0 }} />
                  {o.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const PaymentMethodSelector = ({ value, onChange, isIncome }: { value: string; onChange: (val: string) => void; isIncome: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) setIsOpen(false);
      };
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, [isOpen]);

    const methods = isIncome
      ? [
          { id: "bank", label: "振込", icon: Landmark, color: "var(--theme)" },
          { id: "cash", label: "現金", icon: Banknote, color: "var(--theme)" },
          { id: "paypay", label: "電子マネー", icon: Smartphone, color: "var(--theme)" },
        ]
      : [
          { id: "cash", label: "現金", icon: Banknote, color: "var(--theme)" },
          { id: "credit", label: "クレカ", icon: CreditCard, color: "var(--theme)" },
          { id: "paypay", label: "スマホ決済", icon: Smartphone, color: "var(--theme)" },
          { id: "ic", label: "交通IC", icon: Train, color: "var(--theme)" },
          { id: "reimburse", label: "立替", icon: Handshake, color: "var(--theme)" },
        ];
    const current = methods.find((m) => m.id === value) || methods[0];
    const Icon = current.icon;

    return (
      <div ref={selectorRef} style={{ position: "relative", width: "100%", height: "100%" }}>
        {/* 👇 修正：border を 2px に統一 */}
        <div onClick={() => setIsOpen(!isOpen)} className="pop-input" style={{ width: "100%", height: "100%", fontSize: "0.75rem", padding: "0 8px", display: "flex", alignItems: "center", gap: "4px", cursor: "pointer", border: isOpen ? "2px solid var(--theme)" : "2px solid var(--border-color)", background: "var(--input-bg)", minHeight: "unset" }}>
          <Icon size={14} color={current.color} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontWeight: "bold", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{current.label}</span>
          {isOpen ? <ChevronUp size={14} color="var(--text-sub)" style={{ flexShrink: 0 }} /> : <ChevronDown size={14} color="var(--text-sub)" style={{ flexShrink: 0 }} />}
        </div>
        {isOpen && (
          <div className="hide-scrollbar" style={{ position: "absolute", top: "100%", left: 0, width: "100%", minWidth: "120px", background: "var(--card-bg)", border: "1px solid var(--theme)", borderRadius: "12px", marginTop: "4px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", zIndex: 100, overflowY: "auto", maxHeight: "160px", padding: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
            {methods.map((m) => {
              const OptIcon = m.icon;
              return (
                <div
                  key={m.id}
                  onClick={() => {
                    onChange(m.id);
                    setIsOpen(false);
                  }}
                  style={{ padding: "8px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-main)", background: value === m.id ? "var(--input-bg)" : "transparent", borderRadius: "8px", transition: "background 0.2s" }}
                >
                  <OptIcon size={14} color={m.color} style={{ flexShrink: 0 }} />
                  {m.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const PayeeComboInput = ({ value, onChange, pastPayees }: { value: string; onChange: (val: string) => void; pastPayees: string[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent | TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
      };
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, [isOpen]);

    return (
      <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
        {/* 👇 修正：border を 2px に統一 */}
        <div className="pop-input" style={{ width: "100%", height: "100%", padding: "0 8px", display: "flex", alignItems: "center", cursor: "text", position: "relative", gap: "4px", minHeight: "unset", border: isOpen ? "2px solid var(--theme)" : "2px solid var(--border-color)" }}>
          <input type="text" style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "0.8rem", color: "var(--text-main)", width: "100%", minWidth: 0, height: "100%" }} placeholder="相手の名前" value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setIsOpen(true)} />
          {pastPayees.length > 0 && (
            <div
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              style={{ cursor: "pointer", color: "var(--text-sub)", display: "flex", alignItems: "center", padding: "4px", flexShrink: 0 }}
            >
              <ChevronDown size={14} />
            </div>
          )}
        </div>

        {isOpen && pastPayees.length > 0 && (
          <div className="hide-scrollbar" style={{ position: "absolute", top: "100%", left: 0, width: "100%", background: "var(--card-bg)", border: "1px solid var(--theme)", borderRadius: "12px", marginTop: "4px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", zIndex: 100, overflowY: "auto", maxHeight: "160px", padding: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
            {pastPayees.map((p, i) => (
              <div
                key={i}
                onClick={() => {
                  onChange(p);
                  setIsOpen(false);
                }}
                style={{ padding: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-main)", borderRadius: "8px", transition: "background 0.2s" }}
                className="hover-bg-glass"
              >
                {p}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderListItem = (key: string, color: string, text: string, onEdit: any, onDelete: any) => (
    <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 8px", borderBottom: "1px solid var(--border-color)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundColor: color, boxShadow: `0 0 8px ${color}80` }} />
        <span style={{ fontWeight: "bold", fontSize: "0.9rem", color: "var(--text-main)" }}>{text}</span>
      </div>
      <div style={{ display: "flex", gap: "6px" }}>
        {onEdit && (
          <button onClick={onEdit} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.75rem", borderRadius: "8px" }}>
            編集
          </button>
        )}
        <button onClick={onDelete} style={{ background: "#fee2e2", color: "#ef4444", border: "none", padding: "6px 12px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "bold", cursor: "pointer", boxShadow: "0 2px 4px rgba(239,68,68,0.2)" }}>
          削除
        </button>
      </div>
    </div>
  );

  const ModalHeader = ({ title, onClose, rightEl = null }: any) => (
    <div className="modal-header">
      <h2 className="modal-title" style={{ color: themeColor }}>
        {title}
      </h2>
      {rightEl || (
        <button onClick={onClose} className="btn-close">
          ×
        </button>
      )}
    </div>
  );

  // 🌟 最適化: requestAnimationFrame で間引き、過剰なDOM再計算を抑止してスクロールを高速化
  useEffect(() => {
    if (viewType !== "timeGridWeek" && viewType !== "timeGridDay") return;

    let rafId: number | null = null;
    const syncWidths = () => {
      const calendarEl = document.querySelector(".fc");
      if (!calendarEl) return;

      const transitEls = calendarEl.querySelectorAll("[data-travel-target]");
      if (transitEls.length === 0) return;

      transitEls.forEach((tEl) => {
        const targetId = tEl.getAttribute("data-travel-target");
        const mainEl = calendarEl.querySelector(`[data-main-id="${targetId}"]`);
        if (mainEl && tEl) {
          const tHarness = tEl.closest(".fc-timegrid-event-harness") as HTMLElement;
          const mainHarness = mainEl.closest(".fc-timegrid-event-harness") as HTMLElement;
          if (tHarness && mainHarness) {
            tHarness.style.left = mainHarness.style.left;
            tHarness.style.right = mainHarness.style.right;
            tHarness.style.width = mainHarness.style.width;
            tHarness.style.marginLeft = mainHarness.style.marginLeft;
            tHarness.style.marginRight = mainHarness.style.marginRight;
            tHarness.style.zIndex = mainHarness.style.zIndex;
          }
        }
      });
    };

    const throttledSync = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        syncWidths();
        rafId = null;
      });
    };

    const observer = new MutationObserver(throttledSync);
    const container = document.querySelector(".fc");
    if (container) {
      observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ["style"] });
    }
    throttledSync();

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [events, viewType, currentWeekStartStr]);

  // 🚨 エラー修正＆機能強化：文章生成のロジック
  useEffect(() => {
    if (assistMode === "send") {
      if (assistTimeSlots.length === 0) {
        setGeneratedText("カレンダーから空き時間を追加するか、下から日付を選択してください。");
        return;
      }
      let text = "以下の日程でご都合はいかがでしょうか？\n\n";
      assistTimeSlots.forEach((slot) => {
        text += `・${slot}\n`;
      });
      text += "\n上記以外でも調整可能ですので、お知らせください！\n※都合の悪い時間帯があれば追記して送ってください。";
      setGeneratedText(text);
    }
  }, [assistTimeSlots, assistMode]);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  if (!isMounted || !isDataLoaded) return <div style={{ minHeight: "100vh", background: "var(--bg-main)" }} />;
  if (!activeUserId) {
    return (
      <AuthScreen
        themeColor={themeColor}
        onLoginSuccess={(id, name) => {
          setActiveUserId(id);
          setActiveUserName(name);
          // 👇 修正：タブを閉じてもログイン状態をずっと維持する
          localStorage.setItem("os_active_session", JSON.stringify({ id, name }));
        }}
        onLogout={() => {
          localStorage.removeItem("os_active_session");
          setActiveUserId(null);
          setActiveUserName("");
        }}
      />
    );
  }

  // 🌟 ここで環境判定を呼び出す（utils.tsなどで定義したもの）
  const { isNative } = require("@/app/lib/utils");
  const currentCategoryObj = categories.find((c: any) => c.name === categoryName);

  // 🌟 最適化: Date オブジェクトの過剰生成を排除し、文字列前方一致で高速判定
  const targetMonthPrefix = currentYear && currentMonthNum ? `${currentYear}-${String(currentMonthNum).padStart(2, "0")}` : "";
  const targetYearPrefix = currentYear ? `${currentYear}` : "";

  const currentMonthEvents = displayEvents.filter((e: any) => {
    if (!e.start || e.extendedProps?.isAnniversary || !targetMonthPrefix) return false;
    const s = typeof e.start === "string" ? e.start : toLocalYYYYMMDD(new Date(e.start));
    return s.startsWith(targetMonthPrefix);
  });

  const currentYearEvents = displayEvents.filter((e: any) => {
    if (!e.start || !targetYearPrefix) return false;
    const s = typeof e.start === "string" ? e.start : toLocalYYYYMMDD(new Date(e.start));
    return s.startsWith(targetYearPrefix);
  });

  return (
    <div
      className={isNative ? "is-native-app" : "is-web-app"} // 🌟 環境ごとのクラスを付与
      style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", height: "100dvh", width: "100vw", background: "var(--bg-main)", overflow: "hidden" }}
    >
      <style>{`
            :root {
              --theme: ${themeColor};
              --theme-shadow: ${themeColor}40;
              --theme-border: ${hexToRgba(themeColor, isDarkMode ? 0.4 : 0.2)};
              --bg-main: ${isDarkMode ? "#0f172a" : "#f4f7fb"};
              --glass-bg: ${isDarkMode ? "rgba(30,41,59,0.85)" : "rgba(255, 255, 255, 0.85)"};
              --glass-border: ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(255, 255, 255, 0.6)"};
              --text-main: ${isDarkMode ? "#f8fafc" : "#1e293b"};
              --text-sub: ${isDarkMode ? "#94a3b8" : "#64748b"};
              --card-bg: ${isDarkMode ? "#1e293b" : "#ffffff"};
              --input-bg: ${isDarkMode ? "#0f172a" : "#f8fafc"};
              --border-color: ${isDarkMode ? "rgba(255,255,255,0.1)" : "#e2e8f0"};
              --app-font: ${fontFamily === "serif" ? '"Noto Serif JP", "Hiragino Mincho ProN", serif' : fontFamily === "rounded" ? '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", sans-serif' : '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", sans-serif'};
              color-scheme: ${isDarkMode ? "dark" : "light"};
            }
    
            .fc-theme-standard td, .fc-theme-standard th { border-color: var(--theme-shadow) !important; transition: border-color 0.3s; }
            .fc-scrollgrid { border: 1.5px solid var(--theme) !important; border-radius: 12px; overflow: hidden; }
            .fc-col-header-cell { border-bottom: 2px solid var(--theme) !important; }
            
            /* 👇 全ての数値入力の矢印（スピナー）を消す */
            input[type="number"]::-webkit-outer-spin-button,
            input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            input[type="number"] {
              -moz-appearance: textfield;
            }
            
            * {
              box-sizing: border-box;
              -webkit-tap-highlight-color: transparent; /* iOS特有のタップ時グレー枠を消去 */
            }

            /* 👇 追加：画面全体のスクロールとバウンスを止め、タップ遅延を0ms化 */
            html, body {
              margin: 0;
              padding: 0;
              height: 100dvh;
              overflow: hidden;
              overscroll-behavior: none;
              touch-action: manipulation; /* 300msのダブルタップ待機を無効化し、即時反応させる */
            }

            /* ボタンやインタラクティブ要素の即時レスポンス設定 */
            button, .btn-pop, .btn-secondary, .btn-icon, .day-btn, .fc-event {
              touch-action: manipulation;
              cursor: pointer;
            }

            button:active, .btn-pop:active, .btn-secondary:active, .btn-icon:active {
              transform: scale(0.96); /* タップした瞬間に物理ボタンのような即時フィードバック */
              transition: transform 0.05s ease;
            }
    
            body, .fixed-mobile-frame, .fc {
              color: var(--text-main);
              font-family: var(--app-font) !important;
            }
    
            /* 🌐 Webアプリ（ブラウザ版）: 今まで通りの表示を100%維持 */
            .fixed-mobile-frame {
              width: 100%;
              max-width: 460px;
              height: 100dvh;
              display: flex;
              flex-direction: column;
              position: relative;
              overflow: hidden;
            }
    
            /* 📱 実機アプリ（iOSネイティブ版）: 絶対にステータスバーと被らせない決定版 */
            .is-native-app .fixed-mobile-frame {
              /* env()が0になるバグを防ぐため、最低でも47px(iPhoneのカメラ領域)を強制確保 */
              padding-top: max(env(safe-area-inset-top), 47px);
              padding-bottom: max(env(safe-area-inset-bottom), 20px);
              height: 100dvh; /* paddingを内側に含めるために100dvhで固定 */
              box-sizing: border-box;
              background: var(--bg-main);
            }
    
            .is-native-app header {
              margin-top: 4px; /* ヘッダーをステータスバーから少し離す */
              flex-shrink: 0;
            }
    
            .fc-event-main, .fc-v-event .fc-event-main { padding: 0 !important; color: inherit; }
            
            /* 👇 all-day枠（終日予定）の高さを予定の有無に関わらず完全に固定する */
            .fc-scrollgrid-section-allday td, .fc-scrollgrid-section-allday th { height: 34px !important; min-height: 34px !important; max-height: 34px !important; overflow: hidden !important; }
            .fc-timegrid-allday { height: 34px !important; min-height: 34px !important; max-height: 34px !important; padding: 0 !important; overflow: hidden !important; }
            .fc-timegrid-allday .fc-daygrid-day-events { margin: 0 !important; min-height: 34px !important; display: flex; align-items: center; padding-top: 1px !important; }
            
            .fc-timegrid-allday-cushion { display: none !important; }
            .fc-timegrid-axis-cushion { font-size: 0.65rem !important; padding: 4px !important; line-height: 1; }
            .fc-timeGridWeek-view .fc-daygrid-day-events,
            .fc-timeGridDay-view .fc-daygrid-day-events { margin: 0 !important; }
            .fc-timeGridWeek-view .fc-daygrid-day-frame,
            .fc-timeGridDay-view .fc-daygrid-day-frame { padding: 0 !important; justify-content: center; }
    
            .fc-daygrid-day-top { flex-direction: row; justify-content: center; padding-top: 4px !important; padding-bottom: 2px !important; margin-bottom: 0 !important; }
            .fc-daygrid-day-events { margin: 0 !important; flex: 1; }
    
            .fc-daygrid-day-number {
              font-size: 0.8rem !important;
              font-weight: 900 !important;
              text-decoration: none !important;
              padding: 2px !important;
              color: var(--text-main) !important;
              line-height: 1 !important;
            }
    
            .fc-event { border-radius: 4px !important; cursor: pointer; transition: transform 0.1s; border: none !important; }
            .fc-event:active { transform: scale(0.98); }
            .fc-daygrid-event { margin: 1px 0 !important; overflow: visible !important; }
            .fc-daygrid-event.solid-allday-event { background: transparent !important; border: none !important; box-shadow: none !important; }
            .fc-timegrid-event { margin: 0 !important; border-radius: 6px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; }
            .fc-event-title {
              white-space: pre-wrap !important;
              word-break: break-all !important;
              writing-mode: horizontal-tb !important;
              line-height: 1.2 !important;
            }
            .fc-event-time {
              white-space: nowrap !important;
            }
    
            .fc-timegrid-event {
              margin: 0 !important;
              border-radius: 6px !important;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
              transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
            }
            .fc-timegrid-event:hover {
              z-index: 100 !important;
              transform: scale(1.02);
              box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
              min-width: 90% !important;
            }
            /* カレンダーの枠線を確実にテーマカラーで上書き */
            .fc-theme-standard td, .fc-theme-standard th { border-color: var(--theme) !important; transition: border-color 0.3s; }
            .fc-scrollgrid { border: 1px solid var(--theme) !important; border-radius: 8px; overflow: hidden; }
            .fc-col-header-cell { border-bottom: 2px solid var(--theme) !important; }
            .fc-day-today { background-color: var(--theme-shadow) !important; }
            .fc-timegrid-now-indicator-line { border-color: var(--theme) !important; border-width: 2px !important; }
            .fc-timegrid-now-indicator-arrow { border-color: var(--theme) !important; border-width: 6px !important; border-top-color: transparent !important; border-bottom-color: transparent !important; }
            .fc-col-header-cell-cushion { padding: 8px 4px !important; width: 100%; text-align: center; color: var(--text-main) !important; }
            .fc-timegrid-axis, .fc-timegrid-slot-label { border-right: none !important; border-left: none !important; }
            .fc-timegrid-slot-minor { border-top-style: none !important; border-bottom-style: none !important; }
            .fc-timegrid-slot-label-frame { display: flex !important; align-items: center !important; justify-content: center !important; height: 100% !important; }
            .fc-timegrid-slot-label-cushion { font-weight: 900 !important; font-size: 0.7rem !important; color: var(--theme) !important; background: transparent !important; padding: 0 2px !important; border-radius: 0; margin: 0 !important; display: inline-block !important; }
    
            .holiday-cell .fc-daygrid-day-number, .fc-col-header-cell.fc-day-sun, .fc-day-sun .fc-col-header-cell-cushion, .fc-day-sun .holiday-text { color: #FF6B6B !important; font-weight: 900; }
            .saturday-cell .fc-daygrid-day-number, .fc-col-header-cell.fc-day-sat, .fc-day-sat .fc-col-header-cell-cushion, .fc-day-sat .saturday-text { color: #4D96FF !important; font-weight: 900; }
    
            .glass-panel { background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); }
            .hover-bg-glass:hover { background: var(--input-bg); }
    
            .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .modal-title { margin: 0; color: var(--theme); font-size: 1.4rem; font-weight: 900; letter-spacing: 0.02em; }
            .btn-close { background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 50%; width: 36px; height: 36px; font-size: 1.2rem; cursor: pointer; color: var(--text-sub); font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: all 0.2s; }
    
            .card-box { background: var(--card-bg); backdrop-filter: blur(10px); padding: 18px; border-radius: 20px; border: 1px solid var(--border-color); margin-bottom: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
            .form-label { font-size: 0.8rem; font-weight: 900; color: var(--text-sub); display: block; margin-bottom: 8px; letter-spacing: 0.02em; }
    
            .btn-icon { background: var(--card-bg); backdrop-filter: blur(10px); border: 1px solid var(--glass-border); border-radius: 12px; width: 38px; height: 38px; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; cursor: pointer; color: var(--text-main); box-shadow: 0 4px 10px rgba(0,0,0,0.05); padding: 0; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
            .date-picker-btn { background: var(--card-bg); backdrop-filter: blur(10px); border: 1px solid var(--border-color); border-radius: 16px; padding: 6px 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; align-items: center; justify-content: space-between; position: relative; cursor: pointer; transition: all 0.1s ease; }
    
            .btn-pop { background: var(--theme); color: #fff !important; border: none; padding: 14px 24px; border-radius: 16px; font-weight: 900; letter-spacing: 0.05em; box-shadow: 0 6px 20px var(--theme-shadow), inset 0 2px 4px rgba(255,255,255,0.3); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
            .btn-secondary { background: var(--card-bg); backdrop-filter: blur(10px); color: var(--text-main); border: 1px solid var(--border-color); padding: 14px 24px; border-radius: 16px; font-weight: 900; letter-spacing: 0.02em; box-shadow: 0 4px 15px rgba(0,0,0,0.03); cursor: pointer; transition: all 0.2s; }
    
            .day-btn { padding: 10px 0; border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; background: var(--input-bg); font-size: 0.8rem; font-weight: 900; flex: 1; text-align: center; transition: all 0.2s; color: var(--text-sub); }
            .day-btn.active { background: var(--theme); color: #fff !important; border-color: var(--theme); box-shadow: 0 4px 12px var(--theme-shadow); }
    
            .pop-input, .time-select {
              width: 100%;
              height: 46px !important;
              padding: 0 14px !important;
              border-radius: 12px !important;
              border: 2px solid var(--border-color);
              background: var(--input-bg);
              font-size: 0.95rem;
              font-weight: 900;
              color: var(--text-main);
              outline: none;
              display: flex;
              align-items: center;
              box-sizing: border-box;
            }
            .pop-input:focus, .time-select:focus {
              border-color: var(--theme);
              box-shadow: 0 0 0 4px var(--theme-shadow);
            }
            textarea.pop-input { height: auto; padding: 12px 14px; }
            .custom-select { appearance: none; background: var(--card-bg); backdrop-filter: blur(10px); border: 1px solid var(--border-color); outline: none; cursor: pointer; color: var(--theme); font-weight: 900; text-align: center; padding: 6px 12px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); transition: all 0.2s; }
    
            .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 1000; display: flex; justify-content: center; align-items: center; padding: 24px; animation: fadeIn 0.3s ease-out; }
            .modal-content { width: 92%; max-width: 420px; border-radius: 28px; border: 1px solid var(--glass-border); overflow-y: auto; max-height: 80dvh; animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); background: var(--bg-main); color: var(--text-main); }
    
            @keyframes popIn { 0% { transform: scale(0.95) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
            @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
            @keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
    
            .toggle-switch { position: relative; width: 44px; height: 24px; }
            .toggle-switch input { opacity: 0; width: 0; height: 0; }
            .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: var(--input-bg); border: 1px solid var(--border-color); transition: .3s; border-radius: 24px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
            .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: var(--text-sub); transition: .3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
            input:checked + .slider { background-color: var(--theme); border-color: var(--theme); }
            input:checked + .slider:before { transform: translateX(20px); background-color: #fff; }
    
            .hide-scrollbar {
              -ms-overflow-style: none;  /* IE, Edge */
              scrollbar-width: none;     /* Firefox */
            }
            .hide-scrollbar::-webkit-scrollbar {
              display: none;             /* Chrome, Safari */
            }
            .highlighted-event { position: relative; z-index: 30 !important; animation: focus-bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), pulse-glow 2s infinite; border: 2px solid #ef4444 !important; border-radius: 8px !important; }
            @keyframes focus-bounce { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
            @keyframes pulse-glow { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }
    
            .delete-selected-event { border: 2px dashed #ef4444 !important; background: rgba(239,68,68,0.2) !important; opacity: 0.8; }
            .search-item { padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s; margin-bottom: 8px; background: var(--input-bg); backdrop-filter: blur(5px); }
            .search-item.active { background: var(--theme-shadow); border: 2px solid var(--theme); transform: scale(1.02) translateX(4px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); position: relative; }
    
            .fc-more-link { display: block !important; text-align: center !important; font-size: 0.75rem !important; font-weight: 900 !important; color: var(--text-sub) !important; background: var(--input-bg) !important; border-radius: 6px !important; padding: 2px 0 !important; margin: 2px 4px !important; transition: all 0.2s ease !important; }
            .fc-popover { background: var(--glass-bg) !important; backdrop-filter: blur(20px) !important; border: 1px solid var(--glass-border) !important; border-radius: 16px !important; box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important; z-index: 1000 !important; width: 155px !important; box-sizing: border-box !important; animation: popoverUnfold 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards !important; }
            @keyframes popoverUnfold { 0% { opacity: 0; transform: scale(0.8) translateY(-10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
            .fc-popover-header { background: transparent !important; padding: 12px 32px 8px 12px !important; border-bottom: none !important; display: flex !important; justify-content: center !important; align-items: center !important; position: relative !important; }
            .fc-popover-title { font-size: 1.1rem !important; font-weight: 900 !important; color: var(--text-main) !important; text-align: center !important; width: 100% !important; display: block !important; white-space: nowrap !important; }
            .fc-popover-close { position: absolute !important; top: 10px !important; right: 8px !important; cursor: pointer !important; opacity: 0.6 !important; background: var(--input-bg) !important; border-radius: 50% !important; width: 24px !important; height: 24px !important; display: flex !important; align-items: center !important; justify-content: center !important; }
            .fc-popover-body { padding: 0 10px 12px 10px !important; display: flex !important; flex-direction: column !important; gap: 6px !important; max-height: 250px !important; overflow-y: auto !important; overflow-x: hidden !important; box-sizing: border-box !important; width: 100% !important; }
            .fc-popover-body > div:not(.fc-daygrid-event-harness), .fc-popover .fc-daygrid-day-top { display: none !important; }
            .fc-popover-body .fc-daygrid-event-harness { position: static !important; width: 100% !important; margin: 0 !important; transform: none !important; box-sizing: border-box !important; }
            .fc-popover-body .fc-event { position: static !important; width: 100% !important; max-width: 65% !important; margin: 0 !important; box-sizing: border-box !important; }
    
            .is-dot-mode .fc-event, .is-dot-mode .fc-daygrid-event, .is-dot-mode .fc-h-event { background-color: transparent !important; background: transparent !important; border-color: transparent !important; border: none !important; box-shadow: none !important; }
            .is-dot-mode .fc-event-main { padding: 0 !important; color: transparent !important; }
            .is-dot-mode .fc-event-title, .is-dot-mode .fc-event-time { display: none !important; }
            .fc-event.is-dot-mode-event { background: transparent !important; border: none !important; box-shadow: none !important; }
            .fc-event.is-dot-mode-event .fc-event-main { padding: 0 !important; background: transparent !important; }
    
            .sidebar-group { margin-bottom: 24px; }
            .sidebar-group-title { font-size: 0.75rem; font-weight: 900; color: var(--text-sub); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-left: 8px; border-left: 3px solid var(--theme); }
            .sidebar-menu-list { display: flex; flex-direction: column; gap: 4px; }
            .sidebar-menu-btn { width: 100%; text-align: left; padding: 10px 12px; border-radius: 10px; background: transparent; border: 1px solid transparent; color: var(--text-main); font-size: 0.9rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 10px; }
    
            .fc-timegrid-event-harness { transition: opacity 0.2s; overflow: visible !important; }
    
            .fc-event, .fc-v-event, .fc-timegrid-event, .fc-daygrid-event {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              overflow: visible !important;
            }
    
            .solid-allday-event {
              background: transparent !important;
              border: none !important;
              padding: 0 !important;
              opacity: 1 !important;
            }
    
            .solid-allday-event .fc-event-main {
              background: transparent !important;
              padding: 0 !important;
              display: flex !important;
              flex-direction: column !important;
              color: inherit !important;
            }
    
            .fc-bg-event.milestone-invisible-wrapper,
            .fc-event.milestone-invisible-wrapper {
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              opacity: 1 !important;
            }
    
            .smart-event-container {
              container-type: size;
              container-name: eventBox;
            }
    
            .title-horizontal {
              display: -webkit-box !important;
              -webkit-box-orient: vertical;
              overflow: hidden;
              white-space: normal !important;
              word-break: break-word !important;
            }
    
            .title-vertical {
              display: block !important;
              white-space: nowrap !important;
              overflow: hidden;
              text-overflow: ellipsis;
            }
    
            @container eventBox (max-height: 30px) or (max-width: 40px) {
              .priority-location { display: none !important; }
              .priority-time { display: none !important; }
              .priority-meta-container { margin-bottom: 0 !important; padding: 0 !important; }
              .title-horizontal { -webkit-line-clamp: 1 !important; }
            }
            @container eventBox (min-height: 31px) and (max-height: 45px) {
              .priority-location { display: none !important; }
              .priority-time { display: none !important; }
              .title-horizontal { -webkit-line-clamp: 2 !important; }
            }
            @container eventBox (min-height: 46px) and (max-height: 65px) {
              .priority-location { display: none !important; }
              .title-horizontal { -webkit-line-clamp: 2 !important; }
            }
            @container eventBox (min-height: 66px) and (max-height: 85px) {
              .title-horizontal { -webkit-line-clamp: 2 !important; }
            }
            @container eventBox (min-height: 86px) {
              .title-horizontal { -webkit-line-clamp: 5 !important; }
            }
    
            .smart-event-card {
              background: var(--card-bg);
              border-left: 4px solid var(--theme);
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.05);
              transition: all 0.2s ease;
              padding: 6px 8px;
            }
    
            .smart-event-card:hover {
              transform: translateY(-2px) scale(1.02);
              box-shadow: 0 8px 24px rgba(0,0,0,0.1);
              z-index: 20;
            }
    
            .checkbox-label {
              display: flex;
              align-items: center;
              gap: 10px;
              cursor: pointer;
              font-size: 0.85rem;
              font-weight: 900;
              color: var(--text-main);
              user-select: none;
              min-height: 40px;
            }
            .checkbox-label input[type="checkbox"] {
              width: 18px;
              height: 18px;
              accent-color: var(--theme);
              cursor: pointer;
            }
    
            .no-spin::-webkit-outer-spin-button,
            .no-spin::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            .no-spin {
              -moz-appearance: textfield;
            }
            .rule-input {
              width: 100%;
              height: 30px;
              padding: 0 6px;
              border-radius: 8px;
              border: 2px solid var(--border-color);
              background: var(--input-bg);
              font-size: 0.85rem;
              font-weight: 900;
              color: var(--text-main);
              outline: none;
              display: flex;
              align-items: center;
              box-sizing: border-box;
            }
            .rule-input:focus {
              border-color: var(--theme);
              box-shadow: 0 0 0 4px var(--theme-shadow);
            }
            .rule-input[type="number"]::-webkit-outer-spin-button,
            .rule-input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            .rule-input[type="number"] {
              -moz-appearance: textfield;
            }
              
            /* 👇 追加：仮予定のデザイン（斜め線＆半透明） */
            .tentative-event {
              opacity: 0.2 !important; /* 👈 さらに薄く（透明度を上げる） */
              border: 1.5px solid var(--theme) !important; /* 👈 点線(dashed)から実線(solid)に変更 */
              background-image: none !important;
              background-color: transparent !important;
              box-shadow: none !important;
            }
          `}</style>

      <div className="fixed-mobile-frame">
        {clipboardEvent && (
          <div
            style={{
              position: "fixed",
              bottom: "40px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(40, 40, 40, 0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              color: "#ffffff",
              padding: "12px 24px",
              borderRadius: "100px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
              zIndex: 9999,
              boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "12px", color: "#a1a1aa" }}>コピー中</span>
              <span style={{ fontSize: "15px", fontWeight: "bold", whiteSpace: "nowrap" }}>{clipboardEvent.title}</span>
            </div>
            <div style={{ width: "1px", height: "24px", backgroundColor: "rgba(255,255,255,0.2)" }} />
            <span style={{ fontSize: "13px", whiteSpace: "nowrap" }}>貼り付け先をタップ</span>
            <button
              onClick={() => setClipboardEvent(null)}
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "none",
                color: "white",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginLeft: "8px",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ヘッダー上部配置 */}
        {headerPosition === "top" && <Header currentYear={currentYear} currentMonthNum={currentMonthNum} currentDayNum={currentDayNum} viewType={viewType} setViewType={setViewType} calendarRef={calendarRef} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} setOpenSections={setOpenSections} setStoryDate={setStoryDate} setIsStoryModalOpen={setIsStoryModalOpen} isViewSelectorExpanded={isViewSelectorExpanded} setIsViewSelectorExpanded={setIsViewSelectorExpanded} isSearchMode={isSearchMode} setIsSearchMode={setIsSearchMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearchExecute={handleSearchExecute} handleYearMonthChange={handleYearMonthChange} blockCalendarClick={blockCalendarClick} setCurrentYear={setCurrentYear} setCurrentMonthNum={setCurrentMonthNum} setCurrentDayNum={setCurrentDayNum} firstDayOfWeek={firstDayOfWeek} headerPosition={headerPosition} />}

        {/* 👇 カレンダーのデザインを制御する統合スタイル（これ一つで全ての表示崩れと二重表示を直します） */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              /* =========================================
                 🌟 1. 全体ステルスグリッド設定
                 ========================================= */
              .fc-scrollgrid { border: none !important; }

              .fc-theme-standard td, .fc-theme-standard th { 
                border-color: rgba(150, 150, 150, 0.15) !important; 
                transition: border-color 0.3s; 
              }

              .fc-theme-standard th:last-child, 
              .fc-theme-standard td:last-child { 
                border-right: none !important; 
              }

              .fc-theme-standard .fc-scrollgrid-section-body:last-child td,
              .fc-theme-standard .fc-daygrid-body tr:last-child td {
                border-bottom: none !important;
              }

              .fc-theme-standard th { 
                padding: 0 !important; 
                border-bottom: none !important; 
              }

              .fc .fc-col-header-cell-cushion { padding: 4px 0 !important; }

              .fc-event { border-radius: 4px !important; cursor: pointer; border: none !important; transition: transform 0.1s; touch-action: none !important; }

              /* =========================================
                 🌟 2. 日付セル（数字）のレイアウト固定
                 ========================================= */
              /* 全ての「今日」のセルのベタ塗りを強制透明化 */
              .fc-day-today, .fc-timegrid-col.fc-day-today {
                background-color: transparent !important;
              }

              /* 日付エリアのレイアウトと干渉防止 */
              .fc-daygrid-day-top {
                display: flex !important;
                justify-content: center !important;
                align-items: center !important;
                padding-top: 2px !important;
                padding-bottom: 2px !important;
              }

              /* 日付の数字を22pxの正円の枠に固定 */
              .fc-daygrid-day-number {
                width: 22px !important; 
                height: 22px !important;
                min-width: 22px !important;
                min-height: 22px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                border-radius: 50% !important;
                font-size: 0.75rem !important;
                font-weight: 700 !important;
                text-decoration: none !important;
                line-height: 1 !important;
                padding: 0 !important;
                margin: 0 auto !important; /* 👈 中央寄せを強制 */
                box-sizing: border-box !important;
                background-color: transparent !important; /* 👈 古いベタ塗りを強制リセット */
                box-shadow: none !important; /* 👈 古い影を強制リセット */
                border: none !important;
              }

              /* =========================================
                 🌟 3. 今日のハイライト（美しいガラス風UI）
                 ========================================= */
              /* 月毎カレンダーの今日を「ガラス風」にハイライトし、二重表示を解消 */
              .fc-dayGridMonth-view .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
                background-color: var(--theme-shadow) !important;
                color: var(--theme) !important;
                border: 1.5px solid var(--theme) !important;
                font-weight: 900 !important;
                box-shadow: 0 4px 10px rgba(0,0,0,0.05) !important;
                backdrop-filter: blur(8px) !important;
                -webkit-backdrop-filter: blur(8px) !important;
              }

              /* 週間・日カレンダーの「今日」のヘッダーもガラス風に統一 */
              .fc-timeGridWeek-view .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion,
              .fc-timeGridDay-view .fc-col-header-cell.fc-day-today .fc-col-header-cell-cushion {
                background-color: var(--theme-shadow) !important;
                color: var(--theme) !important;
                border: 1.5px solid var(--theme) !important;
                border-radius: 8px !important;
                padding: 4px 8px !important;
                margin-top: 2px !important;
                margin-bottom: 2px !important;
                font-weight: 900 !important;
                box-shadow: 0 4px 10px rgba(0,0,0,0.05) !important;
                backdrop-filter: blur(8px) !important;
                -webkit-backdrop-filter: blur(8px) !important;
                display: inline-block !important;
                box-sizing: border-box !important;
              }

              /* =========================================
                 🌟 4. 週間・日カレンダーの不要物・バグ消去
                 ========================================= */
              /* 時間グリッド（横線・縦線）を極限まで薄くする */
              .fc-theme-standard .fc-timegrid-slot,
              .fc-theme-standard .fc-timegrid-col {
                border-color: rgba(150, 150, 150, 0.15) !important;
              }

              /* 🚨 週間・日カレンダーの終日枠（all-day）にある無駄な丸や日付を絶対に消す */
              .fc-timeGridWeek-view .fc-timegrid-allday .fc-daygrid-day-number,
              .fc-timeGridWeek-view .fc-timegrid-allday .fc-daygrid-day-top,
              .fc-timeGridDay-view .fc-timegrid-allday .fc-daygrid-day-number,
              .fc-timeGridDay-view .fc-timegrid-allday .fc-daygrid-day-top {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                height: 0 !important;
                width: 0 !important;
              }
            `,
          }}
        />

        {/* 👇 カレンダー全体ブロック（ヘッダー下部配置時は高さを一切変えずに、全体を16px下にスライドさせる） */}
        <div style={{ flex: 1, position: "relative", padding: "0 6px 16px 6px", overflow: "hidden" }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          <div className="glass-panel" style={{ position: "absolute", top: headerPosition === "bottom" ? "18px" : "2px", left: "0px", right: "0px", bottom: headerPosition === "bottom" ? "0px" : "16px", padding: "2px 4px", borderRadius: "20px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* 日毎カスタム円形ダッシュボード */}
            {viewType === "timeGridDay" && <DayCircleView currentYear={currentYear} currentMonthNum={currentMonthNum} currentDayNum={currentDayNum} displayEvents={displayEvents} holidays={holidays} walkTime={walkTime} startPointType={startPointType} calendarRef={calendarRef} blockCalendarClick={blockCalendarClick} handleEventClick={handleEventClick} />}

            {/* カレンダー本体ボード */}
            <CalendarBoard calendarRef={calendarRef} displayMode={displayMode} overlapMode={overlapMode} viewType={viewType} setViewType={setViewType} displayEvents={displayEvents} holidays={holidays} walkTime={walkTime} startPointType={startPointType} searchResults={searchResults} currentSearchIndex={currentSearchIndex} isDeleteMode={isDeleteMode} selectedForDelete={selectedForDelete} setSelectedForDelete={setSelectedForDelete} useEventColorForTitle={useEventColorForTitle} firstDayOfWeek={firstDayOfWeek} isDraggingRef={isDraggingRef} blockCalendarClick={blockCalendarClick} isSwipingRef={isSwipingRef} wasEventSelectedRef={wasEventSelectedRef} isSidebarOpen={isSidebarOpen} isViewSelectorExpanded={isViewSelectorExpanded} isDayPickerOpen={isDayPickerOpen} clipboardEvent={clipboardEvent} setClipboardEvent={setClipboardEvent} setMode={setMode} setSelectedId={setSelectedId} setTitle={setTitle} setLocation={setLocation} setCategoryName={setCategoryName} setEventColor={setEventColor} setStartH={setStartH} setStartM={setStartM} setEndH={setEndH} setEndM={setEndM} setIsAllDayBackground={setIsAllDayBackground} setIsMilestone={setIsMilestone} setCustomFieldsData={setCustomFieldsData} setStartDate={setStartDate} setEndDate={setEndDate} setIsModalOpen={setIsModalOpen} setIsViewSelectorExpanded={setIsViewSelectorExpanded} setCurrentYear={setCurrentYear} setCurrentMonthNum={setCurrentMonthNum} setCurrentDayNum={setCurrentDayNum} setIsDayPickerOpen={setIsDayPickerOpen} handleEventClick={handleEventClick} fetchEvents={fetchEvents} />
          </div>
        </div>

        {/* ヘッダー下部配置 */}
        {headerPosition === "bottom" && <Header currentYear={currentYear} currentMonthNum={currentMonthNum} currentDayNum={currentDayNum} viewType={viewType} setViewType={setViewType} calendarRef={calendarRef} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} setOpenSections={setOpenSections} setStoryDate={setStoryDate} setIsStoryModalOpen={setIsStoryModalOpen} isViewSelectorExpanded={isViewSelectorExpanded} setIsViewSelectorExpanded={setIsViewSelectorExpanded} isSearchMode={isSearchMode} setIsSearchMode={setIsSearchMode} searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleSearchExecute={handleSearchExecute} handleYearMonthChange={handleYearMonthChange} blockCalendarClick={blockCalendarClick} setCurrentYear={setCurrentYear} setCurrentMonthNum={setCurrentMonthNum} setCurrentDayNum={setCurrentDayNum} firstDayOfWeek={firstDayOfWeek} headerPosition={headerPosition} />}

        {isColorPickerOpen && (
          <div className="modal-overlay" onClick={() => setIsColorPickerOpen(false)}>
            <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ padding: "24px" }}>
              <ModalHeader title="テーマカラーの変更" onClose={() => setIsColorPickerOpen(false)} />
              <ColorSelector
                value={themeColor}
                onChange={(c) => {
                  setThemeColor(c);
                  setIsColorPickerOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {searchResults.length > 0 && !isDeleteMode && (
          <div className="glass-panel" style={{ position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)", border: `2px solid ${themeColor}`, borderRadius: "28px", padding: "10px 20px", display: "flex", alignItems: "center", gap: "16px", zIndex: 100, boxShadow: `0 10px 30px ${themeColor}33` }}>
            <span style={{ fontSize: "0.9rem", fontWeight: "900", color: "var(--text-main)" }}>
              {currentSearchIndex + 1} <span style={{ color: "var(--text-sub)", fontSize: "0.8rem" }}>/ {searchResults.length}</span>
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={prevSearchResult} className="btn-icon" style={{ width: "32px", height: "32px", borderRadius: "10px" }}>
                ▲
              </button>
              <button onClick={nextSearchResult} className="btn-icon" style={{ width: "32px", height: "32px", borderRadius: "10px" }}>
                ▼
              </button>
            </div>
            <button
              onClick={() => {
                setSearchResults([]);
                setSearchQuery("");
                setIsSearchMode(false);
              }}
              className="btn-close"
              style={{ width: "32px", height: "32px", background: "rgba(239,68,68,0.2)", color: "#ef4444", borderColor: "#fca5a5" }}
            >
              ×
            </button>
          </div>
        )}

        {isDeleteMode && (
          <div className="glass-panel" style={{ position: "absolute", bottom: "24px", left: "50%", transform: "translateX(-50%)", border: `2px solid #ef4444`, borderRadius: "28px", padding: "10px 20px", display: "flex", alignItems: "center", gap: "16px", zIndex: 100, boxShadow: `0 10px 30px rgba(239,68,68,0.3)` }}>
            <span style={{ fontSize: "0.9rem", fontWeight: "900", color: "var(--text-main)", whiteSpace: "nowrap" }}>
              {selectedForDelete.length} <span style={{ color: "var(--text-sub)", fontSize: "0.75rem" }}>件選択中</span>
            </span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={executeBulkDelete} className="btn-pop" style={{ background: "#ef4444", padding: "8px 16px", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                削除実行
              </button>
              <button
                onClick={() => {
                  setIsDeleteMode(false);
                  setSelectedForDelete([]);
                }}
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* サイドバー（別ファイルに分離済み！） */}
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        setOpenSections={setOpenSections}
        isNotificationEnabled={isNotificationEnabled}
        setIsNotificationEnabled={setIsNotificationEnabled}
        themeColor={themeColor}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearchExecute={handleSearchExecute}
        setIsSearchMode={setIsSearchMode}
        setIsColorPickerOpen={setIsColorPickerOpen}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        events={events}
        categories={categories}
        targetType={targetType}
        setTargetType={setTargetType}
        targetValue={targetValue}
        setTargetValue={setTargetValue}
        currentMonthEvents={currentMonthEvents}
        currentYearEvents={currentYearEvents}
        quickTemplates={quickTemplates}
        setQuickTemplates={setQuickTemplates}
        setMode={setMode}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        setStartH={setStartH}
        setStartM={setStartM}
        setEndH={setEndH}
        setEndM={setEndM}
        setTitle={setTitle}
        setLocation={setLocation}
        setMemo={setMemo}
        setPhotoUrls={setPhotoUrls}
        setIsStocked={setIsStocked}
        setIsTentative={setIsTentative}
        setRating={setRating}
        setIsPinned={setIsPinned}
        setIsModalOpen={setIsModalOpen}
        setCategoryName={setCategoryName}
        setIsAllDayBackground={setIsAllDayBackground}
        setEventColor={setEventColor}
        setIsAnalyticsModalOpen={setIsAnalyticsModalOpen}
        setIsGalleryOpen={setIsGalleryOpen}
        setIsCategoryModalOpen={setIsCategoryModalOpen}
        setIsRoutineModalOpen={setIsRoutineModalOpen}
        setIsAnniversaryModalOpen={setIsAnniversaryModalOpen}
        syncWithCloud={syncWithCloud}
        handleEventClick={handleEventClick}
        setCustomFieldsData={setCustomFieldsData}
        homeLocation={homeLocation}
        setHomeLocation={setHomeLocation}
        nearestStation={nearestStation}
        setNearestStation={setNearestStation}
        walkTime={walkTime}
        setWalkTime={setWalkTime}
        startPointType={startPointType}
        setStartPointType={setStartPointType}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        viewType={viewType}
        calendarCategoryFilter={calendarCategoryFilter}
        setCalendarCategoryFilter={setCalendarCategoryFilter}
        activeUserId={activeUserId}
        activeUserName={activeUserName}
        activeUserAvatar={activeUserAvatar}
        setActiveUserAvatar={setActiveUserAvatar}
        setActiveUserName={setActiveUserName}
        onLogout={handleLogout}
        setIsFinanceGraphOpen={setIsFinanceGraphOpen} // 👈 追加
        setIsScheduleAssistantOpen={setIsScheduleAssistantOpen}
        setIsAdvanceModalOpen={setIsAdvanceModalOpen}
        setIsTimetableModalOpen={setIsTimetableModalOpen}
        setIsTemplateModalOpen={setIsTemplateModalOpen}
        userProfile={userProfile}
        setIsProfileModalOpen={setIsProfileModalOpen}
        headerPosition={headerPosition}
        setHeaderPosition={setHeaderPosition}
      />

      {/* 📋 よくある予定（テンプレート）管理 モーダル */}
      {isTemplateModalOpen && <TemplateModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} quickTemplates={quickTemplates} setQuickTemplates={setQuickTemplates} editTemplateIndex={editTemplateIndex} setEditTemplateIndex={setEditTemplateIndex} templateForm={templateForm} setTemplateForm={setTemplateForm} categories={categories} activeUserId={activeUserId} endM={endM} ModalHeader={ModalHeader} />}

      {/* 🏫 時間割・週間ルーティン設定 モーダル（ここに配置するのが正解です！） */}
      {isTimetableModalOpen &&
        (() => {
          const WEEK_DAYS = ["日", "月", "火", "水", "木", "金", "土"];
          const currentDayRoutines = weeklyTimetables.filter((t: any) => t.dayOfWeek === timetableTab).sort((a: any, b: any) => parseInt(a.startH) * 60 + parseInt(a.startM) - (parseInt(b.startH) * 60 + parseInt(b.startM)));

          return (
            <div className="modal-overlay" onClick={() => setIsTimetableModalOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "15px" }}>
              <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", borderRadius: "28px", border: "1px solid var(--glass-border)", padding: "24px", background: "var(--bg-main)", color: "var(--text-main)", height: "80vh", display: "flex", flexDirection: "column" }}>
                <div style={{ flexShrink: 0 }}>
                  <ModalHeader title="時間割・週間ルーティン" onClose={() => setIsTimetableModalOpen(false)} />
                </div>

                <div className="hide-scrollbar" style={{ display: "flex", gap: "6px", marginBottom: "16px", flexShrink: 0, overflowX: "auto", paddingBottom: "4px" }}>
                  {[1, 2, 3, 4, 5, 6, 0].map((dayIdx) => (
                    <button key={dayIdx} onClick={() => setTimetableTab(dayIdx)} className={timetableTab === dayIdx ? "btn-pop" : "btn-secondary"} style={{ flexShrink: 0, padding: "8px 16px", fontSize: "0.8rem", borderRadius: "10px", background: timetableTab === dayIdx ? themeColor : "var(--input-bg)", color: timetableTab === dayIdx ? "#fff" : "var(--text-sub)", border: "none", fontWeight: "bold" }}>
                      {WEEK_DAYS[dayIdx]}
                    </button>
                  ))}
                  <button onClick={() => setTimetableTab(-1)} className={timetableTab === -1 ? "btn-pop" : "btn-secondary"} style={{ flexShrink: 0, padding: "8px 16px", fontSize: "0.8rem", borderRadius: "10px", background: timetableTab === -1 ? themeColor : "var(--input-bg)", color: timetableTab === -1 ? "#fff" : "var(--text-sub)", border: "none", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Settings2 size={14} /> 期間・例外設定
                  </button>
                </div>

                {timetableTab === -1 ? (
                  /* ⚙️ 期間・例外設定タブ */
                  <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px", paddingRight: "4px" }}>
                    <div className="card-box" style={{ margin: 0, padding: "16px" }}>
                      <label className="form-label" style={{ color: themeColor, fontSize: "0.9rem" }}>
                        学期・授業期間の設定
                      </label>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-sub)", marginBottom: "12px" }}>指定した期間以外はカレンダーに時間割が表示されなくなります。（複数登録可）</p>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                        {timetableTerms.map((term: any) => (
                          <div key={term.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--input-bg)", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--theme)" }}>{term.name || "名称未設定"}</span>
                              <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-main)" }}>
                                {term.start ? term.start.replace(/-/g, "/") : "未定"} 〜 {term.end ? term.end.replace(/-/g, "/") : "未定"}
                              </span>
                            </div>
                            <button onClick={() => setTimetableTerms(timetableTerms.filter((t: any) => t.id !== term.id))} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", background: "var(--input-bg)", padding: "12px", borderRadius: "12px", border: "1px dashed var(--theme)" }}>
                        <input type="text" className="pop-input" value={newTermName} onChange={(e) => setNewTermName(e.target.value)} placeholder="期間名 (例: 前期, 秋学期)" style={{ fontSize: "0.8rem", width: "100%" }} />
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-sub)", width: "40px" }}>開始日</span>
                          <input type="date" className="pop-input" value={newTermStart} onChange={(e) => setNewTermStart(e.target.value)} style={{ padding: "0 8px", fontSize: "0.8rem", flex: 1 }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-sub)", width: "40px" }}>終了日</span>
                          <input type="date" className="pop-input" value={newTermEnd} onChange={(e) => setNewTermEnd(e.target.value)} style={{ padding: "0 8px", fontSize: "0.8rem", flex: 1 }} />
                        </div>
                        <button
                          onClick={() => {
                            if (!newTermName) return alert("期間名を入力してください");
                            if (!newTermStart && !newTermEnd) return alert("開始日か終了日を指定してください");
                            setTimetableTerms([...timetableTerms, { id: Date.now().toString(), name: newTermName, start: newTermStart, end: newTermEnd }]);
                            setNewTermName("");
                            setNewTermStart("");
                            setNewTermEnd("");
                          }}
                          className="btn-pop"
                          style={{ padding: "10px", fontSize: "0.8rem", borderRadius: "10px", marginTop: "4px" }}
                        >
                          ＋ 期間を追加
                        </button>
                      </div>
                    </div>

                    <div className="card-box" style={{ margin: 0, padding: "16px" }}>
                      <label className="form-label" style={{ color: themeColor, fontSize: "0.9rem" }}>
                        休講・祝日授業の設定
                      </label>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-sub)", marginBottom: "12px" }}>祝日は自動的に休みになります。特別な日を設定してください。</p>

                      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", alignItems: "center" }}>
                        <input type="date" id="ex-date" className="pop-input" style={{ flex: 1.5, padding: "0 8px", fontSize: "0.8rem" }} />
                        <select id="ex-type" className="pop-input" style={{ flex: 1, padding: "0 8px", fontSize: "0.8rem" }}>
                          <option value="off">休講</option>
                          <option value="class">祝日授業日</option>
                        </select>
                        <button
                          onClick={() => {
                            const date = (document.getElementById("ex-date") as HTMLInputElement).value;
                            const type = (document.getElementById("ex-type") as HTMLSelectElement).value as "class" | "off";
                            if (date) setExceptionDays({ ...exceptionDays, [date]: type });
                          }}
                          className="btn-pop"
                          style={{ padding: "0 16px", fontSize: "0.8rem", borderRadius: "12px", height: "46px" }}
                        >
                          追加
                        </button>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {Object.entries(exceptionDays)
                          .sort()
                          .map(([date, type]) => (
                            <div key={date} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--input-bg)", padding: "10px 12px", borderRadius: "10px", border: "1px solid var(--border-color)" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ fontWeight: "bold", color: "var(--text-main)", fontSize: "0.9rem" }}>{date.replace(/-/g, "/")}</span>
                                <span style={{ fontSize: "0.75rem", fontWeight: "bold", padding: "4px 8px", borderRadius: "6px", background: type === "class" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: type === "class" ? "#10b981" : "#ef4444" }}>{type === "class" ? "祝日だけど授業あり" : "休講"}</span>
                              </div>
                              <button
                                onClick={() => {
                                  const newEx = { ...exceptionDays };
                                  delete newEx[date];
                                  setExceptionDays(newEx);
                                }}
                                style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer" }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                        {Object.keys(exceptionDays).length === 0 && <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-sub)", padding: "10px" }}>設定されていません</div>}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 📅 通常の曜日タブ */
                  <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", paddingRight: "4px" }}>
                    {currentDayRoutines.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "20px", color: "var(--text-sub)", fontSize: "0.8rem" }}>この曜日の授業・ルーティンはありません</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {currentDayRoutines.map((r: any, i: number) => {
                          const termName = timetableTerms.find((t) => t.id === r.termId)?.name || "全期間";
                          return (
                            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--card-bg)", padding: "12px", borderRadius: "12px", borderLeft: `6px solid ${r.color}`, borderTop: "1px solid var(--border-color)", borderRight: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "0.7rem", color: "var(--text-sub)", fontWeight: "bold" }}>
                                  {r.startH}:{r.startM} 〜 {r.endH}:{r.endM}
                                </div>
                                <div style={{ fontSize: "1rem", fontWeight: "900", color: "var(--text-main)" }}>
                                  {r.title} <span style={{ fontSize: "0.65rem", background: "var(--input-bg)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-sub)", marginLeft: "4px" }}>{r.lessonType}</span>
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "var(--text-sub)", marginTop: "2px" }}>
                                  {r.categoryName} {r.location && `📍 ${r.location}`} <span style={{ marginLeft: "6px", color: "var(--theme)" }}>[{termName}]</span>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                                <button
                                  onClick={() => {
                                    setEditTimetableId(r.id);
                                    (document.getElementById("tt-title") as HTMLInputElement).value = r.title;
                                    (document.getElementById("tt-category") as HTMLSelectElement).value = r.categoryName;
                                    (document.getElementById("tt-type") as HTMLSelectElement).value = r.lessonType;
                                    (document.getElementById("tt-start") as HTMLInputElement).value = `${r.startH}:${r.startM}`;
                                    (document.getElementById("tt-end") as HTMLInputElement).value = `${r.endH}:${r.endM}`;
                                    (document.getElementById("tt-loc") as HTMLInputElement).value = r.location || "";
                                    (document.getElementById("tt-term") as HTMLSelectElement).value = r.termId || "all";
                                  }}
                                  className="btn-secondary"
                                  style={{ padding: "6px 10px", fontSize: "0.75rem", borderRadius: "8px" }}
                                >
                                  編集
                                </button>
                                <button onClick={() => setWeeklyTimetables(weeklyTimetables.filter((item: any) => item.id !== r.id))} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "8px" }}>
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div style={{ background: editTimetableId ? "rgba(59, 130, 246, 0.1)" : "var(--input-bg)", padding: "16px", borderRadius: "16px", border: `1px dashed ${editTimetableId ? "#3b82f6" : "var(--theme)"}` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: editTimetableId ? "#3b82f6" : "var(--theme)" }}>{editTimetableId ? "✏️ コマを編集" : "新しいコマを追加"}</span>
                        {editTimetableId && (
                          <button
                            onClick={() => {
                              setEditTimetableId(null);
                              (document.getElementById("tt-title") as HTMLInputElement).value = "";
                            }}
                            style={{ background: "transparent", border: "none", color: "var(--text-sub)", fontSize: "0.75rem", cursor: "pointer" }}
                          >
                            キャンセル
                          </button>
                        )}
                      </div>

                      <select className="pop-input" id="tt-term" style={{ marginBottom: "8px", fontSize: "0.8rem", width: "100%" }}>
                        <option value="all">全期間 (通年)</option>
                        {timetableTerms.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.start?.replace(/-/g, "/")}〜)
                          </option>
                        ))}
                      </select>

                      <input type="text" className="pop-input" placeholder="授業名・ルーティン名" id="tt-title" style={{ marginBottom: "8px", fontSize: "0.85rem" }} />
                      <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                        <select className="pop-input" id="tt-category" style={{ flex: 1, padding: "0 8px", fontSize: "0.8rem" }}>
                          <option value="大学">大学</option>
                          {categories.map((c: any) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <select className="pop-input" id="tt-type" style={{ width: "100px", padding: "0 8px", fontSize: "0.8rem" }}>
                          <option value="対面">対面</option>
                          <option value="ｵﾝライン">ｵﾝライン</option>
                          <option value="ｵﾝﾃﾞﾏﾝﾄﾞ">ｵﾝﾃﾞﾏﾝﾄﾞ</option>
                        </select>
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                        <input type="time" className="pop-input" id="tt-start" defaultValue="09:00" step="300" style={{ flex: 1, padding: "0 8px" }} />
                        <span style={{ fontWeight: "bold", color: "var(--text-sub)" }}>〜</span>
                        <input type="time" className="pop-input" id="tt-end" defaultValue="10:30" step="300" style={{ flex: 1, padding: "0 8px" }} />
                      </div>
                      <input type="text" className="pop-input" placeholder="教室・場所 (任意)" id="tt-loc" style={{ marginBottom: "12px", fontSize: "0.85rem" }} />
                      <button
                        onClick={() => {
                          const title = (document.getElementById("tt-title") as HTMLInputElement).value;
                          const cat = (document.getElementById("tt-category") as HTMLSelectElement).value;
                          const type = (document.getElementById("tt-type") as HTMLSelectElement).value;
                          const start = (document.getElementById("tt-start") as HTMLInputElement).value;
                          const end = (document.getElementById("tt-end") as HTMLInputElement).value;
                          const loc = (document.getElementById("tt-loc") as HTMLInputElement).value;
                          const termId = (document.getElementById("tt-term") as HTMLSelectElement).value;
                          if (!title || !start || !end) return alert("タイトルと時間を入力してください");
                          const catObj = categories.find((c: any) => c.name === cat);
                          const color = catObj ? catObj.color : "#3b82f6";

                          if (editTimetableId) {
                            setWeeklyTimetables(weeklyTimetables.map((item) => (item.id === editTimetableId ? { ...item, title, categoryName: cat, startH: start.split(":")[0], startM: start.split(":")[1], endH: end.split(":")[0], endM: end.split(":")[1], location: loc, lessonType: type, color, termId } : item)));
                            setEditTimetableId(null);
                          } else {
                            setWeeklyTimetables([...weeklyTimetables, { id: Date.now().toString(), dayOfWeek: timetableTab, title, categoryName: cat, startH: start.split(":")[0], startM: start.split(":")[1], endH: end.split(":")[0], endM: end.split(":")[1], location: loc, lessonType: type, color, termId }]);
                          }
                          (document.getElementById("tt-title") as HTMLInputElement).value = "";
                          (document.getElementById("tt-loc") as HTMLInputElement).value = "";
                        }}
                        className="btn-pop"
                        style={{ width: "100%", padding: "12px", fontSize: "0.9rem", background: editTimetableId ? "#3b82f6" : "var(--theme)" }}
                      >
                        {editTimetableId ? "更新する" : "この曜日に登録"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

      {/* 日付選択モーダル */}
      {isDayPickerOpen && (
        <div className="modal-overlay" onClick={() => setIsDayPickerOpen(false)}>
          <div className="modal-content glass-panel" style={{ maxWidth: "340px", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
            <ModalHeader title={`${currentMonthNum}月の日の選択`} onClose={() => setIsDayPickerOpen(false)} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px" }}>
              {getDaysOfMonth().map((d: any) => (
                <button key={d.value} onClick={() => handleDayChange(d.value)} className={currentDayNum === d.value ? "btn-pop" : "btn-secondary"} style={{ padding: "10px 0", fontSize: "0.9rem", borderRadius: "12px" }}>
                  {d.value}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 記念日モーダル */}
      {isAnniversaryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAnniversaryModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ padding: "24px" }}>
            <ModalHeader title="記念日を設定" onClose={() => setIsAnniversaryModalOpen(false)} />
            <div style={{ marginBottom: "20px", maxHeight: "180px", overflowY: "auto" }} className="hide-scrollbar">
              {anniversaries.map((a: any, idx: number) =>
                renderListItem(
                  `anniv-${idx}`,
                  a.color,
                  `${a.date.replace("-", "/")} : ${a.title}`,
                  () => {
                    setEditAnnivIndex(idx);
                    setNewAnnivTitle(a.title);
                    const [em, ed] = a.date.split("-");
                    setNewAnnivMonth(em);
                    setNewAnnivDay(ed);
                    setNewAnnivColor(a.color);
                  },
                  () => setAnniversaries(anniversaries.filter((_, i) => i !== idx)),
                ),
              )}{" "}
            </div>
            <div className="card-box">
              <label className="form-label">{editAnnivIndex !== null ? "記念日を編集" : "新しく追加（毎年表示）"}</label>
              <input type="text" className="pop-input" style={{ marginBottom: "10px" }} value={newAnnivTitle} onChange={(e) => setNewAnnivTitle(e.target.value)} placeholder="例：結婚記念日" />
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <select className="pop-input" style={{ flex: 1, padding: "0 8px", textAlign: "center" }} value={newAnnivMonth} onChange={(e) => setNewAnnivMonth(e.target.value)}>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                      <option key={m} value={m}>
                        {m}月
                      </option>
                    ))}
                  </select>
                  <select className="pop-input" style={{ flex: 1, padding: "0 8px", textAlign: "center" }} value={newAnnivDay} onChange={(e) => setNewAnnivDay(e.target.value)}>
                    {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
                      <option key={d} value={d}>
                        {d}日
                      </option>
                    ))}
                  </select>
                </div>
                <ColorSelector value={newAnnivColor} onChange={setNewAnnivColor} />
              </div>
              <button onClick={handleAddAnniversary} className="btn-pop" style={{ width: "100%" }}>
                {editAnnivIndex !== null ? "更新する" : "追加する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ルーティンモーダル */}
      {isRoutineModalOpen && <RoutineModal isOpen={isRoutineModalOpen} onClose={() => setIsRoutineModalOpen(false)} monthlyRoutines={monthlyRoutines} setMonthlyRoutines={setMonthlyRoutines} editRoutineIndex={editRoutineIndex} setEditRoutineIndex={setEditRoutineIndex} newRoutineTitle={newRoutineTitle} setNewRoutineTitle={setNewRoutineTitle} newRoutineDay={newRoutineDay} setNewRoutineDay={setNewRoutineDay} newRoutineColor={newRoutineColor} setNewRoutineColor={setNewRoutineColor} newRoutineType={newRoutineType} setNewRoutineType={setNewRoutineType} newRoutineCycle={newRoutineCycle} setNewRoutineCycle={setNewRoutineCycle} newRoutineDayOfWeek={newRoutineDayOfWeek} setNewRoutineDayOfWeek={setNewRoutineDayOfWeek} handleAddRoutine={handleAddRoutine} renderListItem={renderListItem} ColorSelector={ColorSelector} ModalHeader={ModalHeader} />}

      {/* ジャンル編集モーダル（別ファイルに分離済み！） */}
      {isCategoryModalOpen && <CategoryStudio isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} categories={categories} setCategories={setCategories} themeColor={themeColor} activePresets={activePresets} userColors={userColors} setUserColors={setUserColors} />}

      {/* 👇 ここから振り返りダッシュボードのコードを追加 👇 */}
      {/* 📊 振り返りダッシュボード モーダル */}
      {isAnalyticsModalOpen &&
        (() => {
          const targetPrefix = analyticsSpan.includes("month") ? `${analyticsYear}-${String(analyticsMonth).padStart(2, "0")}` : `${analyticsYear}`;

          const targetEvents = events.filter((e: any) => e.start && e.start.startsWith(targetPrefix) && !e.extendedProps?.isAnniversary && !e.extendedProps?.isRoutine && !String(e.id).startsWith("sub-"));

          // カテゴリごとの集計
          const catCounts: Record<string, number> = {};
          targetEvents.forEach((e: any) => {
            const cat = e.extendedProps?.category || "未分類";
            catCounts[cat] = (catCounts[cat] || 0) + 1;
          });

          const sortedCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]);

          return (
            <div className="modal-overlay" onClick={() => setIsAnalyticsModalOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "15px" }}>
              <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", borderRadius: "28px", border: "1px solid var(--glass-border)", padding: "24px", background: "var(--bg-main)", color: "var(--text-main)", height: "70vh", display: "flex", flexDirection: "column" }}>
                <div style={{ flexShrink: 0 }}>
                  <ModalHeader title="振り返りダッシュボード" onClose={() => setIsAnalyticsModalOpen(false)} />
                </div>

                <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexShrink: 0 }}>
                  <select className="pop-input" value={analyticsYear} onChange={(e) => setAnalyticsYear(e.target.value)} style={{ flex: 1, padding: "0 8px", textAlign: "center" }}>
                    {[currentYear, String(Number(currentYear) - 1), String(Number(currentYear) - 2)].map((y) => (
                      <option key={y} value={y}>
                        {y}年
                      </option>
                    ))}
                  </select>
                  <select className="pop-input" value={analyticsMonth} onChange={(e) => setAnalyticsMonth(e.target.value)} style={{ flex: 1, padding: "0 8px", textAlign: "center" }}>
                    {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                      <option key={m} value={m}>
                        {m}月
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexShrink: 0 }}>
                  <button onClick={() => setAnalyticsSpan("month")} className={analyticsSpan === "month" ? "btn-pop" : "btn-secondary"} style={{ flex: 1, padding: "8px", fontSize: "0.85rem", borderRadius: "12px" }}>
                    月間
                  </button>
                  <button onClick={() => setAnalyticsSpan("year")} className={analyticsSpan === "year" ? "btn-pop" : "btn-secondary"} style={{ flex: 1, padding: "8px", fontSize: "0.85rem", borderRadius: "12px" }}>
                    年間
                  </button>
                </div>

                <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", paddingRight: "4px" }}>
                  <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "16px", border: "1px solid var(--theme)", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-sub)" }}>{analyticsSpan === "month" ? `${analyticsMonth}月` : `${analyticsYear}年`}の総予定数</span>
                    <span style={{ fontSize: "2rem", fontWeight: "900", color: "var(--theme)" }}>
                      {targetEvents.length} <span style={{ fontSize: "1rem", color: "var(--text-sub)" }}>件</span>
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-main)", marginBottom: "8px", display: "block" }}>ジャンル別の内訳</span>
                    {sortedCats.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "20px", color: "var(--text-sub)", fontSize: "0.8rem" }}>データがありません</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {sortedCats.map(([cat, count]) => {
                          const catObj = categories.find((c: any) => c.name === cat);
                          const cColor = catObj ? catObj.color : "var(--theme)";
                          const percentage = Math.round((count / targetEvents.length) * 100);
                          return (
                            <div key={cat} style={{ background: "var(--card-bg)", padding: "12px", borderRadius: "12px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "6px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: cColor }} />
                                  {cat}
                                </span>
                                <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-sub)" }}>
                                  {count}件 ({percentage}%)
                                </span>
                              </div>
                              <div style={{ width: "100%", height: "6px", background: "var(--input-bg)", borderRadius: "3px", overflow: "hidden" }}>
                                <div style={{ width: `${percentage}%`, height: "100%", background: cColor, borderRadius: "3px" }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* 📊 収支グラフ（棒グラフ）モーダル */}
      {isFinanceGraphOpen && <FinanceModal isOpen={isFinanceGraphOpen} onClose={() => setIsFinanceGraphOpen(false)} events={events} currentYear={currentYear} currentMonthNum={currentMonthNum} graphSpan={graphSpan} setGraphSpan={setGraphSpan} ModalHeader={ModalHeader} />}

      {/* 🖼 思い出ギャラリー モーダル */}
      {isGalleryOpen && (
        <div className="modal-overlay" onClick={() => setIsGalleryOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "15px" }}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", borderRadius: "28px", border: "1px solid var(--glass-border)", padding: "24px", background: "var(--bg-main)", color: "var(--text-main)", height: "70vh", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
            <div style={{ flexShrink: 0 }}>
              <ModalHeader title="思い出ギャラリー" onClose={() => setIsGalleryOpen(false)} />
            </div>

            <div className="hide-scrollbar" style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "15px", flexShrink: 0, paddingBottom: "4px", whiteSpace: "nowrap" }}>
              <button onClick={() => setGalleryCategory("すべて")} style={{ background: galleryCategory === "すべて" ? themeColor : "var(--input-bg)", color: galleryCategory === "すべて" ? "#fff" : "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "8px 16px", fontSize: "0.85rem", fontWeight: "900", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}>
                すべて
              </button>
              {categories
                .filter((c: any) => c.allowPhoto)
                .map((c: any) => (
                  <button key={c.name} onClick={() => setGalleryCategory(c.name)} style={{ background: galleryCategory === c.name ? c.color : "var(--input-bg)", color: galleryCategory === c.name ? "#fff" : "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "8px 16px", fontSize: "0.85rem", fontWeight: "900", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}>
                    {c.name}
                  </button>
                ))}
            </div>

            <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", paddingRight: "4px", alignContent: "start" }}>
              {events
                .filter((e: any) => e.extendedProps?.metadata?.photoUrls && e.extendedProps.metadata.photoUrls.length > 0)
                .filter((e: any) => galleryCategory === "すべて" || e.extendedProps.category === galleryCategory)
                .sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime())
                .flatMap((e: any) =>
                  e.extendedProps.metadata.photoUrls.map((url: string, index: number) => (
                    <div key={`${e.id}-${index}`} style={{ width: "100%", aspectRatio: "1/1", borderRadius: "12px", overflow: "hidden", backgroundColor: "var(--input-bg)", border: "1px solid var(--border-color)", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
                      <img
                        src={url}
                        alt="memory"
                        onClick={() => {
                          setIsGalleryOpen(false);
                          handleEventClick({ event: e });
                        }}
                        style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer", transition: "transform 0.3s" }}
                        onMouseOver={(ev) => (ev.currentTarget.style.transform = "scale(1.05)")}
                        onMouseOut={(ev) => (ev.currentTarget.style.transform = "scale(1)")}
                      />
                    </div>
                  )),
                )}
              {events.filter((e: any) => e.extendedProps?.metadata?.photoUrls && e.extendedProps.metadata.photoUrls.length > 0).length === 0 && <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "var(--text-sub)", fontWeight: "900", fontSize: "0.9rem" }}>思い出の写真を追加しましょう</div>}
            </div>
          </div>
        </div>
      )}

      {/* 🤝 立替・貸し借り管理 モーダル */}
      {isAdvanceModalOpen && <AdvanceModal isOpen={isAdvanceModalOpen} onClose={() => setIsAdvanceModalOpen(false)} events={events} themeColor={themeColor} activeUserId={activeUserId} advanceTab={advanceTab} setAdvanceTab={setAdvanceTab} viewingPartner={viewingPartner} setViewingPartner={setViewingPartner} customPayees={customPayees} setCustomPayees={setCustomPayees} newPayeeName={newPayeeName} setNewPayeeName={setNewPayeeName} fetchEvents={fetchEvents} ModalHeader={ModalHeader} />}

      {/* 👤 プロフィール設定 モーダル */}
      {isProfileModalOpen && <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} cropImageSrc={cropImageSrc} setCropImageSrc={setCropImageSrc} setCropZoom={setCropZoom} setCropPanX={setCropPanX} setCropPanY={setCropPanY} userProfile={userProfile} setUserProfile={setUserProfile} activeUserId={activeUserId} activeUserName={activeUserName} setActiveUserName={setActiveUserName} syncWithCloud={syncWithCloud} handleLogout={handleLogout} ModalHeader={ModalHeader} />}

      {/* 👇 ここから追加：🎞️ デイリー・ストーリー モーダル 👇 */}
      {isStoryModalOpen &&
        storyDate &&
        (() => {
          const dayEvents = events.filter((e: any) => e.start?.startsWith(storyDate));
          const dayPhotos = dayEvents.flatMap((e: any) => e.extendedProps?.metadata?.photoUrls || []);
          let totalIncome = 0;
          let totalExpense = 0;
          dayEvents.forEach((e: any) => {
            const cf = e.extendedProps?.metadata?.customFields || {};
            if (cf.isExpenseSet && cf.standardExpenseAmount) totalExpense += Number(cf.standardExpenseAmount);
            if (cf.isIncomeSet && cf.standardIncomeAmount) totalIncome += Number(cf.standardIncomeAmount);
          });

          return (
            <div className="modal-overlay" onClick={() => setIsStoryModalOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "#000", zIndex: 9999, display: "flex", flexDirection: "column", color: "#fff" }}>
              <div style={{ display: "flex", gap: "4px", padding: "16px 8px 8px 8px", marginTop: "env(safe-area-inset-top)" }}>
                <div style={{ flex: 1, height: "3px", background: "rgba(255,255,255,0.3)", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{ width: "100%", height: "100%", background: "#fff", borderRadius: "2px", animation: "progress 5s linear forwards" }} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px" }}>
                <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>{storyDate.replace(/-/g, "/")}</div>
                <button onClick={() => setIsStoryModalOpen(false)} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer" }}>
                  ×
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }} className="hide-scrollbar">
                {dayPhotos.length > 0 ? (
                  <div style={{ width: "100%", aspectRatio: "4/5", borderRadius: "24px", overflow: "hidden", border: "2px solid rgba(255,255,255,0.2)", position: "relative" }}>
                    <img src={dayPhotos[0]} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="highlight" />
                    <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", background: "linear-gradient(transparent, rgba(0,0,0,0.8))", padding: "24px 16px", color: "#fff", fontWeight: "bold", fontSize: "1.2rem" }}>今日のハイライト</div>
                  </div>
                ) : (
                  <div style={{ width: "100%", padding: "40px", textAlign: "center", background: "rgba(255,255,255,0.1)", borderRadius: "24px", fontWeight: "bold" }}>写真はまだありません📸</div>
                )}

                <div style={{ background: "rgba(255,255,255,0.1)", padding: "20px", borderRadius: "24px", backdropFilter: "blur(10px)" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Clock size={18} /> 今日の予定まとめ
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {dayEvents.map((e: any) => (
                      <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "4px", height: "24px", background: e.extendedProps?.cColor || e.backgroundColor || themeColor, borderRadius: "2px" }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>{e.title}</div>
                          {e.extendedProps?.metadata?.companions?.length > 0 && <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", marginTop: "4px" }}>with {e.extendedProps.metadata.companions.join(", ")}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {(totalIncome > 0 || totalExpense > 0) && (
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div style={{ flex: 1, background: "rgba(16,185,129,0.2)", padding: "16px", borderRadius: "20px", border: "1px solid rgba(16,185,129,0.3)" }}>
                      <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: "bold", marginBottom: "4px" }}>収入</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#fff" }}>¥{totalIncome.toLocaleString()}</div>
                    </div>
                    <div style={{ flex: 1, background: "rgba(239,68,68,0.2)", padding: "16px", borderRadius: "20px", border: "1px solid rgba(239,68,68,0.3)" }}>
                      <div style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: "bold", marginBottom: "4px" }}>支出</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#fff" }}>¥{totalExpense.toLocaleString()}</div>
                    </div>
                  </div>
                )}
              </div>

              <style>{`
                  @keyframes progress { from { width: 0%; } to { width: 100%; } }
                `}</style>
            </div>
          );
        })()}

      {/* 予定追加・編集・支出・サブスク入力モーダル */}
      {isModalOpen && <EventModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} mode={mode} setMode={setMode} selectedId={selectedId} title={title} setTitle={setTitle} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} startH={startH} startM={startM} endH={endH} endM={endM} setEndH={setEndH} setEndM={setEndM} handleStartHChange={handleStartHChange} handleStartMChange={handleStartMChange} location={location} setLocation={setLocation} categoryName={categoryName} setCategoryName={setCategoryName} eventColor={eventColor} setEventColor={setEventColor} isAllDayBackground={isAllDayBackground} setIsAllDayBackground={setIsAllDayBackground} isMilestone={isMilestone} setIsMilestone={setIsMilestone} isPinned={isPinned} setIsPinned={setIsPinned} isTentative={isTentative} setIsTentative={setIsTentative} memo={memo} setMemo={setMemo} photoUrls={photoUrls} setPhotoUrls={setPhotoUrls} handlePhotoUpload={handlePhotoUpload} companions={companions} setCompanions={setCompanions} companionInput={companionInput} setCompanionInput={setCompanionInput} selectedDays={selectedDays} setSelectedDays={setSelectedDays} customFieldsData={customFieldsData} handleCustomFieldChange={handleCustomFieldChange} handleScoreChange={handleScoreChange} isGathering={isGathering} setIsGathering={setIsGathering} gatheringTime={gatheringTime} setGatheringTime={setGatheringTime} departureTime={departureTime} setDepartureTime={setDepartureTime} expandedBlocks={expandedBlocks} toggleBlock={toggleBlock} expenseAmount={expenseAmount} setExpenseAmount={setExpenseAmount} subName={subName} setSubName={setSubName} subAmount={subAmount} setSubAmount={setSubAmount} subCycle={subCycle} setSubCycle={setSubCycle} subDate={subDate} setSubDate={setSubDate} subs={subs} setSubs={setSubs} routineAmount={routineAmount} setRoutineAmount={setRoutineAmount} routineBonusAmount={routineBonusAmount} setRoutineBonusAmount={setRoutineBonusAmount} categories={categories} themeColor={themeColor} activeUserId={activeUserId} events={events} customPayees={customPayees} setCustomPayees={setCustomPayees} quickTemplates={quickTemplates} setQuickTemplates={setQuickTemplates} homeLocation={homeLocation} nearestStation={nearestStation} startPointType={startPointType} isDarkMode={isDarkMode} isRecordDetailsOpen={isRecordDetailsOpen} setIsRecordDetailsOpen={setIsRecordDetailsOpen} handleSave={handleSave} handleDelete={handleDelete} handleDuplicate={handleDuplicate} handleCompleteRoutine={handleCompleteRoutine} handleRecordRoutineMoney={handleRecordRoutineMoney} fetchEvents={fetchEvents} setIsScheduleAssistantOpen={setIsScheduleAssistantOpen} setAssistTimeSlots={setAssistTimeSlots} setAssistMode={setAssistMode} setCustomFieldsData={setCustomFieldsData} ColorSelector={ColorSelector} ExpenseTypeSelector={ExpenseTypeSelector} PaymentMethodSelector={PaymentMethodSelector} PayeeComboInput={PayeeComboInput} ModalHeader={ModalHeader} />}
    </div>
  );
}
