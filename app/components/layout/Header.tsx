"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import { Image as ImageIcon, Calendar } from "lucide-react";

interface HeaderProps {
  currentYear: string;
  currentMonthNum: string;
  currentDayNum: string;
  viewType: string;
  setViewType: (view: string) => void;
  calendarRef: React.RefObject<FullCalendar | null>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setOpenSections: (sections: string[]) => void;
  setStoryDate: (date: string) => void;
  setIsStoryModalOpen: (isOpen: boolean) => void;
  isViewSelectorExpanded: boolean;
  setIsViewSelectorExpanded: (expanded: boolean) => void;
  isSearchMode: boolean;
  setIsSearchMode: (isSearch: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchExecute: () => void;
  handleYearMonthChange: (y: string, m: string) => void;
  blockCalendarClick: React.MutableRefObject<boolean>;
  setCurrentYear: (y: string) => void;
  setCurrentMonthNum: (m: string) => void;
  setCurrentDayNum: (d: string) => void;
  firstDayOfWeek?: number;
}

export default function Header({ currentYear, currentMonthNum, currentDayNum, viewType, setViewType, calendarRef, setIsSidebarOpen, setOpenSections, setStoryDate, setIsStoryModalOpen, isViewSelectorExpanded, setIsViewSelectorExpanded, isSearchMode, searchQuery, setSearchQuery, handleSearchExecute, handleYearMonthChange, blockCalendarClick, setCurrentYear, setCurrentMonthNum, setCurrentDayNum }: HeaderProps) {
  return (
    <>
      <header
        style={{
          padding: "6px 12px 6px 12px",
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
          pointerEvents: "auto",
        }}
      >
        {/* 左側：メニュー & 振り返り */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", zIndex: 20 }}>
          <button
            onClick={() => {
              setOpenSections([]);
              setIsSidebarOpen(true);
              setIsViewSelectorExpanded(false);
            }}
            style={{
              width: "40px",
              height: "40px",
              fontSize: "1.2rem",
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
          >
            ☰
          </button>

          <button
            onClick={() => {
              const dateStr = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(currentDayNum || "1").padStart(2, "0")}`;
              setStoryDate(dateStr);
              setIsStoryModalOpen(true);
              setIsViewSelectorExpanded(false);
            }}
            style={{
              width: "40px",
              height: "40px",
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              color: "var(--theme)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
            title="1日の振り返り"
          >
            <ImageIcon size={18} />
          </button>
        </div>

        {/* 中央：年月表示カプセル */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", zIndex: 10, display: "flex", justifyContent: "center" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px 14px",
              gap: "10px",
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "20px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              height: "40px",
              boxSizing: "border-box",
            }}
          >
            <input
              type="date"
              value={`${currentYear}-${String(currentMonthNum).padStart(2, "0")}-01`}
              onChange={(e) => {
                if (e.target.value) {
                  const [y, m] = e.target.value.split("-");
                  handleYearMonthChange(y, m);
                }
                e.target.blur();
              }}
              onFocus={() => {
                blockCalendarClick.current = true;
              }}
              onBlur={() => {
                setTimeout(() => {
                  blockCalendarClick.current = false;
                }, 300);
              }}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", zIndex: 10 }}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                const api = calendarRef.current?.getApi();
                if (viewType === "timeGridDay" && api) {
                  const d = api.getDate();
                  d.setMonth(d.getMonth() - 1);
                  api.gotoDate(d);
                } else {
                  api?.prev();
                }
              }}
              style={{ border: "none", background: "transparent", color: "var(--theme)", fontWeight: "900", fontSize: "0.9rem", cursor: "pointer", padding: "0 2px", position: "relative", zIndex: 20 }}
            >
              ◀
            </button>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 2px", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: "0.6rem", color: "var(--theme)", fontWeight: "900", letterSpacing: "0.5px", lineHeight: 1 }}>{currentYear}</span>
              <div style={{ fontSize: "1.05rem", color: "var(--text-main)", fontWeight: "900", lineHeight: 1.1 }}>{currentMonthNum}月</div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                const api = calendarRef.current?.getApi();
                if (viewType === "timeGridDay" && api) {
                  const d = api.getDate();
                  d.setMonth(d.getMonth() + 1);
                  api.gotoDate(d);
                } else {
                  api?.next();
                }
              }}
              style={{ border: "none", background: "transparent", color: "var(--theme)", fontWeight: "900", fontSize: "0.9rem", cursor: "pointer", padding: "0 2px", position: "relative", zIndex: 20 }}
            >
              ▶
            </button>
          </div>
        </div>

        {/* 右側：今日 & 表示切替 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", zIndex: 20, height: "40px" }}>
          {!isViewSelectorExpanded && (
            <button
              onClick={() => calendarRef.current?.getApi().today()}
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--border-color)",
                width: "40px",
                height: "40px",
                borderRadius: "14px",
                cursor: "pointer",
                color: "var(--theme)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                padding: 0,
                flexShrink: 0,
              }}
            >
              <Calendar size={18} />
            </button>
          )}

          <div
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              overflow: "hidden",
              transition: "width 0.2s ease-out",
              width: isViewSelectorExpanded ? "105px" : "40px",
              height: "40px",
              flexShrink: 0,
            }}
          >
            {isViewSelectorExpanded ? (
              <div style={{ display: "flex", width: "100%", height: "100%" }}>
                <button
                  onClick={() => {
                    setViewType("dayGridMonth");
                    calendarRef.current?.getApi().changeView("dayGridMonth");
                    setIsViewSelectorExpanded(false);
                  }}
                  style={{ flex: 1, height: "100%", padding: 0, background: viewType === "dayGridMonth" ? "var(--theme)" : "transparent", color: viewType === "dayGridMonth" ? "#fff" : "var(--text-main)", border: "none", fontWeight: "900", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  月
                </button>
                <button
                  onClick={() => {
                    setViewType("timeGridWeek");
                    calendarRef.current?.getApi().changeView("timeGridWeek");
                    setIsViewSelectorExpanded(false);
                  }}
                  style={{ flex: 1, height: "100%", padding: 0, background: viewType === "timeGridWeek" ? "var(--theme)" : "transparent", color: viewType === "timeGridWeek" ? "#fff" : "var(--text-main)", border: "none", fontWeight: "900", fontSize: "0.75rem", cursor: "pointer", borderLeft: "1px solid var(--border-color)", borderRight: "1px solid var(--border-color)" }}
                >
                  週
                </button>
                <button
                  onClick={() => {
                    setViewType("timeGridDay");
                    calendarRef.current?.getApi().changeView("timeGridDay");
                    calendarRef.current?.getApi().today();
                    const d = new Date();
                    setCurrentYear(String(d.getFullYear()));
                    setCurrentMonthNum(String(d.getMonth() + 1));
                    setCurrentDayNum(String(d.getDate()));
                    setIsViewSelectorExpanded(false);
                  }}
                  style={{ flex: 1, height: "100%", padding: 0, background: viewType === "timeGridDay" ? "var(--theme)" : "transparent", color: viewType === "timeGridDay" ? "#fff" : "var(--text-main)", border: "none", fontWeight: "900", fontSize: "0.75rem", cursor: "pointer" }}
                >
                  日
                </button>
              </div>
            ) : (
              <button onClick={() => setIsViewSelectorExpanded(true)} style={{ width: "100%", height: "100%", padding: 0, background: "transparent", color: "var(--theme)", border: "none", fontWeight: "900", fontSize: "0.85rem", cursor: "pointer" }}>
                {viewType === "dayGridMonth" ? "月" : viewType === "timeGridWeek" ? "週" : "日"}
              </button>
            )}
          </div>
        </div>
      </header>

      {isSearchMode && (
        <div className="glass-panel" style={{ margin: "8px", padding: "12px", borderRadius: "16px", display: "flex", gap: "8px", zIndex: 15, animation: "fadeInDown 0.3s ease-out" }}>
          <input type="text" className="pop-input" placeholder="タイトル・場所・メモ..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearchExecute()} style={{ padding: "10px 14px", flex: 1, fontSize: "0.9rem" }} autoFocus />
          <button onClick={handleSearchExecute} className="btn-pop" style={{ padding: "0 16px", fontSize: "0.85rem" }}>
            検索
          </button>
        </div>
      )}
    </>
  );
}
