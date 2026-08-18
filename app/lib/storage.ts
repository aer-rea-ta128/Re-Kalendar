// src/app/lib/storage.ts
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// 🌟 データの読み込み（金庫から安全に取り出す）
export const loadData = (key: string, userId: string | null, defaultData: any) => {
  // 注意: Reactの初期描画で止まらないよう、同期的にローカルのキャッシュも併用しつつ
  // 裏側でPreferences（金庫）とデータを同期させるハイブリッド方式を採用します。
  
  const targetKey = userId ? `${userId}_${key}` : key;
  
  if (typeof window !== "undefined") {
    // 1. まず一瞬で画面に出すために、ブラウザのキャッシュから仮読み込みする
    const cachedStr = localStorage.getItem(targetKey);
    let cachedData = defaultData;
    if (cachedStr) {
      try {
        cachedData = JSON.parse(cachedStr);
      } catch (e) {
        cachedData = defaultData;
      }
    }

    // 2. もしネイティブアプリなら、裏側でPreferences（金庫）から本データを引っ張り出して上書きする
    if (Capacitor.isNativePlatform()) {
      Preferences.get({ key: targetKey }).then(({ value }) => {
        if (value) {
          try {
            const realData = JSON.parse(value);
            // 金庫のデータと仮データが違っていれば、金庫のデータで上書き（ローカルへ一時キャッシュ）
            if (JSON.stringify(realData) !== JSON.stringify(cachedData)) {
              localStorage.setItem(targetKey, value);
              // ここで画面を再描画させるためにカスタムイベントを発火（※必要に応じて）
              window.dispatchEvent(new Event('storage-synced'));
            }
          } catch (e) {
            console.error("Preferences parsing error:", e);
          }
        }
      });
    }
    return cachedData;
  }
  return defaultData;
};

// 🌟 データの保存（金庫にガチガチに書き込む）
export const saveData = (key: string, userId: string | null, data: any) => {
  if (typeof window !== "undefined") {
    const targetKey = userId ? `${userId}_${key}` : key;
    const valueStr = JSON.stringify(data);
    
    // 1. 画面の即時反映のためにローカルキャッシュにも書く
    localStorage.setItem(targetKey, valueStr);
    
    // 2. ネイティブアプリなら、絶対に消えないPreferences（金庫）へガチガチに保存する
    if (Capacitor.isNativePlatform()) {
      Preferences.set({ key: targetKey, value: valueStr }).catch(e => {
        console.error("Preferences save error:", e);
      });
    }
  }
};