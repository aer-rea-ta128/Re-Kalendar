"use client";

import React from "react";
import { Banknote, Repeat, Trash2, Edit3, Sparkles, CheckCircle, Clock, MapPin, Train, Plane, Bus, Home, Flag, CreditCard, ChevronUp, ChevronDown, Users, Star, Calendar as CalendarIcon, Search, Pin, Check, BookOpen, FileText, Circle } from "lucide-react";
import { DAY_NAMES, HOURS, MINUTES } from "@/app/lib/constants";
import { toLocalYYYYMMDD } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabase";
import { saveData } from "@/app/lib/storage";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "detail" | "dayOfWeekBulk" | "routine_detail" | "expense" | "subscription";
  setMode: (mode: any) => void;
  selectedId: string | null;
  title: string;
  setTitle: (val: string) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  startH: string;
  startM: string;
  endH: string;
  endM: string;
  setEndH: (val: string) => void;
  setEndM: (val: string) => void;
  handleStartHChange: (val: string) => void;
  handleStartMChange: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  categoryName: string;
  setCategoryName: (val: string) => void;
  eventColor: string;
  setEventColor: (val: string) => void;
  isAllDayBackground: boolean;
  setIsAllDayBackground: (val: boolean) => void;
  isMilestone: boolean;
  setIsMilestone: (val: boolean) => void;
  isPinned: boolean;
  setIsPinned: (val: boolean) => void;
  isTentative: boolean;
  setIsTentative: (val: boolean) => void;
  memo: string;
  setMemo: (val: string) => void;
  photoUrls: string[];
  setPhotoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  companions: string[];
  setCompanions: (val: string[]) => void;
  companionInput: string;
  setCompanionInput: (val: string) => void;
  selectedDays: number[];
  setSelectedDays: React.Dispatch<React.SetStateAction<number[]>>;
  customFieldsData: Record<string, any>;
  handleCustomFieldChange: (fId: string, val: any) => void;
  handleScoreChange: (fId: string, myVal: string, oppVal: string) => void;
  isGathering: boolean;
  setIsGathering: (val: boolean) => void;
  gatheringTime: string;
  setGatheringTime: (val: string) => void;
  departureTime: string;
  setDepartureTime: (val: string) => void;
  expandedBlocks: string[];
  toggleBlock: (block: string) => void;
  expenseAmount: string;
  setExpenseAmount: (val: string) => void;
  subName: string;
  setSubName: (val: string) => void;
  subAmount: string;
  setSubAmount: (val: string) => void;
  subCycle: string;
  setSubCycle: (val: string) => void;
  subDate: string;
  setSubDate: (val: string) => void;
  subs: any[];
  setSubs: (val: any[]) => void;
  routineAmount: string;
  setRoutineAmount: (val: string) => void;
  routineBonusAmount: string;
  setRoutineBonusAmount: (val: string) => void;
  categories: any[];
  themeColor: string;
  activeUserId: string | null;
  events: any[];
  customPayees: string[];
  setCustomPayees: (val: string[]) => void;
  quickTemplates: any[];
  setQuickTemplates: (val: any[]) => void;
  homeLocation: string;
  nearestStation: string;
  startPointType: string;
  isDarkMode: boolean;
  isRecordDetailsOpen: boolean;
  setIsRecordDetailsOpen: (val: boolean) => void;
  handleSave: () => Promise<void>;
  handleDelete: () => Promise<void>;
  handleDuplicate: () => void;
  handleCompleteRoutine: () => Promise<void>;
  handleRecordRoutineMoney: () => Promise<void>;
  fetchEvents: () => Promise<void>;
  setIsScheduleAssistantOpen: (val: boolean) => void;
  setAssistTimeSlots: React.Dispatch<React.SetStateAction<string[]>>;
  setAssistMode: (val: "send" | "receive") => void;
  setCustomFieldsData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  ColorSelector: React.FC<{ value: string; onChange: (val: string) => void }>;
  ExpenseTypeSelector: React.FC<{ value: string; onChange: (val: string) => void }>;
  PaymentMethodSelector: React.FC<{ value: string; onChange: (val: string) => void; isIncome: boolean }>;
  PayeeComboInput: React.FC<{ value: string; onChange: (val: string) => void; pastPayees: string[] }>;
  ModalHeader: React.FC<{ title: React.ReactNode; onClose: () => void; rightEl?: React.ReactNode }>;
}

export default function EventModal(props: EventModalProps) {
  const { isOpen, onClose, mode, setMode, selectedId, title, setTitle, startDate, setStartDate, endDate, setEndDate, startH, startM, endH, endM, setEndH, setEndM, handleStartHChange, handleStartMChange, location, setLocation, categoryName, setCategoryName, eventColor, setEventColor, isAllDayBackground, setIsAllDayBackground, isMilestone, setIsMilestone, isPinned, setIsPinned, isTentative, setIsTentative, memo, setMemo, photoUrls, setPhotoUrls, handlePhotoUpload, companions, setCompanions, companionInput, setCompanionInput, selectedDays, setSelectedDays, customFieldsData, handleCustomFieldChange, handleScoreChange, isGathering, setIsGathering, gatheringTime, setGatheringTime, departureTime, setDepartureTime, expandedBlocks, toggleBlock, expenseAmount, setExpenseAmount, subName, setSubName, subAmount, setSubAmount, subCycle, setSubCycle, subDate, setSubDate, subs, setSubs, routineAmount, setRoutineAmount, routineBonusAmount, setRoutineBonusAmount, categories, themeColor, activeUserId, events, customPayees, setCustomPayees, quickTemplates, setQuickTemplates, homeLocation, nearestStation, startPointType, isDarkMode, isRecordDetailsOpen, setIsRecordDetailsOpen, handleSave, handleDelete, handleDuplicate, handleCompleteRoutine, handleRecordRoutineMoney, fetchEvents, setIsScheduleAssistantOpen, setAssistTimeSlots, setAssistMode, setCustomFieldsData, ColorSelector, ExpenseTypeSelector, PaymentMethodSelector, PayeeComboInput, ModalHeader } = props;

  if (!isOpen) return null;

  const currentCategoryObj = categories.find((c: any) => c.name === categoryName);

  // 長押しドラムロール選択用 State & Ref
  const [isLongPressDragging, setIsLongPressDragging] = React.useState(false);
  const [isCategoryListOpen, setIsCategoryListOpen] = React.useState(false); // 🌟 追加: タップ時のリスト展開用
  const [dragOffsetPx, setDragOffsetPx] = React.useState<number>(0);
  const [activeCategoryIndex, setActiveCategoryIndex] = React.useState<number>(0);
  const longPressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const categorySelectorRef = React.useRef<HTMLDivElement>(null); // 🌟 追加

  // 🌟 追加: リストの外側をタップしたら閉じる処理
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (categorySelectorRef.current && !categorySelectorRef.current.contains(e.target as Node)) {
        setIsCategoryListOpen(false);
      }
    };
    if (isCategoryListOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isCategoryListOpen]);
  const startYRef = React.useRef<number>(0);
  const startIndexRef = React.useRef<number>(0);
  const isDraggingActiveRef = React.useRef<boolean>(false);

  const ITEM_HEIGHT = 40; // 視認性向上のため1項目40pxに設定

  // 「設定なし」を含めた全選択肢リスト
  const allCategoryOptions = React.useMemo(() => {
    return [{ name: "", color: "var(--theme)", label: "設定なし" }, ...categories.map((c: any) => ({ name: c.name, color: c.color, label: c.name }))];
  }, [categories]);

  const handleCategorySelectByIndex = (index: number) => {
    const selected = allCategoryOptions[index];
    if (selected) {
      setCategoryName(selected.name);
      if (selected.color && selected.name) setEventColor(selected.color);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    startYRef.current = e.clientY;
    isDraggingActiveRef.current = false;
    const currentIdx = Math.max(
      0,
      allCategoryOptions.findIndex((c) => c.name === (categoryName || "")),
    );
    startIndexRef.current = currentIdx;
    setActiveCategoryIndex(currentIdx);
    setDragOffsetPx(0);

    // 🌟 修正: 200msの長押しでドラムロール起動
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isDraggingActiveRef.current = true;
      setIsLongPressDragging(true);
      setIsCategoryListOpen(false);
      try {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}
    }, 200);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingActiveRef.current) {
      // 長押し判定前に指が大きく動いたらキャンセル（誤爆防止）
      if (Math.abs(e.clientY - startYRef.current) > 10 && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      return;
    }
    if (allCategoryOptions.length === 0) return;

    const deltaY = e.clientY - startYRef.current;
    const minDelta = -(allCategoryOptions.length - 1 - startIndexRef.current) * ITEM_HEIGHT;
    const maxDelta = startIndexRef.current * ITEM_HEIGHT;
    const clampedDelta = Math.max(minDelta - 20, Math.min(deltaY, maxDelta + 20));

    setDragOffsetPx(clampedDelta);

    const step = Math.round(-clampedDelta / ITEM_HEIGHT);
    let targetIdx = startIndexRef.current + step;
    targetIdx = Math.max(0, Math.min(targetIdx, allCategoryOptions.length - 1));

    if (targetIdx !== activeCategoryIndex) {
      setActiveCategoryIndex(targetIdx);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    // タイマーはタップでも長押しでも必ずクリアする
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // 🌟 タイマー変数ではなく、実際の「ドラッグ状態フラグ」で条件分岐する
    if (isDraggingActiveRef.current) {
      handleCategorySelectByIndex(activeCategoryIndex);
      setIsLongPressDragging(false);
      isDraggingActiveRef.current = false;
      setDragOffsetPx(0);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
    } else {
      // ドラッグ状態になっていなければタップと判定
      setIsCategoryListOpen(!isCategoryListOpen);
    }
  };

  const FuturisticDateInput = ({ label, value, onChange }: any) => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
      <span style={{ fontSize: "0.65rem", color: "var(--theme)", fontWeight: "900", letterSpacing: "1px" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", background: "var(--input-bg)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "8px", transition: "all 0.3s" }}>
        <CalendarIcon size={14} style={{ color: "var(--theme)", marginRight: "4px", flexShrink: 0 }} />
        <input type="date" value={value} onChange={onChange} style={{ border: "none", background: "transparent", outline: "none", color: "var(--text-main)", fontSize: "0.85rem", fontWeight: "bold", width: "100%", padding: 0 }} />
      </div>
    </div>
  );

  const DrumPickerSelect = ({ value, options, onChange, unit = "" }: { value: string; options: string[]; onChange: (val: string) => void; unit?: string }) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [isOpen, setIsOpen] = React.useState(false); // 🌟 追加: タップ時リスト展開用
    const [dragOffset, setDragOffset] = React.useState(0);
    const [activeIdx, setActiveIdx] = React.useState(0);
    const timerRef = React.useRef<NodeJS.Timeout | null>(null);
    const startY = React.useRef(0);
    const startIdx = React.useRef(0);
    const isDragActive = React.useRef(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    const ITEM_H = 38;

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
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

    const onPointerDown = (e: React.PointerEvent) => {
      startY.current = e.clientY;
      isDragActive.current = false;
      const idx = Math.max(0, options.indexOf(value));
      startIdx.current = idx;
      setActiveIdx(idx);
      setDragOffset(0);

      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {}

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        isDragActive.current = true;
        setIsDragging(true);
        setIsOpen(false);
      }, 200);
    };

    const onPointerMove = (e: React.PointerEvent) => {
      if (!isDragActive.current) {
        if (Math.abs(e.clientY - startY.current) > 10 && timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        return;
      }
      const deltaY = e.clientY - startY.current;

      const minDelta = -(options.length - 1 - startIdx.current) * ITEM_H;
      const maxDelta = startIdx.current * ITEM_H;
      const clampedDelta = Math.max(minDelta - 20, Math.min(deltaY, maxDelta + 20));

      setDragOffset(clampedDelta);

      const step = Math.round(-clampedDelta / ITEM_H);
      let target = startIdx.current + step;
      target = Math.max(0, Math.min(target, options.length - 1));

      if (target !== activeIdx) {
        setActiveIdx(target);
      }
    };

    const onPointerUp = (e: React.PointerEvent) => {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // 🌟 バグ修正：早期リターンを消し、フラグによる分岐に統一
      if (isDragActive.current) {
        if (options[activeIdx]) onChange(options[activeIdx]);
        setIsDragging(false);
        isDragActive.current = false;
        setDragOffset(0);
      } else {
        setIsOpen(!isOpen);
      }
    };

    return (
      <div ref={containerRef} style={{ position: "relative", flex: 1, minWidth: 0, zIndex: isOpen || isDragging ? 4000 : "auto" }}>
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onContextMenu={(e) => e.preventDefault()}
          style={{
            position: "relative",
            width: "100%",
            touchAction: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            cursor: "pointer",
          }}
        >
          <div
            className="pop-input"
            style={{
              width: "100%",
              background: isDragging ? "rgba(59, 130, 246, 0.12)" : "var(--input-bg)",
              border: `2px solid ${isDragging || isOpen ? "var(--theme)" : "var(--border-color)"}`,
              borderRadius: "8px",
              padding: "8px 4px",
              fontSize: "0.85rem",
              fontWeight: "bold",
              color: isDragging ? "var(--theme)" : "var(--text-main)",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "36px",
              boxSizing: "border-box",
              opacity: isDragging ? 0 : 1,
              transition: "all 0.15s ease",
            }}
          >
            {value}
            {unit}
          </div>
        </div>

        {/* 🌟 タップ時に展開するシンプルなリスト */}
        {isOpen && !isDragging && (
          <div className="hide-scrollbar" style={{ position: "absolute", top: "100%", left: 0, width: "100%", maxHeight: "200px", overflowY: "auto", background: "var(--card-bg)", border: "1px solid var(--theme)", borderRadius: "12px", zIndex: 3001, boxShadow: "0 4px 15px rgba(0,0,0,0.1)", marginTop: "4px", padding: "4px" }}>
            {options.map((opt) => (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                style={{ padding: "8px", textAlign: "center", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer", borderRadius: "8px", background: value === opt ? "var(--input-bg)" : "transparent", color: value === opt ? "var(--theme)" : "var(--text-main)" }}
              >
                {opt}
                {unit}
              </div>
            ))}
          </div>
        )}

        {/* ドラムロールピッカー */}
        {isDragging && (
          <div
            onContextMenu={(e) => e.preventDefault()}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "110px",
              height: `${ITEM_H * 5}px`,
              background: "var(--card-bg)",
              border: "2px solid var(--theme)",
              borderRadius: "18px",
              zIndex: 3000,
              boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
              overflow: "hidden",
              pointerEvents: "none",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              userSelect: "none",
              WebkitUserSelect: "none",
              WebkitTouchCallout: "none",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: `${ITEM_H * 2}px`,
                left: "6px",
                right: "6px",
                height: `${ITEM_H}px`,
                background: "rgba(59, 130, 246, 0.18)",
                border: "1px solid rgba(59, 130, 246, 0.35)",
                borderRadius: "10px",
                zIndex: 1,
              }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                paddingTop: `${ITEM_H * 2}px`,
                paddingBottom: `${ITEM_H * 2}px`,
                transform: `translateY(${-startIdx.current * ITEM_H + dragOffset}px)`,
                willChange: "transform",
                zIndex: 2,
              }}
            >
              {options.map((opt, idx) => {
                const isSelected = idx === activeIdx;
                const dist = Math.abs(idx - activeIdx);
                const opacity = dist === 0 ? 1 : dist === 1 ? 0.65 : 0.3;
                const scale = dist === 0 ? 1.12 : dist === 1 ? 0.92 : 0.8;

                return (
                  <div
                    key={opt}
                    style={{
                      height: `${ITEM_H}px`,
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity,
                      transform: `scale(${scale})`,
                      transition: "opacity 0.08s ease, transform 0.08s ease",
                      userSelect: "none",
                      WebkitUserSelect: "none",
                      WebkitTouchCallout: "none",
                    }}
                  >
                    <span
                      style={{
                        fontSize: isSelected ? "1.2rem" : "0.9rem",
                        fontWeight: isSelected ? "900" : "bold",
                        color: isSelected ? "var(--text-main)" : "var(--text-sub)",
                        lineHeight: 1,
                      }}
                    >
                      {opt}
                      {unit}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const FuturisticTimeInput = ({ label, h, m, setH, setM }: any) => (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px", minWidth: 0 }}>
      {label && <span style={{ fontSize: "0.65rem", color: "var(--text-sub)", fontWeight: "bold", letterSpacing: "1px" }}>{label}</span>}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <DrumPickerSelect value={h} options={HOURS} onChange={setH} />
        <span style={{ fontWeight: "bold", color: "var(--text-sub)", padding: "0 2px" }}>:</span>
        <DrumPickerSelect value={m} options={MINUTES} onChange={setM} />
      </div>
    </div>
  );

  return (
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100dvh", background: "rgba(0,0,0,0.6)", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={onClose}>
      <div className="glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: "92%", maxWidth: mode === "subscription" ? "760px" : "380px", maxHeight: "80dvh", background: "var(--bg-main)", padding: "24px", borderRadius: "24px", overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", transition: "max-width 0.3s ease", boxSizing: "border-box" }}>
        <ModalHeader
          title={
            mode === "expense" ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Banknote size={24} /> 支出を記録
              </div>
            ) : mode === "subscription" ? (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Repeat size={24} /> サブスクリプション管理
              </div>
            ) : mode === "create" ? (
              "予定を追加"
            ) : mode === "dayOfWeekBulk" ? (
              "曜日一括追加"
            ) : mode === "routine_detail" ? (
              "ルーティンの確認"
            ) : (
              "予定を編集"
            )
          }
          onClose={onClose}
          rightEl={
            mode === "detail" ? (
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleDuplicate} className="btn-secondary" style={{ padding: "8px 12px", fontSize: "0.8rem" }}>
                  複製
                </button>
                <button onClick={handleDelete} style={{ background: "#fee2e2", color: "#ef4444", border: "none", padding: "8px 12px", borderRadius: "12px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "900" }}>
                  削除
                </button>
              </div>
            ) : null
          }
        />

        {mode === "expense" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "10px 0" }}>
            <div style={{ display: "flex", background: "var(--input-bg)", borderRadius: "16px", padding: "6px", border: "1px solid var(--border-color)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.05)" }}>
              <button onClick={() => setCustomFieldsData({ ...customFieldsData, transactionMode: "expense" })} style={{ flex: 1, padding: "10px", borderRadius: "12px", background: customFieldsData.transactionMode !== "income" ? "rgba(239,68,68,0.1)" : "transparent", color: customFieldsData.transactionMode !== "income" ? "#ef4444" : "var(--text-sub)", border: `1px solid ${customFieldsData.transactionMode !== "income" ? "#ef4444" : "transparent"}`, fontWeight: "900", cursor: "pointer", transition: "all 0.2s", boxShadow: customFieldsData.transactionMode !== "income" ? "0 4px 10px rgba(239,68,68,0.15)" : "none" }}>
                支出
              </button>
              <button onClick={() => setCustomFieldsData({ ...customFieldsData, transactionMode: "income" })} style={{ flex: 1, padding: "10px", borderRadius: "12px", background: customFieldsData.transactionMode === "income" ? "rgba(16,185,129,0.1)" : "transparent", color: customFieldsData.transactionMode === "income" ? "#10b981" : "var(--text-sub)", border: `1px solid ${customFieldsData.transactionMode === "income" ? "#10b981" : "transparent"}`, fontWeight: "900", cursor: "pointer", transition: "all 0.2s", boxShadow: customFieldsData.transactionMode === "income" ? "0 4px 10px rgba(16,185,129,0.15)" : "none" }}>
                収入
              </button>
            </div>

            <div>
              <label className="form-label">日付</label>
              <input type="date" className="pop-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="form-label">金額</label>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input type="number" className="pop-input no-spin" style={{ flex: 1, textAlign: "right", fontSize: "1.6rem", fontWeight: "900", color: customFieldsData.transactionMode === "income" ? "#10b981" : "#ef4444" }} placeholder="0" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
                <span style={{ fontWeight: "bold", color: "var(--text-sub)" }}>円</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">ジャンル</label>
                <select className="pop-input" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} style={{ padding: "0 8px" }}>
                  <option value="">選択</option>
                  {categories.map((c: any) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="form-label">{customFieldsData.transactionMode === "income" ? "受取方法" : "支払方法"}</label>
                <select className="pop-input" value={customFieldsData.paymentMethod || "cash"} onChange={(e) => handleCustomFieldChange("paymentMethod", e.target.value)} style={{ padding: "0 8px" }}>
                  {customFieldsData.transactionMode === "income" ? (
                    <>
                      <option value="bank">🏦 振込・口座</option>
                      <option value="cash">💴 現金・手渡し</option>
                      <option value="paypay">📱 電子マネー</option>
                    </>
                  ) : (
                    <>
                      <option value="cash">💴 現金</option>
                      <option value="credit">💳 クレカ</option>
                      <option value="paypay">📱 スマホ決済</option>
                      <option value="ic">🪪 交通系IC</option>
                      <option value="reimburse">🔄 立替 (要精算)</option>
                    </>
                  )}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">メモ（用途など）</label>
              <input type="text" className="pop-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={customFieldsData.transactionMode === "income" ? "例：フリマアプリ売上" : "例：コンビニで水"} />
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
              <button onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>
                キャンセル
              </button>
              <button
                onClick={async () => {
                  if (!expenseAmount || !categoryName) return alert("金額とジャンルを入力してください");
                  const isInc = customFieldsData.transactionMode === "income";
                  const payload = {
                    title: title ? title : `${categoryName}の${isInc ? "収入" : "支出"}`,
                    category: categoryName,
                    start_at: new Date(`${startDate}T12:00:00`).toISOString(),
                    end_at: new Date(`${startDate}T13:00:00`).toISOString(),
                    metadata: {
                      isAllDayBackground: true,
                      isPureFinance: true,
                      customColor: categories.find((c) => c.name === categoryName)?.color || (isInc ? "#10b981" : "#ef4444"),
                      customFields: {
                        isExpenseSet: !isInc,
                        standardExpenseAmount: !isInc ? expenseAmount : "",
                        isIncomeSet: isInc,
                        standardIncomeAmount: isInc ? expenseAmount : "",
                        paymentMethod: customFieldsData.paymentMethod || "cash",
                      },
                    },
                  };
                  await (supabase.from("events") as any).insert([payload] as any);
                  onClose();
                  fetchEvents();
                  setExpenseAmount("");
                }}
                className="btn-pop"
                style={{ flex: 1.5, background: customFieldsData.transactionMode === "income" ? "#10b981" : "#ef4444", boxShadow: `0 4px 15px rgba(${customFieldsData.transactionMode === "income" ? "16,185,129" : "239,68,68"},0.4)` }}
              >
                記録する
              </button>
            </div>
          </div>
        ) : mode === "subscription" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "10px 0" }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "nowrap", width: "100%" }}>
              {(() => {
                const monthlyTotal = subs.filter((s) => s.cycle === "monthly").reduce((acc, s) => acc + Number(s.amount), 0);
                const yearlyTotal = subs.filter((s) => s.cycle === "yearly").reduce((acc, s) => acc + Number(s.amount), 0) + monthlyTotal * 12;
                return (
                  <>
                    <div style={{ flex: 1, minWidth: 0, background: "var(--card-bg)", border: `1px solid ${themeColor}`, borderRadius: "12px", padding: "12px", boxShadow: `0 4px 15px ${themeColor}15`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: "bold", color: "var(--text-sub)", marginBottom: "4px", whiteSpace: "nowrap" }}>月額の支払い</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: "900", color: themeColor }}>¥{monthlyTotal.toLocaleString()}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0, background: "var(--card-bg)", border: `1px solid ${themeColor}`, borderRadius: "12px", padding: "12px", boxShadow: `0 4px 15px ${themeColor}15`, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ fontSize: "0.7rem", fontWeight: "bold", color: "var(--text-sub)", marginBottom: "4px", whiteSpace: "nowrap" }}>年間の支払い</div>
                      <div style={{ fontSize: "1.3rem", fontWeight: "900", color: themeColor }}>¥{yearlyTotal.toLocaleString()}</div>
                    </div>
                  </>
                );
              })()}
            </div>

            <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
              <div style={{ flex: 1.5, minWidth: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--text-main)" }}>登録済みのサービス</span>
                <div style={{ maxHeight: "350px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }} className="hide-scrollbar">
                  {subs.map((sub, idx) => (
                    <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--card-bg)", padding: "12px", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
                      <div style={{ flex: 1, paddingRight: "8px", overflow: "hidden" }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--text-main)", marginBottom: "2px", whiteSpace: "normal", wordBreak: "break-all" }}>{sub.name}</div>
                        <div style={{ fontSize: "0.7rem", color: "var(--text-sub)", fontWeight: "bold", whiteSpace: "normal" }}>
                          {sub.cycle === "monthly" ? `毎月 ${sub.date}日` : `毎年 ${sub.date.replace("-", "月")}日`}支払{sub.category ? ` / ${sub.category}` : ""}
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                        <span style={{ fontWeight: "900", color: "#ef4444", fontSize: "1rem", whiteSpace: "nowrap" }}>¥{Number(sub.amount).toLocaleString()}</span>
                        <button
                          onClick={() => {
                            setSubName(sub.name);
                            setSubAmount(sub.amount);
                            setSubCycle(sub.cycle);
                            setSubDate(sub.date);
                            const newSubs = subs.filter((_, i) => i !== idx);
                            setSubs(newSubs);
                            saveData("os_subs", activeUserId, newSubs);
                          }}
                          style={{ background: "rgba(59,130,246,0.1)", border: "none", color: "#3b82f6", cursor: "pointer", padding: "6px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            const newSubs = subs.filter((_, i) => i !== idx);
                            setSubs(newSubs);
                            saveData("os_subs", activeUserId, newSubs);
                          }}
                          style={{ background: "rgba(239,68,68,0.1)", border: "none", color: "#ef4444", cursor: "pointer", padding: "6px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {subs.length === 0 && <div style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-sub)", fontWeight: "bold", padding: "24px", border: "1px dashed var(--border-color)", borderRadius: "12px" }}>登録されているサブスクはありません</div>}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: "250px" }}>
                <div className="card-box" style={{ margin: 0, border: `2px dashed ${themeColor}` }}>
                  <label className="form-label" style={{ color: themeColor, fontSize: "0.9rem" }}>
                    新しいサブスクを追加
                  </label>
                  <input type="text" className="pop-input" placeholder="サービス名 (Netflixなど)" value={subName} onChange={(e) => setSubName(e.target.value)} style={{ marginBottom: "12px" }} />

                  <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                    <select
                      className="pop-input"
                      value={subCycle}
                      onChange={(e) => {
                        setSubCycle(e.target.value);
                        if (e.target.value === "yearly" && !subDate.includes("-")) setSubDate("01-01");
                        if (e.target.value === "monthly" && subDate.includes("-")) setSubDate("1");
                      }}
                      style={{ width: "90px", flexShrink: 0 }}
                    >
                      <option value="monthly">毎月</option>
                      <option value="yearly">毎年</option>
                    </select>

                    {subCycle === "monthly" ? (
                      <select className="pop-input" value={subDate} onChange={(e) => setSubDate(e.target.value)} style={{ flex: 1, padding: "0 8px", textAlign: "center" }}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={String(d)}>
                            {d}日
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ display: "flex", gap: "4px", flex: 1 }}>
                        <select className="pop-input" value={subDate.includes("-") ? subDate.slice(-5).split("-")[0] : "01"} onChange={(e) => setSubDate(`${e.target.value}-${subDate.includes("-") ? subDate.slice(-5).split("-")[1] : "01"}`)} style={{ flex: 1, padding: "0 4px", textAlign: "center" }}>
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")).map((m) => (
                            <option key={m} value={m}>
                              {m}月
                            </option>
                          ))}
                        </select>
                        <select className="pop-input" value={subDate.includes("-") ? subDate.slice(-5).split("-")[1] : "01"} onChange={(e) => setSubDate(`${subDate.includes("-") ? subDate.slice(-5).split("-")[0] : "01"}-${e.target.value}`)} style={{ flex: 1, padding: "0 4px", textAlign: "center" }}>
                          {Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, "0")).map((d) => (
                            <option key={d} value={String(d).padStart(2, "0")}>
                              {d}日
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", background: "var(--input-bg)", padding: "12px", borderRadius: "12px", border: `1px solid var(--border-color)` }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-sub)", whiteSpace: "nowrap" }}>毎月の支払金額</span>
                    <input type="number" className="pop-input no-spin" placeholder="金額" value={subAmount} onChange={(e) => setSubAmount(e.target.value)} style={{ width: "100%", textAlign: "right", fontSize: "1.2rem", fontWeight: "bold", padding: "0 8px", minHeight: "unset", height: "36px", border: "none" }} />
                    <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-sub)", whiteSpace: "nowrap" }}>円</span>
                  </div>

                  <button
                    onClick={() => {
                      if (!subName || !subAmount) return alert("サービス名と金額を入力してください");
                      const finalDate = subCycle === "yearly" ? subDate.slice(-5) : subDate;
                      const newSubs = [...subs, { name: subName, amount: subAmount, cycle: subCycle, date: finalDate, category: "サブスク" }];
                      setSubs(newSubs);
                      saveData("os_subs", activeUserId, newSubs);
                      setSubName("");
                      setSubAmount("");
                    }}
                    className="btn-pop"
                    style={{ width: "100%", padding: "14px", fontSize: "1rem" }}
                  >
                    ＋ 登録する
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : mode === "routine_detail" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "10px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "1.3rem", fontWeight: "900", color: eventColor }}>
              <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: eventColor }} />
              {title}
            </div>

            {customFieldsData.routineType === "task" ? (
              <div className="card-box" style={{ margin: 0 }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text-sub)", marginBottom: "16px" }}>今月のこの目標・タスクを完了済みにしますか？</p>
                <button onClick={handleCompleteRoutine} className="btn-pop" style={{ padding: "16px 32px", fontSize: "1.1rem", width: "100%", borderRadius: "20px", background: eventColor, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <Check size={20} /> 完了として記録
                </button>
              </div>
            ) : (
              <div className="card-box" style={{ margin: 0 }}>
                <p style={{ fontSize: "0.8rem", color: "var(--text-sub)", marginBottom: "16px" }}>{customFieldsData.routineType === "income" ? "今月の収入（給料など）を記録します" : "今月の固定費（支払いなど）を記録します"}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: customFieldsData.routineType === "income" ? "#10b981" : "#ef4444", width: "60px" }}>{customFieldsData.routineType === "income" ? "収入" : "金額"}</span>
                  <input type="number" className="pop-input no-spin" style={{ flex: 1, textAlign: "right", fontSize: "1.2rem", fontWeight: "bold" }} placeholder="金額を入力" value={routineAmount} onChange={(e) => setRoutineAmount(e.target.value)} autoFocus />
                  <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--text-sub)" }}>円</span>
                </div>
                {customFieldsData.routineType === "income" && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px", paddingTop: "12px", borderTop: "1px dashed var(--border-color)" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#f59e0b", width: "60px" }}>追加の収入</span>
                    <input type="number" className="pop-input no-spin" style={{ flex: 1, textAlign: "right", fontSize: "1.1rem", fontWeight: "bold" }} placeholder="ボーナス・残業代など（任意）" value={routineBonusAmount} onChange={(e) => setRoutineBonusAmount(e.target.value)} />
                    <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--text-sub)" }}>円</span>
                  </div>
                )}
                <button onClick={handleRecordRoutineMoney} className="btn-pop" style={{ padding: "16px 32px", fontSize: "1.1rem", width: "100%", borderRadius: "20px", background: eventColor, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  <BookOpen size={20} /> 帳簿に記録する
                </button>
              </div>
            )}
            <button onClick={onClose} className="btn-secondary" style={{ width: "100%" }}>
              閉じる
            </button>
          </div>
        ) : (
          <>
            {(() => {
              const isPastOrToday = new Date(startDate) <= new Date();
              const showRecords = (mode === "detail" || (mode === "create" && isPastOrToday)) && currentCategoryObj?.fields && currentCategoryObj.fields.length > 0;

              const BlockTemplates = mode === "create" && (
                <div key="templates" className="card-box" style={{ padding: "12px 16px", marginBottom: "16px", background: "var(--card-bg)", border: "1px dashed var(--theme)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: quickTemplates.length > 0 ? "8px" : "0" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--theme)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Star size={14} /> よくある予定
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }} className="hide-scrollbar">
                    {quickTemplates.map((t, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setTitle(t.title);
                          setLocation(t.location || "");
                          props.handleStartHChange(t.startH);
                          props.handleStartMChange(t.startM);
                          setEndH(t.endH);
                          setEndM(t.endM);
                          setCategoryName(t.categoryName);
                          setIsAllDayBackground(t.isAllDayBackground);
                          setEventColor(t.eventColor || "");
                        }}
                        style={{ display: "flex", alignItems: "center", background: "var(--input-bg)", borderRadius: "8px", border: "1px solid var(--border-color)", padding: "8px 14px", cursor: "pointer", flexShrink: 0, transition: "all 0.2s", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
                      >
                        <span style={{ fontSize: "0.8rem", fontWeight: "bold" }}>{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );

              const BlockTitle = (
                <div key="title" style={{ marginBottom: "16px" }}>
                  <label className="form-label">タイトル</label>
                  <input type="text" className="pop-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：カフェで読書" />
                </div>
              );

              const BlockTime = (
                <div key="time" className="card-box" style={{ padding: "16px", marginBottom: "16px", overflow: "visible", position: "relative", zIndex: 30 }}>
                  {isAllDayBackground ? (
                    <div style={{ display: "flex", gap: "12px" }}>
                      <FuturisticDateInput label="開始日" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} />
                      <FuturisticDateInput label="終了日" value={endDate || startDate} onChange={(e: any) => setEndDate(e.target.value)} />
                    </div>
                  ) : (
                    <>
                      <div style={{ display: "flex", gap: "12px" }}>
                        <FuturisticDateInput label="開始日" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} />
                        <FuturisticTimeInput label="開始時刻" h={startH} m={startM} setH={handleStartHChange} setM={handleStartMChange} />
                      </div>
                      {!isMilestone && (
                        <div style={{ display: "flex", gap: "12px", marginTop: "12px", paddingTop: "12px", borderTop: "1px dashed var(--border-color)" }}>
                          <FuturisticDateInput label="終了日" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} />
                          <FuturisticTimeInput label="終了時刻" h={endH} m={endM} setH={(val: any) => setEndH(val)} setM={(val: any) => setEndM(val)} />
                        </div>
                      )}
                    </>
                  )}
                  <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                    <label className="checkbox-label" style={{ fontSize: "0.75rem", minHeight: "auto" }}>
                      <input
                        type="checkbox"
                        checked={isAllDayBackground}
                        onChange={(e) => {
                          setIsAllDayBackground(e.target.checked);
                          if (e.target.checked) setIsMilestone(false);
                        }}
                      />{" "}
                      1日単位
                    </label>
                    <label className="checkbox-label" style={{ fontSize: "0.75rem", minHeight: "auto" }}>
                      <input
                        type="checkbox"
                        checked={isMilestone}
                        onChange={(e) => {
                          setIsMilestone(e.target.checked);
                          if (e.target.checked) setIsAllDayBackground(false);
                        }}
                      />{" "}
                      時刻のみ表示
                    </label>
                  </div>
                </div>
              );

              const BlockLocationAndGathering = (
                <div key="loc_gathering" style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div>
                    <label className="form-label">場所</label>
                    <input type="text" className="pop-input" style={{ flex: 1 }} value={location} onChange={(e) => setLocation(e.target.value)} placeholder="目的地を入力" />
                  </div>

                  <div className="card-box" style={{ margin: 0, padding: 0, background: customFieldsData.isExpenseSet ? "var(--input-bg)" : "transparent", borderStyle: customFieldsData.isExpenseSet ? "solid" : "dashed", overflow: "visible" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem", flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={customFieldsData.isExpenseSet || false}
                          onChange={(e) => {
                            handleCustomFieldChange("isExpenseSet", e.target.checked);
                            if (e.target.checked && !expandedBlocks.includes("expense")) toggleBlock("expense");
                          }}
                        />
                        <CreditCard size={16} style={{ color: "var(--theme)" }} /> 支出・立替を記録する
                      </label>
                      {customFieldsData.isExpenseSet && (
                        <button type="button" onClick={() => toggleBlock("expense")} style={{ background: "transparent", border: "none", color: "var(--text-sub)", cursor: "pointer", display: "flex" }}>
                          {expandedBlocks.includes("expense") ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      )}
                    </div>
                    {customFieldsData.isExpenseSet &&
                      expandedBlocks.includes("expense") &&
                      (() => {
                        const expensesList = customFieldsData.expenses || [
                          {
                            id: Date.now(),
                            type: "expense",
                            category: customFieldsData.expenseCategory || categoryName || "",
                            amount: customFieldsData.standardExpenseAmount || "",
                            method: customFieldsData.paymentMethod || "cash",
                            payee: "",
                          },
                        ];

                        const updateExpense = (id: number, key: string, value: any) => {
                          const newList = expensesList.map((e: any) => (e.id === id ? { ...e, [key]: value } : e));
                          setCustomFieldsData((prev: any) => {
                            const newData = { ...prev, expenses: newList };
                            if (newList[0].id === id) {
                              if (key === "amount") newData.standardExpenseAmount = value;
                              if (key === "category") newData.expenseCategory = value;
                              if (key === "method") newData.paymentMethod = value;
                            }
                            if (mode === "detail" && selectedId) {
                              const currentEvent = events.find((e: any) => e.id === selectedId);
                              if (currentEvent)
                                supabase
                                  .from("events")
                                  .update({ metadata: { ...(currentEvent.extendedProps.metadata || {}), customFields: newData } })
                                  .eq("id", selectedId);
                            }
                            return newData;
                          });
                        };

                        const addExpense = () => {
                          handleCustomFieldChange("expenses", [...expensesList, { id: Date.now(), type: "expense", category: "", amount: "", method: "cash", payee: "" }]);
                        };

                        const removeExpense = (id: number) => {
                          if (expensesList.length <= 1) return;
                          handleCustomFieldChange(
                            "expenses",
                            expensesList.filter((e: any) => e.id !== id),
                          );
                        };

                        const pastPayees = customPayees;

                        return (
                          <div
                            style={{
                              paddingTop: "0px",
                              paddingRight: "16px",
                              paddingBottom: "16px",
                              paddingLeft: "16px",
                              borderTop: "1px dashed var(--border-color)",
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            {expensesList.map((exp: any, index: number) => {
                              const isIncome = exp.type === "income" || exp.type === "borrow";
                              const isAdvanceOrBorrow = exp.type === "advance" || exp.type === "borrow";

                              return (
                                <div
                                  key={exp.id}
                                  style={{
                                    paddingTop: index === 0 ? "16px" : "0px",
                                    paddingRight: "0px",
                                    paddingBottom: "16px",
                                    paddingLeft: "0px",
                                    marginBottom: "16px",
                                    borderBottom: index < expensesList.length - 1 ? "1px dashed var(--border-color)" : "none",
                                    position: "relative",
                                    zIndex: 100 - index,
                                  }}
                                >
                                  <div style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "stretch", height: "40px", width: "100%" }}>
                                    <div style={{ flex: 1.5, minWidth: 0 }}>
                                      <ExpenseTypeSelector value={exp.type} onChange={(val) => updateExpense(exp.id, "type", val)} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>{isAdvanceOrBorrow ? <PayeeComboInput value={exp.payee || ""} onChange={(val) => updateExpense(exp.id, "payee", val)} pastPayees={pastPayees} /> : <PaymentMethodSelector value={exp.method || "cash"} onChange={(val: string) => updateExpense(exp.id, "method", val)} isIncome={isIncome} />}</div>
                                    {expensesList.length > 1 && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          removeExpense(exp.id);
                                        }}
                                        style={{ background: "transparent", border: "none", color: "#ef4444", display: "flex", alignItems: "center", padding: "0 4px", cursor: "pointer", flexShrink: 0 }}
                                      >
                                        <Trash2 size={18} />
                                      </button>
                                    )}
                                  </div>

                                  <div style={{ display: "flex", alignItems: "stretch", gap: "8px", height: "40px", width: "100%" }}>
                                    <div style={{ flex: 1, position: "relative", minWidth: 0 }}>
                                      <input type="text" className="pop-input" style={{ width: "100%", height: "100%", fontSize: "0.85rem", padding: "0 12px", minHeight: "unset" }} placeholder="内容 (任意)" value={exp.description || ""} onChange={(e) => updateExpense(exp.id, "description", e.target.value)} />
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", width: "110px", flexShrink: 0 }}>
                                      <input type="number" className="pop-input no-spin" style={{ width: "100%", height: "100%", textAlign: "right", fontSize: "1.2rem", fontWeight: "bold", color: isIncome ? "#10b981" : "#ef4444", padding: "0 8px", minHeight: "unset" }} placeholder="0" value={exp.amount} onChange={(e) => updateExpense(exp.id, "amount", e.target.value)} />
                                      <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-sub)" }}>円</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                addExpense();
                              }}
                              className="btn-secondary"
                              style={{ width: "100%", padding: "12px", fontSize: "0.9rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "4px", borderRadius: "12px" }}
                            >
                              <span style={{ fontSize: "1.4rem", fontWeight: "bold", lineHeight: 0, marginTop: "-2px" }}>+</span>
                              <span style={{ fontWeight: "bold" }}>別の支出・立替を追加</span>
                            </button>
                          </div>
                        );
                      })()}
                  </div>

                  <div className="card-box" style={{ margin: 0, padding: 0, background: isGathering ? "var(--input-bg)" : "transparent", borderStyle: isGathering ? "solid" : "dashed", overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem", flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={isGathering}
                          onChange={(e) => {
                            setIsGathering(e.target.checked);
                            if (e.target.checked) {
                              if (!gatheringTime) setGatheringTime(`${startH}:${startM}`);
                              if (!departureTime) setDepartureTime(`${String(Math.max(0, Number(startH) - 1)).padStart(2, "0")}:${startM}`);
                              if (!expandedBlocks.includes("gathering")) toggleBlock("gathering");
                            }
                          }}
                        />
                        <Flag size={16} style={{ color: "var(--theme)" }} /> 集合・出発時間を設定
                      </label>
                      {isGathering && (
                        <button type="button" onClick={() => toggleBlock("gathering")} style={{ background: "transparent", border: "none", color: "var(--text-sub)", cursor: "pointer", display: "flex" }}>
                          {expandedBlocks.includes("gathering") ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      )}
                    </div>
                    {isGathering && expandedBlocks.includes("gathering") && (
                      <div style={{ padding: "0 16px 16px 16px", borderTop: "1px dashed var(--border-color)", marginTop: "4px", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: "bold", width: "80px", display: "flex", alignItems: "center", gap: "4px", color: "var(--text-sub)" }}>
                            <MapPin size={14} /> 出発地
                          </span>
                          <input type="text" className="pop-input" value={customFieldsData.customStartLocation || ""} onChange={(e) => handleCustomFieldChange("customStartLocation", e.target.value)} placeholder={startPointType === "address" ? homeLocation || "自宅" : nearestStation || "最寄り駅"} style={{ flex: 1, height: "36px", fontSize: "0.85rem" }} />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: "bold", width: "80px", display: "flex", alignItems: "center", gap: "4px", color: "var(--text-sub)" }}>
                            <Clock size={14} /> 目的地に
                          </span>
                          <div style={{ flex: 1 }}>
                            <FuturisticTimeInput h={gatheringTime.split(":")[0] || "12"} m={gatheringTime.split(":")[1] || "00"} setH={(val: any) => setGatheringTime(`${val}:${gatheringTime.split(":")[1] || "00"}`)} setM={(val: any) => setGatheringTime(`${gatheringTime.split(":")[0] || "12"}:${val}`)} />
                          </div>
                          <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-sub)" }}>集合</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const origin = customFieldsData.customStartLocation || (startPointType === "address" ? homeLocation : nearestStation) || "";
                              if (!origin) return alert("出発地を設定してください。");
                              if (!location) return alert("場所（目的地）を入力してください。");
                              const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(location)}&dirflg=r&ttype=arr&time=${gatheringTime || "12:00"}`;
                              window.open(url, "_blank");
                            }}
                            style={{ width: "36px", height: "36px", flexShrink: 0, border: "none", borderRadius: "10px", background: "var(--theme)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 10px var(--theme-shadow)" }}
                          >
                            <Search size={18} />
                          </button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: "bold", width: "80px", display: "flex", alignItems: "center", gap: "4px", color: "var(--text-sub)" }}>
                            {customFieldsData.customStartLocation ? <MapPin size={14} /> : startPointType === "address" ? <Home size={14} /> : <Train size={14} />}
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "45px" }}>{customFieldsData.customStartLocation ? "出発地" : startPointType === "address" ? "自宅" : "駅"}</span>を
                          </span>
                          <div style={{ flex: 1 }}>
                            <FuturisticTimeInput h={departureTime.split(":")[0] || "11"} m={departureTime.split(":")[1] || "30"} setH={(val: any) => setDepartureTime(`${val}:${departureTime.split(":")[1] || "00"}`)} setM={(val: any) => setDepartureTime(`${departureTime.split(":")[0] || "11"}:${val}`)} />
                          </div>
                          <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-sub)" }}>出発</span>
                          <div style={{ width: "36px", flexShrink: 0 }} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="card-box" style={{ margin: 0, padding: 0, background: customFieldsData.isTransit ? "var(--input-bg)" : "transparent", borderStyle: customFieldsData.isTransit ? "solid" : "dashed", overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem", flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={customFieldsData.isTransit || false}
                          onChange={(e) => {
                            handleCustomFieldChange("isTransit", e.target.checked);
                            if (e.target.checked && !expandedBlocks.includes("transit")) toggleBlock("transit");
                          }}
                        />
                        <Train size={16} style={{ color: "var(--theme)" }} /> 交通機関（時間を記録）
                      </label>
                      {customFieldsData.isTransit && (
                        <button type="button" onClick={() => toggleBlock("transit")} style={{ background: "transparent", border: "none", color: "var(--text-sub)", cursor: "pointer", display: "flex" }}>
                          {expandedBlocks.includes("transit") ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      )}
                    </div>
                    {customFieldsData.isTransit && expandedBlocks.includes("transit") && (
                      <div style={{ padding: "0 16px 16px 16px", borderTop: "1px dashed var(--border-color)", marginTop: "4px", paddingTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--theme)" }}>往路（行き）</span>
                          <select className="pop-input" value={customFieldsData.transitType || "train"} onChange={(e) => handleCustomFieldChange("transitType", e.target.value)} style={{ height: "36px", fontSize: "0.75rem" }}>
                            <option value="train"> 新幹線・電車</option>
                            <option value="plane"> 飛行機</option>
                            <option value="bus"> 高速バス・夜行バス</option>
                          </select>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: "bold", whiteSpace: "nowrap" }}>{customFieldsData.transitType === "plane" ? "搭乗:" : "乗車:"}</span>
                              <input type="time" className="pop-input" value={customFieldsData.transitDepTime || "10:00"} onChange={(e) => handleCustomFieldChange("transitDepTime", e.target.value)} style={{ padding: "0 8px", fontSize: "0.9rem", width: "100%" }} />
                            </div>
                            <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-sub)" }}>〜</span>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
                              <span style={{ fontSize: "0.75rem", fontWeight: "bold", whiteSpace: "nowrap" }}>{customFieldsData.transitType === "plane" ? "到着:" : "降車:"}</span>
                              <input type="time" className="pop-input" value={customFieldsData.transitArrTime || "12:00"} onChange={(e) => handleCustomFieldChange("transitArrTime", e.target.value)} style={{ padding: "0 8px", fontSize: "0.9rem", width: "100%" }} />
                            </div>
                          </div>
                        </div>

                        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "bold", marginTop: "8px" }}>
                          <input type="checkbox" checked={customFieldsData.hasReturnTransit || false} onChange={(e) => handleCustomFieldChange("hasReturnTransit", e.target.checked)} /> 復路（帰り）も記録する
                        </label>
                        {customFieldsData.hasReturnTransit && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", background: "var(--input-bg)", borderRadius: "12px" }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--theme)" }}>復路（帰り）</span>
                            <select className="pop-input" value={customFieldsData.returnTransitType || "train"} onChange={(e) => handleCustomFieldChange("returnTransitType", e.target.value)} style={{ height: "36px", fontSize: "0.75rem" }}>
                              <option value="train"> 新幹線・電車</option>
                              <option value="plane"> 飛行機</option>
                              <option value="bus"> 高速バス・夜行バス</option>
                            </select>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: "bold", whiteSpace: "nowrap" }}>{customFieldsData.returnTransitType === "plane" ? "搭乗:" : "出発:"}</span>
                                <input type="time" className="pop-input" value={customFieldsData.returnTransitDepTime || "18:00"} onChange={(e) => handleCustomFieldChange("returnTransitDepTime", e.target.value)} style={{ padding: "0 8px", fontSize: "0.9rem", width: "100%" }} />
                              </div>
                              <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-sub)" }}>〜</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
                                <span style={{ fontSize: "0.75rem", fontWeight: "bold", whiteSpace: "nowrap" }}>{customFieldsData.returnTransitType === "plane" ? "到着:" : "到着:"}</span>
                                <input type="time" className="pop-input" value={customFieldsData.returnTransitArrTime || "20:00"} onChange={(e) => handleCustomFieldChange("returnTransitArrTime", e.target.value)} style={{ padding: "0 8px", fontSize: "0.9rem", width: "100%" }} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );

              const BlockConfig = (
                <div key="config" className="card-box" style={{ padding: "16px" }}>
                  <label className="form-label">ジャンル・カラー</label>
                  <div ref={categorySelectorRef} style={{ position: "relative", width: "100%", marginBottom: "16px" }}>
                    <div
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      onContextMenu={(e) => e.preventDefault()}
                      style={{
                        position: "relative",
                        width: "100%",
                        touchAction: "none",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        WebkitTouchCallout: "none",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        className="pop-input"
                        style={{
                          width: "100%",
                          marginBottom: 0,
                          background: isLongPressDragging ? "rgba(59, 130, 246, 0.12)" : "var(--input-bg)",
                          borderColor: isLongPressDragging || isCategoryListOpen ? "var(--theme)" : "var(--border-color)",
                          color: isLongPressDragging ? "var(--theme)" : "var(--text-main)",
                          fontWeight: "bold",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          opacity: isLongPressDragging ? 0 : 1,
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span>{categoryName || "設定なし"}</span>
                        <ChevronDown size={16} style={{ color: "var(--text-sub)" }} />
                      </div>
                    </div>

                    {/* 🌟 タップ時に展開するシンプルなリスト */}
                    {isCategoryListOpen && !isLongPressDragging && (
                      <div className="hide-scrollbar" style={{ position: "absolute", top: "100%", left: 0, width: "100%", maxHeight: "250px", overflowY: "auto", background: "var(--card-bg)", border: "1px solid var(--theme)", borderRadius: "12px", zIndex: 3001, boxShadow: "0 4px 15px rgba(0,0,0,0.1)", marginTop: "4px", padding: "4px" }}>
                        {allCategoryOptions.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              handleCategorySelectByIndex(idx);
                              setIsCategoryListOpen(false);
                            }}
                            style={{ padding: "10px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", fontWeight: "bold", cursor: "pointer", borderRadius: "8px", background: categoryName === item.name ? "var(--input-bg)" : "transparent", color: categoryName === item.name ? "var(--theme)" : "var(--text-main)" }}
                          >
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: item.color }} />
                            {item.label}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 長押し時に指の動きと完全一致するドラムロールピッカー */}
                    {isLongPressDragging && (
                      <div
                        onContextMenu={(e) => e.preventDefault()}
                        style={{
                          position: "absolute",
                          top: "50%",
                          left: "50%",
                          transform: "translate(-50%, -50%)",
                          width: "92%",
                          height: `${ITEM_HEIGHT * 5}px`, // 5件分の高さ（200px）
                          background: "var(--card-bg)",
                          border: "2px solid var(--theme)",
                          borderRadius: "20px",
                          zIndex: 2000,
                          boxShadow: "0 16px 40px rgba(0,0,0,0.35)",
                          overflow: "hidden",
                          pointerEvents: "none",
                          backdropFilter: "blur(16px)",
                          WebkitBackdropFilter: "blur(16px)",
                          userSelect: "none",
                          WebkitUserSelect: "none",
                          WebkitTouchCallout: "none",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "flex-start",
                          alignItems: "center",
                        }}
                      >
                        {/* 中央の確定インジケーター（枠） */}
                        <div
                          style={{
                            position: "absolute",
                            top: `${ITEM_HEIGHT * 2}px`, // ちょうど中央の3番目位置
                            left: "8px",
                            right: "8px",
                            height: `${ITEM_HEIGHT}px`,
                            background: "rgba(59, 130, 246, 0.18)",
                            border: "1px solid rgba(59, 130, 246, 0.35)",
                            borderRadius: "12px",
                            zIndex: 1,
                          }}
                        />

                        {/* スクロール本体（上下に2件分の余白を持って常に中心と同期） */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            width: "100%",
                            paddingTop: `${ITEM_HEIGHT * 2}px`,
                            paddingBottom: `${ITEM_HEIGHT * 2}px`,
                            transform: `translateY(${-startIndexRef.current * ITEM_HEIGHT + dragOffsetPx}px)`,
                            willChange: "transform",
                            zIndex: 2,
                          }}
                        >
                          {allCategoryOptions.map((item, idx) => {
                            const isSelected = idx === activeCategoryIndex;
                            const distance = Math.abs(idx - activeCategoryIndex);
                            const opacity = distance === 0 ? 1 : distance === 1 ? 0.65 : 0.35;
                            const scale = distance === 0 ? 1.06 : distance === 1 ? 0.94 : 0.85;

                            return (
                              <div
                                key={item.name || "none"}
                                style={{
                                  height: `${ITEM_HEIGHT}px`,
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "10px",
                                  opacity,
                                  transform: `scale(${scale})`,
                                  transition: "opacity 0.08s ease, transform 0.08s ease",
                                  userSelect: "none",
                                  WebkitUserSelect: "none",
                                  WebkitTouchCallout: "none",
                                  padding: "0 16px",
                                  boxSizing: "border-box",
                                }}
                              >
                                <div
                                  style={{
                                    width: isSelected ? "12px" : "8px",
                                    height: isSelected ? "12px" : "8px",
                                    borderRadius: "50%",
                                    backgroundColor: item.color,
                                    flexShrink: 0,
                                    boxShadow: isSelected ? `0 0 8px ${item.color}` : "none",
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: isSelected ? "1.05rem" : "0.85rem",
                                    fontWeight: isSelected ? "900" : "bold",
                                    color: isSelected ? "var(--text-main)" : "var(--text-sub)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    userSelect: "none",
                                    WebkitUserSelect: "none",
                                    WebkitTouchCallout: "none",
                                  }}
                                >
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <ColorSelector value={eventColor || themeColor} onChange={setEventColor} />

                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--border-color)" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.75rem" }}>
                      <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} style={{ margin: 0 }} />
                      <Pin size={12} /> 重要な予定としてピン留め
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "0.75rem", color: "#f59e0b", fontWeight: "bold" }}>
                      <input type="checkbox" checked={isTentative} onChange={(e) => setIsTentative(e.target.checked)} style={{ margin: 0 }} />
                      <CalendarIcon size={12} /> 入るかもしれない予定（仮予定として薄く表示）
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-sub)" }}>通知のタイミング（複数選択可）</span>
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "4px" }}>
                        {[0, 5, 10, 30, 60].map((minutes) => {
                          const offsets = customFieldsData.notificationOffsets || [10];
                          const isChecked = offsets.includes(minutes);
                          return (
                            <label key={minutes} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const nextOffsets = e.target.checked ? [...offsets, minutes] : offsets.filter((m: number) => m !== minutes);
                                  handleCustomFieldChange("notificationOffsets", nextOffsets);
                                }}
                              />
                              {minutes === 0 ? "当日の同時刻" : `${minutes}分前`}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {mode === "detail" && isTentative && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setIsTentative(false);
                        setTimeout(handleSave, 100);
                      }}
                      style={{ width: "100%", marginTop: "12px", padding: "12px", background: "#10b981", color: "#fff", border: "none", borderRadius: "12px", fontWeight: "bold", fontSize: "1rem", cursor: "pointer", boxShadow: "0 4px 10px rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                    >
                      <CheckCircle size={20} /> この予定で確定する
                    </button>
                  )}
                </div>
              );

              const showPhotoUI = currentCategoryObj?.allowPhoto || photoUrls.length > 0;
              const BlockRecords = showRecords && (
                <details key="records" className="card-box" style={{ background: isDarkMode ? "rgba(245, 158, 11, 0.1)" : "rgba(254, 243, 199, 0.7)", border: "1px solid rgba(253, 230, 138, 0.5)", marginBottom: "16px", padding: "16px" }} open={isRecordDetailsOpen} onToggle={(e) => setIsRecordDetailsOpen((e.target as HTMLDetailsElement).open)}>
                  <summary style={{ fontSize: "0.85rem", fontWeight: "900", color: "#d97706", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", outline: "none", listStyle: "none" }}>
                    <FileText size={16} /> 事後の記録（振り返り）を追加
                  </summary>
                  <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    {currentCategoryObj?.fields?.map((f: any) => (
                      <div key={f.id} style={{ marginBottom: "12px", background: "var(--card-bg)", padding: "12px", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: "900", color: "var(--theme)", display: "block", marginBottom: "8px" }}>{f.name}</span>

                        {f.type === "number" && (
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const val = Number(customFieldsData[f.id] || 0);
                                handleCustomFieldChange(f.id, String(val - 1));
                              }}
                              style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-main)", fontSize: "1.2rem", fontWeight: "bold", cursor: "pointer" }}
                            >
                              -
                            </button>
                            <input type="number" className="pop-input" style={{ flex: 1, textAlign: "center", fontSize: "1.3rem", fontWeight: "900", color: "var(--theme)" }} value={customFieldsData[f.id] || ""} onChange={(e) => handleCustomFieldChange(f.id, e.target.value)} />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const val = Number(customFieldsData[f.id] || 0);
                                handleCustomFieldChange(f.id, String(val + 1));
                              }}
                              style={{ width: "36px", height: "36px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--input-bg)", color: "var(--text-main)", fontSize: "1.2rem", fontWeight: "bold", cursor: "pointer" }}
                            >
                              +
                            </button>
                            <span style={{ padding: "0 4px", fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-sub)" }}>{f.unit}</span>
                          </div>
                        )}

                        {f.type === "score" &&
                          (() => {
                            const myScore = customFieldsData[f.id]?.my || "";
                            const oppScore = customFieldsData[f.id]?.opp || "";
                            const result = customFieldsData[f.id]?.res || "";

                            let resultBadge: React.ReactNode = null;
                            if (result === "win")
                              resultBadge = (
                                <span style={{ background: "#10b981", color: "#fff", padding: "6px 16px", borderRadius: "16px", fontWeight: "900", fontSize: "1.2rem", letterSpacing: "2px", boxShadow: "0 4px 10px rgba(16,185,129,0.3)", animation: "popIn 0.3s", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <Sparkles size={20} /> WIN
                                </span>
                              );
                            else if (result === "lose")
                              resultBadge = (
                                <span style={{ background: "#ef4444", color: "#fff", padding: "6px 16px", borderRadius: "16px", fontWeight: "900", fontSize: "1.2rem", letterSpacing: "2px", boxShadow: "0 4px 10px rgba(239,68,68,0.3)", animation: "popIn 0.3s", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <ChevronDown size={20} /> LOSE
                                </span>
                              );
                            else if (result === "draw")
                              resultBadge = (
                                <span style={{ background: "#94a3b8", color: "#fff", padding: "6px 16px", borderRadius: "16px", fontWeight: "900", fontSize: "1.2rem", letterSpacing: "2px", animation: "popIn 0.3s", display: "flex", alignItems: "center", gap: "6px" }}>
                                  <Circle size={20} /> DRAW
                                </span>
                              );

                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", background: "var(--bg-main)", padding: "16px", borderRadius: "16px", border: `1px solid var(--border-color)` }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "100%" }}>
                                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--theme)" }}>応援チーム</span>
                                    <input type="number" className="pop-input no-spin" style={{ width: "100%", textAlign: "center", fontSize: "2rem", fontWeight: "900", height: "60px", padding: 0 }} placeholder="0" value={myScore} onChange={(e) => handleScoreChange(f.id, e.target.value, oppScore)} />
                                  </div>
                                  <span style={{ fontWeight: "900", color: "var(--text-sub)", fontSize: "1.5rem", marginTop: "24px" }}>VS</span>
                                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                                    <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-sub)" }}>相手チーム</span>
                                    <input type="number" className="pop-input no-spin" style={{ width: "100%", textAlign: "center", fontSize: "2rem", fontWeight: "900", height: "60px", padding: 0 }} placeholder="0" value={oppScore} onChange={(e) => handleScoreChange(f.id, myScore, e.target.value)} />
                                  </div>
                                </div>
                                <div style={{ height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}>{resultBadge}</div>
                              </div>
                            );
                          })()}

                        {(f.type === "money_expense" || f.type === "money_income") && (
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontWeight: "900", color: f.type === "money_income" ? "#10b981" : "#ef4444", fontSize: "0.85rem" }}>{f.type === "money_income" ? "収入" : "支出"}</span>
                            <input type="number" className="pop-input" style={{ flex: 1, textAlign: "right", fontSize: "1.2rem", fontWeight: "bold" }} placeholder="金額を入力" value={customFieldsData[f.id] || ""} onChange={(e) => handleCustomFieldChange(f.id, e.target.value)} />
                            <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--text-sub)" }}>円</span>
                          </div>
                        )}

                        {f.type === "money" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <select className="pop-input" style={{ width: "90px", padding: "8px" }} value={customFieldsData[f.id]?.type || "expense"} onChange={(e) => handleCustomFieldChange(f.id, { ...(customFieldsData[f.id] || {}), type: e.target.value })}>
                                <option value="expense">支出</option>
                                <option value="income">収入</option>
                              </select>
                              <input type="number" className="pop-input" style={{ flex: 1 }} placeholder="金額" value={customFieldsData[f.id]?.amount || ""} onChange={(e) => handleCustomFieldChange(f.id, { ...(customFieldsData[f.id] || {}), amount: e.target.value })} />
                            </div>
                          </div>
                        )}

                        {f.type === "wage" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ padding: "8px", background: "var(--input-bg)", borderRadius: "8px", fontSize: "0.75rem", color: "var(--text-sub)" }}>
                              <div style={{ fontWeight: "bold", marginBottom: "4px", color: "var(--text-main)", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Clock size={14} /> 予定時間から自動計算
                              </div>
                              {f.wageRules?.map((r: any, i: number) => (
                                <div key={i}>
                                  ・{r.start.replace(":59", ":00")}〜{r.end.replace(":59", ":00")} : {r.wage}円
                                </div>
                              ))}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-main)", fontWeight: "bold" }}>休憩時間</span>
                              <input type="number" className="pop-input" style={{ width: "80px", height: "32px", textAlign: "right", fontSize: "0.9rem" }} value={customFieldsData[f.id]?.breakTime || ""} onChange={(e) => handleCustomFieldChange(f.id, { ...customFieldsData[f.id], breakTime: e.target.value })} placeholder="0" />
                              <span style={{ fontSize: "0.75rem", color: "var(--text-sub)", fontWeight: "bold" }}>分</span>
                            </div>
                            <div style={{ display: "flex", gap: "12px", marginTop: "10px", flexWrap: "wrap", paddingBottom: "12px" }}>
                              <label className="checkbox-label" style={{ fontSize: "0.7rem", minHeight: "auto", gap: "6px" }}>
                                <input type="checkbox" checked={customFieldsData[f.id]?.overtimePremium !== false} onChange={(e) => handleCustomFieldChange(f.id, { ...customFieldsData[f.id], overtimePremium: e.target.checked })} style={{ width: "14px", height: "14px" }} /> 8時間超え 25%UP
                              </label>
                              <label className="checkbox-label" style={{ fontSize: "0.7rem", minHeight: "auto", gap: "6px" }}>
                                <input type="checkbox" checked={customFieldsData[f.id]?.nightPremium !== false} onChange={(e) => handleCustomFieldChange(f.id, { ...customFieldsData[f.id], nightPremium: e.target.checked })} style={{ width: "14px", height: "14px" }} /> 深夜(22-5時) 25%UP
                              </label>
                            </div>

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--input-bg)", padding: "12px", borderRadius: "8px", border: "1px solid var(--theme)" }}>
                              <span style={{ fontSize: "0.8rem", color: "var(--theme)", fontWeight: "bold" }}>実働給与 (自動計算)</span>
                              <span style={{ fontSize: "1.4rem", fontWeight: "900", color: "var(--theme)" }}>
                                {(() => {
                                  let workStart = parseInt(startH) * 60 + parseInt(startM);
                                  let workEnd = parseInt(endH) * 60 + parseInt(endM);
                                  if (workEnd <= workStart) workEnd += 1440;

                                  let breakTime = parseInt(customFieldsData[f.id]?.breakTime || "0", 10);
                                  let stayMinutes = workEnd - workStart;
                                  if (breakTime > stayMinutes) breakTime = stayMinutes;

                                  let minuteWages: number[] = [];
                                  for (let m = workStart; m < workEnd; m++) {
                                    let dayM = m % 1440;
                                    let matchedWage = 0;
                                    f.wageRules?.forEach((rule: any) => {
                                      if (!rule.start || !rule.end || !rule.wage) return;
                                      let rs = parseInt(rule.start.split(":")[0]) * 60 + parseInt(rule.start.split(":")[1].replace("59", "00"));
                                      let re = parseInt(rule.end.split(":")[0]) * 60 + parseInt(rule.end.split(":")[1].replace("59", "00"));
                                      if (re <= rs) re += 1440;
                                      let inRule = false;
                                      if (re > 1440) {
                                        if ((dayM >= rs && dayM < 1440) || (dayM >= 0 && dayM < re - 1440)) inRule = true;
                                      } else {
                                        if (dayM >= rs && dayM < re) inRule = true;
                                      }
                                      if (inRule) matchedWage = Math.max(matchedWage, parseInt(rule.wage));
                                    });
                                    minuteWages.push(matchedWage);
                                  }

                                  let breakStartIdx = Math.floor((stayMinutes - breakTime) / 2);
                                  for (let i = 0; i < breakTime; i++) {
                                    minuteWages[breakStartIdx + i] = 0;
                                  }

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

                                  let totalWage = 0;
                                  let actualWorkCount = pastWorkMinutes;
                                  const applyOvertime = customFieldsData[f.id]?.overtimePremium !== false;
                                  const applyNight = customFieldsData[f.id]?.nightPremium !== false;

                                  for (let i = 0; i < stayMinutes; i++) {
                                    let currentMin = (workStart + i) % 1440;
                                    let w = minuteWages[i];
                                    if (w > 0) {
                                      actualWorkCount++;
                                      let multiplier = 1.0;
                                      if (applyOvertime && actualWorkCount > 480) multiplier += 0.25;
                                      if (applyNight && (currentMin >= 1320 || currentMin < 300)) multiplier += 0.25;
                                      totalWage += (w * multiplier) / 60;
                                    }
                                  }
                                  return Math.round(totalWage).toLocaleString();
                                })()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="card-box" style={{ margin: 0, padding: "16px" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--theme)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
                        <Edit3 size={16} /> 思い出メモ{showPhotoUI ? "・写真" : ""}を追加
                      </span>
                      <div>
                        <input type="text" className="pop-input" value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="思い出メモ..." style={{ background: "var(--input-bg)" }} />
                        <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed var(--border-color)" }}>
                          <label className="form-label" style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-main)" }}>
                            <Users size={16} color="var(--theme)" /> 誰と行った？（同行者）
                          </label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: companions.length > 0 ? "12px" : "0" }}>
                            {companions.map((c) => (
                              <span key={c} style={{ background: "var(--theme)", color: "#fff", padding: "4px 10px", borderRadius: "16px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", fontWeight: "bold" }}>
                                {c}{" "}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCompanions(companions.filter((x) => x !== c));
                                  }}
                                  style={{ background: "transparent", border: "none", color: "#fff", cursor: "pointer", padding: 0 }}
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                          <input
                            type="text"
                            className="pop-input"
                            placeholder="名前を入力してEnter"
                            value={companionInput}
                            onChange={(e) => setCompanionInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && companionInput.trim() !== "") {
                                e.preventDefault();
                                if (!companions.includes(companionInput.trim())) setCompanions([...companions, companionInput.trim()]);
                                setCompanionInput("");
                              }
                            }}
                            style={{ height: "40px", fontSize: "0.85rem" }}
                          />
                          <div className="hide-scrollbar" style={{ display: "flex", gap: "6px", overflowX: "auto", marginTop: "8px" }}>
                            {Array.from(new Set(events.flatMap((e: any) => e.extendedProps?.metadata?.companions || [])))
                              .filter((c) => !companions.includes(c as string))
                              .map((c) => (
                                <button
                                  key={c as string}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCompanions([...companions, c as string]);
                                  }}
                                  style={{ background: "var(--input-bg)", border: "1px solid var(--border-color)", color: "var(--text-sub)", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", cursor: "pointer", whiteSpace: "nowrap" }}
                                >
                                  + {c as string}
                                </button>
                              ))}
                          </div>
                        </div>
                        {showPhotoUI && (
                          <div style={{ marginTop: "12px" }}>
                            <label className="form-label" style={{ color: "var(--theme)" }}>
                              思い出の写真
                            </label>
                            <div className="hide-scrollbar" style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
                              {photoUrls.map((url, i) => (
                                <div key={i} style={{ position: "relative", flexShrink: 0 }}>
                                  <img src={url} style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover" }} alt="memory" />
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setPhotoUrls(photoUrls.filter((_, idx) => idx !== i));
                                    }}
                                    style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "6px", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                              <label style={{ width: "60px", height: "60px", borderRadius: "8px", border: "2px dashed var(--theme)", color: "var(--theme)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: "bold", fontSize: "1.2rem", flexShrink: 0 }}>
                                +<input type="file" multiple onChange={handlePhotoUpload} style={{ display: "none" }} />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </details>
              );

              const BlockBulk = mode === "create" && (
                <div key="bulk" className="card-box" style={{ padding: "16px" }}>
                  <label className="form-label">一括登録</label>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {DAY_NAMES.map((l, i) => (
                      <button key={i} onClick={() => setSelectedDays((prev) => (prev.includes(i) ? prev.filter((d) => d !== i) : [...prev, i]))} className={`day-btn ${selectedDays.includes(i) ? "active" : ""}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              );

              const items = showRecords ? [BlockRecords, BlockTitle, BlockTime, BlockLocationAndGathering, BlockConfig] : [BlockTemplates, BlockTitle, BlockTime, BlockLocationAndGathering, BlockConfig, BlockBulk];

              return items.filter(Boolean);
            })()}

            {customFieldsData.isTimetableEvent ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "24px" }}>
                <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-sub)" }}>※この予定は時間割マスターで管理されています</div>
                <button
                  onClick={() => {
                    onClose();
                    setTimeout(() => {
                      setMode("create");
                      setCategoryName("課題・テスト");
                      setTitle(`${title} の課題`);
                      setEventColor("#ef4444");
                      setIsMilestone(true);
                      props.onClose();
                    }, 300);
                  }}
                  className="btn-pop"
                  style={{ width: "100%", background: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  📝 この授業の課題・テストを登録
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "24px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button onClick={onClose} className="btn-secondary" style={{ flex: 1, padding: "14px", fontSize: "0.95rem", fontWeight: "bold" }}>
                    キャンセル
                  </button>
                  <button onClick={handleSave} className="btn-pop" style={{ flex: 1, padding: "14px", fontSize: "0.95rem", fontWeight: "bold" }}>
                    保存する
                  </button>
                </div>

                {((title && (mode === "create" || mode === "detail")) || mode === "create") && (
                  <div style={{ display: "flex", gap: "8px" }}>
                    {title && (mode === "create" || mode === "detail") ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const newT = { title, location, startH, startM, endH, endM, categoryName, isAllDayBackground, eventColor };
                          const updated = [...quickTemplates, newT];
                          setQuickTemplates(updated);
                          localStorage.setItem("quickTemplates", JSON.stringify(updated));
                          alert("「よくある予定」として新しく登録しました！");
                        }}
                        className="btn-secondary"
                        style={{ flex: 1, padding: "12px 8px", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", border: "2px dashed var(--theme)", color: "var(--theme)", fontWeight: "bold", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                      >
                        <Star size={16} /> テンプレート登録
                      </button>
                    ) : (
                      <div style={{ flex: 1 }} />
                    )}

                    {mode === "create" ? (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const sObj = new Date(startDate);
                          const dateStr = `${sObj.getMonth() + 1}/${sObj.getDate()}(${DAY_NAMES[sObj.getDay()]})`;
                          const timeStr = isAllDayBackground ? "終日" : `${startH}:${startM}〜${endH}:${endM}`;
                          const slotStr = `${dateStr} ${timeStr}`;
                          setAssistTimeSlots((prev) => {
                            if (!prev.includes(slotStr)) return [...prev, slotStr];
                            return prev;
                          });
                          onClose();
                          setIsScheduleAssistantOpen(true);
                          setAssistMode("send");
                        }}
                        className="btn-secondary"
                        style={{ flex: 1, padding: "12px 8px", fontSize: "0.8rem", whiteSpace: "nowrap", border: "1px solid #f59e0b", color: "#f59e0b", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        <Users size={16} /> 候補に追加
                      </button>
                    ) : (
                      <div style={{ flex: 1 }} />
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
