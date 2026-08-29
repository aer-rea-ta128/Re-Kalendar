"use client";

import React, { useMemo } from "react";
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
  const targetDateObj = useMemo(() => new Date(`${targetDayStr}T00:00:00`), [targetDayStr]);
  const tomorrowObj = useMemo(() => {
    const t = new Date(targetDateObj);
    t.setDate(t.getDate() + 1);
    return t;
  }, [targetDateObj]);
  const targetTime = targetDateObj.getTime();

  const now = new Date();
  const currentMinRaw = now.getHours() * 60 + now.getMinutes();

  // 🌟 useMemo化: 対象日付の通常イベント抽出・ソートをメモ化
  const dayEvents = useMemo(() => {
    return displayEvents
      .filter((e: any) => {
        if (e.extendedProps?.isMilestone || e.extendedProps?.metadata?.isAllDayBackground || e.allDay || e.extendedProps?.metadata?.isPureFinance || String(e.id).startsWith("sub-")) return false;
        const s = new Date(e.start);
        const eTime = e.end ? new Date(e.end) : new Date(s.getTime() + 3600000);
        return eTime > targetDateObj && s < tomorrowObj;
      })
      .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [displayEvents, targetDateObj, tomorrowObj]);

  // 🌟 useMemo化: 終日イベントの抽出をメモ化
  const allDayEvents = useMemo(() => {
    return displayEvents.filter((e: any) => {
      if (!e.allDay && !e.extendedProps?.metadata?.isAllDayBackground) return false;
      const sDate = new Date(e.start);
      sDate.setHours(0, 0, 0, 0);
      const eDate = e.end ? new Date(e.end) : new Date(sDate.getTime() + 86400000);
      eDate.setHours(0, 0, 0, 0);
      return targetTime >= sDate.getTime() && targetTime < eDate.getTime();
    });
  }, [displayEvents, targetTime]);

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

  // 🌟 追加: 指定した時間範囲だけの「円弧のパス」を計算する関数
  const createArcPath = (cx: number, cy: number, r: number, startMin: number, endMin: number) => {
    if (endMin <= startMin) return "";
    const startAngle = (startMin / 1440) * 2 * Math.PI;
    const endAngle = (endMin / 1440) * 2 * Math.PI;
    const start = { x: cx + r * Math.cos(startAngle), y: cy + r * Math.sin(startAngle) };
    const end = { x: cx + r * Math.cos(endAngle), y: cy + r * Math.sin(endAngle) };
    const largeArcFlag = endMin - startMin > 720 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 50, background: "var(--bg-main)", display: "flex", flexDirection: "column", padding: "16px 16px 0 16px", overflow: "hidden" }}>
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", marginBottom: "20px", padding: "10px 0" }}>
        {/* 🌟 GPUアクセラレーション適用: transform/will-change で再描画・ブラー合成を高速化 */}
        <div style={{ position: "relative", width: "300px", height: "300px", background: "linear-gradient(145deg, var(--glass-bg) 0%, transparent 100%)", borderRadius: "50%", boxShadow: "0 20px 50px rgba(0,0,0,0.1), inset 0 2px 6px rgba(255,255,255,0.4)", border: "1px solid var(--glass-border)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", display: "flex", alignItems: "center", justifyContent: "center", transform: "translateZ(0)", willChange: "transform" }}>
          <svg viewBox="0 0 160 160" style={{ width: "95%", height: "95%", overflow: "visible", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.08))", transform: "translateZ(0)" }}>
            {/* 🌟 ベースのレールを細く洗練されたものに変更（r=54, strokeWidth=16） */}
            <circle cx="80" cy="80" r="54" fill="none" stroke="var(--border-color)" strokeWidth="16" opacity="0.2" />
            <circle cx="80" cy="80" r="62" fill="none" stroke="var(--border-color)" strokeWidth="0.5" opacity="0.4" />
            <circle cx="80" cy="80" r="46" fill="none" stroke="var(--border-color)" strokeWidth="0.5" opacity="0.4" />

            <circle cx="80" cy="80" r="38" fill={centerColor || "var(--bg-main)"} opacity={centerColor ? "0.15" : "0.5"} stroke="var(--border-color)" strokeWidth="0.5" style={{ transition: "all 0.3s" }} />

            {/* 🌟 静的な24時間メモリ（毎回の三角関数再計算を排除） */}
            {useMemo(() => {
              return Array.from({ length: 24 }).map((_, i) => {
                const angle = (i * 15 - 90) * (Math.PI / 180);
                const isMain = i % 6 === 0;
                const isSub = i % 3 === 0;
                const r1 = 64;
                const r2 = isMain ? 68 : isSub ? 66.5 : 65.5;
                const cosA = Math.cos(angle);
                const sinA = Math.sin(angle);
                const x1 = (80 + r1 * cosA).toFixed(4);
                const y1 = (80 + r1 * sinA).toFixed(4);
                const x2 = (80 + r2 * cosA).toFixed(4);
                const y2 = (80 + r2 * sinA).toFixed(4);
                return (
                  <g key={i}>
                    {isMain ? (
                      <text x={(80 + 74 * cosA).toFixed(4)} y={(80 + 74 * sinA).toFixed(4)} fontSize="6.5" fontWeight="900" fill="var(--text-main)" opacity="0.8" textAnchor="middle" dominantBaseline="central" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                        {i}
                      </text>
                    ) : isSub ? (
                      <text x={(80 + 72 * cosA).toFixed(4)} y={(80 + 72 * sinA).toFixed(4)} fontSize="4.5" fontWeight="900" fill="var(--text-sub)" opacity="0.6" textAnchor="middle" dominantBaseline="central">
                        {i}
                      </text>
                    ) : (
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-sub)" strokeWidth="1.2" opacity="0.4" strokeLinecap="round" />
                    )}
                  </g>
                );
              });
            }, [])}

            <g transform="rotate(-90 80 80)">
              {dayEvents.map((e: any, idx: number) => {
                const metadata = e.extendedProps?.metadata || {};
                const cColor = e.extendedProps?.cColor || "var(--theme)";
                const elements: React.ReactNode[] = [];

                const s = e.extendedProps?.originalStart ? new Date(e.extendedProps.originalStart) : new Date(e.start);
                const end = e.end ? new Date(e.end) : new Date(s.getTime() + 3600000);

                let sMin = (s.getTime() - targetDateObj.getTime()) / 60000;
                let eMin = (end.getTime() - targetDateObj.getTime()) / 60000;

                if (sMin < 0) sMin = 0;
                if (eMin > 1440) eMin = 1440;
                if (eMin < sMin) eMin = sMin;

                // ① メインイベントの円弧をガラス風の多層レイヤーで描画
                const CMain = 2 * Math.PI * 54;
                const dashArray = `${((eMin - sMin) / 1440) * CMain} ${CMain}`;
                const dashOffset = -(sMin / 1440) * CMain;

                // レイヤー1: 外側のぼんやりした発光（Glow）
                elements.push(<circle key={`main-glow-${idx}`} cx="80" cy="80" r="54" fill="none" stroke={cColor} strokeWidth="16" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="butt" opacity="0.3" style={{ filter: "blur(4px)" }} />);

                // レイヤー2: 半透明のメインカラー（ガラス本体）
                elements.push(<circle key={`main-base-${idx}`} cx="80" cy="80" r="54" fill="none" stroke={cColor} strokeWidth="16" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="butt" opacity="0.45" />);

                // レイヤー3: 白いハイライト（ガラスの表面の反射・ツヤ感）
                elements.push(<circle key={`main-shine-${idx}`} cx="80" cy="80" r="54" fill="none" stroke="#ffffff" strokeWidth="16" strokeDasharray={dashArray} strokeDashoffset={dashOffset} strokeLinecap="butt" opacity="0.15" />);

                // レイヤー4: 両端の極細ライン（輪郭をくっきりさせて立体感を強調）
                const rInner = 46;
                const rOuter = 62;
                const CInner = 2 * Math.PI * rInner;
                const COuter = 2 * Math.PI * rOuter;
                elements.push(<circle key={`main-edge-in-${idx}`} cx="80" cy="80" r={rInner} fill="none" stroke={cColor} strokeWidth="0.75" strokeDasharray={`${((eMin - sMin) / 1440) * CInner} ${CInner}`} strokeDashoffset={-(sMin / 1440) * CInner} opacity="0.8" />);
                elements.push(<circle key={`main-edge-out-${idx}`} cx="80" cy="80" r={rOuter} fill="none" stroke={cColor} strokeWidth="0.75" strokeDasharray={`${((eMin - sMin) / 1440) * COuter} ${COuter}`} strokeDashoffset={-(sMin / 1440) * COuter} opacity="0.8" />);

                // ② 交通機関のインジケーター（インナーバー）
                const cf = metadata.customFields || e.extendedProps?.customFields || {};
                const isTransitActive = cf.isTransit || metadata.isTransit;
                if (isTransitActive) {
                  const drawTransit = (depTime: string, arrTime: string, type: string, keySuffix: string) => {
                    if (!depTime || !arrTime) return;
                    const [dH, dM] = depTime.split(":").map(Number);
                    const [aH, aM] = arrTime.split(":").map(Number);
                    let depMin = dH * 60 + dM;
                    let arrMin = aH * 60 + aM;

                    if (arrMin < depMin) arrMin += 1440;

                    if (depMin > 1440 || arrMin < 0) return;
                    const clampedDep = Math.max(0, Math.min(1440, depMin));
                    const clampedArr = Math.max(0, Math.min(1440, arrMin));

                    if (clampedArr > clampedDep) {
                      const innerR = 42;
                      elements.push(<path key={`transit-line-${idx}-${keySuffix}`} d={createArcPath(80, 80, innerR, clampedDep, clampedArr)} fill="none" stroke={cColor} strokeWidth="2.5" strokeDasharray="3 4" strokeLinecap="round" opacity="0.8" />);

                      const TIcon = type === "plane" ? Plane : type === "bus" ? Bus : Train;

                      const startAngle = (clampedDep / 1440) * 2 * Math.PI;
                      elements.push(
                        <g key={`transit-static-icon-${idx}-${keySuffix}`} transform={`translate(${80 + innerR * Math.cos(startAngle)}, ${80 + innerR * Math.sin(startAngle)}) rotate(90)`}>
                          <circle cx="0" cy="0" r="6" fill="var(--card-bg)" stroke={cColor} strokeWidth="1" style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.15))" }} />
                          <g transform="translate(-4, -4)" style={{ color: cColor }}>
                            <TIcon size={8} strokeWidth={2.5} />
                          </g>
                        </g>,
                      );

                      const isToday = now.toDateString() === targetDateObj.toDateString();
                      let currentMin = currentMinRaw;
                      if (arrMin > 1440 && currentMinRaw < depMin) currentMin += 1440;

                      if (isToday && currentMin >= depMin && currentMin <= arrMin) {
                        const currentAngle = (currentMin / 1440) * 2 * Math.PI;
                        elements.push(
                          <g key={`transit-icon-${idx}-${keySuffix}`} transform={`translate(${80 + innerR * Math.cos(currentAngle)}, ${80 + innerR * Math.sin(currentAngle)}) rotate(90)`}>
                            <circle cx="0" cy="0" r="9" fill={cColor} style={{ filter: `drop-shadow(0 2px 6px ${hexToRgba(cColor, 0.5)})` }} />
                            <g transform="translate(-5.5, -5.5)" style={{ color: "#fff" }}>
                              <TIcon size={11} strokeWidth={2.5} />
                            </g>
                          </g>,
                        );
                      }
                    }
                  };

                  const outDep = cf.transitDepTime || metadata.transitDepTime;
                  const outArr = cf.transitArrTime || metadata.transitArrTime;
                  const outType = cf.transitType || metadata.transitType || "train";
                  if (outDep && outArr) {
                    drawTransit(outDep, outArr, outType, "out");
                  }

                  const hasRet = cf.hasReturnTransit || metadata.hasReturnTransit;
                  const retDep = cf.returnTransitDepTime || metadata.returnTransitDepTime;
                  const retArr = cf.returnTransitArrTime || metadata.returnTransitArrTime;
                  const retType = cf.returnTransitType || metadata.returnTransitType || "train";
                  if (hasRet && retDep && retArr) {
                    drawTransit(retDep, retArr, retType, "ret");
                  }
                }

                return <g key={idx}>{elements}</g>;
              })}

              {/* 🌟 修正: 現在時刻のドットを近未来的な発光LED（ガラスオーブ）風に変更 */}
              {now.toDateString() === targetDateObj.toDateString() &&
                (() => {
                  const cx = 80 + 54 * Math.cos((currentMinRaw / 1440) * 2 * Math.PI);
                  const cy = 80 + 54 * Math.sin((currentMinRaw / 1440) * 2 * Math.PI);
                  return (
                    <g key="current-time-indicator">
                      {/* ぼんやりした外側の発光 */}
                      <circle cx={cx} cy={cy} r="7" fill="#ef4444" opacity="0.3" style={{ filter: "blur(2px)" }} />
                      {/* メインの赤いドット */}
                      <circle cx={cx} cy={cy} r="3" fill="#ef4444" style={{ filter: "drop-shadow(0 2px 4px rgba(239, 68, 68, 0.6))" }} />
                      {/* 中心部の白いハイライト（ガラスの反射・LEDの芯） */}
                      <circle cx={cx} cy={cy} r="1.5" fill="#ffffff" opacity="0.95" />
                    </g>
                  );
                })()}
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
            const s = e.extendedProps?.originalStart ? new Date(e.extendedProps.originalStart) : new Date(e.start);
            const end = e.end ? new Date(e.end) : new Date(s.getTime() + 3600000);

            const sH = String(s.getHours()).padStart(2, "0");
            const sM = String(s.getMinutes()).padStart(2, "0");
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
                  flexDirection: "column",
                  gap: "8px",
                  boxShadow: `0 4px 16px ${hexToRgba(cColor, 0.15)}`,
                  cursor: "pointer",
                  backdropFilter: "blur(6px)",
                  WebkitBackdropFilter: "blur(6px)",
                }}
              >
                {/* 上段：タイトルと予定時間（元のデザインを維持して横並び配置） */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", width: "100%" }}>
                  <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "var(--text-main)", whiteSpace: "pre-wrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "6px", textShadow: "0 1px 2px rgba(0,0,0,0.1)", minWidth: 0 }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
                    {e.extendedProps?.metadata?.customFields?.enableNotification !== false && <Bell size={14} style={{ color: cColor, flexShrink: 0 }} />}
                  </div>

                  <span style={{ flexShrink: 0, fontSize: "0.85rem", fontWeight: "900", color: cColor, background: hexToRgba(cColor, 0.1), padding: "6px 12px", borderRadius: "12px" }}>
                    {sH}:{sM} ~ {eH}:{eM}
                  </span>
                </div>

                {/* 中段：集合・出発場所情報 */}
                {(loc || isGatheringSet) && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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

                {/* 下段：交通機関バッジ（カード全体の幅を使用して枠が完全に文字を包み込む） */}
                {(() => {
                  const ext = e.extendedProps || {};
                  const meta = ext.metadata || {};
                  const cf = meta.customFields || ext.customFields || {};

                  const isTransitActive = cf.isTransit || meta.isTransit || ext.isTransit;
                  if (!isTransitActive) return null;

                  const outDep = cf.transitDepTime || meta.transitDepTime || ext.transitDepTime || cf.depTime || meta.depTime;
                  const outArr = cf.transitArrTime || meta.transitArrTime || ext.transitArrTime || cf.arrTime || meta.arrTime;
                  const outType = cf.transitType || meta.transitType || ext.transitType || "train";

                  const retDep = cf.returnTransitDepTime || meta.returnTransitDepTime || ext.returnTransitDepTime || cf.returnDepTime || meta.returnDepTime || ext.returnDepTime || cf.retDepTime || meta.retDepTime;
                  const retArr = cf.returnTransitArrTime || meta.returnTransitArrTime || ext.returnTransitArrTime || cf.returnArrTime || meta.returnArrTime || ext.returnArrTime || cf.retArrTime || meta.retArrTime;
                  const retType = cf.returnTransitType || meta.returnTransitType || ext.returnTransitType || cf.returnType || meta.returnType || "train";

                  if (!outDep && !retDep) return null;

                  return (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "6px 12px",
                        background: "var(--card-bg)",
                        borderRadius: "8px",
                        border: `1px solid var(--border-color)`,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
                        width: "fit-content",
                        maxWidth: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      {outDep && outArr && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--text-main)", fontWeight: "800", whiteSpace: "nowrap" }}>
                          <span style={{ color: cColor, display: "flex", alignItems: "center" }}>{outType === "plane" ? <Plane size={12} /> : outType === "bus" ? <Bus size={12} /> : <Train size={12} />}</span>
                          <span>
                            行き {outDep}-{outArr}
                          </span>
                        </div>
                      )}
                      {outDep && outArr && retDep && retArr && <span style={{ width: "1px", height: "10px", background: "var(--border-color)" }} />}
                      {retDep && retArr && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--text-main)", fontWeight: "800", whiteSpace: "nowrap" }}>
                          <span style={{ color: cColor, display: "flex", alignItems: "center" }}>{retType === "plane" ? <Plane size={12} /> : retType === "bus" ? <Bus size={12} /> : <Train size={12} />}</span>
                          <span>
                            帰り {retDep}-{retArr}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
