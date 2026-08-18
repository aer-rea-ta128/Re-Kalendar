"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Moon, Sun, Clock, Target, Star, Edit3, PieChart, Image as ImageIcon, Palette, Repeat, Gift, Database, Banknote, MapPin, Home, Train, Footprints, ChevronDown, ChevronRight, LayoutDashboard, Zap, FolderKanban, Settings2, Globe, History as HistoryIcon, GripVertical, LogOut, User, TrendingUp, Users, Send, MessageSquare, Handshake, CheckCircle, Trash2, CreditCard, Smartphone, Landmark, Calendar as CalendarIcon, Inbox, Bell, Sparkles } from "lucide-react";
import { toLocalYYYYMMDD, hexToRgba } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabase";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenSections: React.Dispatch<React.SetStateAction<string[]>>;
  themeColor: string;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  handleSearchExecute: () => void;
  setIsSearchMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsColorPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  events: any[];
  categories: any[];
  targetType: string;
  setTargetType: React.Dispatch<React.SetStateAction<string>>;
  targetValue: string;
  setTargetValue: React.Dispatch<React.SetStateAction<string>>;
  currentMonthEvents: any[];
  currentYearEvents: any[];
  quickTemplates: any[];
  setQuickTemplates: React.Dispatch<React.SetStateAction<any[]>>;
  setMode: React.Dispatch<React.SetStateAction<any>>;
  setStartDate: React.Dispatch<React.SetStateAction<string>>;
  setEndDate: React.Dispatch<React.SetStateAction<string>>;
  setStartH: React.Dispatch<React.SetStateAction<string>>;
  setStartM: React.Dispatch<React.SetStateAction<string>>;
  setEndH: React.Dispatch<React.SetStateAction<string>>;
  setEndM: React.Dispatch<React.SetStateAction<string>>;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  setLocation: React.Dispatch<React.SetStateAction<string>>;
  setMemo: React.Dispatch<React.SetStateAction<string>>;
  setPhotoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  setIsStocked: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTentative: React.Dispatch<React.SetStateAction<boolean>>;
  setRating: React.Dispatch<React.SetStateAction<number>>;
  setIsPinned: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCategoryName: React.Dispatch<React.SetStateAction<string>>;
  setIsAllDayBackground: React.Dispatch<React.SetStateAction<boolean>>;
  setEventColor: React.Dispatch<React.SetStateAction<string>>;
  setIsAnalyticsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsGalleryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCategoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRoutineModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAnniversaryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  syncWithCloud: () => void;
  handleEventClick: (info: any) => void;
  setCustomFieldsData: React.Dispatch<React.SetStateAction<any>>;
  homeLocation: string;
  setHomeLocation: React.Dispatch<React.SetStateAction<string>>;
  nearestStation: string;
  setNearestStation: React.Dispatch<React.SetStateAction<string>>;
  walkTime: string;
  setWalkTime: React.Dispatch<React.SetStateAction<string>>;
  startPointType: string;
  setStartPointType: React.Dispatch<React.SetStateAction<string>>;
  displayMode: string;
  setDisplayMode: React.Dispatch<React.SetStateAction<string>>;
  viewType: string;
  calendarCategoryFilter: string;
  setCalendarCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
  activeUserId: string | null;
  activeUserName: string;
  activeUserAvatar: string;
  setActiveUserAvatar: React.Dispatch<React.SetStateAction<string>>;
  setActiveUserName: React.Dispatch<React.SetStateAction<string>>;
  onLogout: () => void;
  setIsFinanceGraphOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsScheduleAssistantOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAdvanceModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTimetableModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTemplateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userProfile: any;
  setIsProfileModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isNotificationEnabled: boolean;
  setIsNotificationEnabled: (val: boolean) => void;
}

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, setOpenSections, themeColor, searchQuery, setSearchQuery, handleSearchExecute, setIsSearchMode, setIsColorPickerOpen, isDarkMode, setIsDarkMode, events, categories, targetType, setTargetType, targetValue, setTargetValue, currentMonthEvents, currentYearEvents, quickTemplates, setQuickTemplates, setMode, setStartDate, setEndDate, setStartH, setStartM, setEndH, setEndM, setTitle, setLocation, setMemo, setPhotoUrls, setIsStocked, setIsTentative, setRating, setIsPinned, setIsModalOpen, setCategoryName, setIsAllDayBackground, setEventColor, setIsAnalyticsModalOpen, setIsGalleryOpen, setIsCategoryModalOpen, setIsRoutineModalOpen, setIsAnniversaryModalOpen, syncWithCloud, handleEventClick, setCustomFieldsData, homeLocation, setHomeLocation, nearestStation, setNearestStation, walkTime, setWalkTime, startPointType, setStartPointType, displayMode, setDisplayMode, viewType, calendarCategoryFilter, setCalendarCategoryFilter, activeUserId, activeUserName, activeUserAvatar, setActiveUserAvatar, setActiveUserName, onLogout, setIsFinanceGraphOpen, setIsScheduleAssistantOpen, setIsAdvanceModalOpen, setIsTimetableModalOpen, setIsTemplateModalOpen, userProfile, setIsProfileModalOpen, isNotificationEnabled, setIsNotificationEnabled }: SidebarProps) {
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isCategoryHistoryOpen, setIsCategoryHistoryOpen] = useState(false);
  const [historyCategory, setHistoryCategory] = useState("すべて");
  const [historyTimeFilter, setHistoryTimeFilter] = useState<"past" | "future">("past");
  const [isTravelMapOpen, setIsTravelMapOpen] = useState(false);

  const [visitedPrefs, setVisitedPrefs] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    const saved = localStorage.getItem("os_visitedPrefs");
    try {
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [historySpan, setHistorySpan] = useState<"month" | "year" | "all">("month");
  const [financeTypeFilter, setFinanceTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [isFinanceHistoryOpen, setIsFinanceHistoryOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [isKeepSectionOpen, setIsKeepSectionOpen] = useState(false);
  const [isInlineSearchOpen, setIsInlineSearchOpen] = useState(false);

  const [incomeCalcBasis, setIncomeCalcBasis] = useState<"wage" | "payday">(() => {
    if (typeof window === "undefined") return "wage";
    return (localStorage.getItem("os_incomeCalcBasis") as "wage" | "payday") || "wage";
  });

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  useEffect(() => {
    localStorage.setItem("os_visitedPrefs", JSON.stringify(visitedPrefs));
    localStorage.setItem("os_incomeCalcBasis", incomeCalcBasis);
  }, [visitedPrefs, incomeCalcBasis]);

  const DEFAULT_MENU_GROUPS = [
    {
      id: "grp_schedule",
      title: "予定・スケジュール",
      icon: CalendarIcon,
      accent: themeColor,
      items: [
        { id: "template_settings", label: "よくある予定の管理", icon: Star, color: "#f59e0b" },
        { id: "timetable_settings", label: "時間割・週間ルーティン", icon: CalendarIcon, color: "#3b82f6" },
        { id: "routine_settings", label: "毎月の予定(給料等)", icon: Repeat, color: "#8b5cf6" },
        { id: "anniversary_settings", label: "記念日管理", icon: Gift, color: "#ec4899" },
      ],
    },
    {
      id: "grp_finance",
      title: "収支・お金",
      icon: Banknote,
      accent: "#10b981",
      items: [
        { id: "finance_single", label: "単発の収支を記録", icon: Banknote, color: "#10b981" },
        { id: "finance_graph", label: "収支推移グラフ", icon: PieChart, color: "#10b981" },
        { id: "finance_history", label: "すべての収支履歴", icon: HistoryIcon, color: "#10b981" },
        { id: "advance_manage", label: "立替・貸し借り管理", icon: Handshake, color: "#f59e0b" },
        { id: "subscription_settings", label: "サブスク管理", icon: CreditCard, color: "#8b5cf6" },
      ],
    },
    {
      id: "grp_record",
      title: "記録・振り返り",
      icon: PieChart,
      accent: "#06b6d4",
      items: [
        { id: "dashboard", label: "振り返りダッシュボード", icon: LayoutDashboard, color: "#06b6d4" },
        { id: "category_history", label: "ジャンル別の履歴", icon: FolderKanban, color: "#3b82f6" },
        { id: "gallery", label: "思い出ギャラリー", icon: ImageIcon, color: "#a855f7" },
        { id: "travel_map", label: "トラベル・マップ", icon: Globe, color: "#10b981" },
      ],
    },
    {
      id: "grp_tool",
      title: "ツール",
      icon: Settings2,
      accent: "#64748b",
      items: [
        { id: "schedule_assistant", label: "日程調整アシスタント", icon: Users, color: "#f59e0b" },
        { id: "category_settings", label: "ジャンル・カテゴリー設定", icon: Palette, color: themeColor },
      ],
    },
  ];

  // グループ全体の並び順
  const [groupOrder, setGroupOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") return ["grp_schedule", "grp_finance", "grp_record", "grp_tool"];
    const saved = localStorage.getItem("os_sidebar_group_order");
    try {
      return saved ? JSON.parse(saved) : ["grp_schedule", "grp_finance", "grp_record", "grp_tool"];
    } catch {
      return ["grp_schedule", "grp_finance", "grp_record", "grp_tool"];
    }
  });

  // 各グループ内のアイテム並び順
  const [itemOrders, setItemOrders] = useState<Record<string, string[]>>(() => {
    const defaultOrders: Record<string, string[]> = {};
    DEFAULT_MENU_GROUPS.forEach((g) => {
      defaultOrders[g.id] = g.items.map((it) => it.id);
    });
    if (typeof window === "undefined") return defaultOrders;
    const saved = localStorage.getItem("os_sidebar_item_orders");
    try {
      return saved ? { ...defaultOrders, ...JSON.parse(saved) } : defaultOrders;
    } catch {
      return defaultOrders;
    }
  });

  // 設定画面内でどのグループの項目を開いて並び替えているか
  const [customizingGroupId, setCustomizingGroupId] = useState<string | null>(null);

  const moveGroup = (index: number, direction: "up" | "down") => {
    const newOrder = [...groupOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setGroupOrder(newOrder);
    localStorage.setItem("os_sidebar_group_order", JSON.stringify(newOrder));
  };

  const moveItemInGroup = (groupId: string, index: number, direction: "up" | "down") => {
    const currentOrder = itemOrders[groupId] || DEFAULT_MENU_GROUPS.find((g) => g.id === groupId)?.items.map((it) => it.id) || [];
    const newOrder = [...currentOrder];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const nextOrders = { ...itemOrders, [groupId]: newOrder };
    setItemOrders(nextOrders);
    localStorage.setItem("os_sidebar_item_orders", JSON.stringify(nextOrders));
  };

  // 保存された並び順でグループ & アイテムを構成
  const MENU_GROUPS = groupOrder
    .map((gId) => {
      const g = DEFAULT_MENU_GROUPS.find((group) => group.id === gId);
      if (!g) return null;
      const order = itemOrders[gId] || g.items.map((it) => it.id);
      const sortedItems = order.map((itemId) => g.items.find((it) => it.id === itemId)).filter(Boolean) as typeof g.items;
      return { ...g, items: sortedItems };
    })
    .filter(Boolean) as typeof DEFAULT_MENU_GROUPS;

  const handleMenuAction = (e: any, id: string) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    setIsSettingsPanelOpen(false);
    setIsSidebarOpen(false);

    setTimeout(() => {
      if (id === "dashboard") {
        setIsModalOpen(false);
        setIsAnalyticsModalOpen(true);
      } else if (id === "category_history") {
        setIsCategoryHistoryOpen(true);
      } else if (id === "gallery") {
        setIsModalOpen(false);
        setIsGalleryOpen(true);
      } else if (id === "travel_map") {
        setIsModalOpen(false);
        setIsTravelMapOpen(true);
      } else if (id === "category_settings") {
        setIsModalOpen(false);
        setIsCategoryModalOpen(true);
      } else if (id === "schedule_assistant") {
        setIsScheduleAssistantOpen(true);
      } else if (id === "timetable_settings") {
        setIsTimetableModalOpen(true);
      } else if (id === "advance_manage") {
        setIsAdvanceModalOpen(true);
      } else if (id === "routine_settings") {
        setIsModalOpen(false);
        setIsRoutineModalOpen(true);
      } else if (id === "subscription_settings") {
        setMode("subscription");
        setIsModalOpen(true);
      } else if (id === "anniversary_settings") {
        setIsModalOpen(false);
        setIsAnniversaryModalOpen(true);
      } else if (id === "finance_history") {
        setIsFinanceHistoryOpen(true);
      } else if (id === "finance_graph") {
        setIsFinanceGraphOpen(true);
      } else if (id === "template_settings") {
        setIsModalOpen(false);
        setIsTemplateModalOpen(true);
      } else if (id === "finance_single") {
        const today = toLocalYYYYMMDD(new Date());
        setMode("expense");
        setStartDate(today);
        setCategoryName("");
        setTitle("");
        setCustomFieldsData({ transactionMode: "expense", isExpenseSet: true });
        setIsModalOpen(true);
      }
    }, 100);
  };

  const ModalHeader = ({ title, onClose }: any) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <Sparkles size={18} color={themeColor} />
        <h2 style={{ margin: 0, color: "var(--text-main)", fontSize: "1.25rem", fontWeight: 900, letterSpacing: "-0.5px" }}>{title}</h2>
      </div>
      <button
        onClick={onClose}
        style={{
          background: "var(--input-bg)",
          border: "1px solid var(--border-color)",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          fontSize: "1.1rem",
          cursor: "pointer",
          color: "var(--text-sub)",
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.2s",
        }}
      >
        ×
      </button>
    </div>
  );

  return (
    <>
      {/* オーバーレイ */}
      <div
        onClick={() => setIsSidebarOpen(false)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100dvh",
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 1999,
          opacity: isSidebarOpen ? 1 : 0,
          pointerEvents: isSidebarOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />

      {/* サイドバー本体 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "86%",
          maxWidth: "340px",
          height: "100dvh",
          borderTopRightRadius: "28px",
          borderBottomRightRadius: "28px",
          zIndex: 2000,
          transform: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
          paddingTop: "max(calc(env(safe-area-inset-top, 0px) + 16px), 58px)",
          paddingRight: "16px",
          paddingBottom: "max(env(safe-area-inset-bottom), 16px)",
          paddingLeft: "16px",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-main)",
          boxShadow: isSidebarOpen ? `0 0 35px ${hexToRgba(themeColor, 0.2)}, 10px 0 30px rgba(0,0,0,0.25)` : "none",
          borderRight: "1px solid var(--border-color)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        {/* 最上部：タイトル・1行コントロール */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px", flexShrink: 0 }}>
          <ModalHeader title="Smart LifeOS" onClose={() => setIsSidebarOpen(false)} />

          {/* 1行レイアウト：テーマ | ダーク/ライト | 検索（円形アイコン） */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setIsColorPickerOpen(true);
              }}
              style={{
                flex: 1,
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                fontSize: "0.8rem",
                fontWeight: "bold",
                borderRadius: "14px",
                background: "var(--card-bg)",
                color: "var(--text-main)",
                border: "1px solid var(--border-color)",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: themeColor, boxShadow: `0 0 6px ${themeColor}` }} />
              テーマ
            </button>

            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              style={{
                flex: 1,
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                fontSize: "0.8rem",
                borderRadius: "14px",
                background: "var(--card-bg)",
                color: "var(--text-main)",
                border: "1px solid var(--border-color)",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
              }}
            >
              {isDarkMode ? (
                <>
                  <Moon size={14} color="#38bdf8" /> ダーク
                </>
              ) : (
                <>
                  <Sun size={14} color="#f59e0b" /> ライト
                </>
              )}
            </button>

            <button
              onClick={() => setIsInlineSearchOpen(!isInlineSearchOpen)}
              title="検索"
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: isInlineSearchOpen ? themeColor : "var(--card-bg)",
                color: isInlineSearchOpen ? "#fff" : "var(--text-sub)",
                border: `1px solid ${isInlineSearchOpen ? themeColor : "var(--border-color)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
                boxShadow: isInlineSearchOpen ? `0 0 10px ${hexToRgba(themeColor, 0.4)}` : "0 2px 6px rgba(0,0,0,0.02)",
                transition: "all 0.2s ease",
              }}
            >
              <Search size={16} />
            </button>
          </div>

          {/* 検索ボタン押下時に展開される検索バー */}
          {isInlineSearchOpen && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "var(--input-bg)",
                borderRadius: "14px",
                padding: "0 12px",
                border: `1px solid var(--theme)`,
                boxShadow: `0 0 10px ${hexToRgba(themeColor, 0.15)}`,
                height: "40px",
                animation: "fadeIn 0.2s ease-out",
              }}
            >
              <Search size={15} style={{ color: themeColor, marginRight: "8px", flexShrink: 0 }} />
              <input
                type="text"
                placeholder="予定を検索してEnter..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearchExecute();
                    setIsSidebarOpen(false);
                    setIsSearchMode(true);
                  }
                }}
                autoFocus
                style={{
                  border: "none",
                  background: "transparent",
                  outline: "none",
                  fontSize: "0.85rem",
                  width: "100%",
                  color: "var(--text-main)",
                  fontWeight: "500",
                }}
              />
            </div>
          )}

          {/* 月表示ビューの時のフィルター・表示切替 */}
          {viewType === "dayGridMonth" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                background: "var(--input-bg)",
                borderRadius: "14px",
                padding: "8px",
                border: `1px solid var(--border-color)`,
              }}
            >
              <div style={{ display: "flex", background: "var(--bg-main)", borderRadius: "10px", padding: "2px" }}>
                {[
                  { id: "normal", label: "2行" },
                  { id: "compact", label: "1行" },
                  { id: "dot", label: "ドット" },
                  { id: "photo", label: "写真" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDisplayMode(item.id)}
                    style={{
                      flex: 1,
                      padding: "6px 0",
                      borderRadius: "8px",
                      background: displayMode === item.id ? "var(--card-bg)" : "transparent",
                      color: displayMode === item.id ? themeColor : "var(--text-sub)",
                      fontWeight: "bold",
                      border: "none",
                      boxShadow: displayMode === item.id ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                      cursor: "pointer",
                      fontSize: "0.75rem",
                      transition: "all 0.2s",
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="hide-scrollbar" style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "2px" }}>
                <button
                  onClick={() => setCalendarCategoryFilter("すべて")}
                  style={{
                    padding: "4px 10px",
                    fontSize: "0.75rem",
                    borderRadius: "10px",
                    fontWeight: "bold",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    background: calendarCategoryFilter === "すべて" ? themeColor : "var(--card-bg)",
                    color: calendarCategoryFilter === "すべて" ? "#fff" : "var(--text-sub)",
                    border: "1px solid var(--border-color)",
                    transition: "all 0.2s",
                  }}
                >
                  すべて
                </button>
                {categories.map((c: any) => (
                  <button
                    key={c.name}
                    onClick={() => setCalendarCategoryFilter(c.name)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "0.75rem",
                      borderRadius: "10px",
                      fontWeight: "bold",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      background: calendarCategoryFilter === c.name ? c.color : "var(--card-bg)",
                      color: calendarCategoryFilter === c.name ? "#fff" : "var(--text-sub)",
                      border: "1px solid var(--border-color)",
                      transition: "all 0.2s",
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 中央スクロールエリア：グループ化されたスマート機能リスト */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            paddingRight: "2px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
          className="hide-scrollbar"
        >
          {/* グループド・カード */}
          {MENU_GROUPS.map((group) => {
            const GroupIcon = group.icon;
            return (
              <div key={group.title} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "800",
                    color: "var(--text-sub)",
                    paddingLeft: "6px",
                    letterSpacing: "0.5px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <GroupIcon size={13} color={group.accent} /> {group.title}
                </span>

                <div
                  style={{
                    background: "var(--card-bg)",
                    borderRadius: "18px",
                    border: "1px solid var(--border-color)",
                    overflow: "hidden",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                  }}
                >
                  {group.items.map((item, idx) => {
                    const ItemIcon = item.icon;
                    const isLast = idx === group.items.length - 1;
                    return (
                      <button
                        key={item.id}
                        onClick={(e) => handleMenuAction(e, item.id)}
                        className="hover-bg-glass"
                        style={{
                          width: "100%",
                          minHeight: "48px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          background: "transparent",
                          border: "none",
                          borderBottom: isLast ? "none" : "1px solid var(--border-color)",
                          cursor: "pointer",
                          textAlign: "left",
                          transition: "background 0.15s ease",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "10px",
                              background: hexToRgba(item.color, 0.12),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <ItemIcon size={18} color={item.color} />
                          </div>
                          <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--text-main)" }}>{item.label}</span>
                        </div>
                        <ChevronRight size={16} color="var(--text-sub)" style={{ opacity: 0.6 }} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* キープ中の予定（アコーディオン） */}
          <div>
            <div
              onClick={() => setIsKeepSectionOpen(!isKeepSectionOpen)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                padding: "8px 6px",
              }}
            >
              <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--text-sub)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Inbox size={13} color="#f59e0b" /> 入るかもしれない予定（仮予定）
              </span>
              <ChevronDown size={14} color="var(--text-sub)" style={{ transform: isKeepSectionOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
            </div>

            {isKeepSectionOpen && (
              <div style={{ background: "var(--input-bg)", padding: "10px", borderRadius: "16px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "8px" }}>
                {(() => {
                  const keepEvents = events.filter((e: any) => e.extendedProps?.metadata?.isTentative || e.extendedProps?.metadata?.isStocked);
                  if (keepEvents.length === 0) {
                    return <div style={{ fontSize: "0.8rem", color: "var(--text-sub)", textAlign: "center", padding: "10px 0", fontWeight: "bold" }}>キープ中の予定はありません</div>;
                  }
                  return keepEvents.map((e: any) => {
                    const cColor = e.extendedProps?.cColor || e.backgroundColor || themeColor;

                    return (
                      <div key={e.id} style={{ background: "var(--card-bg)", padding: "12px", borderRadius: "14px", borderLeft: `4px solid ${cColor}`, border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "6px" }}>
                          <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--text-main)", wordBreak: "break-all" }}>{e.title}</div>
                          <span style={{ fontSize: "0.65rem", fontWeight: "bold", color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "2px 6px", borderRadius: "6px", flexShrink: 0 }}>仮予定</span>
                        </div>

                        {e.start && <div style={{ fontSize: "0.75rem", color: "var(--text-sub)", fontWeight: "bold" }}>予定日: {e.start.split("T")[0].replace(/-/g, "/")}</div>}

                        <div style={{ display: "flex", gap: "6px", marginTop: "4px", paddingTop: "8px", borderTop: "1px dashed var(--border-color)" }}>
                          <button
                            onClick={async (evt) => {
                              evt.stopPropagation();
                              if (confirm(`「${e.title}」を確定予定に変更しますか？`)) {
                                const meta = e.extendedProps?.metadata || {};
                                await supabase
                                  .from("events")
                                  .update({ metadata: { ...meta, isTentative: false, isStocked: false } })
                                  .eq("id", e.id);
                                setIsSidebarOpen(false);
                                window.location.reload();
                              }
                            }}
                            className="btn-pop"
                            style={{ flex: 1, padding: "8px 0", fontSize: "0.75rem", borderRadius: "8px", background: "#10b981", boxShadow: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", height: "auto" }}
                          >
                            <CheckCircle size={14} /> 確定
                          </button>
                          <button
                            onClick={(evt) => {
                              evt.stopPropagation();
                              setIsSidebarOpen(false);
                              setTimeout(() => handleEventClick({ event: e }), 100);
                            }}
                            className="btn-secondary"
                            style={{ flex: 1, padding: "8px 0", fontSize: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", height: "auto" }}
                          >
                            <Edit3 size={14} /> 編集
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        </div>

        {/* 最下部（固定フッター）：左側アカウント ＋ 右側設定ボタン */}
        <div
          style={{
            marginTop: "auto",
            paddingTop: "12px",
            borderTop: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
          }}
        >
          {/* 左側：アカウント情報カード */}
          <div
            onClick={() => {
              setIsSidebarOpen(false);
              setTimeout(() => setIsProfileModalOpen(true), 100);
            }}
            className="hover-bg-glass"
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--card-bg)",
              padding: "8px 12px",
              borderRadius: "16px",
              border: `1px solid var(--border-color)`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "var(--input-bg)",
                border: `2px solid ${themeColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: themeColor,
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {userProfile?.avatar ? (
                <img
                  src={userProfile.avatar}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: `${userProfile.avatarPanX || 50}% ${userProfile.avatarPanY || 50}%`,
                    transform: `scale(${userProfile.avatarScale || 1})`,
                  }}
                  alt="profile"
                />
              ) : (
                <User size={20} />
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "900", color: "var(--text-main)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{activeUserName || "ユーザー"}</span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-sub)", fontWeight: "600", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{userProfile?.email || `@${activeUserId || "local"}`}</span>
            </div>
          </div>

          {/* 右側：設定アイコンボタン */}
          <button
            onClick={() => {
              setIsSettingsPanelOpen(true);
              setIsSidebarOpen(false);
            }}
            title="アプリ設定"
            className="hover-bg-glass"
            style={{
              width: "48px",
              height: "54px",
              borderRadius: "16px",
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              transition: "all 0.2s ease",
            }}
          >
            <Settings2 size={22} color={themeColor} />
          </button>
        </div>
      </div>

      {/* ⚙️ アプリ設定と管理 モーダル */}
      {isSettingsPanelOpen && (
        <div
          className="modal-overlay"
          onClick={() => setIsSettingsPanelOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "15px",
          }}
        >
          <div
            className="modal-content glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "440px",
              borderRadius: "28px",
              border: "1px solid var(--glass-border)",
              padding: "24px",
              background: "var(--bg-main)",
              color: "var(--text-main)",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <ModalHeader title="アプリ設定と管理" onClose={() => setIsSettingsPanelOpen(false)} />

            <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "20px", paddingRight: "4px" }}>
              {/* サイドバー項目の並び替え（ジャンル ＆ 内部機能） */}
              <div>
                <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: themeColor, marginBottom: "4px", display: "block" }}>サイドバー項目の並び替え</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-sub)", marginBottom: "8px", display: "block" }}>ジャンルを押すと、中の機能も優先度順に並び替えできます</span>

                <div style={{ background: "var(--card-bg)", borderRadius: "16px", border: "1px solid var(--border-color)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  {groupOrder.map((gId, idx) => {
                    const group = DEFAULT_MENU_GROUPS.find((g) => g.id === gId);
                    if (!group) return null;
                    const Icon = group.icon;
                    const isExpanded = customizingGroupId === gId;

                    const itemOrder = itemOrders[gId] || group.items.map((it) => it.id);
                    const sortedItems = itemOrder.map((itId) => group.items.find((it) => it.id === itId)).filter(Boolean) as typeof group.items;

                    return (
                      <div key={gId} style={{ borderBottom: idx < groupOrder.length - 1 ? "1px solid var(--border-color)" : "none" }}>
                        {/* グループヘッダー行 */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 12px",
                            background: isExpanded ? "var(--input-bg)" : "transparent",
                            transition: "background 0.2s",
                          }}
                        >
                          <div onClick={() => setCustomizingGroupId(isExpanded ? null : gId)} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", flex: 1 }}>
                            <Icon size={16} color={group.accent} />
                            <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-main)" }}>{group.title}</span>
                            <ChevronDown size={14} color="var(--text-sub)" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                          </div>

                          <div style={{ display: "flex", gap: "4px" }}>
                            <button disabled={idx === 0} onClick={() => moveGroup(idx, "up")} style={{ width: "26px", height: "26px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--card-bg)", cursor: idx === 0 ? "not-allowed" : "pointer", opacity: idx === 0 ? 0.3 : 1, fontWeight: "bold", color: "var(--text-main)", fontSize: "0.7rem" }}>
                              ▲
                            </button>
                            <button disabled={idx === groupOrder.length - 1} onClick={() => moveGroup(idx, "down")} style={{ width: "26px", height: "26px", borderRadius: "6px", border: "1px solid var(--border-color)", background: "var(--card-bg)", cursor: idx === groupOrder.length - 1 ? "not-allowed" : "pointer", opacity: idx === groupOrder.length - 1 ? 0.3 : 1, fontWeight: "bold", color: "var(--text-main)", fontSize: "0.7rem" }}>
                              ▼
                            </button>
                          </div>
                        </div>

                        {/* グループ内の機能並び替えアコーディオン */}
                        {isExpanded && (
                          <div style={{ background: "var(--input-bg)", padding: "6px 12px 10px 24px", display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px dashed var(--border-color)" }}>
                            {sortedItems.map((item, itemIdx) => {
                              const ItemIcon = item.icon;
                              return (
                                <div
                                  key={item.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "6px 8px",
                                    background: "var(--card-bg)",
                                    borderRadius: "10px",
                                    border: "1px solid var(--border-color)",
                                  }}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                    <ItemIcon size={14} color={item.color} />
                                    <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-main)" }}>{item.label}</span>
                                  </div>

                                  <div style={{ display: "flex", gap: "3px" }}>
                                    <button disabled={itemIdx === 0} onClick={() => moveItemInGroup(gId, itemIdx, "up")} style={{ width: "22px", height: "22px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--input-bg)", cursor: itemIdx === 0 ? "not-allowed" : "pointer", opacity: itemIdx === 0 ? 0.3 : 1, fontWeight: "bold", color: "var(--text-main)", fontSize: "0.6rem" }}>
                                      ▲
                                    </button>
                                    <button disabled={itemIdx === sortedItems.length - 1} onClick={() => moveItemInGroup(gId, itemIdx, "down")} style={{ width: "22px", height: "22px", borderRadius: "5px", border: "1px solid var(--border-color)", background: "var(--input-bg)", cursor: itemIdx === sortedItems.length - 1 ? "not-allowed" : "pointer", opacity: itemIdx === sortedItems.length - 1 ? 0.3 : 1, fontWeight: "bold", color: "var(--text-main)", fontSize: "0.6rem" }}>
                                      ▼
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 通知設定 */}
              <div>
                <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: themeColor, marginBottom: "8px", display: "block" }}>通知の設定</span>
                <div style={{ background: "var(--card-bg)", padding: "14px", borderRadius: "16px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-main)" }}>
                    <Bell size={18} color={themeColor} /> 予定の10分前通知
                  </span>
                  <label className="toggle-switch">
                    <input type="checkbox" checked={isNotificationEnabled} onChange={(e) => setIsNotificationEnabled(e.target.checked)} />
                    <span className="slider"></span>
                  </label>
                </div>
              </div>

              {/* ルート検索のデフォルト設定 */}
              <div>
                <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: themeColor, marginBottom: "8px", display: "block" }}>ルート検索の出発地設定</span>
                <div style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "16px", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <select className="pop-input" value={startPointType} onChange={(e) => setStartPointType(e.target.value)} style={{ fontSize: "0.85rem" }}>
                    <option value="address">自宅の住所から出発</option>
                    <option value="station">最寄り駅から出発</option>
                  </select>

                  {startPointType === "address" ? (
                    <div>
                      <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Home size={14} color={themeColor} /> 自宅の住所
                      </label>
                      <input type="text" className="pop-input" value={homeLocation} onChange={(e) => setHomeLocation(e.target.value)} placeholder="東京都渋谷区..." style={{ fontSize: "0.85rem" }} />
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <label className="form-label" style={{ fontSize: "0.75rem", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Train size={14} color={themeColor} /> 最寄り駅
                        </label>
                        <input type="text" className="pop-input" value={nearestStation} onChange={(e) => setNearestStation(e.target.value)} placeholder="渋谷駅" style={{ fontSize: "0.85rem" }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <label className="form-label" style={{ fontSize: "0.75rem", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                          <Footprints size={14} color={themeColor} /> 駅までの徒歩
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1 }}>
                          <input type="number" className="pop-input no-spin" value={walkTime} onChange={(e) => setWalkTime(e.target.value)} style={{ fontSize: "1rem", textAlign: "center" }} />
                          <span style={{ fontSize: "0.85rem", fontWeight: "900" }}>分</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 収入計算基準 */}
              <div>
                <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: themeColor, marginBottom: "8px", display: "block" }}>収入の計算基準</span>
                <select className="pop-input" value={incomeCalcBasis} onChange={(e) => setIncomeCalcBasis(e.target.value as any)} style={{ fontSize: "0.85rem", fontWeight: "bold" }}>
                  <option value="wage">時給・シフトの予定から自動計算</option>
                  <option value="payday">給料日・実際の入金のみを計算</option>
                </select>
              </div>

              {/* ご要望・不具合報告 */}
              <button
                onClick={() => {
                  setIsSettingsPanelOpen(false);
                  setIsFeedbackModalOpen(true);
                }}
                className="btn-secondary"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontWeight: "bold",
                  fontSize: "0.85rem",
                }}
              >
                <MessageSquare size={16} /> ご要望・不具合の報告
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ジャンル別の履歴 モーダル */}
      {isCategoryHistoryOpen &&
        (() => {
          const now = new Date().getTime();
          const sortedEvents = events
            .filter((e: any) => historyCategory === "すべて" || e.extendedProps?.category === historyCategory)
            .filter((e: any) => {
              const eTime = new Date(e.start).getTime();
              return historyTimeFilter === "past" ? eTime < now : eTime >= now;
            })
            .sort((a: any, b: any) => {
              const tA = new Date(a.start).getTime();
              const tB = new Date(b.start).getTime();
              return historyTimeFilter === "past" ? tB - tA : tA - tB;
            });

          return (
            <div className="modal-overlay" onClick={() => setIsCategoryHistoryOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "15px" }}>
              <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", borderRadius: "28px", border: "1px solid var(--glass-border)", padding: "24px", background: "var(--bg-main)", color: "var(--text-main)", display: "flex", flexDirection: "column", height: "70vh", justifyContent: "flex-start" }}>
                <div style={{ flexShrink: 0 }}>
                  <ModalHeader title="ジャンル別の履歴" onClose={() => setIsCategoryHistoryOpen(false)} />
                </div>
                <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexShrink: 0 }}>
                  <button onClick={() => setHistoryTimeFilter("past")} className={historyTimeFilter === "past" ? "btn-pop" : "btn-secondary"} style={{ flex: 1, height: "40px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", background: historyTimeFilter === "past" ? themeColor : "var(--input-bg)", color: historyTimeFilter === "past" ? "#fff" : "var(--text-main)", border: "none", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold", boxShadow: historyTimeFilter === "past" ? `0 4px 10px ${themeColor}50` : "none", transition: "all 0.2s" }}>
                    過去の履歴
                  </button>
                  <button onClick={() => setHistoryTimeFilter("future")} className={historyTimeFilter === "future" ? "btn-pop" : "btn-secondary"} style={{ flex: 1, height: "40px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", background: historyTimeFilter === "future" ? themeColor : "var(--input-bg)", color: historyTimeFilter === "future" ? "#fff" : "var(--text-main)", border: "none", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold", boxShadow: historyTimeFilter === "future" ? `0 4px 10px ${themeColor}50` : "none", transition: "all 0.2s" }}>
                    今後の予定
                  </button>
                </div>

                <div className="hide-scrollbar" style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "15px", paddingBottom: "4px", flexShrink: 0, whiteSpace: "nowrap" }}>
                  <button onClick={() => setHistoryCategory("すべて")} style={{ background: historyCategory === "すべて" ? themeColor : "var(--input-bg)", color: historyCategory === "すべて" ? "#fff" : "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "8px 16px", fontSize: "0.85rem", fontWeight: "900", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}>
                    すべて
                  </button>
                  {categories.map((c: any) => (
                    <button key={c.name} onClick={() => setHistoryCategory(c.name)} style={{ background: historyCategory === c.name ? c.color : "var(--input-bg)", color: historyCategory === c.name ? "#fff" : "var(--text-main)", border: "1px solid var(--border-color)", borderRadius: "20px", padding: "8px 16px", fontSize: "0.85rem", fontWeight: "900", cursor: "pointer", flexShrink: 0, transition: "all 0.2s" }}>
                      {c.name}
                    </button>
                  ))}
                </div>

                <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "4px" }}>
                  {sortedEvents.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-sub)", fontSize: "0.85rem", fontWeight: "bold" }}>予定・履歴がありません</div>
                  ) : (
                    sortedEvents.map((e: any) => {
                      const cColor = e.extendedProps?.cColor || e.backgroundColor || themeColor;
                      const dateStr = e.start.split("T")[0].replace(/-/g, "/");
                      const memo = e.extendedProps?.metadata?.memo;
                      const rating = e.extendedProps?.metadata?.rating;
                      return (
                        <div
                          key={e.id}
                          onClick={() => {
                            setIsCategoryHistoryOpen(false);
                            handleEventClick({ event: e });
                          }}
                          style={{ display: "flex", flexDirection: "column", gap: "8px", background: "var(--card-bg)", padding: "16px", borderRadius: "16px", borderLeft: `6px solid ${cColor}`, boxShadow: "0 2px 8px rgba(0,0,0,0.03)", cursor: "pointer", flexShrink: 0 }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "var(--text-main)", lineHeight: 1.3 }}>{e.title}</div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-sub)", fontWeight: "bold", whiteSpace: "nowrap" }}>{dateStr}</div>
                          </div>
                          {memo && <div style={{ fontSize: "0.8rem", color: "var(--text-sub)", background: "var(--input-bg)", padding: "8px", borderRadius: "8px", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, overflow: "hidden" }}>{memo}</div>}
                          {rating > 0 && <div style={{ color: "#f59e0b", fontSize: "0.9rem" }}>{"★".repeat(rating)}</div>}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* トラベル・マップ モーダル */}
      {isTravelMapOpen &&
        (() => {
          const PREF_GRID = [
            [null, null, null, null, null, null, null, null, null, null, null, "北海道"],
            [null, null, null, null, null, null, null, null, null, null, null, "青森"],
            [null, null, null, null, null, null, null, null, null, null, "秋田", "岩手"],
            [null, null, null, null, null, null, null, null, null, null, "山形", "宮城"],
            [null, null, null, null, null, null, null, null, "石川", "新潟", "福島", null],
            [null, null, null, null, null, null, null, "福井", "富山", "群馬", "栃木", "茨城"],
            ["山口", "島根", "鳥取", "兵庫", "京都", "滋賀", "岐阜", "長野", "山梨", "埼玉", "千葉", null],
            [null, "広島", "岡山", "大阪", "奈良", "三重", "愛知", "静岡", "神奈川", "東京", null, null],
            [null, null, null, null, "和歌山", null, null, null, null, null, null, null],
            ["長崎", "佐賀", "福岡", "愛媛", "香川", null, null, null, null, null, null, null],
            [null, "熊本", "大分", "高知", "徳島", null, null, null, null, null, null, null],
            [null, "鹿児島", "宮崎", null, null, null, null, null, null, null, null, null],
            ["沖縄", null, null, null, null, null, null, null, null, null, null, null],
          ];

          const getShortName = (name: string) => name[0];

          const togglePref = (name: string) => {
            setVisitedPrefs((prev) => ({ ...prev, [name]: ((prev[name] || 0) + 1) % 4 }));
          };

          const getPrefStyle = (name: string) => {
            const status = visitedPrefs[name] || 0;
            if (status === 1) return { bg: hexToRgba(themeColor, 0.15), color: themeColor, border: `1px solid ${themeColor}` };
            if (status === 2) return { bg: hexToRgba(themeColor, 0.5), color: "#fff", border: `1px solid ${themeColor}` };
            if (status === 3) return { bg: themeColor, color: "#fff", border: `1px solid ${themeColor}` };
            return { bg: "var(--input-bg)", color: "var(--text-sub)", border: "1px solid var(--border-color)" };
          };

          const totalVisited = Object.values(visitedPrefs).filter((v) => v > 0).length;

          const handleResetZoom = () => {
            setMapZoom(1);
            setTimeout(() => {
              if (mapContainerRef.current) {
                mapContainerRef.current.scrollTo({ top: 0, left: 0, behavior: "smooth" });
              }
            }, 50);
          };

          return (
            <div className="modal-overlay" onClick={() => setIsTravelMapOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "15px" }}>
              <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", borderRadius: "28px", border: "1px solid var(--glass-border)", padding: "24px", background: "var(--bg-main)", color: "var(--text-main)", display: "flex", flexDirection: "column", height: "80vh" }}>
                <div style={{ flexShrink: 0 }}>
                  <ModalHeader title="トラベル・マップ" onClose={() => setIsTravelMapOpen(false)} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "16px", flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: "8px", fontSize: "0.65rem", color: "var(--text-sub)", fontWeight: "bold" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: "var(--input-bg)", border: "1px solid var(--border-color)" }} />未
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: hexToRgba(themeColor, 0.15), border: `1px solid ${themeColor}` }} />昔
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: hexToRgba(themeColor, 0.5), border: `1px solid ${themeColor}` }} />
                      近年
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: themeColor, border: `1px solid ${themeColor}` }} />
                      直近
                    </div>
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "900", color: themeColor }}>
                    {totalVisited}
                    <span style={{ fontSize: "0.7rem", color: "var(--text-sub)", marginLeft: "2px" }}>/47</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginBottom: "8px", flexShrink: 0 }}>
                  <button onClick={() => setMapZoom((z) => Math.max(1, z - 0.2))} disabled={mapZoom <= 1} style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "1.2rem", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", cursor: mapZoom <= 1 ? "not-allowed" : "pointer", opacity: mapZoom <= 1 ? 0.4 : 1 }}>
                    -
                  </button>
                  <button onClick={handleResetZoom} style={{ height: "36px", padding: "0 12px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "0.8rem", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}>
                    中央に戻す
                  </button>
                  <button onClick={() => setMapZoom((z) => Math.min(3, z + 0.2))} style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--card-bg)", color: "var(--text-main)", fontSize: "1.2rem", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s" }}>
                    +
                  </button>
                </div>

                <div className="hide-scrollbar" ref={mapContainerRef} style={{ flex: 1, overflow: "auto", paddingRight: "4px", background: "var(--card-bg)", borderRadius: "16px", border: "1px solid var(--border-color)", padding: "16px", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.02)" }}>
                  <div style={{ width: `${Math.max(100, mapZoom * 100)}%`, minWidth: `${320 * mapZoom}px`, display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: `${4 * mapZoom}px`, transition: "width 0.2s, min-width 0.2s, gap 0.2s" }}>
                    {PREF_GRID.map((row, rowIndex) =>
                      row.map((p, colIndex) => {
                        if (!p) return <div key={`${rowIndex}-${colIndex}`} style={{ aspectRatio: "1" }} />;
                        const s = getPrefStyle(p);
                        return (
                          <button key={p} onClick={() => togglePref(p)} style={{ aspectRatio: "1", background: s.bg, color: s.color, border: s.border, fontSize: "0.75rem", fontWeight: "900", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s, color 0.2s", padding: 0, borderRadius: `${4 * mapZoom}px` }}>
                            {getShortName(p)}
                          </button>
                        );
                      }),
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* 収支履歴 モーダル */}
      {isFinanceHistoryOpen &&
        (() => {
          const tMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
          const tYear = String(new Date().getFullYear());

          const allTransactions: any[] = [];
          events.forEach((e: any) => {
            const f = e.extendedProps?.metadata?.customFields || {};
            const cat = e.extendedProps?.category;
            const dateStr = e.start.split("T")[0].replace(/-/g, "/");

            if (f.expenses && f.expenses.length > 0) {
              f.expenses.forEach((ex: any) => {
                if (!ex.amount) return;
                const isInc = ex.type === "income" || ex.type === "borrow";
                allTransactions.push({
                  id: `${e.id}-${ex.id}`,
                  eventId: e.id,
                  title: ex.description || e.title || cat || "予定",
                  dateStr: dateStr,
                  dateObj: new Date(e.start),
                  isIncome: isInc,
                  amount: Number(ex.amount),
                  method: ex.method || "cash",
                  type: ex.type,
                  payee: ex.payee,
                  event: e,
                });
              });
            } else if (f.isExpenseSet || f.isIncomeSet || cat === "収支記録") {
              const isInc = f.isIncomeSet;
              const amt = isInc ? f.standardIncomeAmount : f.standardExpenseAmount;
              if (amt) {
                allTransactions.push({
                  id: e.id,
                  eventId: e.id,
                  title: e.title || cat || "収支記録",
                  dateStr: dateStr,
                  dateObj: new Date(e.start),
                  isIncome: isInc,
                  amount: Number(amt),
                  method: f.paymentMethod || "cash",
                  type: isInc ? "income" : "expense",
                  event: e,
                });
              }
            }
          });

          const ledgerHistory = allTransactions
            .filter((t) => {
              if (historySpan === "month") return t.dateStr.startsWith(tMonth.replace(/-/g, "/"));
              if (historySpan === "year") return t.dateStr.startsWith(tYear);
              return true;
            })
            .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

          const filteredHistory = ledgerHistory.filter((t) => {
            if (financeTypeFilter === "income") return t.isIncome;
            if (financeTypeFilter === "expense") return !t.isIncome;
            return true;
          });

          return (
            <div className="modal-overlay" onClick={() => setIsFinanceHistoryOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "15px" }}>
              <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", borderRadius: "28px", border: "1px solid var(--glass-border)", overflowY: "auto", maxHeight: "90vh", background: "var(--bg-main)", color: "var(--text-main)", padding: "24px" }}>
                <ModalHeader title="すべての収支履歴" onClose={() => setIsFinanceHistoryOpen(false)} />
                <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                  <button onClick={() => setHistorySpan("month")} className={historySpan === "month" ? "btn-pop" : "btn-secondary"} style={{ flex: 1, padding: "8px", fontSize: "0.8rem", borderRadius: "12px" }}>
                    今月
                  </button>
                  <button onClick={() => setHistorySpan("year")} className={historySpan === "year" ? "btn-pop" : "btn-secondary"} style={{ flex: 1, padding: "8px", fontSize: "0.8rem", borderRadius: "12px" }}>
                    今年
                  </button>
                  <button onClick={() => setHistorySpan("all")} className={historySpan === "all" ? "btn-pop" : "btn-secondary"} style={{ flex: 1, padding: "8px", fontSize: "0.8rem", borderRadius: "12px" }}>
                    全期間
                  </button>
                </div>
                <div className="hide-scrollbar" style={{ height: "65vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px" }}>
                  {filteredHistory.length === 0 ? (
                    <div style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-sub)", padding: "24px" }}>記録がありません</div>
                  ) : (
                    filteredHistory.map((t: any) => {
                      let MethodIcon = Banknote;
                      let methodText = "現金";
                      if (!t.isIncome) {
                        if (t.method === "credit") {
                          MethodIcon = CreditCard;
                          methodText = "クレカ";
                        } else if (t.method === "paypay") {
                          MethodIcon = Smartphone;
                          methodText = "スマホ決済";
                        } else if (t.method === "ic") {
                          MethodIcon = Train;
                          methodText = "交通系IC";
                        } else if (t.method === "reimburse" || t.type === "advance") {
                          MethodIcon = Handshake;
                          methodText = "立替";
                        }
                      } else {
                        if (t.method === "bank") {
                          MethodIcon = Landmark;
                          methodText = "振込";
                        } else if (t.method === "paypay") {
                          MethodIcon = Smartphone;
                          methodText = "電子マネー";
                        } else if (t.type === "borrow") {
                          MethodIcon = Handshake;
                          methodText = "借り";
                        }
                      }

                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setIsFinanceHistoryOpen(false);
                            setIsSidebarOpen(false);
                            handleEventClick({ event: t.event });
                          }}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--card-bg)", padding: "16px", borderRadius: "16px", border: "1px solid var(--border-color)", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}
                        >
                          <div style={{ overflow: "hidden" }}>
                            <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "var(--text-main)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{t.title}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-sub)", marginTop: "6px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Clock size={12} /> {t.dateStr}
                              <span style={{ marginLeft: "4px", background: "var(--input-bg)", padding: "4px 8px", borderRadius: "6px", fontSize: "0.65rem", display: "flex", alignItems: "center", gap: "4px" }}>
                                <MethodIcon size={10} /> {methodText}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontWeight: "900", color: t.isIncome ? "#10b981" : "#ef4444", fontSize: "1.2rem", flexShrink: 0 }}>
                            {t.isIncome ? "+" : "-"}¥{t.amount.toLocaleString()}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {/* ご要望・不具合の報告 モーダル */}
      {isFeedbackModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFeedbackModalOpen(false)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "24px" }}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: "92%", maxWidth: "420px", borderRadius: "28px", border: "1px solid var(--glass-border)", padding: "24px", background: "var(--bg-main)", color: "var(--text-main)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, color: themeColor, fontSize: "1.2rem", fontWeight: 900, display: "flex", alignItems: "center", gap: "8px" }}>
                <MessageSquare size={20} /> ご要望・不具合の報告
              </h2>
              <button onClick={() => setIsFeedbackModalOpen(false)} style={{ background: "var(--input-bg)", border: "1px solid var(--border-color)", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", color: "var(--text-sub)", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center" }}>
                ×
              </button>
            </div>
            <textarea value={feedbackText} onChange={(e) => setFeedbackText(e.target.value)} placeholder="例：〇〇の機能を追加してほしい..." rows={6} style={{ padding: "12px", fontSize: "0.9rem", resize: "vertical", minHeight: "120px", marginBottom: "20px", width: "100%", borderRadius: "12px", border: "2px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-main)", outline: "none" }} autoFocus />
            <div style={{ display: "flex", gap: "12px" }}>
              <button onClick={() => setIsFeedbackModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: "12px", borderRadius: "16px", fontWeight: "bold" }}>
                キャンセル
              </button>
              <button
                disabled={isSendingFeedback || !feedbackText.trim()}
                onClick={async () => {
                  setIsSendingFeedback(true);
                  try {
                    await supabase.from("feedbacks").insert([{ user_id: activeUserId, user_name: activeUserName, content: feedbackText.trim() }]);
                    alert("ご要望を送信しました！");
                    setFeedbackText("");
                    setIsFeedbackModalOpen(false);
                  } catch (e) {
                    alert("送信に失敗しました。");
                  } finally {
                    setIsSendingFeedback(false);
                  }
                }}
                style={{ flex: 1.5, padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", borderRadius: "16px", background: themeColor, color: "#fff", border: "none", fontWeight: "bold", cursor: "pointer", opacity: isSendingFeedback || !feedbackText.trim() ? 0.6 : 1 }}
              >
                {isSendingFeedback ? (
                  "送信中..."
                ) : (
                  <>
                    <Send size={16} /> 送信する
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
