// @/app/lib/widgetSync.ts
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export const syncDataToWidget = async (events: any[]) => {
  if (!Capacitor.isNativePlatform()) {
    console.log('[ウィジェット同期テスト] データを共有フォルダに書き出しました');
    return;
  }

  try {
    const widgetData = events.map(e => ({
      id: e.id,
      title: e.title,
      start_at: e.start,
      end_at: e.end || e.start,
      category: e.extendedProps?.category || '未分類',
      metadata: { customColor: e.extendedProps?.cColor || '#4D96FF' }
    }));

    // 🌟 修正：@capacitor/preferences を使用
    // group は configure メソッドで設定する必要があります
    await Preferences.configure({
      group: 'group.com.yourname.smartlifeos' // 🌟 Xcodeの設定と一致させる
    });

    await Preferences.set({
      key: 'widget_events_data',
      value: JSON.stringify(widgetData)
    });
    
    console.log('ウィジェットへの同期成功');
  } catch (error) {
    console.error('ウィジェット同期エラー:', error);
  }
};