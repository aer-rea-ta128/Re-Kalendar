import { createClient } from '@supabase/supabase-js';

// .env.localに設定した値をプログラム内で読み込めるようにする
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// これが「データベースへの窓口」となるクライアント
export const supabase = createClient(supabaseUrl, supabaseAnonKey);