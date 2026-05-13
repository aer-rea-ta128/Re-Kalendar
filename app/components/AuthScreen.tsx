'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, ShieldCheck, UserPlus, LogIn, AtSign } from 'lucide-react';

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

  useEffect(() => {
    const savedUsers = localStorage.getItem('os_local_users');
    if (savedUsers) setUsers(JSON.parse(savedUsers));
  }, []);

  const handleCreateUser = () => {
    if (!userId.trim() || !nickname.trim() || !password.trim()) {
      setErrorMsg('すべての項目を入力してください'); return;
    }
    // 👇 修正：ユーザーIDの制限を徹底
    if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
      setErrorMsg('ユーザーIDは半角英数字とアンダーバー(_)のみ使用できます'); return;
    }
    // 👇 修正：ニックネームの文字数制限を追加
    if (nickname.trim().length > 10) {
      setErrorMsg('ニックネームは10文字以内で入力してください'); return;
    }
    if (users.some(u => u.id === userId.trim())) {
      setErrorMsg('このユーザーIDはすでに使われています'); return;
    }

    const newUser = { id: userId.trim(), nickname: nickname.trim(), password: password.trim() };
    const updatedUsers = [...users, newUser];
    localStorage.setItem('os_local_users', JSON.stringify(updatedUsers));
    onLoginSuccess(newUser.id, newUser.nickname);
  };

  const handleLogin = () => {
    if (!userId.trim() || !password.trim()) {
      setErrorMsg('IDとパスワードを入力してください'); return;
    }
    const user = users.find(u => u.id === userId.trim());
    if (user && user.password === password.trim()) {
      onLoginSuccess(user.id, user.nickname);
    } else {
      setErrorMsg('IDまたはパスワードが間違っています');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '4px' }}>※アプリ内で表示される名前です（後から変更可能）</span>
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