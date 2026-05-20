// app/lib/storage.ts
export const getStorageKey = (key: string, userId: string | null) => {
  const uid = userId || 'guest';
  return `os_${uid}_${key}`;
};

// app/lib/storage.ts

// 引数を3つにする定義
export const loadData = (key: string, userId: string | null, defaultData: any) => {
  if (typeof window === 'undefined') return defaultData;
  const storageKey = `os_${userId || 'guest'}_${key}`;
  const saved = localStorage.getItem(storageKey);
  try {
    return saved ? JSON.parse(saved) : defaultData;
  } catch (e) {
    return defaultData;
  }
};

export const saveData = (key: string, userId: string | null, data: any) => {
  if (typeof window === 'undefined') return;
  const storageKey = `os_${userId || 'guest'}_${key}`;
  localStorage.setItem(storageKey, JSON.stringify(data));
};