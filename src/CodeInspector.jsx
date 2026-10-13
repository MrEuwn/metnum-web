import React, { useState } from "react";
import { BEDAH_KODE } from "./bedah.js";

export default function CodeInspector({ rentangAktif, onPilihRentang }) {
  const [bukaId, setBukaId] = useState("metode_biseksi");

  const toggle = (item) => {
    if (bukaId === item.id) {
      setBukaId(null);
      onPilihRentang(null);
    } else {
      setBukaId(item.id);
      onPilihRentang(item.baris);
    }
  };

  return (
    <div className="bedah-container">
      <div className="bedah-header">
        <div>
          <h3 className="bedah-title">Bedah Struktur &amp; Logika Kode</h3>
          <p className="redup kecil">
            Klik modul di bawah untuk menelaah penjelasan algoritma dan menyorot baris kode terkait secara otomatis.
          </p>
        </div>
      </div>

      <div className="accordion-list">
        {BEDAH_KODE.map((item) => {
          const aktif = bukaId === item.id;
          return (
            <div key={item.id} className={`accordion-card ${aktif ? "active" : ""}`}>
              <button
                type="button"
                className="accordion-header-btn"
                onClick={() => toggle(item)}
              >
                <div className="accordion-title-wrap">
                  <span className="accordion-title-text">{item.judul}</span>
                  <div className="accordion-tags">
                    <span className="badge-tag">{item.tag}</span>
                    <span className="badge-line">
                      L{item.baris[0]}–{item.baris[1]}
                    </span>
                  </div>
                </div>
                <span className={`accordion-arrow ${aktif ? "rotate" : ""}`}>▾</span>
              </button>

              {aktif && (
                <div className="accordion-body">
                  <div className="accordion-summary-box">
                    <span className="summary-label">Ringkasan Konsep:</span>
                    <p className="summary-text">{item.ringkasan}</p>
                  </div>
                  <div className="accordion-detail-text">
                    <p>{item.detail}</p>
                  </div>
                  <div className="accordion-footer-action">
                    <button
                      type="button"
                      className="btn-focus-code"
                      onClick={() => onPilihRentang(item.baris)}
                    >
                      Fokuskan Baris {item.baris[0]}–{item.baris[1]} di Editor
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}