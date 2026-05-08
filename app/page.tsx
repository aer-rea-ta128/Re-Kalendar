'use client';

import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { supabase } from '@/lib/supabase';
import {
  Train, Footprints, MapPin, Clock, Star, Inbox, Settings, Trash2, TrendingUp, Target,
  History, PieChart, Image as ImageIcon, Repeat, Pin, Database, Palette, Gift, Calendar as CalendarIcon, Zap,
  Home, Edit3, Flag, Monitor, Dumbbell, Beer, Circle, Search, Calendar, Plane, Bus, FileText, Sun, Moon, CreditCard, Check, CheckCircle, Banknote, BookOpen, Users, Download, Share2, Sparkles, Unlock, Lock, Globe, Store
} from 'lucide-react';

// ★ 分割したファイルを読み込む（パスは画像の設定に合わせています）
import { DAY_NAMES, HOURS, MINUTES, INITIAL_PRESETS, VIEW_OPTIONS, FIELD_TYPES } from '@/app/lib/constants';
import { hexToRgba, toLocalYYYYMMDD } from '@/app/lib/utils';
import CategoryStudio from '@/app/components/CategoryStudio';
import Sidebar from '@/app/components/Sidebar';

// アイコンを取得するヘルパー関数
const getSmartIcon = (type: string, color: string) => {
  const props = { size: 14, strokeWidth: 2.5, style: { color } };
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

  // --- 状態管理 ---
  const loadData = (key: string, defaultData: any) => {
    if (typeof window === 'undefined') return defaultData;
    const saved = localStorage.getItem(key);
    try { return saved ? JSON.parse(saved) : defaultData; } catch (e) { return defaultData; }
  };

  const [themeColor, setThemeColor] = useState('#4D96FF');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
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

  const [openSections, setOpenSections] = useState<string[]>(['settings', 'countdown']);
  const [nickname, setNickname] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [overlapMode, setOverlapMode] = useState('compact');
  const [isDayPickerOpen, setIsDayPickerOpen] = useState(false);

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<string[]>([]);

  const [events, setEvents] = useState<any[]>([]);
  const DEFAULT_CATEGORIES = [
    { name: '仕事', color: '#4D96FF', fields: [] },
    { name: '飲み', color: '#FF6B6B', fields: [{ id: 'f1', name: '飲んだ杯数', type: 'number', unit: '杯' }] },
    { name: '趣味', color: '#1DD1A1', fields: [] }
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
  const [analyticsYear, setAnalyticsYear] = useState('');
  const [analyticsMonth, setAnalyticsMonth] = useState('');
  const [visibleDashboardFields, setVisibleDashboardFields] = useState<Record<string, boolean>>({});

  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<'create' | 'detail' | 'dayOfWeekBulk' | 'routine_detail'>('create');
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

  useEffect(() => { const saved = localStorage.getItem('quickTemplates'); if (saved) setQuickTemplates(JSON.parse(saved)); }, []);

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
    localStorage.setItem('os_userColors', JSON.stringify(userColors));
    localStorage.setItem('os_anniversaries', JSON.stringify(anniversaries));
    localStorage.setItem('os_routines', JSON.stringify(monthlyRoutines));
    localStorage.setItem('os_home', JSON.stringify(homeLocation));
    localStorage.setItem('os_station', JSON.stringify(nearestStation));
    localStorage.setItem('os_walkTime', JSON.stringify(walkTime));
    localStorage.setItem('os_startPointType', JSON.stringify(startPointType));
  }, [categories, userColors, anniversaries, monthlyRoutines, homeLocation, nearestStation, walkTime, startPointType, isDataLoaded]);

  const activePresets: string[] = [...INITIAL_PRESETS, ...userColors];

  useEffect(() => {
    if (currentSearchIndex >= 0) {
      const el = document.getElementById(`search-item-${currentSearchIndex}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentSearchIndex]);

  const fetchEvents = async () => {
    const { data } = await supabase.from('events').select('*');
    if (data) {
      setEvents(data.map((e: any) => {
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
            isBackground ? 'solid-allday-event' : ''
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

  const handleDelete = async () => {
    if (confirm('本当に削除しますか？')) {
      await supabase.from('events').delete().eq('id', selectedId);
      setIsModalOpen(false);
      fetchEvents();
    }
  };

  const handleDuplicate = () => {
    setMode('create');
    setSelectedId(null);
    setSelectedDays([]);
    alert('内容をコピーしました。日付や時間を調整して保存してください。');
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
          isExpenseSet: !isIncome,
          standardExpenseAmount: !isIncome ? String(totalAmount) : ''
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

  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    let startRelativeX = touchStartX.current;
    const container = document.querySelector('.fixed-mobile-frame');
    if (container) startRelativeX = touchStartX.current - container.getBoundingClientRect().left;

    if (diff > 50) calendarRef.current?.getApi().next();
    else if (diff < -50) {
      if (startRelativeX < 50) setIsSidebarOpen(true);
      else calendarRef.current?.getApi().prev();
    }
    touchStartX.current = null; touchEndX.current = null;
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

  const handleSelect = (info: any) => {
    if (isDeleteMode) return;
    setMode('create'); setStartDate(toLocalYYYYMMDD(info.start));
    const adjEnd = new Date(info.end); if (info.allDay) adjEnd.setDate(adjEnd.getDate() - 1); setEndDate(toLocalYYYYMMDD(adjEnd));
    setTitle(''); setLocation(''); setIsGathering(false); setGatheringTime(''); setDepartureTime(''); setDepartureType(startPointType === 'station' ? 'train' : 'home'); setSelectedDays([]);
    if (info.allDay) {
      const nowH = new Date().getHours(); setStartH(String(nowH).padStart(2, '0')); setStartM('00'); setEndH(String(Math.min(nowH + 1, 23)).padStart(2, '0')); setEndM('00');
    } else {
      const s = info.start as Date; const e = info.end || new Date(s.getTime() + 60 * 60 * 1000);
      setStartH(String(s.getHours()).padStart(2, '0')); setStartM(String(s.getMinutes()).padStart(2, '0')); setEndH(String(e.getHours()).padStart(2, '0')); setEndM(String(e.getMinutes()).padStart(2, '0'));
    }
    setIsStocked(false);
    setIsAllDayBackground(info.allDay || viewType === 'dayGridMonth');
    setRepeatUntil(toLocalYYYYMMDD(new Date(adjEnd.getFullYear(), adjEnd.getMonth() + 1, 0))); setIsModalOpen(true);
  };

  const handleEventClick = (info: any) => {
    const { event } = info;

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
    if (!startDate) return;
    const getISO = (d: string, h: string, m: string) => new Date(`${d}T${h}:${m}:00`).toISOString();

    const actualStartH = isAllDayBackground ? '00' : startH;
    const actualStartM = isAllDayBackground ? '00' : startM;
    const actualEndH = isAllDayBackground ? '23' : (isMilestone ? startH : endH);
    const actualEndM = isAllDayBackground ? '59' : (isMilestone ? startM : endM);
    const actualEndDate = isAllDayBackground ? endDate : (isMilestone ? startDate : endDate);

    const newCustomFields = { ...customFieldsData };
    const catObj = categories.find((c: any) => c.name === categoryName);
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

        let totalWage = 0;
        let actualWorkCount = 0;
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

    const metadata = {
      location, isGathering, gatheringTime, departureTime, departureType, walkTime,
      customColor: eventColor || undefined, isOutline, customFields: newCustomFields,
      photoUrls, isMilestone, memo, rating, isPinned, isStocked, isAllDayBackground,
      startDateStr: startDate, endDateStr: endDate
    };

    if (mode === 'dayOfWeekBulk' && bulkStartMonth && bulkEndMonth && selectedDays.length > 0) {
      const bulkEvents = [];
      const [sYear, sMonth] = bulkStartMonth.split('-');
      const startDateObj = new Date(Number(sYear), Number(sMonth) - 1, 1);
      const [eYear, eMonth] = bulkEndMonth.split('-');
      const endDateObj = new Date(Number(eYear), Number(eMonth), 0, 23, 59, 59);

      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        if (d.getDay() === selectedDays[0]) {
          const ds = toLocalYYYYMMDD(d);
          bulkEvents.push({ title, category: categoryName, start_at: getISO(ds, actualStartH, actualStartM), end_at: getISO(ds, actualEndH, actualEndM), metadata });
        }
      }
      if (bulkEvents.length > 0) await supabase.from('events').insert(bulkEvents);
      else alert('指定期間に該当する曜日がありませんでした');
    }
    else if (mode === 'create' && selectedDays.length > 0 && repeatUntil) {
      const endLimit = new Date(repeatUntil);
      const bulkEvents = [];
      for (let d = new Date(startDate); d <= endLimit; d.setDate(d.getDate() + 1)) {
        if (selectedDays.includes(d.getDay())) {
          bulkEvents.push({ title, category: categoryName, start_at: getISO(toLocalYYYYMMDD(d), actualStartH, actualStartM), end_at: getISO(toLocalYYYYMMDD(d), actualEndH, actualEndM), metadata });
        }
      }
      await supabase.from('events').insert(bulkEvents);
    }
    else {
      const payload = { title, category: categoryName, start_at: getISO(startDate, actualStartH, actualStartM), end_at: getISO(actualEndDate, actualEndH, actualEndM), metadata };
      if (mode === 'create') {
        await supabase.from('events').insert([payload]);
      } else {
        await supabase.from('events').update(payload).eq('id', selectedId);
      }
    }

    setIsModalOpen(false);
    fetchEvents();
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

    if (extendedProps.category === '収支記録' || extendedProps.category === 'ルーティン達成') {
      return <div style={{ display: 'none' }}></div>;
    }

    if (extendedProps.isTransitEvent) {
      if (viewType === 'dayGridMonth') return <div style={{display: 'none'}}></div>;

      const sH = String(start.getHours()).padStart(2, '0');
      const sM = String(start.getMinutes()).padStart(2, '0');
      const eH = end ? String(end.getHours()).padStart(2, '0') : '';
      const eM = end ? String(end.getMinutes()).padStart(2, '0') : '';
      const tType = metadata.customFields?.transitType;

      return (
        <div style={{
          width: '100%', height: '100%', padding: '4px',
          background: `linear-gradient(135deg, ${hexToRgba(cColor, 0.05)} 0%, ${hexToRgba(cColor, 0.15)} 100%)`,
          borderLeft: `4px solid ${cColor}`, borderRadius: '4px',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', boxSizing: 'border-box',
          border: `1px dashed ${cColor}`
        }}>
          <span style={{ fontSize: '0.55rem', fontWeight: '900', color: cColor }}>{sH}:{sM} - {eH}:{eM}</span>
          <div style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {tType === 'plane' ? <Plane size={12} /> : tType === 'bus' ? <Bus size={12} /> : <Train size={12} />}
            <span>移動</span>
          </div>
        </div>
      );
    }

    const displayTitle = (event.title || '').replace('📌 ', '').replace(' 📷', '');
    const charCount = displayTitle.length || 1;
    const hasPhoto = metadata.photoUrls && metadata.photoUrls.length > 0;
    const actualStart = extendedProps.originalStart ? new Date(extendedProps.originalStart) : start;
    const durationMin = (end && actualStart) ? (end.getTime() - actualStart.getTime()) / 60000 : 60;

    let startTimeOnly = '';
    let endTimeOnly = '';
    if (actualStart) {
      startTimeOnly = `${String(actualStart.getHours()).padStart(2, '0')}:${String(actualStart.getMinutes()).padStart(2, '0')}`;
      if (end) endTimeOnly = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
    }

    const isHighlighted = searchResults.length > 0 && event.id === String(searchResults[currentSearchIndex]?.id);
    const isSelectedForDelete = isDeleteMode && selectedForDelete.includes(event.id);
    const highlightClass = isHighlighted ? 'highlighted-event' : (isSelectedForDelete ? 'delete-selected-event' : '');

    const depTime = metadata.departureTime;
    const isGatheringSet = metadata.isGathering && depTime;
    const DepartureBadge = isGatheringSet ? (
      <div style={{
        position: 'absolute', top: '-1px', left: '4px', zIndex: 50,
        background: '#fff', border: `1.5px solid ${cColor}`, borderRadius: '4px',
        padding: '0px 4px', display: 'flex', alignItems: 'center', gap: '2px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transform: 'translateY(-50%)'
      }}>
        {startPointType === 'address' ? <Home size={10} style={{color: cColor}} /> : <Train size={10} style={{color: cColor}} />}
        <span style={{ fontSize: '0.6rem', fontWeight: '900', color: '#000' }}>{depTime} 出発</span>
      </div>
    ) : null;

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

      if (displayMode === 'dot') {
        return (
          <div className={highlightClass} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '24px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: cColor, boxShadow: `0 2px 4px ${cColor}60` }} />
          </div>
        );
      }

      if (isAnniversary) {
        return (
          <div className={highlightClass} style={{
            display: 'flex', alignItems: 'center', padding: '2px 6px', overflow: 'hidden', width: '100%', height: '26px',
            backgroundColor: hexToRgba(cColor, 0.1), border: `1px solid ${hexToRgba(cColor, 0.3)}`, borderRadius: '6px', boxSizing: 'border-box', marginBottom: '2px',
            boxShadow: `inset 0 0 8px ${hexToRgba(cColor, 0.05)}`
          }}>
            <Gift size={12} style={{ color: cColor, marginRight: '4px', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: '900', fontSize: '0.75rem', color: cColor }}>{displayTitle}</span>
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
      return (
        <div className={highlightClass} style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 4px', overflow: 'hidden', width: '100%', height: '28px',
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
              {hasPhoto && <ImageIcon size={10} style={{ marginRight: '2px', display: 'inline-block' }} />}
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
        <div className={`${highlightClass} smart-event-container ${!isNarrow ? 'force-full-width' : ''}`} style={{
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
            transform: hasLocationRight ? 'translateX(-2px)' : 'none',
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
                  {hasPhoto && <img src={metadata.photoUrls[0]} style={{ width: '12px', height: '12px', borderRadius: '3px', objectFit: 'cover', display: 'block', marginBottom: '2px' }} />}
                  {finalDisplayTitle}
                </span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', flexDirection: 'row', gap: '2px', justifyContent: 'center' }}>
                  {metadata.isPinned && <Pin size={10} style={{ flexShrink: 0, transform: 'rotate(45deg)' }} />}
                  {hasPhoto && <img src={metadata.photoUrls[0]} style={{ width: '12px', height: '12px', borderRadius: '3px', objectFit: 'cover' }} />}
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
      let dateObj = new Date(currentY, m - 1, r.day);
      if (r.adjust === 'prev') {
        while (dateObj.getDay() === 0 || dateObj.getDay() === 6 || holidays[toLocalYYYYMMDD(dateObj)]) {
          dateObj.setDate(dateObj.getDate() - 1);
        }
      } else if (r.adjust === 'next') {
        while (dateObj.getDay() === 0 || dateObj.getDay() === 6 || holidays[toLocalYYYYMMDD(dateObj)]) {
          dateObj.setDate(dateObj.getDate() + 1);
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

  const now = new Date();
  const displayEvents = [...events, ...anniversaryEvents, ...routineEvents].flatMap((e: any) => {
    let priority = 0;
    const isPast = new Date(e.start) < now;
    const hasPhoto = e.extendedProps?.metadata?.photoUrls && e.extendedProps.metadata.photoUrls.length > 0;
    const hasCustomFields = e.extendedProps?.metadata?.customFields && Object.keys(e.extendedProps.metadata.customFields).length > 0;
    if (isPast && (hasPhoto || hasCustomFields)) priority = 1;

    let overrideStart = e.start;
    const metadata = e.extendedProps?.metadata || {};
    if (metadata.isGathering && metadata.departureTime) {
      const d = new Date(e.start);
      const [h, m] = metadata.departureTime.split(':');
      d.setHours(Number(h), Number(m), 0, 0);
      if (d.getTime() < new Date(e.start).getTime()) {
        overrideStart = d.toISOString();
      }
    }

    const mainEvent = { ...e, start: overrideStart, extendedProps: { ...e.extendedProps, originalStart: e.extendedProps?.originalStart || e.start }, customOrder: priority };
    const results = [mainEvent];

    if (metadata.customFields?.isTransit && metadata.customFields.transitDepTime && metadata.customFields.transitArrTime) {
      const sDate = new Date(e.start);
      const [dh, dm] = metadata.customFields.transitDepTime.split(':');
      const [ah, am] = metadata.customFields.transitArrTime.split(':');

      const tStart = new Date(sDate); tStart.setHours(Number(dh), Number(dm), 0, 0);
      const tEnd = new Date(sDate); tEnd.setHours(Number(ah), Number(am), 0, 0);
      if (tEnd < tStart) tEnd.setDate(tEnd.getDate() + 1);

      const tType = metadata.customFields.transitType;
      const icon = tType === 'plane' ? 'Plane' : tType === 'bus' ? 'Bus' : 'Train';
      const cColor = e.extendedProps?.cColor || e.backgroundColor || '#94a3b8';

      results.push({
        id: `${e.id}-transit`,
        title: `${icon} 移動`,
        start: tStart.toISOString(),
        end: tEnd.toISOString(),
        allDay: false,
        backgroundColor: hexToRgba(cColor, 0.15),
        borderColor: cColor,
        display: 'block',
        extendedProps: {
          category: '交通機関',
          isTransitEvent: true,
          cColor: cColor,
          metadata: { isTransitBlock: true }
        }
      });
    }

    return results;
  }).filter((e: any) => {
    if (e.extendedProps?.metadata?.isStocked) return false;
    if (viewFilter !== 'すべて' && e.extendedProps.category !== viewFilter && !e.extendedProps.isTransitEvent) return false;
    if (displayMode === 'photo') {
      const hasPhoto = e.extendedProps.metadata?.photoUrls && e.extendedProps.metadata.photoUrls.length > 0;
      if (!hasPhoto) return false;
    }
    return true;
  });

  const currentCategoryObj = categories.find((c: any) => c.name === categoryName);
  const currentMonthStr = `${currentYear}-${currentMonthNum.padStart(2, '0')}`;
  const currentMonthEvents = displayEvents.filter((e: any) => e.start && e.start.startsWith(currentMonthStr) && !e.extendedProps.isAnniversary);
  const currentYearEvents = displayEvents.filter((e: any) => e.start && e.start.startsWith(currentYear));

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  if (!isMounted || !isDataLoaded) return <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }} />;

  function openAnalyticsModal() {
    throw new Error('Function not implemented.');
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', background: 'var(--bg-main)' }}>
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

        .fc-theme-standard td, .fc-theme-standard th { border-color: var(--theme-border) !important; transition: border-color 0.3s; }

        * { box-sizing: border-box; }
        body, .fixed-mobile-frame, .fc {
          color: var(--text-main);
          font-family: var(--app-font) !important;
        }

        .fixed-mobile-frame {
          width: 100%; max-width: 460px; height: 100vh;
          background-color: transparent;
          display: flex; flex-direction: column; position: relative; overflow: hidden;
        }

        .fc-event-main, .fc-v-event .fc-event-main { padding: 0 !important; color: inherit; }
        .fc-timegrid-allday { min-height: 48px !important; height: 48px !important; }
        .fc-timegrid-allday-cushion { display: none !important; }
        .fc-timegrid-axis-cushion { font-size: 0.65rem !important; padding: 4px !important; }
        .fc-timeGridWeek-view .fc-daygrid-day-events,
        .fc-timeGridDay-view .fc-daygrid-day-events { margin: 0 !important; min-height: 0 !important; }
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
        .fc-theme-standard td, .fc-theme-standard th { border-color: var(--border-color) !important; }
        .fc-scrollgrid { border-color: transparent !important; }
        .fc-col-header-cell { background-color: var(--glass-bg) !important; border-bottom: 2px solid var(--theme) !important; backdrop-filter: blur(5px); }
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

        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); backdrop-filter: blur(8px); z-index: 1000; display: flex; justify-content: center; align-items: center; padding: 15px; animation: fadeIn 0.3s ease-out; }
        .modal-content { width: 100%; max-width: 420px; border-radius: 28px; border: 1px solid var(--glass-border); overflow-y: auto; max-height: 90vh; animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); background: var(--bg-main); color: var(--text-main); }

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
      `}</style>

      <div className="fixed-mobile-frame">
        <header className="glass-panel" style={{ position: 'relative', padding: '10px 12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1001, pointerEvents: 'auto', borderRadius: '0 0 20px 20px', minHeight: '60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10, flexShrink: 0 }}>
            <button onClick={() => { setOpenSections([]); setIsSidebarOpen(true); }} className="btn-icon">☰</button>
            <button
              onClick={() => {
                const today = toLocalYYYYMMDD(new Date()); const nowH = new Date().getHours();
                setMode('create'); setStartDate(today); setEndDate(today);
                setStartH(String(nowH).padStart(2, '0')); setEndH(String(Math.min(nowH + 1, 23)).padStart(2, '0'));
                setTitle(''); setLocation(''); setMemo(''); setPhotoUrls([]); setIsStocked(false); setIsModalOpen(true);
              }}
              className="btn-icon"
              style={{ border: `2px solid ${themeColor}`, color: themeColor, fontSize: '1.4rem', fontWeight: 'bold', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, paddingBottom: '2px' }}
            >
              +
            </button>
            {viewType === 'dayGridMonth' && (
              <button
                onClick={() => setDisplayMode(m => m === 'normal' ? 'photo' : m === 'photo' ? 'dot' : 'normal')}
                className="btn-icon"
                style={{ background: 'var(--card-bg)', color: 'var(--text-main)', borderColor: 'var(--border-color)' }}
              >
                {displayMode === 'normal' && <Edit3 size={18} />}
                {displayMode === 'photo' && <ImageIcon size={18} />}
                {displayMode === 'dot' && <Circle size={14} fill="currentColor" />}
              </button>
            )}
          </div>

          <div className="date-picker-btn" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', gap: '4px', zIndex: 10, minWidth: '120px' }}>
            <button onClick={(e) => { e.stopPropagation(); calendarRef.current?.getApi().prev(); const d = calendarRef.current?.getApi().getDate(); if(d) { setCurrentYear(String(d.getFullYear())); setCurrentMonthNum(String(d.getMonth() + 1)); } }} style={{ border: 'none', background: 'transparent', color: themeColor, fontWeight: '900', fontSize: '1rem', cursor: 'pointer', padding: '2px 4px' }}>◀</button>
            <div onClick={() => { setPickerYear(parseInt(currentYear || String(new Date().getFullYear()))); setIsDatePickerOpen(true); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, cursor: 'pointer' }}>
              <span style={{ fontSize: '0.6rem', color: themeColor, fontWeight: '900', opacity: 0.8, marginBottom: '-2px' }}>{currentYear}年</span>
              <div style={{ fontSize: '1.1rem', color: themeColor, fontWeight: '900', letterSpacing: '-0.5px' }}>{currentMonthNum}月</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); calendarRef.current?.getApi().next(); const d = calendarRef.current?.getApi().getDate(); if(d) { setCurrentYear(String(d.getFullYear())); setCurrentMonthNum(String(d.getMonth() + 1)); } }} style={{ border: 'none', background: 'transparent', color: themeColor, fontWeight: '900', fontSize: '1rem', cursor: 'pointer', padding: '2px 4px' }}>▶</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', zIndex: 10, justifyContent: 'flex-end', width: '130px', flexShrink: 0, height: '38px' }}>
            {!isViewSelectorOpen && <button onClick={handleToday} className="btn-secondary" style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '10px', marginRight: '6px' }}>今日</button>}
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: isViewSelectorOpen ? 'var(--border-color)' : 'transparent', borderRadius: '12px', transition: 'all 0.3s', padding: isViewSelectorOpen ? '4px' : '0', border: isViewSelectorOpen ? '1px solid var(--border-color)' : 'none' }}>
              {!isViewSelectorOpen ? (
                <button onClick={() => setIsViewSelectorOpen(true)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '12px' }}>
                  {VIEW_OPTIONS.find(v => v.id === viewType)?.label}
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '4px', flexDirection: 'row' }}>
                  {VIEW_OPTIONS.map((v: any) => (
                    <button key={v.id} onClick={() => { calendarRef.current?.getApi().changeView(v.id); setIsViewSelectorOpen(false); }} style={{ background: viewType === v.id ? themeColor : 'transparent', color: viewType === v.id ? '#fff' : 'var(--text-main)', border: 'none', borderRadius: '8px', padding: '6px 10px', fontSize: '0.75rem', fontWeight: '900', cursor: 'pointer', transition: 'all 0.2s ease' }}>{v.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {isSearchMode && (
          <div className="glass-panel" style={{ margin: '8px', padding: '12px', borderRadius: '16px', display: 'flex', gap: '8px', zIndex: 15, animation: 'fadeInDown 0.3s ease-out' }}>
            <input type="text" className="pop-input" placeholder="タイトル・場所・メモ..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchExecute()} style={{ padding: '10px 14px', flex: 1, fontSize: '0.9rem' }} autoFocus />
            <button onClick={handleSearchExecute} className="btn-pop" style={{ padding: '0 16px', fontSize: '0.85rem' }}>検索</button>
          </div>
        )}

        <div style={{ flex: 1, position: 'relative', padding: '6px' }} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          <div className="glass-panel" style={{ position: 'absolute', top: '6px', left: '6px', right: '6px', bottom: '6px', padding: '4px', borderRadius: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <FullCalendar
              key={displayMode + overlapMode}
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              slotEventOverlap={overlapMode === 'cascade'}
              droppable={true}
              drop={async (info) => {
                const cat = info.draggedEl.getAttribute('data-cat') || '仕事';
                const color = info.draggedEl.getAttribute('data-color') || themeColor;
                const payload = {
                  title: info.draggedEl.innerText,
                  category: cat,
                  start_at: new Date(`${info.dateStr}T09:00:00`).toISOString(),
                  end_at: new Date(`${info.dateStr}T10:00:00`).toISOString(),
                  metadata: { customColor: color }
                };
                await supabase.from('events').insert([payload]);
                fetchEvents();
              }}
              nowIndicator={true} allDaySlot={true} fixedWeekCount={true} height="100%" dayMaxEvents={true}
              moreLinkContent={(args: any) => `+他${args.num}件`} headerToolbar={false} events={displayEvents} selectable={true} select={handleSelect} eventClick={handleEventClick}
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
                    <div style={{cursor: 'pointer', padding: '4px 0', width: '100%', transition: 'background 0.2s', borderRadius: '4px'}} className={`hover-bg-glass ${colorClass}`}>
                       {dayStr}
                    </div>
                  );
                }
                const m = d.getMonth() + 1; const dt = d.getDate();
                const colorClass = isRed ? 'holiday-text' : (d.getDay() === 6 ? 'saturday-text' : '');
                const isFirstOrOtherMonth = m !== Number(currentMonthNum) || dt === 1;
                return (
                  <div
                    onClick={() => arg.view.type === 'timeGridDay' && setIsDayPickerOpen(true)}
                    style={{cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1, padding: '4px 0', width: '100%', borderRadius: '4px'}}
                    className={`hover-bg-glass ${colorClass}`}
                  >
                    <span style={{fontSize: isFirstOrOtherMonth ? '0.95rem' : '1.1rem', fontWeight: 900}}>{isFirstOrOtherMonth ? m+'/'+dt : dt}</span>
                    <span style={{fontSize: '0.7rem', marginTop: '2px'}}>({dayStr})</span>
                  </div>
                );
              }}
              dayCellContent={(arg: any) => arg.view.type === 'dayGridMonth' ? arg.date.getDate().toString() : ''}
              datesSet={(arg: any) => {
                setViewType(arg.view.type); const d = arg.view.currentStart;
                let y = d.getFullYear(), m = d.getMonth() + 1;
                if (arg.view.type === 'timeGridWeek') {
                  const midWeek = new Date(d); midWeek.setDate(midWeek.getDate() + 3);
                  y = midWeek.getFullYear(); m = midWeek.getMonth() + 1;
                }
                setCurrentYear(String(y)); setCurrentMonthNum(String(m));
              }}
              dayCellClassNames={(arg: any) => {
                if (arg.date.getDay() === 0 || holidays[toLocalYYYYMMDD(arg.date)]) return ['holiday-cell'];
                if (arg.date.getDay() === 6) return ['saturday-cell']; return [];
              }}
              locale="ja"
            />
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
        />

        {/* ギャラリー */}
        {isGalleryOpen && (
          <div className="modal-overlay" onClick={() => setIsGalleryOpen(false)}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
              <ModalHeader title="思い出ギャラリー" onClose={() => setIsGalleryOpen(false)} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px', maxHeight: '65vh', overflowY: 'auto', paddingRight: '5px' }} className="hide-scrollbar">
                {events.filter((e: any) => e.extendedProps?.metadata?.photoUrls && e.extendedProps.metadata.photoUrls.length > 0).sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime()).flatMap((e: any) =>
                  e.extendedProps.metadata.photoUrls.map((url: string, index: number) => (
                    <div key={`${e.id}-${index}`} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', backgroundColor: 'var(--input-bg)', border: '1px solid var(--border-color)', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                        <img src={url} alt="memory" onClick={() => { setIsGalleryOpen(false); handleEventClick({event: e}); }} style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer', transition: 'transform 0.3s' }} onMouseOver={ev => ev.currentTarget.style.transform = 'scale(1.05)'} onMouseOut={ev => ev.currentTarget.style.transform = 'scale(1)'} />
                      </div>
                      {index === 0 && <span style={{ fontSize: '0.7rem', fontWeight: '900', color: 'var(--text-sub)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'center' }}>{e.start.split('T')[0]}</span>}
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

        {/* 予定入力・編集モーダル */}
        {isModalOpen && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ padding: '24px' }}>
              <ModalHeader
                title={mode === 'create' ? '予定を追加' : mode === 'dayOfWeekBulk' ? '曜日一括追加' : mode === 'routine_detail' ? 'ルーティンの確認' : '予定を編集'}
                onClose={() => setIsModalOpen(false)}
                rightEl={mode === 'detail' ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={handleDuplicate} className="btn-secondary" style={{ padding: '8px 12px', fontSize: '0.8rem' }}>複製</button>
                    <button onClick={handleDelete} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '900' }}>削除</button>
                  </div>
                ) : null}
              />

              {mode === 'routine_detail' ? (
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
                    const showRecords = mode === 'detail' && currentCategoryObj?.fields && currentCategoryObj.fields.length > 0;

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
                          <select value={h} onChange={e => setH(e.target.value)} style={{ flex: 1, appearance: 'none', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 4px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', textAlign: 'center', outline: 'none' }}>
                            {HOURS.map((x:string) => <option key={x} value={x}>{x}</option>)}
                          </select>
                          <span style={{ fontWeight: 'bold', color: 'var(--text-sub)' }}>:</span>
                          <select value={m} onChange={e => setM(e.target.value)} style={{ flex: 1, appearance: 'none', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 4px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)', textAlign: 'center', outline: 'none' }}>
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
                              onClick={() => { setTitle(t.title); setStartH(t.startH); setStartM(t.startM); setEndH(t.endH); setEndM(t.endM); setCategoryName(t.categoryName); setIsAllDayBackground(t.isAllDayBackground); setEventColor(t.eventColor || ''); }}
                              style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', borderRadius: '8px', border: '1px solid var(--border-color)', padding: '8px 14px', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
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
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <FuturisticDateInput label="開始日" value={startDate} onChange={(e: any) => setStartDate(e.target.value)} />
                          <FuturisticTimeInput label="開始時刻" h={startH} m={startM} setH={handleStartHChange} setM={handleStartMChange} />
                        </div>
                        {!isMilestone && !isAllDayBackground && (
                          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
                            <FuturisticDateInput label="終了日" value={endDate} onChange={(e: any) => setEndDate(e.target.value)} />
                            <FuturisticTimeInput label="終了時刻" h={endH} m={endM} setH={(val:any) => setEndH(val)} setM={(val:any) => setEndM(val)} />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                          <label className="checkbox-label" style={{ fontSize: '0.75rem', minHeight: 'auto' }}>
                            <input type="checkbox" checked={isAllDayBackground} onChange={e => setIsAllDayBackground(e.target.checked)} /> 1日単位
                          </label>
                          <label className="checkbox-label" style={{ fontSize: '0.75rem', minHeight: 'auto' }}>
                            <input type="checkbox" checked={isMilestone} onChange={e => setIsMilestone(e.target.checked)} /> 時刻のみ表示
                          </label>
                        </div>
                      </div>
                    );

                    const BlockLocationAndGathering = (
                      <div key="loc_gathering" style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label className="form-label">場所</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input type="text" className="pop-input" style={{ flex: 1 }} value={location} onChange={e => setLocation(e.target.value)} placeholder="目的地を入力" />
                            {location && (
                              <button
                                onClick={() => {
                                  const origin = startPointType === 'address' ? homeLocation : nearestStation;
                                  window.open(`https://www.google.com/maps/dir/?api=1&origin=$?q=${encodeURIComponent(origin)}&destination=${encodeURIComponent(location)}&travelmode=transit`, '_blank');
                                }}
                                className="btn-icon"
                                style={{ width: '46px', height: '46px', borderRadius: '12px', border: `2px solid var(--theme)`, color: 'var(--theme)', flexShrink: 0 }}
                              >
                                <MapPin size={20} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="card-box" style={{ margin: 0, padding: '16px', background: customFieldsData.isExpenseSet ? 'var(--input-bg)' : 'transparent', borderStyle: customFieldsData.isExpenseSet ? 'solid' : 'dashed' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={customFieldsData.isExpenseSet || false} onChange={e => handleCustomFieldChange('isExpenseSet', e.target.checked)} />
                            <CreditCard size={16} style={{ color: 'var(--theme)' }} /> 支出を記録する
                          </label>
                          {customFieldsData.isExpenseSet && (
                            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <select className="pop-input" style={{ flex: 1, fontSize: '0.85rem', padding: '0 8px', height: '40px' }} value={customFieldsData.expenseCategory || categoryName || ''} onChange={e => handleCustomFieldChange('expenseCategory', e.target.value)}>
                                <option value="">ジャンル未設定</option>
                                {categories.map((c: any) => <option key={c.name} value={c.name}>{c.name}</option>)}
                              </select>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                                <input type="number" className="pop-input" style={{ flex: 1, textAlign: 'right', fontSize: '1.2rem', fontWeight: 'bold', color: '#ef4444', padding: '0 8px', height: '40px' }} placeholder="金額" value={customFieldsData.standardExpenseAmount || ''} onChange={e => handleCustomFieldChange('standardExpenseAmount', e.target.value)} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>円</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="card-box" style={{ margin: 0, padding: '16px', background: isGathering ? 'var(--input-bg)' : 'transparent', borderStyle: isGathering ? 'solid' : 'dashed' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={isGathering} onChange={e => setIsGathering(e.target.checked)} />
                            <Flag size={16} style={{ color: 'var(--theme)' }} /> 集合・出発時間を設定
                          </label>

                          {isGathering && (
                            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', width: '80px', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={14} /> 目的地に</span>
                                <div style={{ flex: 1 }}>
                                  <FuturisticTimeInput h={gatheringTime.split(':')[0] || '12'} m={gatheringTime.split(':')[1] || '00'} setH={(val:any) => setGatheringTime(`${val}:${gatheringTime.split(':')[1]||'00'}`)} setM={(val:any) => setGatheringTime(`${gatheringTime.split(':')[0]||'12'}:${val}`)} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>集合</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', width: '80px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {startPointType === 'address' ? <><Home size={14} /> 自宅</> : <><Train size={14} /> 駅</>} を
                                </span>
                                <div style={{ flex: 1 }}>
                                  <FuturisticTimeInput h={departureTime.split(':')[0] || '11'} m={departureTime.split(':')[1] || '30'} setH={(val:any) => setDepartureTime(`${val}:${departureTime.split(':')[1]||'00'}`)} setM={(val:any) => setDepartureTime(`${departureTime.split(':')[0]||'11'}:${val}`)} />
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>出発</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="card-box" style={{ margin: 0, padding: '16px', background: customFieldsData.isTransit ? 'var(--input-bg)' : 'transparent', borderStyle: customFieldsData.isTransit ? 'solid' : 'dashed' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={customFieldsData.isTransit || false} onChange={e => handleCustomFieldChange('isTransit', e.target.checked)} />
                            <Train size={16} style={{ color: 'var(--theme)' }} /> 交通機関（時間を記録）
                          </label>

                          {customFieldsData.isTransit && (
                            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <select className="pop-input" value={customFieldsData.transitType || 'train'} onChange={e => handleCustomFieldChange('transitType', e.target.value)} style={{ height: '36px', fontSize: '0.75rem' }}>
                                <option value="train"> 新幹線・電車</option>
                                <option value="plane"> 飛行機</option>
                                <option value="bus"> 高速バス・夜行バス</option>
                              </select>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>乗車:</span>
                                  <input type="time" className="pop-input" value={customFieldsData.transitDepTime || '10:00'} onChange={e => handleCustomFieldChange('transitDepTime', e.target.value)} style={{ padding: '0 8px', fontSize: '0.9rem', width: '100%' }} />
                                </div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>〜</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>降車:</span>
                                  <input type="time" className="pop-input" value={customFieldsData.transitArrTime || '12:00'} onChange={e => handleCustomFieldChange('transitArrTime', e.target.value)} style={{ padding: '0 8px', fontSize: '0.9rem', width: '100%' }} />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );

                    const BlockConfig = (
                      <div key="config" className="card-box" style={{ padding: '16px' }}>
                        <label className="form-label">ジャンル・カラー</label>
                        <select value={categoryName} onChange={e => setCategoryName(e.target.value)} className="pop-input" style={{ marginBottom: '16px' }}>
                          <option value="">設定なし</option>
                          {categories.map((c: any) => <option key={c.name} value={c.name}>{c.name}</option>)}
                        </select>
                        <ColorSelector value={eventColor || themeColor} onChange={setEventColor} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                            <input type="checkbox" checked={isPinned} onChange={e => setIsPinned(e.target.checked)} />
                            <Pin size={14} /> ピン留め
                          </label>
                        </div>
                      </div>
                    );

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

                              {f.type === 'score' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <input type="number" className="pop-input" style={{ flex: 1, textAlign: 'center' }} placeholder="自分" value={customFieldsData[f.id]?.my || ''} onChange={e => handleScoreChange(f.id, e.target.value, customFieldsData[f.id]?.opp || '')} />
                                  <span style={{ fontWeight: 'bold', color: 'var(--text-sub)' }}>-</span>
                                  <input type="number" className="pop-input" style={{ flex: 1, textAlign: 'center' }} placeholder="相手" value={customFieldsData[f.id]?.opp || ''} onChange={e => handleScoreChange(f.id, customFieldsData[f.id]?.my || '', e.target.value)} />
                                </div>
                              )}

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
                                      ¥{(() => {
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

                                        let totalWage = 0;
                                        let actualWorkCount = 0;
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

                        <details style={{ background: 'var(--card-bg)', padding: '12px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', cursor: 'pointer' }} open={Boolean(memo || photoUrls.length > 0)}>
                          <summary style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--theme)', outline: 'none', listStyle: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            ＋ 思い出メモ・写真を追加
                          </summary>
                          <div style={{ marginTop: '12px', cursor: 'default' }}>
                            <textarea className="pop-input" value={memo} onChange={e => setMemo(e.target.value)} placeholder="思い出メモ..." rows={2} style={{ background: 'var(--input-bg)' }} />
                            <div style={{ marginTop: '12px' }}>
                              <label className="form-label" style={{ color: 'var(--theme)' }}>思い出の写真</label>
                              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                                {photoUrls.map((url, i) => <img key={i} src={url} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />)}
                                <label style={{ width: '60px', height: '60px', borderRadius: '8px', border: '2px dashed var(--theme)', color: 'var(--theme)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem' }}>
                                  +<input type="file" multiple onChange={handlePhotoUpload} style={{ display: 'none' }} />
                                </label>
                              </div>
                            </div>
                          </div>
                        </details>
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
                    {title && (mode === 'create' || mode === 'detail') && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const newT = { title, startH, startM, endH, endM, categoryName, isAllDayBackground, eventColor };
                          const updated = [...quickTemplates, newT];
                          setQuickTemplates(updated);
                          localStorage.setItem('quickTemplates', JSON.stringify(updated));
                          alert('「よくある予定」として新しく登録しました！');
                        }}
                        className="btn-secondary"
                        style={{ width: '100%', padding: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: '2px dashed var(--theme)', color: 'var(--theme)' }}
                      >
                        <Star size={16} /> この内容を「よくある予定」に登録
                      </button>
                    )}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>キャンセル</button>
                      <button onClick={handleSave} className="btn-pop" style={{ flex: 1.5 }}>保存する</button>
                    </div>
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
                                else catInc += Number(fields[f.id]?.hours || 0) * Number(fields[f.id]?.wage || f.wage || 0);
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
                                  return sum + ((Number(d.hours) || 0) * Number(d.wage || f.wage || 0));
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
                                content = <div style={{ fontSize: '1.4rem', color: cat.color, fontWeight: '900' }}>{w}勝 {l}敗 {d}分</div>;
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
      </div>
    </div>
  );
}// re-deploy trigger