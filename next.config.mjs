import withPWAInit from 'next-pwa';

// 開発環境かどうかを厳密に判定
const isDev = process.env.NODE_ENV !== 'production';

const withPWA = withPWAInit({
  dest: 'public',
  // 開発中は登録もオフにする
  register: !isDev,
  skipWaiting: true,
  // 開発中は完全に機能を停止する
  disable: isDev,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // 👈 静的ファイルとして出力する設定（iOS化に必須）
  images: {
    unoptimized: true, // 👈 アプリ内での画像表示エラーを防ぐ（iOS化に必須）
  },
  // 他の既存の設定があればそのまま残す
};

// 👇 修正：.mjs 形式の正しい書き方（export default）にし、PWAの設定で包んで出力します
export default withPWA(nextConfig);