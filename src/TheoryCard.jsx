import React from "react";

export default function TheoryCard({ metode }) {
  if (!metode) return null;

  return (
    <div className="teori-container">
      <div className="teori-header">
        <div>
          <h3 className="teori-title">Karakteristik &amp; Teori: {metode.label}</h3>
          <p className="redup kecil">{metode.deskripsi}</p>
        </div>
        <span className="teori-badge">{metode.tipe}</span>
      </div>

      <div className="teori-grid">
        <div className="teori-item">
          <span className="teori-label">Orde Konvergensi</span>
          <span className="teori-val font-mono text-cyan">{metode.orde}</span>
        </div>
        <div className="teori-item">
          <span className="teori-label">Syarat Keberlakuan</span>
          <span className="teori-val font-mono text-white">{metode.syarat}</span>
        </div>
        <div className="teori-item col-span-2">
          <span className="teori-label">Rumus Iterasi Utama</span>
          <div className="rumus-highlight-box">
            <span className="rumus-text font-mono">{metode.rumus}</span>
          </div>
        </div>
        <div className="teori-item">
          <span className="teori-label">Kelebihan Utama</span>
          <p className="teori-prose text-green">{metode.kelebihan}</p>
        </div>
        <div className="teori-item">
          <span className="teori-label">Batasan / Titik Lemah</span>
          <p className="teori-prose text-red">{metode.kekurangan}</p>
        </div>
      </div>
    </div>
  );
}