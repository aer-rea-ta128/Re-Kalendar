"use client";

import React from "react";
import { Clock } from "lucide-react";

interface DailyStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  storyDate: string | null;
  events: any[];
  themeColor: string;
}

export default function DailyStoryModal({ isOpen, onClose, storyDate, events, themeColor }: DailyStoryModalProps) {
  if (!isOpen || !storyDate) return null;

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
    <div className="modal-overlay" onClick={onClose} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "#000", zIndex: 9999, display: "flex", flexDirection: "column", color: "#fff" }}>
      <div style={{ display: "flex", gap: "4px", padding: "16px 8px 8px 8px", marginTop: "env(safe-area-inset-top)" }}>
        <div style={{ flex: 1, height: "3px", background: "rgba(255,255,255,0.3)", borderRadius: "2px", overflow: "hidden" }}>
          <div style={{ width: "100%", height: "100%", background: "#fff", borderRadius: "2px", animation: "progress 5s linear forwards" }} />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px" }}>
        <div style={{ fontWeight: "bold", fontSize: "1.2rem" }}>{storyDate.replace(/-/g, "/")}</div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff", fontSize: "1.5rem", cursor: "pointer" }}>
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
}
