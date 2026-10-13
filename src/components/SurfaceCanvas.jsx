import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { num6 } from "../engine.js";

/**
 * Permukaan 3D z = f(x) direntang pada sumbu y, proyeksi 3D buatan sendiri
 * (Canvas 2D, nol dependency). Bisa diputar (drag) dan di-zoom (scroll).
 * Akar persamaan tampil sebagai garis di lantai tempat permukaan menyentuh
 * bidang z = 0.
 */

const GRID_N = 30;
const YAW_AWAL = Math.PI / 4;
const PITCH_AWAL = 0.6155;
const PITCH_MIN = 0.12;
const PITCH_MAX = 1.45;
const ZOOM_MIN = 0.45;
const ZOOM_MAX = 3.5;

const TINTA = "#14110c";
const EMAS = "#c9a227";
const EMAS_TUA = "#a8851b";
const HIJAU = "#0f8a4d";
const GARIS = "#e6e1d4";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function SurfaceCanvas({ fn, hasil, kunci, activeIter, hoveredIter }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 400 });
  const [zoomLabel, setZoomLabel] = useState(1);

  const viewRef = useRef({ yaw: YAW_AWAL, pitch: PITCH_AWAL, zoom: 1 });
  const dragRef = useRef({ aktif: false, x: 0, y: 0 });
  const rafRef = useRef(0);
  const drawRef = useRef(() => {});

  const riw = hasil?.riwayat || [];
  const fokus = hasil?.fokus?.length ? hasil.fokus : [-4, 4];

  const [xLo, xHi, yLo, yHi] = useMemo(() => {
    let lo = Math.min(...fokus);
    let hi = Math.max(...fokus);
    if (!isFinite(lo) || !isFinite(hi) || hi - lo < 1) {
      lo = -4;
      hi = 4;
    }
    const pad = (hi - lo) * 0.18;
    const lebar = hi - lo + pad * 2;
    return [lo - pad, hi + pad, -lebar / 2, lebar / 2];
  }, [fokus]);

  const surface = useMemo(() => {
    const grid = [];
    let zMin = Infinity;
    let zMax = -Infinity;
    for (let j = 0; j <= GRID_N; j++) {
      const row = [];
      const y = yLo + ((yHi - yLo) * j) / GRID_N;
      for (let i = 0; i <= GRID_N; i++) {
        const x = xLo + ((xHi - xLo) * i) / GRID_N;
        let z;
        try {
          z = fn(x);
        } catch {
          z = NaN;
        }
        if (typeof z !== "number" || !isFinite(z)) z = NaN;
        if (isFinite(z)) {
          if (z < zMin) zMin = z;
          if (z > zMax) zMax = z;
        }
        row.push(z);
      }
      grid.push(row);
    }
    if (!isFinite(zMin) || !isFinite(zMax)) {
      zMin = -1;
      zMax = 1;
    }
    const cap = (zMax - zMin) * 2.5;
    for (let j = 0; j <= GRID_N; j++) {
      for (let i = 0; i <= GRID_N; i++) {
        const z = grid[j][i];
        if (isFinite(z)) grid[j][i] = clamp(z, zMin - cap, zMax + cap);
      }
    }
    return { grid, zMin, zMax };
  }, [fn, xLo, xHi, yLo, yHi]);

  // Akar sejati: scan perubahan tanda lalu perhalus dengan biseksi
  const akarX = useMemo(() => {
    const N = 600;
    const step = (xHi - xLo) / N;
    const out = [];
    const fv = (x) => {
      try {
        const v = fn(x);
        return typeof v === "number" && isFinite(v) ? v : NaN;
      } catch {
        return NaN;
      }
    };
    let prevX = xLo;
    let prevF = fv(prevX);
    for (let i = 1; i <= N; i++) {
      const xn = xLo + i * step;
      const fnv = fv(xn);
      if (isFinite(prevF) && isFinite(fnv) && prevF * fnv < 0) {
        let a = prevX;
        let b = xn;
        for (let k = 0; k < 40; k++) {
          const m = (a + b) / 2;
          const fm = fv(m);
          if (!isFinite(fm)) break;
          if (fv(a) * fm <= 0) b = m;
          else a = m;
        }
        out.push((a + b) / 2);
      }
      prevX = xn;
      prevF = fnv;
    }
    return out;
  }, [fn, xLo, xHi]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 50) {
          setDimensions((prev) => {
            if (Math.abs(prev.width - Math.floor(width)) < 1) return prev;
            return { width: Math.floor(width), height: 400 };
          });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      drawRef.current();
    });
  }, []);

  // Native non-passive wheel: zoom tanpa menggeser halaman
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => {
      e.preventDefault();
      const v = viewRef.current;
      v.zoom = clamp(v.zoom * Math.exp(-e.deltaY * 0.0012), ZOOM_MIN, ZOOM_MAX);
      setZoomLabel(v.zoom);
      scheduleDraw();
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, [scheduleDraw]);

  const onPointerDown = (e) => {
    dragRef.current = { aktif: true, x: e.clientX, y: e.clientY };
    if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.classList.add("dragging");
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.aktif) return;
    const dx = e.clientX - dragRef.current.x;
    const dy = e.clientY - dragRef.current.y;
    dragRef.current.x = e.clientX;
    dragRef.current.y = e.clientY;
    const v = viewRef.current;
    v.yaw += dx * 0.009;
    v.pitch = clamp(v.pitch - dy * 0.007, PITCH_MIN, PITCH_MAX);
    scheduleDraw();
  };

  const onPointerUp = (e) => {
    dragRef.current.aktif = false;
    e.currentTarget.classList.remove("dragging");
  };

  const resetView = () => {
    viewRef.current = { yaw: YAW_AWAL, pitch: PITCH_AWAL, zoom: 1 };
    setZoomLabel(1);
    scheduleDraw();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    drawRef.current = () => {
      const dpr = window.devicePixelRatio || 1;
      const W = dimensions.width;
      const H = dimensions.height;
      if (canvas.width !== W * dpr || canvas.height !== H * dpr) {
        canvas.width = W * dpr;
        canvas.height = H * dpr;
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      const { grid, zMin, zMax } = surface;
      if (!grid.length) return;

      const v = viewRef.current;
      const cosY = Math.cos(v.yaw);
      const sinY = Math.sin(v.yaw);
      const cosP = Math.cos(v.pitch);
      const sinP = Math.sin(v.pitch);

      const zSpan = Math.max(1e-9, zMax - zMin);
      const halfX = (xHi - xLo) / 2;
      const halfY = (yHi - yLo) / 2;
      const skala = Math.min(W / (halfX * 3.1), H / (halfY * 2.6)) * v.zoom;
      const skalaZ = skala * 0.62;
      const cx = (xLo + xHi) / 2;
      const cy = (yLo + yHi) / 2;
      const oX = W / 2;
      const oY = H * 0.56;

      const P = (wx, wy, wz) => {
        const rx = (wx - cx) * skala;
        const ry = (wy - cy) * skala;
        const rz = wz * skalaZ;
        const a = rx * cosY - ry * sinY;
        const b = rx * sinY + ry * cosY;
        const depth = b * cosP - rz * sinP;
        const up = b * sinP + rz * cosP;
        return { x: oX + a, y: oY - up, d: depth };
      };

      // 1. Lantai grid
      const zLantai = zMin;
      ctx.strokeStyle = GARIS;
      ctx.lineWidth = 1;
      for (let j = 0; j <= 8; j++) {
        const y = yLo + ((yHi - yLo) * j) / 8;
        const a = P(xLo, y, zLantai);
        const b = P(xHi, y, zLantai);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      for (let i = 0; i <= 8; i++) {
        const x = xLo + ((xHi - xLo) * i) / 8;
        const a = P(x, yLo, zLantai);
        const b = P(x, yHi, zLantai);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // 2. Garis akar di lantai (z = 0), direntang sepanjang y
      akarX.forEach((rx) => {
        const a = P(rx, yLo, 0);
        const b = P(rx, yHi, 0);
        ctx.strokeStyle = EMAS;
        ctx.lineWidth = 2;
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 3. Permukaan, quad diurutkan jauh -> dekat (painter's algorithm)
      const quads = [];
      const cellW = (xHi - xLo) / GRID_N;
      const cellH = (yHi - yLo) / GRID_N;
      for (let j = 0; j < GRID_N; j++) {
        for (let i = 0; i < GRID_N; i++) {
          const z00 = grid[j][i];
          const z10 = grid[j][i + 1];
          const z11 = grid[j + 1][i + 1];
          const z01 = grid[j + 1][i];
          if (!(isFinite(z00) && isFinite(z10) && isFinite(z11) && isFinite(z01))) continue;
          const x0 = xLo + i * cellW;
          const x1 = x0 + cellW;
          const y0 = yLo + j * cellH;
          const y1 = y0 + cellH;
          const p00 = P(x0, y0, z00);
          const p10 = P(x1, y0, z10);
          const p11 = P(x1, y1, z11);
          const p01 = P(x0, y1, z01);
          const avgZ = (z00 + z10 + z11 + z01) / 4;
          quads.push({
            pts: [p00, p10, p11, p01],
            d: (p00.d + p10.d + p11.d + p01.d) / 4,
            t: (avgZ - zMin) / zSpan,
          });
        }
      }
      quads.sort((a, b) => b.d - a.d);

      quads.forEach((q) => {
        // t=0 rendah pucat hangat, t=1 tinggi emas
        const r = Math.round(246 + (201 - 246) * q.t);
        const g = Math.round(243 + (162 - 243) * q.t);
        const b2 = Math.round(232 + (39 - 232) * q.t);
        ctx.fillStyle = "rgb(" + r + ", " + g + ", " + b2 + ")";
        ctx.strokeStyle = "rgba(20, 17, 12, 0.07)";
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(q.pts[0].x, q.pts[0].y);
        ctx.lineTo(q.pts[1].x, q.pts[1].y);
        ctx.lineTo(q.pts[2].x, q.pts[2].y);
        ctx.lineTo(q.pts[3].x, q.pts[3].y);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      // 4. Jejak iterasi + titik. Titik digambar setelah permukaan supaya
      //    selalu terbaca; diurutkan jauh->dekat agar tumpang tindih wajar.
      const kunciTitik = kunci === "secant" ? "x2" : kunci === "newtonraphson" ? "x0" : "c";
      const titik = [];
      riw.forEach((r, idx) => {
        const x = r[kunciTitik];
        if (typeof x !== "number" || !isFinite(x)) return;
        let z;
        try {
          z = fn(x);
        } catch {
          z = 0;
        }
        if (typeof z !== "number" || !isFinite(z)) z = 0;
        titik.push({ idx, p: P(x, 0, z), floor: P(x, 0, zLantai) });
      });

      if (titik.length > 1) {
        ctx.strokeStyle = "rgba(168, 133, 27, 0.55)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        titik.forEach((tp, i) => {
          if (i === 0) ctx.moveTo(tp.p.x, tp.p.y);
          else ctx.lineTo(tp.p.x, tp.p.y);
        });
        ctx.stroke();
      }

      const targetIdx = hoveredIter != null ? hoveredIter : Math.max(0, activeIter - 1);
      const titikUrut = titik.slice().sort((a, b) => b.p.d - a.p.d);
      titikUrut.forEach((tp) => {
        const isHovered = hoveredIter === tp.idx;
        const isAktif = tp.idx === targetIdx;
        const isTerakhir = tp.idx === riw.length - 1;

        ctx.strokeStyle = "rgba(20, 17, 12, 0.18)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(tp.p.x, tp.p.y);
        ctx.lineTo(tp.floor.x, tp.floor.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const rad = isHovered || isAktif ? 6 : 3;
        ctx.fillStyle = isTerakhir
          ? HIJAU
          : isHovered
          ? EMAS
          : isAktif
          ? EMAS_TUA
          : "rgba(20, 17, 12, 0.45)";
        ctx.beginPath();
        ctx.arc(tp.p.x, tp.p.y, rad, 0, Math.PI * 2);
        ctx.fill();
        if (isHovered || isAktif || isTerakhir) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      // 5. Penanda akar hasil iterasi
      if (typeof hasil?.akar === "number" && isFinite(hasil.akar)) {
        let zA;
        try {
          zA = fn(hasil.akar);
        } catch {
          zA = 0;
        }
        if (typeof zA !== "number" || !isFinite(zA)) zA = 0;
        const p = P(hasil.akar, 0, zA);
        const fl = P(hasil.akar, 0, zLantai);

        ctx.strokeStyle = HIJAU;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(fl.x, fl.y);
        ctx.stroke();

        ctx.fillStyle = HIJAU;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = TINTA;
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        ctx.textAlign = "left";
        ctx.fillText("x* = " + num6(hasil.akar), p.x + 9, p.y - 9);
      }

      // 6. Label sumbu
      ctx.fillStyle = "#7d7462";
      ctx.font = "10px 'JetBrains Mono', monospace";
      const xp = P(xHi, yLo, zLantai);
      ctx.textAlign = "left";
      ctx.fillText("x", xp.x + 4, xp.y + 8);
      const yp = P(xLo, yHi, zLantai);
      ctx.textAlign = "left";
      ctx.fillText("y", yp.x - 12, yp.y + 8);
      const zp = P(xLo, yLo, zMax);
      ctx.textAlign = "right";
      ctx.fillText("z = f(x)", zp.x - 6, zp.y);
    };

    drawRef.current();
  }, [
    dimensions,
    surface,
    akarX,
    fn,
    hasil,
    kunci,
    riw,
    activeIter,
    hoveredIter,
    xLo,
    xHi,
    yLo,
    yHi,
  ]);

  const infoText = useMemo(() => {
    if (!riw.length) return null;
    const t = kunci === "secant" ? "x2" : kunci === "newtonraphson" ? "x0" : "c";
    const idx = clamp(hoveredIter ?? Math.max(0, activeIter - 1), 0, riw.length - 1);
    const r = riw[idx];
    const x = r && r[t];
    if (typeof x !== "number") return null;
    return { iter: idx + 1, x };
  }, [riw, kunci, activeIter, hoveredIter]);

  return (
    <div className="surface-canvas-wrapper" ref={containerRef}>
      <div className="surface-header">
        <div className="surface-title-wrap">
          <span className="surface-title font-mono">PERMUKAAN 3D</span>
          <span className="surface-sub font-mono">
            z = f(x) direntang pada sumbu y · kontur z = 0 = akar
          </span>
        </div>
        <div className="surface-actions">
          {infoText && (
            <span className="surface-badge font-mono">
              Iterasi {infoText.iter} · x = {num6(infoText.x)}
            </span>
          )}
          <button type="button" className="surface-reset-btn font-mono" onClick={resetView}>
            Reset {zoomLabel.toFixed(1)}×
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="surface-canvas-element"
        style={{ width: dimensions.width, height: dimensions.height }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={resetView}
      />

      <p className="surface-hint font-mono">
        Drag untuk memutar · Scroll untuk zoom · Klik 2× untuk reset
      </p>

      {riw.length === 0 && (
        <div className="surface-empty redup font-mono">
          Jalankan simulasi untuk melihat permukaan dan jejak iterasi 3D.
        </div>
      )}
    </div>
  );
}
