'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, ShieldCheck, UserPlus, LogIn, AtSign } from 'lucide-react';
import { supabase } from '@/app/lib/supabase'; // 🌟 Supabaseを読み込む

interface AuthScreenProps {
  onLoginSuccess: (userId: string, userName: string) => void;
  themeColor: string;
}

export default function AuthScreen({ onLoginSuccess, themeColor }: AuthScreenProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [mode, setMode] = useState<'welcome' | 'login' | 'create'>('welcome');
  
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [deviceId, setDeviceId] = useState('');

  useEffect(() => {
    // 👇 デバイスIDの取得・発行
    let did = localStorage.getItem('os_device_id');
    if (!did) {
      did = 'device_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('os_device_id', did);
    }
    setDeviceId(did);
  }, []);

  const handleCreateUser = async () => {
    console.log("【デバッグ】新規登録開始: ID =", userId.trim());

    if (!userId.trim() || !nickname.trim() || !password.trim()) { 
      console.log("【デバッグ】入力チェックエラー: 未入力あり");
      setErrorMsg('すべての項目を入力してください'); 
      return; 
    }

    try {
      console.log("【デバッグ】SupabaseへINSERT実行中...");

      const { error } = await supabase
        .from('users')
        .insert([{ 
          id: userId.trim(), 
          nickname: nickname.trim(), 
          password: password.trim(), 
          devices: [deviceId] 
        }]);

      if (error) {
        // 🌟 ここでSupabaseからのエラー詳細をログに出す
        console.error("【デバッグ】Supabase INSERTエラー:", error);
        setErrorMsg(`登録失敗 (コード: ${error.code}, 詳細: ${error.message})`);
        return;
      }

      console.log("【デバッグ】登録成功！");
      onLoginSuccess(userId.trim(), nickname.trim());
      localStorage.setItem('os_active_session', JSON.stringify({ id: userId.trim(), name: nickname.trim() }));
      
    } catch (err) {
      console.error("【デバッグ】予期せぬ通信エラー:", err);
      setErrorMsg('予期せぬ通信エラーが発生しました');
    }
  };

  // 🌟 ログイン処理（Supabaseから検索）
  const handleLogin = async () => {
    if (!userId.trim() || !password.trim()) { setErrorMsg('IDとパスワードを入力してください'); return; }

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId.trim())
      .single();

    if (error || !data || data.password !== password.trim()) {
      setErrorMsg('IDまたはパスワードが間違っています');
      return;
    }

    onLoginSuccess(data.id, data.nickname);
    localStorage.setItem('os_active_session', JSON.stringify({ id: data.id, name: data.nickname }));
  }; // ← ここで閉じます

  return (
      <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            width: '100vw', 
            height: '100dvh', 
            background: 'var(--bg-main)', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999, 
            padding: '20px',
            // 🌟 追加：キーボード表示時の挙動を安定させる設定
            overflowY: 'auto', 
            WebkitOverflowScrolling: 'touch' 
          }}>
        <div style={{ background: 'var(--card-bg)', width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: `linear-gradient(135deg, ${themeColor}, ${themeColor}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: `0 8px 24px ${themeColor}40` }}>
          <ShieldCheck size={32} color="#fff" />
        </div>

        {mode === 'welcome' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: '900', textAlign: 'center' }}>Smart LifeOS</h2>
            <button onClick={() => { setMode('create'); setErrorMsg(''); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', background: themeColor, color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: `0 4px 15px ${themeColor}60` }}>
              <UserPlus size={20} /> 新しくアカウントを作成
            </button>
            <button onClick={() => { setMode('login'); setErrorMsg(''); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
              <LogIn size={20} /> ログイン
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', color: 'var(--text-main)', textAlign: 'center', fontWeight: '900' }}>新規アカウント作成</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AtSign size={16} /> ユーザーID
              </label>
              <input type="text" value={userId} onChange={e => setUserId(e.target.value)} style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: `2px solid ${themeColor}40`, background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', fontWeight: 'bold' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '4px' }}>※半角英数とアンダーバーのみ（4〜15文字）</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={16} /> ニックネーム
              </label>
              <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: `2px solid ${themeColor}40`, background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', fontWeight: 'bold' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '32px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={16} /> パスワード
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: `2px solid ${themeColor}40`, background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', fontWeight: 'bold' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '4px' }}>※半角英数字8文字以上</span>
            </div>

            {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>{errorMsg}</div>}
            
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button onClick={() => setMode('welcome')} style={{ flex: 1, padding: '14px', background: 'transparent', color: 'var(--text-main)', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>戻る</button>
              <button onClick={handleCreateUser} style={{ flex: 1.5, padding: '14px', background: themeColor, color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: `0 4px 15px ${themeColor}60` }}>登録</button>
            </div>
          </div>
        )}

        {mode === 'login' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', color: 'var(--text-main)', textAlign: 'center', fontWeight: '900' }}>ログイン</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AtSign size={16} /> ユーザーID
              </label>
              <input type="text" value={userId} onChange={e => setUserId(e.target.value)} style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: `2px solid ${themeColor}40`, background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', fontWeight: 'bold' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '32px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={16} /> パスワード
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: `2px solid ${themeColor}40`, background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', fontWeight: 'bold' }} />
            </div>

            {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>{errorMsg}</div>}
            
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button onClick={() => setMode('welcome')} style={{ flex: 1, padding: '14px', background: 'transparent', color: 'var(--text-main)', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>戻る</button>
              <button onClick={handleLogin} style={{ flex: 1.5, padding: '14px', background: themeColor, color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: `0 4px 15px ${themeColor}60` }}>ログイン</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}