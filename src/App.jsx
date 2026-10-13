import React, { useEffect, useMemo, useRef, useState } from "react";
import CodePane from "./CodePane.jsx";
import Vis from "./Vis.jsx";
import CodeInspector from "./CodeInspector.jsx";
import TheoryCard from "./TheoryCard.jsx";
import { METODE, buatF, jejakMain } from "./engine.js";
import { PRESET_FUNGSI } from "./bedah.js";

const KECEPATAN = [
  ["Lambat", 1000],
  ["Sedang", 550],
  ["Cepat", 250],
  ["Kilat", 90],
];

export default function App() {
  const [expr, setExpr] = useState("x**2 - 4*x - 1");
  const [kunci, setKunci] = useState("biseksi");
  const [masukan, setMasukan] = useState({});
  const [idx, setIdx] = useState(-1);
  const [main, setMain] = useState(false);
  const [laju, setLaju] = useState(550);
  const [galat, setGalat] = useState("");
  const [sesi, setSesi] = useState({ events: [], hasil: null, fn: null });
  const [tabKanan, setTabKanan] = useState("simulasi"); // 'simulasi' | 'bedah' | 'teori'
  const [sorotanRentang, setSorotanRentang] = useState(null);

  const metode = METODE[kunci];
  const kunciMetode = kunci;

  const params = useMemo(() => {
    const out = {};
    for (const k of metode.masukan) {
      out[k] = Number(masukan[`${kunciMetode}.${k}`] ?? metode.default[k]);
    }
    return out;
  }, [kunciMetode, masukan, metode]);

  const setParam = (k, v) =>
    setMasukan((s) => ({ ...s, [`${kunciMetode}.${k}`]: v }));

  // Muat preset fungsi
  const terapkanPreset = (preset) => {
    setExpr(preset.expr);
    if (preset.params && preset.params[kunciMetode]) {
      const p = preset.params[kunciMetode];
      setMasukan((s) => {
        const next = { ...s };
        Object.entries(p).forEach(([k, val]) => {
          next[`${kunciMetode}.${k}`] = val;
        });
        return next;
      });
    }
  };

  function jalankan(otomatis = true) {
    setGalat("");
    try {
      const fn = buatF(expr);
      const tol = 0.00001;
      const maks = 100;
      const salah = metode.masukan.some((k) => !isFinite(params[k]));
      if (salah) throw new Error("Semua parameter batas/tebakan awal harus berupa angka.");

      const hasil = metode.hitung(fn, params, tol, maks);
      const awal = jejakMain({
        metodeKey: kunciMetode,
        label: metode.label,
        expr,
        metode: metode.nomor,
      });
      const events = [...awal, ...hasil.events];
      setSesi({ events, hasil: hasil.hasil, fn });
      setIdx(0);
      setMain(otomatis);
      setTabKanan("simulasi");
      setSorotanRentang(null);
    } catch (e) {
      setGalat(e.message);
      setSesi({ events: [], hasil: null, fn: null });
      setIdx(-1);
      setMain(false);
    }
  }

  // putar otomatis
  useEffect(() => {
    if (!main) return;
    if (idx >= sesi.events.length - 1) {
      setMain(false);
      return;
    }
    const t = setTimeout(() => setIdx((i) => i + 1), laju);
    return () => clearTimeout(t);
  }, [main, idx, laju, sesi.events.length]);

  // pintasan papan tulis
  useEffect(() => {
    const h = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setMain(false);
        setIdx((i) => Math.min(i + 1, sesi.events.length - 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setMain(false);
        setIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === " ") {
        e.preventDefault();
        setMain((p) => !p);
      } else if (e.key === "r" || e.key === "R") {
        setIdx(0);
        setMain(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [sesi.events.length]);

  const kejadian = idx >= 0 ? sesi.events[idx] : null;

  const keluaran = useMemo(
    () =>
      sesi.events
        .slice(0, idx + 1)
        .filter((e) => e.output)
        .map((e) => ({ line: e.line, teks: e.output })),
    [sesi.events, idx]
  );

  const konsolRef = useRef(null);
  useEffect(() => {
    if (konsolRef.current) {
      konsolRef.current.scrollTop = konsolRef.current.scrollHeight;
    }
  }, [keluaran.length]);

  // Status eksekusi badge
  const statusEksekusi = useMemo(() => {
    if (!sesi.events.length) return { teks: "Siap", kelas: "badge-siap" };
    if (main) return { teks: "Mengiterasi...", kelas: "badge-running" };
    if (idx === sesi.events.length - 1) {
      if (sesi.hasil?.gagal) return { teks: "Gagal Konvergen", kelas: "badge-gagal" };
      return { teks: "Konvergen (Selesai)", kelas: "badge-selesai" };
    }
    return { teks: "Dijeda (Langkah Manual)", kelas: "badge-jeda" };
  }, [sesi.events.length, main, idx, sesi.hasil?.gagal]);

  return (
    <div className="app-shell">
      {/* Top Professional Header */}
      <header className="top-header">
        <div className="header-inner">
          <div className="brand-group">
            <div className="brand-icon">
              <span>ƒ(x)</span>
            </div>
            <div>
              <div className="brand-title-wrap">
                <h1 className="brand-title">METNUM VISUALIZER</h1>
                <span className="badge-academic">STRUKTUR DATA &amp; METNUM</span>
              </div>
              <p className="brand-subtitle">
                Eksplorasi Interaktif &amp; Bedah Struktur Kode Pencari Akar Persamaan Non-Linier
              </p>
            </div>
          </div>

          <div className="header-status-area">
            <div className={`status-pill ${statusEksekusi.kelas}`}>
              <span className="status-indicator-dot" />
              <span className="status-text">{statusEksekusi.teks}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Algorithm Tabs Navigation Bar */}
        <section className="algo-selector-bar">
          <div className="algo-tabs-list">
            {Object.entries(METODE).map(([k, m]) => {
              const aktif = k === kunciMetode;
              return (
                <button
                  key={k}
                  type="button"
                  className={`algo-tab-btn ${aktif ? "active" : ""}`}
                  onClick={() => {
                    setKunci(k);
                    setSesi({ events: [], hasil: null, fn: null });
                    setIdx(-1);
                    setMain(false);
                    setSorotanRentang(null);
                  }}
                >
                  <span className="algo-num">0{m.nomor}</span>
                  <div className="algo-tab-info">
                    <span className="algo-tab-title">{m.label}</span>
                    <span className="algo-tab-tag">{m.tipe.split(" ")[0]}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Input & Control Dashboard Toolbar */}
        <section className="panel control-panel">
          {/* Row 1: Function, Preset, and Parameters */}
          <div className="input-toolbar-row">
            <div className="input-field-group flex-1">
              <label htmlFor="fxInput" className="field-label">
                Fungsi Matematika f(x):
              </label>
              <div className="input-with-hint">
                <input
                  id="fxInput"
                  value={expr}
                  onChange={(e) => setExpr(e.target.value)}
                  placeholder="x**2 - 4*x - 1"
                  className="input-code font-mono"
                />
                <span className="hint-pill">Pangkat pakai **</span>
              </div>
            </div>

            {/* Presets Quick Picker */}
            <div className="input-field-group">
              <label className="field-label">Preset Contoh Uji:</label>
              <select
                className="select-custom"
                onChange={(e) => {
                  const p = PRESET_FUNGSI.find((x) => x.expr === e.target.value);
                  if (p) terapkanPreset(p);
                }}
                defaultValue=""
              >
                <option value="" disabled>
                  Pilih Preset Persamaan...
                </option>
                {PRESET_FUNGSI.map((p) => (
                  <option key={p.expr} value={p.expr}>
                    {p.nama} ({p.expr})
                  </option>
                ))}
              </select>
            </div>

            {/* Dynamic Method Boundary / Initial Guess Inputs */}
            <div className="params-cluster">
              {metode.masukan.map((k) => (
                <div className="param-field" key={k}>
                  <label htmlFor={`input-${k}`} className="param-label font-mono">
                    {k} =
                  </label>
                  <input
                    id={`input-${k}`}
                    type="number"
                    step="any"
                    value={masukan[`${kunciMetode}.${k}`] ?? metode.default[k]}
                    onChange={(e) => setParam(k, e.target.value)}
                    className="param-input font-mono"
                  />
                </div>
              ))}
            </div>

            {/* Execute Run Button */}
            <button
              type="button"
              className="btn-primary-action"
              onClick={() => jalankan(true)}
            >
              <span className="btn-icon">▶</span> Jalankan Simulasi
            </button>
          </div>

          {/* Row 2: Playback Timeline & Speed Controls */}
          <div className="playback-toolbar-row">
            <div className="playback-controls-group">
              <button
                type="button"
                className="btn-playback"
                onClick={() => setMain((p) => !p)}
                disabled={!sesi.events.length}
                title="Spasi untuk Putar / Jeda"
              >
                {main ? "Jeda" : "Putar"}
              </button>
              <button
                type="button"
                className="btn-playback"
                onClick={() => {
                  setMain(false);
                  setIdx((i) => Math.max(0, i - 1));
                }}
                disabled={!sesi.events.length || idx <= 0}
                title="Mundur Satu Langkah"
              >
                ‹ Mundur
              </button>
              <button
                type="button"
                className="btn-playback"
                onClick={() => {
                  setMain(false);
                  setIdx((i) => Math.min(sesi.events.length - 1, i + 1));
                }}
                disabled={!sesi.events.length || idx >= sesi.events.length - 1}
                title="Maju Satu Langkah"
              >
                Maju ›
              </button>
              <button
                type="button"
                className="btn-playback"
                onClick={() => {
                  setMain(false);
                  setIdx(0);
                }}
                disabled={!sesi.events.length}
              >
                Awal
              </button>
              <button
                type="button"
                className="btn-playback"
                onClick={() => {
                  setMain(false);
                  setIdx(sesi.events.length - 1);
                }}
                disabled={!sesi.events.length}
              >
                Akhir
              </button>
            </div>

            <div className="speed-step-group">
              <div className="speed-selector">
                <span className="field-label-inline">Tempo:</span>
                <select
                  value={laju}
                  onChange={(e) => setLaju(Number(e.target.value))}
                  className="select-custom select-sm"
                >
                  {KECEPATAN.map(([n, v]) => (
                    <option key={n} value={v}>
                      {n} ({v}ms)
                    </option>
                  ))}
                </select>
              </div>

              <div className="step-counter font-mono">
                {sesi.events.length ? (
                  <>
                    <span className="step-now">{idx + 1}</span>
                    <span className="step-divider">/</span>
                    <span className="step-total">{sesi.events.length} langkah</span>
                  </>
                ) : (
                  <span className="redup">Belum dijalankan</span>
                )}
              </div>
            </div>
          </div>

          {galat && (
            <div className="error-banner">
              <span className="error-badge">Peringatan:</span>
              <span>{galat}</span>
            </div>
          )}
        </section>

        {/* Two-Column Workspace Layout */}
        <div className="workspace-grid">
          {/* Left Column: Code Inspector View (metode_numerik.py) */}
          <section className="panel code-viewer-panel">
            <div className="panel-header-row">
              <div className="file-tab">
                <span className="file-icon-badge">PY</span>
                <span className="file-name font-mono">metode_numerik.py</span>
                <span className="file-badge">194 Baris</span>
              </div>
              <div className="code-hint redup kecil">
                {sorotanRentang
                  ? `Sorotan Modul: L${sorotanRentang[0]}–L${sorotanRentang[1]}`
                  : kejadian
                  ? `Eksekusi Aktif: Baris ${kejadian.line}`
                  : "Klik modul bedah kode atau jalankan simulasi"}
              </div>
            </div>

            <CodePane
              kejadian={kejadian}
              sorotanRentang={sorotanRentang}
              onKlikBaris={(no) => {
                if (sesi.events.length) {
                  const targetIdx = sesi.events.findIndex((e) => e.line === no);
                  if (targetIdx >= 0) {
                    setMain(false);
                    setIdx(targetIdx);
                  }
                }
              }}
            />
          </section>

          {/* Right Column: Multi-Tab Interactive Deck */}
          <section className="panel right-deck-panel">
            {/* Sub-tab Navigation */}
            <div className="deck-nav-tabs">
              <button
                type="button"
                className={`deck-tab-btn ${tabKanan === "simulasi" ? "active" : ""}`}
                onClick={() => setTabKanan("simulasi")}
              >
                Status &amp; Terminal
              </button>
              <button
                type="button"
                className={`deck-tab-btn ${tabKanan === "bedah" ? "active" : ""}`}
                onClick={() => setTabKanan("bedah")}
              >
                Bedah Struktur Kode
              </button>
              <button
                type="button"
                className={`deck-tab-btn ${tabKanan === "teori" ? "active" : ""}`}
                onClick={() => setTabKanan("teori")}
              >
                Teori &amp; Karakteristik
              </button>
            </div>

            <div className="deck-body-content">
              {/* TAB 1: Live Simulation State & Console */}
              {tabKanan === "simulasi" && (
                <div className="simulasi-deck-wrap">
                  {/* Active Execution State Card */}
                  <div className="state-summary-card">
                    <div className="state-card-header">
                      <span className="card-tag">Call Stack &amp; Context</span>
                      <span className="state-line font-mono">
                        {kejadian ? `Baris ${kejadian.line}` : "Idle"}
                      </span>
                    </div>

                    <div className="stack-badge font-mono">
                      def: {kejadian ? kejadian.stack.join(" › ") : "menunggu eksekusi..."}
                    </div>

                    {/* Local Variables Grid */}
                    <div className="vars-container">
                      <span className="vars-label">Variabel Lokal Terkini:</span>
                      {kejadian?.vars && Object.keys(kejadian.vars).length > 0 ? (
                        <div className="vars-grid">
                          {Object.entries(kejadian.vars).map(([k, v]) => (
                            <div key={k} className="var-chip font-mono">
                              <span className="var-key">{k}</span>
                              <span className="var-val">
                                {typeof v === "number" ? v.toFixed(6) : String(v)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="redup kecil pad-4">Variabel belum terisi.</p>
                      )}
                    </div>

                    {/* Sub-function Call Logs */}
                    {kejadian?.panggil && (
                      <div className="call-logs-container">
                        <span className="vars-label">Evaluasi Sub-Fungsi:</span>
                        <div className="call-chips-wrap">
                          {kejadian.panggil.map((s, i) => (
                            <span key={i} className="call-chip font-mono">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terminal Console Output Card */}
                  <div className="terminal-card">
                    <div className="terminal-header">
                      <div className="terminal-dots">
                        <span className="tdot tdot-red" />
                        <span className="tdot tdot-yellow" />
                        <span className="tdot tdot-green" />
                      </div>
                      <span className="terminal-title font-mono">STDOUT Terminal Python</span>
                      <span className="redup kecil font-mono">{keluaran.length} baris</span>
                    </div>

                    <div className="terminal-console font-mono" ref={konsolRef}>
                      {keluaran.length === 0 ? (
                        <div className="terminal-empty redup">
                          &gt; Output stdout Python akan muncul di sini saat simulasi berjalan...
                        </div>
                      ) : (
                        keluaran.map((k, i) => (
                          <div key={i} className="terminal-row">
                            <span className="term-line-no">{k.line}</span>
                            <span className="term-text">{k.teks.replace(/^\n/, "")}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Deep Code Breakdown Accordion */}
              {tabKanan === "bedah" && (
                <CodeInspector
                  rentangAktif={sorotanRentang}
                  onPilihRentang={(rentang) => setSorotanRentang(rentang)}
                />
              )}

              {/* TAB 3: Theoretical Analysis */}
              {tabKanan === "teori" && <TheoryCard metode={metode} />}
            </div>
          </section>
        </div>

        {/* Bottom Full-Width Visualization & Iteration Table */}
        <Vis fn={sesi.fn} hasil={sesi.hasil} kunci={kunciMetode} />
      </main>
    </div>
  );
}