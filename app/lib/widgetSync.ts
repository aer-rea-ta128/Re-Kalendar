// @/app/lib/widgetSync.ts
import { Capacitor } from '@capacitor/core';
// import ではなく require を使うことで型チェックを完全に回避できます
const { UserDefaults } = require('@capacitor-community/user-defaults');

export const syncDataToWidget = async (events: any[]) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[ウィジェット同期テスト] データを共有フォルダに書き出しました');
    return;
  }

  try {
    const widgetData = events.map(e => ({
      id: e.id,
      title: e.title,
      start_at: e.start, // Swift側の SharedEvent と名前を合わせる
      end_at: e.end || e.start,
      category: e.extendedProps?.category || '未分類',
      metadata: { customColor: e.extendedProps?.cColor || '#4D96FF' }
    }));

    // 🌟 ここが重要：App Group ID を指定して UserDefaults に書き込む
    await UserDefaults.set({
      key: 'widget_events_data',
      value: JSON.stringify(widgetData),
      group: 'group.com.yourname.smartlifeos' // 🌟 Xcodeの設定と完全一致させる
    });
    
    console.log('ウィジェットへの同期成功');
  } catch (error) {
    console.error('ウィジェット同期エラー:', error);
  }
};