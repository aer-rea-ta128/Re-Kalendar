'use client';
import dynamic from 'next/dynamic';

// 読み込み先を確実に指定
const SmartLifeOS = dynamic(() => import('./SmartLifeOS'), {
  ssr: false,
  loading: () => <div>読み込み中...</div>
});

export default function Page() {
  return <SmartLifeOS />;
}