import React, { useState } from 'react';
import { restoreDataFromBackup } from '@/app/lib/backup';

export default function RestoreModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    setLoading(true);
    const result = await restoreDataFromBackup(code);
    if (result.success) {
      alert('復元が完了しました！ページをリロードします。');
      window.location.reload(); // データを読み込んだらリロードして適用
    } else {
      alert('復元に失敗しました: ' + result.message);
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel" style={{ padding: '24px' }}>
        <h2>データを読み込む</h2>
        <input 
          className="pop-input" 
          value={code} 
          onChange={(e) => setCode(e.target.value)} 
          placeholder="引き継ぎコード (例: XXXX-XXXX)" 
        />
        <button 
          onClick={handleRestore} 
          className="btn-pop" 
          style={{ width: '100%', marginTop: '16px' }}
          disabled={loading}
        >
          {loading ? '読み込み中...' : 'データを復元する'}
        </button>
      </div>
    </div>
  );
}