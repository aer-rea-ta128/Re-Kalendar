'use client';

import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { supabase } from '@/lib/supabase';
import {
  Train, Footprints, MapPin, Clock, Star, Inbox, Settings, Trash2, TrendingUp, TrendingDown, Target,
  History, PieChart, Image as ImageIcon, Repeat, Pin, Database, Palette, Gift, Calendar as CalendarIcon, Zap,
  Home, Edit3, Flag, Monitor, Dumbbell, Beer, Circle, Search, Calendar, Plane, Bus, FileText, Sun, Moon, CreditCard, 
  Check, CheckCircle, Banknote, BookOpen, Users, Download, Share2, Sparkles, Unlock, Lock, Globe, Store,
  Smartphone, Landmark, ChevronUp, ChevronDown, Handshake
} from 'lucide-react';

// ★ 分割したファイルを読み込む（パスは画像の設定に合わせています）
import { DAY_NAMES, HOURS, MINUTES, INITIAL_PRESETS, VIEW_OPTIONS, FIELD_TYPES } from '@/app/lib/constants';
import { hexToRgba, toLocalYYYYMMDD } from '@/app/lib/utils';
import CategoryStudio from '@/app/components/CategoryStudio';
import Sidebar from '@/app/components/Sidebar';
import AuthScreen from '@/app/components/AuthScreen'; // 👈 これを追加！

// アイコンを取得するヘルパー関数
const getSmartIcon = (type: string, color: string) => {
  // デフォルトの黒文字色（var(--text-main)）が指定されている場合は、テーマカラーに上書きする
  const finalColor = color === 'var(--text-main)' ? 'var(--theme)' : color;
  const props = { size: 14, strokeWidth: 2.5, style: { color: finalColor } };
  switch (type) {
    case 'train': return <Train {...props} />;
    case 'walk':  return <Footprints {...props} />;
    case 'location': return <MapPin {...props} />;
    case 'time': return <Clock {...props} />;
    default: return <Star {...props} />;
  }
};

export default function SmartLifeOS() {
  const calendarRef = useRef<FullCalendar>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const isSwipingRef = useRef(false);

  // 👇==== ここから追加 ====👇
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => { 
    touchStartX.current = e.targetTouches[0].clientX; 
    touchStartY.current = e.targetTouches[0].clientY; 
    isSwipingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => { 
    if (touchStartX.current === null || touchStartY.current === null) return;
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
    
    const diffX = touchEndX.current - touchStartX.current;
    const diffY = touchEndY.current - touchStartY.current;
    if (Math.abs(diffX) > 15 || Math.abs(diffY) > 15) isSwipingRef.current = true; 
  };

  const handleTouchEnd = () => { 
    if (touchStartX.current === null || touchEndX.current === null || touchStartY.current === null || touchEndY.current === null) {
      touchStartX.current = null; touchEndX.current = null;
      touchStartY.current = null; touchEndY.current = null;
      setTimeout(() => { isSwipingRef.current = false; }, 100);
      return;
    }
    
    if (isSwipingRef.current) {
      const diffX = touchEndX.current - touchStartX.current;
      const diffY = touchEndY.current - touchStartY.current;
      
      // 左右のスワイプ（日付・週の移動）のみ処理。上下は通常スクロールに任せる。
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 50) {
          let startRelativeX = touchStartX.current;
          const container = document.querySelector('.fixed-mobile-frame');
          if (container) startRelativeX = touchStartX.current - container.getBoundingClientRect().left;
          if (startRelativeX < 40) setIsSidebarOpen(true);
          else calendarRef.current?.getApi().prev();
        } else if (diffX < -50) {
          calendarRef.current?.getApi().next();
        }
      }
    }
    touchStartX.current = null; touchEndX.current = null;
    touchStartY.current = null; touchEndY.current = null;
    setTimeout(() => { isSwipingRef.current = false; }, 100);
  };
  // 👆==== ここまで追加 ====👆

  // 👇 修正：開いた瞬間に記憶を確認 ＋ ローカル環境ならスキップ！
  const [activeUserId, setActiveUserId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return 'local_dev';
      const session = localStorage.getItem('os_active_session');
      return session ? JSON.parse(session).id : null;
    }
    return null;
  });
  
  const [activeUserName, setActiveUserName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return '開発環境';
      const session = localStorage.getItem('os_active_session');
      return session ? JSON.parse(session).name : '';
    }
    return '';
  });
  const [activeUserAvatar, setActiveUserAvatar] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('os_user_avatar') || '';
    }
    return '';
  });

  // 👇 追加：収支グラフを開くための状態管理
  const [isFinanceGraphOpen, setIsFinanceGraphOpen] = useState(false);
  const [isScheduleAssistantOpen, setIsScheduleAssistantOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);

  const [advanceTab, setAdvanceTab] = useState<'unsettled' | 'settled' | 'partners'>('unsettled');
  const [customPayees, setCustomPayees] = useState<string[]>(() => loadData('os_customPayees', []));
  const [newPayeeName, setNewPayeeName] = useState('');
  const [isTentative, setIsTentative] = useState(false);
  const [graphSpan, setGraphSpan] = useState<'month' | 'week'>('month');
  const [assistMode, setAssistMode] = useState<'send' | 'receive'>('send');
  
  // 👇 修正：ドラッグして時間を指定できるように変更
  const [assistTimeSlots, setAssistTimeSlots] = useState<string[]>([]);
  const [generatedText, setGeneratedText] = useState('');
  const [receiveText, setReceiveText] = useState('');

  // 👇 追加：ログアウト機能（記憶を消してログイン画面に戻す）
  const handleLogout = () => {
    if (confirm('ログアウトしますか？（ログアウトすると端末枠が1つ空きます）')) {
      
      // 👇 追加：ログアウト時にデバイス情報を解除し、他の端末でログインできるようにする
      const savedUsers = localStorage.getItem('os_local_users');
      const deviceId = localStorage.getItem('os_device_id');
      if (savedUsers && deviceId && activeUserId) {
        const users = JSON.parse(savedUsers);
        const updatedUsers = users.map((u: any) => {
          if (u.id === activeUserId) {
            return { ...u, devices: (u.devices || []).filter((d: string) => d !== deviceId) };
          }
          return u;
        });
        localStorage.setItem('os_local_users', JSON.stringify(updatedUsers));
      }

      localStorage.removeItem('os_active_session');
      setActiveUserId(null);
      setActiveUserName('');
    }
  };

  // --- 状態管理 ---
  function loadData(key: string, defaultData: any) {
    if (typeof window === 'undefined') return defaultData;
    const saved = localStorage.getItem(key);
    try { return saved ? JSON.parse(saved) : defaultData; } catch (e) { return defaultData; }
  }

  const [themeColor, setThemeColor] = useState(() => loadData('os_themeColor', '#4D96FF'));  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [userColors, setUserColors] = useState<string[]>(() => loadData('os_userColors', []));
  const [customColorCursor, setCustomColorCursor] = useState('#000000');
  const [isEditingColors, setIsEditingColors] = useState(false);

  const [viewType, setViewType] = useState('dayGridMonth');
  const [currentYear, setCurrentYear] = useState('');
  const [currentMonthNum, setCurrentMonthNum] = useState('');
  const [currentDayNum, setCurrentDayNum] = useState('');
  const [currentWeekStartStr, setCurrentWeekStartStr] = useState('');

  const [viewFilter, setViewFilter] = useState('すべて');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [firstDayOfWeek, setFirstDayOfWeek] = useState(0);
  const [displayMode, setDisplayMode] = useState('normal');

  const [isViewSelectorOpen, setIsViewSelectorOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isViewSelectorExpanded, setIsViewSelectorExpanded] = useState(false);
  const [calendarCategoryFilter, setCalendarCategoryFilter] = useState('すべて'); // 👈 追加

  const [openSections, setOpenSections] = useState<string[]>(['settings', 'countdown']);
  const [nickname, setNickname] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [overlapMode, setOverlapMode] = useState('compact');
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);

  const [events, setEvents] = useState<any[]>([]);
  const DEFAULT_CATEGORIES = [
    { 
      name: '仕事', 
      color: '#4D96FF', 
      fields: [{ id: 'wage_1', name: '給与計算', type: 'wage', wageRules: [{ start: '00:00', end: '23:59', wage: '1000' }] }] 
    },
    { name: '飲み', color: '#FF6B6B', fields: [{ id: 'f1', name: '飲んだ杯数', type: 'number', unit: '杯' }] },
    { name: '趣味', color: '#1DD1A1', fields: [] },
    // 👇 追加：スポーツ観戦ジャンルと、スコア入力フィールド
    { 
      name: 'スポーツ観戦', 
      color: '#f59e0b', 
      allowPhoto: true, // 写真も許可
      fields: [{ id: 'score_1', name: '試合結果 (応援チーム - 相手)', type: 'score' }] 
    }
  ];

  const [categories, setCategories] = useState<any[]>(() => loadData('os_categories', DEFAULT_CATEGORIES));
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [holidays, setHolidays] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<any[]>([]);

  // ★ CategoryStudio用のState
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const [isAnniversaryModalOpen, setIsAnniversaryModalOpen] = useState(false);
  const [anniversaries, setAnniversaries] = useState<{title: string, date: string, color: string}[]>(() => loadData('os_anniversaries', []));
  const [newAnnivTitle, setNewAnnivTitle] = useState('');
  const [newAnnivMonth, setNewAnnivMonth] = useState('01');
  const [newAnnivDay, setNewAnnivDay] = useState('01');
  const [newAnnivColor, setNewAnnivColor] = useState('#FF9FF3');
  const [editAnnivIndex, setEditAnnivIndex] = useState<number | null>(null);

  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [monthlyRoutines, setMonthlyRoutines] = useState<{title: string, day: number, color: string, adjust?: string, type?: string}[]>(() => loadData('os_routines', []));
  const [newRoutineDay, setNewRoutineDay] = useState('25');
  const [newRoutineTitle, setNewRoutineTitle] = useState('');
  const [newRoutineType, setNewRoutineType] = useState('task');
  const [routineAmount, setRoutineAmount] = useState('');
  const [routineBonusAmount, setRoutineBonusAmount] = useState('');
  const [newRoutineColor, setNewRoutineColor] = useState('#FECA57');
  const [editRoutineIndex, setEditRoutineIndex] = useState<number | null>(null);

  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [analyticsSpan, setAnalyticsSpan] = useState<'month' | 'year' | 'pie'>('month');
  const [summarySpan, setSummarySpan] = useState<'month' | 'year'>('month');
  const [analyticsCat, setAnalyticsCat] = useState<string>('');
  // ダッシュボードを開いた時、自動的に「今年の今の月」がセットされるように修正
  const [analyticsYear, setAnalyticsYear] = useState(() => String(new Date().getFullYear()));
  const [analyticsMonth, setAnalyticsMonth] = useState(() => String(new Date().getMonth() + 1).padStart(2, '0'));
  const [visibleDashboardFields, setVisibleDashboardFields] = useState<Record<string, boolean>>({});

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryCategory, setGalleryCategory] = useState('すべて');

  const [externalCals, setExternalCals] = useState([
    { id: 'ext1', name: '🎸 アーティスト公式情報', color: '#ec4899', active: false, events: [{ title: '🎫 チケット先行', date: '2026-05-10' }, { title: '🎤 東京ドーム公演', date: '2026-05-25' }] },
    { id: 'ext2', name: '⚽️ スポーツ・地域情報', color: '#0ea5e9', active: false, events: [{ title: '⚽️ ホーム戦', date: '2026-05-18' }] }
  ]);

  const [visibilityMode, setVisibilityMode] = useState<'all' | 'public' | 'private'>('all');
  const [isMarketModalOpen, setIsMarketModalOpen] = useState(false);

  const [aiUrl, setAiUrl] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const MOCK_MARKET_TEMPLATES = [
    { id: 'm1', title: 'ガチ筋トレ記録セット', author: 'FitnessPro', downloads: 1240, color: '#f59e0b', desc: '部位別の重量と回数を記録するカスタムフィールド付き' },
    { id: 'm2', title: 'フリーランス確定申告用', author: 'TaxMaster', downloads: 3500, color: '#3b82f6', desc: '経費と売上を自動仕分けする事業用カテゴリセット' }
  ];

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);

  // 💸 支出・サブスク専用のState
  const [expenseAmount, setExpenseAmount] = useState('');
  const [subs, setSubs] = useState<any[]>(() => loadData('os_subs', []));
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subCycle, setSubCycle] = useState('monthly');
  const [subDate, setSubDate] = useState('1');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<'create' | 'detail' | 'dayOfWeekBulk' | 'routine_detail' | 'expense' | 'subscription'>('create');
  const [clipboardEvent, setClipboardEvent] = useState<any>(null);  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [categoryName, setCategoryName] = useState('仕事');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startH, setStartH] = useState('09');
  const [startM, setStartM] = useState('00');
  const [endH, setEndH] = useState('10');
  const [endM, setEndM] = useState('00');
  const [eventColor, setEventColor] = useState('');
  const [isOutline, setIsOutline] = useState(false);
  const [quickTemplates, setQuickTemplates] = useState<any[]>([]);

  useEffect(() => { 
    const saved = localStorage.getItem('quickTemplates'); 
    if (saved) {
      setQuickTemplates(JSON.parse(saved)); 
    } else {
      // 👇 追加：初めて使う人向けに、デフォルトの便利テンプレートを入れておく
      const defaultTemplates = [
        { title: 'プロ野球観戦', startH: '18', startM: '00', endH: '21', endM: '00', categoryName: 'スポーツ観戦', eventColor: '#f59e0b', isAllDayBackground: false },
        { title: '飲み会', startH: '19', startM: '00', endH: '21', endM: '00', categoryName: '飲み', eventColor: '#FF6B6B', isAllDayBackground: false }
      ];
      setQuickTemplates(defaultTemplates);
      localStorage.setItem('quickTemplates', JSON.stringify(defaultTemplates));
    }
  }, []);

  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [memo, setMemo] = useState('');
  const [rating, setRating] = useState(0);
  const [isPinned, setIsPinned] = useState(false);

  const [customFieldsData, setCustomFieldsData] = useState<Record<string, any>>({});
  const [repeatUntil, setRepeatUntil] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  const [isMilestone, setIsMilestone] = useState(false);
  const [isStocked, setIsStocked] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [homeLocation, setHomeLocation] = useState(() => loadData('os_home', ''));
  const draggableRef = useRef<HTMLDivElement>(null);
  const [isAllDayBackground, setIsAllDayBackground] = useState(false);
  const [useEventColorForTitle, setUseEventColorForTitle] = useState(false);
  const [expandedBlocks, setExpandedBlocks] = useState<string[]>([]); // 👈 初期値を空にする
  const toggleBlock = (b: string) => setExpandedBlocks(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);

  useEffect(() => {
    const savedColorSetting = localStorage.getItem('useEventColorForTitle');
    if (savedColorSetting === 'true') setUseEventColorForTitle(true);
  }, []);

  const [targetType, setTargetType] = useState('money_month');
  const [targetValue, setTargetValue] = useState('50000');
  const [targetCategory, setTargetCategory] = useState('');
  const [isGathering, setIsGathering] = useState(false);
  const [gatheringTime, setGatheringTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [departureType, setDepartureType] = useState('home');
  const [startPointType, setStartPointType] = useState(() => loadData('os_startPointType', 'address'));
  const [nearestStation, setNearestStation] = useState(() => loadData('os_station', ''));
  const [walkTime, setWalkTime] = useState(() => loadData('os_walkTime', '10'));
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [bulkStartMonth, setBulkStartMonth] = useState('');
  const [bulkEndMonth, setBulkEndMonth] = useState('');
  const [fontFamily, setFontFamily] = useState('standard');
  const [timeFormat, setTimeFormat] = useState('24h');

  useEffect(() => {
    const get = (key: string, def: any) => { const val = localStorage.getItem(key); try { return val ? JSON.parse(val) : def; } catch { return def; } };
    setCategories(get('os_categories', DEFAULT_CATEGORIES));
    setUserColors(get('os_userColors', []));
    setAnniversaries(get('os_anniversaries', []));
    setMonthlyRoutines(get('os_routines', []));
    setHomeLocation(get('os_home', ''));
    setNearestStation(get('os_station', ''));
    setWalkTime(get('os_walkTime', '10'));
    setStartPointType(get('os_startPointType', 'address'));
    setIsDataLoaded(true);
  }, []);

  useEffect(() => {
    if (!isDataLoaded) return;
    localStorage.setItem('os_categories', JSON.stringify(categories));
    localStorage.setItem('os_themeColor', JSON.stringify(themeColor)); // 👈 これを追加
    localStorage.setItem('os_userColors', JSON.stringify(userColors));
    localStorage.setItem('os_subs', JSON.stringify(subs));
    localStorage.setItem('os_anniversaries', JSON.stringify(anniversaries));
    localStorage.setItem('os_routines', JSON.stringify(monthlyRoutines));
    localStorage.setItem('os_home', JSON.stringify(homeLocation));
    localStorage.setItem('os_station', JSON.stringify(nearestStation));
    localStorage.setItem('os_walkTime', JSON.stringify(walkTime));
    localStorage.setItem('os_startPointType', JSON.stringify(startPointType));
    localStorage.setItem('os_customPayees', JSON.stringify(customPayees));
  }, [categories, userColors, anniversaries, monthlyRoutines, homeLocation, nearestStation, walkTime, startPointType, isDataLoaded, themeColor]); // 👈 配列の最後に themeColor を追加

  const activePresets: string[] = [...INITIAL_PRESETS, ...userColors];

  useEffect(() => {
    if (currentSearchIndex >= 0) {
      const el = document.getElementById(`search-item-${currentSearchIndex}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentSearchIndex]);

  const fetchEvents = async () => {
    if (!activeUserId) return; // ログイン前は取得しない

    const { data } = await supabase.from('events').select('*');
    if (data) {
      // 🌟 魔法の処理：まだ「誰の予定か」が設定されていない古い予定を、あなたのアカウントに引き継ぐ！
      const unownedEvents = data.filter((e: any) => !e.metadata?.user_id);
      if (unownedEvents.length > 0) {
        for (const ev of unownedEvents) {
          const newMetadata = { ...(ev.metadata || {}), user_id: activeUserId };
          await supabase.from('events').update({ metadata: newMetadata }).eq('id', ev.id);
        }
      }

      // 🌟 自分の予定（user_id が一致するもの）だけを抽出して画面に表示する！
      const myEvents = data.filter((e: any) => {
        const ownerId = e.metadata?.user_id;
        return ownerId === activeUserId || !ownerId; // 今引き継いだ分も含む
      });

      setEvents(myEvents.map((e: any) => {
        const catObj = categories.find((c: any) => c.name === e.category);
        const catColor = catObj?.color || '#999999';
        let cColor = e.metadata?.customColor || catColor;

        const hexRegex = /^#?([0-9a-fA-F]{3})$/;
        if (cColor) {
          const match = cColor.match(hexRegex);
          if (match) {
            const hex = match[1];
            cColor = '#' + hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
          }
        }

        const outline = e.metadata?.isOutline || false;
        const milestone = e.metadata?.isMilestone || false;
        const isBackground = e.metadata?.isAllDayBackground || false;

        const sStr = e.metadata?.startDateStr || (e.start_at ? e.start_at.split('T')[0] : toLocalYYYYMMDD(new Date(e.start_at)));
        const eStr = e.metadata?.endDateStr || (e.end_at ? e.end_at.split('T')[0] : sStr);

        let actualStart = e.start_at;
        let actualEnd = e.end_at || e.start_at;

        if (isBackground) {
          actualStart = sStr;
          const [y, m, d] = eStr.split('-').map(Number);
          const endObj = new Date(y, m - 1, d + 1);
          actualEnd = toLocalYYYYMMDD(endObj);
        }

        return {
          id: e.id,
          title: e.title,
          start: actualStart,
          end: actualEnd,
          allDay: isBackground,
          display: 'block',
          backgroundColor: milestone ? 'transparent' : cColor,
          borderColor: milestone ? 'transparent' : cColor,
          classNames: [
            milestone ? 'milestone-invisible-wrapper' : '',
            isBackground ? 'solid-allday-event' : '',
            e.metadata?.isTentative ? 'tentative-event' : ''
          ],
          extendedProps: { ...e, outline, cColor, catObj, isMilestone: milestone, originalStart: e.start_at }
        };
      }));
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [categories]);

  useEffect(() => {
    let draggable: any = null;
    if (draggableRef.current) {
      draggable = new Draggable(draggableRef.current, {
        itemSelector: '.drag-event-item',
        eventData: function(eventEl) {
          return { title: eventEl.innerText, duration: '01:00' };
        }
      });
    }
    return () => {
      if (draggable) draggable.destroy();
    };
  }, []);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await fetch('https://holidays-jp.github.io/api/v1/date.json');
        if (!res.ok) throw new Error('祝日APIエラー');
        const data = await res.json();
        setHolidays(data);
      } catch (error) {
        console.warn('祝日データが取得できませんでしたが動作に影響はありません:', error);
        setHolidays({});
      }
    };
    fetchHolidays();
  }, []);

// 👇 カレンダー描画後に、移動ブロックの幅を本体ブロックに強制同期させる
  useEffect(() => {
    if (viewType !== 'timeGridWeek' && viewType !== 'timeGridDay') return;

    const syncWidths = () => {
      const calendarEl = document.querySelector('.fc');
      if (!calendarEl) return;

      const transitEls = calendarEl.querySelectorAll('[data-travel-target]');
      transitEls.forEach(tEl => {
        const targetId = tEl.getAttribute('data-travel-target');
        const mainEl = calendarEl.querySelector(`[data-main-id="${targetId}"]`);
        
        if (mainEl && tEl) {
          // FullCalendarは親要素(.fc-timegrid-event-harness)で位置と幅を管理しているため、親を取得
          const tHarness = tEl.closest('.fc-timegrid-event-harness') as HTMLElement;
          const mainHarness = mainEl.closest('.fc-timegrid-event-harness') as HTMLElement;
          
          if (tHarness && mainHarness) {
            // 本体の left, right (幅と位置) を移動枠にコピー！
            tHarness.style.left = mainHarness.style.left;
            tHarness.style.right = mainHarness.style.right;
          }
        }
      });
    };

    // DOMの変更を監視して、カレンダーのレイアウトが変わるたびに幅を合わせる
    const observer = new MutationObserver(() => {
      setTimeout(syncWidths, 10);
    });
    
    const container = document.querySelector('.fc');
    if (container) {
      observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    }
    setTimeout(syncWidths, 100);

    return () => observer.disconnect();
  }, [events, viewType]);

  const handleDelete = async () => {
    if (confirm('本当に削除しますか？')) {
      await supabase.from('events').delete().eq('id', selectedId);
      setIsModalOpen(false);
      fetchEvents();
    }
  };

  const handleDuplicate = () => {
    setClipboardEvent({
      title, location, categoryName, startH, startM, endH, endM,
      eventColor, isOutline, customFieldsData, photoUrls, memo, rating, isPinned,
      isAllDayBackground, isMilestone, isGathering, gatheringTime, departureTime, departureType
    });
    setIsModalOpen(false);
    alert('予定をコピーしました！\nカレンダーのペーストしたい日付（時間）をタップしてください。');
  };

  const handleQuickSave = async (t: any) => {
    if (!startDate) return;
    const getISO = (d: string, h: string, m: string) => new Date(`${d}T${h}:${m}:00`).toISOString();
    const actualStartH = t.isAllDayBackground ? '00' : t.startH;
    const actualStartM = t.isAllDayBackground ? '00' : t.startM;
    const actualEndH = t.isAllDayBackground ? '23' : t.endH;
    const actualEndM = t.isAllDayBackground ? '59' : t.endM;

    const payload = {
      title: t.title,
      category: t.categoryName,
      start_at: getISO(startDate, actualStartH, actualStartM),
      end_at: getISO(endDate || startDate, actualEndH, actualEndM),
      metadata: { customColor: t.eventColor || undefined, isAllDayBackground: t.isAllDayBackground }
    };

    await supabase.from('events').insert([payload]);
    setIsModalOpen(false);
    fetchEvents();
  };

  const applyTemplate = (t: any) => {
    setTitle(t.title);
    setCategoryName(t.categoryName);
    setStartH(t.startH); setStartM(t.startM);
    setEventColor(t.eventColor); setIsOutline(t.isOutline); setIsMilestone(t.isMilestone || false);
    setMemo(t.memo || ''); setRating(t.rating || 0); setIsPinned(t.isPinned || false);
  };

  const syncWithCloud = async () => {
    alert('【同期準備完了】\n現在はローカルモードで動作しています。\n次回、アカウント機能（ログイン画面）を実装すると、ここにクラウド同期の処理が連携されます！');
  };

  const handleAiExtraction = async () => {
    if (!aiUrl.trim()) return alert('URLを入力してください');
    setIsAiLoading(true);
    setTimeout(() => {
      setIsAiLoading(false);
      const today = toLocalYYYYMMDD(new Date());
      setMode('create');
      setStartDate(today);
      setEndDate(today);
      setStartH('18'); setStartM('30');
      setEndH('21'); setEndM('00');
      setTitle('✨ AI抽出: サカナクション ライブツアー');
      setLocation('幕張メッセ');
      setMemo(`【AIによる自動抽出データ】\n参照元URL: ${aiUrl}\n\nチケット代: 8,800円 (別途システム手数料)`);
      setEventColor('#ec4899');
      
      const targetCat = categories.find(c => c.name.includes('趣味')) ? '趣味' : (categories.length > 0 ? categories[0].name : '');
      setCategoryName(targetCat);

      setIsModalOpen(true);
      setIsSidebarOpen(false);
      setAiUrl('');
      alert('AIがURLから予定の情報を抽出しました！内容を確認して保存してください。');
    }, 1500);
  };

  const handleAddAnniversary = () => {
    if (!newAnnivTitle.trim()) return;
    const mmdd = `${newAnnivMonth.padStart(2, '0')}-${newAnnivDay.padStart(2, '0')}`;
    if (editAnnivIndex !== null) {
      const updatedArr = [...anniversaries];
      updatedArr[editAnnivIndex] = { title: newAnnivTitle.trim(), date: mmdd, color: newAnnivColor };
      setAnniversaries(updatedArr); setEditAnnivIndex(null);
    } else {
      setAnniversaries([...anniversaries, { title: newAnnivTitle.trim(), date: mmdd, color: newAnnivColor }]);
    }
    setNewAnnivTitle(''); setNewAnnivMonth('01'); setNewAnnivDay('01'); setIsAnniversaryModalOpen(false);
  };

  const handleAddRoutine = () => {
    if (!newRoutineTitle.trim()) return;
    const dNum = Number(newRoutineDay);
    if (editRoutineIndex !== null) {
      const updatedArr = [...monthlyRoutines];
      updatedArr[editRoutineIndex] = { title: newRoutineTitle.trim(), day: dNum, color: newRoutineColor, type: newRoutineType, adjust: updatedArr[editRoutineIndex].adjust };
      setMonthlyRoutines(updatedArr); setEditRoutineIndex(null);
    } else {
      setMonthlyRoutines([...monthlyRoutines, { title: newRoutineTitle.trim(), day: dNum, color: newRoutineColor, type: newRoutineType }]);
    }
    setNewRoutineTitle(''); setNewRoutineDay('25'); setNewRoutineType('task'); setIsRoutineModalOpen(false);
  };

  const handleCompleteRoutine = async () => {
    const todayStr = toLocalYYYYMMDD(new Date());
    const payload = {
      title: `${title} (達成)`,
      category: 'ルーティン達成',
      start_at: new Date(`${todayStr}T12:00:00`).toISOString(),
      end_at: new Date(`${todayStr}T13:00:00`).toISOString(),
      metadata: { isRoutineCompletion: true, routineTitle: title }
    };
    await supabase.from('events').insert([payload]);
    setIsModalOpen(false);
    fetchEvents();
  };

  const handleRecordRoutineMoney = async () => {
    const totalAmount = Number(routineAmount || 0) + Number(routineBonusAmount || 0);
    if (totalAmount <= 0) return alert('金額を入力してください');

    const todayStr = toLocalYYYYMMDD(new Date());
    const isIncome = customFieldsData.routineType === 'income';
    const payload = {
      title: `${title}${routineBonusAmount ? ' (特別支給含む)' : ''}`, category: '収支記録',
      start_at: new Date(`${todayStr}T10:00:00`).toISOString(), end_at: new Date(`${todayStr}T11:00:00`).toISOString(),
      metadata: {
        customColor: eventColor,
        customFields: {
          isIncomeSet: isIncome,
          standardIncomeAmount: isIncome ? String(totalAmount) : '',
          isSalary: isIncome, // 👈 追加：これを「給料」としてマークし、二重計上を防ぐ
          isExpenseSet: !isIncome,
          standardExpenseAmount: !isIncome ? String(totalAmount) : '',
          paymentMethod: !isIncome ? 'bank' : undefined // 支出ならデフォルト口座引落
        }
      }
    };
    await supabase.from('events').insert([payload]);
    setIsModalOpen(false); fetchEvents();
    setRoutineAmount(''); setRoutineBonusAmount('');
    alert(`${isIncome ? '収入' : '支出'}を帳簿に記録しました！`);
  };

  const executeBulkDelete = async () => {
    if (selectedForDelete.length === 0) return alert('削除する予定を選択してください。');
    if (confirm(`選択した ${selectedForDelete.length} 件の予定を本当に削除しますか？`)) {
      for (const id of selectedForDelete) {
        await supabase.from('events').delete().eq('id', id);
      }
      setIsDeleteMode(false);
      setSelectedForDelete([]);
      fetchEvents();
    }
  };

  const jumpToEvent = (evt: any) => {
    const d = new Date(evt.start);
    setCurrentYear(String(d.getFullYear())); setCurrentMonthNum(String(d.getMonth() + 1)); setCurrentDayNum(String(d.getDate()));
    if (viewType === 'timeGridWeek') {
      const start = new Date(d); start.setDate(start.getDate() - ((start.getDay() - firstDayOfWeek + 7) % 7));
      calendarRef.current?.getApi().gotoDate(start);
    } else calendarRef.current?.getApi().gotoDate(d);
  };

  const handleSearchExecute = () => {
    if (!searchQuery.trim()) return setSearchResults([]), setCurrentSearchIndex(-1);
    const lowerQ = searchQuery.toLowerCase();
    const results = events.filter((e: any) => {
      const tMatch = e.title.toLowerCase().includes(lowerQ);
      const locMatch = (e.extendedProps.metadata?.location || '').toLowerCase().includes(lowerQ);
      const catMatch = (e.extendedProps.category || '').toLowerCase().includes(lowerQ);
      const fieldMatch = e.extendedProps.metadata?.customFields && Object.values(e.extendedProps.metadata.customFields).some((val: any) =>
        typeof val === 'object' && val !== null ? Object.values(val).some((v: any) => String(v).toLowerCase().includes(lowerQ)) : String(val).toLowerCase().includes(lowerQ)
      );
      return tMatch || locMatch || catMatch || fieldMatch;
    }).sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());

    setSearchResults(results);
    if (results.length > 0) { setCurrentSearchIndex(0); jumpToEvent(results[0]); }
    else { setCurrentSearchIndex(-1); alert('該当する予定が見つかりませんでした'); }
  };

  const nextSearchResult = () => {
    if (searchResults.length === 0) return;
    const nextIdx = (currentSearchIndex + 1) % searchResults.length;
    setCurrentSearchIndex(nextIdx); jumpToEvent(searchResults[nextIdx]);
  };
  const prevSearchResult = () => {
    if (searchResults.length === 0) return;
    const prevIdx = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    setCurrentSearchIndex(prevIdx); jumpToEvent(searchResults[prevIdx]);
  };

  const handleToday = () => {
    const api = calendarRef.current?.getApi(); if (!api) return;
    api.today(); const d = api.getDate();
    setCurrentYear(String(d.getFullYear())); setCurrentMonthNum(String(d.getMonth() + 1)); setCurrentDayNum(String(d.getDate()));
    if (viewType === 'timeGridWeek') {
      const start = new Date(d); start.setDate(start.getDate() - ((start.getDay() - firstDayOfWeek + 7) % 7));
      calendarRef.current?.getApi().gotoDate(start);
    }
  };

  const getWeeksOfMonth = () => {
    if (!currentYear || !currentMonthNum) return [];
    const weeks = []; const start = new Date(Number(currentYear), Number(currentMonthNum) - 1, 1);
    start.setDate(start.getDate() - ((start.getDay() - firstDayOfWeek + 7) % 7));
    let current = new Date(start); let weekNum = 1;
    while (current.getMonth() === Number(currentMonthNum) - 1 || weekNum === 1) {
      const endOfWeek = new Date(current); endOfWeek.setDate(endOfWeek.getDate() + 6);
      const label = `第${weekNum}週 (${current.getMonth() + 1}/${current.getDate()}〜${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()})`;
      weeks.push({ dateStr: toLocalYYYYMMDD(current), label });
      current.setDate(current.getDate() + 7); weekNum++;
    }
    return weeks;
  };

  const getDaysOfMonth = () => {
    if (!currentYear || !currentMonthNum) return [];
    return Array.from({ length: new Date(Number(currentYear), Number(currentMonthNum), 0).getDate() }, (_, i: number) => {
      const d = i + 1; const dateObj = new Date(Number(currentYear), Number(currentMonthNum) - 1, d);
      return { value: String(d), label: `${d}(${DAY_NAMES[dateObj.getDay()]})` };
    });
  };

  const handleYearMonthChange = (y: string, m: string) => {
    setCurrentYear(y); setCurrentMonthNum(m);
    if (viewType === 'timeGridWeek') {
      const firstDate = new Date(Number(y), Number(m) - 1, 1);
      firstDate.setDate(firstDate.getDate() - ((firstDate.getDay() - firstDayOfWeek + 7) % 7));
      calendarRef.current?.getApi().gotoDate(firstDate);
    } else calendarRef.current?.getApi().gotoDate(`${y}-${m.padStart(2, '0')}-01`);
  };

  const handleDayChange = (day: string) => {
    setCurrentDayNum(day);
    calendarRef.current?.getApi().gotoDate(`${currentYear}-${currentMonthNum.padStart(2, '0')}-${day.padStart(2, '0')}`);
    setIsDayPickerOpen(false);
  };

  const handleDayHeaderClick = (dayIndex: number) => {
    setMode('dayOfWeekBulk');
    setSelectedDays([dayIndex]);
    const curMonth = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}`;
    setBulkStartMonth(curMonth);
    setBulkEndMonth(curMonth);
    setTitle(''); setLocation(''); setEventColor(''); setIsOutline(false); setCustomFieldsData({}); setPhotoUrls([]); setIsMilestone(false); setMemo(''); setRating(0); setIsPinned(false);
    setStartH('09'); setStartM('00'); setEndH('10'); setEndM('00');
    setIsModalOpen(true);
  };
  // 👇 重なりレベル計算関数（特定のイベントが他のイベントとどれだけ重なっているか）
  const calculateOverlapLevel = (event: any, events: any[]) => {
    if (events.length === 0) return 0;
    
    // イベントを開始時間順にソート（すでにされている前提）
    const sortedEvents = [...events];
    
    // 自分自身のインデックスを取得
    const eventIndex = sortedEvents.findIndex(e => e.id === event.id);
    if (eventIndex === -1) return 0;
    
    let overlapCount = 0;
    const currentStart = new Date(event.start).getTime();
    
    // 自分より前のイベントとの重なりを調べる
    for (let i = 0; i < eventIndex; i++) {
      const prevEvent = sortedEvents[i];
      const prevEnd = new Date(prevEvent.end || new Date(prevEvent.start).getTime() + 3600000).getTime();
      
      if (prevEnd > currentStart) {
        overlapCount++;
      }
    }
    return overlapCount;
  };

  const handleSelect = (info: any) => {
    if (isDeleteMode) return;
    if (isSwipingRef.current) return;

    // 👇 追加：コピーしている予定があれば、それをペーストして開く！
    if (clipboardEvent) {
      setMode('create');
      setStartDate(toLocalYYYYMMDD(info.start));
      const adjEnd = new Date(info.end); if (info.allDay) adjEnd.setDate(adjEnd.getDate() - 1);
      setEndDate(toLocalYYYYMMDD(adjEnd));
      
      setTitle(clipboardEvent.title); setLocation(clipboardEvent.location);
      setCategoryName(clipboardEvent.categoryName); setEventColor(clipboardEvent.eventColor);
      setIsOutline(clipboardEvent.isOutline); setCustomFieldsData(clipboardEvent.customFieldsData);
      setPhotoUrls(clipboardEvent.photoUrls); setMemo(clipboardEvent.memo); setRating(clipboardEvent.rating);
      setIsPinned(clipboardEvent.isPinned); setIsMilestone(clipboardEvent.isMilestone);
      setIsAllDayBackground(clipboardEvent.isAllDayBackground); setIsGathering(clipboardEvent.isGathering);
      setGatheringTime(clipboardEvent.gatheringTime); setDepartureTime(clipboardEvent.departureTime);
      setDepartureType(clipboardEvent.departureType);

      if (info.allDay) {
        setStartH(clipboardEvent.startH); setStartM(clipboardEvent.startM);
        setEndH(clipboardEvent.endH); setEndM(clipboardEvent.endM);
      } else {
        const s = info.start as Date; const e = info.end || new Date(s.getTime() + 60 * 60 * 1000);
        setStartH(String(s.getHours()).padStart(2, '0')); setStartM(String(s.getMinutes()).padStart(2, '0')); 
        setEndH(String(e.getHours()).padStart(2, '0')); setEndM(String(e.getMinutes()).padStart(2, '0'));
      }
      setClipboardEvent(null); // ペースト完了したら空にする
      setIsModalOpen(true);
      return;
    }

    setMode('create'); setStartDate(toLocalYYYYMMDD(info.start));
    const adjEnd = new Date(info.end); if (info.allDay) adjEnd.setDate(adjEnd.getDate() - 1); setEndDate(toLocalYYYYMMDD(adjEnd));
    setTitle(''); setLocation(''); setIsGathering(false); setGatheringTime(''); setDepartureTime(''); setDepartureType(startPointType === 'station' ? 'train' : 'home'); setSelectedDays([]);
    
    // 👇 修正：カレンダーのマスをタップして追加する際も、すべての設定とバーの開閉を確実にリセットする
    setCustomFieldsData({});
    setExpandedBlocks([]);
    
    if (info.allDay) {
      const nowH = new Date().getHours(); setStartH(String(nowH).padStart(2, '0')); setStartM('00'); setEndH(String(Math.min(nowH + 1, 23)).padStart(2, '0')); setEndM('00');
    } else {
      const s = info.start as Date; const e = info.end || new Date(s.getTime() + 60 * 60 * 1000);
      setStartH(String(s.getHours()).padStart(2, '0')); setStartM(String(s.getMinutes()).padStart(2, '0')); setEndH(String(e.getHours()).padStart(2, '0')); setEndM(String(e.getMinutes()).padStart(2, '0'));
    }
    setIsStocked(false);

    // 👇 修正：月カレンダーで「複数日（ドラッグして選択）」した場合は1日単位をデフォルトにする
    const diffDays = Math.round((new Date(info.end).getTime() - new Date(info.start).getTime()) / (1000 * 60 * 60 * 24));
    if (viewType === 'dayGridMonth' && diffDays > 1) {
      setIsAllDayBackground(true);
    } else {
      setIsAllDayBackground(false);
    }
    
    setRepeatUntil(toLocalYYYYMMDD(new Date(adjEnd.getFullYear(), adjEnd.getMonth() + 1, 0))); setIsModalOpen(true);
  };

  const handleEventClick = (info: any) => {
    if (isSwipingRef.current) return;
    const { event } = info;

    if (String(event.id).startsWith('sub-')) {
      const [_, name, y, m] = String(event.id).split('-');
      const d = event.start.getDate();
      const dateStr = `${y}-${m ? m.padStart(2, '0') : '01'}-${String(d).padStart(2, '0')}`;
      
      setMode('expense');
      setStartDate(dateStr);
      setCategoryName(event.extendedProps.category);
      setTitle(`${name} (今月の支払い)`);
      setExpenseAmount(event.extendedProps.metadata?.customFields?.standardExpenseAmount || '');
      setCustomFieldsData({ transactionMode: 'expense', isExpenseSet: true, paymentMethod: 'credit' });
      setIsModalOpen(true);
      return;
    }

    if (isDeleteMode) {
      if (event.extendedProps.isAnniversary || event.extendedProps.isRoutine) return;
      const id = event.id;
      setSelectedForDelete((prev: string[]) => prev.includes(id) ? prev.filter((i: string) => i !== id) : [...prev, id]);
      return;
    }

    if (event.extendedProps.isAnniversary) {
      const annivTitle = event.title; const idx = anniversaries.findIndex((a: any) => a.title === annivTitle);
      if (idx !== -1) {
        setEditAnnivIndex(idx);
        setNewAnnivTitle(anniversaries[idx].title);
        const [em, ed] = anniversaries[idx].date.split('-');
        setNewAnnivMonth(em);
        setNewAnnivDay(ed);
        setNewAnnivColor(anniversaries[idx].color);
        setIsAnniversaryModalOpen(true);
      }
      return;
    }

    if (event.extendedProps.isRoutine) {
      setMode('routine_detail');
      setTitle(event.title);
      setEventColor(event.backgroundColor || 'var(--theme)');
      setCustomFieldsData({ routineType: event.extendedProps.metadata?.routineType || 'task' });
      setIsModalOpen(true);
      return;
    }

    setMode('detail'); const props = event.extendedProps;
    setSelectedId(props.id); setTitle(event.title); setLocation(props.metadata?.location || ''); setCategoryName(props.category);
    setIsMilestone(props.isMilestone || false);

    setIsGathering(props.metadata?.isGathering || false); setGatheringTime(props.metadata?.gatheringTime || ''); setDepartureTime(props.metadata?.departureTime || ''); setDepartureType(props.metadata?.departureType || (startPointType === 'station' ? 'train' : 'home')); setPhotoUrls(props.metadata?.photoUrls || (props.metadata?.photoUrl ? [props.metadata.photoUrl] : []));
    setMemo(props.metadata?.memo || '');
    setRating(props.metadata?.rating || 0);
    setIsPinned(props.metadata?.isPinned || false);
    setIsStocked(props.metadata?.isStocked || false);
    // 挿入するコード
    setIsTentative(props.metadata?.isTentative || false);
    setExpandedBlocks([]); // 👈 支出、集合出発、交通機関のすべてのメニューを閉じた状態で開く

    const startDateStr = props.metadata?.startDateStr || (props.start_at ? props.start_at.split('T')[0] : toLocalYYYYMMDD(event.start));
    const endDateStr = props.metadata?.endDateStr || (props.end_at ? props.end_at.split('T')[0] : toLocalYYYYMMDD(event.end || event.start));

    setStartDate(startDateStr);
    setEndDate(endDateStr);

    const s = new Date(props.start_at || event.start);
    const e = new Date(props.end_at || event.end || s);

    setStartH(String(s.getHours()).padStart(2, '0')); setStartM(String(s.getMinutes()).padStart(2, '0')); setEndH(String(e.getHours()).padStart(2, '0')); setEndM(String(e.getMinutes()).padStart(2, '0'));
    setEventColor(props.metadata?.customColor || ''); setIsOutline(props.metadata?.isOutline || false); setIsAllDayBackground(props.metadata?.isAllDayBackground || false); setCustomFieldsData(props.metadata?.customFields || {}); setIsModalOpen(true);
  };

  const handleStartHChange = (val: string) => {
    setStartH(val);
    const sH = parseInt(val, 10);
    const sM = parseInt(startM, 10);
    const eH = parseInt(endH, 10);
    const eM = parseInt(endM, 10);
    if (sH * 60 + sM >= eH * 60 + eM) {
      let nextH = sH + 1;
      if (nextH > 23) nextH = 23;
      setEndH(String(nextH).padStart(2, '0'));
      setEndM(startM);
    }
  };

  const handleStartMChange = (val: string) => {
    setStartM(val);
    const sH = parseInt(startH, 10);
    const sM = parseInt(val, 10);
    const eH = parseInt(endH, 10);
    const eM = parseInt(endM, 10);
    if (sH * 60 + sM >= eH * 60 + eM) {
      let nextH = sH + 1;
      if (nextH > 23) nextH = 23;
      setEndH(String(nextH).padStart(2, '0'));
      setEndM(val);
    }
  };

  const handleCustomFieldChange = async (fId: string, val: any) => {
    const newData = { ...customFieldsData, [fId]: val };
    setCustomFieldsData(newData);

    if (mode === 'detail' && selectedId) {
      const currentEvent = events.find((e: any) => e.id === selectedId);
      if (currentEvent) {
        await supabase.from('events').update({
          metadata: { ...(currentEvent.extendedProps.metadata || {}), customFields: newData }
        }).eq('id', selectedId);
        fetchEvents();
      }
    }
  };

  const handleScoreChange = (fId: string, myVal: string, oppVal: string) => {
    let res = '';
    if (myVal !== '' && oppVal !== '') {
      const m = Number(myVal); const o = Number(oppVal);
      res = m > o ? 'win' : m < o ? 'lose' : 'draw';
    }
    handleCustomFieldChange(fId, { my: myVal, opp: oppVal, res });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setPhotoUrls(prev => [...prev, ev.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    if (!startDate || !title) return; 
    if (isSaving) return; // 👈 連打防止：すでに保存中なら何もしない
    setIsSaving(true);    // 👈 保存スタート
    
    // 👇 ラグ解消：データベースに送る前に、まずは画面(モーダル)をサッと閉じる！
    setIsModalOpen(false);

    const getISO = (d: string, h: string, m: string) => new Date(`${d}T${h}:${m}:00`).toISOString();

    try {
      const actualStartH = isAllDayBackground ? '00' : startH;
      const actualStartM = isAllDayBackground ? '00' : startM;
      const actualEndH = isAllDayBackground ? '23' : (isMilestone ? startH : endH);
      const actualEndM = isAllDayBackground ? '59' : (isMilestone ? startM : endM);
      const actualEndDate = isAllDayBackground ? endDate : (isMilestone ? startDate : endDate);

      const finalStartObj = new Date(`${startDate}T${actualStartH}:${actualStartM}:00`);
      const finalEndObj = new Date(`${actualEndDate}T${actualEndH}:${actualEndM}:00`);
      if (finalEndObj <= finalStartObj && !isAllDayBackground) {
        finalEndObj.setDate(finalEndObj.getDate() + 1);
      }
      const finalStartISO = finalStartObj.toISOString();
      const finalEndISO = finalEndObj.toISOString();

      const newCustomFields = { ...customFieldsData };
      const catObj = categories.find((c: any) => c.name === categoryName);

      // 💰 給与計算ロジック
      catObj?.fields?.forEach((f: any) => {
        if (f.type === 'wage' && f.wageRules) {
          let workStart = parseInt(actualStartH) * 60 + parseInt(actualStartM);
          let workEnd = parseInt(actualEndH) * 60 + parseInt(actualEndM);
          if (workEnd <= workStart) workEnd += 1440;

          let breakTime = parseInt(newCustomFields[f.id]?.breakTime || '0', 10);
          let stayMinutes = workEnd - workStart;
          if (breakTime > stayMinutes) breakTime = stayMinutes;

          let minuteWages: number[] = [];
          for (let m = workStart; m < workEnd; m++) {
            let dayM = m % 1440;
            let matchedWage = 0;
            f.wageRules.forEach((rule: any) => {
              if(!rule.start || !rule.end || !rule.wage) return;
              let rs = parseInt(rule.start.split(':')[0]) * 60 + parseInt(rule.start.split(':')[1].replace('59', '00'));
              let re = parseInt(rule.end.split(':')[0]) * 60 + parseInt(rule.end.split(':')[1].replace('59', '00'));
              if (re <= rs) re += 1440;
              let inRule = false;
              if (re > 1440) {
                if ((dayM >= rs && dayM < 1440) || (dayM >= 0 && dayM < re - 1440)) inRule = true;
              } else {
                if (dayM >= rs && dayM < re) inRule = true;
              }
              if (inRule) matchedWage = Math.max(matchedWage, parseInt(rule.wage));
            });
            minuteWages.push(matchedWage);
          }

          let breakStartIdx = Math.floor((stayMinutes - breakTime) / 2);
          for (let i = 0; i < breakTime; i++) {
            minuteWages[breakStartIdx + i] = 0;
          }

          let pastWorkMinutes = 0;
          events.forEach((ev: any) => {
            if (ev.id === selectedId) return; 
            const evDate = toLocalYYYYMMDD(new Date(ev.start));
            if (evDate === startDate && ev.extendedProps?.category === categoryName) {
              const evStartObj = new Date(ev.start);
              const evStartMin = evStartObj.getHours() * 60 + evStartObj.getMinutes();
              if (evStartMin < workStart) {
                const prevHours = ev.extendedProps?.metadata?.customFields?.[f.id]?.hours || 0;
                pastWorkMinutes += Math.round(Number(prevHours) * 60);
              }
            }
          });

          let totalWage = 0;
          let actualWorkCount = pastWorkMinutes;
          const applyOvertime = newCustomFields[f.id]?.overtimePremium !== false;
          const applyNight = newCustomFields[f.id]?.nightPremium !== false;

          for (let i = 0; i < stayMinutes; i++) {
            let currentMin = (workStart + i) % 1440;
            let w = minuteWages[i];
            if (w > 0) {
              actualWorkCount++;
              let multiplier = 1.0;
              if (applyOvertime && actualWorkCount > 480) multiplier += 0.25;
              if (applyNight && (currentMin >= 1320 || currentMin < 300)) multiplier += 0.25;
              totalWage += (w * multiplier) / 60;
            }
          }

          let actualHours = Math.round((actualWorkCount / 60) * 100) / 100;
          newCustomFields[f.id] = { ...newCustomFields[f.id], calculatedWage: Math.round(totalWage), hours: actualHours };
        }
      });

      const finalGatheringTime = gatheringTime || `${startH}:${startM}`;
      const finalDepartureTime = departureTime || `${String(Math.max(0, Number(startH) - 1)).padStart(2, '0')}:${startM}`;

      const metadata = {
        location, isGathering, 
        gatheringTime: isGathering ? finalGatheringTime : '', 
        departureTime: isGathering ? finalDepartureTime : '', 
        departureType, walkTime,
        customColor: eventColor || undefined, isOutline, customFields: newCustomFields,
        photoUrls, isMilestone, memo, rating, isPinned, isStocked, isAllDayBackground,
        startDateStr: startDate, endDateStr: endDate,
        user_id: activeUserId,
        isTentative
      };

      // 💾 保存処理
      if (mode === 'dayOfWeekBulk' && bulkStartMonth && bulkEndMonth && selectedDays.length > 0) {
        const bulkEvents = [];
        const [sYear, sMonth] = bulkStartMonth.split('-');
        const startDateObj = new Date(Number(sYear), Number(sMonth) - 1, 1);
        const [eYear, eMonth] = bulkEndMonth.split('-');
        const endDateObj = new Date(Number(eYear), Number(eMonth), 0, 23, 59, 59);

        for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
          if (d.getDay() === selectedDays[0]) {
            const ds = toLocalYYYYMMDD(d);
            bulkEvents.push({ title, category: categoryName, start_at: new Date(`${ds}T${actualStartH}:${actualStartM}:00`).toISOString(), end_at: new Date(`${ds}T${actualEndH}:${actualEndM}:00`).toISOString(), metadata });
          }
        }
        if (bulkEvents.length > 0) await supabase.from('events').insert(bulkEvents);
      }
      else if (mode === 'create' && selectedDays.length > 0 && repeatUntil) {
        const endLimit = new Date(repeatUntil);
        const bulkEvents = [];
        for (let d = new Date(startDate); d <= endLimit; d.setDate(d.getDate() + 1)) {
          if (selectedDays.includes(d.getDay())) {
            bulkEvents.push({ title, category: categoryName, start_at: new Date(`${toLocalYYYYMMDD(d)}T${actualStartH}:${actualStartM}:00`).toISOString(), end_at: new Date(`${toLocalYYYYMMDD(d)}T${actualEndH}:${actualEndM}:00`).toISOString(), metadata });
          }
        }
        await supabase.from('events').insert(bulkEvents);
      }
      else {
        // 👇 ここが重要！
        const payload = { title, category: categoryName, start_at: finalStartISO, end_at: finalEndISO, metadata };
        if (mode === 'create') {
          await supabase.from('events').insert([payload]);
        } else {
          await supabase.from('events').update(payload).eq('id', selectedId);
        }
      }

      await fetchEvents(); // 保存が終わったらカレンダー表示を更新
    } catch (error) {
      alert("保存に失敗しました。");
      setIsModalOpen(true); // 失敗したらモーダルを再度開く
    } finally {
      setIsSaving(false); // 保存完了フラグを戻す
    }
  };   

  

  const ColorSelector = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [tempColor, setTempColor] = useState(value);
    useEffect(() => { setTempColor(value); }, [value]);
    const isChanged = tempColor !== value;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--input-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {activePresets.map((c: string, i: number) => (
            <div key={`color-${i}`} onClick={() => { onChange(c); setTempColor(c); }} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: tempColor === c ? '3px solid var(--text-main)' : '2px solid transparent', boxSizing: 'border-box', boxShadow: `0 2px 6px ${c}50`, transition: 'all 0.2s', flexShrink: 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: tempColor, border: '2px solid var(--border-color)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
               <input type="color" value={tempColor} onChange={e => setTempColor(e.target.value)} style={{ opacity: 0, position: 'absolute', width: '200%', height: '200%', top: '-50%', left: '-50%', cursor: 'pointer' }} />
            </div>
            色を選択
          </label>
          {isChanged && (
            <button onClick={(e) => { e.preventDefault(); onChange(tempColor); if (!userColors.includes(tempColor)) setUserColors([...userColors, tempColor]); }} style={{ background: 'var(--theme)', color: '#fff', border: 'none', borderRadius: '20px', padding: '6px 16px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', animation: 'fadeIn 0.2s' }}>
              確定
            </button>
          )}
        </div>
      </div>
    );
  };

  // 👇 支出タイプのスマートアイコン・セレクト
  const ExpenseTypeSelector = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectorRef = useRef<HTMLDivElement>(null);

    // 外側をクリックした時に閉じる処理
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) setIsOpen(false);
      };
      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
      }
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }, [isOpen]);

    const options = [
      { id: 'expense', label: '通常の支出', icon: TrendingDown, color: '#ef4444' },
      { id: 'income', label: '収入・戻り', icon: TrendingUp, color: '#10b981' },
      { id: 'advance', label: '立て替えた (貸し)', icon: Handshake, color: '#f59e0b' },
      { id: 'borrow', label: '立て替えられた (借り)', icon: Users, color: '#3b82f6' }
    ];
    const current = options.find(o => o.id === value) || options[0];
    const Icon = current.icon;
    
    return (
      <div ref={selectorRef} style={{ position: 'relative', width: '100%' }}>
        <div onClick={() => setIsOpen(!isOpen)} className="pop-input" style={{ width: '100%', fontSize: '0.75rem', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: isOpen ? '2px solid var(--theme)' : '1px solid var(--border-color)', background: 'var(--input-bg)' }}>
          <Icon size={14} color={current.color} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{current.label}</span>
          {isOpen ? <ChevronUp size={14} color="var(--text-sub)" /> : <ChevronDown size={14} color="var(--text-sub)" />}
        </div>
        {isOpen && (
          <div className="hide-scrollbar" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', minWidth: '140px', background: 'var(--card-bg)', border: '1px solid var(--theme)', borderRadius: '12px', marginTop: '4px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 100, overflowY: 'auto', maxHeight: '160px', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {options.map(o => {
              const OptIcon = o.icon;
              return (
                <div key={o.id} onClick={() => { onChange(o.id); setIsOpen(false); }} style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-main)', background: value === o.id ? 'var(--input-bg)' : 'transparent', borderRadius: '8px', transition: 'background 0.2s' }}>
                  <OptIcon size={14} color={o.color} style={{ flexShrink: 0 }} />
                  {o.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const PaymentMethodSelector = ({ value, onChange, isIncome }: { value: string, onChange: (val: string) => void, isIncome: boolean }) => {
                      const [isOpen, setIsOpen] = useState(false);
                      const selectorRef = useRef<HTMLDivElement>(null);

                      useEffect(() => {
                        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
                          if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) setIsOpen(false);
                        };
                        if (isOpen) {
                          document.addEventListener('mousedown', handleClickOutside);
                          document.addEventListener('touchstart', handleClickOutside);
                        }
                        return () => {
                          document.removeEventListener('mousedown', handleClickOutside);
                          document.removeEventListener('touchstart', handleClickOutside);
                        };
                      }, [isOpen]);

                      const methods = isIncome 
                        ? [
                            { id: 'bank', label: '振込', icon: Landmark, color: 'var(--theme)' },
                            { id: 'cash', label: '現金', icon: Banknote, color: 'var(--theme)' },
                            { id: 'paypay', label: '電子マネー', icon: Smartphone, color: 'var(--theme)' }
                          ]
                        : [
                            { id: 'cash', label: '現金', icon: Banknote, color: 'var(--theme)' },
                            { id: 'credit', label: 'クレカ', icon: CreditCard, color: 'var(--theme)' },
                            { id: 'paypay', label: 'スマホ', icon: Smartphone, color: 'var(--theme)' },
                            { id: 'ic', label: '交通IC', icon: Train, color: 'var(--theme)' }
                          ];
                      const current = methods.find(m => m.id === value) || methods[0];
                      const Icon = current.icon;

                      return (
                        <div style={{ position: 'relative', flex: 1, minWidth: '100px' }}>
                          <div onClick={() => setIsOpen(!isOpen)} className="pop-input" style={{ fontSize: '0.75rem', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: isOpen ? '2px solid var(--theme)' : '1px solid var(--border-color)', background: 'var(--input-bg)' }}>
                            <Icon size={14} color={current.color} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{current.label}</span>
          {isOpen ? <ChevronUp size={14} color="var(--text-sub)" /> : <ChevronDown size={14} color="var(--text-sub)" />}
        </div>
        {isOpen && (
          <div className="hide-scrollbar" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', minWidth: '120px', background: 'var(--card-bg)', border: '1px solid var(--theme)', borderRadius: '12px', marginTop: '4px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 100, overflowY: 'auto', maxHeight: '160px', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {methods.map(m => {
              const OptIcon = m.icon;
              return (
                <div key={m.id} onClick={() => { onChange(m.id); setIsOpen(false); }} style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-main)', background: value === m.id ? 'var(--input-bg)' : 'transparent', borderRadius: '8px', transition: 'background 0.2s' }}>
                  <OptIcon size={14} color={m.color} style={{ flexShrink: 0 }} />
                  {m.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderListItem = (key: string, color: string, text: string, onEdit: any, onDelete: any) => (
    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 8px', borderBottom: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '14px', height: '14px', borderRadius: '50%', backgroundColor: color, boxShadow: `0 0 8px ${color}80` }} />
        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>{text}</span>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {onEdit && <button onClick={onEdit} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}>編集</button>}
        <button onClick={onDelete} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 4px rgba(239,68,68,0.2)' }}>削除</button>
      </div>
    </div>
  );

  const ModalHeader = ({ title, onClose, rightEl = null }: any) => (
    <div className="modal-header">
      <h2 className="modal-title" style={{ color: themeColor }}>{title}</h2>
      {rightEl || <button onClick={onClose} className="btn-close">×</button>}
    </div>
  );

  const renderEventContent = (arg: any) => {
    const { event, view } = arg;
    const { start, end, extendedProps } = event;
    const { metadata = {}, isMilestone } = extendedProps;
    const viewType = view.type;

    const cColor = extendedProps.cColor || extendedProps.customColor || metadata.customColor || event.backgroundColor || 'var(--theme)';
    const displayTitle = (event.title || '').replace('📌 ', '').replace(' 📷', '');
    const charCount = displayTitle.length || 1;
    const hasPhoto = metadata.photoUrls && metadata.photoUrls.length > 0;
    const isHighlighted = searchResults.length > 0 && event.id === String(searchResults[currentSearchIndex]?.id);
    const isSelectedForDelete = isDeleteMode && selectedForDelete.includes(event.id);
    const highlightClass = isHighlighted ? 'highlighted-event' : (isSelectedForDelete ? 'delete-selected-event' : '');

    if (extendedProps.category === '収支記録' || extendedProps.category === 'ルーティン達成') {
      return <div style={{ display: 'none' }}></div>;
    }

    // 👇 修正：月毎カレンダーの表示モード（ドット・写真）を【最優先】で処理する
    if (viewType === 'dayGridMonth' && displayMode !== 'normal') {
      if (displayMode === 'dot') {
        return (
          <div className={highlightClass} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '24px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cColor, boxShadow: `0 2px 4px ${cColor}60` }} />
          </div>
        );
      }
      if (displayMode === 'photo') {
        if (hasPhoto) {
          return (
            <div className={highlightClass} style={{ width: '100%', height: '40px', padding: '2px', display: 'flex', justifyContent: 'center' }}>
              <img src={metadata.photoUrls[0]} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }} alt="event" />
            </div>
          );
        }
        return <div style={{ display: 'none' }}></div>; // 写真がない予定は完全に非表示
      }
    }

    // 挿入するコード
    if (extendedProps.isTransitEvent) {
      if (viewType === 'dayGridMonth') return null;
      const startObj = new Date(start);
      const endObj = end ? new Date(end) : new Date(startObj.getTime() + 3600000);
      const sT = `${String(startObj.getHours()).padStart(2, '0')}:${String(startObj.getMinutes()).padStart(2, '0')}`;
      const eT = `${String(endObj.getHours()).padStart(2, '0')}:${String(endObj.getMinutes()).padStart(2, '0')}`;
      
      const targetId = event.id.replace('-travel', '').replace('-transit-out', '').replace('-transit-ret', '');

      // 交通機関の種類に応じたスマートアイコンの判定
      let TransitIcon = Train;
      if (extendedProps.transitType === 'plane') TransitIcon = Plane;
      else if (extendedProps.transitType === 'bus') TransitIcon = Bus;
      else if (extendedProps.transitType === 'home') TransitIcon = Home;

      return (
        <div data-travel-target={targetId} style={{
          width: '100%', height: '100%', padding: '4px',
          background: hexToRgba(cColor, 0.1), border: `1.5px solid ${cColor}`, // 👈 点線(dashed)から実線(solid)へ変更
          borderRadius: '4px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', gap: '2px'
        }}>
          <TransitIcon size={12} color={cColor} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.55rem', fontWeight: '900', color: cColor, textAlign: 'center', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
            {sT}〜{eT}
          </span>
        </div>
      );
    }

    const actualStart = extendedProps.originalStart ? new Date(extendedProps.originalStart) : start;
    const durationMin = (end && actualStart) ? (end.getTime() - actualStart.getTime()) / 60000 : 60;

    let startTimeOnly = '';
    let endTimeOnly = '';
    if (actualStart) {
      startTimeOnly = `${String(actualStart.getHours()).padStart(2, '0')}:${String(actualStart.getMinutes()).padStart(2, '0')}`;
      if (end) endTimeOnly = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    }

    const depTime = metadata.departureTime;
    const isGatheringSet = metadata.isGathering && depTime;
    const dType = metadata.departureType || (startPointType === 'station' ? 'train' : 'home');
    const customStart = metadata.customFields?.customStartLocation;

    let houseLeaveTimeStr = '';
    if (isGatheringSet && depTime.includes(':')) {
      if (startPointType === 'station' || dType === 'train') {
        const wTime = parseInt(metadata.walkTime || walkTime || '0', 10);
        if (wTime > 0) {
          const [h, m] = depTime.split(':').map(Number);
          const dObj = new Date(); dObj.setHours(h, m, 0); dObj.setMinutes(dObj.getMinutes() - wTime);
          houseLeaveTimeStr = `${String(dObj.getHours()).padStart(2, '0')}:${String(dObj.getMinutes()).padStart(2, '0')}`;
        }
      }
    }

    const DepartureBadge = null;

    const transitBadge = metadata.customFields?.isTransit && (viewType === 'timeGridWeek' || viewType === 'timeGridDay') ? (
      <div style={{ position: 'absolute', top: '2px', right: '4px', fontSize: '0.65rem', background: '#fff', color: cColor, padding: '2px 4px', borderRadius: '4px', border: `1px solid ${cColor}`, zIndex: 50, fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '2px' }}>
        {metadata.customFields.transitType === 'plane' ? <Plane size={10} /> : metadata.customFields.transitType === 'bus' ? <Bus size={10} /> : <Train size={10} />}
        <span>{metadata.customFields.transitDepTime}発</span>
      </div>
    ) : null;

    if (metadata.isAllDayBackground) {
      if (viewType === 'timeGridWeek') {
        return (
          <div className={highlightClass} style={{
            width: '100%', height: '100%', cursor: 'pointer', overflow: 'hidden',
            background: hexToRgba(cColor, 0.2), borderLeft: `4px solid ${cColor}`,
            padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px',
            borderRadius: '4px', boxSizing: 'border-box'
          }}>
            {metadata.isPinned && <Pin size={10} style={{ color: cColor, flexShrink: 0, transform: 'rotate(45deg)' }} />}
            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: cColor, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {displayTitle}
            </span>
          </div>
        );
      } else {
        return (
          <div className={highlightClass} style={{
            backgroundColor: 'transparent', padding: '4px 0', position: 'relative',
            display: 'flex', alignItems: 'center', width: '100%', height: '100%', boxSizing: 'border-box'
          }}>
            <div style={{
              position: 'absolute', top: '50%',
              left: arg.isStart ? '8px' : '-6px', right: arg.isEnd ? '4px' : '-6px',
              height: '2px', backgroundColor: cColor, boxShadow: `0 0 6px ${cColor}`, transform: 'translateY(-50%)', zIndex: 1
            }} />
            {arg.isStart && (
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--bg-main)', border: `3px solid ${cColor}`, boxShadow: `0 0 10px ${cColor}`, zIndex: 2, flexShrink: 0, marginLeft: '4px', marginRight: '4px' }} />
            )}
            {arg.isStart && displayMode !== 'dot' && (
              <span style={{
                fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-main)',
                background: 'var(--bg-main)', padding: '0 4px', zIndex: 2,
                marginLeft: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {metadata.isPinned && <Pin size={10} style={{ color: 'var(--text-main)', flexShrink: 0, marginRight: '2px', display: 'inline-block', transform: 'rotate(45deg)' }} />}
                {displayTitle}
              </span>
            )}
          </div>
        );
      }
    }

    const overlappingEvents = view.calendar.getEvents().filter((other: any) => {
      if (other.id === event.id || other.allDay || other.extendedProps?.isAnniversary || other.extendedProps?.isMilestone || other.extendedProps?.metadata?.isAllDayBackground) return false;
      const oStart = other.start?.getTime() || 0;
      const oEnd = other.end?.getTime() || (oStart + 3600000);
      const eStart = start?.getTime() || 0;
      const eEnd = end?.getTime() || (eStart + 3600000);
      return (oStart < eEnd && oEnd > eStart);
    });
    const allOverlappingCount = 1 + overlappingEvents.length;

    if (viewType === 'dayGridMonth') {
      const isRoutine = extendedProps.isRoutine;
      const isAnniversary = extendedProps.isAnniversary;
      const isSub = String(event.id).startsWith('sub-');
      const isPayment = (isRoutine && metadata.routineType === 'expense') || isSub;

      if (isAnniversary) {
        return (
          <div className={highlightClass} style={{
            display: 'flex', alignItems: 'center', padding: '1px 4px', overflow: 'hidden', width: '100%', height: '20px', /* 👈 26pxを20pxに */
            backgroundColor: hexToRgba(cColor, 0.1), border: `1px solid ${hexToRgba(cColor, 0.3)}`, borderRadius: '4px', boxSizing: 'border-box', marginBottom: '2px',
            boxShadow: `inset 0 0 8px ${hexToRgba(cColor, 0.05)}`
          }}>
            <Gift size={10} style={{ color: cColor, marginRight: '4px', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '900', fontSize: '0.65rem', color: cColor }}>{displayTitle}</span>
          </div>
        );
      }

      if (isPayment) {
        return (
          <div className={highlightClass} style={{
            display: 'flex', alignItems: 'center', padding: '2px 6px', overflow: 'hidden', width: '100%', height: '22px',
            backgroundColor: 'var(--card-bg)', border: `1px solid ${cColor}`, borderRadius: '6px', boxSizing: 'border-box', marginBottom: '2px'
          }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold', fontSize: '0.7rem', color: cColor }}>{displayTitle.replace('🔄 ', '')}</span>
          </div>
        );
      }

      if (isRoutine) {
        return (
          <div className={highlightClass} style={{
            display: 'flex', alignItems: 'center', padding: '2px 6px', overflow: 'hidden', width: '100%', height: '26px',
            backgroundColor: 'transparent', borderLeft: `3px solid ${cColor}`, borderBottom: `1px dashed ${hexToRgba(cColor, 0.3)}`, boxSizing: 'border-box', marginBottom: '2px'
          }}>
            <Repeat size={10} style={{ color: cColor, marginRight: '4px', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold', fontSize: '0.75rem', color: 'var(--text-main)' }}>{displayTitle}</span>
          </div>
        );
      }

      const isMultiDay = event.allDay || (end && (new Date(end).getTime() - new Date(start).getTime() > 24 * 60 * 60 * 1000));
      
      // 👇 追加：1行表示（コンパクト）モード
      if (displayMode === 'compact') {
        return (
          <div className={highlightClass} style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 4px', overflow: 'hidden', width: '100%', height: '20px',
            backgroundColor: isMultiDay ? hexToRgba(cColor, 0.15) : 'transparent',
            backgroundImage: isMultiDay ? 'none' : `linear-gradient(to top, ${hexToRgba(cColor, 0.25)} 0%, transparent 6px)`,
            borderLeft: `3px solid ${cColor}`, borderRadius: '2px', boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', width: '100%' }}>
              {!isMultiDay && !event.allDay && <span style={{ fontSize: '0.6rem', fontWeight: '900', color: cColor, lineHeight: '1', flexShrink: 0 }}>{startTimeOnly}</span>}
              {metadata.isPinned && <Pin size={8} style={{ flexShrink: 0, transform: 'rotate(45deg)', color: 'var(--text-main)' }} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold', fontSize: '0.65rem', color: 'var(--text-main)' }}>{displayTitle}</span>
            </div>
          </div>
        );
      } 
      // 👇 追加：2行表示（元の通常モード）。3つ収まるように高さを26pxに微調整しています。
      else {
        return (
          <div className={highlightClass} style={{
            display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 4px', overflow: 'hidden', width: '100%', height: '26px',
            backgroundColor: isMultiDay ? hexToRgba(cColor, 0.15) : 'transparent',
            backgroundImage: isMultiDay ? 'none' : `linear-gradient(to top, ${hexToRgba(cColor, 0.25)} 0%, transparent 6px)`,
            borderLeft: `3px solid ${cColor}`, borderRadius: '2px', boxSizing: 'border-box'
          }}>
            {!isMultiDay && !event.allDay && <span style={{ fontSize: '0.55rem', fontWeight: '900', color: cColor, lineHeight: '1' }}>{startTimeOnly}</span>}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden', width: '100%' }}>
              {metadata.isPinned && <Pin size={10} style={{ flexShrink: 0, transform: 'rotate(45deg)', color: 'var(--text-main)' }} />}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 'bold', fontSize: '0.7rem', color: 'var(--text-main)' }}>{displayTitle}</span>
            </div>
          </div>
        );
      }
    }

    if (isMilestone) {
      return (
        <div className={highlightClass} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'visible' }}>
          <div style={{
            position: 'absolute', top: '0px', right: '2px', transform: 'translateY(-50%)',
            width: '12px', height: '12px', borderRadius: '50%',
            backgroundColor: cColor, border: '2px solid #fff',
            boxShadow: `0 2px 4px ${hexToRgba(cColor, 0.5)}`, zIndex: 100
          }} />
        </div>
      );
    }

    if (viewType === 'timeGridDay') {
      return (
        <div className={`${highlightClass} smart-event-container force-full-width`} style={{
          height: '100%', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          backgroundColor: hexToRgba(cColor, 0.15),
          backgroundImage: `linear-gradient(to top, ${hexToRgba(cColor, 0.3)} 0%, transparent 12px)`,
          borderLeft: `4px solid ${cColor}`, borderRadius: '4px',
          padding: '4px 8px', boxSizing: 'border-box', position: 'relative'
        }}>
          {DepartureBadge}
          {transitBadge}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', height: '100%', overflow: 'hidden' }}>
            <div className="title-horizontal" style={{
              fontSize: '0.85rem', fontWeight: 'bold', color: useEventColorForTitle ? cColor : 'var(--text-main)',
              display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 3,
              overflow: 'hidden', wordBreak: 'break-word', lineHeight: 1.3, flex: 1
            }}>
              {metadata.isPinned && <Pin size={10} style={{ transform: 'rotate(45deg)', marginRight: '2px', display: 'inline-block' }} />}
              {displayTitle}
            </div>
            <div className="priority-meta-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, gap: '4px', textAlign: 'right' }}>
              <div className="priority-time" style={{ fontSize: '0.65rem', fontWeight: '900', color: cColor, lineHeight: 1.1 }}>
                {startTimeOnly} - {endTimeOnly}
              </div>
              {metadata.location && (
                <div className="priority-location" style={{
                  fontSize: '0.65rem', color: '#718096',
                  display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px'
                }}>
                  <MapPin size={10} style={{ flexShrink: 0 }} />
                  {metadata.location}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (viewType === 'timeGridWeek') {
      const isCrowded = allOverlappingCount >= 3;

      if (isCrowded) {
        return (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              view.calendar.changeView('timeGridDay', start);
            }}
            style={{
              height: '100%', width: '100%', display: 'flex', flexDirection: 'column',
              backgroundColor: hexToRgba(cColor, 0.15),
              border: `2px solid ${cColor}`, borderRadius: '4px',
              cursor: 'pointer', boxSizing: 'border-box'
            }}
            title="タップして日表示で確認"
          />
        );
      }

      const isNarrow = allOverlappingCount > 1;
      let useVertical = false;
      let titleSize = '0.75rem';
      let showLocation = false;
      let showStartTime = durationMin >= 60;
      let showEndTime = durationMin >= 60;
      const spacePerChar = durationMin / charCount;

      if (isNarrow) {
        if (durationMin <= 45 && charCount >= 5) {
          useVertical = false;
          titleSize = '0.55rem';
        } else {
          useVertical = true;
          const calculatedSize = 0.012 * spacePerChar + 0.45;
          titleSize = `${Math.min(Math.max(calculatedSize, 0.55), 0.75)}rem`;
        }
        if (durationMin > 90) { showStartTime = true; showEndTime = true; }
      } else {
        if (durationMin >= 90) {
          useVertical = true;
          showLocation = durationMin >= 120;
          const calculatedSize = 0.015 * spacePerChar + 0.55;
          let maxSize = 0.85;
          if (charCount >= 6) maxSize = 0.75;
          if (charCount >= 9) maxSize = 0.65;
          titleSize = `${Math.min(Math.max(calculatedSize, 0.55), maxSize)}rem`;
        } else {
          useVertical = false;
          showStartTime = durationMin >= 60; showEndTime = durationMin >= 60;
          if (durationMin <= 30 || charCount >= 10) titleSize = '0.55rem';
          else if (durationMin <= 45 || charCount >= 6) titleSize = '0.6rem';
          else titleSize = '0.7rem';
        }
      }

      let availableLines = Math.floor(durationMin / 15);
      if (!useVertical && showStartTime) availableLines -= 1;
      if (availableLines < 1) availableLines = 1;

      const hasLocationRight = useVertical && !isNarrow && showLocation && metadata.location;
      const maxFitChars = (durationMin - (showStartTime ? 12 : 0) - (showEndTime ? 12 : 0)) / 12;
      const isOverflowing = charCount > maxFitChars;
      const dynamicAlign = useVertical ? (isOverflowing ? 'flex-start' : 'center') : 'center';
      const safeMaxChars = Math.floor(maxFitChars);
      const extraSpace = (metadata.isPinned ? 1 : 0) + (hasPhoto ? 1 : 0);
      const finalDisplayTitle = (useVertical && isOverflowing)
        ? displayTitle.slice(0, Math.max(1, safeMaxChars - extraSpace - 1)) + '…'
        : displayTitle;

      return (
        <div data-main-id={event.id} className={`${highlightClass} smart-event-container ${!isNarrow ? 'force-full-width' : ''}`} style={{
          height: '100%', width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          backgroundColor: hexToRgba(cColor, 0.15),
          backgroundImage: `linear-gradient(to top, ${hexToRgba(cColor, 0.3)} 0%, transparent 12px)`,
          borderLeft: `4px solid ${cColor}`, borderRadius: '4px',
          justifyContent: 'space-between', position: 'relative'
        }}>
          {DepartureBadge}
          {showStartTime && (
            <div style={{ padding: '2px 0', width: '100%', textAlign: 'center', fontSize: '0.55rem', fontWeight: '900', color: cColor, lineHeight: 1.1 }}>
              {startTimeOnly}
            </div>
          )}
          <div style={{
            flex: 1, display: 'flex', overflow: 'hidden', justifyContent: 'center',
            alignItems: dynamicAlign,
            flexDirection: 'row', gap: '8px', position: 'relative',
            paddingTop: (useVertical && isOverflowing) ? '2px' : '0',
            transform: hasLocationRight ? 'translateX(-4px)' : 'none',
            paddingRight: hasLocationRight ? '12px' : '0',
            marginBottom: showEndTime ? '12px' : '0'
          }}>
            <div style={{
              fontSize: titleSize, fontWeight: 'bold', color: useEventColorForTitle ? cColor : 'var(--text-main)',
              writingMode: useVertical ? 'vertical-rl' : 'horizontal-tb',
              textOrientation: useVertical ? 'upright' : 'mixed',
              whiteSpace: useVertical ? 'nowrap' : 'normal',
              wordBreak: 'break-all', display: useVertical ? 'block' : '-webkit-box',
              WebkitBoxOrient: 'vertical', WebkitLineClamp: useVertical ? undefined : availableLines,
              overflow: 'hidden', textOverflow: 'ellipsis',
              textAlign: useVertical ? (isOverflowing ? 'start' : 'center') : 'center',
              maxHeight: '100%'
            } as any}>
              {useVertical ? (
                <span style={{ display: 'inline-block', width: '100%' }}>
                  {metadata.isPinned && <Pin size={10} style={{ transform: 'rotate(45deg)', marginBottom: '2px' }} />}
                  {finalDisplayTitle}
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', gap: '2px', justifyContent: 'center' }}>
                  {metadata.isPinned && <Pin size={10} style={{ flexShrink: 0, transform: 'rotate(45deg)' }} />}
                  <span>{displayTitle}</span>
                </div>
              )}
            </div>
            {hasLocationRight && (
              <div style={{
                position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                fontSize: '0.6rem', color: '#718096', writingMode: 'vertical-rl',
                textOrientation: 'upright',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxHeight: '90%', display: 'flex', alignItems: 'center', gap: '2px'
              }}>
                <MapPin size={8} style={{ transform: 'rotate(0deg)' }} />
                {metadata.location}
              </div>
            )}
          </div>
          {showEndTime && (
            <div style={{ position: 'absolute', bottom: '2px', left: 0, width: '100%', textAlign: 'center' }}>
              <span style={{ fontSize: '0.5rem', fontWeight: '900', color: '#a0aec0', lineHeight: 1 }}>{endTimeOnly}</span>
            </div>
          )}
        </div>
      );
    }
  };

  const currentY = parseInt(currentYear || String(new Date().getFullYear()));
  
  const anniversaryEvents = anniversaries.flatMap((a: any) => [currentY - 1, currentY, currentY + 1].map((y: number) => ({
    id: `anniv-${a.title}-${y}`, title: `${a.title}`, start: `${y}-${a.date}`, allDay: true, backgroundColor: a.color, borderColor: a.color, display: 'block', extendedProps: { isAnniversary: true, category: '記念日' }
  })));
  
  const routineEvents = monthlyRoutines.flatMap((r: any) => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      
      // 👇 修正：その月の最終日を取得し、設定された日付(r.day)がはみ出さないように丸める
      const lastDayOfMonth = new Date(currentY, m, 0).getDate();
      const targetDay = r.day > lastDayOfMonth ? lastDayOfMonth : r.day;
      
      let dateObj = new Date(currentY, m - 1, targetDay);
      
      // 👇 修正：無限ループを防ぎつつ、土日祝を避けて前倒し・後倒しする
      if (r.adjust === 'prev') {
        let count = 0;
        while ((dateObj.getDay() === 0 || dateObj.getDay() === 6 || holidays[toLocalYYYYMMDD(dateObj)]) && count < 10) {
          dateObj.setDate(dateObj.getDate() - 1);
          count++;
        }
      } else if (r.adjust === 'next') {
        let count = 0;
        while ((dateObj.getDay() === 0 || dateObj.getDay() === 6 || holidays[toLocalYYYYMMDD(dateObj)]) && count < 10) {
          dateObj.setDate(dateObj.getDate() + 1);
          count++;
        }
      }
      return {
        id: `routine-${r.title}-${currentY}-${m}`,
        title: `${r.title}`,
        start: toLocalYYYYMMDD(dateObj),
        allDay: true,
        backgroundColor: r.color,
        borderColor: r.color,
        display: 'block',
        extendedProps: { isRoutine: true, category: 'ルーティン', metadata: { routineType: r.type || 'task' } }
      };
    });
  });

  // 👇 追加：サブスクデータから「毎月/毎年の支払いイベント」を自動生成する魔法のロジック
  const subEvents = subs.flatMap((sub: any) => {
    const evts : any[] = [];
    const years = [currentY - 1, currentY, currentY + 1]; // 前後1年分を自動生成
    const catColor = categories.find((c: any) => c.name === sub.category)?.color || '#8b5cf6';

    years.forEach(y => {
      if (sub.cycle === 'monthly') {
        for (let m = 1; m <= 12; m++) {
          evts.push({
            id: `sub-${sub.name}-${y}-${m}`,
            title: `🔄 ${sub.name}`,
            start: `${y}-${String(m).padStart(2, '0')}-${String(sub.date).padStart(2, '0')}`,
            allDay: true,
            backgroundColor: 'transparent',
            borderColor: catColor,
            textColor: 'var(--text-main)',
            display: 'block',
            extendedProps: {
              category: sub.category || 'サブスク',
              metadata: { customColor: catColor, isAllDayBackground: false, customFields: { isExpenseSet: true, standardExpenseAmount: sub.amount } }
            }
          });
        }
      } else if (sub.cycle === 'yearly') {
        evts.push({
          id: `sub-${sub.name}-${y}`,
          title: `🔄 ${sub.name}`,
          start: `${y}-${sub.date}`,
          allDay: true,
          backgroundColor: 'transparent',
          borderColor: catColor,
          textColor: 'var(--text-main)',
          display: 'block',
          extendedProps: {
            category: sub.category || 'サブスク',
            metadata: { customColor: catColor, isAllDayBackground: false, customFields: { isExpenseSet: true, standardExpenseAmount: sub.amount } }
          }
        });
      }
    });
    return evts;
  });
    
    const displayEvents = [...events, ...anniversaryEvents, ...routineEvents].flatMap((e: any) => {
    const metadata = e.extendedProps?.metadata || {};
    const cColor = e.extendedProps?.cColor || e.backgroundColor || 'var(--theme)';
    const results = [];

    // 出発・集合ブロックの生成
    if (metadata.isGathering && metadata.departureTime) {
      const [dh, dm] = metadata.departureTime.split(':').map(Number);
      const [gh, gm] = (metadata.gatheringTime || "12:00").split(':').map(Number);
      const wTime = parseInt(metadata.walkTime || walkTime || '0', 10);
      
      const moveStart = new Date(e.start);
      moveStart.setHours(dh, dm, 0);
      if (metadata.departureType !== 'home') moveStart.setMinutes(moveStart.getMinutes() - wTime);
      
      const moveEnd = new Date(e.start);
      moveEnd.setHours(gh, gm, 0);

      results.push({
        id: `${e.id}-travel`,
        groupId: e.id, 
        title: `${moveStart.getHours()}:${String(moveStart.getMinutes()).padStart(2,'0')} → ${metadata.gatheringTime}`,
        start: moveStart.toISOString(),
        end: moveEnd.toISOString(),
        allDay: false,
        backgroundColor: 'transparent',
        borderColor: cColor,
        extendedProps: { isTransitEvent: true, cColor, transitType: metadata.departureType }
      });
    }

    // 👇 追加：交通機関（往復）ブロックの生成
    if (metadata.customFields?.isTransit) {
      if (metadata.customFields.transitDepTime && metadata.customFields.transitArrTime) {
        const [dh, dm] = metadata.customFields.transitDepTime.split(':').map(Number);
        const [ah, am] = metadata.customFields.transitArrTime.split(':').map(Number);
        
        const tStart = new Date(e.start);
        tStart.setHours(dh, dm, 0);
        
        const tEnd = new Date(e.start);
        tEnd.setHours(ah, am, 0);
        if (tEnd < tStart) tEnd.setDate(tEnd.getDate() + 1);

        results.push({
          id: `${e.id}-transit-out`,
          groupId: e.id, 
          title: `行き`,
          start: tStart.toISOString(),
          end: tEnd.toISOString(),
          allDay: false,
          backgroundColor: 'transparent',
          borderColor: cColor,
          extendedProps: { isTransitEvent: true, cColor, transitType: metadata.customFields.transitType }
        });
      }

      if (metadata.customFields.hasReturnTransit && metadata.customFields.returnTransitDepTime && metadata.customFields.returnTransitArrTime) {
        const [dh, dm] = metadata.customFields.returnTransitDepTime.split(':').map(Number);
        const [ah, am] = metadata.customFields.returnTransitArrTime.split(':').map(Number);
        
        // 復路は予定の終了日を基準にする
        const retBase = e.end ? new Date(e.end) : new Date(e.start);
        if (e.allDay && e.end) retBase.setDate(retBase.getDate() - 1); 
        
        const retStart = new Date(retBase);
        retStart.setHours(dh, dm, 0);
        
        const retEnd = new Date(retBase);
        retEnd.setHours(ah, am, 0);
        if (retEnd < retStart) retEnd.setDate(retEnd.getDate() + 1);

        results.push({
          id: `${e.id}-transit-ret`,
          groupId: e.id, 
          title: `帰り`,
          start: retStart.toISOString(),
          end: retEnd.toISOString(),
          allDay: false,
          backgroundColor: 'transparent',
          borderColor: cColor,
          extendedProps: { isTransitEvent: true, cColor, transitType: metadata.customFields.returnTransitType }
        });
      }
    }

    results.push({ 
      ...e, 
      groupId: e.id, 
      extendedProps: { ...e.extendedProps, originalStart: e.start } 
    });
    return results;
  }).filter((e: any) => {
    if (e.extendedProps?.metadata?.isStocked) return false;
    // 👇 月表示の時は移動枠を消して隙間を詰める！
    if (viewType === 'dayGridMonth' && e.extendedProps?.isTransitEvent) return false;
    // 👇 単発の収支記録（金額だけの独立データ）をカレンダーのマス目から非表示にする
    if (e.extendedProps?.metadata?.isPureFinance) return false;
    
    // 👇 月毎カレンダーでは、サブスクや支払いをブロックとして表示しない！
    if (viewType === 'dayGridMonth') {
      const isSub = String(e.id).startsWith('sub-');
      const isRoutineExpense = e.extendedProps?.isRoutine && e.extendedProps?.metadata?.routineType === 'expense';
      const isManualPayment = e.extendedProps?.metadata?.customFields?.isExpenseSet && (e.title?.includes('支払') || e.title?.includes('引落'));
      if (isSub || isRoutineExpense || isManualPayment) return false;
      
      // 👇 追加：月毎カレンダーでジャンルが選択されている場合、それ以外の予定を隠す
      if (calendarCategoryFilter !== 'すべて' && e.extendedProps?.category !== calendarCategoryFilter) {
        return false;
      }
    }
    
    return true;
  });

  const currentCategoryObj = categories.find((c: any) => c.name === categoryName);
  const currentMonthStr = `${currentYear}-${currentMonthNum.padStart(2, '0')}`;
  const currentMonthEvents = displayEvents.filter((e: any) => e.start && e.start.startsWith(currentMonthStr) && !e.extendedProps.isAnniversary);
  const currentYearEvents = displayEvents.filter((e: any) => e.start && e.start.startsWith(currentYear));

useEffect(() => {
    if (viewType !== 'timeGridWeek' && viewType !== 'timeGridDay') return;
    const syncWidths = () => {
      const calendarEl = document.querySelector('.fc');
      if (!calendarEl) return;
      const transitEls = calendarEl.querySelectorAll('[data-travel-target]');
      transitEls.forEach(tEl => {
        const targetId = tEl.getAttribute('data-travel-target');
        const mainEl = calendarEl.querySelector(`[data-main-id="${targetId}"]`);
        if (mainEl && tEl) {
          const tHarness = tEl.closest('.fc-timegrid-event-harness') as HTMLElement;
          const mainHarness = mainEl.closest('.fc-timegrid-event-harness') as HTMLElement;
          if (tHarness && mainHarness) {
            // 本体の幅と位置（left/right）を、そのまま移動枠にコピー
            tHarness.style.left = mainHarness.style.left;
            tHarness.style.right = mainHarness.style.right;
            tHarness.style.width = mainHarness.style.width;
            tHarness.style.marginLeft = mainHarness.style.marginLeft;
            tHarness.style.marginRight = mainHarness.style.marginRight;
            tHarness.style.zIndex = mainHarness.style.zIndex;
          }
        }
      });
    };
    const observer = new MutationObserver(() => syncWidths());
    const container = document.querySelector('.fc');
    if (container) observer.observe(container, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
    setTimeout(syncWidths, 50);
    return () => observer.disconnect();
  }, [events, viewType, currentWeekStartStr]);

  // 🚨 エラー修正＆機能強化：文章生成のロジック
  useEffect(() => {
    if (assistMode === 'send') {
      if (assistTimeSlots.length === 0) {
        setGeneratedText('カレンダーから空き時間を追加するか、下から日付を選択してください。');
        return;
      }
      let text = "以下の日程でご都合はいかがでしょうか？\n\n";
      assistTimeSlots.forEach(slot => {
        text += `・${slot}\n`;
      });
      text += "\n上記以外でも調整可能ですので、お知らせください！\n※都合の悪い時間帯があれば追記して送ってください。";
      setGeneratedText(text);
    }
  }, [assistTimeSlots, assistMode]);

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted || !isDataLoaded) return <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }} />;

  function openAnalyticsModal() {
    throw new Error('Function not implemented.');
  }
  if (!activeUserId) {
    return (
      <AuthScreen 
        themeColor={themeColor} 
        onLoginSuccess={(id, name) => {
          setActiveUserId(id);
          setActiveUserName(name);
          // 👇 修正：タブを閉じてもログイン状態をずっと維持する
          localStorage.setItem('os_active_session', JSON.stringify({ id, name }));
        }} 
      />
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', height: '100dvh', width: '100vw', background: 'var(--bg-main)', overflow: 'hidden' }}>
      <style>{`
        :root {
          --theme: ${themeColor};
          --theme-shadow: ${themeColor}40;
          --theme-border: ${hexToRgba(themeColor, isDarkMode ? 0.4 : 0.2)};
          --bg-main: ${isDarkMode ? '#0f172a' : '#f4f7fb'};
          --glass-bg: ${isDarkMode ? 'rgba(30,41,59,0.85)' : 'rgba(255, 255, 255, 0.85)'};
          --glass-border: ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255, 255, 255, 0.6)'};
          --text-main: ${isDarkMode ? '#f8fafc' : '#1e293b'};
          --text-sub: ${isDarkMode ? '#94a3b8' : '#64748b'};
          --card-bg: ${isDarkMode ? '#1e293b' : '#ffffff'};
          --input-bg: ${isDarkMode ? '#0f172a' : '#f8fafc'};
          --border-color: ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'};
          --app-font: ${fontFamily === 'serif' ? '"Noto Serif JP", "Hiragino Mincho ProN", serif' : fontFamily === 'rounded' ? '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", sans-serif' : '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", sans-serif'};
          color-scheme: ${isDarkMode ? 'dark' : 'light'};
        }

        .fc-theme-standard td, .fc-theme-standard th { border-color: var(--theme-shadow) !important; transition: border-color 0.3s; }
        .fc-scrollgrid { border: 1.5px solid var(--theme) !important; border-radius: 12px; overflow: hidden; }
        .fc-col-header-cell { border-bottom: 2px solid var(--theme) !important; }
        
        /* 👇 全ての数値入力の矢印（スピナー）を消す */
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
        * { box-sizing: border-box; }
        
        /* 👇 追加：画面全体のスクロールとバウンス（引っ張る動き）を完全に止める */
        html, body { margin: 0; padding: 0; height: 100dvh; overflow: hidden; overscroll-behavior: none; }
        
        body, .fixed-mobile-frame, .fc {
          color: var(--text-main);
          font-family: var(--app-font) !important;
        }

        .fixed-mobile-frame {
          width: 100%; max-width: 460px; height: 100dvh; /* 👈 100vhを100dvhに変更 */
          background-color: transparent;
          display: flex; flex-direction: column; position: relative; overflow: hidden;
        }

        .fc-event-main, .fc-v-event .fc-event-main { padding: 0 !important; color: inherit; }
        
        /* 👇 all-day枠（終日予定）の高さを予定の有無に関わらず完全に固定する */
        .fc-scrollgrid-section-allday td, .fc-scrollgrid-section-allday th { height: 34px !important; min-height: 34px !important; max-height: 34px !important; overflow: hidden !important; }
        .fc-timegrid-allday { height: 34px !important; min-height: 34px !important; max-height: 34px !important; padding: 0 !important; overflow: hidden !important; }
        .fc-timegrid-allday .fc-daygrid-day-events { margin: 0 !important; min-height: 34px !important; display: flex; align-items: center; padding-top: 1px !important; }
        
        .fc-timegrid-allday-cushion { display: none !important; }
        .fc-timegrid-axis-cushion { font-size: 0.65rem !important; padding: 4px !important; line-height: 1; }
        .fc-timeGridWeek-view .fc-daygrid-day-events,
        .fc-timeGridDay-view .fc-daygrid-day-events { margin: 0 !important; }
        .fc-timeGridWeek-view .fc-daygrid-day-frame,
        .fc-timeGridDay-view .fc-daygrid-day-frame { padding: 0 !important; justify-content: center; }

        .fc-daygrid-day-top { flex-direction: row; justify-content: center; padding-top: 4px !important; padding-bottom: 2px !important; margin-bottom: 0 !important; }
        .fc-daygrid-day-events { margin: 0 !important; flex: 1; }

        .fc-daygrid-day-number {
          font-size: 0.8rem !important;
          font-weight: 900 !important;
          text-decoration: none !important;
          padding: 2px !important;
          color: var(--text-main) !important;
          line-height: 1 !important;
        }

        .fc-event { border-radius: 4px !important; cursor: pointer; transition: transform 0.1s; border: none !important; }
        .fc-event:active { transform: scale(0.98); }
        .fc-daygrid-event { margin: 1px 0 !important; overflow: visible !important; }
        .fc-daygrid-event.solid-allday-event { background: transparent !important; border: none !important; box-shadow: none !important; }
        .fc-timegrid-event { margin: 0 !important; border-radius: 6px !important; box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important; }
        .fc-event-title {
          white-space: pre-wrap !important;
          word-break: break-all !important;
          writing-mode: horizontal-tb !important;
          line-height: 1.2 !important;
        }
        .fc-event-time {
          white-space: nowrap !important;
        }

        .fc-timegrid-event {
          margin: 0 !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
        }
        .fc-timegrid-event:hover {
          z-index: 100 !important;
          transform: scale(1.02);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
          min-width: 90% !important;
        }
        /* カレンダーの枠線を確実にテーマカラーで上書き */
        .fc-theme-standard td, .fc-theme-standard th { border-color: var(--theme) !important; transition: border-color 0.3s; }
        .fc-scrollgrid { border: 1px solid var(--theme) !important; border-radius: 8px; overflow: hidden; }
        .fc-col-header-cell { border-bottom: 2px solid var(--theme) !important; }
        .fc-day-today { background-color: var(--theme-shadow) !important; }
        .fc-timegrid-now-indicator-line { border-color: var(--theme) !important; border-width: 2px !important; }
        .fc-timegrid-now-indicator-arrow { border-color: var(--theme) !important; border-width: 6px !important; border-top-color: transparent !important; border-bottom-color: transparent !important; }
        .fc-col-header-cell-cushion { padding: 8px 4px !important; width: 100%; text-align: center; color: var(--text-main) !important; }
        .fc-timegrid-axis, .fc-timegrid-slot-label { border-right: none !important; border-left: none !important; }
        .fc-timegrid-slot-minor { border-top-style: none !important; border-bottom-style: none !important; }
        .fc-timegrid-slot-label-frame { display: flex !important; align-items: center !important; justify-content: center !important; height: 100% !important; }
        .fc-timegrid-slot-label-cushion { font-weight: 900 !important; font-size: 0.7rem !important; color: var(--theme) !important; background: transparent !important; padding: 0 2px !important; border-radius: 0; margin: 0 !important; display: inline-block !important; }

        .holiday-cell .fc-daygrid-day-number, .fc-col-header-cell.fc-day-sun, .fc-day-sun .fc-col-header-cell-cushion, .fc-day-sun .holiday-text { color: #FF6B6B !important; font-weight: 900; }
        .saturday-cell .fc-daygrid-day-number, .fc-col-header-cell.fc-day-sat, .fc-day-sat .fc-col-header-cell-cushion, .fc-day-sat .saturday-text { color: #4D96FF !important; font-weight: 900; }

        .glass-panel { background: var(--glass-bg); backdrop-filter: blur(20px); border: 1px solid var(--glass-border); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); }
        .hover-bg-glass:hover { background: var(--input-bg); }

        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .modal-title { margin: 0; color: var(--theme); font-size: 1.4rem; font-weight: 900; letter-spacing: 0.02em; }
        .btn-close { background: var(--input-bg); border: 1px solid var(--border-color); border-radius: 50%; width: 36px; height: 36px; font-size: 1.2rem; cursor: pointer; color: var(--text-sub); font-weight: bold; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); transition: all 0.2s; }

        .card-box { background: var(--card-bg); backdrop-filter: blur(10px); padding: 18px; border-radius: 20px; border: 1px solid var(--border-color); margin-bottom: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .form-label { font-size: 0.8rem; font-weight: 900; color: var(--text-sub); display: block; margin-bottom: 8px; letter-spacing: 0.02em; }

        .btn-icon { background: var(--card-bg); backdrop-filter: blur(10px); border: 1px solid var(--glass-border); border-radius: 12px; width: 38px; height: 38px; display: flex; justify-content: center; align-items: center; font-size: 1.2rem; cursor: pointer; color: var(--text-main); box-shadow: 0 4px 10px rgba(0,0,0,0.05); padding: 0; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .date-picker-btn { background: var(--card-bg); backdrop-filter: blur(10px); border: 1px solid var(--border-color); border-radius: 16px; padding: 6px 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); display: flex; align-items: center; justify-content: space-between; position: relative; cursor: pointer; transition: all 0.1s ease; }

        .btn-pop { background: var(--theme); color: #fff !important; border: none; padding: 14px 24px; border-radius: 16px; font-weight: 900; letter-spacing: 0.05em; box-shadow: 0 6px 20px var(--theme-shadow), inset 0 2px 4px rgba(255,255,255,0.3); cursor: pointer; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-secondary { background: var(--card-bg); backdrop-filter: blur(10px); color: var(--text-main); border: 1px solid var(--border-color); padding: 14px 24px; border-radius: 16px; font-weight: 900; letter-spacing: 0.02em; box-shadow: 0 4px 15px rgba(0,0,0,0.03); cursor: pointer; transition: all 0.2s; }

        .day-btn { padding: 10px 0; border: 1px solid var(--border-color); border-radius: 12px; cursor: pointer; background: var(--input-bg); font-size: 0.8rem; font-weight: 900; flex: 1; text-align: center; transition: all 0.2s; color: var(--text-sub); }
        .day-btn.active { background: var(--theme); color: #fff !important; border-color: var(--theme); box-shadow: 0 4px 12px var(--theme-shadow); }

        .pop-input, .time-select {
          width: 100%;
          height: 46px !important;
          padding: 0 14px !important;
          border-radius: 12px !important;
          border: 2px solid var(--border-color);
          background: var(--input-bg);
          font-size: 0.95rem;
          font-weight: 900;
          color: var(--text-main);
          outline: none;
          display: flex;
          align-items: center;
          box-sizing: border-box;
        }
        .pop-input:focus, .time-select:focus {
          border-color: var(--theme);
          box-shadow: 0 0 0 4px var(--theme-shadow);
        }
        textarea.pop-input { height: auto; padding: 12px 14px; }
        .custom-select { appearance: none; background: var(--card-bg); backdrop-filter: blur(10px); border: 1px solid var(--border-color); outline: none; cursor: pointer; color: var(--theme); font-weight: 900; text-align: center; padding: 6px 12px; border-radius: 12px; box-shadow: 0 4px 10px rgba(0,0,0,0.03); transition: all 0.2s; }

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 1000; display: flex; justify-content: center; align-items: center; padding: 24px; animation: fadeIn 0.3s ease-out; }
        .modal-content { width: 92%; max-width: 420px; border-radius: 28px; border: 1px solid var(--glass-border); overflow-y: auto; max-height: 80dvh; animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); background: var(--bg-main); color: var(--text-main); }

        @keyframes popIn { 0% { transform: scale(0.95) translateY(10px); opacity: 0; } 100% { transform: scale(1) translateY(0); opacity: 1; } }
        @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
        @keyframes fadeInDown { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }

        .toggle-switch { position: relative; width: 44px; height: 24px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background: var(--input-bg); border: 1px solid var(--border-color); transition: .3s; border-radius: 24px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
        .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 3px; bottom: 3px; background-color: var(--text-sub); transition: .3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        input:checked + .slider { background-color: var(--theme); border-color: var(--theme); }
        input:checked + .slider:before { transform: translateX(20px); background-color: #fff; }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .highlighted-event { position: relative; z-index: 30 !important; animation: focus-bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275), pulse-glow 2s infinite; border: 2px solid #ef4444 !important; border-radius: 8px !important; }
        @keyframes focus-bounce { 0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); } }
        @keyframes pulse-glow { 0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); } 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); } }

        .delete-selected-event { border: 2px dashed #ef4444 !important; background: rgba(239,68,68,0.2) !important; opacity: 0.8; }
        .search-item { padding: 12px; border-radius: 12px; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s; margin-bottom: 8px; background: var(--input-bg); backdrop-filter: blur(5px); }
        .search-item.active { background: var(--theme-shadow); border: 2px solid var(--theme); transform: scale(1.02) translateX(4px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); position: relative; }

        .fc-more-link { display: block !important; text-align: center !important; font-size: 0.75rem !important; font-weight: 900 !important; color: var(--text-sub) !important; background: var(--input-bg) !important; border-radius: 6px !important; padding: 2px 0 !important; margin: 2px 4px !important; transition: all 0.2s ease !important; }
        .fc-popover { background: var(--glass-bg) !important; backdrop-filter: blur(20px) !important; border: 1px solid var(--glass-border) !important; border-radius: 16px !important; box-shadow: 0 10px 40px rgba(0,0,0,0.15) !important; z-index: 1000 !important; width: 155px !important; box-sizing: border-box !important; animation: popoverUnfold 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards !important; }
        @keyframes popoverUnfold { 0% { opacity: 0; transform: scale(0.8) translateY(-10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .fc-popover-header { background: transparent !important; padding: 12px 32px 8px 12px !important; border-bottom: none !important; display: flex !important; justify-content: center !important; align-items: center !important; position: relative !important; }
        .fc-popover-title { font-size: 1.1rem !important; font-weight: 900 !important; color: var(--text-main) !important; text-align: center !important; width: 100% !important; display: block !important; white-space: nowrap !important; }
        .fc-popover-close { position: absolute !important; top: 10px !important; right: 8px !important; cursor: pointer !important; opacity: 0.6 !important; background: var(--input-bg) !important; border-radius: 50% !important; width: 24px !important; height: 24px !important; display: flex !important; align-items: center !important; justify-content: center !important; }
        .fc-popover-body { padding: 0 10px 12px 10px !important; display: flex !important; flex-direction: column !important; gap: 6px !important; max-height: 250px !important; overflow-y: auto !important; overflow-x: hidden !important; box-sizing: border-box !important; width: 100% !important; }
        .fc-popover-body > div:not(.fc-daygrid-event-harness), .fc-popover .fc-daygrid-day-top { display: none !important; }
        .fc-popover-body .fc-daygrid-event-harness { position: static !important; width: 100% !important; margin: 0 !important; transform: none !important; box-sizing: border-box !important; }
        .fc-popover-body .fc-event { position: static !important; width: 100% !important; max-width: 65% !important; margin: 0 !important; box-sizing: border-box !important; }

        .is-dot-mode .fc-event, .is-dot-mode .fc-daygrid-event, .is-dot-mode .fc-h-event { background-color: transparent !important; background: transparent !important; border-color: transparent !important; border: none !important; box-shadow: none !important; }
        .is-dot-mode .fc-event-main { padding: 0 !important; color: transparent !important; }
        .is-dot-mode .fc-event-title, .is-dot-mode .fc-event-time { display: none !important; }
        .fc-event.is-dot-mode-event { background: transparent !important; border: none !important; box-shadow: none !important; }
        .fc-event.is-dot-mode-event .fc-event-main { padding: 0 !important; background: transparent !important; }

        .sidebar-group { margin-bottom: 24px; }
        .sidebar-group-title { font-size: 0.75rem; font-weight: 900; color: var(--text-sub); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-left: 8px; border-left: 3px solid var(--theme); }
        .sidebar-menu-list { display: flex; flex-direction: column; gap: 4px; }
        .sidebar-menu-btn { width: 100%; text-align: left; padding: 10px 12px; border-radius: 10px; background: transparent; border: 1px solid transparent; color: var(--text-main); font-size: 0.9rem; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 10px; }

        .fc-timegrid-event-harness { transition: opacity 0.2s; overflow: visible !important; }

        .fc-event, .fc-v-event, .fc-timegrid-event, .fc-daygrid-event {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          overflow: visible !important;
        }

        .solid-allday-event {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          opacity: 1 !important;
        }

        .solid-allday-event .fc-event-main {
          background: transparent !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          color: inherit !important;
        }

        .fc-bg-event.milestone-invisible-wrapper,
        .fc-event.milestone-invisible-wrapper {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          opacity: 1 !important;
        }

        .smart-event-container {
          container-type: size;
          container-name: eventBox;
        }

        .title-horizontal {
          display: -webkit-box !important;
          -webkit-box-orient: vertical;
          overflow: hidden;
          white-space: normal !important;
          word-break: break-word !important;
        }

        .title-vertical {
          display: block !important;
          white-space: nowrap !important;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @container eventBox (max-height: 30px) or (max-width: 40px) {
          .priority-location { display: none !important; }
          .priority-time { display: none !important; }
          .priority-meta-container { margin-bottom: 0 !important; padding: 0 !important; }
          .title-horizontal { -webkit-line-clamp: 1 !important; }
        }
        @container eventBox (min-height: 31px) and (max-height: 45px) {
          .priority-location { display: none !important; }
          .priority-time { display: none !important; }
          .title-horizontal { -webkit-line-clamp: 2 !important; }
        }
        @container eventBox (min-height: 46px) and (max-height: 65px) {
          .priority-location { display: none !important; }
          .title-horizontal { -webkit-line-clamp: 2 !important; }
        }
        @container eventBox (min-height: 66px) and (max-height: 85px) {
          .title-horizontal { -webkit-line-clamp: 2 !important; }
        }
        @container eventBox (min-height: 86px) {
          .title-horizontal { -webkit-line-clamp: 5 !important; }
        }

        .smart-event-card {
          background: var(--card-bg);
          border-left: 4px solid var(--theme);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
          padding: 6px 8px;
        }

        .smart-event-card:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
          z-index: 20;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 900;
          color: var(--text-main);
          user-select: none;
          min-height: 40px;
        }
        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: var(--theme);
          cursor: pointer;
        }

        .no-spin::-webkit-outer-spin-button,
        .no-spin::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .no-spin {
          -moz-appearance: textfield;
        }
        .rule-input {
          width: 100%;
          height: 30px;
          padding: 0 6px;
          border-radius: 8px;
          border: 2px solid var(--border-color);
          background: var(--input-bg);
          font-size: 0.85rem;
          font-weight: 900;
          color: var(--text-main);
          outline: none;
          display: flex;
          align-items: center;
          box-sizing: border-box;
        }
        .rule-input:focus {
          border-color: var(--theme);
          box-shadow: 0 0 0 4px var(--theme-shadow);
        }
        .rule-input[type="number"]::-webkit-outer-spin-button,
        .rule-input[type="number"]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .rule-input[type="number"] {
          -moz-appearance: textfield;
        }
          
        /* 👇 追加：仮予定のデザイン（斜め線＆半透明） */
        .tentative-event {
          background-image: repeating-linear-gradient(-45deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 16px) !important;
          opacity: 0.85 !important;
          border: 1.5px dashed var(--theme) !important;
        }
          
      `}</style>

      <div className="fixed-mobile-frame">
        {/* 👇 修正：中央の年月を完全固定し、ボタン開閉時のカクつきを排除 */}
        <header style={{ padding: '8px 12px 4px 12px', position: 'relative', background: 'linear-gradient(180deg, var(--bg-main) 40%, transparent 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, pointerEvents: 'auto' }}>
          
          {/* 左側：メニュー・追加 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 20 }}>
            <button onClick={() => { setOpenSections([]); setIsSidebarOpen(true); }} style={{ width: '44px', height: '44px', fontSize: '1.4rem', background: 'var(--card-bg)', border: `1px solid var(--theme)`, borderRadius: '14px', color: 'var(--theme)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: `0 0 10px var(--theme-shadow)`, transition: 'all 0.2s', paddingBottom: '2px', flexShrink: 0 }}>☰</button>
            <button
              onClick={() => {
                const today = toLocalYYYYMMDD(new Date()); const nowH = new Date().getHours();
                setMode('create'); setStartDate(today); setEndDate(today);
                setStartH(String(nowH).padStart(2, '0')); setEndH(String(Math.min(nowH + 1, 23)).padStart(2, '0'));
                setTitle(''); setLocation(''); setMemo(''); setPhotoUrls([]); setIsStocked(false); setIsAllDayBackground(false); setIsModalOpen(true); setIsTentative(false);
                // 👇 修正：以前開いていたメニューを確実にすべて閉じてリセットする
                setCustomFieldsData({});
                setIsGathering(false);
                setExpandedBlocks([]);
              }}
              style={{ background: 'var(--theme)', color: '#fff', fontSize: '2rem', fontWeight: 'bold', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: `0 0 12px var(--theme-shadow), inset 0 0 8px rgba(255,255,255,0.3)`, paddingBottom: '4px', lineHeight: 0, flexShrink: 0 }}
            >
              +
            </button>
          </div>

          {/* 中央：年月表示（絶対位置でど真ん中に固定！） */}
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', justifyContent: 'center' }}>
            <div onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} style={{ position: 'relative', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '6px 16px', gap: '12px', background: 'var(--card-bg)', border: `1px solid var(--theme)`, borderRadius: '32px', cursor: 'pointer', boxShadow: `0 0 15px var(--theme-shadow), inset 0 0 8px var(--theme-shadow)` }}>
              <button onClick={(e) => { 
                e.stopPropagation(); 
                const api = calendarRef.current?.getApi();
                if (viewType === 'timeGridDay' && api) {
                  const d = api.getDate(); d.setMonth(d.getMonth() - 1); api.gotoDate(d);
                } else { api?.prev(); }
              }} style={{ border: 'none', background: 'transparent', color: 'var(--theme)', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>◀</button>
              
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 2px', whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--theme)', fontWeight: '900', letterSpacing: '1px', marginBottom: '-2px', textShadow: `0 0 5px var(--theme-shadow)` }}>{currentYear}</span>
                <div style={{ fontSize: '1.3rem', color: 'var(--text-main)', fontWeight: '900', letterSpacing: '-0.5px', lineHeight: 1, textShadow: `0 0 10px var(--theme-shadow)` }}>{currentMonthNum}月</div>
              </div>

              <button onClick={(e) => { 
                e.stopPropagation(); 
                const api = calendarRef.current?.getApi();
                if (viewType === 'timeGridDay' && api) {
                  const d = api.getDate(); d.setMonth(d.getMonth() + 1); api.gotoDate(d);
                } else { api?.next(); }
              }} style={{ border: 'none', background: 'transparent', color: 'var(--theme)', fontWeight: '900', fontSize: '1.2rem', cursor: 'pointer', padding: 0 }}>▶</button>
            </div>
          </div>

          {/* 右側：今日・月週日切替 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 20, height: '44px' }}>
            
            {!isViewSelectorExpanded && (
              <button onClick={() => calendarRef.current?.getApi().today()} style={{ background: 'var(--card-bg)', border: `1px solid var(--theme)`, width: '44px', height: '44px', borderRadius: '14px', cursor: 'pointer', color: 'var(--theme)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 10px var(--theme-shadow)`, padding: 0, animation: 'fadeIn 0.2s', flexShrink: 0 }}>
                <Calendar size={18} />
              </button>
            )}
            
            <div 
              style={{ 
                background: 'var(--card-bg)', border: `1px solid var(--theme)`, borderRadius: '14px', 
                display: 'flex', alignItems: 'center', boxShadow: `0 0 10px var(--theme-shadow)`,
                overflow: 'hidden', transition: 'width 0.25s ease-out',
                width: isViewSelectorExpanded ? '100px' : '44px',
                height: '44px',
                flexShrink: 0
              }}
            >
              {isViewSelectorExpanded ? (
                <div style={{ display: 'flex', width: '100%', height: '100%', animation: 'fadeIn 0.3s' }}>
                  <button onClick={() => { setViewType('dayGridMonth'); calendarRef.current?.getApi().changeView('dayGridMonth'); setIsViewSelectorExpanded(false); }} style={{ flex: 1, height: '100%', padding: 0, background: viewType === 'dayGridMonth' ? 'var(--theme)' : 'transparent', color: viewType === 'dayGridMonth' ? '#fff' : 'var(--theme)', border: 'none', fontWeight: '900', fontSize: '0.8rem', cursor: 'pointer', transition: 'background 0.2s' }}>月</button>
                  <button onClick={() => { setViewType('timeGridWeek'); calendarRef.current?.getApi().changeView('timeGridWeek'); setIsViewSelectorExpanded(false); }} style={{ flex: 1, height: '100%', padding: 0, background: viewType === 'timeGridWeek' ? 'var(--theme)' : 'transparent', color: viewType === 'timeGridWeek' ? '#fff' : 'var(--theme)', border: 'none', fontWeight: '900', fontSize: '0.8rem', cursor: 'pointer', transition: 'background 0.2s', borderLeft: '1px dashed var(--theme-shadow)', borderRight: '1px dashed var(--theme-shadow)' }}>週</button>
                  <button onClick={() => { setViewType('timeGridDay'); calendarRef.current?.getApi().changeView('timeGridDay'); setIsViewSelectorExpanded(false); }} style={{ flex: 1, height: '100%', padding: 0, background: viewType === 'timeGridDay' ? 'var(--theme)' : 'transparent', color: viewType === 'timeGridDay' ? '#fff' : 'var(--theme)', border: 'none', fontWeight: '900', fontSize: '0.8rem', cursor: 'pointer', transition: 'background 0.2s' }}>日</button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsViewSelectorExpanded(true)} 
                  style={{ width: '100%', height: '100%', padding: 0, background: 'transparent', color: 'var(--theme)', border: 'none', fontWeight: '900', fontSize: '0.95rem', cursor: 'pointer' }}
                >
                  {viewType === 'dayGridMonth' ? '月' : viewType === 'timeGridWeek' ? '週' : '日'}
                </button>
              )}
            </div>
          </div>
        </header>

        {/* 👇 カレンダーの枠線と曜日下の線をテーマカラーに完全連動させるスタイル */}
        <style dangerouslySetInnerHTML={{__html: `
          /* 外側の不要な太い枠線を消す */
          .fc-scrollgrid { border: none !important; }
          
          /* マス目の内側の線を、テーマカラーの薄い色（影色）にする */
          .fc-theme-standard td, .fc-theme-standard th { 
            border-color: var(--theme-shadow) !important; 
            transition: border-color 0.3s; 
          }

          /* 👇 追加：アンバランスな一番右の線を消す */
          .fc-theme-standard th:last-child, 
          .fc-theme-standard td:last-child { 
            border-right: none !important; 
          }

          /* 👇 追加：不要な一番下の線を消す */
          .fc-theme-standard .fc-scrollgrid-section-body:last-child td,
          .fc-theme-standard .fc-daygrid-body tr:last-child td {
            border-bottom: none !important;
          }
          
          /* 曜日の下の線をグレーからテーマカラーに変更し、少し太くする */
          .fc-theme-standard th { 
            padding: 0 !important; 
            border-bottom: 1px solid var(--theme) !important; 
          }
          
          /* 曜日の余白調整 */
          .fc .fc-col-header-cell-cushion { padding: 4px 0 !important; }
        `}} />

        {isSearchMode && (
          <div className="glass-panel" style={{ margin: '8px', padding: '12px', borderRadius: '16px', display: 'flex', gap: '8px', zIndex: 15, animation: 'fadeInDown 0.3s ease-out' }}>
            <input type="text" className="pop-input" placeholder="タイトル・場所・メモ..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchExecute()} style={{ padding: '10px 14px', flex: 1, fontSize: '0.9rem' }} autoFocus />
            <button onClick={handleSearchExecute} className="btn-pop" style={{ padding: '0 16px', fontSize: '0.85rem' }}>検索</button>
          </div>
        )}

        {/* 👇 カレンダー全体ブロック */}
        <div 
          style={{ flex: 1, position: 'relative', padding: '0 6px 16px 6px', overflow: 'hidden' }}
          onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        >
          <div className="glass-panel" style={{ position: 'absolute', top: '2px', left: '0px', right: '0px', bottom: '16px', padding: '2px 4px', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* 👇 新しい「日毎」のカスタム円形ダッシュボードUI 👇 */}
            {viewType === 'timeGridDay' && (() => {
              const targetDayStr = `${currentYear}-${String(currentMonthNum).padStart(2, '0')}-${String(currentDayNum || '1').padStart(2, '0')}`;
              const targetDateObj = new Date(`${targetDayStr}T00:00:00`);
              const tomorrowObj = new Date(targetDateObj); tomorrowObj.setDate(tomorrowObj.getDate() + 1);
              const targetTime = targetDateObj.getTime();

              const dayEvents = displayEvents.filter((e: any) => {
                if (e.extendedProps?.isMilestone || e.extendedProps?.metadata?.isAllDayBackground || e.allDay) return false;
                const s = new Date(e.start);
                const eTime = e.end ? new Date(e.end) : new Date(s.getTime() + 3600000);
                return eTime > targetDateObj && s < tomorrowObj;
              }).sort((a:any, b:any) => new Date(a.start).getTime() - new Date(b.start).getTime());

              const allDayEvents = displayEvents.filter((e: any) => {
                if (!e.allDay && !e.extendedProps?.metadata?.isAllDayBackground) return false;
                const sDate = new Date(e.start);
                sDate.setHours(0, 0, 0, 0);
                const eDate = e.end ? new Date(e.end) : new Date(sDate.getTime() + 86400000);
                eDate.setHours(0, 0, 0, 0);
                return targetTime >= sDate.getTime() && targetTime < eDate.getTime();
              });

              // 予定の重なり（クラスター）を正確に計算するロジック
              const clusters: any[][] = [];
              let currentCluster: any[] = [];
              let clusterEnd = 0;

              dayEvents.forEach((e: any) => {
                const start = new Date(e.start).getTime();
                const end = e.end ? new Date(e.end).getTime() : start + 3600000;
                
                if (currentCluster.length === 0) {
                  currentCluster.push(e);
                  clusterEnd = end;
                } else {
                  if (start < clusterEnd) {
                    currentCluster.push(e);
                    clusterEnd = Math.max(clusterEnd, end);
                  } else {
                    clusters.push(currentCluster);
                    currentCluster = [e];
                    clusterEnd = end;
                  }
                }
              });
              if (currentCluster.length > 0) clusters.push(currentCluster);

              const eventLayout = new Map();
              clusters.forEach(cluster => {
                const active: any[] = [];
                let maxTrack = 0;
                
                cluster.forEach(e => {
                  for (let i = active.length - 1; i >= 0; i--) {
                    if (active[i].end <= e._start) active.splice(i, 1);
                  }
                  const usedTracks = new Set(active.map(a => a.track));
                  let track = 0;
                  while (usedTracks.has(track)) track++;
                  
                  active.push({ end: e._end, track });
                  maxTrack = Math.max(maxTrack, track);
                  eventLayout.set(e.id, { track });
                });
                
                const totalTracks = maxTrack + 1;
                cluster.forEach((e: any) => {
                  eventLayout.get(e.id).totalTracks = totalTracks;
                });
              });

              const dayOfWeek = targetDateObj.getDay();
              const isHoliday = holidays[toLocalYYYYMMDD(targetDateObj)];
              const dayColor = (dayOfWeek === 0 || isHoliday) ? '#ef4444' : (dayOfWeek === 6 ? '#3b82f6' : 'var(--text-sub)');
              const centerColor = allDayEvents.length > 0 ? (allDayEvents[0].extendedProps?.cColor || allDayEvents[0].backgroundColor || 'var(--theme)') : null;

              const handleDayNav = (days: number) => {
                const api = calendarRef.current?.getApi();
                if (api) { const d = api.getDate(); d.setDate(d.getDate() + days); api.gotoDate(d); }
              };

              return (
                <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', padding: '16px 16px 0 16px', overflow: 'hidden' }}>
                  
                  <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', marginBottom: '20px', padding: '10px 0' }}>
                    <div style={{ position: 'relative', width: '280px', height: '280px' }}>
                      <svg viewBox="0 0 160 160" style={{ width: '100%', height: '100%', overflow: 'visible', filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.06))' }}>
                        
                        <circle cx="80" cy="80" r="50" fill="none" stroke="var(--border-color)" strokeWidth="24" opacity="0.4" />
                        <circle cx="80" cy="80" r="38" fill={centerColor ? hexToRgba(centerColor, 0.1) : 'var(--bg-main)'} stroke={centerColor || 'var(--border-color)'} strokeWidth={centerColor ? "2.5" : "1"} style={{ transition: 'all 0.3s' }} />
                        
                        {Array.from({length: 24}).map((_, i) => {
                          const angle = (i * 15 - 90) * (Math.PI / 180);
                          const isMain = i % 3 === 0;
                          const r1 = 64; 
                          const r2 = isMain ? 68 : 66; 
                          const x1 = (80 + r1 * Math.cos(angle)).toFixed(4); const y1 = (80 + r1 * Math.sin(angle)).toFixed(4);
                          const x2 = (80 + r2 * Math.cos(angle)).toFixed(4); const y2 = (80 + r2 * Math.sin(angle)).toFixed(4);
                          return (
                            <g key={i}>
                              {isMain ? (
                                <text x={(80 + 74 * Math.cos(angle)).toFixed(4)} y={(80 + 74 * Math.sin(angle)).toFixed(4)} fontSize="6" fontWeight="900" fill="var(--text-sub)" textAnchor="middle" dominantBaseline="central">{i}</text>
                              ) : (
                                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--text-sub)" strokeWidth="1.5" opacity="0.4" />
                              )}
                            </g>
                          );
                        })}
                        
                        {/* 👇 移動時間は「枠線」、予定本体は「塗りつぶし」で繋げて描画 */}
                        {/* 👇 移動時間は「枠線」、予定本体は「塗りつぶし」で繋げて描画 */}
                        <g transform="rotate(-90 80 80)">
                          {dayEvents.map((e: any, idx: number) => {
                            if (e.extendedProps.isTransitEvent) return null;

                            const metadata = e.extendedProps?.metadata || {};
                            const cColor = e.extendedProps?.cColor || "var(--theme)";
                            const elements = [];

                            if (metadata.isGathering && metadata.departureTime && metadata.gatheringTime) {
                                const [dh, dm] = metadata.departureTime.split(":").map(Number);
                                const [gh, gm] = metadata.gatheringTime.split(":").map(Number);
                                const wTime = parseInt(metadata.walkTime || walkTime || "0", 10);
                                
                                const leaveMin = (dh * 60 + dm) - (metadata.departureType === "home" ? 0 : wTime);
                                const gatherMin = gh * 60 + gm;

                                if (!isNaN(leaveMin) && !isNaN(gatherMin) && gatherMin > leaveMin) {
                                    const rOut = 62;
                                    const rIn = 38;
                                    const angS = (leaveMin / 1440) * 2 * Math.PI;
                                    const angE = (gatherMin / 1440) * 2 * Math.PI;
                                    
                                    const COut = 2 * Math.PI * rOut;
                                    const CIn = 2 * Math.PI * rIn;

                                    elements.push(
                                        <g key={`move-frame-${idx}`}>
                                            <circle cx="80" cy="80" r={rOut} fill="none" stroke={cColor} strokeWidth="1" strokeDasharray={`${((gatherMin-leaveMin)/1440)*COut} ${COut}`} strokeDashoffset={-(leaveMin/1440)*COut} opacity="0.8" />
                                            <circle cx="80" cy="80" r={rIn} fill="none" stroke={cColor} strokeWidth="1" strokeDasharray={`${((gatherMin-leaveMin)/1440)*CIn} ${CIn}`} strokeDashoffset={-(leaveMin/1440)*CIn} opacity="0.8" />
                                            <line x1={80+rIn*Math.cos(angS)} y1={80+rIn*Math.sin(angS)} x2={80+rOut*Math.cos(angS)} y2={80+rOut*Math.sin(angS)} stroke={cColor} strokeWidth="1" opacity="0.8" />
                                            <line x1={80+rIn*Math.cos(angE)} y1={80+rIn*Math.sin(angE)} x2={80+rOut*Math.cos(angE)} y2={80+rOut*Math.sin(angE)} stroke={cColor} strokeWidth="1" opacity="0.8" />
                                        </g>
                                    );
                                }
                            }

                            const sMin = new Date(e.start).getHours() * 60 + new Date(e.start).getMinutes();
                            const eMin = new Date(e.end || new Date(e.start).getTime() + 3600000).getHours() * 60 + new Date(e.end || new Date(e.start).getTime() + 3600000).getMinutes();
                            const CMain = 2 * Math.PI * 50;
                            elements.push(
                              <circle key={`main-${idx}`} cx="80" cy="80" r="50" fill="none" stroke={cColor} strokeWidth="24" strokeDasharray={`${((eMin-sMin)/1440)*CMain} ${CMain}`} strokeDashoffset={-(sMin/1440)*CMain} opacity="0.95" />
                            );

                            return <g key={idx}>{elements}</g>;
                          })}
                        </g>
                      </svg>

                      {/* 中央のナビゲーション */}
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, width: '100%', height: '100%' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleDayNav(-7); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-sub)', marginTop: '-20px', transition: 'transform 0.2s' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        </button>
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '8px' }}>
                          <button onClick={(e) => { e.stopPropagation(); handleDayNav(-1); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-sub)', transition: 'transform 0.2s' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                          </button>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px', position: 'relative', cursor: 'pointer' }} title="タップして日付をジャンプ">
                            <input type="date" value={`${currentYear}-${String(currentMonthNum).padStart(2, '0')}-${String(currentDayNum).padStart(2, '0')}`} onChange={(e) => { if (e.target.value) calendarRef.current?.getApi().gotoDate(e.target.value); }} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 10 }} />
                            <div style={{ fontSize: '3.2rem', fontWeight: '900', color: centerColor || 'var(--text-main)', lineHeight: 1, margin: '0', textShadow: '0 2px 4px rgba(0,0,0,0.05)', transition: 'color 0.3s' }}>{currentDayNum}</div>
                            <div style={{ fontSize: '1.1rem', color: dayColor, fontWeight: '900', marginTop: '2px' }}>{DAY_NAMES[dayOfWeek]}</div>
                          </div>
                          
                          <button onClick={(e) => { e.stopPropagation(); handleDayNav(1); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-sub)', transition: 'transform 0.2s' }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                          </button>
                        </div>

                        <button onClick={(e) => { e.stopPropagation(); handleDayNav(7); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--text-sub)', marginBottom: '-20px', transition: 'transform 0.2s' }}>
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 👇 リスト表示：バッジを統合して1つのカードに */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '20px' }} className="hide-scrollbar">
                    
                    {allDayEvents.map((e: any) => {
                      const cColor = e.extendedProps?.cColor || e.backgroundColor || 'var(--theme)';
                      const isPayment = e.extendedProps?.metadata?.routineType === 'expense' || String(e.id).startsWith('sub-') || e.extendedProps?.metadata?.customFields?.isExpenseSet;
                      return (
                        <div key={e.id} onClick={() => handleEventClick({event: e})} style={{ background: 'var(--card-bg)', border: `1px solid var(--border-color)`, borderLeft: `6px solid ${cColor}`, borderRadius: '12px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{e.title.replace('🔄 ', '')}</div>
                          <div style={{ fontSize: '0.75rem', fontWeight: '900', color: cColor, background: hexToRgba(cColor, 0.1), padding: '4px 10px', borderRadius: '8px' }}>
                            {isPayment ? '支払い' : '終日'}
                          </div>
                        </div>
                      );
                    })}

                    // 挿入するコード
                    {dayEvents.length === 0 && allDayEvents.length === 0 ? (
                      <div style={{ textAlign: 'center', color: 'var(--text-sub)', padding: '40px 20px', fontWeight: 'bold', fontSize: '0.95rem' }}>この日の予定はありません</div>
                    ) : (
                      dayEvents.map((e: any) => {
                        // 👇 交通機関イベントの場合のリストアイテム表示を追加
                        if (e.extendedProps?.isTransitEvent) {
                          const sObj = new Date(e.start);
                          const eObj = new Date(e.end || sObj.getTime() + 3600000);
                          const sH = String(sObj.getHours()).padStart(2, '0');
                          const sM = String(sObj.getMinutes()).padStart(2, '0');
                          const eH = String(eObj.getHours()).padStart(2, '0');
                          const eM = String(eObj.getMinutes()).padStart(2, '0');
                          const cColor = e.extendedProps?.cColor || 'var(--theme)';
                          
                          let TransitIcon = Train;
                          if (e.extendedProps.transitType === 'plane') TransitIcon = Plane;
                          else if (e.extendedProps.transitType === 'bus') TransitIcon = Bus;
                          else if (e.extendedProps.transitType === 'home') TransitIcon = Home;

                          return (
                            <div key={e.id} style={{ background: 'var(--card-bg)', borderRadius: '16px', border: `2px solid ${cColor}`, borderLeft: `8px solid ${cColor}`, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TransitIcon size={16} color={cColor} />
                                <div style={{ fontSize: '0.95rem', fontWeight: '900', color: 'var(--text-main)' }}>{e.title}</div>
                              </div>
                              <span style={{ flexShrink: 0, fontSize: '0.85rem', fontWeight: '900', color: cColor, background: hexToRgba(cColor, 0.1), padding: '6px 12px', borderRadius: '12px' }}>
                                {sH}:{sM} ~ {eH}:{eM}
                              </span>
                            </div>
                          );
                        }
                        const s = new Date(e.start);
                        const end = e.end ? new Date(e.end) : new Date(s.getTime() + 3600000);
                        
                        const origS = new Date(e.extendedProps.originalStart);
                        const sH = String(origS.getHours()).padStart(2, '0');
                        const sM = String(origS.getMinutes()).padStart(2, '0');
                        const eH = String(end.getHours()).padStart(2, '0');
                        const eM = String(end.getMinutes()).padStart(2, '0');
                        
                        const cColor = e.extendedProps?.cColor || e.backgroundColor || 'var(--theme)';
                        
                        // 👇 ここから重要：ループ内のローカル変数を定義
                        const m = e.extendedProps?.metadata || {};
                        const loc = m.location;
                        const depTime = m.departureTime;
                        const isGatheringSet = m.isGathering && depTime;
                        const customStart = m.customFields?.customStartLocation;
                        const dType = m.departureType || (startPointType === 'station' ? 'train' : 'home');

                        let houseLeaveTimeStr = '';
                        if (isGatheringSet && depTime.includes(':')) {
                          if (startPointType === 'station' || dType === 'train') {
                            const wTime = parseInt(m.walkTime || walkTime || '0', 10);
                            if (wTime > 0) {
                              const [h, mVal] = depTime.split(':').map(Number);
                              const dObj = new Date(); dObj.setHours(h, mVal, 0); dObj.setMinutes(dObj.getMinutes() - wTime);
                              houseLeaveTimeStr = `${String(dObj.getHours()).padStart(2, '0')}:${String(dObj.getMinutes()).padStart(2, '0')}`;
                            }
                          }
                        }
                        // 👆 ここまで

                        return (
                          <div key={e.id} onClick={() => handleEventClick({event: e})} style={{ background: 'var(--card-bg)', borderRadius: '16px', border: `2px solid ${cColor}`, borderLeft: `8px solid ${cColor}`, padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                             
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflow: 'hidden' }}>
                                <div style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--text-main)', whiteSpace: 'pre-wrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                                
                                {(loc || isGatheringSet) && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                                    {isGatheringSet && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#fff', background: cColor, padding: '4px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: `0 2px 6px ${hexToRgba(cColor, 0.3)}` }}>
                                          {customStart ? <MapPin size={12}/> : (dType === 'train' ? <Train size={12}/> : <Home size={12}/>)} 
                                          {customStart ? customStart : (dType === 'train' ? '駅' : '自宅')} {depTime} 出発
                                        </span>
                                        {houseLeaveTimeStr && (
                                          <span style={{ fontSize: '0.7rem', fontWeight: '900', color: cColor, border: `1px solid ${cColor}`, background: 'transparent', padding: '3px 8px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Footprints size={12} /> 家を出る: {houseLeaveTimeStr}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                    {loc && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        <MapPin size={14} style={{ color: cColor, flexShrink: 0 }} /> {loc}
                                      </div>
                                    )}
                                  </div>
                                )}
                             </div>

                             <span style={{ flexShrink: 0, fontSize: '0.85rem', fontWeight: '900', color: cColor, background: hexToRgba(cColor, 0.1), padding: '6px 12px', borderRadius: '12px' }}>
                               {sH}:{sM} ~ {eH}:{eM}
                             </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })()}

            <FullCalendar
              key={displayMode + overlapMode}
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              slotEventOverlap={overlapMode === 'cascade'}
              droppable={true}
              nowIndicator={true} 
              allDaySlot={true} 
              fixedWeekCount={true} 
              height="100%" 
              dayMaxEvents={true}
              headerToolbar={false} 
              events={displayEvents} 
              selectable={true} 
              select={handleSelect} 
              eventClick={handleEventClick}
              
              // 👇 追加：予定をドラッグ＆ドロップで移動・時間変更できるようにする
              editable={true}
              eventStartEditable={true}
              eventDurationEditable={true}
              eventDrop={async (info) => {
                // 移動させた予定の新しい日時をSupabaseに保存する処理
                const { event, oldEvent } = info;
                const dbId = event.id.replace('-travel', ''); // 移動枠を動かした時対策
                const getISO = (d: Date) => d.toISOString();
                
                // 本体の予定なら更新
                if (!event.extendedProps.isTransitEvent && !event.extendedProps.isRoutine && !event.extendedProps.isAnniversary) {
                  try {
                    await supabase.from('events').update({
                      start_at: getISO(event.start!),
                      end_at: event.end ? getISO(event.end) : getISO(event.start!)
                    }).eq('id', dbId);
                    fetchEvents(); // 再取得して画面を更新
                  } catch (e) {
                    alert('移動に失敗しました');
                    info.revert(); // 失敗したら元に戻す
                  }
                } else {
                  info.revert(); // 記念日や移動枠自体はドラッグ無効
                }
              }}
              // 👇 追加：予定の端を引っ張って時間を伸ばす・縮める処理
              eventResize={async (info) => {
                const { event } = info;
                const dbId = event.id.replace('-travel', '');
                const getISO = (d: Date) => d.toISOString();
                
                if (!event.extendedProps.isTransitEvent && !event.extendedProps.isRoutine && !event.extendedProps.isAnniversary) {
                  try {
                    await supabase.from('events').update({
                      start_at: getISO(event.start!),
                      end_at: event.end ? getISO(event.end) : getISO(event.start!)
                    }).eq('id', dbId);
                    fetchEvents();
                  } catch (e) {
                    alert('時間の変更に失敗しました');
                    info.revert();
                  }
                } else {
                  info.revert();
                }
              }}
              // 👆 ここまで

              locale="ja"
              moreLinkContent={(args: any) => `+他${args.num}件`}
              eventClassNames={() => (displayMode === 'dot' && viewType === 'dayGridMonth') ? ['is-dot-mode-event'] : []}
              eventContent={renderEventContent}
              dayHeaderContent={(arg: any) => {
                const d = arg.date;
                const dayStr = DAY_NAMES[d.getDay()];
                const isHoliday = holidays[toLocalYYYYMMDD(d)];
                const isRed = d.getDay() === 0 || isHoliday;

                if (arg.view.type === 'dayGridMonth') {
                  const colorClass = isRed ? 'holiday-text' : (d.getDay() === 6 ? 'saturday-text' : '');
                  return (
                    <div style={{cursor: 'pointer', padding: '2px 0', width: '100%', fontSize: '0.75rem'}} className={`hover-bg-glass ${colorClass}`}>
                       {dayStr}
                    </div>
                  );
                }
                const m = d.getMonth() + 1; const dt = d.getDate();
                const colorClass = isRed ? 'holiday-text' : (d.getDay() === 6 ? 'saturday-text' : '');
                return (
                  <div
                    onClick={() => arg.view.type === 'timeGridDay' && setIsDayPickerOpen(true)}
                    style={{cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1, padding: '2px 0', width: '100%'}}
                    className={`hover-bg-glass ${colorClass}`}
                  >
                    <span style={{fontSize: '0.9rem', fontWeight: 900}}>{dt}</span>
                    <span style={{fontSize: '0.65rem'}}>{dayStr}</span>
                  </div>
                );
              }}
              dayCellContent={(arg: any) => {
                if (arg.view.type === 'dayGridMonth') {
                  const dStr = toLocalYYYYMMDD(arg.date);
                  // 👇 修正：サブスクを除外し、通常の支払いとルーティン支払いのみで判定
                  const paymentEvent = [...events, ...routineEvents].find((e: any) => {
                    const isRoutineExpense = e.extendedProps?.isRoutine && e.extendedProps?.metadata?.routineType === 'expense';
                    const isManualPayment = e.extendedProps?.metadata?.customFields?.isExpenseSet && (e.title?.includes('支払') || e.title?.includes('引落'));
                    return (isRoutineExpense || isManualPayment) && e.start?.startsWith(dStr);
                  });

                  return (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                      {/* 👇 修正：相対位置のコンテナで数字を囲む */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span>{arg.date.getDate()}</span>
                        {paymentEvent && (() => {
                          const cColor = paymentEvent.extendedProps?.cColor || paymentEvent.extendedProps?.metadata?.customColor || paymentEvent.backgroundColor || 'var(--theme)';
                          // 👇 修正：ドットを absolute（絶対配置）にして、数字の右側に浮かせて配置する
                          return <div style={{ position: 'absolute', left: '100%', marginLeft: '3px', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: cColor, marginTop: '2px', boxShadow: `0 1px 3px ${hexToRgba(cColor, 0.4)}` }} title={paymentEvent.title} />;
                        })()}
                      </div>
                    </div>
                  );
                }
                return '';
              }}
              datesSet={(arg: any) => {
                setViewType(arg.view.type); const d = arg.view.currentStart;
                let y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
                if (arg.view.type === 'timeGridWeek') {
                  const midWeek = new Date(d); midWeek.setDate(midWeek.getDate() + 3);
                  y = midWeek.getFullYear(); m = midWeek.getMonth() + 1;
                }
                // 👇 日付が変わるたびに currentDayNum も同期する魔法
                setCurrentYear(String(y)); setCurrentMonthNum(String(m)); setCurrentDayNum(String(day));
              }}
              dayCellClassNames={(arg: any) => {
                if (arg.date.getDay() === 0 || holidays[toLocalYYYYMMDD(arg.date)]) return ['holiday-cell'];
                if (arg.date.getDay() === 6) return ['saturday-cell']; return [];
              }}
              longPressDelay={250}
              eventLongPressDelay={250}
              selectLongPressDelay={250}
              // ...
            />
          </div>
        </div>

        {isColorPickerOpen && (
          <div className="modal-overlay" onClick={() => setIsColorPickerOpen(false)}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
              <ModalHeader title="テーマカラーの変更" onClose={() => setIsColorPickerOpen(false)} />
              <ColorSelector value={themeColor} onChange={(c) => { setThemeColor(c); setIsColorPickerOpen(false); }} />
            </div>
          </div>
        )}

          {searchResults.length > 0 && !isDeleteMode && (
            <div className="glass-panel" style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', border: `2px solid ${themeColor}`, borderRadius: '28px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 100, boxShadow: `0 10px 30px ${themeColor}33` }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-main)' }}>{currentSearchIndex + 1} <span style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>/ {searchResults.length}</span></span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={prevSearchResult} className="btn-icon" style={{ width: '32px', height: '32px', borderRadius: '10px' }}>▲</button>
                <button onClick={nextSearchResult} className="btn-icon" style={{ width: '32px', height: '32px', borderRadius: '10px' }}>▼</button>
              </div>
              <button onClick={() => { setSearchResults([]); setSearchQuery(''); setIsSearchMode(false); }} className="btn-close" style={{ width: '32px', height: '32px', background: 'rgba(239,68,68,0.2)', color: '#ef4444', borderColor: '#fca5a5' }}>×</button>
            </div>
          )}

          {isDeleteMode && (
            <div className="glass-panel" style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', border: `2px solid #ef4444`, borderRadius: '28px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '16px', zIndex: 100, boxShadow: `0 10px 30px rgba(239,68,68,0.3)` }}>
              <span style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{selectedForDelete.length} <span style={{ color: 'var(--text-sub)', fontSize: '0.75rem' }}>件選択中</span></span>
              <div style={{ display: 'flex', gap: '8px' }}>
                 <button onClick={executeBulkDelete} className="btn-pop" style={{ background: '#ef4444', padding: '8px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>削除実行</button>
                 <button onClick={() => { setIsDeleteMode(false); setSelectedForDelete([]); }} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>取消</button>
              </div>
            </div>
          )}
        </div>

        {/* サイドバー（別ファイルに分離済み！） */}
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          setOpenSections={setOpenSections}
          themeColor={themeColor}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearchExecute={handleSearchExecute}
          setIsSearchMode={setIsSearchMode}
          setIsColorPickerOpen={setIsColorPickerOpen}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          events={events}
          categories={categories}
          targetType={targetType}
          setTargetType={setTargetType}
          targetValue={targetValue}
          setTargetValue={setTargetValue}
          currentMonthEvents={currentMonthEvents}
          currentYearEvents={currentYearEvents}
          quickTemplates={quickTemplates}
          setQuickTemplates={setQuickTemplates}
          setMode={setMode}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
          setStartH={setStartH}
          setStartM={setStartM}
          setEndH={setEndH}
          setEndM={setEndM}
          setTitle={setTitle}
          setLocation={setLocation}
          setMemo={setMemo}
          setPhotoUrls={setPhotoUrls}
          setIsStocked={setIsStocked}
          setIsModalOpen={setIsModalOpen}
          setCategoryName={setCategoryName}
          setIsAllDayBackground={setIsAllDayBackground}
          setEventColor={setEventColor}
          setIsAnalyticsModalOpen={setIsAnalyticsModalOpen}
          setIsGalleryOpen={setIsGalleryOpen}
          setIsCategoryModalOpen={setIsCategoryModalOpen}
          setIsRoutineModalOpen={setIsRoutineModalOpen}
          setIsAnniversaryModalOpen={setIsAnniversaryModalOpen}
          syncWithCloud={syncWithCloud}
          handleEventClick={handleEventClick}
          setCustomFieldsData={setCustomFieldsData}
          homeLocation={homeLocation} setHomeLocation={setHomeLocation}
          nearestStation={nearestStation} setNearestStation={setNearestStation}
          walkTime={walkTime} setWalkTime={setWalkTime}
          startPointType={startPointType} setStartPointType={setStartPointType}
          displayMode={displayMode} setDisplayMode={setDisplayMode}
          viewType={viewType}
          calendarCategoryFilter={calendarCategoryFilter}
          setCalendarCategoryFilter={setCalendarCategoryFilter}
          activeUserId={activeUserId}
          activeUserName={activeUserName}
          activeUserAvatar={activeUserAvatar}
          setActiveUserAvatar={setActiveUserAvatar}
          setActiveUserName={setActiveUserName}
          onLogout={handleLogout}
          setIsFinanceGraphOpen={setIsFinanceGraphOpen} // 👈 追加
          setIsScheduleAssistantOpen={setIsScheduleAssistantOpen}
          setIsAdvanceModalOpen={setIsAdvanceModalOpen}
        />

        {/* ギャラリー */}
        {isGalleryOpen && (
          <div className="modal-overlay" onClick={() => setIsGalleryOpen(false)}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
              <ModalHeader title="思い出ギャラリー" onClose={() => setIsGalleryOpen(false)} />
              
              {/* 👇 追加：ジャンル絞り込みボタン */}
              <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '16px', paddingBottom: '4px' }}>
                <button onClick={() => setGalleryCategory('すべて')} style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer', background: galleryCategory === 'すべて' ? 'var(--theme)' : 'var(--input-bg)', color: galleryCategory === 'すべて' ? '#fff' : 'var(--text-main)', border: 'none' }}>すべて</button>
                {categories.map((c: any) => (
                  <button key={c.name} onClick={() => setGalleryCategory(c.name)} style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '12px', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer', background: galleryCategory === c.name ? c.color : 'var(--input-bg)', color: galleryCategory === c.name ? '#fff' : 'var(--text-main)', border: 'none' }}>
                    {c.name}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px', maxHeight: '55vh', overflowY: 'auto', paddingRight: '5px' }} className="hide-scrollbar">
               {/* 👇 修正：写真のみを敷き詰めるUIに変更 */}
                {events
                  .filter((e: any) => e.extendedProps?.metadata?.photoUrls && e.extendedProps.metadata.photoUrls.length > 0)
                  .filter((e: any) => galleryCategory === 'すべて' || e.extendedProps.category === galleryCategory)
                  .sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime())
                  .flatMap((e: any) =>
                  e.extendedProps.metadata.photoUrls.map((url: string, index: number) => (
                    <div key={`${e.id}-${index}`} style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                      <img src={url} alt="memory" onClick={() => { setIsGalleryOpen(false); handleEventClick({event: e}); }} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s' }} onMouseOver={ev => ev.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={ev => ev.currentTarget.style.transform = 'scale(1)'} />
                    </div>
                  ))
                )}
                {events.filter((e: any) => e.extendedProps?.metadata?.photoUrls && e.extendedProps.metadata.photoUrls.length > 0).length === 0 && (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-sub)', fontWeight: '900', fontSize: '0.9rem' }}>思い出の写真を追加しましょう</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 日付選択モーダル */}
        {isDayPickerOpen && (
          <div className="modal-overlay" onClick={() => setIsDayPickerOpen(false)}>
            <div className="modal-content glass-panel" style={{ maxWidth: '340px', padding: '24px' }} onClick={e => e.stopPropagation()}>
              <ModalHeader title={`${currentMonthNum}月の日の選択`} onClose={() => setIsDayPickerOpen(false)} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
                {getDaysOfMonth().map((d: any) => (
                  <button key={d.value} onClick={() => handleDayChange(d.value)} className={currentDayNum === d.value ? 'btn-pop' : 'btn-secondary'} style={{ padding: '10px 0', fontSize: '0.9rem', borderRadius: '12px' }}>
                    {d.value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 記念日モーダル */}
        {isAnniversaryModalOpen && (
          <div className="modal-overlay" onClick={() => setIsAnniversaryModalOpen(false)}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
              <ModalHeader title="記念日を設定" onClose={() => setIsAnniversaryModalOpen(false)} />
              <div style={{ marginBottom: '20px', maxHeight: '180px', overflowY: 'auto' }} className="hide-scrollbar">
                {anniversaries.map((a: any, idx: number) => renderListItem(
                  `anniv-${idx}`,
                  a.color,
                  `${a.date.replace('-', '/')} : ${a.title}`,
                  () => {
                    setEditAnnivIndex(idx);
                    setNewAnnivTitle(a.title);
                    const [em, ed] = a.date.split('-');
                    setNewAnnivMonth(em);
                    setNewAnnivDay(ed);
                    setNewAnnivColor(a.color);
                  },
                  () => setAnniversaries(anniversaries.filter((_, i) => i !== idx))
                ))}              </div>
              <div className="card-box">
                <label className="form-label">{editAnnivIndex !== null ? '記念日を編集' : '新しく追加（毎年表示）'}</label>
                <input type="text" className="pop-input" style={{ marginBottom: '10px' }} value={newAnnivTitle} onChange={e => setNewAnnivTitle(e.target.value)} placeholder="例：結婚記念日" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select className="pop-input" style={{ flex: 1, padding: '0 8px', textAlign: 'center' }} value={newAnnivMonth} onChange={e => setNewAnnivMonth(e.target.value)}>
                      {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => <option key={m} value={m}>{m}月</option>)}
                    </select>
                    <select className="pop-input" style={{ flex: 1, padding: '0 8px', textAlign: 'center' }} value={newAnnivDay} onChange={e => setNewAnnivDay(e.target.value)}>
                      {Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0')).map(d => <option key={d} value={d}>{d}日</option>)}
                    </select>
                  </div>
                  <ColorSelector value={newAnnivColor} onChange={setNewAnnivColor} />
                </div>
                <button onClick={handleAddAnniversary} className="btn-pop" style={{ width: '100%' }}>{editAnnivIndex !== null ? '更新する' : '追加する'}</button>
              </div>
            </div>
          </div>
        )}

        {/* 毎月のルーティンモーダル */}
        {isRoutineModalOpen && (
          <div className="modal-overlay" onClick={() => setIsRoutineModalOpen(false)}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
              <ModalHeader title="毎月の予定を設定" onClose={() => setIsRoutineModalOpen(false)} />
              <div style={{ marginBottom: '20px', maxHeight: '180px', overflowY: 'auto' }} className="hide-scrollbar">
                {monthlyRoutines.map((r: any, idx: number) => renderListItem(`routine-${idx}`, r.color, `毎月${r.day}日 : ${r.title}`, () => { setEditRoutineIndex(idx); setNewRoutineTitle(r.title); setNewRoutineDay(String(r.day)); setNewRoutineColor(r.color); setNewRoutineType(r.type || 'task'); }, () => setMonthlyRoutines(monthlyRoutines.filter((_, i) => i !== idx))))}              </div>
              <div className="card-box">
                <label className="form-label">{editRoutineIndex !== null ? '予定を編集' : '新しく追加（毎月表示）'}</label>
                <select className="pop-input" value={newRoutineType} onChange={e => setNewRoutineType(e.target.value)} style={{ marginBottom: '10px' }}>
                  <option value="task">チェック式 (達成を記録)</option>
                  <option value="income">金額入力 (収入・給料など)</option>
                  <option value="expense">金額入力 (固定費・支払いなど)</option>
                </select>
                <input type="text" className="pop-input" style={{ marginBottom: '10px' }} value={newRoutineTitle} onChange={e => setNewRoutineTitle(e.target.value)} placeholder="例：給料日" />
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center' }}>
                  <select className="pop-input" value={newRoutineDay} onChange={e => setNewRoutineDay(e.target.value)} style={{ width: '120px', flex: 'none', padding: '14px' }}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={d}>{d}日</option>)}
                  </select>
                  <ColorSelector value={newRoutineColor} onChange={setNewRoutineColor} />
                </div>
                <select className="pop-input" value={(monthlyRoutines[editRoutineIndex || 0]?.adjust) || 'none'} onChange={e => {
                   if (editRoutineIndex !== null) {
                     const arr = [...monthlyRoutines]; arr[editRoutineIndex].adjust = e.target.value; setMonthlyRoutines(arr);
                   }
                }} style={{ marginBottom: '16px', fontSize: '0.8rem' }}>
                  <option value="none">土日・祝日でもそのまま表示</option>
                  <option value="prev">土日・祝日なら「前倒し（金曜等）」にする</option>
                  <option value="next">土日・祝日なら「後ろ倒し（月曜等）」にする</option>
                </select>
                <button onClick={handleAddRoutine} className="btn-pop" style={{ width: '100%' }}>{editRoutineIndex !== null ? '更新する' : '追加する'}</button>
              </div>
            </div>
          </div>
        )}

        {/* ジャンル編集モーダル（別ファイルに分離済み！） */}
        <CategoryStudio
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          categories={categories}
          setCategories={setCategories}
          themeColor={themeColor}
          activePresets={activePresets}
          userColors={userColors}
          setUserColors={setUserColors}
        />

        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100dvh', background: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }} onClick={() => setIsModalOpen(false)}>

          <div className="glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: '92%', maxWidth: mode === 'subscription' ? '760px' : '380px', maxHeight: '80dvh', background: 'var(--bg-main)', padding: '24px', borderRadius: '24px', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', transition: 'max-width 0.3s ease', boxSizing: 'border-box' }}>             <ModalHeader
                title={
                  mode === 'expense' ? <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Banknote size={24} /> 支出を記録</div> : 
                  mode === 'subscription' ? <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Repeat size={24} /> サブスクリプション管理</div> : 
                  mode === 'create' ? '予定を追加' : 
                  mode === 'dayOfWeekBulk' ? '曜日一括追加' : 
                  mode === 'routine_detail' ? 'ルーティンの確認' : '予定を編集'
                }
                onClose={() => setIsModalOpen(false)}
                rightEl={mode === 'detail' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleDuplicate} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>複製</button>
                    <button onClick={handleDelete} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '900' }}>削除</button>
                  </div>
                ) : null}
              />

              {mode === 'expense' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
                  
                  {/* 👇 収支切り替えトグル */}
                  <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: '16px', padding: '6px', border: '1px solid var(--border-color)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                    <button 
                      onClick={() => setCustomFieldsData({...customFieldsData, transactionMode: 'expense'})} 
                      style={{ flex: 1, padding: '10px', borderRadius: '12px', background: customFieldsData.transactionMode !== 'income' ? 'rgba(239,68,68,0.1)' : 'transparent', color: customFieldsData.transactionMode !== 'income' ? '#ef4444' : 'var(--text-sub)', border: `1px solid ${customFieldsData.transactionMode !== 'income' ? '#ef4444' : 'transparent'}`, fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', boxShadow: customFieldsData.transactionMode !== 'income' ? '0 4px 10px rgba(239,68,68,0.15)' : 'none' }}>
                      支出
                    </button>
                    <button 
                      onClick={() => setCustomFieldsData({...customFieldsData, transactionMode: 'income'})} 
                      style={{ flex: 1, padding: '10px', borderRadius: '12px', background: customFieldsData.transactionMode === 'income' ? 'rgba(16,185,129,0.1)' : 'transparent', color: customFieldsData.transactionMode === 'income' ? '#10b981' : 'var(--text-sub)', border: `1px solid ${customFieldsData.transactionMode === 'income' ? '#10b981' : 'transparent'}`, fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s', boxShadow: customFieldsData.transactionMode === 'income' ? '0 4px 10px rgba(16,185,129,0.15)' : 'none' }}>
                      収入
                    </button>
                  </div>

                  <div>
                    <label className="form-label">日付</label>
                    <input type="date" className="pop-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="form-label">金額</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="number" className="pop-input no-spin" style={{ flex: 1, textAlign: 'right', fontSize: '1.6rem', fontWeight: '900', color: customFieldsData.transactionMode === 'income' ? '#10b981' : '#ef4444' }} placeholder="0" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} autoFocus />
                      <span style={{ fontWeight: 'bold', color: 'var(--text-sub)' }}>円</span>
                    </div>
                  </div>
                  {/* 👇 修正：ジャンルと支払方法を横並びで選択可能に */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">ジャンル</label>
                      <select className="pop-input" value={categoryName} onChange={e => setCategoryName(e.target.value)} style={{ padding: '0 8px' }}>
                        <option value="">選択</option>
                        {categories.map((c: any) => <option key={c.name} value={c.name}>{c.name}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label className="form-label">{customFieldsData.transactionMode === 'income' ? '受取方法' : '支払方法'}</label>
                      <select className="pop-input" value={customFieldsData.paymentMethod || 'cash'} onChange={e => handleCustomFieldChange('paymentMethod', e.target.value)} style={{ padding: '0 8px' }}>
                        {customFieldsData.transactionMode === 'income' ? (
                          <>
                            <option value="bank">🏦 振込・口座</option>
                            <option value="cash">💴 現金・手渡し</option>
                            <option value="paypay">📱 電子マネー</option>
                          </>
                        ) : (
                          <>
                            <option value="cash">💴 現金</option>
                            <option value="credit">💳 クレカ</option>
                            <option value="paypay">📱 スマホ決済</option>
                            <option value="ic">🪪 交通系IC</option>
                            <option value="reimburse">🔄 立替 (要精算)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">メモ（用途など）</label>
                    <input type="text" className="pop-input" value={title} onChange={e => setTitle(e.target.value)} placeholder={customFieldsData.transactionMode === 'income' ? "例：フリマアプリ売上" : "例：コンビニで水"} />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                    <button onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>キャンセル</button>
                    <button onClick={async () => {
                      if (!expenseAmount || !categoryName) return alert('金額とジャンルを入力してください');
                      const isInc = customFieldsData.transactionMode === 'income';
                      const payload = {
                        title: title ? title : `${categoryName}の${isInc ? '収入' : '支出'}`, category: categoryName,
                        start_at: new Date(`${startDate}T12:00:00`).toISOString(), end_at: new Date(`${startDate}T13:00:00`).toISOString(),
                        metadata: { 
                          isAllDayBackground: true, 
                          isPureFinance: true, // 👈 追加：カレンダーに表示させない専用フラグ
                          customColor: categories.find(c => c.name === categoryName)?.color || (isInc ? '#10b981' : '#ef4444'), 
                          customFields: { 
                            isExpenseSet: !isInc, standardExpenseAmount: !isInc ? expenseAmount : '',
                            isIncomeSet: isInc, standardIncomeAmount: isInc ? expenseAmount : '',
                            paymentMethod: customFieldsData.paymentMethod || 'cash' // 👈 追加
                          }
                        }
                      };
                      await supabase.from('events').insert([payload]);
                      setIsModalOpen(false); fetchEvents(); setExpenseAmount('');
                    }} className="btn-pop" style={{ flex: 1.5, background: customFieldsData.transactionMode === 'income' ? '#10b981' : '#ef4444', boxShadow: `0 4px 15px rgba(${customFieldsData.transactionMode === 'income' ? '16,185,129' : '239,68,68'},0.4)` }}>記録する</button>
                  </div>
                </div>

              ) : mode === 'subscription' ? (
                /* 👇 2. サブスク専用ダッシュボードUI */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px 0' }}>
                  
                  {/* サマリーカード（月額・年額の自動計算） */}
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {(() => {
                      const monthlyTotal = subs.filter(s => s.cycle === 'monthly').reduce((acc, s) => acc + Number(s.amount), 0);
                      const yearlyTotal = subs.filter(s => s.cycle === 'yearly').reduce((acc, s) => acc + Number(s.amount), 0) + (monthlyTotal * 12);
                      return (
                        <>
                          <div style={{ flex: 1, minWidth: '200px', background: 'var(--card-bg)', border: `1px solid ${themeColor}`, borderRadius: '16px', padding: '20px', boxShadow: `0 4px 15px ${themeColor}15` }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-sub)', marginBottom: '8px' }}>月額の支払い (月会費)</div>
                            <div style={{ fontSize: '2rem', fontWeight: '900', color: themeColor }}>¥{monthlyTotal.toLocaleString()}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: '200px', background: 'var(--card-bg)', border: `1px solid ${themeColor}`, borderRadius: '16px', padding: '20px', boxShadow: `0 4px 15px ${themeColor}15` }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-sub)', marginBottom: '8px' }}>年額の支払い (年会費 + 月額×12)</div>
                            <div style={{ fontSize: '2rem', fontWeight: '900', color: themeColor }}>¥{yearlyTotal.toLocaleString()}</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    {/* 左側：登録済みリスト */}
                    <div style={{ flex: 1.5, minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)' }}>登録済みのサービス</span>
                      <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }} className="hide-scrollbar">
                        {subs.map((sub, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--card-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                            <div>
                              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '4px' }}>{sub.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 'bold' }}>{sub.cycle === 'monthly' ? `毎月 ${sub.date}日` : `毎年 ${sub.date.replace('-', '月')}日`}支払{sub.category ? ` / ${sub.category}` : ''}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span style={{ fontWeight: '900', color: '#ef4444', fontSize: '1.1rem' }}>¥{Number(sub.amount).toLocaleString()}</span>
                              <button onClick={() => setSubs(subs.filter((_, i) => i !== idx))} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={16}/></button>
                            </div>
                          </div>
                        ))}
                        {subs.length === 0 && <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-sub)', fontWeight: 'bold', padding: '24px', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>登録されているサブスクはありません</div>}
                      </div>
                    </div>

                    {/* 右側：新規追加フォーム */}
                    <div style={{ flex: 1, minWidth: '250px' }}>
                      <div className="card-box" style={{ margin: 0, border: `2px dashed ${themeColor}` }}>
                        <label className="form-label" style={{ color: themeColor, fontSize: '0.9rem' }}>新しいサブスクを追加</label>
                        <input type="text" className="pop-input" placeholder="サービス名 (Netflixなど)" value={subName} onChange={e => setSubName(e.target.value)} style={{ marginBottom: '12px' }} />
                        
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                          <select className="pop-input" value={subCycle} onChange={e => {
                            setSubCycle(e.target.value);
                            if (e.target.value === 'yearly' && !subDate.includes('-')) setSubDate('01-01');
                            if (e.target.value === 'monthly' && subDate.includes('-')) setSubDate('1');
                          }} style={{ width: '90px', flexShrink: 0 }}>
                            <option value="monthly">毎月</option><option value="yearly">毎年</option>
                          </select>
                          
                          {subCycle === 'monthly' ? (
                            <select className="pop-input" value={subDate} onChange={e => setSubDate(e.target.value)} style={{ flex: 1, padding: '0 8px', textAlign: 'center' }}>
                              {Array.from({length:31}, (_,i)=>i+1).map(d => <option key={d} value={String(d)}>{d}日</option>)}
                            </select>
                          ) : (
                            <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                              <select className="pop-input" value={subDate.includes('-') ? subDate.slice(-5).split('-')[0] : '01'} onChange={e => setSubDate(`${e.target.value}-${subDate.includes('-') ? subDate.slice(-5).split('-')[1] : '01'}`)} style={{ flex: 1, padding: '0 4px', textAlign: 'center' }}>
                                {Array.from({length: 12}, (_, i) => String(i + 1).padStart(2, '0')).map(m => <option key={m} value={m}>{m}月</option>)}
                              </select>
                              <select className="pop-input" value={subDate.includes('-') ? subDate.slice(-5).split('-')[1] : '01'} onChange={e => setSubDate(`${subDate.includes('-') ? subDate.slice(-5).split('-')[0] : '01'}-${e.target.value}`)} style={{ flex: 1, padding: '0 4px', textAlign: 'center' }}>
                                {Array.from({length: 31}, (_, i) => String(i + 1).padStart(2, '0')).map(d => <option key={d} value={String(d).padStart(2, '0')}>{d}日</option>)}
                              </select>
                            </div>
                          )}
                        </div>
                        
                        {/* 👇 ジャンルと金額を1行に横並び（flex）にする */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                          <select className="pop-input" value={categoryName} onChange={e => setCategoryName(e.target.value)} style={{ flex: 1.2, padding: '0 8px', fontSize: '0.9rem' }}>
                            <option value="">ジャンル (任意)</option>
                            {categories.map((c:any) => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                            <input type="number" className="pop-input no-spin" placeholder="金額" value={subAmount} onChange={e => setSubAmount(e.target.value)} style={{ width: '100%', textAlign: 'right', fontSize: '1.1rem', fontWeight: 'bold', padding: '0 8px' }} />
                            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-sub)', whiteSpace: 'nowrap' }}>円</span>
                          </div>
                        </div>
                        
                        <button onClick={() => {
                          if (!subName || !subAmount) return alert('サービス名と金額を入力してください');
                          const finalDate = subCycle === 'yearly' ? subDate.slice(-5) : subDate;
                          setSubs([...subs, { name: subName, amount: subAmount, cycle: subCycle, date: finalDate, category: categoryName || '' }]);
                          setSubName(''); setSubAmount(''); setCategoryName('');
                        }} className="btn-pop" style={{ width: '100%', padding: '14px', fontSize: '1rem' }}>＋ 登録する</button>
                      </div>
                    </div>
                  </div>
                </div>

              ) : mode === 'routine_detail' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '10px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.3rem', fontWeight: '900', color: eventColor }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: eventColor }} />{title}
                  </div>

                  {customFieldsData.routineType === 'task' ? (
                    <div className="card-box" style={{ margin: 0 }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '16px' }}>今月のこの目標・タスクを完了済みにしますか？</p>
                      <button onClick={handleCompleteRoutine} className="btn-pop" style={{ padding: '16px 32px', fontSize: '1.1rem', width: '100%', borderRadius: '20px', background: eventColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Check size={20} /> 完了として記録</button>                    </div>
                  ) : (
                    <div className="card-box" style={{ margin: 0 }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
                        {customFieldsData.routineType === 'income' ? '今月の収入（給料など）を記録します' : '今月の固定費（支払いなど）を記録します'}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: customFieldsData.routineType === 'income' ? '#10b981' : '#ef4444', width: '60px' }}>
                          {customFieldsData.routineType === 'income' ? '収入' : '金額'}
                        </span>
                        <input type="number" className="pop-input no-spin" style={{ flex: 1, textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold' }} placeholder="金額を入力" value={routineAmount} onChange={e => setRoutineAmount(e.target.value)} autoFocus />
                        <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>円</span>
                      </div>

                      {customFieldsData.routineType === 'income' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#f59e0b', width: '60px' }}>
                            追加の収入
                          </span>
                          <input type="number" className="pop-input no-spin" style={{ flex: 1, textAlign: 'right', fontSize: '1.1rem', fontWeight: 'bold' }} placeholder="ボーナス・残業代など（任意）" value={routineBonusAmount} onChange={e => setRoutineBonusAmount(e.target.value)} />
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>円</span>
                        </div>
                      )}
                    <button onClick={handleRecordRoutineMoney} className="btn-pop" style={{ padding: '16px 32px', fontSize: '1.1rem', width: '100%', borderRadius: '20px', background: eventColor, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><BookOpen size={20} /> 帳簿に記録する</button>                    </div>
                  )}
                  <button onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ width: '100%' }}>閉じる</button>
                </div>
              ) : (
                <>
                  {(() => {
                    // 👇 修正：「すでに登録済み」か「新規作成だけど今日以前の日付」なら、最初から事後記録を出せるようにする！
                    const isPastOrToday = new Date(startDate) <= new Date();
                    const showRecords = (mode === 'detail' || (mode === 'create' && isPastOrToday)) && currentCategoryObj?.fields && currentCategoryObj.fields.length > 0;

                    const PaymentMethodSelector = ({ value, onChange, isIncome }: { value: string, onChange: (val: string) => void, isIncome: boolean }) => {
                      const [isOpen, setIsOpen] = useState(false);
                      const methods = isIncome 
                        ? [
                            { id: 'bank', label: '振込', icon: Landmark, color: 'var(--theme)' },
                            { id: 'cash', label: '現金', icon: Banknote, color: 'var(--theme)' },
                            { id: 'paypay', label: '電子マネー', icon: Smartphone, color: 'var(--theme)' }
                          ]
                        : [
                            { id: 'cash', label: '現金', icon: Banknote, color: 'var(--theme)' },
                            { id: 'credit', label: 'クレカ', icon: CreditCard, color: 'var(--theme)' },
                            { id: 'paypay', label: 'スマホ', icon: Smartphone, color: 'var(--theme)' },
                            { id: 'ic', label: '交通IC', icon: Train, color: 'var(--theme)' }
                          ];
                      const current = methods.find(m => m.id === value) || methods[0];
                      const Icon = current.icon;

                      return (
                        <div style={{ position: 'relative', flex: 1, minWidth: '100px' }}>
                          <div onClick={() => setIsOpen(!isOpen)} className="pop-input" style={{ height: '36px', fontSize: '0.75rem', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', border: isOpen ? '2px solid var(--theme)' : '1px solid var(--border-color)', background: 'var(--input-bg)' }}>
                            <Icon size={14} color={current.color} style={{ flexShrink: 0 }} />
                            <span style={{ flex: 1, fontWeight: 'bold', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden' }}>{current.label}</span>
                            {isOpen ? <ChevronUp size={14} color="var(--text-sub)" /> : <ChevronDown size={14} color="var(--text-sub)" />}
                          </div>
                          {isOpen && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, width: '130px', background: 'var(--card-bg)', border: '1px solid var(--theme)', borderRadius: '12px', marginTop: '4px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden', padding: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {methods.map(m => {
                                const OptIcon = m.icon;
                                return (
                                  <div key={m.id} onClick={() => { onChange(m.id); setIsOpen(false); }} style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-main)', background: value === m.id ? 'var(--input-bg)' : 'transparent', borderRadius: '8px' }}>
                                    <OptIcon size={14} color={m.color} style={{ flexShrink: 0 }} />
                                    {m.label}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    };
                    const FuturisticDateInput = ({ label, value, onChange }: any) => (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--theme)', fontWeight: '900', letterSpacing: '1px' }}>{label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px', transition: 'all 0.3s' }}>
                          <Calendar size={14} style={{ color: 'var(--theme)', marginRight: '4px', flexShrink: 0 }} />
                          <input type="date" value={value} onChange={onChange} style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 'bold', width: '100%', padding: 0 }} />
                        </div>
                      </div>
                    );

                    const FuturisticTimeInput = ({ label, h, m, setH, setM }: any) => (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                        {label && <span style={{ fontSize: '0.65rem', color: 'var(--text-sub)', fontWeight: 'bold', letterSpacing: '1px' }}>{label}</span>}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <select value={h} onChange={e => setH(e.target.value)} style={{ flex: 1, appearance: 'none', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 4px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', textAlign: 'center', textAlignLast: 'center', outline: 'none' }}>
                            {HOURS.map((x:string) => <option key={x} value={x}>{x}</option>)}
                          </select>
                          <span style={{ fontWeight: 'bold', color: 'var(--text-sub)' }}>:</span>
                          <select value={m} onChange={e => setM(e.target.value)} style={{ flex: 1, appearance: 'none', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 4px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', textAlign: 'center', textAlignLast: 'center', outline: 'none' }}>
                            {MINUTES.map((x:string) => <option key={x} value={x}>{x}</option>)}
                          </select>
                        </div>
                      </div>
                    );

                    const BlockTemplates = mode === 'create' && (
                      <div key="templates" className="card-box" style={{ padding: '12px 16px', marginBottom: '16px', background: 'var(--card-bg)', border: '1px dashed var(--theme)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: quickTemplates.length > 0 ? '8px' : '0' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--theme)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Star size={14} /> よくある予定
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }} className="hide-scrollbar">
                          {quickTemplates.map((t, i) => (
                            <div
                              key={i}
                              onClick={() => { setTitle(t.title); setLocation(t.location || ''); setStartH(t.startH); setStartM(t.startM); setEndH(t.endH); setEndM(t.endM); setCategoryName(t.categoryName); setIsAllDayBackground(t.isAllDayBackground); setEventColor(t.eventColor || ''); }}                              style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '8px 14px', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                            >
                              <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{t.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );

                    const BlockTitle = (
                      <div key="title" style={{ marginBottom: '16px' }}>
                        <label className="form-label">タイトル</label>
                        <input type="text" className="pop-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="例：カフェで読書" />
                      </div>
                    );

                    const BlockTime = (
                      <div key="time" className="card-box" style={{ padding: '16px', marginBottom: '16px' }}>
                        {isAllDayBackground ? (
                          // 👇 1日単位がオンの時は、開始日と終了日だけを表示
                          <div style={{ display: 'flex', gap: '12px' }}>
                            <FuturisticDateInput label="開始日" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} />
                            <FuturisticDateInput label="終了日" value={endDate || startDate} onChange={(e: any) => setEndDate(e.target.value)} />
                          </div>
                        ) : (
                          // 👇 通常時・マイルストーンの時は時刻を表示
                          <>
                            <div style={{ display: 'flex', gap: '12px' }}>
                              <FuturisticDateInput label="開始日" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} />
                              <FuturisticTimeInput label="開始時刻" h={startH} m={startM} setH={handleStartHChange} setM={handleStartMChange} />
                            </div>
                            {!isMilestone && (
                              <div style={{ display: 'flex', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
                                <FuturisticDateInput label="終了日" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} />
                                <FuturisticTimeInput label="終了時刻" h={endH} m={endM} setH={(val:any) => setEndH(val)} setM={(val:any) => setEndM(val)} />
                              </div>
                            )}
                          </>
                        )}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                          <label className="checkbox-label" style={{ fontSize: '0.75rem', minHeight: 'auto' }}>
                            <input type="checkbox" checked={isAllDayBackground} onChange={e => {
                              setIsAllDayBackground(e.target.checked);
                              if (e.target.checked) setIsMilestone(false); // 同時選択を防止
                            }} /> 1日単位
                          </label>
                          <label className="checkbox-label" style={{ fontSize: '0.75rem', minHeight: 'auto' }}>
                            <input type="checkbox" checked={isMilestone} onChange={e => {
                              setIsMilestone(e.target.checked);
                              if (e.target.checked) setIsAllDayBackground(false); // 同時選択を防止
                            }} /> 時刻のみ表示
                          </label>
                        </div>
                      </div>
                    );

                    const BlockLocationAndGathering = (
                      <div key="loc_gathering" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        <div>
                          <label className="form-label">場所</label>
                          <input type="text" className="pop-input" style={{ flex: 1 }} value={location} onChange={e => setLocation(e.target.value)} placeholder="目的地を入力" />
                        </div>

                        {/* 💰 支出・立替を記録（バグ修正・レイアウト調整版） */}
                        <div className="card-box" style={{ margin: 0, padding: 0, background: customFieldsData.isExpenseSet ? 'var(--input-bg)' : 'transparent', borderStyle: customFieldsData.isExpenseSet ? 'solid' : 'dashed', overflow: 'visible' }}> {/* 👈 hidden を visible に変更しリスト見切れを解消 */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', flex: 1 }}>
                              <input type="checkbox" checked={customFieldsData.isExpenseSet || false} onChange={e => { handleCustomFieldChange('isExpenseSet', e.target.checked); if (e.target.checked && !expandedBlocks.includes('expense')) toggleBlock('expense'); }} />
                              <CreditCard size={16} style={{ color: 'var(--theme)' }} /> 支出・立替を記録する
                            </label>
                            {customFieldsData.isExpenseSet && (
                              <button type="button" onClick={() => toggleBlock('expense')} style={{ background: 'transparent', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', display: 'flex' }}>
                                {expandedBlocks.includes('expense') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            )}
                          </div>
                          {customFieldsData.isExpenseSet && expandedBlocks.includes('expense') && (() => {
                            const expensesList = customFieldsData.expenses || [{
                              id: Date.now(), 
                              type: 'expense', 
                              category: customFieldsData.expenseCategory || categoryName || '', 
                              amount: customFieldsData.standardExpenseAmount || '', 
                              method: customFieldsData.paymentMethod || 'cash', 
                              payee: ''
                            }];

                            const updateExpense = (id: number, key: string, value: any) => {
                              const newList = expensesList.map((e: any) => e.id === id ? { ...e, [key]: value } : e);
                              // 👇 金額入力バグの修正：ステートの更新競合を防ぐため一括で処理する
                              setCustomFieldsData((prev: any) => {
                                const newData = { ...prev, expenses: newList };
                                if (newList[0].id === id) {
                                  if (key === 'amount') newData.standardExpenseAmount = value;
                                  if (key === 'category') newData.expenseCategory = value;
                                  if (key === 'method') newData.paymentMethod = value;
                                }
                                // DB即時反映
                                if (mode === 'detail' && selectedId) {
                                  const currentEvent = events.find((e: any) => e.id === selectedId);
                                  if (currentEvent) supabase.from('events').update({ metadata: { ...(currentEvent.extendedProps.metadata || {}), customFields: newData } }).eq('id', selectedId);
                                }
                                return newData;
                              });
                            };

                            const addExpense = () => {
                              handleCustomFieldChange('expenses', [...expensesList, { id: Date.now(), type: 'expense', category: '', amount: '', method: 'cash', payee: '' }]);
                            };

                            const removeExpense = (id: number) => {
                              if (expensesList.length <= 1) return;
                              handleCustomFieldChange('expenses', expensesList.filter((e: any) => e.id !== id));
                            };

                            // 👇 修正：過去の予定から抽出した名前に、手動で登録したカスタムリストを合流させる！
                            const dynamicPayees = events.flatMap(e => e.extendedProps?.metadata?.customFields?.expenses?.map((ex: any) => ex.payee));
                            const pastPayees = Array.from(new Set([...customPayees, ...dynamicPayees])).filter(Boolean);

                            return (
                              <div style={{ padding: '0 16px 16px 16px', borderTop: '1px dashed var(--border-color)', marginTop: '4px', paddingTop: '16px' }}>
                                {expensesList.map((exp: any, index: number) => {
                                  const isIncome = exp.type === 'income' || exp.type === 'borrow';
                                  const isAdvanceOrBorrow = exp.type === 'advance' || exp.type === 'borrow';

                                  return (
                                    <div key={exp.id} style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: index < expensesList.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
                                      
                                      {/* 1行目: 支出タイプ(比率2) ＆ (相手 or 支払い方法(比率1)) ＆ 削除ボタン */}
                                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center', width: '100%' }}>
                                        <div style={{ flex: 2, minWidth: 0 }}>
                                          <ExpenseTypeSelector value={exp.type} onChange={(val) => updateExpense(exp.id, 'type', val)} />
                                        </div>
                                        
                                        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                                          {isAdvanceOrBorrow ? (
                                            <>
                                              <input type="text" list={`payee-list-${exp.id}`} className="pop-input" style={{ width: '100%', fontSize: '0.65rem', padding: '0 6px' }} placeholder="相手の名前" value={exp.payee || ''} onChange={e => updateExpense(exp.id, 'payee', e.target.value)} />
                                              <datalist id={`payee-list-${exp.id}`}>
                                                {pastPayees.map((p: any, i) => <option key={i} value={p} />)}
                                              </datalist>
                                            </>
                                          ) : (
                                            <PaymentMethodSelector value={exp.method || 'cash'} onChange={(val: string) => updateExpense(exp.id, 'method', val)} isIncome={isIncome} />
                                          )}
                                        </div>
                                        
                                        {expensesList.length > 1 && (
                                          <button onClick={(e) => { e.preventDefault(); removeExpense(exp.id); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', padding: '0 4px', cursor: 'pointer', flexShrink: 0 }}>
                                            <Trash2 size={18} />
                                          </button>
                                        )}
                                      </div>

                                      {/* 2行目: 内容 ＆ 金額 */}
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                        <div style={{ flex: 1, position: 'relative' }}>
                                          <input type="text" className="pop-input" style={{ width: '100%', fontSize: '0.8rem', padding: '0 8px' }} placeholder="内容 (任意)" value={exp.description || (!isAdvanceOrBorrow ? exp.payee : '')} onChange={e => {
                                            updateExpense(exp.id, 'description', e.target.value);
                                            if (!isAdvanceOrBorrow) updateExpense(exp.id, 'payee', e.target.value);
                                          }} />
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', width: '110px' }}>
                                          <input type="number" className="pop-input no-spin" style={{ width: '100%', textAlign: 'right', fontSize: '1.1rem', fontWeight: 'bold', color: isIncome ? '#10b981' : '#ef4444', padding: '0 8px' }} placeholder="0" value={exp.amount} onChange={e => updateExpense(exp.id, 'amount', e.target.value)} />
                                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>円</span>
                                        </div>
                                      </div>

                                    </div>
                                  );
                                })}
                                <button onClick={(e) => { e.preventDefault(); addExpense(); }} className="btn-secondary" style={{ width: '100%', padding: '10px', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '4px' }}>
                                  ＋ 別の支出・立替を追加
                                </button>
                              </div>
                            );
                          })()}
                        </div>

                        {/* 🚩 集合・出発時間を設定（開閉式） */}
                        <div className="card-box" style={{ margin: 0, padding: 0, background: isGathering ? 'var(--input-bg)' : 'transparent', borderStyle: isGathering ? 'solid' : 'dashed', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', flex: 1 }}>
                              <input type="checkbox" checked={isGathering} onChange={e => { setIsGathering(e.target.checked); if (e.target.checked) { if (!gatheringTime) setGatheringTime(`${startH}:${startM}`); if (!departureTime) setDepartureTime(`${String(Math.max(0, Number(startH) - 1)).padStart(2, '0')}:${startM}`); if (!expandedBlocks.includes('gathering')) toggleBlock('gathering'); } }} />
                              <Flag size={16} style={{ color: 'var(--theme)' }} /> 集合・出発時間を設定
                            </label>
                            {isGathering && (
                              <button type="button" onClick={() => toggleBlock('gathering')} style={{ background: 'transparent', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', display: 'flex' }}>
                                {expandedBlocks.includes('gathering') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            )}
                          </div>
                          {isGathering && expandedBlocks.includes('gathering') && (
                            <div style={{ padding: '0 16px 16px 16px', borderTop: '1px dashed var(--border-color)', marginTop: '4px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', width: '80px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-sub)' }}><MapPin size={14} /> 出発地</span>
                                <input type="text" className="pop-input" value={customFieldsData.customStartLocation || ''} onChange={e => handleCustomFieldChange('customStartLocation', e.target.value)} placeholder={startPointType === 'address' ? (homeLocation || '自宅') : (nearestStation || '最寄り駅')} style={{ flex: 1, height: '36px', fontSize: '0.85rem' }} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', width: '80px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-sub)' }}><Clock size={14} /> 目的地に</span>
                                <div style={{ flex: 1 }}><FuturisticTimeInput h={gatheringTime.split(':')[0] || '12'} m={gatheringTime.split(':')[1] || '00'} setH={(val:any) => setGatheringTime(`${val}:${gatheringTime.split(':')[1]||'00'}`)} setM={(val:any) => setGatheringTime(`${gatheringTime.split(':')[0]||'12'}:${val}`)} /></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>集合</span>
                                <button onClick={(e) => { e.preventDefault(); const origin = customFieldsData.customStartLocation || (startPointType === 'address' ? homeLocation : nearestStation) || ''; if (!origin) return alert('出発地を設定してください。'); if (!location) return alert('場所（目的地）を入力してください。'); const url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(location)}&dirflg=r&ttype=arr&time=${gatheringTime || '12:00'}`; window.open(url, '_blank'); }} style={{ width: '36px', height: '36px', flexShrink: 0, border: 'none', borderRadius: '10px', background: 'var(--theme)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 10px var(--theme-shadow)' }}><Search size={18} /></button>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', width: '80px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-sub)' }}>
                                  {customFieldsData.customStartLocation ? <MapPin size={14}/> : (startPointType === 'address' ? <Home size={14} /> : <Train size={14} />)} 
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '45px' }}>{customFieldsData.customStartLocation ? '出発地' : (startPointType === 'address' ? '自宅' : '駅')}</span>を
                                </span>
                                <div style={{ flex: 1 }}><FuturisticTimeInput h={departureTime.split(':')[0] || '11'} m={departureTime.split(':')[1] || '30'} setH={(val:any) => setDepartureTime(`${val}:${departureTime.split(':')[1]||'00'}`)} setM={(val:any) => setDepartureTime(`${departureTime.split(':')[0]||'11'}:${val}`)} /></div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>出発</span><div style={{ width: '36px', flexShrink: 0 }} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 🚆 交通機関ブロック（開閉式） */}
                        <div className="card-box" style={{ margin: 0, padding: 0, background: customFieldsData.isTransit ? 'var(--input-bg)' : 'transparent', borderStyle: customFieldsData.isTransit ? 'solid' : 'dashed', overflow: 'hidden' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', flex: 1 }}>
                              <input type="checkbox" checked={customFieldsData.isTransit || false} onChange={e => { handleCustomFieldChange('isTransit', e.target.checked); if (e.target.checked && !expandedBlocks.includes('transit')) toggleBlock('transit'); }} />
                              <Train size={16} style={{ color: 'var(--theme)' }} /> 交通機関（時間を記録）
                            </label>
                            {customFieldsData.isTransit && (
                              <button type="button" onClick={() => toggleBlock('transit')} style={{ background: 'transparent', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', display: 'flex' }}>
                                {expandedBlocks.includes('transit') ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            )}
                          </div>
                          {customFieldsData.isTransit && expandedBlocks.includes('transit') && (
                            <div style={{ padding: '0 16px 16px 16px', borderTop: '1px dashed var(--border-color)', marginTop: '4px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              
                              {/* 行き（往路） */}
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--theme)' }}>往路（行き）</span>
                                <select className="pop-input" value={customFieldsData.transitType || 'train'} onChange={e => handleCustomFieldChange('transitType', e.target.value)} style={{ height: '36px', fontSize: '0.75rem' }}>
                                  <option value="train"> 新幹線・電車</option>
                                  <option value="plane"> 飛行機</option>
                                  <option value="bus"> 高速バス・夜行バス</option>
                                </select>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}><span style={{ fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{customFieldsData.transitType === 'plane' ? '搭乗:' : '乗車:'}</span><input type="time" className="pop-input" value={customFieldsData.transitDepTime || '10:00'} onChange={e => handleCustomFieldChange('transitDepTime', e.target.value)} style={{ padding: '0 8px', fontSize: '0.9rem', width: '100%' }} /></div>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>〜</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}><span style={{ fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{customFieldsData.transitType === 'plane' ? '到着:' : '降車:'}</span><input type="time" className="pop-input" value={customFieldsData.transitArrTime || '12:00'} onChange={e => handleCustomFieldChange('transitArrTime', e.target.value)} style={{ padding: '0 8px', fontSize: '0.9rem', width: '100%' }} /></div>
                                </div>
                              </div>

                              {/* 帰り（復路） */}
                              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', marginTop: '8px' }}>
                                <input type="checkbox" checked={customFieldsData.hasReturnTransit || false} onChange={e => handleCustomFieldChange('hasReturnTransit', e.target.checked)} /> 復路（帰り）も記録する
                              </label>
                              {customFieldsData.hasReturnTransit && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', background: 'var(--input-bg)', borderRadius: '12px' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--theme)' }}>復路（帰り）</span>
                                  <select className="pop-input" value={customFieldsData.returnTransitType || 'train'} onChange={e => handleCustomFieldChange('returnTransitType', e.target.value)} style={{ height: '36px', fontSize: '0.75rem' }}>
                                    <option value="train"> 新幹線・電車</option>
                                    <option value="plane"> 飛行機</option>
                                    <option value="bus"> 高速バス・夜行バス</option>
                                  </select>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}><span style={{ fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{customFieldsData.returnTransitType === 'plane' ? '搭乗:' : '出発:'}</span><input type="time" className="pop-input" value={customFieldsData.returnTransitDepTime || '18:00'} onChange={e => handleCustomFieldChange('returnTransitDepTime', e.target.value)} style={{ padding: '0 8px', fontSize: '0.9rem', width: '100%' }} /></div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>〜</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}><span style={{ fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{customFieldsData.returnTransitType === 'plane' ? '到着:' : '到着:'}</span><input type="time" className="pop-input" value={customFieldsData.returnTransitArrTime || '20:00'} onChange={e => handleCustomFieldChange('returnTransitArrTime', e.target.value)} style={{ padding: '0 8px', fontSize: '0.9rem', width: '100%' }} /></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );

                    const BlockConfig = (
                      <div key="config" className="card-box" style={{ padding: '16px' }}>
                        <label className="form-label">ジャンル・カラー</label>
                        <select value={categoryName || ''} onChange={e => {
                        setCategoryName(e.target.value);
                        const catObj = categories.find((c: any) => c.name === e.target.value);
                        if (catObj) setEventColor(catObj.color);
                      }} className="pop-input" style={{ marginBottom: '16px' }}>
                          <option value="">設定なし</option>
                          {categories.map((c: any) => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                        <ColorSelector value={eventColor || themeColor} onChange={setEventColor} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', gap: '4px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                            <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} style={{ margin: 0 }} />
                            <Pin size={12} /> ピン留め
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                            <input type="checkbox" checked={isTentative} onChange={e => setIsTentative(e.target.checked)} style={{ margin: 0 }} />
                            仮予定としてキープ
                          </label>
                        </div>
                        {/* 👇 追加：仮予定の確定ボタン */}
                        {mode === 'detail' && isTentative && (
                           <button onClick={(e) => { e.preventDefault(); setIsTentative(false); setTimeout(handleSave, 100); }} style={{ width: '100%', marginTop: '12px', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                              <CheckCircle size={20} /> この予定で確定する
                            </button>
                        )}
                      </div>
                    );

                    const showPhotoUI = currentCategoryObj?.allowPhoto || photoUrls.length > 0;
                    const BlockRecords = showRecords && (
                      <div key="records" className="card-box" style={{ background: isDarkMode ? 'rgba(245, 158, 11, 0.1)' : 'rgba(254, 243, 199, 0.7)', border: '1px solid rgba(253, 230, 138, 0.5)', marginBottom: '16px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: '900', color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                          <FileText size={16} /> 事後の記録（振り返り）
                        </label>

                        {currentCategoryObj?.fields?.map((f:any) => {
                          const handleWageTimeChange = (type: 'start'|'end', val: string) => {
                            const current = customFieldsData[f.id] || { start: '', end: '', hours: 0 };
                            const newData = { ...current, [type]: val };
                            if (newData.start && newData.end) {
                              const [sh, sm] = newData.start.split(':').map(Number);
                              const [eh, em] = newData.end.split(':').map(Number);
                              let diffMin = (eh * 60 + em) - (sh * 60 + sm);
                              if (diffMin < 0) diffMin += 24 * 60;
                              newData.hours = diffMin / 60;
                            }
                            handleCustomFieldChange(f.id, newData);
                          };

                          return (
                            <div key={f.id} style={{ marginBottom: '12px', background: 'var(--card-bg)', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--theme)', display: 'block', marginBottom: '8px' }}>{f.name}</span>

                              {f.type === 'number' && (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); const val = Number(customFieldsData[f.id] || 0); handleCustomFieldChange(f.id, String(val - 1)); }} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>-</button>
                                  <input type="number" className="pop-input" style={{ flex: 1, textAlign: 'center', fontSize: '1.3rem', fontWeight: '900', color: 'var(--theme)' }} value={customFieldsData[f.id] || ''} onChange={e => handleCustomFieldChange(f.id, e.target.value)} />
                                  <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); const val = Number(customFieldsData[f.id] || 0); handleCustomFieldChange(f.id, String(val + 1)); }} style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                                  <span style={{ padding: '0 4px', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>{f.unit}</span>
                                </div>
                              )}

                              {f.type === 'score' && (() => {
                                const myScore = customFieldsData[f.id]?.my || '';
                                const oppScore = customFieldsData[f.id]?.opp || '';
                                const result = customFieldsData[f.id]?.res || '';
                                
                                let resultBadge = null;
                                if (result === 'win') resultBadge = <span style={{ background: '#10b981', color: '#fff', padding: '6px 16px', borderRadius: '16px', fontWeight: '900', fontSize: '1.2rem', letterSpacing: '2px', boxShadow: '0 4px 10px rgba(16,185,129,0.3)', animation: 'popIn 0.3s', display: 'flex', alignItems: 'center', gap: '6px' }}><Sparkles size={20} /> WIN</span>;
else if (result === 'lose') resultBadge = <span style={{ background: '#ef4444', color: '#fff', padding: '6px 16px', borderRadius: '16px', fontWeight: '900', fontSize: '1.2rem', letterSpacing: '2px', boxShadow: '0 4px 10px rgba(239,68,68,0.3)', animation: 'popIn 0.3s', display: 'flex', alignItems: 'center', gap: '6px' }}><ChevronDown size={20} /> LOSE</span>;
else if (result === 'draw') resultBadge = <span style={{ background: '#94a3b8', color: '#fff', padding: '6px 16px', borderRadius: '16px', fontWeight: '900', fontSize: '1.2rem', letterSpacing: '2px', animation: 'popIn 0.3s', display: 'flex', alignItems: 'center', gap: '6px' }}><Circle size={20} /> DRAW</span>;

                                return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', background: 'var(--bg-main)', padding: '16px', borderRadius: '16px', border: `1px solid var(--border-color)` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
                                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--theme)' }}>応援チーム</span>
                                        <input type="number" className="pop-input no-spin" style={{ width: '100%', textAlign: 'center', fontSize: '2rem', fontWeight: '900', height: '60px', padding: 0 }} placeholder="0" value={myScore} onChange={e => handleScoreChange(f.id, e.target.value, oppScore)} />
                                      </div>
                                      <span style={{ fontWeight: '900', color: 'var(--text-sub)', fontSize: '1.5rem', marginTop: '24px' }}>VS</span>
                                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>相手チーム</span>
                                        <input type="number" className="pop-input no-spin" style={{ width: '100%', textAlign: 'center', fontSize: '2rem', fontWeight: '900', height: '60px', padding: 0 }} placeholder="0" value={oppScore} onChange={e => handleScoreChange(f.id, myScore, e.target.value)} />
                                      </div>
                                    </div>
                                    <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      {resultBadge}
                                    </div>
                                  </div>
                                );
                              })()}

                              {(f.type === 'money_expense' || f.type === 'money_income') && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span style={{ fontWeight: '900', color: f.type === 'money_income' ? '#10b981' : '#ef4444', fontSize: '0.85rem' }}>
                                    {f.type === 'money_income' ? '収入' : '支出'}
                                  </span>
                                  <input type="number" className="pop-input" style={{ flex: 1, textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold' }} placeholder="金額を入力" value={customFieldsData[f.id] || ''} onChange={e => handleCustomFieldChange(f.id, e.target.value)} />
                                  <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>円</span>
                                </div>
                              )}

                              {f.type === 'money' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <select className="pop-input" style={{ width: '90px', padding: '8px' }} value={customFieldsData[f.id]?.type || 'expense'} onChange={e => handleCustomFieldChange(f.id, {...(customFieldsData[f.id]||{}), type: e.target.value})}>
                                      <option value="expense">支出</option><option value="income">収入</option>
                                    </select>
                                    <input type="number" className="pop-input" style={{ flex: 1 }} placeholder="金額" value={customFieldsData[f.id]?.amount || ''} onChange={e => handleCustomFieldChange(f.id, {...(customFieldsData[f.id]||{}), amount: e.target.value})} />
                                  </div>
                                </div>
                              )}

                              {f.type === 'wage' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{ padding: '8px', background: 'var(--input-bg)', borderRadius: '8px', fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <Clock size={14} /> 予定時間から自動計算
                                    </div>
                                    {f.wageRules?.map((r: any, i: number) => <div key={i}>・{r.start.replace(':59', ':00')}〜{r.end.replace(':59', ':00')} : {r.wage}円</div>)}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-main)', fontWeight: 'bold' }}>休憩時間</span>
                                    <input type="number" className="pop-input" style={{ width: '80px', height: '32px', textAlign: 'right', fontSize: '0.9rem' }} value={customFieldsData[f.id]?.breakTime || ''} onChange={e => handleCustomFieldChange(f.id, {...customFieldsData[f.id], breakTime: e.target.value})} placeholder="0" />
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 'bold' }}>分</span>
                                  </div>
                                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap', paddingBottom: '12px' }}>
                                    <label className="checkbox-label" style={{ fontSize: '0.7rem', minHeight: 'auto', gap: '6px' }}>
                                      <input type="checkbox" checked={customFieldsData[f.id]?.overtimePremium !== false} onChange={e => handleCustomFieldChange(f.id, {...customFieldsData[f.id], overtimePremium: e.target.checked})} style={{ width: '14px', height: '14px' }} /> 8時間超え 25%UP
                                    </label>
                                    <label className="checkbox-label" style={{ fontSize: '0.7rem', minHeight: 'auto', gap: '6px' }}>
                                      <input type="checkbox" checked={customFieldsData[f.id]?.nightPremium !== false} onChange={e => handleCustomFieldChange(f.id, {...customFieldsData[f.id], nightPremium: e.target.checked})} style={{ width: '14px', height: '14px' }} /> 深夜(22-5時) 25%UP
                                    </label>
                                  </div>

                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--input-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--theme)' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--theme)', fontWeight: 'bold' }}>実働給与 (自動計算)</span>
                                    <span style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--theme)' }}>
                                      {(() => {
                                        let workStart = parseInt(startH) * 60 + parseInt(startM);
                                        let workEnd = parseInt(endH) * 60 + parseInt(endM);
                                        if (workEnd <= workStart) workEnd += 1440;

                                        let breakTime = parseInt(customFieldsData[f.id]?.breakTime || '0', 10);
                                        let stayMinutes = workEnd - workStart;
                                        if (breakTime > stayMinutes) breakTime = stayMinutes;

                                        let minuteWages: number[] = [];
                                        for(let m = workStart; m < workEnd; m++) {
                                          let dayM = m % 1440;
                                          let matchedWage = 0;
                                          f.wageRules?.forEach((rule: any) => {
                                            if(!rule.start || !rule.end || !rule.wage) return;
                                            let rs = parseInt(rule.start.split(':')[0]) * 60 + parseInt(rule.start.split(':')[1].replace('59', '00'));
                                            let re = parseInt(rule.end.split(':')[0]) * 60 + parseInt(rule.end.split(':')[1].replace('59', '00'));
                                            if (re <= rs) re += 1440;
                                            let inRule = false;
                                            if (re > 1440) {
                                              if ((dayM >= rs && dayM < 1440) || (dayM >= 0 && dayM < re - 1440)) inRule = true;
                                            } else {
                                              if (dayM >= rs && dayM < re) inRule = true;
                                            }
                                            if (inRule) matchedWage = Math.max(matchedWage, parseInt(rule.wage));
                                          });
                                          minuteWages.push(matchedWage);
                                        }

                                        let breakStartIdx = Math.floor((stayMinutes - breakTime) / 2);
        for (let i = 0; i < breakTime; i++) {
          minuteWages[breakStartIdx + i] = 0;
        }

        // 👇 ここから追加：同じ日の「前の予定」の労働時間を引っ張ってくる
        let pastWorkMinutes = 0;
        events.forEach((ev: any) => {
          if (ev.id === selectedId) return; // 自分自身は除外
          const evDate = toLocalYYYYMMDD(new Date(ev.start));
          if (evDate === startDate && ev.extendedProps?.category === categoryName) {
            const evStartObj = new Date(ev.start);
            const evStartMin = evStartObj.getHours() * 60 + evStartObj.getMinutes();
            // 今から保存する予定よりも「開始時間が早い」ものを合算
            if (evStartMin < workStart) {
              const prevHours = ev.extendedProps?.metadata?.customFields?.[f.id]?.hours || 0;
              pastWorkMinutes += Math.round(Number(prevHours) * 60);
            }
          }
        });

        let totalWage = 0;
        // 👇 0ではなく、前の予定で働いた時間を「下駄」として履かせる
        let actualWorkCount = pastWorkMinutes;
        const applyOvertime = customFieldsData[f.id]?.overtimePremium !== false;
        const applyNight = customFieldsData[f.id]?.nightPremium !== false;

                                        for (let i = 0; i < stayMinutes; i++) {
                                          let currentMin = (workStart + i) % 1440;
                                          let w = minuteWages[i];
                                          if (w > 0) {
                                            actualWorkCount++;
                                            let multiplier = 1.0;
                                            if (applyOvertime && actualWorkCount > 480) multiplier += 0.25;
                                            if (applyNight && (currentMin >= 1320 || currentMin < 300)) multiplier += 0.25;
                                            totalWage += (w * multiplier) / 60;
                                          }
                                        }
                                        return Math.round(totalWage).toLocaleString();
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {(() => {
                          // 👇 修正：ジャンル設定の「写真許可チェックボックス」に連動させる！
                          const showPhotoUI = currentCategoryObj?.allowPhoto || photoUrls.length > 0;

                          return (
                            <details style={{ background: 'var(--card-bg)', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }} open={Boolean(memo || photoUrls.length > 0)}>
                              <summary style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--theme)', outline: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                ＋ 思い出メモ{showPhotoUI ? '・写真' : ''}を追加
                              </summary>
                              <div style={{ marginTop: '12px', cursor: 'default' }}>
                                <textarea className="pop-input" value={memo} onChange={e => setMemo(e.target.value)} placeholder="思い出メモ..." rows={2} style={{ background: 'var(--input-bg)' }} />
                                
                                {/* 👇 修正：許可されている場合のみ写真UIを表示する */}
                                {showPhotoUI && (
                                  <div style={{ marginTop: '12px' }}>
                                    <label className="form-label" style={{ color: 'var(--theme)' }}>思い出の写真</label>
                                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                                      {photoUrls.map((url, i) => <img key={i} src={url} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />)}
                                      <label style={{ width: '60px', height: '60px', borderRadius: '8px', border: '2px dashed var(--theme)', color: 'var(--theme)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                        +<input type="file" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                                      </label>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </details>
                          );
                        })()}
                      </div>
                    );

                    const BlockBulk = mode === 'create' && (
                      <div key="bulk" className="card-box" style={{ padding: '16px' }}>
                        <label className="form-label">一括登録</label>
                        <div style={{ display: 'flex', gap: '4px' }}>{DAY_NAMES.map((l, i) => <button key={i} onClick={() => setSelectedDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i])} className={`day-btn ${selectedDays.includes(i) ? 'active' : ''}`}>{l}</button>)}</div>
                      </div>
                    );

                    const items = showRecords
                      ? [BlockRecords, BlockTitle, BlockTime, BlockLocationAndGathering, BlockConfig]
                      : [BlockTemplates, BlockTitle, BlockTime, BlockLocationAndGathering, BlockConfig, BlockBulk];

                    return items.filter(Boolean);
                  })()}

                  {/* 👇 修正：ボタンエリアを上段（キャンセル・保存）と下段（星・候補追加）に分ける */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                    
                    {/* 上段：キャンセル と 保存 */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '14px', fontSize: '0.95rem', fontWeight: 'bold' }}>キャンセル</button>
                      <button onClick={handleSave} className="btn-pop" style={{ flex: 1, padding: '14px', fontSize: '0.95rem', fontWeight: 'bold' }}>保存する</button>
                    </div>

                    {/* 下段：星 と 候補に追加 (どちらかが存在する場合のみ表示) */}
                    {((title && (mode === 'create' || mode === 'detail')) || mode === 'create') && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {title && (mode === 'create' || mode === 'detail') ? (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              const newT = { title, location, startH, startM, endH, endM, categoryName, isAllDayBackground, eventColor };
                              const updated = [...quickTemplates, newT];
                              setQuickTemplates(updated);
                              localStorage.setItem('quickTemplates', JSON.stringify(updated));
                              alert('「よくある予定」として新しく登録しました！');
                            }}
                            className="btn-secondary"
                            style={{ flex: 1, padding: '12px 8px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '2px dashed var(--theme)', color: 'var(--theme)', fontWeight: 'bold', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                          >
                            <Star size={16} /> テンプレート登録
                          </button>
                        ) : (
                          <div style={{ flex: 1 }} />
                        )}

                        {mode === 'create' ? (
                          <button onClick={(e) => {
                            e.preventDefault();
                            const sObj = new Date(startDate);
                            const dateStr = `${sObj.getMonth() + 1}/${sObj.getDate()}(${DAY_NAMES[sObj.getDay()]})`;
                            const timeStr = isAllDayBackground ? '終日' : `${startH}:${startM}〜${endH}:${endM}`;
                            const slotStr = `${dateStr} ${timeStr}`;
                            setAssistTimeSlots(prev => {
                              if (!prev.includes(slotStr)) return [...prev, slotStr];
                              return prev;
                            });
                            setIsModalOpen(false);
                            setIsScheduleAssistantOpen(true);
                            setAssistMode('send');
                          }} className="btn-secondary" style={{ flex: 1, padding: '12px 8px', fontSize: '0.8rem', whiteSpace: 'nowrap', border: '1px solid #f59e0b', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <Users size={16} /> 候補に追加
                          </button>
                        ) : (
                           <div style={{ flex: 1 }} />
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* 振り返りダッシュボード */}
        {isAnalyticsModalOpen && (
          <div className="modal-overlay" onClick={() => setIsAnalyticsModalOpen(false)}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
              <ModalHeader title="ダッシュボード" onClose={() => setIsAnalyticsModalOpen(false)} />

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <select className="pop-input" value={analyticsYear} onChange={e => setAnalyticsYear(e.target.value)} style={{ flex: 1 }}>
                  {Array.from({length: 21}, (_, i: number) => currentY - 10 + i).map((y: number) => <option key={y} value={String(y)}>{y}年</option>)}
                </select>
                {(analyticsSpan === 'month' || analyticsSpan === 'pie') && (
                  <select className="pop-input" value={analyticsMonth} onChange={e => setAnalyticsMonth(e.target.value)} style={{ width: '90px' }}>
                    {Array.from({length: 12}, (_, i: number) => i + 1).map((m: number) => <option key={m} value={String(m).padStart(2, '0')}>{m}月</option>)}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setAnalyticsSpan('month')} className={analyticsSpan === 'month' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '10px', background: analyticsSpan === 'month' ? themeColor : 'var(--input-bg)', boxShadow: analyticsSpan === 'month' ? `0 6px 20px ${themeColor}60` : 'none', color: analyticsSpan === 'month' ? '#fff' : 'var(--text-main)' }}>月間</button>
                <button onClick={() => setAnalyticsSpan('year')} className={analyticsSpan === 'year' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '10px', background: analyticsSpan === 'year' ? themeColor : 'var(--input-bg)', boxShadow: analyticsSpan === 'year' ? `0 6px 20px ${themeColor}60` : 'none', color: analyticsSpan === 'year' ? '#fff' : 'var(--text-main)' }}>年間</button>
                <button onClick={() => setAnalyticsSpan('pie')} className={analyticsSpan === 'pie' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '10px', background: analyticsSpan === 'pie' ? themeColor : 'var(--input-bg)', boxShadow: analyticsSpan === 'pie' ? `0 6px 20px ${themeColor}60` : 'none', color: analyticsSpan === 'pie' ? '#fff' : 'var(--text-main)' }}>円グラフ</button>
              </div>

              {analyticsSpan !== 'pie' && (
                <div className="hide-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '20px', paddingBottom: '8px' }}>
                  {categories.filter((c: any) => c.fields && c.fields.length > 0).map((c: any) => (
                    <button key={c.name} onClick={() => setAnalyticsCat(c.name)} style={{ background: analyticsCat === c.name ? c.color : 'var(--input-bg)', color: analyticsCat === c.name ? '#fff' : 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '8px 16px', fontSize: '0.85rem', fontWeight: '900', whiteSpace: 'nowrap', cursor: 'pointer', boxShadow: analyticsCat === c.name ? `0 6px 15px ${c.color}50` : '0 2px 5px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>{c.name}</button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '45vh', overflowY: 'auto', paddingRight: '5px' }} className="hide-scrollbar">
                {(() => {
                  const targetMonthStr = `${analyticsYear}-${analyticsMonth}`;
                  const targetEvents = analyticsSpan === 'month' || analyticsSpan === 'pie'
                    ? displayEvents.filter((e: any) => e.start && e.start.startsWith(targetMonthStr))
                    : displayEvents.filter((e: any) => e.start && e.start.startsWith(analyticsYear));

                  if (analyticsSpan === 'pie') {
                    let totalIncome = 0;
                    const catIncomes = categories.map((c: any) => {
                      let catInc = 0;
                      targetEvents.forEach((e: any) => {
                        const incomeCat = e.extendedProps.metadata?.customFields?.incomeCategory || e.extendedProps.category;
                        if (incomeCat === c.name && e.extendedProps.metadata?.customFields?.isIncomeSet) catInc += Number(e.extendedProps.metadata.customFields.standardIncomeAmount || 0);
                        if (e.extendedProps.category === c.name) {
                          const fields = e.extendedProps.metadata?.customFields;
                          if (fields && c.fields) {
                            c.fields.forEach((f: any) => {
                              if (f.type === 'money' && fields[f.id]?.type === 'income') catInc += Number(fields[f.id].amount || 0);
                              if (f.type === 'money_income') catInc += Number(fields[f.id] || 0);
                              if (f.type === 'wage' && !f.excludeFromTotal) {
                              if (fields[f.id]?.calculatedWage !== undefined) catInc += Number(fields[f.id].calculatedWage);
                              else {
                                const fallbackWage = f.wageRules && f.wageRules.length > 0 ? f.wageRules[0].wage : 0;
                                catInc += Number(fields[f.id]?.hours || 0) * Number(fallbackWage);
                              }
                            }
                            });
                          }
                        }
                      });
                      totalIncome += catInc;
                      return { name: c.name, color: c.color, value: catInc };
                    }).filter((c: any) => c.value > 0).sort((a: any, b: any) => b.value - a.value);

                    let totalExpense = 0;
                    const catExpenses = categories.map((c: any) => {
                      let catExp = 0;
                      targetEvents.forEach((e: any) => {
                        const expenseCat = e.extendedProps.metadata?.customFields?.expenseCategory || e.extendedProps.category;
                        if (expenseCat === c.name && e.extendedProps.metadata?.customFields?.isExpenseSet) catExp += Number(e.extendedProps.metadata.customFields.standardExpenseAmount || 0);
                        if (e.extendedProps.category === c.name) {
                          const fields = e.extendedProps.metadata?.customFields;
                          if (fields && c.fields) {
                            c.fields.forEach((f: any) => {
                              if (f.type === 'money' && fields[f.id]?.type === 'expense') catExp += Number(fields[f.id].amount || 0);
                              if (f.type === 'money_expense') catExp += Number(fields[f.id] || 0);
                            });
                          }
                        }
                      });
                      totalExpense += catExp;
                      return { name: c.name, color: c.color, value: catExp };
                    }).filter((c: any) => c.value > 0).sort((a: any, b: any) => b.value - a.value);

                    const renderPie = (title: string, data: any[], total: number, isIncome: boolean) => {
                      if (data.length === 0) return null;
                      let currentDeg = 0;
                      const gradientStops = data.map((c: any) => {
                        const perc = (c.value / total) * 100;
                        const stop = `${c.color} ${currentDeg}deg, ${c.color} ${currentDeg + perc * 3.6}deg`;
                        currentDeg += perc * 3.6;
                        return stop;
                      }).join(', ');
                      return (
                        <div className="card-box" style={{ padding: '20px', marginBottom: '16px' }}>
                          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: '900' }}>{title} <span style={{fontSize:'1rem', color: isIncome ? '#10b981' : '#ef4444'}}>¥{total.toLocaleString()}</span></h3>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: '180px', height: '180px', borderRadius: '50%', background: `conic-gradient(${gradientStops})`, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', marginBottom: '24px' }} />
                            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {data.map((c: any) => (
                                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--input-bg)', padding: '10px 12px', borderRadius: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.color }} />
                                    <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-main)' }}>{c.name}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 'bold' }}>{Math.round((c.value / total) * 100)}%</span>
                                    <span style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--text-main)' }}>¥{c.value.toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    };

                    return (
                      <>
                        {totalIncome === 0 && totalExpense === 0 && <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-sub)', fontWeight: '900' }}>収支データがありません</div>}
                        {renderPie('収入の割合', catIncomes, totalIncome, true)}
                        {renderPie('支出の割合', catExpenses, totalExpense, false)}
                      </>
                    );
                  }

                  return categories.filter((c: any) => c.name === analyticsCat).map((cat: any) => {
                    if (!cat.fields || cat.fields.length === 0) return null;
                    const catEvents = targetEvents.filter((e: any) => e.extendedProps.category === cat.name);

                    if (catEvents.length === 0) {
                      return <div key={cat.name} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-sub)', fontWeight: '900' }}><div>記録データがありません。</div></div>;
                    }

                    return (
                      <div key={cat.name} className="card-box" style={{ borderLeft: `6px solid ${cat.color}`, padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', fontWeight: '900' }}>{cat.name} の記録 <span style={{fontSize:'0.8rem', color:'var(--text-sub)'}}>({analyticsSpan === 'month' ? `${analyticsMonth}月` : `${analyticsYear}年`})</span></h3>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px', background: 'var(--input-bg)', padding: '8px 12px', borderRadius: '12px' }}>
                          {cat.fields.map((f: any) => (
                            <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)', cursor: 'pointer' }}>
                              <input type="checkbox" checked={visibleDashboardFields[f.id] !== false} onChange={e => setVisibleDashboardFields({...visibleDashboardFields, [f.id]: e.target.checked})} style={{ cursor: 'pointer' }} />
                              {f.name}
                            </label>
                          ))}
                        </div>

                        {analyticsSpan === 'month' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {cat.fields.map((f:any) => {
                              if (visibleDashboardFields[f.id] === false) return null;
                              let content;

                              if (f.type === 'number') {
                                const total = catEvents.reduce((sum: number, e: any) => sum + (Number(e.extendedProps.metadata?.customFields?.[f.id]) || 0), 0);
                                content = <div style={{ fontSize: '1.4rem', color: cat.color, fontWeight: '900' }}>{total.toLocaleString()}<span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginLeft: '4px' }}>{f.unit}</span></div>;
                              } else if (f.type === 'wage') {
                                const currentCatEvents = targetEvents.filter((e: any) => e.extendedProps.category === cat.name);
                                const totalH = currentCatEvents.reduce((sum: number, e: any) => sum + (Number(e.extendedProps.metadata?.customFields?.[f.id]?.hours) || 0), 0);
                                const totalWage = currentCatEvents.reduce((sum: number, e: any) => {
                                  const d = e.extendedProps.metadata?.customFields?.[f.id];
                                  if (!d) return sum;
                                  if (d.calculatedWage !== undefined) return sum + Number(d.calculatedWage);
                                  const fallbackWage = f.wageRules && f.wageRules.length > 0 ? f.wageRules[0].wage : 0;
                                  return sum + ((Number(d.hours) || 0) * Number(fallbackWage));
                                }, 0);

                                const currentCatExpense = currentCatEvents.reduce((sum: number, e: any) => {
                                  if (e.extendedProps.metadata?.customFields?.isExpenseSet) {
                                    return sum + Number(e.extendedProps.metadata.customFields.standardExpenseAmount || 0);
                                  }
                                  return sum;
                                }, 0);

                                content = (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                      <span style={{ fontSize: '1.5rem', fontWeight: '900', color: cat.color }}>
                                        ¥{Math.round(totalWage).toLocaleString()}
                                      </span>
                                      <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 'bold' }}>
                                        ({totalH}時間)
                                      </span>
                                    </div>
                                    {currentCatExpense > 0 && (
                                      <div style={{ paddingTop: '8px', borderTop: '1px dashed var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                        <span style={{ color: 'var(--text-sub)' }}>シフト時の支出・経費</span>
                                        <span style={{ color: '#ef4444' }}>-¥{currentCatExpense.toLocaleString()}</span>
                                      </div>
                                    )}
                                  </div>
                                );
                              } else if (f.type === 'money') {
                                let inc = 0, exp = 0;
                                catEvents.forEach((e: any) => {
                                  const d = e.extendedProps.metadata?.customFields?.[f.id];
                                  if(d) { if(d.type==='income') inc+=Number(d.amount)||0; else exp+=Number(d.amount)||0; }
                                });
                                content = <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', fontSize: '1.2rem' }}><span style={{color:'#10b981', fontWeight:'900'}}>+{inc.toLocaleString()}</span> <span style={{color:'#ef4444', fontWeight:'900'}}>-{exp.toLocaleString()}</span></div>;
                              } else if (f.type === 'score') {
                                let w = 0, l = 0, d = 0;
                                catEvents.forEach((e: any) => {
                                  const r = e.extendedProps.metadata?.customFields?.[f.id]?.res;
                                  if(r==='win') w++; else if(r==='lose') l++; else if(r==='draw') d++;
                                });
                                const totalGames = w + l + d;
                                const winRate = totalGames > 0 ? Math.round((w / totalGames) * 100) : 0;
                                
                                content = (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                      <div style={{ fontSize: '1.8rem', color: cat.color, fontWeight: '900', letterSpacing: '1px' }}>
                                        <span style={{ color: '#10b981' }}>{w}勝</span> <span style={{ color: '#ef4444' }}>{l}敗</span> <span style={{ color: '#94a3b8' }}>{d}分</span>
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>勝率</span>
                                        <span style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--text-main)' }}>{winRate}%</span>
                                      </div>
                                    </div>
                                    <div style={{ width: '100%', height: '12px', borderRadius: '6px', display: 'flex', overflow: 'hidden', background: 'var(--border-color)' }}>
                                      {w > 0 && <div style={{ width: `${(w/totalGames)*100}%`, background: '#10b981' }} title="勝ち" />}
                                      {d > 0 && <div style={{ width: `${(d/totalGames)*100}%`, background: '#94a3b8' }} title="引き分け" />}
                                      {l > 0 && <div style={{ width: `${(l/totalGames)*100}%`, background: '#ef4444' }} title="負け" />}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div key={f.id} style={{ background: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '12px' }}>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 'bold', marginBottom: '8px' }}>{f.name}</div>
                                  {content}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // 年間表示
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {cat.fields.map((f:any) => {
                              if (visibleDashboardFields[f.id] === false) return null;

                              if (f.type === 'score') {
                                let w = 0, l = 0, d = 0;
                                catEvents.forEach((e: any) => {
                                  const r = e.extendedProps.metadata?.customFields?.[f.id]?.res;
                                  if(r==='win') w++; else if(r==='lose') l++; else if(r==='draw') d++;
                                });
                                return (
                                  <div key={f.id} style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '12px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid var(--border-color)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '5px' }}>
                                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>{f.name}</span>
                                      <span style={{ fontSize: '1.3rem', fontWeight: '900', color: cat.color }}>{w}勝 {l}敗 {d}分</span>
                                    </div>
                                  </div>
                                );
                              }

                              const monthlyData = Array.from({length: 12}, (_, i: number) => {
                                const mStr = `${analyticsYear}-${String(i+1).padStart(2,'0')}`;
                                return catEvents.filter((e: any) => e.start.startsWith(mStr)).reduce((sum: number, e: any) => {
                                  const dat = e.extendedProps.metadata?.customFields?.[f.id];
                                  if(!dat) return sum;
                                  if(f.type === 'number') return sum + Number(dat);
                                  if(f.type === 'wage') return sum + (dat.calculatedWage !== undefined ? Number(dat.calculatedWage) : (Number(dat.hours) * Number(dat.wage || f.wage || 0)));
                                  if(f.type === 'money') return sum + (dat.type==='income' ? Number(dat.amount) : -Number(dat.amount));
                                  return sum;
                                }, 0);
                              });

                              const maxVal = Math.max(...monthlyData.map(Math.abs), 1);
                              const totalYear = monthlyData.reduce((a: number, b: number) => a+b, 0);
                              const unit = f.type === 'wage' || f.type === 'money' ? '円' : f.unit;

                              return (
                                <div key={f.id} style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid var(--border-color)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '20px' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-sub)' }}>{f.name}</span>
                                    <span style={{ fontSize: '1.3rem', fontWeight: '900', color: cat.color }}>{totalYear.toLocaleString()}<span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginLeft: '4px' }}>{unit}/年</span></span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '120px', gap: '4px', borderBottom: '2px solid var(--border-color)', paddingBottom: '4px' }}>
                                    {monthlyData.map((val: number, idx: number) => (
                                      <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                                        <div style={{ fontSize: '0.55rem', color: 'var(--text-sub)', fontWeight: '900', whiteSpace: 'nowrap', opacity: val !== 0 ? 1 : 0, transition: 'all 0.2s' }}>{val !== 0 ? (val >= 10000 ? Math.floor(val/1000)+'k' : val) : ''}</div>
                                        <div style={{ width: '100%', height: `${(Math.abs(val)/maxVal)*80}px`, background: val >= 0 ? cat.color : '#ef4444', borderRadius: '6px 6px 0 0', minHeight: val !== 0 ? '6px' : '0', transition: 'height 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)', boxShadow: val !== 0 ? `0 4px 10px ${val >= 0 ? cat.color : '#ef4444'}40` : 'none' }} />
                                        <div style={{ fontSize: '0.65rem', color: 'var(--text-sub)', marginTop: '6px', fontWeight: '900' }}>{idx+1}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}
      {/* 📊 収支グラフ（棒グラフ）モーダル */}
      {isFinanceGraphOpen && (() => {
        // 🚨 ここに useState があったら絶対に消してください！🚨
        const currentY = parseInt(currentYear || String(new Date().getFullYear()));
        const currentM = parseInt(currentMonthNum || String(new Date().getMonth() + 1));

        let graphData = [];
        if (graphSpan === 'month') {
          graphData = Array.from({length: 12}, (_, i) => {
            const mStr = `${currentY}-${String(i + 1).padStart(2, '0')}`;
            const targetEvts = events.filter((e: any) => e.start && e.start.startsWith(mStr));
            let inc = 0; let exp = 0;
            targetEvts.forEach((e: any) => {
              const cf = e.extendedProps?.metadata?.customFields || {};
              if (cf.isExpenseSet) exp += Number(cf.standardExpenseAmount || 0);
              if (cf.isIncomeSet) inc += Number(cf.standardIncomeAmount || 0);
            });
            return { label: `${i + 1}月`, inc, exp };
          });
        } else {
          graphData = Array.from({length: 5}, (_, i) => {
            let inc = 0; let exp = 0;
            const targetEvts = events.filter((e: any) => e.start && e.start.startsWith(`${currentY}-${String(currentM).padStart(2, '0')}`));
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

        const maxAmount = Math.max(...graphData.map(d => Math.max(d.inc, d.exp)), 1000);

        return (
          <div className="modal-overlay" onClick={() => setIsFinanceGraphOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', borderRadius: '28px', border: '1px solid var(--glass-border)', padding: '24px', background: 'var(--bg-main)', color: 'var(--text-main)' }}>
              <ModalHeader title="収支推移グラフ" onClose={() => setIsFinanceGraphOpen(false)} />
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <button onClick={() => setGraphSpan('month')} className={graphSpan === 'month' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '10px', fontSize: '0.85rem', borderRadius: '12px' }}>月間推移 ({currentY}年)</button>
                <button onClick={() => setGraphSpan('week')} className={graphSpan === 'week' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '10px', fontSize: '0.85rem', borderRadius: '12px' }}>週間推移 ({currentM}月)</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '16px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10b981' }} /> 収入</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ef4444' }} /> 支出</span>
              </div>

              <div className="hide-scrollbar" style={{ height: '220px', display: 'flex', alignItems: 'flex-end', gap: '12px', overflowX: 'auto', paddingBottom: '8px', borderBottom: '2px solid var(--border-color)' }}>
                {graphData.map((d, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end', minWidth: '40px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '100%' }}>
                      <div style={{ position: 'relative', width: '14px', height: `${(d.inc / maxAmount) * 100}%`, background: '#10b981', borderRadius: '4px 4px 0 0', minHeight: d.inc > 0 ? '4px' : '0', transition: 'all 0.4s' }}>
                        {d.inc > 0 && <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: '#10b981', fontWeight: 'bold' }}>{d.inc >= 10000 ? `${Math.floor(d.inc/1000)}k` : d.inc}</span>}
                      </div>
                      <div style={{ position: 'relative', width: '14px', height: `${(d.exp / maxAmount) * 100}%`, background: '#ef4444', borderRadius: '4px 4px 0 0', minHeight: d.exp > 0 ? '4px' : '0', transition: 'all 0.4s' }}>
                        {d.exp > 0 && <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.55rem', color: '#ef4444', fontWeight: 'bold' }}>{d.exp >= 10000 ? `${Math.floor(d.exp/1000)}k` : d.exp}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 📅 日程調整アシスタント モーダル */}
      {isScheduleAssistantOpen && (
        <div className="modal-overlay" onClick={() => setIsScheduleAssistantOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', borderRadius: '28px', border: '1px solid var(--glass-border)', padding: '24px', background: 'var(--bg-main)', color: 'var(--text-main)', maxHeight: '90vh', overflowY: 'auto' }}>
            <ModalHeader title="日程調整アシスタント" onClose={() => setIsScheduleAssistantOpen(false)} />
            
            <div style={{ display: 'flex', background: 'var(--input-bg)', borderRadius: '16px', padding: '6px', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
              <button onClick={() => setAssistMode('send')} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: assistMode === 'send' ? 'var(--theme)' : 'transparent', color: assistMode === 'send' ? '#fff' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: assistMode === 'send' ? `0 4px 10px var(--theme-shadow)` : 'none' }}>空き時間を送る</button>
              <button onClick={() => setAssistMode('receive')} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: assistMode === 'receive' ? 'var(--theme)' : 'transparent', color: assistMode === 'receive' ? '#fff' : 'var(--text-sub)', fontWeight: 'bold', border: 'none', cursor: 'pointer', transition: 'all 0.2s', boxShadow: assistMode === 'receive' ? `0 4px 10px var(--theme-shadow)` : 'none' }}>日程を受けて返事する</button>
            </div>

            {assistMode === 'send' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">1. 候補日時（カレンダーをドラッグして追加）</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                    {assistTimeSlots.map((slot, i) => (
                      <span key={i} onClick={() => setAssistTimeSlots(assistTimeSlots.filter((_, idx) => idx !== i))} style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '6px 12px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(245,158,11,0.3)' }}>
                        {slot} <span style={{ opacity: 0.6 }}>×</span>
                      </span>
                    ))}
                    {assistTimeSlots.length === 0 && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>カレンダーの空いている枠をタップ・ドラッグして「💬 候補に追加」を押してください。</span>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="date" className="pop-input" style={{ flex: 1 }} id="manual-assist-date" />
                    <button onClick={() => {
                      const el = document.getElementById('manual-assist-date') as HTMLInputElement;
                      if(el && el.value) {
                         const d = new Date(el.value);
                         const slotStr = `${d.getMonth()+1}/${d.getDate()}(${DAY_NAMES[d.getDay()]}) 終日`;
                         if (!assistTimeSlots.includes(slotStr)) setAssistTimeSlots([...assistTimeSlots, slotStr]);
                         el.value = '';
                      }
                    }} className="btn-secondary" style={{ padding: '10px 16px', borderRadius: '12px', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>+ 日付のみ追加</button>
                  </div>
                </div>
                
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    2. 自動生成テキストをコピー
                    <button onClick={() => { navigator.clipboard.writeText(generatedText); alert('コピーしました！LINEなどに貼り付けてください。'); }} style={{ background: 'transparent', color: 'var(--theme)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>📋 コピー</button>
                  </label>
                  <textarea className="pop-input" value={generatedText} onChange={e => setGeneratedText(e.target.value)} rows={8} style={{ fontSize: '0.8rem', lineHeight: '1.5', resize: 'vertical', height: '140px' }} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 'bold', lineHeight: '1.5', margin: '0 0 8px 0' }}>
                    1. 提示された日程をカレンダーで確認する
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="date" className="pop-input" id="check-date-input" style={{ flex: 1 }} />
                    <button onClick={() => {
                        const el = document.getElementById('check-date-input') as HTMLInputElement;
                        if(el && el.value) {
                          setCurrentYear(el.value.split('-')[0]);
                          setCurrentMonthNum(String(Number(el.value.split('-')[1])));
                          setCurrentDayNum(String(Number(el.value.split('-')[2])));
                          calendarRef.current?.getApi().gotoDate(el.value);
                          calendarRef.current?.getApi().changeView('timeGridDay');
                          setIsScheduleAssistantOpen(false); // 閉じてカレンダーへジャンプ
                        }
                    }} className="btn-pop" style={{ padding: '0 16px', borderRadius: '12px', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>確認する</button>
                  </div>
                </div>
                
                <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '16px' }}>
                  <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    2. 返信テキストを作成してコピー
                    <button onClick={() => { navigator.clipboard.writeText(receiveText); alert('コピーしました！'); }} style={{ background: 'transparent', color: 'var(--theme)', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>📋 コピー</button>
                  </label>
                  <textarea className="pop-input" value={receiveText} onChange={e => setReceiveText(e.target.value)} rows={5} placeholder="例：ご連絡ありがとうございます！では、〇月〇日の14:00〜でよろしくお願いいたします。" style={{ fontSize: '0.8rem', lineHeight: '1.5', resize: 'vertical', height: '100px' }} />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={() => setReceiveText("ご連絡ありがとうございます！\nご提示いただいた日程のうち、以下の日時でお願いできますでしょうか。\n\n・〇/〇(曜) 〇:〇〜\n\nよろしくお願いいたします。")} className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.75rem', borderRadius: '8px' }}>✅ OKの返事</button>
                    <button onClick={() => setReceiveText("ご連絡ありがとうございます。\nせっかくご提示いただいたのですが、あいにくその日程は予定が入っておりました。\n\n別の日程（〇/〇など）で再調整していただくことは可能でしょうか？\nよろしくお願いいたします。")} className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.75rem', borderRadius: '8px', color: '#ef4444', borderColor: '#fca5a5' }}>❌ NGの返事</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* 🤝 立替・貸し借り管理 モーダル */}
      {isAdvanceModalOpen && (() => {
        // 未精算のリスト
        const unsettledAdvances = events.flatMap(e => {
          const exps = e.extendedProps?.metadata?.customFields?.expenses || [];
          return exps.map((exp: any) => ({ ...exp, eventId: e.id, eventTitle: e.title, eventDate: e.start.split('T')[0] }));
        }).filter(e => (e.type === 'advance' || e.type === 'borrow') && !e.isSettled);

        // 精算済みのリスト
        const settledAdvances = events.flatMap(e => {
          const exps = e.extendedProps?.metadata?.customFields?.expenses || [];
          return exps.map((exp: any) => ({ ...exp, eventId: e.id, eventTitle: e.title, eventDate: e.start.split('T')[0] }));
        }).filter(e => (e.type === 'advance' || e.type === 'borrow') && e.isSettled);

        return (
          <div className="modal-overlay" onClick={() => setIsAdvanceModalOpen(false)} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '420px', borderRadius: '28px', border: '1px solid var(--glass-border)', padding: '24px', background: 'var(--bg-main)', color: 'var(--text-main)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
              <ModalHeader title="立替・貸し借り管理" onClose={() => setIsAdvanceModalOpen(false)} />
              
              {/* タブ切り替えボタン */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexShrink: 0 }}>
                <button onClick={() => setAdvanceTab('unsettled')} className={advanceTab === 'unsettled' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '10px 4px', fontSize: '0.75rem', borderRadius: '12px' }}>未精算 ({unsettledAdvances.length})</button>
                <button onClick={() => setAdvanceTab('settled')} className={advanceTab === 'settled' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '10px 4px', fontSize: '0.75rem', borderRadius: '12px' }}>精算済 ({settledAdvances.length})</button>
                <button onClick={() => setAdvanceTab('partners')} className={advanceTab === 'partners' ? 'btn-pop' : 'btn-secondary'} style={{ flex: 1, padding: '10px 4px', fontSize: '0.75rem', borderRadius: '12px' }}>相手リスト</button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }} className="hide-scrollbar">
                
                {/* 👇 タブ：未精算 */}
                {advanceTab === 'unsettled' && (
                  unsettledAdvances.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-sub)', fontWeight: 'bold' }}>
                      <Handshake size={40} style={{ margin: '0 auto 12px auto', opacity: 0.5, color: 'var(--theme)' }} />
                      <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>現在、未精算の立替記録はありません。</p>
                      <p style={{ fontSize: '0.75rem', lineHeight: 1.5 }}>※カレンダーの「予定を追加」画面の<br/>「支出・立替を記録する」から<br/>立て替えた金額を登録するとここに表示されます。</p>
                    </div>
                  ) : (
                    unsettledAdvances.map((adv: any, i: number) => (
                      <div key={i} style={{ background: 'var(--card-bg)', padding: '16px', borderRadius: '16px', border: `1px solid var(--border-color)`, borderLeft: `6px solid ${adv.type === 'advance' ? '#ef4444' : '#10b981'}`, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: '900', color: 'var(--text-main)' }}>
                              {adv.payee || '誰か'} に <span style={{ color: adv.type === 'advance' ? '#ef4444' : '#10b981' }}>{adv.type === 'advance' ? '貸し' : '借り'}</span>
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 'bold' }}>{adv.eventDate} ({adv.eventTitle})</span>
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: '900', color: adv.type === 'advance' ? '#ef4444' : '#10b981' }}>
                            ¥{Number(adv.amount).toLocaleString()}
                          </div>
                        </div>
                        <button onClick={async () => {
                            if (confirm(`「${adv.payee || 'この相手'}」との精算を完了しますか？`)) {
                              const targetEvent = events.find((e: any) => e.id === adv.eventId);
                              if (targetEvent) {
                                const updatedExpenses = targetEvent.extendedProps.metadata.customFields.expenses.map((ex: any) => 
                                  ex.id === adv.id ? { ...ex, isSettled: true } : ex
                                );
                                await supabase.from('events').update({
                                  metadata: { ...targetEvent.extendedProps.metadata, customFields: { ...targetEvent.extendedProps.metadata.customFields, expenses: updatedExpenses } }
                                }).eq('id', adv.eventId);
                                
                                const today = toLocalYYYYMMDD(new Date());
                                await supabase.from('events').insert([{
                                  title: `✅ ${adv.payee || '相手'} との立替精算`, category: '収支記録',
                                  start_at: new Date(`${today}T12:00:00`).toISOString(), end_at: new Date(`${today}T13:00:00`).toISOString(),
                                  metadata: {
                                    isAllDayBackground: true, isPureFinance: true, customColor: '#10b981',
                                    customFields: {
                                      isIncomeSet: adv.type === 'advance', standardIncomeAmount: adv.type === 'advance' ? adv.amount : '',
                                      isExpenseSet: adv.type === 'borrow', standardExpenseAmount: adv.type === 'borrow' ? adv.amount : '',
                                      paymentMethod: 'cash'
                                    }
                                  }
                                }]);
                                alert('精算を完了として記録しました！');
                                window.location.reload(); 
                              }
                            }
                          }}
                          className="btn-pop" style={{ width: '100%', padding: '10px', fontSize: '0.85rem', borderRadius: '12px', background: 'var(--theme)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <CheckCircle size={16} /> 精算を完了する
                        </button>
                      </div>
                    ))
                  )
                )}

                {/* 👇 タブ：精算済履歴 */}
                {advanceTab === 'settled' && (
                  settledAdvances.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-sub)', fontWeight: 'bold', fontSize: '0.85rem' }}>精算済みの記録はありません</div>
                  ) : (
                    settledAdvances.map((adv: any, i: number) => (
                      <div key={i} style={{ background: 'var(--input-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-sub)', textDecoration: 'line-through' }}>
                            {adv.payee || '誰か'} に {adv.type === 'advance' ? '貸し' : '借り'}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)' }}>{adv.eventDate} ({adv.eventTitle})</span>
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>
                          ¥{Number(adv.amount).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )
                )}

                {/* 👇 タブ：相手リスト管理 */}
                {advanceTab === 'partners' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" className="pop-input" placeholder="よく立て替える相手の名前を追加" value={newPayeeName} onChange={e => setNewPayeeName(e.target.value)} style={{ flex: 1, fontSize: '0.85rem' }} />
                      <button onClick={() => {
                        if (newPayeeName.trim() && !customPayees.includes(newPayeeName.trim())) {
                          setCustomPayees([...customPayees, newPayeeName.trim()]);
                          setNewPayeeName('');
                        }
                      }} className="btn-pop" style={{ padding: '0 16px', borderRadius: '12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>追加</button>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-sub)', marginBottom: '4px' }}>登録済みの相手リスト</span>
                      {customPayees.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-sub)', fontSize: '0.8rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>登録されている相手はいません</div>
                      ) : (
                        customPayees.map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '0.9rem' }}>{p}</span>
                            <button onClick={() => setCustomPayees(customPayees.filter(name => name !== p))} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      </div>
  );
}
