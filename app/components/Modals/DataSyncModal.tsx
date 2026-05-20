import React, { useState } from 'react';
import { restoreDataFromBackup } from '@/app/lib/backup';

// onClose プロップの型を明示的に定義
interface Props {
  onClose: () => void;
}

export default function DataSyncModal({ onClose }: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    setLoading(true);
    // バックアップ機能からエクスポートした関数を呼び出す
    const result = await restoreDataFromBackup(code);
    
    if (result.success) {
      alert('復元が完了しました！ページをリロードして反映します。');
      window.location.reload(); 
    } else {
      // result.message を使って具体的にエラーを表示
      alert('復元に失敗しました: ' + (result.message || '不明なエラー'));
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ padding: '24px' }} onClick={e => e.stopPropagation()}>
        <h2>データを読み込む</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '16px' }}>
          引き継ぎコードを入力して、データを復元してください。
        </p>
        <input 
          className="pop-input" 
          value={code} 
          onChange={(e) => setCode(e.target.value)} 
          placeholder="引き継ぎコード (例: XXXX-XXXX)" 
          style={{ marginBottom: '16px' }}
        />
        <button 
          onClick={handleRestore} 
          className="btn-pop" 
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? '読み込み中...' : 'データを復元する'}
        </button>
        <button 
          onClick={onClose} 
          className="btn-secondary" 
          style={{ width: '100%', marginTop: '8px' }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}