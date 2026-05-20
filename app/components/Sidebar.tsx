'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Moon, Sun, Clock, Target, Star, Edit3, 
  PieChart, Image as ImageIcon, Palette, Repeat, Gift, Database, Banknote, MapPin, Home, Train, Footprints,
  ChevronDown, ChevronRight, LayoutDashboard, Zap, FolderKanban, Settings2, Globe, History as HistoryIcon, GripVertical,
  LogOut, User, TrendingUp, Users, Send, MessageSquare, Handshake, CheckCircle, Trash2,
  CreditCard, Smartphone, Landmark, Calendar as CalendarIcon, Inbox, Bell
} from 'lucide-react';
import { toLocalYYYYMMDD, hexToRgba } from '@/app/lib/utils';
import { supabase } from '@/app/lib/supabase';

interface SidebarProps {
  isSidebarOpen: boolean; setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenSections: React.Dispatch<React.SetStateAction<string[]>>; themeColor: string;
  searchQuery: string; setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  handleSearchExecute: () => void; setIsSearchMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsColorPickerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isDarkMode: boolean; setIsDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  events: any[]; categories: any[];
  targetType: string; setTargetType: React.Dispatch<React.SetStateAction<string>>;
  targetValue: string; setTargetValue: React.Dispatch<React.SetStateAction<string>>;
  currentMonthEvents: any[]; currentYearEvents: any[];
  quickTemplates: any[]; setQuickTemplates: React.Dispatch<React.SetStateAction<any[]>>;
  setMode: React.Dispatch<React.SetStateAction<any>>;
  setStartDate: React.Dispatch<React.SetStateAction<string>>; setEndDate: React.Dispatch<React.SetStateAction<string>>;
  setStartH: React.Dispatch<React.SetStateAction<string>>; setStartM: React.Dispatch<React.SetStateAction<string>>;
  setEndH: React.Dispatch<React.SetStateAction<string>>; setEndM: React.Dispatch<React.SetStateAction<string>>;
  setTitle: React.Dispatch<React.SetStateAction<string>>; setLocation: React.Dispatch<React.SetStateAction<string>>;
  setMemo: React.Dispatch<React.SetStateAction<string>>; setPhotoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  setIsStocked: React.Dispatch<React.SetStateAction<boolean>>; setIsTentative: React.Dispatch<React.SetStateAction<boolean>>;
  setRating: React.Dispatch<React.SetStateAction<number>>; setIsPinned: React.Dispatch<React.SetStateAction<boolean>>;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>; setCategoryName: React.Dispatch<React.SetStateAction<string>>;
  setIsAllDayBackground: React.Dispatch<React.SetStateAction<boolean>>; setEventColor: React.Dispatch<React.SetStateAction<string>>;
  setIsAnalyticsModalOpen: React.Dispatch<React.SetStateAction<boolean>>; setIsGalleryOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCategoryModalOpen: React.Dispatch<React.SetStateAction<boolean>>; setIsRoutineModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAnniversaryModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  syncWithCloud: () => void; handleEventClick: (info: any) => void;
  setCustomFieldsData: React.Dispatch<React.SetStateAction<any>>;
  homeLocation: string; setHomeLocation: React.Dispatch<React.SetStateAction<string>>;
  nearestStation: string; setNearestStation: React.Dispatch<React.SetStateAction<string>>;
  walkTime: string; setWalkTime: React.Dispatch<React.SetStateAction<string>>;
  startPointType: string; setStartPointType: React.Dispatch<React.SetStateAction<string>>;
  displayMode: string; setDisplayMode: React.Dispatch<React.SetStateAction<string>>;
  viewType: string; calendarCategoryFilter: string; setCalendarCategoryFilter: React.Dispatch<React.SetStateAction<string>>;
  activeUserId: string | null; activeUserName: string; activeUserAvatar: string;
  setActiveUserAvatar: React.Dispatch<React.SetStateAction<string>>; setActiveUserName: React.Dispatch<React.SetStateAction<string>>;
  onLogout: () => void; setIsFinanceGraphOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsScheduleAssistantOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsAdvanceModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTimetableModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsTemplateModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  userProfile: any;
  setIsProfileModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isNotificationEnabled: boolean;
  setIsNotificationEnabled: (val: boolean) => void;
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
  activeUserId, activeUserName, activeUserAvatar, setActiveUserAvatar, setActiveUserName, onLogout, 
  setIsFinanceGraphOpen, setIsScheduleAssistantOpen, setIsAdvanceModalOpen,
  setIsTimetableModalOpen, setIsTemplateModalOpen, userProfile, setIsProfileModalOpen,
  isNotificationEnabled, setIsNotificationEnabled
}: SidebarProps) {

  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isCategoryHistoryOpen, setIsCategoryHistoryOpen] = useState(false);
  const [historyCategory, setHistoryCategory] = useState('すべて');
  const [historyTimeFilter, setHistoryTimeFilter] = useState<'past' | 'future'>('past'); 
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
  const [mapZoom, setMapZoom] = useState(1);
  const mapContainerRef = React.useRef<HTMLDivElement>(null);

  const [isKeepSectionOpen, setIsKeepSectionOpen] = useState(true);

  const [incomeCalcBasis, setIncomeCalcBasis] = useState<'wage' | 'payday'>(() => {
    if (typeof window === 'undefined') return 'wage';
    return localStorage.getItem('os_incomeCalcBasis') as 'wage' | 'payday' || 'wage';
  });

  const [favoriteItems, setFavoriteItems] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['create_event', 'finance_single'];
    const saved = localStorage.getItem('os_favoriteItems');
    try { return saved ? JSON.parse(saved) : ['create_event', 'finance_single']; } catch(e) { return ['create_event', 'finance_single']; }
  });
  
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  useEffect(() => {
    localStorage.setItem('os_visitedPrefs', JSON.stringify(visitedPrefs));
    localStorage.setItem('os_incomeCalcBasis', incomeCalcBasis);
    localStorage.setItem('os_favoriteItems', JSON.stringify(favoriteItems));
  }, [visitedPrefs, incomeCalcBasis, favoriteItems]);

  const MENU_ACTIONS = [
    { id: 'create_event', label: '新しく予定を作成', icon: Edit3, color: themeColor },
    { id: 'schedule_assistant', label: '日程調整アシスタント', icon: Users, color: '#f59e0b' }, 
    { id: 'timetable_settings', label: '時間割・週間ルーティン', icon: CalendarIcon, color: '#3b82f6' },
    { id: 'category_history', label: 'ジャンル別の履歴・振り返り', icon: FolderKanban, color: themeColor },
    { id: 'finance_single', label: '単発の収支を記録', icon: Banknote, color: themeColor },
    { id: 'finance_history', label: '収支履歴を見る', icon: HistoryIcon, color: themeColor },
    { id: 'finance_graph', label: '収支推移グラフ', icon: PieChart, color: '#10b981' }, 
    { id: 'advance_manage', label: '立替・貸し借り管理', icon: Handshake, color: '#f59e0b' },
    { id: 'finance_bar', label: '収支サマリーバー', icon: Target, color: themeColor },
    { id: 'dashboard', label: 'ダッシュボード', icon: PieChart, color: themeColor },
    { id: 'gallery', label: '思い出ギャラリー', icon: ImageIcon, color: '#9B59B6' },
    { id: 'travel_map', label: 'トラベル・マップ', icon: Globe, color: '#10B981' },
    { id: 'category_settings', label: 'ジャンル設定', icon: Palette, color: 'var(--text-sub)' },
    { id: 'routine_settings', label: '毎月の予定(給料等)', icon: Repeat, color: 'var(--text-sub)' },
    { id: 'subscription_settings', label: 'サブスク管理', icon: Banknote, color: 'var(--text-sub)' },
    { id: 'anniversary_settings', label: '記念日管理', icon: Gift, color: 'var(--text-sub)' },
    { id: 'template_settings', label: 'よくある予定の管理', icon: Star, color: 'var(--text-sub)' },
  ];

  const handleMenuAction = (e: any, id: string) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    setIsSettingsPanelOpen(false); 
    setIsSidebarOpen(false);

    setTimeout(() => {
      if (id === 'dashboard') { setIsModalOpen(false); setIsAnalyticsModalOpen(true); }
      else if (id === 'category_history') { setIsCategoryHistoryOpen(true); }
      else if (id === 'gallery') { setIsModalOpen(false); setIsGalleryOpen(true); }
      else if (id === 'travel_map') { setIsModalOpen(false); setIsTravelMapOpen(true); }
      else if (id === 'category_settings') { setIsModalOpen(false); setIsCategoryModalOpen(true); }
      else if (id === 'schedule_assistant') { setIsScheduleAssistantOpen(true); } 
      else if (id === 'timetable_settings') { setIsTimetableModalOpen(true); }
      else if (id === 'advance_manage') { setIsAdvanceModalOpen(true); }
      else if (id === 'routine_settings') { setIsModalOpen(false); setIsRoutineModalOpen(true); }
      else if (id === 'subscription_settings') { setMode('subscription'); setIsModalOpen(true); }
      else if (id === 'anniversary_settings') { setIsModalOpen(false); setIsAnniversaryModalOpen(true); }
      else if (id === 'finance_history') { setIsFinanceHistoryOpen(true); }
      else if (id === 'finance_graph') { setIsFinanceGraphOpen(true); } 
      else if (id === 'template_settings') { setIsModalOpen(false); setIsTemplateModalOpen(true); }
      else if (id === 'create_event') {
        const today = toLocalYYYYMMDD(new Date()); const nowH = new Date().getHours();
        setMode('create'); setStartDate(today); setEndDate(today);
        setStartH(String(nowH).padStart(2, '0')); setEndH(String(Math.min(nowH + 1, 23)).padStart(2, '0'));
        setTitle(''); setLocation(''); setMemo(''); setPhotoUrls([]); setIsStocked(false); 
        setCategoryName(''); setEventColor(''); setIsAllDayBackground(false); setIsTentative(false); setRating(0); setIsPinned(false);
        setCustomFieldsData({}); setIsModalOpen(true);
      }
      else if (id === 'finance_single') {
        const today = toLocalYYYYMMDD(new Date());
        setMode('expense'); setStartDate(today); setCategoryName(''); setTitle('');
        setCustomFieldsData({ transactionMode: 'expense', isExpenseSet: true });
        setIsModalOpen(true);
      }
    }, 100);
  };

  const ModalHeader = ({ title, onClose }: any) => (
    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h2 className="modal-title" style={{ margin: 0, color: themeColor, fontSize: '1.4rem', fontWeight: 900 }}>{title}</h2>
      <button onClick={onClose} className="btn-close" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
    </div>
  );

  // 👇 Sidebar.tsx の `return (` から最後の `);` までを、丸ごとこれで上書きしてください 👇
  return (
    <>
      {/* 画面外タップで閉じる用オーバーレイ */}
      <div onClick={() => { setIsSidebarOpen(false); }} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)', zIndex: 1999, opacity: isSidebarOpen ? 1 : 0, pointerEvents: isSidebarOpen ? 'auto' : 'none', transition: 'all 0.3s ease' }} />

      {/* サイドバー本体 */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '85%', maxWidth: '320px', height: '100dvh', borderTopRightRadius: '24px', borderBottomRightRadius: '24px', zIndex: 2000, transform: isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)', padding: '24px 20px', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1)', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', boxShadow: isSidebarOpen ? '4px 0 24px rgba(0,0,0,0.15)' : 'none', borderRight: '1px solid var(--border-color)' }}>
        
        <ModalHeader title="Smart LifeOS" onClose={() => setIsSidebarOpen(false)} />

        {/* 検索・テーマ・フィルター */}
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

          <div className="card-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', marginBottom: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                <Bell size={18} /> 予定の10分前通知
              </span>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={isNotificationEnabled} 
                  onChange={(e) => setIsNotificationEnabled(e.target.checked)} 
                />
                <span className="slider"></span>
              </label>
            </div>
          
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
                  const Icon = item.icon;
                  return (
                    <button key={item.id} onClick={(e) => handleMenuAction(e, item.id)} style={{ padding: '12px 8px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', borderRadius: '16px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', cursor: 'pointer' }}>                      
                      <Icon size={20} color={item.color} />
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

          {/* 📱 アプリケーション（グループ化） */}
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--theme)', marginBottom: '12px', display: 'block', paddingLeft: '4px' }}>アプリの全機能・管理</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { title: '予定・カレンダー', icon: CalendarIcon, keys: ['create_event', 'template_settings', 'timetable_settings', 'routine_settings', 'anniversary_settings'] },
                { title: '収支・お金の管理', icon: Banknote, keys: ['finance_single', 'finance_bar', 'finance_history', 'finance_graph', 'advance_manage', 'subscription_settings'] },
                { title: '記録・振り返り', icon: PieChart, keys: ['dashboard', 'category_history', 'gallery', 'travel_map'] },
                { title: 'ツール・システム', icon: Settings2, keys: ['schedule_assistant', 'category_settings'] }
              ].map(group => {
                const GroupIcon = group.icon;
                return (
                  <div key={group.title} style={{ background: 'var(--input-bg)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)', marginBottom: '8px', paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <GroupIcon size={14} />
                      {group.title}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {group.keys.map(key => {
                        const item = MENU_ACTIONS.find(m => m.id === key);
                        if (!item) return null;
                        const Icon = item.icon;
                        return (
                          <button key={item.id} onClick={(e) => handleMenuAction(e, item.id)} className="btn-secondary hover-bg-glass" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', fontSize: '0.85rem', textAlign: 'left', border: 'none', background: 'var(--card-bg)' }}>
                            <Icon size={16} color={item.color} style={{ flexShrink: 0 }} />
                            <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 👇 キープ・仮予定リスト 👇 */}
          <div>
            <div 
              onClick={() => setIsKeepSectionOpen(!isKeepSectionOpen)} 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '8px', padding: '0 4px' }}
            >
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Inbox size={14} /> 入るかもしれない予定
              </span>
              <ChevronDown size={14} color="var(--text-sub)" style={{ transform: isKeepSectionOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </div>

            {isKeepSectionOpen && (
              <div style={{ background: 'var(--input-bg)', padding: '10px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(() => {
                  const keepEvents = events.filter((e: any) => e.extendedProps?.metadata?.isTentative || e.extendedProps?.metadata?.isStocked);
                  if (keepEvents.length === 0) {
                    return <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', textAlign: 'center', padding: '8px 0', fontWeight: 'bold' }}>キープ中の予定はありません</div>;
                  }
                  return keepEvents.map((e: any) => {
                    const cColor = e.extendedProps?.cColor || e.backgroundColor || 'var(--theme)';
                    
                    return (
                      <div 
                        key={e.id} 
                        style={{ background: 'var(--card-bg)', padding: '12px', borderRadius: '12px', borderLeft: `4px solid ${cColor}`, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '6px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', wordBreak: 'break-all' }}>{e.title}</div>
                          <span style={{ fontSize: '0.6rem', fontWeight: 'bold', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: '6px', flexShrink: 0 }}>
                            仮予定
                          </span>
                        </div>
                        
                        {e.start && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', fontWeight: 'bold' }}>
                            予定日: {e.start.split('T')[0].replace(/-/g, '/')}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px', paddingTop: '10px', borderTop: '1px dashed var(--border-color)' }}>
                          <button 
                            onClick={async (evt) => {
                              evt.stopPropagation();
                              if (confirm(`「${e.title}」を確定予定に変更しますか？`)) {
                                const meta = e.extendedProps?.metadata || {};
                                await supabase.from('events').update({
                                  metadata: { ...meta, isTentative: false, isStocked: false }
                                }).eq('id', e.id);
                                setIsSidebarOpen(false);
                                window.location.reload(); 
                              }
                            }}
                            className="btn-pop" style={{ flex: 1, padding: '8px 0', fontSize: '0.75rem', borderRadius: '8px', background: '#10b981', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: 'auto' }}
                          >
                            <CheckCircle size={14} /> 確定
                          </button>
                          <button 
                            onClick={(evt) => {
                              evt.stopPropagation();
                              setIsSidebarOpen(false);
                              setTimeout(() => handleEventClick({ event: e }), 100);
                            }}
                            className="btn-secondary" style={{ flex: 1, padding: '8px 0', fontSize: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', height: 'auto' }}
                          >
                            <Edit3 size={14} /> 日時設定
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

        </div> 

        {/* ⚙️ ボトムエリア（設定やアカウント） */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '8px', flexShrink: 0 }}>
          
          {activeUserId && (
            <div 
              onClick={() => { setIsSidebarOpen(false); setTimeout(() => setIsProfileModalOpen(true), 100); }} 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--card-bg)', padding: '12px', borderRadius: '16px', border: `1px solid var(--border-color)`, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: '4px', cursor: 'pointer' }}
              className="hover-bg-glass"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--input-bg)', border: '2px solid var(--theme)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--theme)', flexShrink: 0, overflow: 'hidden' }}>
                  {userProfile?.avatar ? (
                    <img src={userProfile.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${userProfile.avatarPanX || 50}% ${userProfile.avatarPanY || 50}%`, transform: `scale(${userProfile.avatarScale || 1})` }} alt="profile" />
                  ) : <User size={20} />}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{activeUserName}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-sub)', fontWeight: 'bold', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{userProfile?.email || `@${activeUserId}`}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Edit3 size={16} color="var(--text-sub)" />
              </div>
            </div>
          )}

          <button onClick={() => { setIsSettingsPanelOpen(true); setIsSidebarOpen(false); }} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'var(--input-bg)', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold', transition: 'background 0.2s' }}>
            <Settings2 size={16} color="var(--theme)" /> アプリ設定と管理
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
              {/* アプリの全機能と管理 */}
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--theme)', marginBottom: '12px', display: 'block' }}>アプリの全機能・管理</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { title: '予定・カレンダー', icon: CalendarIcon, keys: ['create_event', 'template_settings', 'timetable_settings', 'routine_settings', 'anniversary_settings'] },
                    { title: '収支・お金の管理', icon: Banknote, keys: ['finance_single', 'finance_bar', 'finance_history', 'finance_graph', 'advance_manage', 'subscription_settings'] },
                    { title: '記録・振り返り', icon: PieChart, keys: ['dashboard', 'category_history', 'gallery', 'travel_map'] },
                    { title: 'ツール・システム', icon: Settings2, keys: ['schedule_assistant', 'category_settings'] }
                  ].map(group => (
                    <div key={group.title} style={{ background: 'var(--input-bg)', padding: '12px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)', marginBottom: '8px', paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <group.icon size={14} />
                        {group.title}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {group.keys.map(key => {
                          const item = MENU_ACTIONS.find(m => m.id === key);
                          if (!item) return null;
                          const Icon = item.icon;
                          return (
                            <button key={item.id} onClick={(e) => handleMenuAction(e, item.id)} className="btn-secondary hover-bg-glass" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '10px', fontSize: '0.85rem', textAlign: 'left', border: 'none', background: 'var(--card-bg)' }}>
                              <Icon size={16} color={item.color} style={{ flexShrink: 0 }} />
                              <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
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

              {/* クイックアクションのカスタマイズ */}
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--theme)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Star size={16} fill="var(--theme)" /> クイックアクションのカスタマイズ
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', width: '100%', overflow: 'hidden' }}>
                  {MENU_ACTIONS.map(item => {
                    const isFav = favoriteItems.includes(item.id);
                    const Icon = item.icon;
                    return (
                      <button 
                        key={item.id} 
                        onClick={() => setFavoriteItems(prev => isFav ? prev.filter(i => i !== item.id) : [...prev, item.id])} 
                        style={{ width: '100%', minWidth: 0, padding: '10px 4px', fontSize: '0.7rem', background: isFav ? 'var(--theme)' : 'var(--input-bg)', color: isFav ? '#fff' : 'var(--text-main)', borderRadius: '10px', border: `1px solid ${isFav ? 'var(--theme)' : 'var(--border-color)'}`, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s', cursor: 'pointer', overflow: 'hidden' }}
                      >
                        <Icon size={14} color={isFav ? '#fff' : item.color} style={{ flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, textAlign: 'left' }}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 収入の計算基準 */}
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

      {/* 📊 ジャンル別の予定・履歴 モーダル */}
      {isCategoryHistoryOpen && (() => {
        const now = new Date().getTime();
        const sortedEvents = events
          .filter((e: any) => historyCategory === 'すべて' || e.extendedProps?.category === historyCategory)
          .filter((e: any) => {
             const eTime = new Date(e.start).getTime();
             return historyTimeFilter === 'past' ? eTime < now : eTime >= now;
          })
          .sort((a: any, b: any) => {
             const tA = new Date(a.start).getTime();
             const tB = new Date(b.start).getTime();
             return historyTimeFilter === 'past' ? tB - tA : tA - tB;
          });

        return (
          <div className="modal-overlay" onClick={() => setIsCategoryHistoryOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', borderRadius: '28px', border: '1px solid var(--glass-border)', padding: '24px', background: 'var(--bg-main)', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', height: '70vh', justifyContent: 'flex-start' }}>
              <div style={{ flexShrink: 0 }}>
                <ModalHeader title="ジャンル別の履歴" onClose={() => setIsCategoryHistoryOpen(false)} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', flexShrink: 0 }}>
                <button onClick={() => setHistoryTimeFilter('past')} className={historyTimeFilter === 'past' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: historyTimeFilter === 'past' ? themeColor : 'var(--input-bg)', color: historyTimeFilter === 'past' ? '#fff' : 'var(--text-main)', border: 'none', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: historyTimeFilter === 'past' ? `0 4px 10px ${themeColor}50` : 'none', transition: 'all 0.2s' }}>過去の履歴</button>
                <button onClick={() => setHistoryTimeFilter('future')} className={historyTimeFilter === 'future' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: historyTimeFilter === 'future' ? themeColor : 'var(--input-bg)', color: historyTimeFilter === 'future' ? '#fff' : 'var(--text-main)', border: 'none', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: historyTimeFilter === 'future' ? `0 4px 10px ${themeColor}50` : 'none', transition: 'all 0.2s' }}>今後の予定</button>
              </div>

              <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '15px', paddingBottom: '4px', flexShrink: 0, whiteSpace: 'nowrap' }}>
                <button onClick={() => setHistoryCategory('すべて')} style={{ background: historyCategory === 'すべて' ? themeColor : 'var(--input-bg)', color: historyCategory === 'すべて' ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>すべて</button>
                {categories.map((c: any) => (
                  <button key={c.name} onClick={() => setHistoryCategory(c.name)} style={{ background: historyCategory === c.name ? c.color : 'var(--input-bg)', color: historyCategory === c.name ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: '900', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>{c.name}</button>
                ))}
              </div>
              
              <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
                {sortedEvents.length === 0 ? <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-sub)', fontSize: '0.85rem', fontWeight: 'bold' }}>予定・履歴がありません</div> : sortedEvents.map((e: any) => {
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

      {/* 🗺 トラベル・マップ モーダル */}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '8px', flexShrink: 0 }}>
                <button onClick={() => setMapZoom(z => Math.max(1, z - 0.2))} disabled={mapZoom <= 1} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', cursor: mapZoom <= 1 ? 'not-allowed' : 'pointer', opacity: mapZoom <= 1 ? 0.4 : 1 }}>-</button>
                <button onClick={handleResetZoom} style={{ height: '36px', padding: '0 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>中央に戻す</button>
                <button onClick={() => setMapZoom(z => Math.min(3, z + 0.2))} style={{ width: '36px', height: '36px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>+</button>
              </div>

              <div className="hide-scrollbar" ref={mapContainerRef} style={{ flex: 1, overflow: 'auto', paddingRight: '4px', background: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '16px', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)' }}>
                <div style={{ width: `${Math.max(100, mapZoom * 100)}%`, minWidth: `${320 * mapZoom}px`, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: `${4 * mapZoom}px`, transition: 'width 0.2s, min-width 0.2s, gap 0.2s' }}>
                  {PREF_GRID.map((row, rowIndex) => 
                    row.map((p, colIndex) => {
                      if (!p) return <div key={`${rowIndex}-${colIndex}`} style={{ aspectRatio: '1' }} />;
                      const s = getPrefStyle(p);
                      return (
                        <button key={p} onClick={() => togglePref(p)} style={{ aspectRatio: '1', background: s.bg, color: s.color, border: s.border, fontSize: '0.75rem', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s, color 0.2s', padding: 0, borderRadius: `${4 * mapZoom}px` }}>
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

      {/* 💳 すべての収支履歴 モーダル */}
      {isFinanceHistoryOpen && (() => {
        const tMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
        const tYear = String(new Date().getFullYear());
        
        const allTransactions: any[] = [];
        events.forEach((e: any) => {
          const f = e.extendedProps?.metadata?.customFields || {};
          const cat = e.extendedProps?.category;
          const dateStr = e.start.split('T')[0].replace(/-/g, '/');

          if (f.expenses && f.expenses.length > 0) {
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

        const ledgerHistory = allTransactions
          .filter(t => {
            if (historySpan === 'month') return t.dateStr.startsWith(tMonth.replace(/-/g, '/'));
            if (historySpan === 'year') return t.dateStr.startsWith(tYear);
            return true;
          })
          .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime());

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

      {/* ⚠️ フィードバック モーダル */}
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
    </>
  );
}