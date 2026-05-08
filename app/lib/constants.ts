export const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];
export const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
export const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));
export const INITIAL_PRESETS = ['#FF6B6B', '#4D96FF', '#1DD1A1', '#FECA57', '#9B59B6', '#34495e', '#FF9FF3'];
export const VIEW_OPTIONS = [{ id: 'daygridmonth', label: '月' }, { id: 'timegridweek', label: '週' }, { id: 'timegridday', label: '日' }];
export const FIELD_TYPES = [
  { value: 'number', label: '数値 (回数・杯数など)' },
  { value: 'money_expense', label: '金額 (支出)' },
  { value: 'money_income', label: '金額 (収入)' },
  { value: 'wage', label: '時給計算 (自動収入)' },
  { value: 'score', label: '対戦スコア (スポーツ)' },
  { value: 'text', label: 'テキスト (メモ・セトリ・感想など)' }
];