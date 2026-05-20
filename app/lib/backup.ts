import { supabase } from '@/app/lib/supabase';

export const generateBackupCode = (): string => {
  const chars = 'CHARS23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-';
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export type BackupResult = { 
  success: boolean; 
  code?: string; 
  message?: string; 
  error?: any 
};

// 2. createDataBackup 関数をこれに置き換えてください
export const createDataBackup = async (userId: string | null): Promise<BackupResult> => {
  try {
    const categories = localStorage.getItem('os_categories');
    const timetables = localStorage.getItem('os_timetables');
    const appSettings = localStorage.getItem('os_full_settings');

    const backupData = {
      categories: categories ? JSON.parse(categories) : null,
      timetables: timetables ? JSON.parse(timetables) : null,
      settings: appSettings ? JSON.parse(appSettings) : null,
    };

    const code = generateBackupCode();

    // IDが 'local_dev' の場合は null を送ることで、SupabaseのUUID制約を回避
    const finalUserId = userId === 'local_dev' ? null : userId;

    const { error } = await supabase
      .from('backups')
      .insert([
        {
          backup_code: code,
          user_id: finalUserId,
          app_data: backupData,
        }
      ]);

    if (error) throw error;

    return { success: true, code: code };

  } catch (err: any) {
    // iPhoneでも確認できるよう、alertを追加しました
    const errorMessage = err.message || JSON.stringify(err);
    console.error('--- バックアップエラー詳細 ---', err);
    alert('バックアップ失敗: ' + errorMessage); 
    
    return { success: false, message: errorMessage, error: err };
  }
};
export const restoreDataFromBackup = async (code: string) => {
  try {
    const { data, error } = await supabase
      .from('backups')
      .select('app_data')
      .eq('backup_code', code)
      .single();

    if (error) throw error;
    if (!data) throw new Error('コードが見つかりません');

    const { app_data } = data;
    if (app_data.categories) localStorage.setItem('os_categories', JSON.stringify(app_data.categories));
    if (app_data.timetables) localStorage.setItem('os_timetables', JSON.stringify(app_data.timetables));
    if (app_data.settings) localStorage.setItem('os_full_settings', JSON.stringify(app_data.settings));

    return { success: true };
  } catch (err: any) {
    console.error('復元失敗:', err);
    return { success: false, message: err.message };
  }
};