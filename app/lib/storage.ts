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

// app/lib/storage.ts
export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem('os_device_id');
  if (!deviceId) {
    // uuidの代わりに簡易的なランダム文字列を生成
    deviceId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('os_device_id', deviceId);
  }
  return deviceId;
};

export const saveData = (key: string, userId: string | null, data: any) => {
  if (typeof window === 'undefined') return;
  const storageKey = `os_${userId || 'guest'}_${key}`;
  localStorage.setItem(storageKey, JSON.stringify(data));
};