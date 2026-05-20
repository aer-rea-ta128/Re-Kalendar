'use client';
import dynamic from 'next/dynamic';

// 🌟 先ほど分けた SmartLifeOS.tsx を、サーバー(SSR)を通さずに直接ブラウザで読み込む
const SmartLifeOS = dynamic(() => import('./SmartLifeOS'), {
  ssr: false,
  loading: () => <div style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>読み込み中...</div>
});

export default function Page() {
  return <SmartLifeOS />;
}