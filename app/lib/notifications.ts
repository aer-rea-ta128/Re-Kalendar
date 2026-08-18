import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core'; 

export const requestNotificationPermission = async () => {
  if (!Capacitor.isNativePlatform()) return;
  const permission = await LocalNotifications.requestPermissions();
  if (permission.display !== 'granted') {
    console.warn('通知が許可されませんでした');
  }
};

// 🌟 イベントID(文字列)から、常に同じ「数字のID」を作り出す魔法の関数
const generateNumericId = (eventId: string, offset: number) => {
  let hash = 0;
  for (let i = 0; i < eventId.length; i++) {
    hash = (hash << 5) - hash + eventId.charCodeAt(i);
    hash |= 0;
  }
  return (Math.abs(hash) % 1000000) + offset;
};

export const scheduleEventNotification = async (eventId: string, title: string, startIso: string, offsetMinutes: number) => {
  const isEnabled = localStorage.getItem('user_notification_enabled');
  if (isEnabled === 'false') return;

  const eventTime = new Date(startIso).getTime();
  const triggerTime = new Date(eventTime - offsetMinutes * 60 * 1000); 

  if (triggerTime.getTime() < Date.now()) return;

  // 🌟 ここで毎回「同じ予定なら同じID」を確実に発行する
  const numericId = generateNumericId(eventId, offsetMinutes);

  if (!Capacitor.isNativePlatform()) {
    console.log(`[通知テスト] 通知予約（${offsetMinutes}分前） ID: ${numericId}:
      タイトル: 予定が近づいています
      内容: 「${title}」がまもなく開始します。
      鳴る時間: ${new Date(triggerTime).toLocaleString()}
    `);
    return;
  }

  try {
    // 🌟 固定IDを使って、確実に古い通知を消す
    await LocalNotifications.cancel({ notifications: [{ id: numericId }] });
  } catch (e) {
    console.log("古い通知のキャンセルスキップ", e);
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: numericId, // 🌟 ランダムではなく固定IDをセットする
        title: offsetMinutes === 0 ? '予定の時間です' : '予定が近づいています',
        body: offsetMinutes === 0 ? `「${title}」の時間になりました。` : `「${title}」がまもなく開始します。`,
        schedule: { at: new Date(triggerTime) },
        sound: 'default',
        actionTypeId: 'OPEN_PRODUCT',
      }
    ]
  });
};