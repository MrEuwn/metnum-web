import React, { useEffect, useMemo, useRef, useState } from "react";
import CodePane from "./CodePane.jsx";
import Vis from "./Vis.jsx";
import { METODE, buatF, jejakMain } from "./engine.js";

const KECEPATAN = [
  ["Lambat", 1100],
  ["Sedang", 650],
  ["Cepat", 320],
  ["Kilat", 130],
];

export default function App() {
  const [expr, setExpr] = useState("x**2 - 4*x - 1");
  const [kunci, setKunci] = useState("biseksi");
  const [masukan, setMasukan] = useState({});
  const [idx, setIdx] = useState(-1);
  const [main, setMain] = useState(false);
  const [laju, setLaju] = useState(650);
  const [semua, setSemua] = useState(true);
  const [galat, setGalat] = useState("");
  const [sesi, setSesi] = useState({ events: [], hasil: null, fn: null });

  const metode = METODE[kunci];
  const kunciMetode = kunci;
  const params = useMemo(() => {
    const out = {};
    for (const k of metode.masukan) out[k] = Number(masukan[`${kunciMetode}.${k}`] ?? metode.default[k]);
    return out;
  }, [kunciMetode, masukan, metode]);

  const setParam = (k, v) => setMasukan((s) => ({ ...s, [`${kunciMetode}.${k}`]: v }));

  function jalankan(otomatis = true) {
    setGalat("");
    try {
      const fn = buatF(expr);
      const tol = 0.00001;
      const maks = 100;
      const salah = metode.masukan.some((k) => !isFinite(params[k]));
      if (salah) throw new Error("Semua batas/tebakan awal harus berupa angka.");
      const hasil = metode.hitung(fn, params, tol, maks);
      const awal = jejakMain({ metodeKey: kunciMetode, label: metode.label, expr, metode: metode.nomor });
      const events = [...awal, ...hasil.events];
      setSesi({ events, hasil: hasil.hasil, fn });
      setIdx(events.length - 1);
      setMain(otomatis);
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
    () => sesi.events.slice(0, idx + 1).filter((e) => e.output).map((e) => ({ line: e.line, teks: e.output })),
    [sesi.events, idx]
  );

  const konsolRef = useRef(null);
  useEffect(() => {
    if (konsolRef.current) konsolRef.current.scrollTop = konsolRef.current.scrollHeight;
  }, [keluaran.length]);

  // sorot baris aktif di kode
  useEffect(() => {
    if (!kejadian) return;
    const el = document.querySelector(`.kode [data-no="${kejadian.line}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [kejadian]);

  const lompatKe = (baris) => {
    setMain(false);
    const p = sesi.events.findIndex((e) => e.line === baris);
    if (p >= 0) setIdx(p);
  };

  return (
    <div className="wrap">
      <header>
        <h1>Metode Numerik — Pencari Akar Persamaan Non-Linier</h1>
        <p className="redup">
          Visualisasi eksekusi kode Python baris per baris: nilai variabel, sub-fungsi yang dipanggil, keluaran
          terminal, dan grafik f(x).
        </p>
      </header>

      <section className="panel">
        <div className="kendali">
          <label className="grup">
            <span>f(x)</span>
            <input value={expr} onChange={(e) => setExpr(e.target.value)} placeholder="x**2 - 4*x - 1" size={28} />
          </label>

          <label className="grup">
            <span>Metode</span>
            <select value={kunci} onChange={(e) => setKunci(e.target.value)}>
              {Object.entries(METODE).map(([k, m]) => (
                <option key={k} value={k}>
                  {m.nomor}. {m.label}
                </option>
              ))}
            </select>
          </label>

          {metode.masukan.map((k) => (
            <label className="grup" key={k}>
              <span>{k}</span>
              <input
                type="number"
                step="any"
                value={masukan[`${kunciMetode}.${k}`] ?? metode.default[k]}
                onChange={(e) => setParam(k, e.target.value)}
              />
            </label>
          ))}

          <button className="utama" onClick={() => jalankan(true)}>
            Jalankan
          </button>
        </div>

        <div className="baris-kendali">
          <button onClick={() => setMain((p) => !p)} disabled={!sesi.events.length}>
            {main ? "Jeda" : "Putar"}
          </button>
          <button onClick={() => { setMain(false); setIdx((i) => Math.max(0, i - 1)); }} disabled={!sesi.events.length}>
            ‹ Mundur
          </button>
          <button
            onClick={() => { setMain(false); setIdx((i) => Math.min(sesi.events.length - 1, i + 1)); }}
            disabled={!sesi.events.length}
          >
            Maju ›
          </button>
          <button onClick={() => { setMain(false); setIdx(0); }} disabled={!sesi.events.length}>
            Awal
          </button>
          <button onClick={() => setIdx(sesi.events.length - 1)} disabled={!sesi.events.length}>
            Akhir
          </button>

          <label className="grup">
            <span>Tempo</span>
            <select value={laju} onChange={(e) => setLaju(Number(e.target.value))}>
              {KECEPATAN.map(([n, v]) => (
                <option key={n} value={v}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="grup kotak">
            <input type="checkbox" checked={semua} onChange={(e) => setSemua(e.target.checked)} />
            <span>Tampilkan seluruh baris kode</span>
          </label>

          <span className="redup kecil">
            {sesi.events.length ? `langkah ${idx + 1}/${sesi.events.length}` : "belum dijalankan"}
          </span>
        </div>

        <div className="pintasan">
          {Object.entries(METODE).map(([k, m]) => (
            <button key={k} className="halus" onClick={() => lompatKe(m.barisDef)} disabled={k !== kunciMetode || !sesi.events.length}>
              def {m.label}() — baris {m.barisDef}
            </button>
          ))}
        </div>

        {galat && <p className="galat">Error: {galat}</p>}
      </section>

      <div className="grid">
        <section className="panel kode-panel">
          <h3>metode_numerik.py</h3>
          <CodePane kejadian={kejadian} tampilSemua={semua} />
        </section>

        <div className="kolom">
          <section className="panel">
            <h3>
              Status eksekusi {kejadian ? `— baris ${kejadian.line}` : ""}
            </h3>
            {kejadian ? (
              <>
                <p className="redup kecil">
                  def aktif: {kejadian.stack.join(" › ")}
                  {kejadian.rumus ? "" : ""}
                </p>
                {kejadian.vars && Object.keys(kejadian.vars).length > 0 ? (
                  <div className="vars">
                    {Object.entries(kejadian.vars).map(([k, v]) => (
                      <div key={k} className="var">
                        <span className="nama">{k}</span>
                        <span className="nilai">{typeof v === "number" ? Number(v).toFixed(6) : String(v)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="redup">Belum ada variabel lokal.</p>
                )}
                {kejadian.panggil && (
                  <div className="panggil">
                    {kejadian.panggil.map((s, i) => (
                      <span key={i}>{s}</span>
                    ))}
                  </div>
                )}
                {kejadian.catatan && <p className="catatan">{kejadian.catatan}</p>}
              </>
            ) : (
              <p className="redup">Tekan “Jalankan”, lalu kode akan berjalan sendiri baris demi baris.</p>
            )}
            <p className="rumus">{metode.rumus}</p>
          </section>

          <section className="panel">
            <h3>Keluaran terminal Python</h3>
            <div className="konsol" ref={konsolRef}>
              {keluaran.length === 0 ? (
                <span className="redup">— kosong —</span>
              ) : (
                keluaran.map((k, i) => (
                  <div key={i} className="baris-konsol">
                    <span className="no-baris">{k.line}</span>
                    <span className="teks">{k.teks.replace(/^\n/, "")}</span>
                  </div>
                ))
              )}
            </div>
            {sesi.hasil?.akar != null && (
              <p className={sesi.hasil.gagal ? "galat" : "hasil"}>
                {sesi.hasil.gagal
                  ? `Gagal: ${sesi.hasil.pesan}`
                  : `Akar ≈ ${Number(sesi.hasil.akar).toFixed(6)} dalam ${sesi.hasil.iterasi} iterasi`}
              </p>
            )}
          </section>
        </div>
      </div>

      <Vis fn={sesi.fn} hasil={sesi.hasil} kunci={kunciMetode} />
    </div>
  );
}