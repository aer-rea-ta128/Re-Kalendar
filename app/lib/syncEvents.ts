// 🌟 唯一のlibフォルダにあるsupabaseを参照
import { supabase } from './supabase'; 

export const syncEvents = async (localEvents: any[], activeUserId: string) => {
  if (!activeUserId) throw new Error("ログインユーザーIDが必要です");

  // 1. クラウドへ送信
  const { error: uploadError } = await supabase
    .from('events')
    .upsert(localEvents.map(e => ({
      ...e,
      user_id: activeUserId,
      updated_at: new Date().toISOString()
    })));

  if (uploadError) throw uploadError;

  // 2. クラウドから取得
  const { data: cloudEvents, error: downloadError } = await supabase
    .from('events')
    .select('*')
    .eq('user_id', activeUserId)
    .eq('is_deleted', false);

  if (downloadError) throw downloadError;

  return cloudEvents;
};