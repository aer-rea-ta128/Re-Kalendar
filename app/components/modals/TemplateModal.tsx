"use client";

import React from "react";
import { Trash2, Edit3, Sparkles, CheckCircle } from "lucide-react";
import { saveData } from "@/app/lib/storage";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  quickTemplates: any[];
  setQuickTemplates: (templates: any[]) => void;
  editTemplateIndex: number | null;
  setEditTemplateIndex: (index: number | null) => void;
  templateForm: any;
  setTemplateForm: (form: any) => void;
  categories: any[];
  activeUserId: string | null;
  endM: string;
  ModalHeader: React.FC<{ title: React.ReactNode; onClose: () => void; rightEl?: React.ReactNode }>;
}

export default function TemplateModal({ isOpen, onClose, quickTemplates, setQuickTemplates, editTemplateIndex, setEditTemplateIndex, templateForm, setTemplateForm, categories, activeUserId, endM, ModalHeader }: TemplateModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        onClose();
        setEditTemplateIndex(null);
      }}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "15px" }}
    >
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", borderRadius: "28px", border: "1px solid var(--glass-border)", padding: "24px", background: "var(--bg-main)", color: "var(--text-main)", height: "70vh", display: "flex", flexDirection: "column" }}>
        <div style={{ flexShrink: 0 }}>
          <ModalHeader
            title="よくある予定の管理"
            onClose={() => {
              onClose();
              setEditTemplateIndex(null);
            }}
          />
        </div>
        <button
          onClick={() => {
            setEditTemplateIndex(-1); // -1 を新規作成の目印にする
            setTemplateForm({ title: "", categoryName: categories[0]?.name || "", startH: "09", startM: "00", endH: "10", endM: "00", isAllDayBackground: false });
          }}
          className="btn-pop"
          style={{ padding: "12px", fontSize: "0.85rem", borderRadius: "12px", marginBottom: "16px", flexShrink: 0 }}
        >
          ＋ 予定を新しく追加
        </button>

        <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "4px", marginBottom: "16px" }}>
          {quickTemplates.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--text-sub)", fontSize: "0.85rem", padding: "20px" }}>登録されている予定はありません</div>
          ) : (
            quickTemplates.map((t, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--card-bg)", padding: "12px", borderRadius: "12px", borderLeft: `6px solid ${t.eventColor || "var(--theme)"}`, borderTop: "1px solid var(--border-color)", borderRight: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
                <div>
                  <div style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--text-main)" }}>{t.title}</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-sub)" }}>
                    {t.categoryName} {t.isAllDayBackground ? "/ 終日" : `/ ${t.startH}:${t.startM}〜${t.endH}:${endM}`}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    onClick={() => {
                      setEditTemplateIndex(i);
                      setTemplateForm({ ...t });
                    }}
                    className="btn-secondary"
                    style={{ padding: "6px 10px", fontSize: "0.75rem", borderRadius: "8px" }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => {
                      const updated = quickTemplates.filter((_, idx) => idx !== i);
                      setQuickTemplates(updated);
                      saveData("os_quickTemplates", activeUserId, updated);
                    }}
                    style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "8px" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {editTemplateIndex !== null && (
          <div style={{ background: "var(--input-bg)", padding: "16px", borderRadius: "16px", border: "1px dashed var(--theme)", flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--theme)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Edit3 size={14} /> テンプレートを編集
              </span>
              <button onClick={() => setEditTemplateIndex(null)} style={{ background: "transparent", border: "none", color: "var(--text-sub)", fontSize: "0.75rem", cursor: "pointer" }}>
                キャンセル
              </button>
            </div>

            <input type="text" className="pop-input" value={templateForm.title || ""} onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })} placeholder="タイトル" style={{ marginBottom: "8px", fontSize: "0.85rem" }} />

            <select
              className="pop-input"
              value={templateForm.categoryName || ""}
              onChange={(e) => {
                const catObj = categories.find((c: any) => c.name === e.target.value);
                setTemplateForm({ ...templateForm, categoryName: e.target.value, eventColor: catObj?.color || "" });
              }}
              style={{ marginBottom: "8px", fontSize: "0.85rem" }}
            >
              {categories.map((c: any) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>

            <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
              <input type="time" className="pop-input" value={`${templateForm.startH || "09"}:${templateForm.startM || "00"}`} onChange={(e) => setTemplateForm({ ...templateForm, startH: e.target.value.split(":")[0], startM: e.target.value.split(":")[1] })} style={{ flex: 1, padding: "0 8px" }} disabled={templateForm.isAllDayBackground} />
              <span style={{ fontWeight: "bold", color: "var(--text-sub)" }}>〜</span>
              <input type="time" className="pop-input" value={`${templateForm.endH || "10"}:${templateForm.endM || "00"}`} onChange={(e) => setTemplateForm({ ...templateForm, endH: e.target.value.split(":")[0], endM: e.target.value.split(":")[1] })} style={{ flex: 1, padding: "0 8px" }} disabled={templateForm.isAllDayBackground} />
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", fontSize: "0.8rem", fontWeight: "bold", cursor: "pointer" }}>
              <input type="checkbox" checked={templateForm.isAllDayBackground || false} onChange={(e) => setTemplateForm({ ...templateForm, isAllDayBackground: e.target.checked })} /> 1日単位（終日）にする
            </label>

            <button
              onClick={() => {
                if (!templateForm.title) return alert("タイトルを入力してください");
                let updated = [...quickTemplates];
                if (editTemplateIndex === -1) {
                  updated.push(templateForm);
                } else if (editTemplateIndex !== null) {
                  updated[editTemplateIndex] = templateForm;
                }
                setQuickTemplates(updated);
                saveData("os_quickTemplates", activeUserId, updated);
                setEditTemplateIndex(null);
              }}
              className="btn-pop"
              style={{ width: "100%", padding: "12px", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              {editTemplateIndex === -1 ? (
                <>
                  <Sparkles size={16} />
                  <span>追加する</span>
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  <span>更新する</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
