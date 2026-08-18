import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#4D96FF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "light", // アプリ全体のダークモード影響を避ける設定のみ残します
};

export const metadata: Metadata = {
  title: "Re-calendar",
  description: "カレンダー＆ライフログアプリ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Re-calendar", // ホーム画面での表示名
  },
  // 以下を追加
  icons: {
    apple: "/icon_Re-calendar.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
