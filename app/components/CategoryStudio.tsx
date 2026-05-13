'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Clock, Trash2, Sparkles, Download, GripVertical } from 'lucide-react';
import { FIELD_TYPES, HOURS, MINUTES } from '@/app/lib/constants';

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
  const [newCategoryAllowPhoto, setNewCategoryAllowPhoto] = useState(false);
  const [newCategoryShowInDashboard, setNewCategoryShowInDashboard] = useState(true); // 👈 追加

  const [editCatAllowPhoto, setEditCatAllowPhoto] = useState(false);
  const [editCatShowInDashboard, setEditCatShowInDashboard] = useState(true); // 👈 追加

  const [aiTemplatePrompt, setAiTemplatePrompt] = useState('');
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);

  // 👇 開閉状態の管理と、ドラッグ中のアイテムを保持するRef
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const dragItem = useRef<number | null>(null);

  if (!isOpen) return null;

  const ModalHeader = ({ title, onCloseBtn }: { title: string, onCloseBtn: () => void }) => (
    <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '8px' }}>
      <h2 className="modal-title" style={{ margin: 0, color: themeColor, fontSize: '1.15rem', fontWeight: 900, letterSpacing: '0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</h2>
      <button onClick={onCloseBtn} className="btn-close" style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '50%', width: '36px', height: '36px', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-sub)', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s', flexShrink: 0 }}>×</button>
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

  const handleAddCategory = () => {
    if (!newCategoryName.trim() || categories.find((c: any) => c.name === newCategoryName.trim())) return;
    setCategories([...categories, { name: newCategoryName.trim(), color: newCategoryColor, allowPhoto: newCategoryAllowPhoto, hideFromDashboard: !newCategoryShowInDashboard, fields: [] }]);
    setNewCategoryName('');
    setNewCategoryAllowPhoto(false);
    setNewCategoryShowInDashboard(true); // 👈 追加
  };

  const addFieldToCategory = (catName: string) => {
    // 👇 修正：スコアの場合も、固定の名前（'試合結果'など）を自動でセットする
    const finalName = newFieldType === 'wage' ? '給与(時給計算)' : (newFieldType === 'score' ? '試合結果' : newFieldName.trim());
    if(!finalName && newFieldType !== 'wage' && newFieldType !== 'score') return;
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

  const deleteField = (catName: string, fieldId: string) => {
    if (confirm('この記録パーツを削除しますか？')) {
      setCategories((cats: any[]) => cats.map((c: any) => {
        if (c.name === catName) return { ...c, fields: (c.fields || []).filter((f: any) => f.id !== fieldId) };
        return c;
      }));
    }
  };

  const moveField = (catName: string, index: number, direction: number) => {
    setCategories((cats: any[]) => cats.map((c: any) => {
      if (c.name === catName) {
        const newFields = [...(c.fields || [])];
        if (index + direction >= 0 && index + direction < newFields.length) {
          const temp = newFields[index];
          newFields[index] = newFields[index + direction];
          newFields[index + direction] = temp;
        }
        return { ...c, fields: newFields };
      }
      return c;
    }));
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
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px' }}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ width: '92%', maxWidth: '480px', borderRadius: '28px', border: '1px solid var(--glass-border)', overflowY: 'auto', maxHeight: '80dvh', background: 'var(--bg-main)', color: 'var(--text-main)', padding: '24px' }}>
        <ModalHeader title="テンプレート・スタジオ" onCloseBtn={onClose} />
        
        {/* AI生成とインポート */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <div style={{ flex: 1, background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, rgba(236,72,153,0.1) 100%)', border: '1px solid #8b5cf6', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 15px rgba(139,92,246,0.1)', minWidth: 0 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '900', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '8px', whiteSpace: 'nowrap' }}>
              <Sparkles size={14} fill="#8b5cf6" /> AIでオリジナルを生成
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
        <div style={{ marginBottom: '24px', maxHeight: '45vh', overflowY: 'auto', paddingRight: '4px' }} className="hide-scrollbar">
          {categories.map((c: any, catIndex: number) => {
            const isExpanded = expandedCats.includes(c.name);
            
            return (
            <div 
              key={c.name} 
              draggable
              onDragStart={() => dragItem.current = catIndex}
              onDragEnter={() => {
                if (dragItem.current !== null && dragItem.current !== catIndex) {
                  const newCats = [...categories];
                  const dragged = newCats.splice(dragItem.current, 1)[0];
                  newCats.splice(catIndex, 0, dragged);
                  dragItem.current = catIndex;
                  setCategories(newCats);
                }
              }}
              onDragEnd={() => dragItem.current = null}
              onDragOver={(e) => e.preventDefault()}
              style={{ padding: '12px', marginBottom: '12px', borderLeft: `6px solid ${c.color}`, background: 'var(--card-bg)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}
            >
              
              {/* ジャンル名と色の編集 */}
              {editingCategoryNameOrigin === c.name ? (
                <div style={{ padding: '8px', background: 'var(--input-bg)', borderRadius: '8px', marginBottom: '8px' }}>
                  <input value={editCatNameInput} onChange={e => setEditCatNameInput(e.target.value)} style={{ height: '32px', marginBottom: '8px', width: '100%', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'var(--text-main)' }} />
                  <ColorSelector value={editCatColorInput} onChange={setEditCatColorInput} />
                  
                  {/* 👇 追加：写真・画像を許可するチェックボックス */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    <input type="checkbox" checked={editCatAllowPhoto} onChange={e => setEditCatAllowPhoto(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: themeColor }} />
                    写真・画像を記録する
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                    <input type="checkbox" checked={editCatShowInDashboard} onChange={e => setEditCatShowInDashboard(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: themeColor }} />
                    ダッシュボードに記録を表示する
                  </label>

                  <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
                    <button onClick={() => {
                      if (!editCatNameInput.trim()) return;
                      // 👇 修正：allowPhoto も一緒に更新する
                      setCategories((cats: any[]) => cats.map((cat: any) => cat.name === c.name ? { ...cat, name: editCatNameInput, color: editCatColorInput, allowPhoto: editCatAllowPhoto, hideFromDashboard: !editCatShowInDashboard } : cat));                      setEditingCategoryNameOrigin(null);
                    }} style={{ flex: 1, padding: '6px', background: themeColor, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>保存</button>
                    <button onClick={() => setEditingCategoryNameOrigin(null)} style={{ flex: 1, padding: '6px', background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)', borderRadius: '8px', cursor: 'pointer' }}>取消</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    <div style={{ color: 'var(--text-sub)', display: 'flex', alignItems: 'center', cursor: 'grab' }}>
                      <GripVertical size={18} />
                    </div>
                    
                    <div 
                      onClick={() => setExpandedCats(prev => isExpanded ? prev.filter(n => n !== c.name) : [...prev, c.name])}
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', padding: '4px 0' }}
                    >
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: c.color, flexShrink: 0 }} />
                      <span style={{ fontWeight: '900', fontSize: '1.05rem', color: 'var(--text-main)', wordBreak: 'break-word', lineHeight: 1.2 }}>{c.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginLeft: '4px', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', marginLeft: '8px' }}>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      {/* 👇 修正：編集ボタンを押した時に、現在の写真許可状態（allowPhoto）を読み込む */}
                      <button onClick={() => { setEditingCategoryNameOrigin(c.name); setEditCatNameInput(c.name); setEditCatColorInput(c.color); setEditCatAllowPhoto(c.allowPhoto || false); setEditCatShowInDashboard(c.hideFromDashboard !== true); setExpandedCats(prev => prev.includes(c.name) ? prev : [...prev, c.name]); }} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}>編集</button>                      <button onClick={() => { if(confirm(`「${c.name}」を本当に削除しますか？`)) setCategories(categories.filter((cat: any) => cat.name !== c.name)); }} style={{ color: '#ef4444', border: 'none', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>削除</button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* フィールド一覧 (開いている時のみ) */}
              {isExpanded && (
                <div style={{ marginTop: '12px', background: 'var(--input-bg)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-sub)', display: 'block', marginBottom: '8px' }}>記録パーツ</span>
                  
                  {(c.fields || []).map((f:any, idx: number) => (
                    <div key={f.id} style={{ marginBottom: '6px' }}>
                      {editingFieldId === f.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', marginTop: '4px', background: 'var(--card-bg)', padding: '12px', borderRadius: '8px', border: `1px solid ${themeColor}` }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              <input value={editFieldName} onChange={e => setEditFieldName(e.target.value)} style={{ padding: '6px 8px', fontSize: '0.75rem', flex: '1 1 120px', minWidth: 0, height: '34px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)' }} />
                              {f.type === 'number' && (
                                 <input value={editFieldUnit} onChange={e => setEditFieldUnit(e.target.value)} placeholder="単位" style={{ padding: '6px 8px', fontSize: '0.75rem', flex: '1 1 60px', minWidth: 0, height: '34px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)' }} />
                              )}
                            </div>
                          </div>
                          {f.type === 'wage' && (
                            <WageRuleEditor rules={editWageRules} setRules={setEditWageRules} themeColor={themeColor} />
                          )}
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                            <button onClick={() => setEditingFieldId(null)} style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', cursor: 'pointer' }}>キャンセル</button>
                            <button onClick={() => saveEditField(c.name, f.id, f.type)} style={{ padding: '6px 16px', fontSize: '0.75rem', borderRadius: '8px', background: themeColor, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>保存</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--card-bg)', padding: '6px 10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', fontSize: '0.75rem', color: 'var(--text-main)' }}>
                          <span style={{ flex: 1, fontWeight: 'bold' }}>・{f.name} <span style={{fontSize:'0.65rem', color:'var(--text-sub)'}}>({f.type})</span></span>
                          
                          <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginRight: '4px' }}>
                            <button onClick={() => moveField(c.name, idx, -1)} disabled={idx === 0} style={{ border: 'none', background: 'transparent', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.2 : 1, padding: '2px 4px', color: 'var(--text-sub)' }}>▲</button>
                            <button onClick={() => moveField(c.name, idx, 1)} disabled={idx === (c.fields?.length || 0) - 1} style={{ border: 'none', background: 'transparent', cursor: idx === (c.fields?.length || 0) - 1 ? 'default' : 'pointer', opacity: idx === (c.fields?.length || 0) - 1 ? 0.2 : 1, padding: '2px 4px', color: 'var(--text-sub)' }}>▼</button>
                            <button onClick={() => deleteField(c.name, f.id)} style={{ border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', padding: '4px 6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '4px' }}><Trash2 size={14}/></button>
                          </div>

                          <button onClick={() => { 
                            setEditingFieldId(f.id); 
                            setEditFieldName(f.name); 
                            setEditFieldUnit(f.unit || ''); 
                            setEditWageRules(f.wageRules || [{ start: '00:00', end: '23:59', wage: '1000' }]); 
                          }} style={{ padding: '4px 8px', fontSize: '0.65rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px', cursor: 'pointer' }}>編集</button>
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
                        {/* 👇 追加：写真・画像を記録パーツとして追加できるようにする */}
                        <option value="photo">写真・画像</option>
                      </select>
                      {newFieldType !== 'wage' ? (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                          {newFieldType === 'score' ? (
                            <div style={{ width: '100%', height: '40px', background: 'var(--input-bg)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 'bold', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              「応援チーム vs 相手チーム」のスコア入力
                            </div>
                          ) : (
                            <>
                              <input placeholder={newFieldType === 'score' ? "例: 応援チーム名（巨人など）" : "例: 読んだページ数"} value={newFieldName} onChange={e => setNewFieldName(e.target.value)} style={{ flex: '1 1 120px', minWidth: 0, height: '40px', fontSize: '0.8rem', padding: '0 12px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }} />
                              {newFieldType === 'number' && (
                                <input placeholder="単位" value={newFieldUnit} onChange={e => setNewFieldUnit(e.target.value)} style={{ flex: '1 1 60px', minWidth: 0, height: '40px', fontSize: '0.8rem', padding: '0 12px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }} />
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <div style={{ marginBottom: '16px' }}>
                          <WageRuleEditor rules={newWageRules} setRules={setNewWageRules} themeColor={themeColor} />
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setEditingCatField(null)} style={{ flex: 1, padding: '10px 4px', fontSize: '0.85rem', background: 'var(--card-bg)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap' }}>キャンセル</button>
                        <button onClick={() => addFieldToCategory(c.name)} style={{ flex: 1, padding: '10px 4px', fontSize: '0.85rem', background: themeColor, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>追加</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingCatField(c.name); setNewFieldName(''); setNewFieldUnit(''); setNewFieldType('number'); setNewWageRules([{ start: '00:00', end: '23:59', wage: '1000' }]); }} style={{ border: 'none', background: 'var(--card-bg)', color: themeColor, fontSize: '0.8rem', fontWeight: '900', padding: '10px 16px', borderRadius: '8px', marginTop: '8px', cursor: 'pointer', width: '100%', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>＋ 記録パーツを手動で追加</button>
                  )}
                </div>
              )}
            </div>
          );
          })}
        </div>

        {/* 新規ジャンル作成 */}
        <div style={{ background: 'var(--card-bg)', padding: '18px', borderRadius: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-sub)', display: 'block', marginBottom: '8px' }}>ゼロから新しいジャンルを作る</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="例：サウナ、映画鑑賞" style={{ flex: 1, minWidth: 0, height: '46px', padding: '0 12px', borderRadius: '12px', border: '2px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: 'bold' }} />
            <button onClick={handleAddCategory} style={{ padding: '0 16px', background: themeColor, color: '#fff', border: 'none', borderRadius: '16px', fontSize: '0.9rem', fontWeight: '900', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>作成</button>
          </div>
          <ColorSelector value={newCategoryColor} onChange={setNewCategoryColor} />
          
          {/* 👇 追加：写真・画像を許可するチェックボックス */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
            <input type="checkbox" checked={newCategoryAllowPhoto} onChange={e => setNewCategoryAllowPhoto(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: themeColor }} />
            写真・画像を記録する
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
            <input type="checkbox" checked={newCategoryShowInDashboard} onChange={e => setNewCategoryShowInDashboard(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: themeColor }} />
            ダッシュボードに記録を表示する
          </label>
        </div>

      </div>
    </div>
  );
}

const WageRuleEditor = ({ rules, setRules, themeColor }: { rules: any[], setRules: React.Dispatch<React.SetStateAction<any[]>>, themeColor: string }) => {
  const hours = Array.from({length: 24}, (_,i) => String(i).padStart(2, '0'));
  const mins = ['00', '10', '20', '30', '40', '50'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', background: 'var(--bg-main)', padding: '10px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
      <style>{`
        .no-spin::-webkit-outer-spin-button, .no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .no-spin { -moz-appearance: textfield; }
      `}</style>
      
      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: themeColor, marginBottom: '4px' }}>時間帯と時給の設定</span>
      
      {rules.map((rule, idx) => (
        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', paddingBottom: '6px', borderBottom: idx !== rules.length - 1 ? '1px dashed var(--border-color)' : 'none' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 2px', flexShrink: 0 }}>
            <select style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', fontWeight: 'bold', padding: '2px', appearance: 'none', textAlign: 'center' }} value={rule.start.split(':')[0]} onChange={e => {
              const newRules = [...rules]; newRules[idx].start = `${e.target.value}:${rule.start.split(':')[1]}`; setRules(newRules);
            }}>
              {hours.map(h => <option key={`s-h-${h}`} value={h}>{h}</option>)}
            </select>
            <span>:</span>
            <select style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', fontWeight: 'bold', padding: '2px', appearance: 'none', textAlign: 'center' }} value={rule.start.split(':')[1]} onChange={e => {
              const newRules = [...rules]; newRules[idx].start = `${rule.start.split(':')[0]}:${e.target.value}`; setRules(newRules);
            }}>
              {mins.map(m => <option key={`s-m-${m}`} value={m}>{m}</option>)}
            </select>
          </div>
          
          <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', flexShrink: 0 }}>〜</span>
          
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 2px', flexShrink: 0 }}>
            <select style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', fontWeight: 'bold', padding: '2px', appearance: 'none', textAlign: 'center' }} value={rule.end.split(':')[0]} onChange={e => {
              const newRules = [...rules]; newRules[idx].end = `${e.target.value}:${rule.end.split(':')[1]}`; setRules(newRules);
            }}>
              {hours.map(h => <option key={`e-h-${h}`} value={h}>{h}</option>)}
            </select>
            <span>:</span>
            <select style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.85rem', fontWeight: 'bold', padding: '2px', appearance: 'none', textAlign: 'center' }} value={rule.end.split(':')[1]} onChange={e => {
              const newRules = [...rules]; newRules[idx].end = `${rule.end.split(':')[0]}:${e.target.value}`; setRules(newRules);
            }}>
              {[...mins, '59'].map(m => <option key={`e-m-${m}`} value={m}>{m}</option>)}
            </select>
          </div>
          
          <input type="number" className="no-spin" style={{ width: '70px', height: '28px', padding: '0 6px', fontSize: '0.9rem', textAlign: 'right', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--input-bg)', color: 'var(--text-main)', flexShrink: 0 }} placeholder="時給" value={rule.wage} onChange={e => {
            const newRules = [...rules]; newRules[idx].wage = e.target.value; setRules(newRules);
          }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 'bold', flexShrink: 0 }}>円</span>
          
          {rules.length > 1 && (
            <button onClick={() => setRules(rules.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0 4px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
      <button onClick={() => setRules([...rules, { start: '00:00', end: '23:59', wage: '1000' }])} style={{ background: 'transparent', border: `1px dashed ${themeColor}`, color: themeColor, borderRadius: '6px', padding: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '2px' }}>
        ＋ 時間帯を追加
      </button>
    </div>
  );
};