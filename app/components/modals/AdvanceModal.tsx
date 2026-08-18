"use client";

import React from "react";
import { Handshake, Trash2, CheckCircle } from "lucide-react";
import { toLocalYYYYMMDD } from "@/app/lib/utils";
import { supabase } from "@/app/lib/supabase";

interface AdvanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: any[];
  themeColor: string;
  activeUserId: string | null;
  advanceTab: "unsettled" | "settled" | "partners";
  setAdvanceTab: (tab: "unsettled" | "settled" | "partners") => void;
  viewingPartner: string | null;
  setViewingPartner: (partner: string | null) => void;
  customPayees: string[];
  setCustomPayees: (payees: string[]) => void;
  newPayeeName: string;
  setNewPayeeName: (name: string) => void;
  fetchEvents: () => Promise<void>;
  ModalHeader: React.FC<{ title: React.ReactNode; onClose: () => void; rightEl?: React.ReactNode }>;
}

export default function AdvanceModal({ isOpen, onClose, events, themeColor, activeUserId, advanceTab, setAdvanceTab, viewingPartner, setViewingPartner, customPayees, setCustomPayees, newPayeeName, setNewPayeeName, fetchEvents, ModalHeader }: AdvanceModalProps) {
  if (!isOpen) return null;

  const unsettledAdvances = events
    .flatMap((e) => {
      const exps = e.extendedProps?.metadata?.customFields?.expenses || [];
      return exps.map((exp: any) => ({ ...exp, eventId: e.id, eventTitle: e.title, eventDate: e.start.split("T")[0] }));
    })
    .filter((e) => (e.type === "advance" || e.type === "borrow") && !e.isSettled);

  const settledAdvances = events
    .flatMap((e) => {
      const exps = e.extendedProps?.metadata?.customFields?.expenses || [];
      return exps.map((exp: any) => ({ ...exp, eventId: e.id, eventTitle: e.title, eventDate: e.start.split("T")[0] }));
    })
    .filter((e) => (e.type === "advance" || e.type === "borrow") && e.isSettled);

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        onClose();
        setViewingPartner(null);
      }}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "15px" }}
    >
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", borderRadius: "28px", border: "1px solid var(--glass-border)", padding: "24px", background: "var(--bg-main)", color: "var(--text-main)", height: "70vh", display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
        <div style={{ flexShrink: 0 }}>
          <ModalHeader
            title="立替・貸し借り管理"
            onClose={() => {
              onClose();
              setViewingPartner(null);
            }}
          />
        </div>

        {viewingPartner ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
              <button onClick={() => setViewingPartner(null)} className="btn-secondary" style={{ padding: "6px 12px", fontSize: "0.8rem", borderRadius: "8px" }}>
                ← 戻る
              </button>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--theme)" }}>{viewingPartner} さんとの履歴</h3>
            </div>
            {(() => {
              const partnerHistory = events
                .flatMap((e) => {
                  const exps = e.extendedProps?.metadata?.customFields?.expenses || [];
                  return exps.map((exp: any) => ({ ...exp, eventId: e.id, eventTitle: e.title, eventDate: e.start.split("T")[0] }));
                })
                .filter((e) => (e.type === "advance" || e.type === "borrow") && e.payee === viewingPartner)
                .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());

              const lentTotal = partnerHistory.filter((e) => e.type === "advance" && !e.isSettled).reduce((sum, e) => sum + Number(e.amount), 0);
              const borrowedTotal = partnerHistory.filter((e) => e.type === "borrow" && !e.isSettled).reduce((sum, e) => sum + Number(e.amount), 0);
              const diff = lentTotal - borrowedTotal;

              return (
                <>
                  <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                    <div style={{ flex: 1, background: "var(--card-bg)", border: "1px solid #ef4444", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-sub)", fontWeight: "bold" }}>未精算の貸し</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#ef4444" }}>¥{lentTotal.toLocaleString()}</div>
                    </div>
                    <div style={{ flex: 1, background: "var(--card-bg)", border: "1px solid #10b981", borderRadius: "12px", padding: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-sub)", fontWeight: "bold" }}>未精算の借り</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#10b981" }}>¥{borrowedTotal.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "center", fontSize: "0.9rem", fontWeight: "bold", margin: "4px 0 8px 0", color: "var(--text-main)", flexShrink: 0 }}>{diff > 0 ? `👉 あなたが ¥${diff.toLocaleString()} 受け取ります` : diff < 0 ? `👈 あなたが ¥${Math.abs(diff).toLocaleString()} 支払います` : "🎉 精算完了しています"}</div>
                  <div className="hide-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
                    {partnerHistory.length === 0 ? (
                      <div style={{ textAlign: "center", fontSize: "0.8rem", color: "var(--text-sub)", marginTop: "20px" }}>履歴がありません</div>
                    ) : (
                      partnerHistory.map((adv: any, i: number) => (
                        <div key={i} style={{ background: "var(--card-bg)", padding: "12px", borderRadius: "12px", border: `1px solid var(--border-color)`, borderLeft: `6px solid ${adv.type === "advance" ? "#ef4444" : "#10b981"}`, opacity: adv.isSettled ? 0.6 : 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--text-main)", textDecoration: adv.isSettled ? "line-through" : "none" }}>
                              {adv.type === "advance" ? "貸した" : "借りた"} <span style={{ fontSize: "0.75rem", fontWeight: "normal" }}>({adv.eventTitle})</span>
                            </div>
                            <div style={{ fontSize: "0.7rem", color: "var(--text-sub)" }}>{adv.eventDate}</div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                            <div style={{ fontSize: "1rem", fontWeight: "900", color: adv.type === "advance" ? "#ef4444" : "#10b981" }}>¥{Number(adv.amount).toLocaleString()}</div>
                            {adv.isSettled && <span style={{ fontSize: "0.6rem", background: "var(--input-bg)", padding: "2px 6px", borderRadius: "4px", color: "var(--text-sub)", fontWeight: "bold" }}>精算済</span>}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <>
            <div style={{ display: "flex", gap: "8px", marginBottom: "15px", flexShrink: 0 }}>
              <button onClick={() => setAdvanceTab("unsettled")} className={advanceTab === "unsettled" ? "btn-pop" : "btn-secondary"} style={{ flex: 1, height: "40px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", background: advanceTab === "unsettled" ? themeColor : "var(--input-bg)", color: advanceTab === "unsettled" ? "#fff" : "var(--text-main)", border: "none", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold", boxShadow: advanceTab === "unsettled" ? `0 4px 10px ${themeColor}50` : "none", transition: "all 0.2s" }}>
                未精算 ({unsettledAdvances.length})
              </button>
              <button onClick={() => setAdvanceTab("settled")} className={advanceTab === "settled" ? "btn-pop" : "btn-secondary"} style={{ flex: 1, height: "40px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", background: advanceTab === "settled" ? themeColor : "var(--input-bg)", color: advanceTab === "settled" ? "#fff" : "var(--text-main)", border: "none", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold", boxShadow: advanceTab === "settled" ? `0 4px 10px ${themeColor}50` : "none", transition: "all 0.2s" }}>
                精算済 ({settledAdvances.length})
              </button>
              <button onClick={() => setAdvanceTab("partners")} className={advanceTab === "partners" ? "btn-pop" : "btn-secondary"} style={{ flex: 1, height: "40px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", background: advanceTab === "partners" ? themeColor : "var(--input-bg)", color: advanceTab === "partners" ? "#fff" : "var(--text-main)", border: "none", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "bold", boxShadow: advanceTab === "partners" ? `0 4px 10px ${themeColor}50` : "none", transition: "all 0.2s" }}>
                相手リスト
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingRight: "4px" }} className="hide-scrollbar">
              {advanceTab === "unsettled" &&
                (unsettledAdvances.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-sub)", fontWeight: "bold" }}>
                    <Handshake size={40} style={{ margin: "0 auto 12px auto", opacity: 0.5, color: "var(--theme)" }} />
                    <p style={{ fontSize: "0.9rem", marginBottom: "8px" }}>現在、未精算の立替記録はありません。</p>
                    <p style={{ fontSize: "0.75rem", lineHeight: 1.5 }}>
                      ※カレンダーの「予定を追加」画面の
                      <br />
                      「支出・立替を記録する」から
                      <br />
                      立て替えた金額を登録するとここに表示されます。
                    </p>
                  </div>
                ) : (
                  unsettledAdvances.map((adv: any, i: number) => (
                    <div key={i} style={{ background: "var(--card-bg)", padding: "16px", borderRadius: "16px", border: `1px solid var(--border-color)`, borderLeft: `6px solid ${adv.type === "advance" ? "#ef4444" : "#10b981"}`, boxShadow: "0 4px 12px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "0.95rem", fontWeight: "900", color: "var(--text-main)" }}>
                            {adv.payee || "誰か"} に <span style={{ color: adv.type === "advance" ? "#ef4444" : "#10b981" }}>{adv.type === "advance" ? "貸し" : "借り"}</span>
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-sub)", fontWeight: "bold" }}>
                            {adv.eventDate} ({adv.eventTitle})
                          </span>
                        </div>
                        <div style={{ fontSize: "1.2rem", fontWeight: "900", color: adv.type === "advance" ? "#ef4444" : "#10b981" }}>¥{Number(adv.amount).toLocaleString()}</div>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm(`「${adv.payee || "この相手"}」との精算を完了しますか？`)) {
                            const targetEvent = events.find((e: any) => e.id === adv.eventId);
                            if (targetEvent) {
                              const updatedExpenses = targetEvent.extendedProps.metadata.customFields.expenses.map((ex: any) => (ex.id === adv.id ? { ...ex, isSettled: true } : ex));
                              await supabase
                                .from("events")
                                .update({
                                  metadata: { ...targetEvent.extendedProps.metadata, customFields: { ...targetEvent.extendedProps.metadata.customFields, expenses: updatedExpenses } },
                                })
                                .eq("id", adv.eventId);

                              const today = toLocalYYYYMMDD(new Date());
                              await supabase.from("events").insert([
                                {
                                  user_id: activeUserId,
                                  title: `✅ ${adv.payee || "相手"} との立替精算`,
                                  category: "収支記録",
                                  start_at: new Date(`${today}T12:00:00`).toISOString(),
                                  end_at: new Date(`${today}T13:00:00`).toISOString(),
                                  metadata: {
                                    isAllDayBackground: true,
                                    isPureFinance: true,
                                    customColor: "#10b981",
                                    customFields: {
                                      isIncomeSet: adv.type === "advance",
                                      standardIncomeAmount: adv.type === "advance" ? adv.amount : "",
                                      isExpenseSet: adv.type === "borrow",
                                      standardExpenseAmount: adv.type === "borrow" ? adv.amount : "",
                                      paymentMethod: "cash",
                                    },
                                  },
                                },
                              ] as any);
                              alert("精算を完了として記録しました！");
                              fetchEvents();
                            }
                          }
                        }}
                        className="btn-pop"
                        style={{ width: "100%", padding: "10px", fontSize: "0.85rem", borderRadius: "12px", background: "var(--theme)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      >
                        <CheckCircle size={16} /> 精算を完了する
                      </button>
                    </div>
                  ))
                ))}

              {advanceTab === "settled" &&
                (settledAdvances.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-sub)", fontWeight: "bold", fontSize: "0.85rem" }}>精算済みの記録はありません</div>
                ) : (
                  settledAdvances.map((adv: any, i: number) => (
                    <div key={i} style={{ background: "var(--input-bg)", padding: "16px", borderRadius: "16px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: "var(--text-sub)", textDecoration: "line-through" }}>
                          {adv.payee || "誰か"} に {adv.type === "advance" ? "貸し" : "借り"}
                        </span>
                        <span style={{ fontSize: "0.7rem", color: "var(--text-sub)" }}>
                          {adv.eventDate} ({adv.eventTitle})
                        </span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                        <div style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--text-sub)" }}>¥{Number(adv.amount).toLocaleString()}</div>
                        <button
                          onClick={async () => {
                            if (confirm(`この精算済みの記録を未精算に戻しますか？`)) {
                              const targetEvent = events.find((e: any) => e.id === adv.eventId);
                              if (targetEvent) {
                                const updatedExpenses = targetEvent.extendedProps.metadata.customFields.expenses.map((ex: any) => (ex.id === adv.id ? { ...ex, isSettled: false } : ex));
                                await supabase
                                  .from("events")
                                  .update({
                                    metadata: { ...targetEvent.extendedProps.metadata, customFields: { ...targetEvent.extendedProps.metadata.customFields, expenses: updatedExpenses } },
                                  } as any)
                                  .eq("id", adv.eventId);
                                alert("未精算に戻しました。");
                                fetchEvents();
                              }
                            }
                          }}
                          style={{ fontSize: "0.7rem", padding: "4px 8px", background: "var(--card-bg)", border: "1px solid var(--border-color)", borderRadius: "6px", color: "var(--text-main)", cursor: "pointer", fontWeight: "bold" }}
                        >
                          未精算に戻す
                        </button>
                      </div>
                    </div>
                  ))
                ))}

              {advanceTab === "partners" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input type="text" className="pop-input" placeholder="よく立て替える相手の名前を追加" value={newPayeeName} onChange={(e) => setNewPayeeName(e.target.value)} style={{ flex: 1, fontSize: "0.85rem" }} />
                    <button
                      onClick={() => {
                        if (newPayeeName.trim() && !customPayees.includes(newPayeeName.trim())) {
                          setCustomPayees([...customPayees, newPayeeName.trim()]);
                          setNewPayeeName("");
                        }
                      }}
                      className="btn-pop"
                      style={{ padding: "0 16px", borderRadius: "12px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                    >
                      追加
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: "bold", color: "var(--text-sub)", marginBottom: "4px" }}>登録済みの相手リスト</span>
                    {customPayees.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "20px", color: "var(--text-sub)", fontSize: "0.8rem", background: "var(--card-bg)", borderRadius: "12px", border: "1px dashed var(--border-color)" }}>登録されている相手はいません</div>
                    ) : (
                      customPayees.map((p, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "var(--card-bg)", borderRadius: "12px", border: "1px solid var(--border-color)", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                          <div style={{ flex: 1, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => setViewingPartner(p)}>
                            <span style={{ fontWeight: "bold", color: "var(--text-main)", fontSize: "0.9rem" }}>{p}</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--theme)", fontWeight: "bold", background: "var(--input-bg)", padding: "4px 8px", borderRadius: "8px" }}>履歴を見る 👉</span>
                          </div>
                          <button onClick={() => setCustomPayees(customPayees.filter((name) => name !== p))} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "4px" }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
