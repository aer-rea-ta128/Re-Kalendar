import { supabase } from '@/app/lib/supabase';

// app/lib/backup.ts
export const generateBackupCode = (): string => {
  // 読み間違いを防ぐため、紛らわしい文字(0, O, 1, I等)を除外した候補
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  
  const generatePart = () => 
    Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  
  // XXXX-XXXX 形式で返す
  return `${generatePart()}-${generatePart()}`;
};

export type BackupResult = { 
  success: boolean; 
  code?: string; 
  message?: string; 
  error?: any 
};

// app/lib/backup.ts
export const createDataBackup = async (userId: string | null): Promise<BackupResult> => {
  try {
    // 1. localStorage から os_ で始まるデータをすべて取得
    const backupData: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('os_')) {
        const val = localStorage.getItem(key);
        try {
          backupData[key] = JSON.parse(val || 'null');
        } catch {
          backupData[key] = val; // JSONじゃない場合はそのまま文字列で保存
        }
      }
    }

    const code = generateBackupCode();
    const finalUserId = userId === 'local_dev' ? null : userId;

    const { error } = await supabase
      .from('backups')
      .insert([{
        backup_code: code,
        user_id: finalUserId,
        app_data: backupData, // まとめてJSONbとして保存
      }]);

    if (error) throw error;
    return { success: true, code: code };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};

export const restoreDataFromBackup = async (code: string): Promise<BackupResult> => {
  try {
    const { data, error } = await supabase
      .from('backups')
      .select('app_data')
      .eq('backup_code', code)
      .single();

    if (error || !data) throw new Error('バックアップコードが見つかりません');

    // 2. 取得したデータをすべて localStorage に書き戻す
    const { app_data } = data;
    Object.entries(app_data).forEach(([key, val]) => {
      localStorage.setItem(key, JSON.stringify(val));
    });

    window.location.reload(); // 状態を更新
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
};