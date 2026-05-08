'use client';

import React from 'react';
import { 
  Search, Moon, Sun, Clock, Target, Inbox, Star, Edit3, 
  PieChart, Image as ImageIcon, Palette, Repeat, Gift, Settings, Database 
} from 'lucide-react';
import { toLocalYYYYMMDD } from '@/app/lib/utils';

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenSections: React.Dispatch<React.SetStateAction<string[]>>;
  themeColor: string;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  handleSearchExecute: () => void;
  setIsSearchMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsColorPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDarkMode: boolean;
  setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  events: any[];
  categories: any[];
  targetType: string;
  setTargetType: React.Dispatch<React.SetStateAction<string>>;
  targetValue: string;
  setTargetValue: React.Dispatch<React.SetStateAction<string>>;
  currentMonthEvents: any[];
  currentYearEvents: any[];
  quickTemplates: any[];
  setMode: React.Dispatch<React.SetStateAction<any>>;
  setStartDate: React.Dispatch<React.SetStateAction<string>>;
  setEndDate: React.Dispatch<React.SetStateAction<string>>;
  setStartH: React.Dispatch<React.SetStateAction<string>>;
  setStartM: React.Dispatch<React.SetStateAction<string>>;
  setEndH: React.Dispatch<React.SetStateAction<string>>;
  setEndM: React.Dispatch<React.SetStateAction<string>>;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  setLocation: React.Dispatch<React.SetStateAction<string>>;
  setMemo: React.Dispatch<React.SetStateAction<string>>;
  setPhotoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  setIsStocked: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCategoryName: React.Dispatch<React.SetStateAction<string>>;
  setIsAllDayBackground: React.Dispatch<React.SetStateAction<boolean>>;
  setEventColor: React.Dispatch<React.SetStateAction<string>>;
  setIsAnalyticsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsGalleryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCategoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRoutineModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAnniversaryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  syncWithCloud: () => void;
  handleEventClick: (info: any) => void;
}

export default function Sidebar({
  isSidebarOpen, setIsSidebarOpen, setOpenSections, themeColor,
  searchQuery, setSearchQuery, handleSearchExecute, setIsSearchMode,
  setIsColorPickerOpen, isDarkMode, setIsDarkMode,
  events, categories, targetType, setTargetType, targetValue, setTargetValue,
  currentMonthEvents, currentYearEvents, quickTemplates,
  setMode, setStartDate, setEndDate, setStartH, setStartM, setEndH, setEndM,
  setTitle, setLocation, setMemo, setPhotoUrls, setIsStocked, setIsModalOpen,
  setCategoryName, setIsAllDayBackground, setEventColor,
  setIsAnalyticsModalOpen, setIsGalleryOpen, setIsCategoryModalOpen,
  setIsRoutineModalOpen, setIsAnniversaryModalOpen, syncWithCloud, handleEventClick
}: SidebarProps) {

  // モーダルのヘッダー部品
  const ModalHeader = ({ title, onClose }: any) => (
    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h2 className="modal-title" style={{ margin: 0, color: themeColor, fontSize: '1.4rem', fontWeight: 900 }}>{title}</h2>
      <button onClick={onClose} className="btn-close" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
    </div>
  );

  return (
    <>
      {/* 背景の暗いオーバーレイ */}
      <div onClick={() => { setOpenSections([]); setIsSidebarOpen(false); }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 900, opacity: isSidebarOpen ? 1 : 0, pointerEvents: isSidebarOpen ? 'auto' : 'none', transition: 'all 0.3s ease' }} />

      {/* サイドバー本体 */}
      <div className="glass-panel" style={{ position: 'fixed', top: 0, left: 0, width: '280px', height: '100%', borderRight: `4px solid ${themeColor}`, borderTopRightRadius: '24px', borderBottomRightRadius: '24px', zIndex: 2000, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)', padding: '24px 20px', transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.1)', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)' }}>
        <ModalHeader title="Smart LifeOS" onClose={() => setIsSidebarOpen(false)} />

        {/* 検索・テーマ設定 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', borderRadius: '12px', padding: '4px 12px', border: `1px solid var(--border-color)` }}>
            <Search size={16} style={{ color: 'var(--text-sub)', marginRight: '8px' }} />
            <input
              type="text" placeholder="予定を検索..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { handleSearchExecute(); setIsSidebarOpen(false); setIsSearchMode(true); } }}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%', color: 'var(--text-main)', height: '32px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setIsSidebarOpen(false); setIsColorPickerOpen(true); }} className="btn-secondary" style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem', borderRadius: '12px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: themeColor }} /> テーマ
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="btn-secondary" style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem', borderRadius: '12px', background: isDarkMode ? '#1e293b' : '#f8fafc', color: isDarkMode ? '#f8fafc' : '#1e293b', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
              {isDarkMode ? <><Moon size={14} /> ダーク</> : <><Sun size={14} /> ライト</>}
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px', paddingLeft: '1px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="hide-scrollbar">

          {/* 1. ウィジェット */}
          <div>
            <div className="sidebar-group-title" style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '8px', borderLeft: `3px solid ${themeColor}` }}>WIDGETS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* 24時間グラフ */}
              <div className="card-box" style={{ margin: 0, padding: '16px', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> 今日の24時間</div>
                {(() => {
                  const todayObj = new Date();
                  todayObj.setHours(0, 0, 0, 0);
                  const tomorrowObj = new Date(todayObj);
                  tomorrowObj.setDate(tomorrowObj.getDate() + 1);

                  const todayEvents = events.filter((e: any) => {
                    if (e.extendedProps?.isMilestone || e.allDay || e.extendedProps?.metadata?.isAllDayBackground) return false;
                    const s = new Date(e.start);
                    const eTime = e.end ? new Date(e.end) : new Date(s.getTime() + 3600000);
                    return eTime > todayObj && s < tomorrowObj;
                  });

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ position: 'relative', width: '100%', maxWidth: '180px', aspectRatio: '1/1' }}>
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                          <circle cx="50" cy="50" r="36" fill="none" stroke="var(--border-color)" strokeWidth="8" opacity="0.4" />
                          {Array.from({length: 12}).map((_, i) => {
                            const hour = i * 2;
                            const angle = (hour * 15 - 90) * (Math.PI / 180);
                            const radius = 48;
                            const x = (50 + radius * Math.cos(angle)).toFixed(4);
                            const y = (50 + radius * Math.sin(angle)).toFixed(4);
                            return (
                              <text key={hour} x={x} y={y} fontSize="6.5" fontWeight="900" fill="var(--text-sub)" textAnchor="middle" dominantBaseline="central">{hour}</text>
                            );
                          })}
                          <g transform="rotate(-90 50 50)">
                            {todayEvents.map((e: any, idx: number) => {
                              const dStart = new Date(e.start);
                              const dEnd = e.end ? new Date(e.end) : new Date(dStart.getTime() + 3600000);
                              let startMin = 0; let endMin = 1440;
                              if (dStart >= todayObj) startMin = dStart.getHours() * 60 + dStart.getMinutes();
                              if (dEnd <= tomorrowObj) endMin = dEnd.getHours() * 60 + dEnd.getMinutes();
                              const dur = endMin - startMin;
                              if (dur <= 0) return null;
                              const C = 2 * Math.PI * 36;
                              const dash = (dur / 1440) * C;
                              const gap = C - dash;
                              const offset = - (startMin / 1440) * C;
                              return (
                                <circle key={idx} cx="50" cy="50" r="36" fill="none" stroke={e.extendedProps?.cColor || e.backgroundColor || 'var(--theme)'} strokeWidth="8" strokeDasharray={`${dash} ${gap}`} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'all 0.5s ease' }} />
                              );
                            })}
                          </g>
                        </svg>
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-main)', textAlign: 'center', lineHeight: 1.2 }}>
                          TODAY
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '16px', width: '100%' }}>
                        {todayEvents.length === 0 ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)' }}>今日の時間予定はありません</span>
                        ) : (
                          todayEvents.map((e: any, i: number) => (
                            <div key={i} onClick={() => { setIsSidebarOpen(false); handleEventClick({ event: e }); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', background: 'var(--input-bg)', padding: '4px 8px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: e.extendedProps?.cColor || e.backgroundColor }} />
                              <span style={{ maxWidth: '70px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold' }}>{e.title}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ハイライト・目標 */}
              <div className="card-box" style={{ margin: 0, padding: '16px', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Target size={14} /> ハイライト・目標</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <select className="pop-input" style={{ padding: '0 10px', fontSize: '0.75rem', width: '100%', height: '38px', cursor: 'pointer', background: 'var(--input-bg)', border: '2px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-main)' }} value={targetType.startsWith('money_') ? 'balance_month' : targetType.startsWith('count_') ? 'balance_month' : targetType} onChange={e => setTargetType(e.target.value)}>
                    <optgroup label="💰 収支バランス (全予定合算)">
                      <option value="balance_month">今月の収支</option>
                      <option value="balance_year">今年の収支</option>
                    </optgroup>
                    {categories.some(c => c.fields?.some((f: any) => f.type === 'number')) && (
                      <optgroup label="📈 数値記録・目標">
                        {categories.flatMap(c => (c.fields || []).filter((f: any) => f.type === 'number').map((f: any) => (
                          <React.Fragment key={f.id}>
                            <option value={`field_month_${c.name}_${f.id}`}>[今月] {c.name}: {f.name}</option>
                            <option value={`field_year_${c.name}_${f.id}`}>[今年] {c.name}: {f.name}</option>
                          </React.Fragment>
                        )))}
                      </optgroup>
                    )}
                  </select>

                  {targetType.startsWith('field_') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--input-bg)', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>目標設定:</span>
                      <input type="number" className="pop-input" style={{ padding: '0', fontSize: '0.85rem', height: '24px', border: 'none', background: 'transparent', textAlign: 'right', flex: 1, color: 'var(--text-main)' }} placeholder="設定しない場合は空欄" defaultValue={targetValue} onBlur={e => setTargetValue(e.target.value)} />
                    </div>
                  )}
                </div>

                {(() => {
                  if (targetType.startsWith('balance_')) {
                    const isMonth = targetType === 'balance_month';
                    let inc = 0; let exp = 0;
                    const evts = isMonth ? currentMonthEvents : currentYearEvents;
                    evts.forEach((e: any) => {
                      if (e.extendedProps?.metadata?.customFields?.isExpenseSet) exp += Number(e.extendedProps.metadata.customFields.standardExpenseAmount || 0);
                      if (e.extendedProps?.metadata?.customFields?.isIncomeSet) inc += Number(e.extendedProps.metadata.customFields.standardIncomeAmount || 0);

                      const fields = e.extendedProps?.metadata?.customFields;
                      const catObj = categories.find((c: any) => c.name === e.extendedProps.category);
                      if (fields && catObj?.fields) {
                        catObj.fields.forEach((f: any) => {
                          if (f.type === 'money') {
                            const d = fields[f.id];
                            if (d?.type === 'income') inc += Number(d.amount || 0);
                            if (d?.type === 'expense') exp += Number(d.amount || 0);
                          } else if (f.type === 'money_income') {
                            inc += Number(fields[f.id] || 0);
                          } else if (f.type === 'money_expense') {
                            exp += Number(fields[f.id] || 0);
                          } else if (f.type === 'wage' && !f.excludeFromTotal) {
                            const d = fields[f.id];
                            if (d?.calculatedWage !== undefined) inc += Number(d.calculatedWage);
                            else if (d?.hours) inc += (Number(d.hours) * (d.wage || f.wage || 0));
                          }
                        });
                      }
                    });

                    const total = inc + exp;
                    if (total === 0) {
                      return (
                        <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '12px', textAlign: 'center', border: '1px dashed var(--border-color)', color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: 'bold' }}>
                          この期間の収支データはありません
                        </div>
                      );
                    }

                    const incPerc = (inc / total) * 100;
                    const expPerc = (exp / total) * 100;

                    return (
                      <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.85rem', fontWeight: '900' }}>
                          <span style={{ color: '#10b981' }}>収入: ¥{inc.toLocaleString()}</span>
                          <span style={{ color: '#ef4444' }}>支出: ¥{exp.toLocaleString()}</span>
                        </div>
                        <div style={{ width: '100%', height: '14px', background: 'var(--border-color)', borderRadius: '7px', overflow: 'hidden', display: 'flex' }}>
                          {inc > 0 && <div style={{ width: `${incPerc}%`, height: '100%', background: '#10b981', transition: 'width 0.5s' }} />}
                          {exp > 0 && <div style={{ width: `${expPerc}%`, height: '100%', background: '#ef4444', transition: 'width 0.5s' }} />}
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '12px', fontWeight: '900', color: inc >= exp ? '#10b981' : '#ef4444' }}>
                          残高: {inc >= exp ? '+' : '-'}¥{Math.abs(inc - exp).toLocaleString()}
                        </div>
                      </div>
                    );
                  } else if (targetType.startsWith('field_')) {
                    const [, period, catName, fieldId] = targetType.split('_');
                    const evts = period === 'month' ? currentMonthEvents : currentYearEvents;
                    const targetCat = categories.find(c => c.name === catName);
                    const targetField = targetCat?.fields?.find((f: any) => f.id === fieldId);
                    if (!targetField) return null;

                    let currentProgress = 0;
                    evts.forEach(e => {
                      if (e.extendedProps.category === catName) {
                        const val = e.extendedProps.metadata?.customFields?.[fieldId];
                        if (val) currentProgress += Number(val);
                      }
                    });

                    const hasTarget = targetValue && Number(targetValue) > 0;

                    if (!hasTarget) {
                      return (
                        <div style={{ background: 'var(--input-bg)', padding: '20px 16px', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 'bold', marginBottom: '8px' }}>{targetCat.name} の {targetField.name}</div>
                          <div style={{ fontSize: '2rem', fontWeight: '900', color: targetCat.color, lineHeight: 1 }}>{currentProgress.toLocaleString()}<span style={{ fontSize: '0.9rem', color: 'var(--text-sub)', marginLeft: '4px' }}>{targetField.unit}</span></div>
                        </div>
                      );
                    } else {
                      const progressPercent = Math.min(100, (currentProgress / Number(targetValue)) * 100);
                      const isOver = currentProgress > Number(targetValue);
                      return (
                        <div style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', fontWeight: 'bold', marginBottom: '8px' }}>{targetCat.name} の {targetField.name}</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', marginBottom: '10px' }}>
                            <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{currentProgress.toLocaleString()}{targetField.unit}</span>
                            <span style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>/ {Number(targetValue).toLocaleString()}{targetField.unit}</span>
                          </div>
                          <div style={{ width: '100%', height: '12px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{ width: `${progressPercent}%`, height: '100%', background: isOver ? '#ef4444' : targetCat.color, transition: 'width 0.5s ease-out' }} />
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '0.7rem', marginTop: '10px', color: isOver ? '#ef4444' : 'var(--text-sub)', fontWeight: 'bold' }}>
                            {isOver ? `${Math.abs(Number(targetValue) - currentProgress).toLocaleString()}${targetField.unit} オーバー達成！` : `残り: ${(Number(targetValue) - currentProgress).toLocaleString()}${targetField.unit}`}
                          </div>
                        </div>
                      );
                    }
                  }
                })()}
              </div>

              {/* 未定タスク */}
              <div className="card-box" style={{ margin: 0, padding: '16px', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Inbox size={14} /> 未定タスク</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {events.filter((e: any) => e.extendedProps?.metadata?.isStocked).slice(0,3).map((e: any) => (
                    <div key={e.id} onClick={() => { setIsSidebarOpen(false); handleEventClick({ event: e }); }} style={{ padding: '8px 12px', background: 'var(--input-bg)', borderRadius: '8px', cursor: 'pointer', borderLeft: `4px solid ${e.backgroundColor}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</span>
                    </div>
                  ))}
                  {events.filter((e: any) => e.extendedProps?.metadata?.isStocked).length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.75rem', fontWeight: 'bold' }}>ストックはありません</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. アクション */}
          <div>
            <div className="sidebar-group-title" style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '8px', borderLeft: `3px solid ${themeColor}` }}>ACTIONS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {quickTemplates.map((t, i) => (
                <button key={i} onClick={() => {
                  const today = toLocalYYYYMMDD(new Date());
                  setMode('create'); setStartDate(today); setEndDate(today);
                  setTitle(t.title); setStartH(t.startH); setStartM(t.startM); setEndH(t.endH); setEndM(t.endM); setCategoryName(t.categoryName); setIsAllDayBackground(t.isAllDayBackground); setEventColor(t.eventColor || '');
                  setIsModalOpen(true); setIsSidebarOpen(false);
                }} style={{ padding: '12px 8px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderRadius: '16px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                  <Star size={20} color={t.eventColor || themeColor} />
                  <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{t.title}</span>
                </button>
              ))}

              {quickTemplates.length === 0 && (
                <div style={{ gridColumn: 'span 2', fontSize: '0.7rem', color: 'var(--text-sub)', textAlign: 'center', padding: '12px', background: 'var(--card-bg)', border: `1px dashed ${themeColor}`, borderRadius: '12px' }}>
                  予定入力画面の「よくある予定に登録」を押すと、ここに専用ボタンが作られます。
                </div>
              )}

              <button onClick={() => {
                const today = toLocalYYYYMMDD(new Date()); const nowH = new Date().getHours();
                setMode('create'); setStartDate(today); setEndDate(today);
                setStartH(String(nowH).padStart(2, '0')); setEndH(String(Math.min(nowH + 1, 23)).padStart(2, '0'));
                setTitle(''); setLocation(''); setMemo(''); setPhotoUrls([]); setIsStocked(false); setIsModalOpen(true);
                setIsSidebarOpen(false);
              }} style={{ gridColumn: 'span 2', padding: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', background: themeColor, color: '#fff', border: 'none', boxShadow: `0 4px 15px ${themeColor}40`, cursor: 'pointer' }}>
                <Edit3 size={18} />
                <span style={{ fontWeight: 'bold' }}>新しく予定を作成</span>
              </button>
            </div>
          </div>

          {/* 3. レポート＆ギャラリー */}
          <div>
            <div className="sidebar-group-title" style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '8px', borderLeft: `3px solid ${themeColor}` }}>REPORTS</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
              <button onClick={() => { setIsModalOpen(false); setIsGalleryOpen(false); setIsCategoryModalOpen(false); setIsRoutineModalOpen(false); setIsAnniversaryModalOpen(false); setIsAnalyticsModalOpen(true); setIsSidebarOpen(false); }} style={{ padding: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                <PieChart size={18} color={themeColor} />
                <span style={{ fontWeight: 'bold' }}>振り返りダッシュボード</span>
              </button>
              <button onClick={() => { setIsModalOpen(false); setIsAnalyticsModalOpen(false); setIsCategoryModalOpen(false); setIsRoutineModalOpen(false); setIsAnniversaryModalOpen(false); setIsGalleryOpen(true); setIsSidebarOpen(false); }} style={{ padding: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                <ImageIcon size={18} color="#9B59B6" />
                <span style={{ fontWeight: 'bold' }}>思い出ギャラリー</span>
              </button>
            </div>
          </div>

          {/* 4. 設定 */}
          <div>
            <div className="sidebar-group-title" style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', paddingLeft: '8px', borderLeft: `3px solid ${themeColor}` }}>SETTINGS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--card-bg)', padding: '8px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <button onClick={() => { setIsModalOpen(false); setIsAnalyticsModalOpen(false); setIsGalleryOpen(false); setIsRoutineModalOpen(false); setIsAnniversaryModalOpen(false); setIsCategoryModalOpen(true); setIsSidebarOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Palette size={16} color="var(--text-sub)" /> <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>ジャンル・記録項目</span>
              </button>
              <button onClick={() => { setIsModalOpen(false); setIsAnalyticsModalOpen(false); setIsGalleryOpen(false); setIsCategoryModalOpen(false); setIsAnniversaryModalOpen(false); setIsRoutineModalOpen(true); setIsSidebarOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Repeat size={16} color="var(--text-sub)" /> <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>毎月のルーティン</span>
              </button>
              <button onClick={() => { setIsModalOpen(false); setIsAnalyticsModalOpen(false); setIsGalleryOpen(false); setIsCategoryModalOpen(false); setIsRoutineModalOpen(false); setIsAnniversaryModalOpen(true); setIsSidebarOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Gift size={16} color="var(--text-sub)" /> <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>記念日</span>
              </button>
              <button onClick={() => { setIsSidebarOpen(false); alert('表示・詳細設定モーダルは現在アップデート準備中です。'); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Settings size={16} color="var(--text-sub)" /> <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>カレンダー詳細設定</span>
              </button>
            </div>
          </div>

          {/* アカウント */}
          <div style={{ marginTop: '12px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-sub)' }}>データ保存先</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: themeColor, color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>ローカル</span>
            </div>
            <button onClick={syncWithCloud} style={{ width: '100%', padding: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: `1px dashed ${themeColor}`, color: themeColor, borderRadius: '16px', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
              <Database size={16} /> クラウド同期・ログイン
            </button>
          </div>

        </div>
      </div>
    </>
  );
}