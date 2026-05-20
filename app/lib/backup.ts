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

export const createDataBackup = async (userId: string | null) => {
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

    // ★重要: userId が 'local_dev' なら null に強制変換してDBに送る
    const finalUserId = userId === 'local_dev' ? null : userId;

    const { data, error } = await supabase
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
    // ★ここが一番重要: エラーの全貌をログに出す
    console.error('--- バックアップエラー詳細 ---');
    console.error('Message:', err.message);
    console.error('Details:', err.details);
    console.error('Hint:', err.hint);
    console.error('Raw Error:', err);
    return { success: false, error: err };
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