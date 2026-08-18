"use client";

import React from "react";

interface FinanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: any[];
  currentYear: string;
  currentMonthNum: string;
  graphSpan: "month" | "week";
  setGraphSpan: (span: "month" | "week") => void;
  ModalHeader: React.FC<{ title: React.ReactNode; onClose: () => void; rightEl?: React.ReactNode }>;
}

export default function FinanceModal({ isOpen, onClose, events, currentYear, currentMonthNum, graphSpan, setGraphSpan, ModalHeader }: FinanceModalProps) {
  if (!isOpen) return null;

  const currentY = parseInt(currentYear || String(new Date().getFullYear()));
  const currentM = parseInt(currentMonthNum || String(new Date().getMonth() + 1));

  let graphData: any[] = [];
  if (graphSpan === "month") {
    graphData = Array.from({ length: 12 }, (_, i) => {
      const mStr = `${currentY}-${String(i + 1).padStart(2, "0")}`;
      const targetEvts = events.filter((e: any) => e.start && e.start.startsWith(mStr));
      let inc = 0;
      let exp = 0;
      targetEvts.forEach((e: any) => {
        const cf = e.extendedProps?.metadata?.customFields || {};
        if (cf.isExpenseSet) exp += Number(cf.standardExpenseAmount || 0);
        if (cf.isIncomeSet) inc += Number(cf.standardIncomeAmount || 0);
        Object.values(cf).forEach((val: any) => {
          if (val && typeof val === "object" && val.calculatedWage) {
            inc += Number(val.calculatedWage);
          }
        });
      });
      return { label: `${i + 1}月`, inc, exp };
    });
  } else {
    graphData = Array.from({ length: 5 }, (_, i) => {
      let inc = 0;
      let exp = 0;
      const targetEvts = events.filter((e: any) => e.start && e.start.startsWith(`${currentY}-${String(currentM).padStart(2, "0")}`));
      targetEvts.forEach((e: any) => {
        const dateDay = new Date(e.start).getDate();
        const weekNum = Math.ceil(dateDay / 7);
        if (weekNum === i + 1 || (i === 4 && weekNum > 5)) {
          const cf = e.extendedProps?.metadata?.customFields || {};
          if (cf.isExpenseSet) exp += Number(cf.standardExpenseAmount || 0);
          if (cf.isIncomeSet) inc += Number(cf.standardIncomeAmount || 0);
        }
      });
      return { label: `第${i + 1}週`, inc, exp };
    });
  }

  const maxAmount = Math.max(...graphData.map((d) => Math.max(d.inc, d.exp)), 1000);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "15px" }}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", borderRadius: "28px", border: "1px solid var(--glass-border)", padding: "24px", background: "var(--bg-main)", color: "var(--text-main)" }}>
        <ModalHeader title="収支推移グラフ" onClose={onClose} />

        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          <button onClick={() => setGraphSpan("month")} className={graphSpan === "month" ? "btn-pop" : "btn-secondary"} style={{ flex: 1, padding: "10px", fontSize: "0.85rem", borderRadius: "12px" }}>
            月間推移 ({currentY}年)
          </button>
          <button onClick={() => setGraphSpan("week")} className={graphSpan === "week" ? "btn-pop" : "btn-secondary"} style={{ flex: 1, padding: "10px", fontSize: "0.85rem", borderRadius: "12px" }}>
            週間推移 ({currentM}月)
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "16px", fontSize: "0.8rem", fontWeight: "bold" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10b981" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#10b981" }} /> 収入
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ef4444" }}>
            <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#ef4444" }} /> 支出
          </span>
        </div>

        <div className="hide-scrollbar" style={{ height: "220px", display: "flex", alignItems: "flex-end", gap: "12px", overflowX: "auto", paddingBottom: "8px", borderBottom: "2px solid var(--border-color)" }}>
          {graphData.map((d, idx) => (
            <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end", minWidth: "40px" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "100%" }}>
                <div style={{ position: "relative", width: "14px", height: `${(d.inc / maxAmount) * 100}%`, background: "#10b981", borderRadius: "4px 4px 0 0", minHeight: d.inc > 0 ? "4px" : "0", transition: "all 0.4s" }}>{d.inc > 0 && <span style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "0.55rem", color: "#10b981", fontWeight: "bold" }}>{d.inc >= 10000 ? `${Math.floor(d.inc / 1000)}k` : d.inc}</span>}</div>
                <div style={{ position: "relative", width: "14px", height: `${(d.exp / maxAmount) * 100}%`, background: "#ef4444", borderRadius: "4px 4px 0 0", minHeight: d.exp > 0 ? "4px" : "0", transition: "all 0.4s" }}>{d.exp > 0 && <span style={{ position: "absolute", top: "-18px", left: "50%", transform: "translateX(-50%)", fontSize: "0.55rem", color: "#ef4444", fontWeight: "bold" }}>{d.exp >= 10000 ? `${Math.floor(d.exp / 1000)}k` : d.exp}</span>}</div>
              </div>
              <span style={{ fontSize: "0.7rem", fontWeight: "bold", color: "var(--text-sub)" }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
