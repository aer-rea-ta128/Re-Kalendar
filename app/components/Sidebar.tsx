'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Moon, Sun, Clock, Target, Star, Edit3, 
  PieChart, Image as ImageIcon, Palette, Repeat, Gift, Database, Banknote, MapPin, Home, Train, Footprints,
  ChevronDown, ChevronRight, LayoutDashboard, Zap, FolderKanban, Settings2, Globe, History as HistoryIcon, GripVertical
} from 'lucide-react';
import { toLocalYYYYMMDD, hexToRgba } from '@/app/lib/utils';

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
  setCustomFieldsData: React.Dispatch<React.SetStateAction<any>>;
  homeLocation: string; setHomeLocation: React.Dispatch<React.SetStateAction<string>>;
  nearestStation: string; setNearestStation: React.Dispatch<React.SetStateAction<string>>;
  walkTime: string; setWalkTime: React.Dispatch<React.SetStateAction<string>>;
  startPointType: string; setStartPointType: React.Dispatch<React.SetStateAction<string>>;
  // 👇 追加
  displayMode: string; setDisplayMode: React.Dispatch<React.SetStateAction<string>>;
  viewType: string;
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
  setIsRoutineModalOpen, setIsAnniversaryModalOpen, syncWithCloud, handleEventClick,
  setCustomFieldsData, homeLocation, setHomeLocation, nearestStation, setNearestStation,
  walkTime, setWalkTime, startPointType, setStartPointType,
  displayMode, setDisplayMode, viewType // 👈 追加
}: SidebarProps) {
  const [expanded, setExpanded] = useState<string[]>(['finance']);
  const toggleSection = (sec: string) => setExpanded(prev => prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]);

  const [isTravelMapOpen, setIsTravelMapOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const [visitedPrefs, setVisitedPrefs] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem('os_visitedPrefs');
    try { return saved ? JSON.parse(saved) : {}; } catch (e) { return {}; }
  });

  const [ledgerSpan, setLedgerSpan] = useState<'month' | 'year'>('month');
  const [historySpan, setHistorySpan] = useState<'month' | 'year' | 'all'>('month');
  const [financeTypeFilter, setFinanceTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isFinanceHistoryOpen, setIsFinanceHistoryOpen] = useState(false);

  const [incomeCalcBasis, setIncomeCalcBasis] = useState<'wage' | 'payday'>(() => {
    if (typeof window === 'undefined') return 'wage';
    return localStorage.getItem('os_incomeCalcBasis') as 'wage' | 'payday' || 'wage';
  });

  // 👇 ドラッグ用のRef
  const dragRoutine = useRef<number | null>(null);
  const dragSub = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('os_visitedPrefs', JSON.stringify(visitedPrefs));
    localStorage.setItem('os_incomeCalcBasis', incomeCalcBasis);
  }, [visitedPrefs, incomeCalcBasis]);

  const ModalHeader = ({ title, onClose }: any) => (
    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h2 className="modal-title" style={{ margin: 0, color: themeColor, fontSize: '1.4rem', fontWeight: 900 }}>{title}</h2>
      <button onClick={onClose} className="btn-close" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
    </div>
  );

  const AccordionHeader = ({ id, title, icon: Icon }: any) => (
    <div onClick={() => toggleSection(id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: expanded.includes(id) ? 'var(--theme-shadow)' : 'var(--input-bg)', borderRadius: '12px', cursor: 'pointer', marginBottom: expanded.includes(id) ? '12px' : '8px', border: `1px solid ${expanded.includes(id) ? themeColor : 'var(--border-color)'}`, transition: 'all 0.2s', boxShadow: expanded.includes(id) ? `0 4px 12px ${themeColor}20` : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: expanded.includes(id) ? themeColor : 'var(--text-sub)', fontWeight: '900', fontSize: '0.85rem', letterSpacing: '1px' }}>
        <Icon size={18} /> {title}
      </div>
      {expanded.includes(id) ? <ChevronDown size={18} style={{ color: themeColor }}/> : <ChevronRight size={18} style={{ color: 'var(--text-sub)' }}/>}
    </div>
  );

  return (
    <>
      <div onClick={() => { setOpenSections([]); setIsSidebarOpen(false); }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 1999, opacity: isSidebarOpen ? 1 : 0, pointerEvents: isSidebarOpen ? 'auto' : 'none', transition: 'all 0.3s ease' }} />

      <div style={{ position: 'fixed', top: 0, left: 0, width: '85%', maxWidth: '300px', height: '100dvh', borderTopRightRadius: '24px', borderBottomRightRadius: '24px', zIndex: 2000, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)', padding: '24px 20px', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1)', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', boxShadow: isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none', borderRight: '1px solid var(--border-color)' }}>
        
        <ModalHeader title="Smart LifeOS" onClose={() => setIsSidebarOpen(false)} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', borderRadius: '12px', padding: '4px 12px', border: `1px solid var(--border-color)` }}>
            <Search size={16} style={{ color: 'var(--text-sub)', marginRight: '8px' }} />
            <input type="text" placeholder="予定を検索..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { handleSearchExecute(); setIsSidebarOpen(false); setIsSearchMode(true); } }} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', width: '100%', color: 'var(--text-main)', height: '32px' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setIsSidebarOpen(false); setIsColorPickerOpen(true); }} className="btn-secondary" style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem', borderRadius: '12px' }}>
              <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: themeColor }} /> テーマ
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="btn-secondary" style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.8rem', borderRadius: '12px', background: isDarkMode ? '#1e293b' : '#f8fafc', color: isDarkMode ? '#f8fafc' : '#1e293b', border: `1px solid ${isDarkMode ? '#334155' : '#e2e8f0'}` }}>
              {isDarkMode ? <><Moon size={14} /> ダーク</> : <><Sun size={14} /> ライト</>}
            </button>
          </div>
          
          {/* 👇 追加：月毎カレンダーの時のみ表示される「表示モード切替」 */}
          {viewType === 'dayGridMonth' && (
            <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: '12px', padding: '4px', border: `1px solid var(--border-color)` }}>
              <button onClick={() => setDisplayMode('normal')} style={{ flex: 1, padding: '6px', borderRadius: '8px', background: displayMode === 'normal' ? 'var(--card-bg)' : 'transparent', color: displayMode === 'normal' ? 'var(--theme)' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', boxShadow: displayMode === 'normal' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s' }}>通常</button>
              <button onClick={() => setDisplayMode('dot')} style={{ flex: 1, padding: '6px', borderRadius: '8px', background: displayMode === 'dot' ? 'var(--card-bg)' : 'transparent', color: displayMode === 'dot' ? 'var(--theme)' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', boxShadow: displayMode === 'dot' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s' }}>ドット</button>
              <button onClick={() => setDisplayMode('photo')} style={{ flex: 1, padding: '6px', borderRadius: '8px', background: displayMode === 'photo' ? 'var(--card-bg)' : 'transparent', color: displayMode === 'photo' ? 'var(--theme)' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', boxShadow: displayMode === 'photo' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s' }}>写真</button>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px', paddingLeft: '1px', display: 'flex', flexDirection: 'column', gap: '8px' }} className="hide-scrollbar">
          
          {/* 収支履歴・管理セクション */}
          <div>
            <AccordionHeader id="finance" title="収支履歴・管理" icon={Banknote} />
            {expanded.includes('finance') && (() => {
              
              const tMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
              const tYear = String(new Date().getFullYear());
              const evts = events.filter((e: any) => e.start && (ledgerSpan === 'month' ? e.start.startsWith(tMonth) : e.start.startsWith(tYear)));
              
              let inc = 0; let exp = 0;
              evts.forEach((e: any) => {
                const cf = e.extendedProps?.metadata?.customFields || {};
                
                if (cf.isExpenseSet) exp += Number(cf.standardExpenseAmount || 0);
                
                if (cf.isIncomeSet) {
                  if (incomeCalcBasis === 'wage' && cf.isSalary) {
                    // 時給換算モードで、かつこれは給料日イベントなので除外して二重計上を防ぐ
                  } else {
                    inc += Number(cf.standardIncomeAmount || 0);
                  }
                }

                const catObj = categories.find((c: any) => c.name === e.extendedProps.category);
                if (catObj?.fields) {
                  catObj.fields.forEach((f: any) => {
                    if (f.type === 'money') { 
                      const d = cf[f.id]; 
                      if (d?.type === 'income') inc += Number(d.amount || 0); 
                      if (d?.type === 'expense') exp += Number(d.amount || 0); 
                    }
                    else if (f.type === 'money_income') inc += Number(cf[f.id] || 0);
                    else if (f.type === 'money_expense') exp += Number(cf[f.id] || 0);
                    else if (f.type === 'wage' && !f.excludeFromTotal) {
                      if (incomeCalcBasis === 'payday') {
                        // 給料日ベースモードなので、日々の時給は合計に加算しない
                      } else {
                        const d = cf[f.id];
                        if (d?.calculatedWage !== undefined) inc += Number(d.calculatedWage);
                        else if (d?.hours) inc += (Number(d.hours) * Number(f.wageRules?.[0]?.wage || f.wage || 0));
                      }
                    }
                  });
                }
              });

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
                  
                  <button onClick={() => {
                    const today = toLocalYYYYMMDD(new Date());
                    setMode('expense'); setStartDate(today); setCategoryName(''); setTitle('');
                    setCustomFieldsData({ transactionMode: 'expense', isExpenseSet: true });
                    setIsModalOpen(true); setIsSidebarOpen(false);
                  }} style={{ padding: '14px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '2px solid var(--theme)', cursor: 'pointer', fontWeight: 'bold' }}>
                    <Banknote size={20} style={{ color: 'var(--theme)' }} /> <span>単発の収支をサッと記録</span>
                  </button>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      収入の計算:
                      <select value={incomeCalcBasis} onChange={e => setIncomeCalcBasis(e.target.value as any)} style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--theme)', outline: 'none', cursor: 'pointer' }}>
                        <option value="wage">時給・シフト換算</option>
                        <option value="payday">給料日・入金ベース</option>
                      </select>
                    </label>
                  </div>

                  <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                      <button onClick={() => setLedgerSpan('month')} className={ledgerSpan === 'month' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '6px', fontSize: '0.75rem', borderRadius: '8px' }}>今月</button>
                      <button onClick={() => setLedgerSpan('year')} className={ledgerSpan === 'year' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '6px', fontSize: '0.75rem', borderRadius: '8px' }}>今年</button>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '900' }}>
                      <span style={{ color: '#10b981' }}>収入: ¥{inc.toLocaleString()}</span>
                      <span style={{ color: '#ef4444' }}>支出: ¥{exp.toLocaleString()}</span>
                    </div>
                    {inc + exp > 0 && (
                      <div style={{ width: '100%', height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                        {inc > 0 && <div style={{ width: `${(inc / (inc + exp)) * 100}%`, background: '#10b981' }} />}
                        {exp > 0 && <div style={{ width: `${(exp / (inc + exp)) * 100}%`, background: '#ef4444' }} />}
                      </div>
                    )}
                    <div style={{ textAlign: 'center', fontSize: '1rem', marginTop: '12px', fontWeight: '900', color: inc >= exp ? '#10b981' : '#ef4444' }}>
                      残高: {inc >= exp ? '+' : '-'}¥{Math.abs(inc - exp).toLocaleString()}
                    </div>
                  </div>

                  <button onClick={() => setIsFinanceHistoryOpen(true)} style={{ padding: '12px', background: 'var(--input-bg)', color: 'var(--text-main)', borderRadius: '12px', fontWeight: 'bold', border: `1px solid ${themeColor}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                    <HistoryIcon size={16} color={themeColor} /> 収支履歴をすべて見る
                  </button>
                </div>
              );
            })()}
          </div>

          {/* クイックアクション */}
          <div>
            <AccordionHeader id="actions" title="アクション・予定追加" icon={Zap} />
            {expanded.includes('actions') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingBottom: '16px' }}>
                <button onClick={() => {
                  const today = toLocalYYYYMMDD(new Date()); const nowH = new Date().getHours();
                  setMode('create'); setStartDate(today); setEndDate(today);
                  setStartH(String(nowH).padStart(2, '0')); setEndH(String(Math.min(nowH + 1, 23)).padStart(2, '0'));
                  setTitle(''); setLocation(''); setMemo(''); setPhotoUrls([]); setIsStocked(false); 
                  setCustomFieldsData({}); 
                  setIsModalOpen(true); setIsSidebarOpen(false);
                }} style={{ gridColumn: 'span 2', padding: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', background: themeColor, color: '#fff', border: 'none', boxShadow: `0 4px 15px ${themeColor}40`, cursor: 'pointer' }}>
                  <Edit3 size={18} /> <span style={{ fontWeight: 'bold' }}>新しく予定を作成</span>
                </button>

                {quickTemplates.map((t, i) => (
                  <button key={i} onClick={() => {
                    const today = toLocalYYYYMMDD(new Date());
                    setMode('create'); setStartDate(today); setEndDate(today);
                    setTitle(t.title); setStartH(t.startH); setStartM(t.startM); setEndH(t.endH); setEndM(t.endM); setCategoryName(t.categoryName); setIsAllDayBackground(t.isAllDayBackground); setEventColor(t.eventColor || '');
                    setCustomFieldsData({}); 
                    setIsModalOpen(true); setIsSidebarOpen(false);
                  }} style={{ padding: '12px 8px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderRadius: '16px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                    <Star size={20} color={t.eventColor || themeColor} />
                    <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{t.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* レポート */}
          <div>
            <AccordionHeader id="reports" title="レポート・ギャラリー" icon={FolderKanban} />
            {expanded.includes('reports') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', paddingBottom: '16px' }}>
                <button onClick={() => { setIsModalOpen(false); setIsGalleryOpen(false); setIsCategoryModalOpen(false); setIsRoutineModalOpen(false); setIsAnniversaryModalOpen(false); setIsTravelMapOpen(false); setIsAnalyticsModalOpen(true); setIsSidebarOpen(false); }} style={{ padding: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                  <PieChart size={18} color={themeColor} /> <span style={{ fontWeight: 'bold' }}>振り返りダッシュボード</span>
                </button>
                <button onClick={() => { setIsModalOpen(false); setIsAnalyticsModalOpen(false); setIsCategoryModalOpen(false); setIsRoutineModalOpen(false); setIsAnniversaryModalOpen(false); setIsTravelMapOpen(false); setIsGalleryOpen(true); setIsSidebarOpen(false); }} style={{ padding: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                  <ImageIcon size={18} color="#9B59B6" /> <span style={{ fontWeight: 'bold' }}>思い出ギャラリー</span>
                </button>
                <button onClick={() => { setIsModalOpen(false); setIsAnalyticsModalOpen(false); setIsCategoryModalOpen(false); setIsRoutineModalOpen(false); setIsAnniversaryModalOpen(false); setIsGalleryOpen(false); setIsTravelMapOpen(true); setIsSidebarOpen(false); }} style={{ padding: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                  <Globe size={18} color="#10B981" /> <span style={{ fontWeight: 'bold' }}>トラベル・マップ</span>
                </button>
              </div>
            )}
          </div>

          {/* 設定・マスターデータ */}
          <div>
            <AccordionHeader id="settings" title="各種設定・マスター管理" icon={Settings2} />
            {expanded.includes('settings') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--card-bg)', padding: '8px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <button onClick={() => { setIsModalOpen(false); setIsCategoryModalOpen(true); setIsSidebarOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Palette size={16} color="var(--text-sub)" /> <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>ジャンル・記録項目</span>
                </button>
                
                {/* 👇 復活：毎月の予定・支払い管理 */}
                <button onClick={() => { setIsModalOpen(false); setIsRoutineModalOpen(true); setIsSidebarOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Repeat size={16} color="var(--text-sub)" /> <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>毎月の予定 (給料・支払い等)</span>
                </button>
                
                <button onClick={() => { setMode('subscription'); setIsModalOpen(true); setIsSidebarOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Banknote size={16} color="var(--text-sub)" /> <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>サブスク管理 (毎月/毎年)</span>
                </button>
                <button onClick={() => { setIsModalOpen(false); setIsAnniversaryModalOpen(true); setIsSidebarOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Gift size={16} color="var(--text-sub)" /> <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>記念日管理</span>
                </button>
              </div>
            )}
          </div>

          {/* 出発地・ルート設定 */}
          <div>
            <AccordionHeader id="transit" title="出発地・ルート検索設定" icon={MapPin} />
            {expanded.includes('transit') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Target size={14} color="var(--text-sub)" /> ルート検索の基準
                  </label>
                  <select className="pop-input" value={startPointType} onChange={e => setStartPointType(e.target.value)} style={{ height: '40px', fontSize: '0.85rem', padding: '0 10px', background: 'var(--bg-main)' }}>
                    <option value="address">自宅の住所から出発</option>
                    <option value="station">最寄り駅から出発</option>
                  </select>
                </div>
                {startPointType === 'address' ? (
                  <div style={{ animation: 'fadeIn 0.3s' }}>
                    <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Home size={14} color="var(--theme)" /> 自宅の住所
                    </label>
                    <input type="text" className="pop-input" value={homeLocation} onChange={e => setHomeLocation(e.target.value)} placeholder="東京都渋谷区..." style={{ height: '40px', fontSize: '0.85rem', padding: '0 12px' }} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', animation: 'fadeIn 0.3s' }}>
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Train size={14} color="var(--theme)" /> 最寄り駅
                      </label>
                      <input type="text" className="pop-input" value={nearestStation} onChange={e => setNearestStation(e.target.value)} placeholder="渋谷駅" style={{ height: '40px', fontSize: '0.85rem', padding: '0 12px' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', margin: 0, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Footprints size={14} color="var(--theme)" /> 駅までの徒歩
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                        <input type="number" className="pop-input no-spin" value={walkTime} onChange={e => setWalkTime(e.target.value)} style={{ height: '40px', fontSize: '1rem', textAlign: 'center', padding: '0 10px' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--text-main)' }}>分</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

      {/* トラベルマップ（日本地図）モーダル */}
      {isTravelMapOpen && (() => {
        const PREF_DATA = [
          { id: 'HK', name: '北海道', x: 14, y: 1 }, { id: 'AO', name: '青森', x: 14, y: 3 },
          { id: 'AK', name: '秋田', x: 13, y: 4 }, { id: 'IW', name: '岩手', x: 14, y: 4 },
          { id: 'YM', name: '山形', x: 13, y: 5 }, { id: 'MG', name: '宮城', x: 14, y: 5 },
          { id: 'NI', name: '新潟', x: 13, y: 6 }, { id: 'FS', name: '福島', x: 14, y: 6 },
          { id: 'TY', name: '富山', x: 12, y: 6 }, { id: 'IS', name: '石川', x: 11, y: 6 },
          { id: 'FI', name: '福井', x: 11, y: 7 }, { id: 'GU', name: '群馬', x: 13, y: 7 },
          { id: 'TC', name: '栃木', x: 14, y: 7 }, { id: 'NN', name: '長野', x: 12, y: 7 },
          { id: 'YN', name: '山梨', x: 12, y: 8 }, { id: 'SA', name: '埼玉', x: 13, y: 8 },
          { id: 'IB', name: '茨城', x: 14, y: 8 }, { id: 'TO', name: '東京', x: 13, y: 9 },
          { id: 'CH', name: '千葉', x: 14, y: 9 }, { id: 'KN', name: '神奈川', x: 13, y: 10 },
          { id: 'SZ', name: '静岡', x: 12, y: 9 }, { id: 'AI', name: '愛知', x: 11, y: 9 },
          { id: 'GF', name: '岐阜', x: 11, y: 8 }, { id: 'SH', name: '滋賀', x: 10, y: 8 },
          { id: 'ME', name: '三重', x: 10, y: 9 }, { id: 'KY', name: '京都', x: 9, y: 8 },
          { id: 'NR', name: '奈良', x: 10, y: 10 },{ id: 'WK', name: '和歌山', x: 9, y: 10 },
          { id: 'OS', name: '大阪', x: 9, y: 9 }, { id: 'HY', name: '兵庫', x: 8, y: 8 },
          { id: 'TT', name: '鳥取', x: 7, y: 8 }, { id: 'OK', name: '岡山', x: 7, y: 9 },
          { id: 'SM', name: '島根', x: 6, y: 8 }, { id: 'HI', name: '広島', x: 6, y: 9 },
          { id: 'YA', name: '山口', x: 5, y: 9 }, { id: 'KG', name: '香川', x: 7, y: 11 },
          { id: 'TK', name: '徳島', x: 8, y: 11 }, { id: 'EH', name: '愛媛', x: 6, y: 11 },
          { id: 'KO', name: '高知', x: 7, y: 12 }, { id: 'FO', name: '福岡', x: 4, y: 9 },
          { id: 'OI', name: '大分', x: 4, y: 10 }, { id: 'SG', name: '佐賀', x: 3, y: 9 },
          { id: 'KU', name: '熊本', x: 3, y: 10 }, { id: 'NS', name: '長崎', x: 2, y: 9 },
          { id: 'MZ', name: '宮崎', x: 4, y: 11 }, { id: 'KG2', name: '鹿児島', x: 3, y: 11 },
          { id: 'OKN', name: '沖縄', x: 1, y: 13 },
        ];

        const cycleStatus = (id: string) => {
          setVisitedPrefs(prev => ({ ...prev, [id]: ((prev[id] || 0) + 1) % 4 }));
        };

        const getStatusColor = (level: number) => {
          if (level === 1) return hexToRgba(themeColor, 0.25);
          if (level === 2) return hexToRgba(themeColor, 0.6);
          if (level === 3) return themeColor;
          return 'var(--input-bg)';
        };

        const visitedCount = Object.values(visitedPrefs).filter(v => v > 0).length;

        return (
          <div className="modal-overlay" onClick={() => setIsTravelMapOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', borderRadius: '28px', border: '1px solid var(--glass-border)', overflowY: 'auto', maxHeight: '90vh', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '24px' }}>
              <ModalHeader title="トラベル・マップ" onClose={() => setIsTravelMapOpen(false)} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', padding: '0 8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>全国制覇まで</span>
                  <span style={{ fontSize: '1.8rem', fontWeight: '900', color: themeColor, lineHeight: 1 }}>{visitedCount} <span style={{ fontSize: '1rem', color: 'var(--text-sub)' }}>/ 47</span></span>
                </div>
                
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button onClick={() => setMapZoom(prev => Math.max(1, prev - 0.5))} disabled={mapZoom <= 1} style={{ width: '32px', height: '32px', fontSize: '1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: mapZoom <= 1 ? 'default' : 'pointer', opacity: mapZoom <= 1 ? 0.3 : 1 }}>－</button>
                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', width: '36px', textAlign: 'center', color: 'var(--text-sub)' }}>x{mapZoom}</span>
                  <button onClick={() => setMapZoom(prev => Math.min(3, prev + 0.5))} disabled={mapZoom >= 3} style={{ width: '32px', height: '32px', fontSize: '1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: mapZoom >= 3 ? 'default' : 'pointer', opacity: mapZoom >= 3 ? 0.3 : 1 }}>＋</button>
                </div>
              </div>

              <div style={{ background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', marginBottom: '20px', overflow: 'hidden' }}>
                <div className="hide-scrollbar" style={{ width: '100%', aspectRatio: '1 / 1', overflow: 'auto', touchAction: 'pan-x pan-y' }}>
                  <div style={{ 
                    display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gridTemplateRows: 'repeat(13, 1fr)', gap: '4px', 
                    width: `${mapZoom * 100}%`, height: `${mapZoom * 100}%`, padding: '16px', transition: 'width 0.2s, height 0.2s' 
                  }}>
                    {PREF_DATA.map(pref => {
                      const level = visitedPrefs[pref.id] || 0;
                      return (
                        <div
                          key={pref.id}
                          onClick={() => cycleStatus(pref.id)}
                          style={{
                            gridColumn: pref.x, gridRow: pref.y,
                            background: getStatusColor(level),
                            border: `1px solid ${level > 0 ? getStatusColor(level) : 'var(--border-color)'}`,
                            borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: level === 3 ? `0 2px 8px ${themeColor}60` : 'none',
                            userSelect: 'none'
                          }}
                        >
                          <span style={{ fontSize: '0.6rem', fontWeight: '900', color: level > 1 ? '#fff' : 'var(--text-sub)' }}>
                            {pref.name[0]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', background: 'var(--input-bg)', padding: '12px', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}/> 未踏</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: getStatusColor(1) }}/> 昔</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: getStatusColor(2) }}/> 近年</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: getStatusColor(3) }}/> 今年</div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 収支履歴の独立モーダル */}
      {isFinanceHistoryOpen && (() => {
        const tMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const tYear = String(new Date().getFullYear());
        
        const ledgerHistory = events.filter((e: any) => {
          const cat = e.extendedProps?.category;
          const f = e.extendedProps?.metadata?.customFields;
          return cat === '収支記録' || f?.isExpenseSet || f?.isIncomeSet || f?.standardExpenseAmount || f?.standardIncomeAmount;
        }).filter((e: any) => {
          if (historySpan === 'month') return e.start && e.start.startsWith(tMonth);
          if (historySpan === 'year') return e.start && e.start.startsWith(tYear);
          return true;
        }).sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

        const filteredHistory = ledgerHistory.filter((e: any) => {
          const isIncome = e.extendedProps?.metadata?.customFields?.isIncomeSet;
          if (financeTypeFilter === 'income') return isIncome;
          if (financeTypeFilter === 'expense') return !isIncome;
          return true;
        });

        return (
          <div className="modal-overlay" onClick={() => setIsFinanceHistoryOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', borderRadius: '28px', border: '1px solid var(--glass-border)', overflowY: 'auto', maxHeight: '90vh', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '24px' }}>
              <ModalHeader title="すべての収支履歴" onClose={() => setIsFinanceHistoryOpen(false)} />
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button onClick={() => setHistorySpan('month')} className={historySpan === 'month' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '0.8rem', borderRadius: '12px' }}>今月</button>
                <button onClick={() => setHistorySpan('year')} className={historySpan === 'year' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '0.8rem', borderRadius: '12px' }}>今年</button>
                <button onClick={() => setHistorySpan('all')} className={historySpan === 'all' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '0.8rem', borderRadius: '12px' }}>全期間</button>
              </div>

              {/* 収入・支出の切り替えタブ */}
              <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <button onClick={() => setFinanceTypeFilter('all')} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: financeTypeFilter === 'all' ? 'var(--card-bg)' : 'transparent', color: financeTypeFilter === 'all' ? 'var(--text-main)' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', boxShadow: financeTypeFilter === 'all' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}>すべて</button>
                <button onClick={() => setFinanceTypeFilter('income')} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: financeTypeFilter === 'income' ? 'rgba(16,185,129,0.1)' : 'transparent', color: financeTypeFilter === 'income' ? '#10b981' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}>収入のみ</button>
                <button onClick={() => setFinanceTypeFilter('expense')} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: financeTypeFilter === 'expense' ? 'rgba(239,68,68,0.1)' : 'transparent', color: financeTypeFilter === 'expense' ? '#ef4444' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}>支出のみ</button>
              </div>

              <div className="hide-scrollbar" style={{ maxHeight: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                {filteredHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-sub)', padding: '24px' }}>記録がありません</div>
                ) : (
                  filteredHistory.map((e: any) => {
                    const isIncome = e.extendedProps?.metadata?.customFields?.isIncomeSet;
                    const amount = isIncome 
                      ? e.extendedProps?.metadata?.customFields?.standardIncomeAmount 
                      : e.extendedProps?.metadata?.customFields?.standardExpenseAmount;
                    const dateStr = e.start.split('T')[0].replace(/-/g, '/');
                    
                    // 👇 追加：支払方法のバッジ表示
                    const method = e.extendedProps?.metadata?.customFields?.paymentMethod || 'cash';
                    const methodLabel = !isIncome ? (
                      method === 'credit' ? '💳 クレカ' :
                      method === 'paypay' ? '📱 スマホ決済' :
                      method === 'ic' ? '🪪 交通系IC' :
                      method === 'reimburse' ? '🔄 立替' : '💴 現金'
                    ) : (
                      method === 'bank' ? '🏦 振込' :
                      method === 'paypay' ? '📱 電子マネー' : '💴 現金'
                    );

                    return (
                      <div key={e.id} onClick={() => { setIsFinanceHistoryOpen(false); setIsSidebarOpen(false); handleEventClick({ event: e }); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{e.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {dateStr}
                            <span style={{ marginLeft: '4px', background: 'var(--input-bg)', padding: '2px 6px', borderRadius: '6px', fontSize: '0.65rem' }}>{methodLabel}</span>
                          </div>
                        </div>
                        <div style={{ fontWeight: '900', color: isIncome ? '#10b981' : '#ef4444', fontSize: '1.2rem', flexShrink: 0 }}>
                          {isIncome ? '+' : '-'}¥{Number(amount || 0).toLocaleString()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        );
      })()}

    </>
  );
}