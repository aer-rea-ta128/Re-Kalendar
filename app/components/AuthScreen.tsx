'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, ShieldCheck, UserPlus, LogIn, AtSign, Download } from 'lucide-react';
import { supabase } from '@/app/lib/supabase';
import { restoreDataFromBackup } from '@/app/lib/backup';

interface AuthScreenProps {
  onLoginSuccess: (userId: string, userName: string) => void;
  themeColor: string;
}

export default function AuthScreen({ onLoginSuccess, themeColor }: AuthScreenProps) {
  const [mode, setMode] = useState<'welcome' | 'login' | 'create'>('welcome');
  const [userId, setUserId] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deviceId, setDeviceId] = useState('');
  
  // 復元用 State
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreCode, setRestoreCode] = useState('');

  useEffect(() => {
    let did = localStorage.getItem('os_device_id');
    if (!did) {
      did = 'device_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('os_device_id', did);
    }
    setDeviceId(did);
  }, []);

  // 復元処理（ログイン前に行う）
  const runRestoreIfNeeded = async () => {
    if (isRestoring) {
      if (!restoreCode.trim()) throw new Error('引き継ぎコードを入力してください');
      const result = await restoreDataFromBackup(restoreCode);
      if (!result.success) throw new Error('引き継ぎ失敗: ' + (result.message || '不明なエラー'));
      alert('データ引き継ぎが完了しました！');
    }
  };

  // AuthScreen.tsx 内の handleCreateUser を以下のように整理
const handleCreateUser = async () => {
  if (!userId.trim() || !nickname.trim() || !password.trim()) {
    setErrorMsg('すべての項目を入力してください');
    return;
  }

  try {
    // 復元処理
    await runRestoreIfNeeded();

    // ユーザー登録処理
    const { error } = await supabase.from('users').insert([{
      id: userId.trim(),
      nickname: nickname.trim(),
      password: password.trim(),
      devices: [deviceId]
    }]);

    if (error) throw error;

    onLoginSuccess(userId.trim(), nickname.trim());
    localStorage.setItem('os_active_session', JSON.stringify({ id: userId.trim(), name: nickname.trim() }));
  } catch (err: any) {
    setErrorMsg(err.message);
  }
};

  const handleLogin = async () => {
    if (!userId.trim() || !password.trim()) {
      setErrorMsg('IDとパスワードを入力してください');
      return;
    }

    try {
      await runRestoreIfNeeded(); // ログイン前に復元

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId.trim())
        .single();

      if (error || !data || data.password !== password.trim()) {
        setErrorMsg('IDまたはパスワードが間違っています');
        return;
      }
      const currentUserId = data.id;
      Object.keys(localStorage).forEach(key => {
        // os_ で始まり、かつ現在のユーザーIDのものではないキーを全て削除
        if (key.startsWith('os_') && !key.startsWith(`os_${currentUserId}_`) && key !== 'os_device_id') {
          localStorage.removeItem(key);
        }
      });

      onLoginSuccess(data.id, data.nickname);
      localStorage.setItem('os_active_session', JSON.stringify({ id: data.id, name: data.nickname }));
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div style={{ background: 'var(--card-bg)', width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: `linear-gradient(135deg, ${themeColor}, ${themeColor}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: `0 8px 24px ${themeColor}40` }}>
          <ShieldCheck size={32} color="#fff" />
        </div>

        {mode === 'welcome' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          <h2 style={{ textAlign: 'center', fontWeight: '900' }}>Smart LifeOS</h2>
          
          {/* ログイン/登録のボタンの下に配置 */}
          <div style={{ background: 'var(--input-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
              <input type="checkbox" checked={isRestoring} onChange={e => setIsRestoring(e.target.checked)} />
              <Download size={16} /> 以前の端末からデータを引き継ぐ
            </label>
            {isRestoring && (
              <input 
                className="pop-input" 
                value={restoreCode} 
                onChange={e => {
                  let val = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
                  if (val.length > 4) val = val.slice(0, 4) + '-' + val.slice(4, 8);
                  setRestoreCode(val);
                }} 
                placeholder="XXXX-XXXX"
                maxLength={9}
                style={{ marginTop: '8px', fontSize: '0.9rem' }}
              />
            )}
          </div>

          <button onClick={() => { setMode('create'); setErrorMsg(''); }} className="btn-pop">
            <UserPlus size={20} /> 新しくアカウントを作成
          </button>
          <button onClick={() => { setMode('login'); setErrorMsg(''); }} className="btn-secondary">
            <LogIn size={20} /> ログイン
          </button>
        </div>
      )}

        {(mode === 'create' || mode === 'login') && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.2rem', color: 'var(--text-main)', textAlign: 'center', fontWeight: '900' }}>
              {mode === 'create' ? '新規アカウント作成' : 'ログイン'}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AtSign size={16} /> ユーザーID
              </label>
              <input type="text" value={userId} onChange={e => setUserId(e.target.value)} style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: `2px solid ${themeColor}40`, background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', fontWeight: 'bold' }} />
            </div>

            {mode === 'create' && (
              <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '20px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} /> ニックネーム
                </label>
                <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: `2px solid ${themeColor}40`, background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', fontWeight: 'bold' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '32px' }}>
              <label style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={16} /> パスワード
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: `2px solid ${themeColor}40`, background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', fontWeight: 'bold' }} />
            </div>

            {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>{errorMsg}</div>}
            
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button onClick={() => setMode('welcome')} style={{ flex: 1, padding: '14px', background: 'transparent', color: 'var(--text-main)', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>戻る</button>
              <button onClick={mode === 'create' ? handleCreateUser : handleLogin} style={{ flex: 1.5, padding: '14px', background: themeColor, color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: `0 4px 15px ${themeColor}60` }}>
                {mode === 'create' ? '登録' : 'ログイン'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}