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
  headerPosition?: "top" | "bottom"; // 🌟 追加: 配置情報を受け取る
}

export default function Header({ currentYear, currentMonthNum, currentDayNum, viewType, setViewType, calendarRef, setIsSidebarOpen, setOpenSections, setStoryDate, setIsStoryModalOpen, isViewSelectorExpanded, setIsViewSelectorExpanded, isSearchMode, searchQuery, setSearchQuery, handleSearchExecute, handleYearMonthChange, blockCalendarClick, setCurrentYear, setCurrentMonthNum, setCurrentDayNum, firstDayOfWeek, headerPosition = "top" }: HeaderProps) {
  return (
    <>
      <header
        style={{
          padding: "8px 12px 8px 12px", // 縦方向の余白を少し広げる
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
              width: "46px", // サイズ拡大
              height: "46px",
              fontSize: "1.3rem",
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px", // 角丸も調整
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
              width: "46px", // サイズ拡大
              height: "46px",
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "16px",
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
            <ImageIcon size={20} /> {/* アイコンも少し大きく */}
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
              padding: "4px 18px",
              gap: "12px",
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              borderRadius: "24px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
              height: "46px",
              boxSizing: "border-box",
            }}
          >
            {/* 🌟 修正: 表示形式に応じて、ネイティブピッカーを「月・年」と「年・月・日」で切り替える */}
            {viewType === "dayGridMonth" ? (
              <input
                type="month"
                value={`${currentYear}-${String(currentMonthNum).padStart(2, "0")}`}
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
            ) : (
              <input
                type="date"
                value={`${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(currentDayNum || "01").padStart(2, "0")}`}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split("-");
                    setCurrentYear(y);
                    setCurrentMonthNum(m);
                    setCurrentDayNum(d);
                    calendarRef.current?.getApi().gotoDate(e.target.value);
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
            )}

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
              style={{ border: "none", background: "transparent", color: "var(--theme)", fontWeight: "900", fontSize: "1rem", cursor: "pointer", padding: "0 2px", position: "relative", zIndex: 20 }}
            >
              ◀
            </button>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "0 2px", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: "0.7rem", color: "var(--theme)", fontWeight: "900", letterSpacing: "0.5px", lineHeight: 1 }}>{currentYear}</span>
              <div style={{ fontSize: "1.2rem", color: "var(--text-main)", fontWeight: "900", lineHeight: 1.1 }}>{currentMonthNum}月</div>
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
              style={{ border: "none", background: "transparent", color: "var(--theme)", fontWeight: "900", fontSize: "1rem", cursor: "pointer", padding: "0 2px", position: "relative", zIndex: 20 }}
            >
              ▶
            </button>
          </div>
        </div>

        {/* 右側：今日 & 表示切替 */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", zIndex: 20, height: "46px" }}>
          <button
            onClick={() => calendarRef.current?.getApi().today()}
            style={{
              background: "var(--card-bg)",
              border: "1px solid var(--border-color)",
              width: "46px", // サイズ拡大
              height: "46px",
              borderRadius: "16px",
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
            <Calendar size={20} /> {/* アイコン拡大 */}
          </button>

          {(() => {
            const VIEWS = [
              { type: "dayGridMonth", label: "月" },
              { type: "timeGridWeek", label: "週" },
              { type: "timeGridDay", label: "日" },
            ];
            const [isHeaderDragging, setIsHeaderDragging] = React.useState(false);
            const [hoverView, setHoverView] = React.useState(viewType);
            const headerTimerRef = React.useRef<NodeJS.Timeout | null>(null);
            const isDragActiveRef = React.useRef<boolean>(false);
            const menuRef = React.useRef<HTMLDivElement | null>(null);
            const hoverViewRef = React.useRef<string>(viewType);

            const applyViewChange = (v: string) => {
              setViewType(v);
              calendarRef.current?.getApi().changeView(v);
              if (v === "timeGridDay") {
                calendarRef.current?.getApi().today();
                const d = new Date();
                setCurrentYear(String(d.getFullYear()));
                setCurrentMonthNum(String(d.getMonth() + 1));
                setCurrentDayNum(String(d.getDate()));
              }
            };

            const updateHoverFromCoords = (clientY: number) => {
              if (!menuRef.current) return;
              const rect = menuRef.current.getBoundingClientRect();
              // メニュー内のY座標進行度（0〜1）から縦並びの選択項目を算出
              const relativeY = clientY - rect.top;
              const ratio = relativeY / rect.height;
              let targetIdx = Math.floor(ratio * VIEWS.length);
              targetIdx = Math.max(0, Math.min(targetIdx, VIEWS.length - 1));
              const selectedType = VIEWS[targetIdx].type;
              if (selectedType !== hoverViewRef.current) {
                hoverViewRef.current = selectedType;
                setHoverView(selectedType);
              }
            };

            const handleViewPointerDown = (e: React.PointerEvent) => {
              isDragActiveRef.current = false;
              hoverViewRef.current = viewType;
              setHoverView(viewType);

              // 🌟 修正: タッチした瞬間に指の動きをキャプチャし、イベントのロストを防ぐ
              try {
                (e.target as HTMLElement).setPointerCapture(e.pointerId);
              } catch {}

              headerTimerRef.current = setTimeout(() => {
                isDragActiveRef.current = true;
                setIsHeaderDragging(true);
              }, 180);
            };

            const handleViewPointerMove = (e: React.PointerEvent) => {
              if (!isDragActiveRef.current) return;
              updateHoverFromCoords(e.clientY);
            };

            const handleViewPointerUp = (e: React.PointerEvent) => {
              if (headerTimerRef.current) {
                clearTimeout(headerTimerRef.current);
                headerTimerRef.current = null;
              }

              if (isDragActiveRef.current) {
                applyViewChange(hoverViewRef.current);
                setIsHeaderDragging(false);
                isDragActiveRef.current = false;
              } else {
                // 通常タップ時はリストメニューを展開/閉じる
                setIsViewSelectorExpanded(!isViewSelectorExpanded);
              }

              // 🌟 修正: 長押し・通常タップに関わらず、指を離した時に必ずキャプチャを解除する
              try {
                (e.target as HTMLElement).releasePointerCapture(e.pointerId);
              } catch {}
            };

            return (
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onPointerDown={handleViewPointerDown}
                  onPointerMove={handleViewPointerMove}
                  onPointerUp={handleViewPointerUp}
                  onPointerCancel={handleViewPointerUp}
                  onContextMenu={(e) => e.preventDefault()}
                  style={{
                    width: "46px", // サイズ拡大
                    height: "46px",
                    background: isViewSelectorExpanded ? "var(--theme)" : "var(--card-bg)",
                    border: `1px solid ${isHeaderDragging || isViewSelectorExpanded ? "var(--theme)" : "var(--border-color)"}`,
                    borderRadius: "16px",
                    fontWeight: "900",
                    fontSize: "1.05rem", // 文字拡大
                    color: isViewSelectorExpanded ? "#fff" : "var(--theme)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: isHeaderDragging || isViewSelectorExpanded ? "0 0 14px var(--theme-shadow)" : "0 2px 8px rgba(0,0,0,0.03)",
                    touchAction: "none",
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    WebkitTouchCallout: "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {viewType === "dayGridMonth" ? "月" : viewType === "timeGridWeek" ? "週" : "日"}
                </button>

                {/* 🌟 通常タップ時に展開する選択リスト（長押し時と同じコンパクトなピッカーUIに統一） */}
                {isViewSelectorExpanded && !isHeaderDragging && (
                  <div
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                      position: "absolute",
                      top: headerPosition === "bottom" ? "auto" : "calc(100% + 10px)",
                      bottom: headerPosition === "bottom" ? "calc(100% + 10px)" : "auto",
                      right: 0,
                      width: "54px",
                      background: "var(--card-bg)",
                      border: "2px solid var(--theme)",
                      borderRadius: "20px",
                      padding: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      zIndex: 3000,
                      boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      userSelect: "none",
                      WebkitUserSelect: "none",
                    }}
                  >
                    {VIEWS.map((v) => {
                      const isSelected = v.type === viewType;
                      return (
                        <div
                          key={v.type}
                          onClick={(e) => {
                            e.stopPropagation();
                            applyViewChange(v.type);
                            setIsViewSelectorExpanded(false);
                          }}
                          style={{
                            width: "100%",
                            height: "44px",
                            borderRadius: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "900",
                            fontSize: isSelected ? "1.1rem" : "0.95rem",
                            background: isSelected ? "var(--theme)" : "rgba(150, 150, 150, 0.08)",
                            color: isSelected ? "#fff" : "var(--text-sub)",
                            boxShadow: isSelected ? "0 4px 12px var(--theme-shadow)" : "none",
                            transform: isSelected ? "scale(1.05)" : "scale(0.96)",
                            cursor: "pointer",
                            transition: "all 0.1s ease-out",
                          }}
                        >
                          {v.label}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 長押し時に展開するピッカー（位置によって上か下かを切り替え） */}
                {isHeaderDragging && (
                  <div
                    ref={menuRef}
                    onContextMenu={(e) => e.preventDefault()}
                    style={{
                      position: "absolute",
                      // 🌟 修正: 下部配置の場合は上方向に展開する
                      top: headerPosition === "bottom" ? "auto" : "calc(100% + 10px)",
                      bottom: headerPosition === "bottom" ? "calc(100% + 10px)" : "auto",
                      right: 0,
                      width: "54px", // サイズ拡大
                      background: "var(--card-bg)",
                      border: "2px solid var(--theme)",
                      borderRadius: "20px",
                      padding: "6px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      zIndex: 3000,
                      boxShadow: "0 12px 36px rgba(0,0,0,0.35)",
                      backdropFilter: "blur(16px)",
                      WebkitBackdropFilter: "blur(16px)",
                      pointerEvents: "none",
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      WebkitTouchCallout: "none",
                    }}
                  >
                    {VIEWS.map((v) => {
                      const isSelected = v.type === hoverView;
                      return (
                        <div
                          key={v.type}
                          style={{
                            width: "100%",
                            height: "44px", // サイズ拡大
                            borderRadius: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "900",
                            fontSize: isSelected ? "1.1rem" : "0.95rem",
                            background: isSelected ? "var(--theme)" : "rgba(150, 150, 150, 0.08)",
                            color: isSelected ? "#fff" : "var(--text-sub)",
                            boxShadow: isSelected ? "0 4px 12px var(--theme-shadow)" : "none",
                            transform: isSelected ? "scale(1.05)" : "scale(0.96)",
                            transition: "all 0.1s ease-out",
                          }}
                        >
                          {v.label}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
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
