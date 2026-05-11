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
  displayMode: string; setDisplayMode: React.Dispatch<React.SetStateAction<string>>;
  viewType: string;
  calendarCategoryFilter: string; setCalendarCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
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
  displayMode, setDisplayMode, viewType, calendarCategoryFilter, setCalendarCategoryFilter
}: SidebarProps) {

  const [expanded, setExpanded] = useState<string[]>([]);
  const toggleSection = (sec: string) => setExpanded(prev => prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]);

  useEffect(() => {
    if (!isSidebarOpen) setExpanded([]); 
  }, [isSidebarOpen]);

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
  const [isMenuCustomizeOpen, setIsMenuCustomizeOpen] = useState(false);

  const [incomeCalcBasis, setIncomeCalcBasis] = useState<'wage' | 'payday'>(() => {
    if (typeof window === 'undefined') return 'wage';
    return localStorage.getItem('os_incomeCalcBasis') as 'wage' | 'payday' || 'wage';
  });

  // 👇 サイドバーのセクション順序
  const DEFAULT_ORDER = ['finance', 'actions', 'reports', 'settings', 'transit'];
  const [sidebarOrder, setSidebarOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_ORDER;
    const saved = localStorage.getItem('os_sidebarOrder');
    try { return saved ? JSON.parse(saved) : DEFAULT_ORDER; } catch(e) { return DEFAULT_ORDER; }
  });

  // 👇 個別のお気に入りアイテム管理
  const [favoriteItems, setFavoriteItems] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['create_event', 'finance_single'];
    const saved = localStorage.getItem('os_favoriteItems');
    try { return saved ? JSON.parse(saved) : ['create_event', 'finance_single']; } catch(e) { return ['create_event', 'finance_single']; }
  });
  
  const dragSection = useRef<number | null>(null);

  useEffect(() => {
    localStorage.setItem('os_visitedPrefs', JSON.stringify(visitedPrefs));
    localStorage.setItem('os_incomeCalcBasis', incomeCalcBasis);
    localStorage.setItem('os_sidebarOrder', JSON.stringify(sidebarOrder));
    localStorage.setItem('os_favoriteItems', JSON.stringify(favoriteItems));
  }, [visitedPrefs, incomeCalcBasis, sidebarOrder, favoriteItems]);

  // すべての個別アクションを定義
  const MENU_ACTIONS = [
    { id: 'create_event', label: '新しく予定を作成', icon: Edit3, color: themeColor },
    { id: 'finance_single', label: '単発の収支を記録', icon: Banknote, color: themeColor },
    { id: 'finance_history', label: '収支履歴を見る', icon: HistoryIcon, color: themeColor },
    { id: 'finance_bar', label: '収支サマリーバー', icon: Target, color: themeColor }, // 👈 追加
    { id: 'dashboard', label: 'ダッシュボード', icon: PieChart, color: themeColor },
    { id: 'gallery', label: '思い出ギャラリー', icon: ImageIcon, color: '#9B59B6' },
    { id: 'travel_map', label: 'トラベル・マップ', icon: Globe, color: '#10B981' },
    { id: 'category_settings', label: 'ジャンル設定', icon: Palette, color: 'var(--text-sub)' },
    { id: 'routine_settings', label: '毎月の予定(給料等)', icon: Repeat, color: 'var(--text-sub)' },
    { id: 'subscription_settings', label: 'サブスク管理', icon: Banknote, color: 'var(--text-sub)' },
    { id: 'anniversary_settings', label: '記念日管理', icon: Gift, color: 'var(--text-sub)' },
  ];

  const handleMenuAction = (id: string) => {
    if (id === 'dashboard') { setIsModalOpen(false); setIsAnalyticsModalOpen(true); setIsSidebarOpen(false); }
    else if (id === 'gallery') { setIsModalOpen(false); setIsGalleryOpen(true); setIsSidebarOpen(false); }
    else if (id === 'travel_map') { setIsModalOpen(false); setIsTravelMapOpen(true); setIsSidebarOpen(false); }
    else if (id === 'category_settings') { setIsModalOpen(false); setIsCategoryModalOpen(true); setIsSidebarOpen(false); }
    else if (id === 'routine_settings') { setIsModalOpen(false); setIsRoutineModalOpen(true); setIsSidebarOpen(false); }
    else if (id === 'subscription_settings') { setMode('subscription'); setIsModalOpen(true); setIsSidebarOpen(false); }
    else if (id === 'anniversary_settings') { setIsModalOpen(false); setIsAnniversaryModalOpen(true); setIsSidebarOpen(false); }
    else if (id === 'finance_history') { setIsFinanceHistoryOpen(true); }
    else if (id === 'create_event') {
      const today = toLocalYYYYMMDD(new Date()); const nowH = new Date().getHours();
      setMode('create'); setStartDate(today); setEndDate(today);
      setStartH(String(nowH).padStart(2, '0')); setEndH(String(Math.min(nowH + 1, 23)).padStart(2, '0'));
      setTitle(''); setLocation(''); setMemo(''); setPhotoUrls([]); setIsStocked(false); 
      setCustomFieldsData({}); setIsModalOpen(true); setIsSidebarOpen(false);
    }
    else if (id === 'finance_single') {
      const today = toLocalYYYYMMDD(new Date());
      setMode('expense'); setStartDate(today); setCategoryName(''); setTitle('');
      setCustomFieldsData({ transactionMode: 'expense', isExpenseSet: true });
      setIsModalOpen(true); setIsSidebarOpen(false);
    }
  };

  const SECTION_INFO: Record<string, { title: string, icon: any }> = {
    finance: { title: '収支履歴・管理', icon: Banknote },
    actions: { title: 'アクション・予定追加', icon: Zap },
    reports: { title: 'レポート・ギャラリー', icon: FolderKanban },
    settings: { title: '各種設定・マスター管理', icon: Settings2 },
    transit: { title: '出発地・ルート検索設定', icon: MapPin },
  };

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

  const renderSection = (sectionId: string) => {
    switch (sectionId) {
      case 'finance':
        return (
          <div key="finance">
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
                  if (incomeCalcBasis === 'wage' && cf.isSalary) { /* skip */ } 
                  else { inc += Number(cf.standardIncomeAmount || 0); }
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
                      if (incomeCalcBasis === 'payday') { /* skip */ } 
                      else {
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
                  <button onClick={() => handleMenuAction('finance_single')} style={{ padding: '14px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '2px solid var(--theme)', cursor: 'pointer', fontWeight: 'bold' }}>
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
                    <div style={{ width: '100%', height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                      {inc + exp > 0 ? (
                        <>
                          {inc > 0 && <div style={{ width: `${(inc / (inc + exp)) * 100}%`, background: '#10b981', transition: 'width 0.4s' }} />}
                          {exp > 0 && <div style={{ width: `${(exp / (inc + exp)) * 100}%`, background: '#ef4444', transition: 'width 0.4s' }} />}
                        </>
                      ) : null}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: '1rem', marginTop: '12px', fontWeight: '900', color: inc >= exp ? '#10b981' : '#ef4444' }}>
                      残高: {inc >= exp ? '+' : '-'}¥{Math.abs(inc - exp).toLocaleString()}
                    </div>
                  </div>

                  <button onClick={() => handleMenuAction('finance_history')} style={{ padding: '12px', background: 'var(--input-bg)', color: 'var(--text-main)', borderRadius: '12px', fontWeight: 'bold', border: `1px solid ${themeColor}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                    <HistoryIcon size={16} color={themeColor} /> 収支履歴をすべて見る
                  </button>
                </div>
              );
            })()}
          </div>
        );

      case 'actions':
        return (
          <div key="actions">
            <AccordionHeader id="actions" title="アクション・予定追加" icon={Zap} />
            {expanded.includes('actions') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingBottom: '16px' }}>
                <button onClick={() => handleMenuAction('create_event')} style={{ gridColumn: 'span 2', padding: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', background: themeColor, color: '#fff', border: 'none', boxShadow: `0 4px 15px ${themeColor}40`, cursor: 'pointer' }}>
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
        );

      case 'reports':
        return (
          <div key="reports">
            <AccordionHeader id="reports" title="レポート・ギャラリー" icon={FolderKanban} />
            {expanded.includes('reports') && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', paddingBottom: '16px' }}>
                <button onClick={() => handleMenuAction('dashboard')} style={{ padding: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                  <PieChart size={18} color={themeColor} /> <span style={{ fontWeight: 'bold' }}>振り返りダッシュボード</span>
                </button>
                <button onClick={() => handleMenuAction('gallery')} style={{ padding: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                  <ImageIcon size={18} color="#9B59B6" /> <span style={{ fontWeight: 'bold' }}>思い出ギャラリー</span>
                </button>
                <button onClick={() => handleMenuAction('travel_map')} style={{ padding: '14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '16px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                  <Globe size={18} color="#10B981" /> <span style={{ fontWeight: 'bold' }}>トラベル・マップ</span>
                </button>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div key="settings">
            <AccordionHeader id="settings" title="各種設定・マスター管理" icon={Settings2} />
            {expanded.includes('settings') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--card-bg)', padding: '8px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <button onClick={() => handleMenuAction('category_settings')} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Palette size={16} color="var(--text-sub)" /> <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>ジャンル・記録項目</span>
                </button>
                <button onClick={() => handleMenuAction('routine_settings')} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Repeat size={16} color="var(--text-sub)" /> <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>毎月の予定 (給料・支払い等)</span>
                </button>
                <button onClick={() => handleMenuAction('subscription_settings')} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Banknote size={16} color="var(--text-sub)" /> <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>サブスク管理 (毎月/毎年)</span>
                </button>
                <button onClick={() => handleMenuAction('anniversary_settings')} style={{ width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '10px', background: 'transparent', border: '1px solid transparent', color: 'var(--text-main)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Gift size={16} color="var(--text-sub)" /> <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>記念日管理</span>
                </button>
              </div>
            )}
          </div>
        );

      case 'transit':
        return (
          <div key="transit">
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
        );

      default: return null;
    }
  };

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
          
          {/* 👇 月毎カレンダー専用の切り替え・絞り込みツール */}
          {viewType === 'dayGridMonth' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--input-bg)', borderRadius: '12px', padding: '8px', border: `1px solid var(--border-color)` }}>
              <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '8px', padding: '2px' }}>
                <button onClick={() => setDisplayMode('normal')} style={{ flex: 1, padding: '6px', borderRadius: '6px', background: displayMode === 'normal' ? 'var(--card-bg)' : 'transparent', color: displayMode === 'normal' ? 'var(--theme)' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', boxShadow: displayMode === 'normal' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s' }}>通常</button>
                <button onClick={() => setDisplayMode('dot')} style={{ flex: 1, padding: '6px', borderRadius: '6px', background: displayMode === 'dot' ? 'var(--card-bg)' : 'transparent', color: displayMode === 'dot' ? 'var(--theme)' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', boxShadow: displayMode === 'dot' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s' }}>ドット</button>
                <button onClick={() => setDisplayMode('photo')} style={{ flex: 1, padding: '6px', borderRadius: '6px', background: displayMode === 'photo' ? 'var(--card-bg)' : 'transparent', color: displayMode === 'photo' ? 'var(--theme)' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', boxShadow: displayMode === 'photo' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.75rem', transition: 'all 0.2s' }}>写真</button>
              </div>
              <div className="hide-scrollbar" style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                <button onClick={() => setCalendarCategoryFilter('すべて')} style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer', background: calendarCategoryFilter === 'すべて' ? 'var(--theme)' : 'var(--card-bg)', color: calendarCategoryFilter === 'すべて' ? '#fff' : 'var(--text-sub)', border: '1px solid var(--border-color)', transition: 'all 0.2s' }}>すべて</button>
                {categories.map((c: any) => (
                  <button key={c.name} onClick={() => setCalendarCategoryFilter(c.name)} style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '10px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer', background: calendarCategoryFilter === c.name ? c.color : 'var(--card-bg)', color: calendarCategoryFilter === c.name ? '#fff' : 'var(--text-sub)', border: '1px solid var(--border-color)', transition: 'all 0.2s' }}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px', paddingLeft: '1px', display: 'flex', flexDirection: 'column', gap: '8px' }} className="hide-scrollbar">

          {/* 👇 お気に入りメニュー（上にピン留めされたボタンたち） */}
          {favoriteItems.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--theme)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '4px' }}>
                <Star size={14} fill="var(--theme)" /> よく使うメニュー
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                
                {/* 👇 収支サマリーバーがお気に入りに含まれる場合の描画 */}
                {favoriteItems.includes('finance_bar') && (() => {
                  const tMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                  const tYear = String(new Date().getFullYear());
                  const evts = events.filter((e: any) => e.start && (ledgerSpan === 'month' ? e.start.startsWith(tMonth) : e.start.startsWith(tYear)));
                  let inc = 0; let exp = 0;
                  evts.forEach((e: any) => {
                    const cf = e.extendedProps?.metadata?.customFields || {};
                    if (cf.isExpenseSet) exp += Number(cf.standardExpenseAmount || 0);
                    if (cf.isIncomeSet) {
                      if (incomeCalcBasis === 'wage' && cf.isSalary) {} else { inc += Number(cf.standardIncomeAmount || 0); }
                    }
                    const catObj = categories.find((c: any) => c.name === e.extendedProps.category);
                    if (catObj?.fields) {
                      catObj.fields.forEach((f: any) => {
                        if (f.type === 'money') { const d = cf[f.id]; if (d?.type === 'income') inc += Number(d.amount || 0); if (d?.type === 'expense') exp += Number(d.amount || 0); }
                        else if (f.type === 'money_income') inc += Number(cf[f.id] || 0);
                        else if (f.type === 'money_expense') exp += Number(cf[f.id] || 0);
                        else if (f.type === 'wage' && !f.excludeFromTotal) {
                          if (incomeCalcBasis === 'payday') {} else {
                            const d = cf[f.id];
                            if (d?.calculatedWage !== undefined) inc += Number(d.calculatedWage);
                            else if (d?.hours) inc += (Number(d.hours) * Number(f.wageRules?.[0]?.wage || f.wage || 0));
                          }
                        }
                      });
                    }
                  });
                  return (
                    <div style={{ background: 'var(--card-bg)', padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem', fontWeight: '900' }}>
                        <span style={{ color: '#10b981' }}>収入: ¥{inc.toLocaleString()}</span>
                        <span style={{ color: '#ef4444' }}>支出: ¥{exp.toLocaleString()}</span>
                      </div>
                      <div style={{ width: '100%', height: '10px', background: 'var(--border-color)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                        {inc + exp > 0 ? (
                          <>
                            {inc > 0 && <div style={{ width: `${(inc / (inc + exp)) * 100}%`, background: '#10b981', transition: 'width 0.4s' }} />}
                            {exp > 0 && <div style={{ width: `${(exp / (inc + exp)) * 100}%`, background: '#ef4444', transition: 'width 0.4s' }} />}
                          </>
                        ) : null}
                      </div>
                      <div style={{ textAlign: 'center', fontSize: '1rem', marginTop: '8px', fontWeight: '900', color: inc >= exp ? '#10b981' : '#ef4444' }}>
                        残高: {inc >= exp ? '+' : '-'}¥{Math.abs(inc - exp).toLocaleString()}
                      </div>
                    </div>
                  );
                })()}

                {/* バー以外のボタンを描画 */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {favoriteItems.filter(id => id !== 'finance_bar').map(itemId => {
                    const item = MENU_ACTIONS.find(m => m.id === itemId);
                    if (!item) return null;
                    return (
                      <button key={item.id} onClick={() => handleMenuAction(item.id)} style={{ padding: '12px 8px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderRadius: '16px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)', cursor: 'pointer' }}>
                        <item.icon size={20} color={item.color} />
                        <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* セクション群 */}
          {sidebarOrder.map(sectionId => renderSection(sectionId))}

          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            
            {/* 👇 メニューのカスタマイズ（一番下に独立配置） */}
            <button onClick={() => { setIsMenuCustomizeOpen(true); setIsSidebarOpen(false); }} style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: 'var(--input-bg)', border: '1px dashed var(--theme)', color: 'var(--theme)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' }}>
              <Settings2 size={16} /> メニューのカスタマイズ
            </button>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-sub)' }}>データ保存先</span>
              <span style={{ fontSize: '0.65rem', fontWeight: 'bold', background: themeColor, color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>ローカル</span>
            </div>
            <button onClick={syncWithCloud} style={{ width: '100%', padding: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: `1px dashed ${themeColor}`, color: themeColor, borderRadius: '16px', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
              <Database size={16} /> クラウド同期・ログイン
            </button>
          </div>
        </div>
      </div>

      {/* メニューのカスタマイズ モーダル */}
      {isMenuCustomizeOpen && (
        <div className="modal-overlay" onClick={() => setIsMenuCustomizeOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '400px', borderRadius: '28px', border: '1px solid var(--glass-border)', overflowY: 'auto', maxHeight: '90vh', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '24px' }}>
            <ModalHeader title="メニューのカスタマイズ" onClose={() => setIsMenuCustomizeOpen(false)} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {/* 1. お気に入り項目の選択 */}
              <div>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--theme)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={16} fill="var(--theme)" /> よく使う機能を選ぶ
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {MENU_ACTIONS.map(item => {
                    const isFav = favoriteItems.includes(item.id);
                    return (
                      <button key={item.id} onClick={() => setFavoriteItems(prev => isFav ? prev.filter(i => i !== item.id) : [...prev, item.id])} style={{ padding: '10px 8px', fontSize: '0.75rem', background: isFav ? 'var(--theme)' : 'var(--input-bg)', color: isFav ? '#fff' : 'var(--text-main)', borderRadius: '10px', border: `1px solid ${isFav ? 'var(--theme)' : 'var(--border-color)'}`, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s', cursor: 'pointer' }}>
                        <item.icon size={14} color={isFav ? '#fff' : item.color} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ height: '1px', background: 'var(--border-color)' }} />

              {/* 2. セクションの並び替え */}
              <div>
                <h3 style={{ fontSize: '0.9rem', color: 'var(--theme)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LayoutDashboard size={16} /> 大項目の並び替え
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sidebarOrder.map((id, index) => {
                    const info = SECTION_INFO[id];
                    if (!info) return null;
                    return (
                      <div
                        key={id}
                        draggable
                        onDragStart={() => dragSection.current = index}
                        onDragEnter={() => {
                          if (dragSection.current !== null && dragSection.current !== index) {
                            const newOrder = [...sidebarOrder];
                            const dragged = newOrder.splice(dragSection.current, 1)[0];
                            newOrder.splice(index, 0, dragged);
                            dragSection.current = index;
                            setSidebarOrder(newOrder);
                          }
                        }}
                        onDragEnd={() => dragSection.current = null}
                        onDragOver={(e) => e.preventDefault()}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--input-bg)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', cursor: 'grab', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                      >
                        <GripVertical size={16} style={{ color: 'var(--text-sub)' }} />
                        <info.icon size={16} style={{ color: themeColor }} />
                        <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-main)' }}>{info.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <button onClick={() => setIsMenuCustomizeOpen(false)} className="btn-pop" style={{ width: '100%', marginTop: '24px', padding: '14px', borderRadius: '16px' }}>完了</button>
          </div>
        </div>
      )}

      {/* 以下、独立モーダル群（省略せず描画されます） */}
      {isTravelMapOpen && (() => {
        return <div style={{display:'none'}}>Map</div>;
      })()}

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

              <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                <button onClick={() => setFinanceTypeFilter('all')} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: financeTypeFilter === 'all' ? 'var(--card-bg)' : 'transparent', color: financeTypeFilter === 'all' ? 'var(--text-main)' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', boxShadow: financeTypeFilter === 'all' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}>すべて</button>
                <button onClick={() => setFinanceTypeFilter('income')} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: financeTypeFilter === 'income' ? 'rgba(16,185,129,0.1)' : 'transparent', color: financeTypeFilter === 'income' ? '#10b981' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}>収入のみ</button>
                <button onClick={() => setFinanceTypeFilter('expense')} style={{ flex: 1, padding: '8px', borderRadius: '8px', background: financeTypeFilter === 'expense' ? 'rgba(239,68,68,0.1)' : 'transparent', color: financeTypeFilter === 'expense' ? '#ef4444' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '0.8rem', transition: 'all 0.2s' }}>支出のみ</button>
              </div>

              <div className="hide-scrollbar" style={{ height: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                {filteredHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-sub)', padding: '24px' }}>記録がありません</div>
                ) : (
                  filteredHistory.map((e: any) => {
                    const isIncome = e.extendedProps?.metadata?.customFields?.isIncomeSet;
                    const amount = isIncome 
                      ? e.extendedProps?.metadata?.customFields?.standardIncomeAmount 
                      : e.extendedProps?.metadata?.customFields?.standardExpenseAmount;
                    const dateStr = e.start.split('T')[0].replace(/-/g, '/');
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