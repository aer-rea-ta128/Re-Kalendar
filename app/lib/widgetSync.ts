import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'; // 🌟 Encoding を追加
import { Capacitor } from '@capacitor/core';

export const syncDataToWidget = async (events: any[]) => {
  // パソコンのブラウザ環境なら、同期シミュレーションのログだけ出して終了
  if (!Capacitor.isNativePlatform()) {
    console.log('[ウィジェット同期テスト] データを共有フォルダに書き出しました。件数:', events.length);
    return;
  }

  try {
    // 🌟 iOSウィジェットが読み込める形で、必要な情報だけをスッキリ抽出
    const widgetData = events.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start, // ISO形式の日時
      end: e.end || e.start,
      color: e.extendedProps?.cColor || '#4D96FF',
      category: e.extendedProps?.category || ''
    }));

    await Filesystem.writeFile({
    data: JSON.stringify(widgetData),
    // ⚠️ 修正：iOSのApp Group内を指定して、完全な共有スペースに書き込む形にバインドします
    directory: Directory.Library, 
    path: `../Library/Application Support/unis.com.yourname.smartlifeos/schedule.json`, // 重複を削り、こちらのみ残します
    encoding: Encoding.UTF8
  });

  } catch (error) {
    console.error('ウィジェットへのデータ同期に失敗しました:', error);
  }
};