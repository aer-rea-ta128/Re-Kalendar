'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Moon, Sun, Clock, Target, Star, Edit3, 
  PieChart, Image as ImageIcon, Palette, Repeat, Gift, Database, Banknote, MapPin, Home, Train, Footprints,
  ChevronDown, ChevronRight, LayoutDashboard, Zap, FolderKanban, Settings2, Globe, History as HistoryIcon, GripVertical,
  LogOut, User, TrendingUp, Users, Send, MessageSquare, Handshake, CheckCircle, Trash2,
  CreditCard, Smartphone, Landmark // 👈 スマートアイコンを完全対応させるために追加
} from 'lucide-react';
import { toLocalYYYYMMDD, hexToRgba } from '@/app/lib/utils';
import { supabase } from '@/lib/supabase';

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
  setQuickTemplates: React.Dispatch<React.SetStateAction<any[]>>;
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
  setIsTentative: React.Dispatch<React.SetStateAction<boolean>>;
  setRating: React.Dispatch<React.SetStateAction<number>>;
  setIsPinned: React.Dispatch<React.SetStateAction<boolean>>;
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
  activeUserId: string | null;
  activeUserName: string;
  activeUserAvatar: string;
  setActiveUserAvatar: React.Dispatch<React.SetStateAction<string>>;
  setActiveUserName: React.Dispatch<React.SetStateAction<string>>;
  onLogout: () => void;
  setIsFinanceGraphOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsScheduleAssistantOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAdvanceModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({
  isSidebarOpen, setIsSidebarOpen, setOpenSections, themeColor,
  searchQuery, setSearchQuery, handleSearchExecute, setIsSearchMode,
  setIsColorPickerOpen, isDarkMode, setIsDarkMode,
  events, categories, targetType, setTargetType, targetValue, setTargetValue,
  currentMonthEvents, currentYearEvents, quickTemplates, setQuickTemplates,
  setMode, setStartDate, setEndDate, setStartH, setStartM, setEndH, setEndM,
  setTitle, setLocation, setMemo, setPhotoUrls, setIsStocked,
  setIsTentative, setRating, setIsPinned, setIsModalOpen,
  setCategoryName, setIsAllDayBackground, setEventColor,
  setIsAnalyticsModalOpen, setIsGalleryOpen, setIsCategoryModalOpen,
  setIsRoutineModalOpen, setIsAnniversaryModalOpen, syncWithCloud, handleEventClick,
  setCustomFieldsData, homeLocation, setHomeLocation, nearestStation, setNearestStation,
  walkTime, setWalkTime, startPointType, setStartPointType,
  displayMode, setDisplayMode, viewType, calendarCategoryFilter, setCalendarCategoryFilter,
  activeUserId, activeUserName,activeUserAvatar, setActiveUserAvatar, setActiveUserName, onLogout, 
  setIsFinanceGraphOpen, setIsScheduleAssistantOpen, setIsAdvanceModalOpen
}: SidebarProps) {

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [editUserName, setEditUserName] = useState('');
  const [isCategoryHistoryOpen, setIsCategoryHistoryOpen] = useState(false);
  const [historyCategory, setHistoryCategory] = useState('すべて');
  const [historyTimeFilter, setHistoryTimeFilter] = useState<'past' | 'future'>('past'); 
  const [viewingPartner, setViewingPartner] = useState<string | null>(null); 

  const [isTravelMapOpen, setIsTravelMapOpen] = useState(false);
  const [visitedPrefs, setVisitedPrefs] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem('os_visitedPrefs');
    try { return saved ? JSON.parse(saved) : {}; } catch (e) { return {}; }
  });

  const [ledgerSpan, setLedgerSpan] = useState<'month' | 'year'>('month');
  const [historySpan, setHistorySpan] = useState<'month' | 'year' | 'all'>('month');
  const [financeTypeFilter, setFinanceTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [isFinanceHistoryOpen, setIsFinanceHistoryOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [mapZoom, setMapZoom] = useState(1);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);

  const [incomeCalcBasis, setIncomeCalcBasis] = useState<'wage' | 'payday'>(() => {
    if (typeof window === 'undefined') return 'wage';
    return localStorage.getItem('os_incomeCalcBasis') as 'wage' | 'payday' || 'wage';
  });

  const DEFAULT_ORDER = ['finance', 'actions', 'reports', 'settings', 'transit'];
  const [sidebarOrder, setSidebarOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_ORDER;
    const saved = localStorage.getItem('os_sidebarOrder');
    try { return saved ? JSON.parse(saved) : DEFAULT_ORDER; } catch(e) { return DEFAULT_ORDER; }
  });

  const [favoriteItems, setFavoriteItems] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['create_event', 'finance_single'];
    const saved = localStorage.getItem('os_favoriteItems');
    try { return saved ? JSON.parse(saved) : ['create_event', 'finance_single']; } catch(e) { return ['create_event', 'finance_single']; }
  });
  
  const dragSection = useRef<number | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  useEffect(() => {
    localStorage.setItem('os_visitedPrefs', JSON.stringify(visitedPrefs));
    localStorage.setItem('os_incomeCalcBasis', incomeCalcBasis);
    localStorage.setItem('os_sidebarOrder', JSON.stringify(sidebarOrder));
    localStorage.setItem('os_favoriteItems', JSON.stringify(favoriteItems));
  }, [visitedPrefs, incomeCalcBasis, sidebarOrder, favoriteItems]);

  const MENU_ACTIONS = [
    { id: 'create_event', label: '新しく予定を作成', icon: Edit3, color: themeColor },
    { id: 'schedule_assistant', label: '日程調整アシスタント', icon: Users, color: '#f59e0b' }, 
    { id: 'category_history', label: 'ジャンル別の履歴・振り返り', icon: FolderKanban, color: themeColor },
    { id: 'finance_single', label: '単発の収支を記録', icon: Banknote, color: themeColor },
    { id: 'finance_history', label: '収支履歴を見る', icon: HistoryIcon, color: themeColor },
    { id: 'finance_bar', label: '収支サマリーバー', icon: Target, color: themeColor },
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
    else if (id === 'category_history') { setIsCategoryHistoryOpen(true); setIsSidebarOpen(false); }
    else if (id === 'gallery') { setIsModalOpen(false); setIsGalleryOpen(true); setIsSidebarOpen(false); }
    else if (id === 'travel_map') { setIsModalOpen(false); setIsTravelMapOpen(true); setIsSidebarOpen(false); }
    else if (id === 'category_settings') { setIsModalOpen(false); setIsCategoryModalOpen(true); setIsSidebarOpen(false); }
    else if (id === 'schedule_assistant') { setIsScheduleAssistantOpen(true); setIsSidebarOpen(false); } 
    else if (id === 'routine_settings') { setIsModalOpen(false); setIsRoutineModalOpen(true); setIsSidebarOpen(false); }
    else if (id === 'subscription_settings') { setMode('subscription'); setIsModalOpen(true); setIsSidebarOpen(false); }
    else if (id === 'anniversary_settings') { setIsModalOpen(false); setIsAnniversaryModalOpen(true); setIsSidebarOpen(false); }
    else if (id === 'finance_history') { setIsFinanceHistoryOpen(true); }
    else if (id === 'create_event') {
      const today = toLocalYYYYMMDD(new Date()); const nowH = new Date().getHours();
      setMode('create'); setStartDate(today); setEndDate(today);
      setStartH(String(nowH).padStart(2, '0')); setEndH(String(Math.min(nowH + 1, 23)).padStart(2, '0'));
      // 👇 修正：ジャンル・色・写真・ピン留めなどを確実に完全リセットする
      setTitle(''); setLocation(''); setMemo(''); setPhotoUrls([]); setIsStocked(false); 
      setCategoryName(''); setEventColor(''); setIsAllDayBackground(false); setIsTentative(false); setRating(0); setIsPinned(false);
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

  const MenuListItem = ({ icon: Icon, label, onClick, color = 'var(--text-main)' }: any) => (
    <button onClick={onClick} style={{ width: '100%', textAlign: 'left', padding: '12px 14px', borderRadius: '12px', background: 'transparent', border: 'none', color: color, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s', fontWeight: 'bold' }} className="hover-bg-glass">
      <Icon size={18} color={color === 'var(--text-main)' ? themeColor : color} />
      <span>{label}</span>
    </button>
  );

  return (
    <>
      <div onClick={() => { setIsSidebarOpen(false); }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 1999, opacity: isSidebarOpen ? 1 : 0, pointerEvents: isSidebarOpen ? 'auto' : 'none', transition: 'all 0.3s ease' }} />

      <div style={{ position: 'fixed', top: 0, left: 0, width: '85%', maxWidth: '320px', height: '100dvh', borderTopRightRadius: '24px', borderBottomRightRadius: '24px', zIndex: 2000, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)', padding: '24px 20px', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1)', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', boxShadow: isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none', borderRight: '1px solid var(--border-color)' }}>
        
        {/* ヘッダーエリア */}
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
          
          {/* 月毎カレンダー表示時のフィルター */}
          {viewType === 'dayGridMonth' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--input-bg)', borderRadius: '12px', padding: '8px', border: `1px solid var(--border-color)` }}>
              <div style={{ display: 'flex', background: 'var(--bg-main)', borderRadius: '8px', padding: '2px' }}>
                <button onClick={() => setDisplayMode('normal')} style={{ flex: 1, padding: '6px 2px', borderRadius: '6px', background: displayMode === 'normal' ? 'var(--card-bg)' : 'transparent', color: displayMode === 'normal' ? 'var(--theme)' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', boxShadow: displayMode === 'normal' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.7rem', transition: 'all 0.2s' }}>2行</button>
                <button onClick={() => setDisplayMode('compact')} style={{ flex: 1, padding: '6px 2px', borderRadius: '6px', background: displayMode === 'compact' ? 'var(--card-bg)' : 'transparent', color: displayMode === 'compact' ? 'var(--theme)' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', boxShadow: displayMode === 'compact' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.7rem', transition: 'all 0.2s' }}>1行</button>
                <button onClick={() => setDisplayMode('dot')} style={{ flex: 1, padding: '6px 2px', borderRadius: '6px', background: displayMode === 'dot' ? 'var(--card-bg)' : 'transparent', color: displayMode === 'dot' ? 'var(--theme)' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', boxShadow: displayMode === 'dot' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.7rem', transition: 'all 0.2s' }}>ドット</button>
                <button onClick={() => setDisplayMode('photo')} style={{ flex: 1, padding: '6px 2px', borderRadius: '6px', background: displayMode === 'photo' ? 'var(--card-bg)' : 'transparent', color: displayMode === 'photo' ? 'var(--theme)' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', boxShadow: displayMode === 'photo' ? '0 2px 6px rgba(0,0,0,0.05)' : 'none', cursor: 'pointer', fontSize: '0.7rem', transition: 'all 0.2s' }}>写真</button>
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

        {/* スクロール領域：メインメニュー群 */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '5px', display: 'flex', flexDirection: 'column', gap: '24px' }} className="hide-scrollbar">

          {/* ⭐️ お気に入り（クイックアクション） */}
          {favoriteItems.length > 0 && (
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--theme)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px', paddingLeft: '4px' }}>
                <Zap size={14} fill="var(--theme)" /> クイックアクション
              </span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {favoriteItems.filter(id => id !== 'finance_bar').map(itemId => {
                  const item = MENU_ACTIONS.find(m => m.id === itemId);
                  if (!item) return null;
                  return (
                    <button key={item.id} onClick={() => handleMenuAction(item.id)} style={{ padding: '12px 8px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderRadius: '16px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                      <item.icon size={20} color={item.color} />
                      <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center' }}>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {favoriteItems.includes('finance_bar') && (() => {
                const tMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
                const tYear = String(new Date().getFullYear());
                const evts = events.filter((e: any) => e.start && (ledgerSpan === 'month' ? e.start.startsWith(tMonth) : e.start.startsWith(tYear)));
                let inc = 0; let exp = 0;
                evts.forEach((e: any) => {
                  const cf = e.extendedProps?.metadata?.customFields || {};
                  if (cf.isExpenseSet) {
                    if (cf.expenses) { cf.expenses.forEach((ex: any) => { if (ex.type === 'expense' || ex.type === 'advance') exp += Number(ex.amount || 0); if (ex.type === 'income' || ex.type === 'borrow') inc += Number(ex.amount || 0); }); } 
                    else { exp += Number(cf.standardExpenseAmount || 0); }
                  }
                  if (cf.isIncomeSet) { if (incomeCalcBasis === 'wage' && cf.isSalary) {} else { inc += Number(cf.standardIncomeAmount || 0); } }
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
                  <div style={{ background: 'var(--card-bg)', padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', marginTop: '8px' }}>
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
            </div>
          )}

          {/* 📱 アプリケーション（日常的に見る・使うもの） */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)', marginBottom: '8px', display: 'block', paddingLeft: '4px' }}>アプリケーション</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <MenuListItem icon={PieChart} label="振り返りダッシュボード" onClick={() => handleMenuAction('dashboard')} />
              <MenuListItem icon={FolderKanban} label="ジャンル別の履歴" onClick={() => handleMenuAction('category_history')} />
              <MenuListItem icon={Handshake} label="立替・貸し借り管理" onClick={() => { setIsAdvanceModalOpen(true); setIsSidebarOpen(false); }} />
              <MenuListItem icon={HistoryIcon} label="すべての収支履歴・推移" onClick={() => { setIsFinanceHistoryOpen(true); setIsSidebarOpen(false); }} />
              <MenuListItem icon={ImageIcon} label="思い出ギャラリー" onClick={() => handleMenuAction('gallery')} />
              <MenuListItem icon={Globe} label="トラベル・マップ" onClick={() => handleMenuAction('travel_map')} />
            </div>
          </div>
        </div>

        {/* ⚙️ ボトムエリア（設定やアカウント） */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
          
          {activeUserId && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card-bg)', padding: '12px', borderRadius: '16px', border: `1px solid var(--border-color)`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
                  <User size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{activeUserName}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-sub)', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>@{activeUserId}</span>
                </div>
              </div>
              <button onClick={onLogout} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', borderRadius: '12px', flexShrink: 0 }}>
                <LogOut size={16} />
              </button>
            </div>
          )}

          <button onClick={() => { setIsSettingsPanelOpen(true); setIsSidebarOpen(false); }} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', transition: 'background 0.2s' }}>
            <Settings2 size={16} color="var(--theme)" /> アプリ設定と管理
          </button>

          <button onClick={() => { setIsFeedbackModalOpen(true); setIsSidebarOpen(false); }} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', transition: 'background 0.2s' }}>
            <MessageSquare size={16} color="var(--theme)" /> ご要望・不具合の報告
          </button>

          <button onClick={syncWithCloud} style={{ width: '100%', padding: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: `1px dashed var(--theme)`, color: 'var(--theme)', borderRadius: '12px', background: 'transparent', cursor: 'pointer', fontWeight: 'bold' }}>
            <Database size={16} /> クラウド同期
          </button>
        </div>
      </div>

      {/* =========================================
          🛠 アプリ設定と管理パネル（全体モーダル）
      ========================================= */}
      {isSettingsPanelOpen && (
        <div className="modal-overlay" onClick={() => setIsSettingsPanelOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '440px', borderRadius: '28px', border: '1px solid var(--glass-border)', padding: '24px', background: 'var(--bg-main)', color: 'var(--text-main)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <ModalHeader title="アプリ設定と管理" onClose={() => setIsSettingsPanelOpen(false)} />
            
            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', paddingRight: '4px' }}>
              
              {/* マスターデータ管理 */}
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--theme)', marginBottom: '12px', display: 'block' }}>マスターデータの管理</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => { setIsCategoryModalOpen(true); setIsSettingsPanelOpen(false); }} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', fontSize: '0.9rem' }}>
                    <Palette size={18} color="var(--theme)" /> ジャンル・記録項目の設定
                  </button>
                  <button onClick={() => { setIsRoutineModalOpen(true); setIsSettingsPanelOpen(false); }} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', fontSize: '0.9rem' }}>
                    <Repeat size={18} color="var(--theme)" /> 毎月の予定 (給料・引き落とし等)
                  </button>
                  <button onClick={() => { setMode('subscription'); setIsModalOpen(true); setIsSettingsPanelOpen(false); }} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', fontSize: '0.9rem' }}>
                    <Banknote size={18} color="var(--theme)" /> サブスク管理 (毎月/毎年)
                  </button>
                  <button onClick={() => { setIsAnniversaryModalOpen(true); setIsSettingsPanelOpen(false); }} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', borderRadius: '12px', fontSize: '0.9rem' }}>
                    <Gift size={18} color="var(--theme)" /> 記念日管理
                  </button>
                </div>
              </div>

              {/* 出発地・ルート検索設定 */}
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--theme)', marginBottom: '12px', display: 'block' }}>ルート検索のデフォルト設定</span>
                <div style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <select className="pop-input" value={startPointType} onChange={e => setStartPointType(e.target.value)} style={{ fontSize: '0.85rem' }}>
                    <option value="address">自宅の住所から出発</option>
                    <option value="station">最寄り駅から出発</option>
                  </select>
                  
                  {startPointType === 'address' ? (
                    <div>
                      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Home size={14} color="var(--theme)" /> 自宅の住所</label>
                      <input type="text" className="pop-input" value={homeLocation} onChange={e => setHomeLocation(e.target.value)} placeholder="東京都渋谷区..." style={{ fontSize: '0.85rem' }} />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><Train size={14} color="var(--theme)" /> 最寄り駅</label>
                        <input type="text" className="pop-input" value={nearestStation} onChange={e => setNearestStation(e.target.value)} placeholder="渋谷駅" style={{ fontSize: '0.85rem' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label className="form-label" style={{ fontSize: '0.75rem', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><Footprints size={14} color="var(--theme)" /> 駅までの徒歩</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                          <input type="number" className="pop-input no-spin" value={walkTime} onChange={e => setWalkTime(e.target.value)} style={{ fontSize: '1rem', textAlign: 'center' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: '900' }}>分</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* メニューのカスタマイズ */}
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--theme)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={16} fill="var(--theme)" /> クイックアクションのカスタマイズ
                </span>
                {/* 👇 修正：grid を使用し、左右 50%/50% で固定。横スクロールを完全に禁止 */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '8px', 
                  width: '100%',
                  overflow: 'hidden' 
                }}>
                  {MENU_ACTIONS.map(item => {
                    const isFav = favoriteItems.includes(item.id);
                    return (
                      <button 
                        key={item.id} 
                        onClick={() => setFavoriteItems(prev => isFav ? prev.filter(i => i !== item.id) : [...prev, item.id])} 
                        style={{ 
                          width: '100%',
                          minWidth: 0, // 👈 修正：中身が長くてもボタンを突き破らないように設定
                          padding: '10px 4px', 
                          fontSize: '0.7rem', 
                          background: isFav ? 'var(--theme)' : 'var(--input-bg)', 
                          color: isFav ? '#fff' : 'var(--text-main)', 
                          borderRadius: '10px', 
                          border: `1px solid ${isFav ? 'var(--theme)' : 'var(--border-color)'}`, 
                          fontWeight: 'bold', 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px', 
                          transition: 'all 0.2s', 
                          cursor: 'pointer',
                          overflow: 'hidden' // 👈 修正：はみ出した文字を隠す
                        }}
                      >
                        <item.icon size={14} color={isFav ? '#fff' : item.color} style={{ flexShrink: 0 }} />
                        <span style={{ 
                          whiteSpace: 'nowrap', 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', // 👈 修正：長い文字は「...」にする
                          flex: 1,
                          textAlign: 'left'
                        }}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 収支計算の基準設定 */}
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--theme)', marginBottom: '12px', display: 'block' }}>収入の計算基準</span>
                <select className="pop-input" value={incomeCalcBasis} onChange={e => setIncomeCalcBasis(e.target.value as any)} style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                  <option value="wage">時給・シフトの予定から自動計算</option>
                  <option value="payday">給料日・実際の入金のみを計算</option>
                </select>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* トラベル・マップ機能 */}
      {isTravelMapOpen && (() => {
        const PREF_GRID = [
          [null, null, null, null, null, null, null, null, null, null, null, '北海道'],
          [null, null, null, null, null, null, null, null, null, null, null, '青森'],
          [null, null, null, null, null, null, null, null, null, null, '秋田', '岩手'],
          [null, null, null, null, null, null, null, null, null, null, '山形', '宮城'],
          [null, null, null, null, null, null, null, null, '石川', '新潟', '福島', null],
          [null, null, null, null, null, null, null, '福井', '富山', '群馬', '栃木', '茨城'],
          ['山口', '島根', '鳥取', '兵庫', '京都', '滋賀', '岐阜', '長野', '山梨', '埼玉', '千葉', null],
          [null, '広島', '岡山', '大阪', '奈良', '三重', '愛知', '静岡', '神奈川', '東京', null, null],
          [null, null, null, null, '和歌山', null, null, null, null, null, null, null],
          ['長崎', '佐賀', '福岡', '愛媛', '香川', null, null, null, null, null, null, null],
          [null, '熊本', '大分', '高知', '徳島', null, null, null, null, null, null, null],
          [null, '鹿児島', '宮崎', null, null, null, null, null, null, null, null, null],
          ['沖縄', null, null, null, null, null, null, null, null, null, null, null]
        ];

        const getShortName = (name: string) => name[0];

        const togglePref = (name: string) => {
          setVisitedPrefs(prev => ({ ...prev, [name]: ((prev[name] || 0) + 1) % 4 }));
        };

        const getPrefStyle = (name: string) => {
          const status = visitedPrefs[name] || 0;
          if (status === 1) return { bg: hexToRgba(themeColor, 0.15), color: themeColor, border: `1px solid ${themeColor}` };
          if (status === 2) return { bg: hexToRgba(themeColor, 0.5), color: '#fff', border: `1px solid ${themeColor}` };
          if (status === 3) return { bg: themeColor, color: '#fff', border: `1px solid ${themeColor}` };
          return { bg: 'var(--input-bg)', color: 'var(--text-sub)', border: '1px solid var(--border-color)' };
        };

        const totalVisited = Object.values(visitedPrefs).filter(v => v > 0).length;

        // 👇 追加：ズームを1に戻し、スライド位置を左上(0,0)にリセットする関数
        const handleResetZoom = () => {
          setMapZoom(1);
          setTimeout(() => {
            if (mapContainerRef.current) {
              mapContainerRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
            }
          }, 50);
        };

        return (
          <div className="modal-overlay" onClick={() => setIsTravelMapOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', borderRadius: '28px', border: '1px solid var(--glass-border)', padding: '24px', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', height: '80vh' }}>
              
              <div style={{ flexShrink: 0 }}>
                <ModalHeader title="トラベル・マップ" onClose={() => setIsTravelMapOpen(false)} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '8px', fontSize: '0.65rem', color: 'var(--text-sub)', fontWeight: 'bold' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}/>未</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: hexToRgba(themeColor, 0.15), border: `1px solid ${themeColor}` }}/>昔</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: hexToRgba(themeColor, 0.5), border: `1px solid ${themeColor}` }}/>近年</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><div style={{ width: '10px', height: '10px', borderRadius: '3px', background: themeColor, border: `1px solid ${themeColor}` }}/>直近</div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: '900', color: themeColor }}>
                  {totalVisited}<span style={{ fontSize: '0.7rem', color: 'var(--text-sub)', marginLeft: '2px' }}>/47</span>
                </div>
              </div>

              {/* ズームイン・アウト ＆ リセットボタン */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '8px', flexShrink: 0 }}>
                {/* 👇 修正：最小値を「1」に設定し、1以下の時はボタンを薄くして押せなくしました */}
                <button 
                  onClick={() => setMapZoom(z => Math.max(1, z - 0.2))} 
                  disabled={mapZoom <= 1}
                  style={{ 
                    width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border-color)', 
                    background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s',
                    cursor: mapZoom <= 1 ? 'not-allowed' : 'pointer', // 1以下の時は禁止カーソル
                    opacity: mapZoom <= 1 ? 0.4 : 1                   // 1以下の時は半透明にする
                  }}
                >
                  -
                </button>
                <button onClick={handleResetZoom} style={{ height: '36px', padding: '0 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>中央に戻す</button>
                <button onClick={() => setMapZoom(z => Math.min(3, z + 0.2))} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>+</button>
              </div>

              {/* マップ本体（はみ出したら縦にも横にもスライド可能） */}
              <div className="hide-scrollbar" ref={mapContainerRef} style={{ flex: 1, overflow: 'auto', paddingRight: '4px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '16px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
                
                {/* 👇 修正：widthや文字サイズを直接動かすことで、スライド判定(overflow)を確実に発動させる */}
                <div style={{ 
                  width: `${Math.max(100, mapZoom * 100)}%`, 
                  minWidth: `${320 * mapZoom}px`, 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(12, 1fr)', 
                  gap: `${4 * mapZoom}px`, 
                  transition: 'width 0.2s, min-width 0.2s, gap 0.2s' 
                }}>
                  {PREF_GRID.map((row, rowIndex) => 
                    row.map((p, colIndex) => {
                      if (!p) return <div key={`${rowIndex}-${colIndex}`} style={{ aspectRatio: '1' }} />;
                      const s = getPrefStyle(p);
                      return (
                        <button
                          key={p}
                          onClick={() => togglePref(p)}
                          style={{
                            aspectRatio: '1',
                            background: s.bg,
                            color: s.color,
                            border: s.border,
                            fontSize: `${0.65 * mapZoom}rem`, // 文字もズームに合わせて拡大
                            fontWeight: '900',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s, color 0.2s',
                            padding: 0,
                            borderRadius: `${4 * mapZoom}px`
                          }}
                        >
                          {getShortName(p)}
                        </button>
                      );
                    })
                  )}
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {isFinanceHistoryOpen && (() => {
        const tMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const tYear = String(new Date().getFullYear());
        
        // 👇 修正：予定に紐づくすべての支出（複数ある場合も）を個別の履歴として取り出す処理
        const allTransactions: any[] = [];
        events.forEach((e: any) => {
          const f = e.extendedProps?.metadata?.customFields || {};
          const cat = e.extendedProps?.category;
          const dateStr = e.start.split('T')[0].replace(/-/g, '/');

          if (f.expenses && f.expenses.length > 0) {
            // カレンダーの予定に紐づいた複数の支出・立替を1つずつ抽出
            f.expenses.forEach((ex: any) => {
              if (!ex.amount) return;
              const isInc = ex.type === 'income' || ex.type === 'borrow';
              allTransactions.push({
                id: `${e.id}-${ex.id}`,
                eventId: e.id,
                title: ex.description || e.title || cat || '予定',
                dateStr: dateStr,
                dateObj: new Date(e.start),
                isIncome: isInc,
                amount: Number(ex.amount),
                method: ex.method || 'cash',
                type: ex.type,
                payee: ex.payee,
                event: e
              });
            });
          } else if (f.isExpenseSet || f.isIncomeSet || cat === '収支記録') {
            // 旧バージョンのデータや、単発の収支記録用のフォールバック
            const isInc = f.isIncomeSet;
            const amt = isInc ? f.standardIncomeAmount : f.standardExpenseAmount;
            if (amt) {
              allTransactions.push({
                id: e.id,
                eventId: e.id,
                title: e.title || cat || '収支記録',
                dateStr: dateStr,
                dateObj: new Date(e.start),
                isIncome: isInc,
                amount: Number(amt),
                method: f.paymentMethod || 'cash',
                type: isInc ? 'income' : 'expense',
                event: e
              });
            }
          }
        });

        // 抽出した履歴を日付でソートし、月・年で絞り込み
        const ledgerHistory = allTransactions
          .filter(t => {
            if (historySpan === 'month') return t.dateStr.startsWith(tMonth.replace(/-/g, '/'));
            if (historySpan === 'year') return t.dateStr.startsWith(tYear);
            return true;
          })
          .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

        // 収入・支出のタブ切り替え
        const filteredHistory = ledgerHistory.filter(t => {
          if (financeTypeFilter === 'income') return t.isIncome;
          if (financeTypeFilter === 'expense') return !t.isIncome;
          return true;
        });

        return (
          <div className="modal-overlay" onClick={() => setIsFinanceHistoryOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', borderRadius: '28px', border: '1px solid var(--glass-border)', overflowY: 'auto', maxHeight: '90vh', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '24px' }}>
              <ModalHeader title="すべての収支履歴" onClose={() => setIsFinanceHistoryOpen(false)} />
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button onClick={() => setHistorySpan('month')} className={historySpan === 'month' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '0.8rem', borderRadius: '12px' }}>今月</button>
                <button onClick={() => setHistorySpan('year')} className={historySpan === 'year' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '0.8rem', borderRadius: '12px' }}>今年</button>
                <button onClick={() => setHistorySpan('all')} className={historySpan === 'all' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '0.8rem', borderRadius: '12px' }}>全期間</button>
              </div>
              <div className="hide-scrollbar" style={{ height: '65vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                {filteredHistory.length === 0 ? (
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-sub)', padding: '24px' }}>記録がありません</div>
                ) : (
                  filteredHistory.map((t: any) => {
                    // 👇 修正：上で抽出した t のデータを使って描画する
                    let MethodIcon = Banknote;
                    let methodText = '現金';
                    if (!t.isIncome) {
                      if (t.method === 'credit') { MethodIcon = CreditCard; methodText = 'クレカ'; }
                      else if (t.method === 'paypay') { MethodIcon = Smartphone; methodText = 'スマホ決済'; }
                      else if (t.method === 'ic') { MethodIcon = Train; methodText = '交通系IC'; }
                      else if (t.method === 'reimburse' || t.type === 'advance') { MethodIcon = Handshake; methodText = '立替'; }
                    } else {
                      if (t.method === 'bank') { MethodIcon = Landmark; methodText = '振込'; }
                      else if (t.method === 'paypay') { MethodIcon = Smartphone; methodText = '電子マネー'; }
                      else if (t.type === 'borrow') { MethodIcon = Handshake; methodText = '借り'; }
                    }

                    return (
                      <div key={t.id} onClick={() => { setIsFinanceHistoryOpen(false); setIsSidebarOpen(false); handleEventClick({ event: t.event }); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{t.title}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> {t.dateStr}
                            <span style={{ marginLeft: '4px', background: 'var(--input-bg)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.65rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <MethodIcon size={10} /> {methodText}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontWeight: '900', color: t.isIncome ? '#10b981' : '#ef4444', fontSize: '1.2rem', flexShrink: 0 }}>
                          {t.isIncome ? '+' : '-'}¥{t.amount.toLocaleString()}
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

      {isFeedbackModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFeedbackModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '92%', maxWidth: '420px', borderRadius: '28px', border: '1px solid var(--glass-border)', padding: '24px', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: 'var(--theme)', fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}><MessageSquare size={20} /> ご要望・不具合の報告</h2>
              <button onClick={() => setIsFeedbackModalOpen(false)} style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
            <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="例：〇〇の機能を追加してほしい..." rows={6} style={{ padding: '12px', fontSize: '0.9rem', resize: 'vertical', minHeight: '120px', marginBottom: '20px', width: '100%', borderRadius: '12px', border: '2px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none' }} autoFocus />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setIsFeedbackModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '12px', borderRadius: '16px', fontWeight: 'bold' }}>キャンセル</button>
              <button disabled={isSendingFeedback || !feedbackText.trim()} onClick={async () => { setIsSendingFeedback(true); try { await supabase.from('feedbacks').insert([{ user_id: activeUserId, user_name: activeUserName, content: feedbackText.trim() }]); alert('ご要望を送信しました！'); setFeedbackText(''); setIsFeedbackModalOpen(false); } catch (e) { alert('送信に失敗しました。'); } finally { setIsSendingFeedback(false); } }} style={{ flex: 1.5, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', borderRadius: '16px', background: themeColor, color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', opacity: (isSendingFeedback || !feedbackText.trim()) ? 0.6 : 1 }}>{isSendingFeedback ? '送信中...' : <><Send size={16} /> 送信する</>}</button>
            </div>
          </div>
        </div>
      )}

      {isCategoryHistoryOpen && (() => {
        const now = new Date().getTime();
        
        // 👇 修正：過去と未来でフィルタリングし、ソート順を最適化する
        const sortedEvents = events
          .filter((e: any) => historyCategory === 'すべて' || e.extendedProps?.category === historyCategory)
          .filter((e: any) => {
             const eTime = new Date(e.start).getTime();
             return historyTimeFilter === 'past' ? eTime < now : eTime >= now;
          })
          .sort((a: any, b: any) => {
             const tA = new Date(a.start).getTime();
             const tB = new Date(b.start).getTime();
             // 過去は「最近のものから順に（降順）」、未来は「近いものから順に（昇順）」
             return historyTimeFilter === 'past' ? tB - tA : tA - tB;
          });

        return (
          <div className="modal-overlay" onClick={() => setIsCategoryHistoryOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', borderRadius: '28px', border: '1px solid var(--glass-border)', padding: '24px', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', height: '80vh' }}>              <ModalHeader title="ジャンル別の予定・履歴" onClose={() => setIsCategoryHistoryOpen(false)} />
              
              {/* 👇 追加：過去 / 未来 の切り替えタブ */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexShrink: 0 }}>
                <button onClick={() => setHistoryTimeFilter('past')} className={historyTimeFilter === 'past' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '0.8rem', borderRadius: '12px' }}>過去の履歴</button>
                <button onClick={() => setHistoryTimeFilter('future')} className={historyTimeFilter === 'future' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '8px', fontSize: '0.8rem', borderRadius: '12px' }}>今後の予定</button>
              </div>

              {/* 👇 修正：flexShrink: 0 を付与してボタンが縦に潰れないようにする */}
              <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '8px', flexShrink: 0 }}>
                <button onClick={() => setHistoryCategory('すべて')} style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', background: historyCategory === 'すべて' ? 'var(--theme)' : 'var(--input-bg)', color: historyCategory === 'すべて' ? '#fff' : 'var(--text-main)', border: 'none' }}>すべて</button>
                {categories.map((c: any) => ( <button key={c.name} onClick={() => setHistoryCategory(c.name)} style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', background: historyCategory === c.name ? c.color : 'var(--input-bg)', color: historyCategory === c.name ? '#fff' : 'var(--text-main)', border: 'none' }}>{c.name}</button> ))}
              </div>
              
              <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                {sortedEvents.length === 0 ? <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-sub)', fontSize: '0.85rem' }}>予定がありません</div> : sortedEvents.map((e: any) => {
                  const cColor = e.extendedProps?.cColor || e.backgroundColor || 'var(--theme)';
                  const dateStr = e.start.split('T')[0].replace(/-/g, '/');
                  const memo = e.extendedProps?.metadata?.memo;
                  const rating = e.extendedProps?.metadata?.rating;
                  return (
                    <div key={e.id} onClick={() => { setIsCategoryHistoryOpen(false); handleEventClick({ event: e }); }} style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', borderLeft: `6px solid ${cColor}`, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', cursor: 'pointer', flexShrink: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)', lineHeight: 1.3 }}>{e.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{dateStr}</div>
                      </div>
                      {memo && <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', background: 'var(--input-bg)', padding: '8px', borderRadius: '8px', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}>{memo}</div>}
                      {rating > 0 && <div style={{ color: '#f59e0b', fontSize: '0.9rem' }}>{'★'.repeat(rating)}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}