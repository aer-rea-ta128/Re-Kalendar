import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core'; 

// 🌟 export をつけることで他のファイルから呼び出せるようになります
export const requestNotificationPermission = async () => {
  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== 'granted') {
    console.warn('通知が許可されませんでした');
  }
};

export const scheduleEventNotification = async (eventId: string, title: string, startIso: string, offsetMinutes: number) => {
  const isEnabled = localStorage.getItem('user_notification_enabled');
  if (isEnabled === 'false') return;

  const eventTime = new Date(startIso).getTime();
  // 🌟 修正：一律10分前ではなく、指定された分数（offsetMinutes）前を計算する
  const triggerTime = new Date(eventTime - offsetMinutes * 60 * 1000); 

  if (triggerTime.getTime() < Date.now()) return;

  if (!Capacitor.isNativePlatform()) {
    console.log(`[通知テスト] 通知が予約されました（${offsetMinutes}分前）:
      タイトル: 予定が近づいています
      内容: 「${title}」がまもなく開始します。
      鳴る時間: ${new Date(triggerTime).toLocaleString()}
    `);
    return;
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        title: offsetMinutes === 0 ? '予定の時間です' : '予定が近づいています',
        body: offsetMinutes === 0 ? `「${title}」の時間になりました。` : `「${title}」がまもなく開始します。`,
        // 🌟 修正：同じ予定で複数の通知が衝突しないよう、IDを分数と組み合わせる
        id: Math.floor(Math.random() * 100000) + offsetMinutes, 
        schedule: { at: new Date(triggerTime) },
        sound: 'default',
        actionTypeId: 'OPEN_PRODUCT',
      }
    ]
  });
};