'use client';

import React, { useState, useEffect } from 'react';
import { User, Lock, Plus, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (userId: string, userName: string) => void;
  themeColor: string;
}

export default function AuthScreen({ onLoginSuccess, themeColor }: AuthScreenProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [mode, setMode] = useState<'select' | 'login' | 'create'>('select');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // 入力用ステート
  const [newUserName, setNewUserName] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 初回読み込み時に登録済みのユーザーを取得
  useEffect(() => {
    const savedUsers = localStorage.getItem('os_local_users');
    if (savedUsers) {
      const parsed = JSON.parse(savedUsers);
      setUsers(parsed);
      if (parsed.length === 0) setMode('create');
    } else {
      setMode('create');
    }
  }, []);

  const handleCreateUser = () => {
    if (!newUserName.trim() || pinInput.length < 4) {
      setErrorMsg('名前と4桁以上のPINを入力してください');
      return;
    }
    const newUser = {
      id: `user_${Date.now()}`,
      name: newUserName.trim(),
      pin: pinInput
    };
    const updatedUsers = [...users, newUser];
    localStorage.setItem('os_local_users', JSON.stringify(updatedUsers));
    
    // そのままログイン状態にする
    onLoginSuccess(newUser.id, newUser.name);
  };

  const handleLogin = () => {
    if (selectedUser.pin === pinInput) {
      onLoginSuccess(selectedUser.id, selectedUser.name);
    } else {
      setErrorMsg('PINコードが間違っています');
      setPinInput('');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100dvh', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
      
      <div style={{ background: 'var(--card-bg)', width: '100%', maxWidth: '400px', padding: '32px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: `linear-gradient(135deg, ${themeColor}, ${themeColor}80)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: `0 8px 24px ${themeColor}40` }}>
          <ShieldCheck size={32} color="#fff" />
        </div>

        {mode === 'select' && (
          <>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.4rem', color: 'var(--text-main)', fontWeight: '900' }}>どなたが使いますか？</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              {users.map(u => (
                <button 
                  key={u.id} 
                  onClick={() => { setSelectedUser(u); setMode('login'); setErrorMsg(''); setPinInput(''); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
                >
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: themeColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <User size={20} />
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-main)', flex: 1, textAlign: 'left' }}>{u.name}</span>
                  <ArrowRight size={20} color="var(--text-sub)" />
                </button>
              ))}
              
              <button onClick={() => { setMode('create'); setErrorMsg(''); setPinInput(''); setNewUserName(''); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', background: 'transparent', border: `2px dashed ${themeColor}`, borderRadius: '16px', color: themeColor, fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}>
                <Plus size={20} /> 新しいユーザーを追加
              </button>
            </div>
          </>
        )}

        {mode === 'login' && selectedUser && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: 'var(--text-main)' }}>{selectedUser.name} さん</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.85rem', color: 'var(--text-sub)', fontWeight: 'bold' }}>PINコードを入力してください</p>
            
            <input 
              type="password" 
              inputMode="numeric" 
              pattern="[0-9]*"
              maxLength={4}
              value={pinInput} 
              onChange={e => { setPinInput(e.target.value); setErrorMsg(''); }} 
              placeholder="****"
              style={{ width: '100%', height: '56px', textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', borderRadius: '16px', border: `2px solid ${errorMsg ? '#ef4444' : 'var(--border-color)'}`, background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', marginBottom: '16px', fontWeight: 'bold' }} 
              autoFocus
            />
            {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '16px' }}>{errorMsg}</div>}
            
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              <button onClick={() => setMode('select')} style={{ flex: 1, padding: '14px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>戻る</button>
              <button onClick={handleLogin} style={{ flex: 1.5, padding: '14px', background: themeColor, color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: `0 4px 15px ${themeColor}60` }}>ロック解除</button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', color: 'var(--text-main)', textAlign: 'center', fontWeight: '900' }}>初期設定</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '0.8rem', color: 'var(--text-sub)', textAlign: 'center', fontWeight: 'bold' }}>自分専用のプロフィールを作りましょう。</p>
            
            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-sub)', marginBottom: '8px' }}>お名前</label>
            <input 
              type="text" 
              value={newUserName} 
              onChange={e => setNewUserName(e.target.value)} 
              placeholder="例: パパ、Taro"
              style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: '2px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', marginBottom: '16px', fontWeight: 'bold' }} 
            />

            <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-sub)', marginBottom: '8px' }}>暗証番号 (数字4桁以上)</label>
            <input 
              type="password" 
              inputMode="numeric" 
              pattern="[0-9]*"
              value={pinInput} 
              onChange={e => { setPinInput(e.target.value); setErrorMsg(''); }} 
              placeholder="****"
              style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '12px', border: `2px solid ${errorMsg ? '#ef4444' : 'var(--border-color)'}`, background: 'var(--input-bg)', color: 'var(--text-main)', outline: 'none', marginBottom: '16px', fontWeight: 'bold', letterSpacing: '4px' }} 
            />

            {errorMsg && <div style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>{errorMsg}</div>}
            
            <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
              {users.length > 0 && (
                <button onClick={() => setMode('select')} style={{ flex: 1, padding: '14px', background: 'var(--input-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer' }}>キャンセル</button>
              )}
              <button onClick={handleCreateUser} style={{ flex: 2, padding: '14px', background: themeColor, color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: `0 4px 15px ${themeColor}60` }}>登録してはじめる</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}