"use client";

import React from "react";
import { DAY_NAMES } from "@/app/lib/constants";

interface RoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  monthlyRoutines: any[];
  setMonthlyRoutines: (routines: any[]) => void;
  editRoutineIndex: number | null;
  setEditRoutineIndex: (index: number | null) => void;
  newRoutineTitle: string;
  setNewRoutineTitle: (title: string) => void;
  newRoutineDay: string;
  setNewRoutineDay: (day: string) => void;
  newRoutineColor: string;
  setNewRoutineColor: (color: string) => void;
  newRoutineType: string;
  setNewRoutineType: (type: string) => void;
  newRoutineCycle: "monthly" | "weekly" | "daily";
  setNewRoutineCycle: (cycle: "monthly" | "weekly" | "daily") => void;
  newRoutineDayOfWeek: string;
  setNewRoutineDayOfWeek: (dayOfWeek: string) => void;
  handleAddRoutine: () => void;
  renderListItem: (key: string, color: string, text: string, onEdit: any, onDelete: any) => React.ReactNode;
  ColorSelector: React.FC<{ value: string; onChange: (val: string) => void }>;
  ModalHeader: React.FC<{ title: React.ReactNode; onClose: () => void; rightEl?: React.ReactNode }>;
}

export default function RoutineModal({ isOpen, onClose, monthlyRoutines, setMonthlyRoutines, editRoutineIndex, setEditRoutineIndex, newRoutineTitle, setNewRoutineTitle, newRoutineDay, setNewRoutineDay, newRoutineColor, setNewRoutineColor, newRoutineType, setNewRoutineType, newRoutineCycle, setNewRoutineCycle, newRoutineDayOfWeek, setNewRoutineDayOfWeek, handleAddRoutine, renderListItem, ColorSelector, ModalHeader }: RoutineModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "15px" }}>
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", borderRadius: "28px", border: "1px solid var(--glass-border)", padding: "24px", background: "var(--bg-main)", color: "var(--text-main)", display: "flex", flexDirection: "column", height: "80vh" }}>
        <div style={{ flexShrink: 0 }}>
          <ModalHeader title="ルーティン設定" onClose={onClose} />
        </div>
        <div style={{ marginBottom: "20px", flex: 1, overflowY: "auto" }} className="hide-scrollbar">
          {monthlyRoutines.map((r: any, idx: number) => {
            const label = r.cycle === "daily" ? "毎日" : r.cycle === "weekly" ? `毎週 ${DAY_NAMES[r.dayOfWeek]}曜` : `毎月 ${r.day}日`;
            return renderListItem(
              `routine-${idx}`,
              r.color,
              `${label} : ${r.title}`,
              () => {
                setEditRoutineIndex(idx);
                setNewRoutineTitle(r.title);
                setNewRoutineDay(String(r.day || 1));
                setNewRoutineColor(r.color);
                setNewRoutineType(r.type || "task");
                setNewRoutineCycle(r.cycle || "monthly");
                setNewRoutineDayOfWeek(String(r.dayOfWeek || 1));
              },
              () => setMonthlyRoutines(monthlyRoutines.filter((_, i) => i !== idx)),
            );
          })}
        </div>
        <div className="card-box" style={{ flexShrink: 0 }}>
          <label className="form-label">{editRoutineIndex !== null ? "予定を編集" : "新しくルーティンを追加"}</label>

          <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
            <select className="pop-input" value={newRoutineCycle} onChange={(e) => setNewRoutineCycle(e.target.value as any)} style={{ flex: 1 }}>
              <option value="monthly">毎月</option>
              <option value="weekly">毎週</option>
              <option value="daily">毎日</option>
            </select>
            <select className="pop-input" value={newRoutineType} onChange={(e) => setNewRoutineType(e.target.value)} style={{ flex: 1 }}>
              <option value="task">チェック達成</option>
              <option value="income">収入を入力</option>
              <option value="expense">支出を入力</option>
            </select>
          </div>

          <input type="text" className="pop-input" style={{ marginBottom: "10px" }} value={newRoutineTitle} onChange={(e) => setNewRoutineTitle(e.target.value)} placeholder="例：給与振込、ジム、ゴミ出し等" />

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", alignItems: "center" }}>
            {newRoutineCycle === "monthly" && (
              <select className="pop-input" value={newRoutineDay} onChange={(e) => setNewRoutineDay(e.target.value)} style={{ width: "100px", flex: "none" }}>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    {d}日
                  </option>
                ))}
              </select>
            )}
            {newRoutineCycle === "weekly" && (
              <select className="pop-input" value={newRoutineDayOfWeek} onChange={(e) => setNewRoutineDayOfWeek(e.target.value)} style={{ width: "100px", flex: "none" }}>
                {DAY_NAMES.map((d, i) => (
                  <option key={i} value={i}>
                    {d}曜日
                  </option>
                ))}
              </select>
            )}
            <div style={{ flex: 1 }}>
              <ColorSelector value={newRoutineColor} onChange={setNewRoutineColor} />
            </div>
          </div>

          {newRoutineCycle === "monthly" && (
            <select
              className="pop-input"
              value={monthlyRoutines[editRoutineIndex || 0]?.adjust || "none"}
              onChange={(e) => {
                if (editRoutineIndex !== null) {
                  const arr = [...monthlyRoutines];
                  arr[editRoutineIndex].adjust = e.target.value;
                  setMonthlyRoutines(arr);
                }
              }}
              style={{ marginBottom: "16px", fontSize: "0.8rem" }}
            >
              <option value="none">土日・祝日でもそのまま表示</option>
              <option value="prev">土日・祝日なら「前倒し（金曜等）」にする</option>
              <option value="next">土日・祝日なら「後ろ倒し（月曜等）」にする</option>
            </select>
          )}
          <button onClick={handleAddRoutine} className="btn-pop" style={{ width: "100%" }}>
            {editRoutineIndex !== null ? "更新する" : "追加する"}
          </button>
        </div>
      </div>
    </div>
  );
}
