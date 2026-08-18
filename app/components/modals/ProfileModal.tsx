"use client";

import React from "react";
import { User, CheckCircle, Database, Unlock } from "lucide-react";
import ProfileImageCropper from "@/app/components/ProfileImageCropper";
import { saveData } from "@/app/lib/storage";
import { supabase } from "@/app/lib/supabase";
import { createDataBackup } from "@/app/lib/backup";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  cropImageSrc: string | null;
  setCropImageSrc: (src: string | null) => void;
  setCropZoom: (zoom: number) => void;
  setCropPanX: (x: number) => void;
  setCropPanY: (y: number) => void;
  userProfile: any;
  setUserProfile: (profile: any) => void;
  activeUserId: string | null;
  activeUserName: string;
  setActiveUserName: (name: string) => void;
  syncWithCloud: () => void;
  handleLogout: () => void;
  ModalHeader: React.FC<{ title: React.ReactNode; onClose: () => void; rightEl?: React.ReactNode }>;
}

export default function ProfileModal({ isOpen, onClose, cropImageSrc, setCropImageSrc, setCropZoom, setCropPanX, setCropPanY, userProfile, setUserProfile, activeUserId, activeUserName, setActiveUserName, syncWithCloud, handleLogout, ModalHeader }: ProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        onClose();
        setCropImageSrc(null);
      }}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "15px" }}
    >
      <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "400px", borderRadius: "28px", border: "1px solid var(--glass-border)", padding: "24px", background: "var(--bg-main)", color: "var(--text-main)", display: "flex", flexDirection: "column" }}>
        <ModalHeader
          title={cropImageSrc ? "画像のトリミング" : "アカウント設定"}
          onClose={() => {
            onClose();
            setCropImageSrc(null);
          }}
        />

        {cropImageSrc ? (
          <ProfileImageCropper
            imageSrc={cropImageSrc}
            onCancel={() => setCropImageSrc(null)}
            onCropComplete={(pixels: any) => {
              const updatedProfile = {
                ...userProfile,
                avatar: cropImageSrc,
                cropPixels: pixels,
              };
              setUserProfile(updatedProfile);
              saveData("user_profile", activeUserId, updatedProfile);
              setCropImageSrc(null);
            }}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px" }}>
              <label style={{ width: "80px", height: "80px", borderRadius: "50%", background: "var(--input-bg)", border: "2px dashed var(--theme)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", overflow: "hidden", position: "relative" }}>
                {userProfile.avatar ? <img src={userProfile.avatar} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: `${userProfile.avatarPanX || 50}% ${userProfile.avatarPanY || 50}%`, transform: `scale(${userProfile.avatarScale || 1})` }} alt="avatar" /> : <User size={32} color="var(--theme)" />}
                <div style={{ position: "absolute", bottom: 0, width: "100%", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: "0.6rem", textAlign: "center", padding: "2px 0", fontWeight: "bold" }}>変更</div>
                <input
                  type="file"
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setCropImageSrc(ev.target?.result as string);
                        setCropZoom(1);
                        setCropPanX(50);
                        setCropPanY(50);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            <div>
              <label className="form-label">ユーザー名</label>
              <input type="text" className="pop-input" value={activeUserName} onChange={(e) => setActiveUserName(e.target.value)} />
            </div>
            <div>
              <label className="form-label">メールアドレス (セキュリティ連携用)</label>
              <input type="email" className="pop-input" value={userProfile.email || ""} onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })} placeholder="example@mail.com" />
            </div>
            <div>
              <label className="form-label">電話番号 (SMS認証用)</label>
              <input type="tel" className="pop-input" value={userProfile.phone || ""} onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })} placeholder="090-XXXX-XXXX" />
            </div>

            <div style={{ background: "rgba(16,185,129,0.1)", padding: "12px", borderRadius: "12px", display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "8px" }}>
              <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
              <span style={{ fontSize: "0.75rem", color: "var(--text-main)", lineHeight: 1.4 }}>メールアドレス・電話番号を登録することで、データのバックアップとクラウド同期がより安全に行われます。</span>
            </div>

            <button
              onClick={async () => {
                if (!confirm("iPhoneのデータをクラウドに移行しますか？")) return;
                const localEvents = JSON.parse(localStorage.getItem("events") || "[]");
                if (localEvents.length > 0) {
                  const formattedEvents = localEvents.map((e: any) => ({
                    id: e.id,
                    user_id: activeUserId,
                    title: e.title,
                    start_at: e.start,
                    end_at: e.end,
                    category: e.extendedProps?.category || "",
                    metadata: e.extendedProps?.metadata || {},
                  }));
                  await supabase.from("events").upsert(formattedEvents);
                  alert("移行が完了しました！");
                } else {
                  alert("移行するデータがありませんでした。");
                }
              }}
              className="btn-pop"
              style={{ width: "100%", marginTop: "16px", background: "#f59e0b", padding: "14px", border: "none", color: "#fff", fontWeight: "bold", borderRadius: "12px", cursor: "pointer" }}
            >
              📱 iPhoneのデータをクラウドに移行する
            </button>

            <button onClick={syncWithCloud} className="btn-secondary" style={{ width: "100%", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", border: `1px dashed var(--theme)`, color: "var(--theme)", borderRadius: "12px", background: "transparent", cursor: "pointer", fontWeight: "bold", marginTop: "16px" }}>
              <Database size={16} /> クラウド同期（手動バックアップ）
            </button>

            <button
              onClick={async () => {
                const userId = activeUserId;
                const result = await createDataBackup(userId);
                if (result.success) {
                  alert(`引き継ぎコードを発行しました: ${result.code}\n\nこのコードを新しい端末の「読み込み」画面で入力してください。`);
                } else {
                  alert("バックアップに失敗しました。");
                }
              }}
              style={{
                width: "100%",
                marginTop: "8px",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "var(--input-bg)",
                color: "var(--theme)",
                border: "1px solid var(--theme)",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              <Database size={16} /> データを書き出す（バックアップ）
            </button>

            <button
              onClick={() => {
                onClose();
                handleLogout();
              }}
              style={{ width: "100%", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid #fca5a5", borderRadius: "12px", cursor: "pointer", fontWeight: "bold", marginTop: "8px", transition: "all 0.2s" }}
            >
              <Unlock size={16} /> ログアウトしてログイン画面に戻る
            </button>

            <button onClick={onClose} className="btn-pop" style={{ width: "100%", marginTop: "16px", padding: "14px" }}>
              保存して閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
