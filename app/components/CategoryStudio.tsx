'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Trash2, Share2, Sparkles, Download } from 'lucide-react';
import { FIELD_TYPES, HOURS, MINUTES } from '@/app/lib/constants';

// --- propsの型定義（親から何を受け取るか） ---
interface CategoryStudioProps {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
  setCategories: React.Dispatch<React.SetStateAction<any[]>>;
  themeColor: string;
  activePresets: string[];
  userColors: string[];
  setUserColors: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function CategoryStudio({
  isOpen,
  onClose,
  categories,
  setCategories,
  themeColor,
  activePresets,
  userColors,
  setUserColors
}: CategoryStudioProps) {
  
  // --- この画面だけで使う専用のState（page.tsxからお引っ越し） ---
  const [editingCategoryNameOrigin, setEditingCategoryNameOrigin] = useState<string | null>(null);
  const [editCatNameInput, setEditCatNameInput] = useState('');
  const [editCatColorInput, setEditCatColorInput] = useState('');
  
  const [editingCatField, setEditingCatField] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('number');
  const [newFieldUnit, setNewFieldUnit] = useState('');
  const [newWageRules, setNewWageRules] = useState<{start: string, end: string, wage: string}[]>([{ start: '00:00', end: '23:59', wage: '1000' }]);

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editFieldName, setEditFieldName] = useState('');
  const [editFieldUnit, setEditFieldUnit] = useState('');
  const [editWageRules, setEditWageRules] = useState<{start: string, end: string, wage: string}[]>([]);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(themeColor);

  const [aiTemplatePrompt, setAiTemplatePrompt] = useState('');
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

  // モーダルが閉じていたら何も表示しない
  if (!isOpen) return null;

  // --- 共通部品（このファイル内で使う用） ---
  const ModalHeader = ({ title, onCloseBtn }: { title: string, onCloseBtn: () => void }) => (
    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
      <h2 className="modal-title" style={{ margin: 0, color: themeColor, fontSize: '1.4rem', fontWeight: 900, letterSpacing: '0.02em' }}>{title}</h2>
      <button onClick={onCloseBtn} className="btn-close" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>×</button>
    </div>
  );

  const ColorSelector = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    const [tempColor, setTempColor] = useState(value);
    useEffect(() => { setTempColor(value); }, [value]);
    const isChanged = tempColor !== value;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--input-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {activePresets.map((c: string, i: number) => (
            <div key={`color-${i}`} onClick={() => { onChange(c); setTempColor(c); }} style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: c, cursor: 'pointer', border: tempColor === c ? '3px solid var(--text-main)' : '2px solid transparent', boxSizing: 'border-box', boxShadow: `0 2px 6px ${c}50`, transition: 'all 0.2s', flexShrink: 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px dashed var(--border-color)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-sub)' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: tempColor, border: '2px solid var(--border-color)', boxShadow: '0 2px 6px rgba(0,0,0,0.1)', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
               <input type="color" value={tempColor} onChange={e => setTempColor(e.target.value)} style={{ opacity: 0, position: 'absolute', width: '200%', height: '200%', top: '-50%', left: '-50%', cursor: 'pointer' }} />
            </div>
            色を選択
          </label>
          {isChanged && (
            <button onClick={(e) => { e.preventDefault(); onChange(tempColor); if (!userColors.includes(tempColor)) setUserColors([...userColors, tempColor]); }} style={{ background: themeColor, color: '#fff', border: 'none', borderRadius: '20px', padding: '6px 16px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
              確定
            </button>
          )}
        </div>
      </div>
    );
  };

  // --- 処理関数（page.tsxからお引っ越し） ---
  const handleAddCategory = () => {
    if (!newCategoryName.trim() || categories.find((c: any) => c.name === newCategoryName.trim())) return;
    setCategories([...categories, { name: newCategoryName.trim(), color: newCategoryColor, fields: [] }]);
    setNewCategoryName('');
  };

  const addFieldToCategory = (catName: string) => {
    const finalName = newFieldType === 'wage' ? '給与(時給計算)' : newFieldName.trim();
    if(!finalName && newFieldType !== 'wage') return;
    setCategories((cats: any[]) => cats.map((c: any) => {
      if(c.name === catName) return { ...c, fields: [...(c.fields||[]), { id: Date.now().toString(), name: finalName, type: newFieldType, unit: newFieldUnit, wageRules: newFieldType === 'wage' ? newWageRules : undefined }] };
      return c;
    }));
    setNewFieldName(''); setNewFieldUnit(''); setNewFieldType('number'); setEditingCatField(null);
    setNewWageRules([{ start: '00:00', end: '23:59', wage: '1000' }]);
  };

  const saveEditField = (catName: string, fieldId: string, fieldType: string) => {
    if (!editFieldName.trim()) return;
    setCategories((cats: any[]) => cats.map((c: any) => {
      if(c.name === catName) return { 
        ...c, 
        fields: (c.fields||[]).map((f: any) => f.id === fieldId ? { ...f, name: editFieldName, unit: editFieldUnit, ...(fieldType === 'wage' ? { wageRules: editWageRules } : {}) } : f) 
      };
      return c;
    }));
    setEditingFieldId(null);
  };

  const handleGenerateTemplate = async () => {
    if (!aiTemplatePrompt.trim()) return alert('作りたい記録・目標を入力してください');
    setIsGeneratingTemplate(true);
    try {
      const res = await fetch('/api/generate-template', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: aiTemplatePrompt }) });
      if (!res.ok) throw new Error('生成エラー');
      const newGeneratedCategory = await res.json();
      setCategories(prev => [...prev, newGeneratedCategory]);
      setAiTemplatePrompt('');
      alert(`AIが「${newGeneratedCategory.name}」セットを生成しました！`);
    } catch (error) {
      alert('AIによる生成に失敗しました。');
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  const handleExportCategory = (categoryObj: any) => {
    try {
      const shareCode = btoa(encodeURIComponent(JSON.stringify(categoryObj)));
      navigator.clipboard.writeText(shareCode);
      alert(`「${categoryObj.name}」の共有コードをコピーしました！\n\n【コードの例】\n${shareCode.substring(0, 20)}...`);
    } catch (e) {
      alert('コードの生成に失敗しました。');
    }
  };

  const handleImportCategory = () => {
    const code = prompt('共有コードを貼り付けてください:');
    if (!code) return;
    try {
      const decodedObj = JSON.parse(decodeURIComponent(atob(code)));
      if (decodedObj.fields) {
        decodedObj.fields = decodedObj.fields.map((f: any) => ({ ...f, id: Date.now().toString() + Math.random().toString(36).substring(2, 9) }));
      }
      setCategories((prev: any[]) => [...prev, decodedObj]);
      alert(`「${decodedObj.name}」をインポートしました！`);
    } catch (e) {
      alert('無効な共有コードです。');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px' }}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', borderRadius: '28px', border: '1px solid var(--glass-border)', overflowY: 'auto', maxHeight: '90vh', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '24px' }}>
        <ModalHeader title="テンプレート・スタジオ" onCloseBtn={onClose} />
        
        {/* AI生成とインポート */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0.1) 100%)', border: '1px solid #8b5cf6', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 15px rgba(139,92,246,0.1)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={16} fill="#8b5cf6" /> AIでオリジナルを生成
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" className="pop-input" placeholder="例: 推しのライブ遠征" value={aiTemplatePrompt} onChange={e => setAiTemplatePrompt(e.target.value)} style={{ flex: 1, fontSize: '0.8rem', background: 'var(--card-bg)', height: '36px', width: '100%', borderRadius: '12px', border: '2px solid var(--border-color)', padding: '0 14px' }} />
              <button onClick={handleGenerateTemplate} disabled={isGeneratingTemplate} style={{ padding: '0 16px', fontSize: '0.8rem', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '16px', fontWeight: 'bold', whiteSpace: 'nowrap', opacity: isGeneratingTemplate ? 0.7 : 1, cursor: 'pointer' }}>
                {isGeneratingTemplate ? '生成中...' : '生成'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <button onClick={handleImportCategory} style={{ height: '100%', padding: '0 16px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', border: '1px dashed var(--theme)', color: 'var(--theme)', background: 'var(--card-bg)', cursor: 'pointer' }}>
              <Download size={20} />
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>コードから<br/>追加</span>
            </button>
          </div>
        </div>

        {/* ジャンル一覧 */}
        <div style={{ marginBottom: '24px', maxHeight: '45vh', overflowY: 'auto', paddingRight: '4px' }}>
          {categories.map((c: any) => (
            <div key={c.name} style={{ padding: '12px', marginBottom: '12px', borderLeft: `6px solid ${c.color}`, background: 'var(--card-bg)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
              
              {/* ジャンル名と色の編集 */}
              {editingCategoryNameOrigin === c.name ? (
                <div style={{ padding: '8px', background: 'var(--input-bg)', borderRadius: '8px', marginBottom: '8px' }}>
                  <input value={editCatNameInput} onChange={e => setEditCatNameInput(e.target.value)} style={{ height: '32px', marginBottom: '8px', width: '100%', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)' }} />
                  <ColorSelector value={editCatColorInput} onChange={setEditCatColorInput} />
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    <button onClick={() => {
                      if (!editCatNameInput.trim()) return;
                      setCategories((cats: any[]) => cats.map((cat: any) => cat.name === c.name ? { ...cat, name: editCatNameInput, color: editCatColorInput } : cat));
                      setEditingCategoryNameOrigin(null);
                    }} style={{ flex: 1, padding: '6px', background: themeColor, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>保存</button>
                    <button onClick={() => setEditingCategoryNameOrigin(null)} style={{ flex: 1, padding: '6px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>取消</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: c.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: '900', fontSize: '1rem', color: 'var(--text-main)', wordBreak: 'break-word', lineHeight: 1.2 }}>{c.name}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', marginLeft: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => { setEditingCategoryNameOrigin(c.name); setEditCatNameInput(c.name); setEditCatColorInput(c.color); }} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}>編集</button>
                      <button onClick={() => setCategories(categories.filter((cat: any) => cat.name !== c.name))} style={{ color: '#ef4444', border: 'none', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>削除</button>
                    </div>
                    <button onClick={() => handleExportCategory(c)} style={{ border: 'none', background: themeColor, color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', padding: '6px 10px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                      <Share2 size={12} /> 共有コードを発行
                    </button>
                  </div>
                </div>
              )}
              
              {/* フィールド一覧 */}
              <div style={{ marginTop: '12px', background: 'var(--input-bg)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-sub)', display: 'block', marginBottom: '8px' }}>記録パーツ</span>
                
                {(c.fields || []).map((f:any) => (
                  <div key={f.id} style={{ marginBottom: '6px' }}>
                    {editingFieldId === f.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px', background: 'var(--card-bg)', padding: '12px', borderRadius: '8px', border: `1px solid ${themeColor}` }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input value={editFieldName} onChange={e => setEditFieldName(e.target.value)} style={{ padding: '6px 8px', fontSize: '0.75rem', flex: 1, height: '34px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)' }} />
                          {f.type === 'number' && (
                             <input value={editFieldUnit} onChange={e => setEditFieldUnit(e.target.value)} placeholder="単位" style={{ padding: '6px 8px', fontSize: '0.75rem', width: '45px', height: '34px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)' }} />
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <button onClick={() => setEditingFieldId(null)} style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}>キャンセル</button>
                          <button onClick={() => saveEditField(c.name, f.id, f.type)} style={{ padding: '6px 16px', fontSize: '0.75rem', borderRadius: '8px', background: themeColor, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>保存</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card-bg)', padding: '6px 10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                        <span style={{ flex: 1, fontWeight: 'bold' }}>・{f.name} <span style={{fontSize:'0.65rem', color:'var(--text-sub)'}}>({f.type})</span></span>
                        <button onClick={() => { setEditingFieldId(f.id); setEditFieldName(f.name); setEditFieldUnit(f.unit || ''); }} style={{ padding: '4px 8px', fontSize: '0.65rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px', cursor: 'pointer' }}>編集</button>
                        <button onClick={() => setCategories((cats: any[]) => cats.map((cat: any) => cat.name === c.name ? {...cat, fields: cat.fields.filter((cf:any) => cf.id !== f.id)} : cat))} style={{ border: 'none', background: '#fee2e2', color: '#ef4444', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 'bold', padding: '4px 8px', cursor: 'pointer' }}>削除</button>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* 新規フィールド追加UI */}
                {editingCatField === c.name ? (
                  <div style={{ marginTop: '12px', padding: '16px', border: `1px solid ${themeColor}`, borderRadius: '12px', background: 'var(--card-bg)' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--text-main)', marginBottom: '12px', display: 'block' }}>記録パーツを追加</span>
                    <select value={newFieldType} onChange={e => setNewFieldType(e.target.value)} style={{ width: '100%', height: '40px', fontSize: '0.8rem', padding: '0 12px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', marginBottom: '8px', color: 'var(--text-main)' }}>
                      {FIELD_TYPES.map((ft: any) => <option key={ft.value} value={ft.value}>{ft.label}</option>)}
                    </select>
                    {newFieldType !== 'wage' && (
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input placeholder="例: 読んだページ数" value={newFieldName} onChange={e => setNewFieldName(e.target.value)} style={{ flex: 2, height: '40px', fontSize: '0.8rem', padding: '0 12px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }} />
                        {newFieldType === 'number' && (
                          <input placeholder="単位" value={newFieldUnit} onChange={e => setNewFieldUnit(e.target.value)} style={{ flex: 1, height: '40px', fontSize: '0.8rem', padding: '0 12px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }} />
                        )}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => setEditingCatField(null)} style={{ flex: 1, padding: '10px', fontSize: '0.85rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer' }}>キャンセル</button>
                      <button onClick={() => addFieldToCategory(c.name)} style={{ flex: 1.5, padding: '10px', fontSize: '0.85rem', background: themeColor, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>追加</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setEditingCatField(c.name); setNewFieldName(''); setNewFieldUnit(''); setNewFieldType('number'); }} style={{ border: 'none', background: 'var(--card-bg)', color: themeColor, fontSize: '0.8rem', fontWeight: '900', padding: '10px 16px', borderRadius: '8px', marginTop: '8px', cursor: 'pointer', width: '100%', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>＋ 記録パーツを手動で追加</button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 新規ジャンル作成 */}
        <div style={{ background: 'var(--card-bg)', padding: '18px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-sub)', display: 'block', marginBottom: '8px' }}>ゼロから新しいジャンルを作る</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="例：サウナ、映画鑑賞" style={{ flex: 1, height: '46px', padding: '0 14px', borderRadius: '12px', border: '2px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 'bold' }} />
            <button onClick={handleAddCategory} style={{ padding: '0 16px', background: themeColor, color: '#fff', border: 'none', borderRadius: '16px', fontWeight: '900', cursor: 'pointer' }}>作成</button>
          </div>
          <ColorSelector value={newCategoryColor} onChange={setNewCategoryColor} />
        </div>

      </div>
    </div>
  );
}