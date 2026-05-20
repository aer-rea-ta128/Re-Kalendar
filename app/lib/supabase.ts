import { createClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';

const storage = Capacitor.isNativePlatform() ? undefined : localStorage;

const supabaseUrl = 'https://vsznglbrgjbwazdbsxhg.supabase.co'; // 🌟 書き換える
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZzem5nbGJyZ2pid2F6ZGJzeGhnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MTYyMTksImV4cCI6MjA5MTI5MjIxOX0.ftLHf2hFAO5TXXLuKpF2zq-jzwdo-28hSAHFksuofds'; // 🌟 書き換える

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Webとアプリで保存場所を自動で切り替える賢い設定
    storage: Capacitor.isNativePlatform() ? undefined : (typeof window !== 'undefined' ? localStorage : undefined),
    persistSession: true,
  }
});