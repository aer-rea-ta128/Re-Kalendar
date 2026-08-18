"use client";

import React, { useState } from "react";
import Cropper from "react-easy-crop";

interface ProfileImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedAreaPixels: any) => void;
  onCancel: () => void;
}

export default function ProfileImageCropper({ imageSrc, onCropComplete, onCancel }: ProfileImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleCropComplete = (croppedArea: any, pixels: any) => {
    setCroppedAreaPixels(pixels);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* クロップエリアのコンテナ（高さをしっかり確保） */}
      <div style={{ position: "relative", width: "100%", height: "260px", background: "#333", borderRadius: "16px", overflow: "hidden" }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1} // 1:1 の正方形
          cropShape="round" // 丸型に見せる（アイコン用）
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>

      <div style={{ textAlign: "center", fontSize: "0.75rem", color: "var(--text-sub)", fontWeight: "bold" }}>画像をドラッグして移動 / ピンチ（スクロール）でズーム</div>

      {/* 操作ボタン */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button type="button" onClick={onCancel} className="btn-secondary" style={{ flex: 1, padding: "12px", borderRadius: "12px" }}>
          戻る
        </button>
        <button type="button" onClick={() => onCropComplete(croppedAreaPixels)} className="btn-pop" style={{ flex: 1, padding: "12px", borderRadius: "12px" }}>
          適用する
        </button>
      </div>
    </div>
  );
}
