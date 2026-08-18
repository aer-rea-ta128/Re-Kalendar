"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import { DAY_NAMES } from "@/app/lib/constants";
import { toLocalYYYYMMDD, hexToRgba } from "@/app/lib/utils";
import { Train, Plane, Bus, Home, MapPin, Footprints, Bell } from "lucide-react";

interface DayCircleViewProps {
  currentYear: string;
  currentMonthNum: string;
  currentDayNum: string;
  displayEvents: any[];
  holidays: Record<string, string>;
  walkTime: string;
  startPointType: string;
  calendarRef: React.RefObject<FullCalendar | null>;
  blockCalendarClick: React.MutableRefObject<boolean>;
  handleEventClick: (info: any) => void;
}

export default function DayCircleView({ currentYear, currentMonthNum, currentDayNum, displayEvents, holidays, walkTime, startPointType, calendarRef, blockCalendarClick, handleEventClick }: DayCircleViewProps) {
  const targetDayStr = `${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(currentDayNum || "1").padStart(2, "0")}`;
  const targetDateObj = new Date(`${targetDayStr}T00:00:00`);
  const tomorrowObj = new Date(targetDateObj);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const targetTime = targetDateObj.getTime();

  const dayEvents = displayEvents
    .filter((e: any) => {
      if (e.extendedProps?.isMilestone || e.extendedProps?.metadata?.isAllDayBackground || e.allDay) return false;
      const s = new Date(e.start);
      const eTime = e.end ? new Date(e.end) : new Date(s.getTime() + 3600000);
      return eTime > targetDateObj && s < tomorrowObj;
    })
    .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const allDayEvents = displayEvents.filter((e: any) => {
    if (!e.allDay && !e.extendedProps?.metadata?.isAllDayBackground) return false;
    const sDate = new Date(e.start);
    sDate.setHours(0, 0, 0, 0);
    const eDate = e.end ? new Date(e.end) : new Date(sDate.getTime() + 86400000);
    eDate.setHours(0, 0, 0, 0);
    return targetTime >= sDate.getTime() && targetTime < eDate.getTime();
  });

  const centerEvent = allDayEvents.length > 0 ? allDayEvents[0] : null;
  const centerColor = centerEvent ? centerEvent.extendedProps?.cColor || centerEvent.backgroundColor || "var(--theme)" : null;
  const displayAllDayEvents = allDayEvents;

  const dayOfWeek = targetDateObj.getDay();
  const isHoliday = holidays[toLocalYYYYMMDD(targetDateObj)];
  const dayColor = dayOfWeek === 0 || isHoliday ? "#ef4444" : dayOfWeek === 6 ? "#3b82f6" : "var(--text-sub)";

  const handleDayNav = (days: number) => {
    const api = calendarRef.current?.getApi();
    if (api) {
      const d = api.getDate();
      d.setDate(d.getDate() + days);
      api.gotoDate(d);
    }
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "var(--bg-main)", display: "flex", flexDirection: "column", padding: "16px 16px 0 16px", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", marginBottom: "20px", padding: "10px 0" }}>
        <div style={{ position: "relative", width: "280px", height: "280px" }}>
          <svg viewBox="0 0 160 160" style={{ width: "100%", height: "100%", overflow: "visible", filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.06))" }}>
            <circle cx="80" cy="80" r="50" fill="none" stroke="var(--border-color)" strokeWidth="24" opacity="0.4" />
            <circle cx="80" cy="80" r="38" fill={centerColor || "var(--bg-main)"} opacity={centerColor ? "0.15" : "1"} stroke="var(--border-color)" strokeWidth="1" style={{ transition: "all 0.3s" }} />
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i * 15 - 90) * (Math.PI / 180);
              const isMain = i % 3 === 0;
              const r1 = 64;
              const r2 = isMain ? 68 : 66;
              const x1 = (80 + r1 * Math.cos(angle)).toFixed(4);
              const y1 = (80 + r1 * Math.sin(angle)).toFixed(4);
              const x2 = (80 + r2 * Math.cos(angle)).toFixed(4);
              const y2 = (80 + r2 * Math.sin(angle)).toFixed(4);
              return (
                <g key={i}>
                  {isMain ? (
                    <text x={(80 + 74 * Math.cos(angle)).toFixed(4)} y={(80 + 74 * Math.sin(angle)).toFixed(4)} fontSize="6" fontWeight="900" fill="var(--text-sub)" textAnchor="middle" dominantBaseline="central">
                      {i}
                    </text>
                  ) : (
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-sub)" strokeWidth="1.5" opacity="0.4" />
                  )}
                </g>
              );
            })}

            <g transform="rotate(-90 80 80)">
              {dayEvents.map((e: any, idx: number) => {
                if (e.extendedProps.isTransitEvent) return null;
                const metadata = e.extendedProps?.metadata || {};
                const cColor = e.extendedProps?.cColor || "var(--theme)";
                const isTransit = e.extendedProps?.isTransitEvent || false;
                const elements: React.ReactNode[] = [];
                if (metadata.isGathering && metadata.departureTime && metadata.gatheringTime) {
                  const [dh, dm] = metadata.departureTime.split(":").map(Number);
                  const [gh, gm] = metadata.gatheringTime.split(":").map(Number);
                  const wTime = parseInt(metadata.walkTime || walkTime || "0", 10);

                  const leaveMin = dh * 60 + dm - (metadata.departureType === "home" ? 0 : wTime);
                  const gatherMin = gh * 60 + gm;

                  if (!isNaN(leaveMin) && !isNaN(gatherMin) && gatherMin > leaveMin) {
                    const rOut = 62;
                    const rIn = 38;
                    const angS = (leaveMin / 1440) * 2 * Math.PI;
                    const angE = (gatherMin / 1440) * 2 * Math.PI;

                    const COut = 2 * Math.PI * rOut;
                    const CIn = 2 * Math.PI * rIn;

                    elements.push(
                      <g key={`move-frame-${idx}`}>
                        <circle cx="80" cy="80" r={rOut} fill="none" stroke={cColor} strokeWidth="1" strokeDasharray={`${((gatherMin - leaveMin) / 1440) * COut} ${COut}`} strokeDashoffset={-(leaveMin / 1440) * COut} opacity="0.8" />
                        <circle cx="80" cy="80" r={rIn} fill="none" stroke={cColor} strokeWidth="1" strokeDasharray={`${((gatherMin - leaveMin) / 1440) * CIn} ${CIn}`} strokeDashoffset={-(leaveMin / 1440) * CIn} opacity="0.8" />
                        <line x1={80 + rIn * Math.cos(angS)} y1={80 + rIn * Math.sin(angS)} x2={80 + rOut * Math.cos(angS)} y2={80 + rOut * Math.sin(angS)} stroke={cColor} strokeWidth="1" opacity="0.8" />
                        <line x1={80 + rIn * Math.cos(angE)} y1={80 + rIn * Math.sin(angE)} x2={80 + rOut * Math.cos(angE)} y2={80 + rOut * Math.sin(angE)} stroke={cColor} strokeWidth="1" opacity="0.8" />
                      </g>,
                    );
                  }
                }

                const sDate = new Date(e.start);
                const eDate = e.end ? new Date(e.end) : new Date(sDate.getTime() + 3600000);

                let sMin = (sDate.getTime() - targetDateObj.getTime()) / 60000;
                let eMin = (eDate.getTime() - targetDateObj.getTime()) / 60000;

                if (sMin < 0) sMin = 0;
                if (eMin > 1440) eMin = 1440;
                if (eMin < sMin) eMin = sMin;

                const CMain = 2 * Math.PI * 50;
                elements.push(<circle key={`main-${idx}`} cx="80" cy="80" r="50" fill="none" stroke={cColor} strokeWidth={isTransit ? "8" : "24"} strokeDasharray={isTransit ? `4 6` : `${((eMin - sMin) / 1440) * CMain} ${CMain}`} strokeDashoffset={isTransit ? 0 : -(sMin / 1440) * CMain} opacity={isTransit ? "0.6" : "0.95"} />);

                return <g key={idx}>{elements}</g>;
              })}
            </g>
          </svg>

          {/* 中央のナビゲーション */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, width: "100%", height: "100%" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDayNav(-7);
              }}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", color: "var(--text-sub)", marginTop: "-20px", transition: "transform 0.2s" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </button>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", gap: "8px" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDayNav(-1);
                }}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", color: "var(--text-sub)", transition: "transform 0.2s" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: "60px", position: "relative", cursor: "pointer" }} title="タップして日付をジャンプ">
                <input
                  type="date"
                  value={`${currentYear}-${String(currentMonthNum).padStart(2, "0")}-${String(currentDayNum).padStart(2, "0")}`}
                  onChange={(e) => {
                    if (e.target.value) calendarRef.current?.getApi().gotoDate(e.target.value);
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
                <div style={{ fontSize: "3.2rem", fontWeight: "900", color: centerColor || "var(--text-main)", lineHeight: 1, margin: "0", textShadow: "0 2px 4px rgba(0,0,0,0.05)", transition: "color 0.3s" }}>{currentDayNum}</div>
                <div style={{ fontSize: "1.1rem", color: dayColor, fontWeight: "900", marginTop: "2px" }}>{DAY_NAMES[dayOfWeek]}</div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDayNav(1);
                }}
                style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", color: "var(--text-sub)", transition: "transform 0.2s" }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDayNav(7);
              }}
              style={{ background: "transparent", border: "none", cursor: "pointer", padding: "6px", color: "var(--text-sub)", marginBottom: "-20px", transition: "transform 0.2s" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* リスト表示：バッジを統合して1つのカードに */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "20px" }} className="hide-scrollbar" onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
        {displayAllDayEvents.map((e: any) => {
          const cColor = e.extendedProps?.cColor || e.backgroundColor || "var(--theme)";
          return (
            <div
              key={e.id}
              onClick={() => handleEventClick({ event: e })}
              style={{
                background: `linear-gradient(135deg, ${hexToRgba(cColor, 0.25)} 0%, ${hexToRgba(cColor, 0.05)} 100%)`,
                borderTop: `1px solid ${hexToRgba(cColor, 0.6)}`,
                borderLeft: `4px solid ${cColor}`,
                borderBottom: `1px solid rgba(150, 150, 150, 0.1)`,
                borderRight: `1px solid rgba(150, 150, 150, 0.1)`,
                borderRadius: "12px",
                padding: "10px 14px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                cursor: "pointer",
                boxShadow: `0 4px 12px ${hexToRgba(cColor, 0.15)}`,
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
              }}
            >
              <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: "var(--text-main)", textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>{e.title}</div>
              <div style={{ fontSize: "0.75rem", fontWeight: "900", color: cColor, background: hexToRgba(cColor, 0.15), padding: "4px 10px", borderRadius: "8px" }}>終日</div>
            </div>
          );
        })}

        {dayEvents.length === 0 && displayAllDayEvents.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--text-sub)", padding: "40px 20px", fontWeight: "bold", fontSize: "0.95rem" }}>この日の予定はありません</div>
        ) : (
          dayEvents.map((e: any) => {
            if (e.extendedProps?.isTransitEvent) {
              const sObj = new Date(e.start);
              const eObj = new Date(e.end || sObj.getTime() + 3600000);
              const sH = String(sObj.getHours()).padStart(2, "0");
              const sM = String(sObj.getMinutes()).padStart(2, "0");
              const eH = String(eObj.getHours()).padStart(2, "0");
              const eM = String(eObj.getMinutes()).padStart(2, "0");
              const cColor = e.extendedProps?.cColor || "var(--theme)";

              let TransitIcon = Train;
              if (e.extendedProps.transitType === "plane") TransitIcon = Plane;
              else if (e.extendedProps.transitType === "bus") TransitIcon = Bus;
              else if (e.extendedProps.transitType === "home") TransitIcon = Home;

              return (
                <div
                  key={e.id}
                  style={{
                    background: `linear-gradient(135deg, ${hexToRgba(cColor, 0.25)} 0%, ${hexToRgba(cColor, 0.05)} 100%)`,
                    borderTop: `1px solid ${hexToRgba(cColor, 0.6)}`,
                    borderLeft: `4px solid ${cColor}`,
                    borderBottom: `1px solid rgba(150, 150, 150, 0.1)`,
                    borderRight: `1px solid rgba(150, 150, 150, 0.1)`,
                    borderRadius: "16px",
                    padding: "12px 16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    boxShadow: `0 4px 12px ${hexToRgba(cColor, 0.15)}`,
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <TransitIcon size={16} color={cColor} />
                    <div style={{ fontSize: "0.95rem", fontWeight: "900", color: "var(--text-main)", textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>{e.title}</div>
                  </div>
                  <span style={{ flexShrink: 0, fontSize: "0.85rem", fontWeight: "900", color: cColor, background: hexToRgba(cColor, 0.15), padding: "6px 12px", borderRadius: "12px" }}>
                    {sH}:{sM} ~ {eH}:{eM}
                  </span>
                </div>
              );
            }
            const s = new Date(e.start);
            const end = e.end ? new Date(e.end) : new Date(s.getTime() + 3600000);

            const origS = new Date(e.extendedProps.originalStart);
            const sH = String(origS.getHours()).padStart(2, "0");
            const sM = String(origS.getMinutes()).padStart(2, "0");
            const eH = String(end.getHours()).padStart(2, "0");
            const eM = String(end.getMinutes()).padStart(2, "0");

            const cColor = e.extendedProps?.cColor || e.backgroundColor || "var(--theme)";
            const m = e.extendedProps?.metadata || {};
            const loc = m.location;
            const depTime = m.departureTime;
            const isGatheringSet = m.isGathering && depTime;
            const customStart = m.customFields?.customStartLocation;
            const dType = m.departureType || (startPointType === "station" ? "train" : "home");

            let houseLeaveTimeStr = "";
            if (isGatheringSet && depTime.includes(":")) {
              if (startPointType === "station" || dType === "train") {
                const wTime = parseInt(m.walkTime || walkTime || "0", 10);
                if (wTime > 0) {
                  const [h, mVal] = depTime.split(":").map(Number);
                  const dObj = new Date();
                  dObj.setHours(h, mVal, 0);
                  dObj.setMinutes(dObj.getMinutes() - wTime);
                  houseLeaveTimeStr = `${String(dObj.getHours()).padStart(2, "0")}:${String(dObj.getMinutes()).padStart(2, "0")}`;
                }
              }
            }

            return (
              <div
                key={e.id}
                onClick={() => handleEventClick({ event: e })}
                style={{
                  background: `linear-gradient(135deg, ${hexToRgba(cColor, 0.25)} 0%, ${hexToRgba(cColor, 0.05)} 100%)`,
                  borderTop: `1px solid ${hexToRgba(cColor, 0.6)}`,
                  borderLeft: `4px solid ${cColor}`,
                  borderBottom: `1px solid rgba(150, 150, 150, 0.1)`,
                  borderRight: `1px solid rgba(150, 150, 150, 0.1)`,
                  borderRadius: "16px",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  boxShadow: `0 4px 16px ${hexToRgba(cColor, 0.15)}`,
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", overflow: "hidden" }}>
                  <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "var(--text-main)", whiteSpace: "pre-wrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "6px", textShadow: "0 1px 2px rgba(0,0,0,0.1)" }}>
                    {e.title}
                    {e.extendedProps?.metadata?.customFields?.enableNotification !== false && <Bell size={14} style={{ color: cColor, flexShrink: 0 }} />}
                  </div>

                  {(loc || isGatheringSet) && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                      {isGatheringSet && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "#fff", background: cColor, padding: "4px 10px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "4px", boxShadow: `0 2px 6px ${hexToRgba(cColor, 0.3)}` }}>
                            {customStart ? <MapPin size={12} /> : dType === "train" ? <Train size={12} /> : <Home size={12} />}
                            {customStart ? customStart : dType === "train" ? "駅" : "自宅"} {depTime} 出発
                          </span>
                          {houseLeaveTimeStr && (
                            <span style={{ fontSize: "0.7rem", fontWeight: "900", color: cColor, border: `1px solid ${cColor}`, background: "transparent", padding: "3px 8px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                              <Footprints size={12} /> 家を出る: {houseLeaveTimeStr}
                            </span>
                          )}
                        </div>
                      )}
                      {loc && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.8rem", color: "var(--text-sub)", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          <MapPin size={14} style={{ color: cColor, flexShrink: 0 }} /> {loc}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <span style={{ flexShrink: 0, fontSize: "0.85rem", fontWeight: "900", color: cColor, background: hexToRgba(cColor, 0.1), padding: "6px 12px", borderRadius: "12px" }}>
                  {sH}:{sM} ~ {eH}:{eM}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
