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
          <div className="teori-kicker">ANALISIS STRUKTURAL KODE</div>
          <h3 className="bedah-title">Bedah Arsitektur &amp; Logika</h3>
          <p className="redup kecil">
            Pilih modul komputasi untuk membedah implementasi algoritma dan memproyeksikan rentang baris di editor.
          </p>
        </div>
      </div>

      <div className="accordion-list">
        {BEDAH_KODE.map((item, idx) => {
          const aktif = bukaId === item.id;
          return (
            <div key={item.id} className={`accordion-card ${aktif ? "active" : ""}`}>
              <button
                type="button"
                className="accordion-header-btn"
                onClick={() => toggle(item)}
              >
                <div className="accordion-title-wrap">
                  <div className="accordion-title-row">
                    <span className="accordion-idx font-mono">0{idx + 1}</span>
                    <span className="accordion-title-text">{item.judul}</span>
                  </div>
                  <div className="accordion-tags">
                    <span className="badge-tag">{item.tag}</span>
                    <span className="badge-line font-mono">
                      BARIS {item.baris[0]}–{item.baris[1]}
                    </span>
                  </div>
                </div>
                <div className={`accordion-indicator ${aktif ? "active" : ""}`}>
                  <svg
                    className={`accordion-chevron ${aktif ? "rotate" : ""}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {aktif && (
                <div className="accordion-body">
                  <div className="accordion-summary-box">
                    <span className="summary-label">RINGKASAN METODE:</span>
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
                      <span className="btn-focus-dot" />
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