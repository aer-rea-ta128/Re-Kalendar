"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { DAY_NAMES } from "@/app/lib/constants";
import { hexToRgba, toLocalYYYYMMDD } from "@/app/lib/utils";
import { Train, Plane, Bus, Home, Pin, Gift, Repeat, MapPin } from "lucide-react";
import { supabase } from "@/app/lib/supabase";

interface CalendarBoardProps {
  calendarRef: React.RefObject<FullCalendar | null>;
  displayMode: string;
  overlapMode: string;
  viewType: string;
  setViewType: (view: string) => void;
  displayEvents: any[];
  holidays: Record<string, string>;
  walkTime: string;
  startPointType: string;
  searchResults: any[];
  currentSearchIndex: number;
  isDeleteMode: boolean;
  selectedForDelete: string[];
  setSelectedForDelete: React.Dispatch<React.SetStateAction<string[]>>;
  useEventColorForTitle: boolean;
  firstDayOfWeek: number;
  isDraggingRef: React.MutableRefObject<boolean>;
  blockCalendarClick: React.MutableRefObject<boolean>;
  isSwipingRef: React.MutableRefObject<boolean>;
  wasEventSelectedRef: React.MutableRefObject<boolean>;
  isSidebarOpen: boolean;
  isViewSelectorExpanded: boolean;
  isDayPickerOpen: boolean;
  clipboardEvent: any;
  setClipboardEvent: (val: any) => void;
  setMode: (mode: any) => void;
  setSelectedId: (id: string | null) => void;
  setTitle: (title: string) => void;
  setLocation: (loc: string) => void;
  setCategoryName: (name: string) => void;
  setEventColor: (color: string) => void;
  setStartH: (h: string) => void;
  setStartM: (m: string) => void;
  setEndH: (h: string) => void;
  setEndM: (m: string) => void;
  setIsAllDayBackground: (isAllDay: boolean) => void;
  setIsMilestone: (isMilestone: boolean) => void;
  setCustomFieldsData: (data: any) => void;
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  setIsModalOpen: (open: boolean) => void;
  setIsViewSelectorExpanded: (expanded: boolean) => void;
  setCurrentYear: (y: string) => void;
  setCurrentMonthNum: (m: string) => void;
  setCurrentDayNum: (d: string) => void;
  setIsDayPickerOpen: (open: boolean) => void;
  handleEventClick: (info: any) => void;
  fetchEvents: () => Promise<void>;
}

export default function CalendarBoard({ calendarRef, displayMode, overlapMode, viewType, setViewType, displayEvents, holidays, walkTime, startPointType, searchResults, currentSearchIndex, isDeleteMode, selectedForDelete, useEventColorForTitle, isDraggingRef, blockCalendarClick, isSwipingRef, wasEventSelectedRef, isSidebarOpen, isViewSelectorExpanded, isDayPickerOpen, clipboardEvent, setClipboardEvent, setMode, setSelectedId, setTitle, setLocation, setCategoryName, setEventColor, setStartH, setStartM, setEndH, setEndM, setIsAllDayBackground, setIsMilestone, setCustomFieldsData, setStartDate, setEndDate, setIsModalOpen, setIsViewSelectorExpanded, setCurrentYear, setCurrentMonthNum, setCurrentDayNum, setIsDayPickerOpen, handleEventClick, fetchEvents }: CalendarBoardProps) {
  const renderEventContent = (arg: any) => {
    const { event, view } = arg;
    const { start, end, extendedProps } = event;
    const { metadata = {}, isMilestone } = extendedProps;
    const viewType = view.type;

    const cColor = extendedProps.cColor || extendedProps.customColor || metadata.customColor || event.backgroundColor || "var(--theme)";
    const displayTitle = (event.title || "").replace("📌 ", "").replace(" 📷", "");
    const charCount = displayTitle.length || 1;
    const hasPhoto = metadata.photoUrls && metadata.photoUrls.length > 0;
    const isHighlighted = searchResults.length > 0 && event.id === String(searchResults[currentSearchIndex]?.id);
    const isSelectedForDelete = isDeleteMode && selectedForDelete.includes(event.id);
    const highlightClass = isHighlighted ? "highlighted-event" : isSelectedForDelete ? "delete-selected-event" : "";

    if (extendedProps.category === "収支記録" || extendedProps.category === "ルーティン達成") {
      return <div style={{ display: "none" }}></div>;
    }

    if (viewType === "dayGridMonth" && displayMode !== "normal") {
      if (displayMode === "dot") {
        return (
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: cColor,
              margin: "0 auto",
              boxShadow: `0 0 6px ${hexToRgba(cColor, 0.4)}`,
            }}
          />
        );
      }
      if (displayMode === "photo") {
        return (
          <div
            className={highlightClass}
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: hasPhoto ? "42px" : "20px",
              backgroundColor: "transparent",
              borderLeft: `3px solid ${cColor}`,
              borderRadius: "2px",
              boxSizing: "border-box",
              overflow: "hidden",
              padding: "2px 0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 4px", marginBottom: hasPhoto ? "2px" : "0" }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "bold", fontSize: "0.65rem", color: "var(--text-main)" }}>{displayTitle}</span>
            </div>
            {hasPhoto && (
              <div style={{ width: "100%", height: "24px", display: "flex", gap: "2px", padding: "0 2px", overflow: "hidden" }}>
                {metadata.photoUrls.slice(0, 3).map((url: string, i: number) => (
                  <img key={i} src={url} style={{ flex: 1, minWidth: 0, height: "100%", objectFit: "cover", borderRadius: "4px" }} alt="event" />
                ))}
              </div>
            )}
          </div>
        );
      }
    }

    if (extendedProps.isTransitEvent) {
      if (viewType === "dayGridMonth") return null;
      const startObj = new Date(start);
      const endObj = end ? new Date(end) : new Date(startObj.getTime() + 3600000);
      const sT = `${String(startObj.getHours()).padStart(2, "0")}:${String(startObj.getMinutes()).padStart(2, "0")}`;
      const eT = `${String(endObj.getHours()).padStart(2, "0")}:${String(endObj.getMinutes()).padStart(2, "0")}`;
      const targetId = event.id.replace("-travel", "").replace("-transit-out", "").replace("-transit-ret", "");

      let TransitIcon = Train;
      if (extendedProps.transitType === "plane") TransitIcon = Plane;
      else if (extendedProps.transitType === "bus") TransitIcon = Bus;
      else if (extendedProps.transitType === "home") TransitIcon = Home;

      return (
        <div
          data-travel-target={targetId}
          style={{
            width: "100%",
            height: "100%",
            padding: "4px 2px",
            background: hexToRgba(cColor, 0.1),
            border: `1.5px solid ${cColor}`,
            borderRadius: "4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            gap: "2px",
          }}
        >
          <TransitIcon size={12} color={cColor} style={{ flexShrink: 0, marginBottom: "2px" }} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontSize: "0.55rem", fontWeight: "900", color: cColor, lineHeight: 1.1 }}>
            <span>{sT}</span>
            <span style={{ margin: "-1px 0" }}>〜</span>
            <span>{eT}</span>
          </div>
        </div>
      );
    }

    const actualStart = extendedProps.originalStart ? new Date(extendedProps.originalStart) : start;
    const durationMin = end && actualStart ? (end.getTime() - actualStart.getTime()) / 60000 : 60;

    let startTimeOnly = "";
    let endTimeOnly = "";
    if (actualStart) {
      startTimeOnly = `${String(actualStart.getHours()).padStart(2, "0")}:${String(actualStart.getMinutes()).padStart(2, "0")}`;
      if (end) endTimeOnly = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
    }

    const transitBadge =
      metadata.customFields?.isTransit && (viewType === "timeGridWeek" || viewType === "timeGridDay") ? (
        <div style={{ position: "absolute", top: "2px", right: "4px", fontSize: "0.65rem", background: "#fff", color: cColor, padding: "2px 4px", borderRadius: "4px", border: `1px solid ${cColor}`, zIndex: 50, fontWeight: "bold", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: "2px" }}>
          {metadata.customFields.transitType === "plane" ? <Plane size={10} /> : metadata.customFields.transitType === "bus" ? <Bus size={10} /> : <Train size={10} />}
          <span>{metadata.customFields.transitDepTime}発</span>
        </div>
      ) : null;

    if (metadata.isAllDayBackground) {
      if (viewType === "timeGridWeek") {
        return (
          <div
            className={highlightClass}
            style={{
              width: "100%",
              height: "100%",
              cursor: "pointer",
              overflow: "hidden",
              background: `linear-gradient(135deg, ${hexToRgba(cColor, 0.25)} 0%, ${hexToRgba(cColor, 0.05)} 100%)`,
              borderTop: `1px solid ${hexToRgba(cColor, 0.6)}`,
              borderLeft: `4px solid ${cColor}`,
              borderBottom: `1px solid rgba(150, 150, 150, 0.1)`,
              borderRight: `1px solid rgba(150, 150, 150, 0.1)`,
              borderRadius: "6px",
              boxShadow: `0 2px 6px ${hexToRgba(cColor, 0.15)}`,
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              padding: "2px 8px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              boxSizing: "border-box",
            }}
          >
            {metadata.isPinned && <Pin size={10} style={{ color: "var(--text-main)", flexShrink: 0, transform: "rotate(45deg)" }} />}
            <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "var(--text-main)", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden", textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>{displayTitle}</span>
          </div>
        );
      } else {
        return (
          <div
            className={highlightClass}
            style={{
              backgroundColor: "transparent",
              padding: "4px 0",
              position: "relative",
              display: "flex",
              alignItems: "center",
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: arg.isStart ? "8px" : "-6px",
                right: arg.isEnd ? "4px" : "-6px",
                height: "2px",
                backgroundColor: cColor,
                boxShadow: `0 0 6px ${cColor}`,
                transform: "translateY(-50%)",
                zIndex: 1,
              }}
            />
            {arg.isStart && <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "var(--bg-main)", border: `3px solid ${cColor}`, boxShadow: `0 0 10px ${cColor}`, zIndex: 2, flexShrink: 0, marginLeft: "4px", marginRight: "4px" }} />}
            {arg.isStart && displayMode !== "dot" && (
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: "900",
                  color: "var(--text-main)",
                  background: "var(--bg-main)",
                  padding: "0 4px",
                  zIndex: 2,
                  marginLeft: "0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {metadata.isPinned && <Pin size={10} style={{ color: "var(--text-main)", flexShrink: 0, marginRight: "2px", display: "inline-block", transform: "rotate(45deg)" }} />}
                {displayTitle}
              </span>
            )}
          </div>
        );
      }
    }

    const overlappingEvents = view.calendar.getEvents().filter((other: any) => {
      if (other.id === event.id || other.allDay || other.extendedProps?.isAnniversary || other.extendedProps?.isMilestone || other.extendedProps?.metadata?.isAllDayBackground) return false;
      const oStart = other.start?.getTime() || 0;
      const oEnd = other.end?.getTime() || oStart + 3600000;
      const eStart = start?.getTime() || 0;
      const eEnd = end?.getTime() || eStart + 3600000;
      return oStart < eEnd && oEnd > eStart;
    });
    const allOverlappingCount = 1 + overlappingEvents.length;

    if (viewType === "dayGridMonth") {
      const isRoutine = extendedProps.isRoutine;
      const isAnniversary = extendedProps.isAnniversary;
      const isSub = String(event.id).startsWith("sub-");
      const isPayment = (isRoutine && metadata.routineType === "expense") || isSub;

      if (isAnniversary) {
        return (
          <div
            className={highlightClass}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "1px 4px",
              overflow: "hidden",
              width: "100%",
              height: "20px",
              backgroundColor: hexToRgba(cColor, 0.1),
              border: `1px solid ${hexToRgba(cColor, 0.3)}`,
              borderRadius: "4px",
              boxSizing: "border-box",
              marginBottom: "2px",
              boxShadow: `inset 0 0 8px ${hexToRgba(cColor, 0.05)}`,
            }}
          >
            <Gift size={10} style={{ color: cColor, marginRight: "4px", flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "900", fontSize: "0.65rem", color: cColor }}>{displayTitle}</span>
          </div>
        );
      }

      if (isPayment) {
        return (
          <div
            className={highlightClass}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "1px 4px",
              overflow: "hidden",
              width: "100%",
              height: "16px",
              backgroundColor: "var(--card-bg)",
              border: `1px solid ${cColor}`,
              borderRadius: "4px",
              boxSizing: "border-box",
              marginBottom: "1px",
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "bold", fontSize: "0.6rem", color: cColor }}>{displayTitle.replace("🔄 ", "")}</span>
          </div>
        );
      }

      if (isRoutine) {
        return (
          <div
            className={highlightClass}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "1px 4px",
              overflow: "hidden",
              width: "100%",
              height: "16px",
              backgroundColor: "transparent",
              borderLeft: `2px solid ${cColor}`,
              borderBottom: `1px dashed ${hexToRgba(cColor, 0.3)}`,
              boxSizing: "border-box",
              marginBottom: "1px",
            }}
          >
            <Repeat size={8} style={{ color: cColor, marginRight: "2px", flexShrink: 0 }} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "bold", fontSize: "0.6rem", color: "var(--text-main)" }}>{displayTitle}</span>
          </div>
        );
      }

      const isMultiDay = event.allDay || (end && new Date(end).getTime() - new Date(start).getTime() > 24 * 60 * 60 * 1000);

      if (displayMode === "compact") {
        return (
          <div
            className={highlightClass}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 4px",
              overflow: "hidden",
              width: "100%",
              height: "20px",
              boxSizing: "border-box",
              background: `linear-gradient(135deg, ${hexToRgba(cColor, 0.25)} 0%, ${hexToRgba(cColor, 0.05)} 100%)`,
              borderTop: `1px solid ${hexToRgba(cColor, 0.6)}`,
              borderLeft: `3px solid ${cColor}`,
              borderBottom: `1px solid rgba(150, 150, 150, 0.1)`,
              borderRight: `1px solid rgba(150, 150, 150, 0.1)`,
              borderRadius: "4px",
              boxShadow: `0 2px 6px ${hexToRgba(cColor, 0.15)}`,
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "4px", overflow: "hidden", width: "100%" }}>
              {!isMultiDay && !event.allDay && <span style={{ fontSize: "0.6rem", fontWeight: "900", color: cColor, lineHeight: "1", flexShrink: 0, textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>{startTimeOnly}</span>}
              {metadata.isPinned && <Pin size={8} style={{ flexShrink: 0, transform: "rotate(45deg)", color: "var(--text-main)" }} />}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "900", fontSize: "0.65rem", color: "var(--text-main)", textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>{displayTitle}</span>
            </div>
          </div>
        );
      } else {
        return (
          <div
            className={highlightClass}
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 4px",
              overflow: "hidden",
              width: "100%",
              height: "26px",
              boxSizing: "border-box",
              background: `linear-gradient(135deg, ${hexToRgba(cColor, 0.25)} 0%, ${hexToRgba(cColor, 0.05)} 100%)`,
              borderTop: `1px solid ${hexToRgba(cColor, 0.6)}`,
              borderLeft: `3px solid ${cColor}`,
              borderBottom: `1px solid rgba(150, 150, 150, 0.1)`,
              borderRight: `1px solid rgba(150, 150, 150, 0.1)`,
              borderRadius: "4px",
              boxShadow: `0 2px 6px ${hexToRgba(cColor, 0.15)}`,
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
            }}
          >
            {!isMultiDay && !event.allDay && <span style={{ fontSize: "0.55rem", fontWeight: "900", color: cColor, lineHeight: "1", textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>{startTimeOnly}</span>}
            <div style={{ display: "flex", alignItems: "center", gap: "4px", overflow: "hidden", width: "100%" }}>
              {metadata.isPinned && <Pin size={10} style={{ flexShrink: 0, transform: "rotate(45deg)", color: "var(--text-main)" }} />}
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: "900", fontSize: "0.7rem", color: "var(--text-main)", textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>{displayTitle}</span>
            </div>
          </div>
        );
      }
    }

    if (isMilestone) {
      return (
        <div className={highlightClass} style={{ width: "100%", height: "100%", position: "relative", overflow: "visible" }}>
          <div
            style={{
              position: "absolute",
              top: "0px",
              right: "2px",
              transform: "translateY(-50%)",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: cColor,
              border: "2px solid #fff",
              boxShadow: `0 2px 4px ${hexToRgba(cColor, 0.5)}`,
              zIndex: 100,
            }}
          />
        </div>
      );
    }

    if (viewType === "timeGridDay") {
      return null;
    }

    if (viewType === "timeGridWeek") {
      const isCrowded = allOverlappingCount >= 3;

      if (isCrowded) {
        return (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              view.calendar.changeView("timeGridDay", start);
            }}
            style={{
              height: "100%",
              width: "100%",
              display: "flex",
              flexDirection: "column",
              backgroundColor: hexToRgba(cColor, 0.15),
              border: `2px solid ${cColor}`,
              borderRadius: "4px",
              cursor: "pointer",
              boxSizing: "border-box",
            }}
            title="タップして日表示で確認"
          />
        );
      }

      const isNarrow = allOverlappingCount > 1;
      let useVertical = false;
      let titleSize = "0.75rem";
      let showLocation = false;
      let showStartTime = durationMin >= 60;
      let showEndTime = durationMin >= 60;
      const spacePerChar = durationMin / charCount;

      if (isNarrow) {
        if (durationMin <= 45 && charCount >= 5) {
          useVertical = false;
          titleSize = "0.55rem";
        } else {
          useVertical = true;
          const calculatedSize = 0.012 * spacePerChar + 0.45;
          titleSize = `${Math.min(Math.max(calculatedSize, 0.55), 0.75)}rem`;
        }
        if (durationMin > 90) {
          showStartTime = true;
          showEndTime = true;
        }
      } else {
        if (durationMin >= 90) {
          useVertical = true;
          showLocation = durationMin >= 120;
          const calculatedSize = 0.015 * spacePerChar + 0.55;
          let maxSize = 0.85;
          if (charCount >= 6) maxSize = 0.75;
          if (charCount >= 9) maxSize = 0.65;
          titleSize = `${Math.min(Math.max(calculatedSize, 0.55), maxSize)}rem`;
        } else {
          useVertical = false;
          showStartTime = durationMin >= 60;
          showEndTime = durationMin >= 60;
          if (durationMin <= 30 || charCount >= 10) titleSize = "0.55rem";
          else if (durationMin <= 45 || charCount >= 6) titleSize = "0.6rem";
          else titleSize = "0.7rem";
        }
      }

      let availableLines = Math.floor(durationMin / 15);
      if (!useVertical && showStartTime) availableLines -= 1;
      if (availableLines < 1) availableLines = 1;

      const hasLocationRight = useVertical && !isNarrow && showLocation && metadata.location;
      const maxFitChars = (durationMin - (showStartTime ? 12 : 0) - (showEndTime ? 12 : 0)) / 12;
      const isOverflowing = charCount > maxFitChars;
      const dynamicAlign = useVertical ? (isOverflowing ? "flex-start" : "center") : "center";
      const safeMaxChars = Math.floor(maxFitChars);
      const extraSpace = (metadata.isPinned ? 1 : 0) + (hasPhoto ? 1 : 0);
      const finalDisplayTitle = useVertical && isOverflowing ? displayTitle.slice(0, Math.max(1, safeMaxChars - extraSpace - 1)) + "…" : displayTitle;

      return (
        <div
          data-main-id={event.id}
          className={`${highlightClass} smart-event-container ${!isNarrow ? "force-full-width" : ""}`}
          style={{
            height: "100%",
            width: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            background: `linear-gradient(135deg, ${hexToRgba(cColor, 0.25)} 0%, ${hexToRgba(cColor, 0.05)} 100%)`,
            borderTop: `1px solid ${hexToRgba(cColor, 0.6)}`,
            borderLeft: `4px solid ${cColor}`,
            borderBottom: `1px solid rgba(150, 150, 150, 0.1)`,
            borderRight: `1px solid rgba(150, 150, 150, 0.1)`,
            borderRadius: "8px",
            boxShadow: `0 2px 6px ${hexToRgba(cColor, 0.15)}`,
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            justifyContent: "space-between",
            position: "relative",
            boxSizing: "border-box",
          }}
        >
          {showStartTime && <div style={{ padding: "2px 0", width: "100%", textAlign: "center", fontSize: "0.55rem", fontWeight: "900", color: cColor, lineHeight: 1.1 }}>{startTimeOnly}</div>}
          <div
            style={{
              flex: 1,
              display: "flex",
              overflow: "hidden",
              justifyContent: "center",
              alignItems: dynamicAlign,
              flexDirection: "row",
              gap: "8px",
              position: "relative",
              paddingTop: useVertical && isOverflowing ? "2px" : "0",
              transform: hasLocationRight ? "translateX(-4px)" : "none",
              paddingRight: hasLocationRight ? "12px" : "0",
              marginBottom: showEndTime ? "12px" : "0",
            }}
          >
            <div
              style={
                {
                  fontSize: titleSize,
                  fontWeight: "bold",
                  color: useEventColorForTitle ? cColor : "var(--text-main)",
                  writingMode: useVertical ? "vertical-rl" : "horizontal-tb",
                  textOrientation: useVertical ? "upright" : "mixed",
                  whiteSpace: useVertical ? "nowrap" : "normal",
                  wordBreak: "break-all",
                  display: useVertical ? "block" : "-webkit-box",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: useVertical ? undefined : availableLines,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  textAlign: useVertical ? (isOverflowing ? "start" : "center") : "center",
                  maxHeight: "100%",
                } as any
              }
            >
              {useVertical ? (
                <span style={{ display: "inline-block", width: "100%" }}>
                  {metadata.isPinned && <Pin size={10} style={{ transform: "rotate(45deg)", marginBottom: "2px" }} />}
                  {finalDisplayTitle}
                </span>
              ) : (
                <div style={{ display: "flex", alignItems: "center", flexDirection: "row", gap: "2px", justifyContent: "center" }}>
                  {metadata.isPinned && <Pin size={10} style={{ flexShrink: 0, transform: "rotate(45deg)" }} />}
                  <span>{displayTitle}</span>
                </div>
              )}
            </div>
            {hasLocationRight && (
              <div
                style={{
                  position: "absolute",
                  right: "4px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.6rem",
                  color: "#718096",
                  writingMode: "vertical-rl",
                  textOrientation: "upright",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxHeight: "90%",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <MapPin size={8} style={{ transform: "rotate(0deg)" }} />
                {metadata.location}
              </div>
            )}
          </div>
          {showEndTime && (
            <div style={{ position: "absolute", bottom: "2px", left: 0, width: "100%", textAlign: "center" }}>
              <span style={{ fontSize: "0.5rem", fontWeight: "900", color: "#a0aec0", lineHeight: 1 }}>{endTimeOnly}</span>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <FullCalendar
      key={displayMode + overlapMode}
      ref={calendarRef}
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      slotEventOverlap={overlapMode === "cascade"}
      droppable={true}
      nowIndicator={true}
      allDaySlot={true}
      fixedWeekCount={true}
      height="100%"
      dayMaxEvents={true}
      headerToolbar={false}
      events={displayEvents}
      selectable={true}
      select={(info: any) => {
        if (isSwipingRef.current || isSidebarOpen || isViewSelectorExpanded || blockCalendarClick.current || isDraggingRef.current) return;

        if (!clipboardEvent && wasEventSelectedRef.current) {
          calendarRef.current?.getApi().unselect();
          return;
        }

        if (clipboardEvent) {
          setTitle(clipboardEvent.title);
          setLocation(clipboardEvent.location);
          setCategoryName(clipboardEvent.categoryName);
          setEventColor(clipboardEvent.eventColor);
          setStartH(clipboardEvent.startH);
          setStartM(clipboardEvent.startM);
          setEndH(clipboardEvent.endH);
          setEndM(clipboardEvent.endM);
          setIsAllDayBackground(clipboardEvent.isAllDayBackground);
          setIsMilestone(clipboardEvent.isMilestone);
          setCustomFieldsData(clipboardEvent.customFieldsData);

          setSelectedId(null);
          setMode("create");

          const s = new Date(info.start.getTime());
          const e = info.allDay ? new Date(s.getTime() + 60 * 60 * 1000) : info.end || new Date(s.getTime() + 60 * 60 * 1000);

          setStartDate(toLocalYYYYMMDD(s));
          setEndDate(toLocalYYYYMMDD(e));
          setIsModalOpen(true);
          setClipboardEvent(null);
          calendarRef.current?.getApi().unselect();
          return;
        }

        setMode("create");
        setSelectedId(null);
        setTitle("");
        setLocation("");
        setCategoryName("");
        setEventColor("#3b82f6");
        setCustomFieldsData([]);

        const s = new Date(info.start.getTime());
        let e = info.end ? new Date(info.end.getTime()) : new Date(s.getTime() + 60 * 60 * 1000);

        if (info.allDay || viewType === "dayGridMonth") {
          e.setDate(e.getDate() - 1);
          setStartDate(toLocalYYYYMMDD(s));
          setEndDate(toLocalYYYYMMDD(e));
          setStartH("00");
          setStartM("00");
          setEndH("23");
          setEndM("59");
          setIsAllDayBackground(true);
        } else {
          setStartDate(toLocalYYYYMMDD(s));
          setEndDate(toLocalYYYYMMDD(e));
          setStartH(String(s.getHours()).padStart(2, "0"));
          setStartM("00");
          setEndH(String(e.getHours()).padStart(2, "0"));
          setEndM("00");
          setIsAllDayBackground(false);
        }

        setIsMilestone(false);
        setIsModalOpen(true);
      }}
      eventClick={(info: any) => {
        setTimeout(() => {
          info.el.classList.remove("fc-event-selected");
          document.querySelectorAll(".fc-event-selected").forEach((el) => el.classList.remove("fc-event-selected"));
        }, 10);
        handleEventClick(info);
      }}
      dateClick={(info: any) => {
        if (isSwipingRef.current || isSidebarOpen || isViewSelectorExpanded || isDayPickerOpen || blockCalendarClick.current || isDraggingRef.current) return;

        if (!clipboardEvent && wasEventSelectedRef.current) {
          calendarRef.current?.getApi().unselect();
          return;
        }

        if (clipboardEvent) {
          setTitle(clipboardEvent.title);
          setLocation(clipboardEvent.location);
          setCategoryName(clipboardEvent.categoryName);
          setEventColor(clipboardEvent.eventColor);
          setStartH(clipboardEvent.startH);
          setStartM(clipboardEvent.startM);
          setEndH(clipboardEvent.endH);
          setEndM(clipboardEvent.endM);
          setIsAllDayBackground(clipboardEvent.isAllDayBackground);
          setIsMilestone(clipboardEvent.isMilestone);
          setCustomFieldsData(clipboardEvent.customFieldsData);

          setSelectedId(null);
          setMode("create");

          const s = new Date(info.date.getTime());
          if (info.allDay) {
            const now = new Date();
            s.setHours(now.getHours());
            s.setMinutes(now.getMinutes());
          }

          setStartDate(toLocalYYYYMMDD(s));
          setEndDate(toLocalYYYYMMDD(s));
          setIsModalOpen(true);
          setClipboardEvent(null);
          calendarRef.current?.getApi().unselect();
          return;
        }

        setMode("create");
        setSelectedId(null);
        setTitle("");
        setLocation("");
        setCategoryName("");
        setEventColor("#3b82f6");
        setIsAllDayBackground(false);
        setIsMilestone(false);
        setCustomFieldsData([]);

        const s = new Date(info.date.getTime());
        if (info.allDay) {
          const now = new Date();
          s.setHours(now.getHours());
          s.setMinutes(0);
        }
        const e = new Date(s.getTime() + 60 * 60 * 1000);

        setStartDate(toLocalYYYYMMDD(s));
        setEndDate(toLocalYYYYMMDD(e));
        setStartH(String(s.getHours()).padStart(2, "0"));
        setStartM("00");
        setEndH(String(e.getHours()).padStart(2, "0"));
        setEndM("00");

        setIsModalOpen(true);
      }}
      eventDragStart={() => {
        isDraggingRef.current = true;
        blockCalendarClick.current = true;
      }}
      eventDragStop={(info: any) => {
        setTimeout(() => {
          isDraggingRef.current = false;
          blockCalendarClick.current = false;
        }, 300);
        info.view.calendar.unselect();
      }}
      eventResizeStart={() => {
        isDraggingRef.current = true;
        blockCalendarClick.current = true;
      }}
      eventResizeStop={(info: any) => {
        setTimeout(() => {
          isDraggingRef.current = false;
          blockCalendarClick.current = false;
          isSwipingRef.current = false;
        }, 500);
        info.view.calendar.unselect();
      }}
      selectLongPressDelay={200}
      eventLongPressDelay={200}
      unselectAuto={true}
      unselectCancel=".modal-content"
      unselect={() => {
        blockCalendarClick.current = true;
        setTimeout(() => {
          blockCalendarClick.current = false;
        }, 400);
      }}
      editable={viewType !== "dayGridMonth"}
      eventStartEditable={viewType !== "dayGridMonth"}
      eventDurationEditable={viewType !== "dayGridMonth"}
      eventDrop={async (info) => {
        const { event } = info;
        const dbId = event.id.replace("-travel", "").replace("-transit-out", "").replace("-transit-ret", "");
        const getISO = (d: Date) => d.toISOString();

        if (!event.extendedProps.isTransitEvent && !event.extendedProps.isRoutine && !event.extendedProps.isAnniversary) {
          try {
            const currentLocal = JSON.parse(localStorage.getItem("events") || "[]");
            const updatedLocal = currentLocal.map((ev: any) => (ev.id === dbId ? { ...ev, start_at: getISO(event.start!), end_at: event.end ? getISO(event.end) : getISO(event.start!) } : ev));
            localStorage.setItem("events", JSON.stringify(updatedLocal));

            await supabase
              .from("events")
              .update({
                start_at: getISO(event.start!),
                end_at: event.end ? getISO(event.end) : getISO(event.start!),
              } as any)
              .eq("id", dbId);

            fetchEvents();
          } catch (e) {
            alert("移動に失敗しました");
            info.revert();
          }
        } else {
          info.revert();
        }
      }}
      eventResize={async (info) => {
        const { event } = info;
        const dbId = event.id.replace("-travel", "").replace("-transit-out", "").replace("-transit-ret", "");
        const getISO = (d: Date) => d.toISOString();

        if (!event.extendedProps.isTransitEvent && !event.extendedProps.isRoutine && !event.extendedProps.isAnniversary) {
          try {
            const currentLocal = JSON.parse(localStorage.getItem("events") || "[]");
            const updatedLocal = currentLocal.map((ev: any) => (ev.id === dbId ? { ...ev, start_at: getISO(event.start!), end_at: event.end ? getISO(event.end) : getISO(event.start!) } : ev));
            localStorage.setItem("events", JSON.stringify(updatedLocal));

            await supabase
              .from("events")
              .update({
                start_at: getISO(event.start!),
                end_at: event.end ? getISO(event.end) : getISO(event.start!),
              })
              .eq("id", dbId);

            fetchEvents();
          } catch (e) {
            alert("時間の変更に失敗しました");
            info.revert();
          }
        } else {
          info.revert();
        }
      }}
      locale="ja"
      moreLinkContent={(args: any) => `+他${args.num}件`}
      eventClassNames={() => (displayMode === "dot" && viewType === "dayGridMonth" ? ["is-dot-mode-event"] : [])}
      eventContent={renderEventContent}
      dayHeaderContent={(arg: any) => {
        const d = arg.date;
        const dayStr = DAY_NAMES[d.getDay()];
        const isHoliday = holidays[toLocalYYYYMMDD(d)];
        const isRed = d.getDay() === 0 || isHoliday;

        if (arg.view.type === "dayGridMonth") {
          const colorClass = isRed ? "holiday-text" : d.getDay() === 6 ? "saturday-text" : "";
          return (
            <div style={{ cursor: "pointer", padding: "2px 0", width: "100%", fontSize: "0.75rem" }} className={`hover-bg-glass ${colorClass}`}>
              {dayStr}
            </div>
          );
        }
        const dt = d.getDate();
        const colorClass = isRed ? "holiday-text" : d.getDay() === 6 ? "saturday-text" : "";
        return (
          <div onClick={() => arg.view.type === "timeGridDay" && setIsDayPickerOpen(true)} style={{ cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.1, padding: "2px 0", width: "100%" }} className={`hover-bg-glass ${colorClass}`}>
            <span style={{ fontSize: "0.9rem", fontWeight: 900 }}>{dt}</span>
            <span style={{ fontSize: "0.65rem" }}>{dayStr}</span>
          </div>
        );
      }}
      dayCellContent={(arg: any) => {
        if (arg.view.type === "dayGridMonth") {
          return (
            <div style={{ position: "relative", display: "flex", justifyContent: "center", width: "100%", height: "100%" }}>
              <span className="fc-daygrid-day-number">{arg.date.getDate()}</span>
            </div>
          );
        }
        return "";
      }}
      datesSet={(arg: any) => {
        setViewType(arg.view.type);
        const d = arg.view.currentStart;
        let y = d.getFullYear(),
          m = d.getMonth() + 1,
          day = d.getDate();
        if (arg.view.type === "timeGridWeek") {
          const midWeek = new Date(d);
          midWeek.setDate(midWeek.getDate() + 3);
          y = midWeek.getFullYear();
          m = midWeek.getMonth() + 1;
        }
        setCurrentYear(String(y));
        setCurrentMonthNum(String(m));
        setCurrentDayNum(String(day));
        setIsViewSelectorExpanded(false);
      }}
      dayCellClassNames={(arg: any) => {
        if (arg.date.getDay() === 0 || holidays[toLocalYYYYMMDD(arg.date)]) return ["holiday-cell"];
        if (arg.date.getDay() === 6) return ["saturday-cell"];
        return [];
      }}
      longPressDelay={250}
    />
  );
}
