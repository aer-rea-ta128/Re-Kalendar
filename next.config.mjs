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
  reactStrictMode: true,
};

export default withPWA(nextConfig);