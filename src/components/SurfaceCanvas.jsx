import React, { useRef, useEffect, useState, useMemo } from "react";
import { num6 } from "../engine.js";

/**
 * Visualisasi 3D permukaan z = f(x, y) dengan proyeksi isometrik via Canvas 2D.
 * Nol dependency — tetap di aturan "Canvas 2D buatan sendiri".
 *
 * Tujuan edukasi: orang awam melihat persamaan sebagai "medan/permukaan",
 * dan akar = kontur z = 0 (garis tempat permukaan memotong lantai).
 * Iterasi tiap metode divisualkan sebagai jejak di atas permukaan.
 */

const GRID_N = 36;

export default function SurfaceCanvas({ fn, hasil, kunci, activeIter, hoveredIter }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 640, height: 380 });

  const riw = hasil?.riwayat || [];
  const fokus = hasil?.fokus?.length ? hasil.fokus : [-4, 4];

  // Domain grid mengikuti fokus iterasi
  const [xLo, xHi, yLo, yHi] = useMemo(() => {
    let lo = Math.min(...fokus);
    let hi = Math.max(...fokus);
    if (!isFinite(lo) || !isFinite(hi) || hi - lo < 1) {
      lo = -4;
      hi = 4;
    }
    const pad = (hi - lo) * 0.15;
    // y axis = "lebar", sama-sama simetris sekitar 0
    const span = hi - lo + pad * 2;
    return [lo - pad, hi + pad, -span / 2, span / 2];
  }, [fokus]);

  // Hitung grid permukaan z = f(x,y) sekali per domain
  const surface = useMemo(() => {
    const cols = GRID_N;
    const rows = GRID_N;
    const grid = [];
    let zMin = Infinity;
    let zMax = -Infinity;
    for (let j = 0; j <= rows; j++) {
      const row = [];
      const y = yLo + ((yHi - yLo) * j) / rows;
      for (let i = 0; i <= cols; i++) {
        const x = xLo + ((xHi - xLo) * i) / cols;
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
    // Clamp z ekstrem agar tidak meledak
    const zSpan = zMax - zMin;
    const cap = zSpan * 3;
    for (let j = 0; j <= GRID_N; j++) {
      for (let i = 0; i <= GRID_N; i++) {
        const z = grid[j][i];
        if (isFinite(z)) {
          grid[j][i] = Math.max(zMin - cap, Math.min(zMax + cap, z));
        }
      }
    }
    return { grid, zMin, zMax, cols, rows };
  }, [fn, xLo, xHi, yLo, yHi]);

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 50) {
          setDimensions((prev) => {
            if (Math.abs(prev.width - Math.floor(width)) < 1) return prev;
            return { width: Math.floor(width), height: 380 };
          });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Proyeksi isometrik
  const project = (wx, wy, wz, W, H) => {
    // Iso: x layar = (wx - wy) * cos(30), y layar = (wx + wy) * sin(30) - wz
    const isoX = (wx - wy) * 0.866;
    const isoY = (wx + wy) * 0.5 - wz;
    return { x: W / 2 + isoX, y: H * 0.62 - isoY };
  };

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
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

    // Normalisasi z ke ruang layar
    const zSpan = Math.max(1e-9, zMax - zMin);
    const worldHalfX = (xHi - xLo) / 2;
    const worldHalfY = (yHi - yLo) / 2;
    const worldScale = Math.min(W / (worldHalfX * 3.2), H / (worldHalfY * 2.4));
    const zScale = worldScale * 0.55;

    // Center domain di (0,0)
    const cx = (xLo + xHi) / 2;
    const cy = (yLo + yHi) / 2;

    const P = (wx, wy, wz) => {
      const sx = (wx - cx) * worldScale;
      const sy = (wy - cy) * worldScale;
      return project(sx, sy, wz * zScale, W, H);
    };

    // Lantai grid (z = zMin)
    const zFloor = zMin;
    ctx.strokeStyle = "#121d30";
    ctx.lineWidth = 1;
    for (let j = 0; j <= 6; j++) {
      const y = yLo + ((yHi - yLo) * j) / 6;
      ctx.beginPath();
      const a = P(xLo, y, zFloor);
      const b = P(xHi, y, zFloor);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    for (let i = 0; i <= 6; i++) {
      const x = xLo + ((xHi - xLo) * i) / 6;
      ctx.beginPath();
      const a = P(x, yLo, zFloor);
      const b = P(x, yHi, zFloor);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    // Kontur z = 0 di lantai (garis akar) — amber, paling penting
    if (zMin <= 0 && zMax >= 0) {
      ctx.strokeStyle = "#f5a623";
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= GRID_N; i++) {
        const x = xLo + ((xHi - xLo) * i) / GRID_N;
        let z;
        try {
          z = fn(x);
        } catch {
          z = NaN;
        }
        if (typeof z === "number" && isFinite(z)) {
          // proyeksi ke lantai pada z=0 (y bebas, gambar garis di y=0)
          const pt = P(x, 0, 0);
          if (!started) {
            ctx.moveTo(pt.x, pt.y);
            started = true;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        } else {
          started = false;
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Label kontur
      const labelPt = P(xHi * 0.98, 0, 0);
      ctx.fillStyle = "#f5a623";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText("kontur z = 0 (akar)", labelPt.x - 6, labelPt.y - 6);
    }

    // Permukaan: quads dengan warna tinggi (amber → abu)
    const cellW = (xHi - xLo) / GRID_N;
    const cellH = (yHi - yLo) / GRID_N;
    for (let j = 0; j < GRID_N; j++) {
      for (let i = 0; i < GRID_N; i++) {
        const z00 = grid[j][i];
        const z10 = grid[j][i + 1];
        const z11 = grid[j + 1][i + 1];
        const z01 = grid[j + 1][i];
        if (![z00, z10, z11, z01].every(isFinite)) continue;

        const x0 = xLo + i * cellW;
        const x1 = x0 + cellW;
        const y0 = yLo + j * cellH;
        const y1 = y0 + cellH;

        const avgZ = (z00 + z10 + z11 + z01) / 4;
        const t = (avgZ - zMin) / zSpan; // 0..1
        const k = Math.max(0.35, 1 - t * 0.55); // lebih tinggi = lebih gelap

        // Warna: base abu-kebiruan, semakin tinggi semakin amber
        const r = Math.round(38 + 245 * t * k);
        const g = Math.round(50 + 166 * t * k);
        const b = Math.round(74 + 35 * (1 - t) * k);

        const p00 = P(x0, y0, z00);
        const p10 = P(x1, y0, z10);
        const p11 = P(x1, y1, z11);
        const p01 = P(x0, y1, z01);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.beginPath();
        ctx.moveTo(p00.x, p00.y);
        ctx.lineTo(p10.x, p10.y);
        ctx.lineTo(p11.x, p11.y);
        ctx.lineTo(p01.x, p01.y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Wireframe tipis di atas permukaan biar terlihat struktur
    ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
    ctx.lineWidth = 0.75;
    for (let j = 0; j <= GRID_N; j += 3) {
      ctx.beginPath();
      for (let i = 0; i <= GRID_N; i++) {
        const z = grid[j][i];
        if (!isFinite(z)) continue;
        const x = xLo + i * cellW;
        const y = yLo + j * cellH;
        const pt = P(x, y, z);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }
    for (let i = 0; i <= GRID_N; i += 3) {
      ctx.beginPath();
      for (let j = 0; j <= GRID_N; j++) {
        const z = grid[j][i];
        if (!isFinite(z)) continue;
        const x = xLo + i * cellW;
        const y = yLo + j * cellH;
        const pt = P(x, y, z);
        if (j === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }

    // === Jejak iterasi (sinkron timeline) ===
    const kunciTitik = kunci === "secant" ? "x2" : kunci === "newtonraphson" ? "x0" : "c";
    const targetIdx = hoveredIter != null ? hoveredIter : Math.max(0, activeIter - 1);

    // Garis penghubung semua iterasi
    if (riw.length > 1) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      let started = false;
      riw.forEach((r, idx) => {
        const x = r[kunciTitik];
        if (typeof x !== "number" || !isFinite(x)) {
          started = false;
          return;
        }
        let z;
        try {
          z = fn(x);
        } catch {
          z = 0;
        }
        if (!isFinite(z)) z = 0;
        const pt = P(x, 0, z);
        if (!started) {
          ctx.moveTo(pt.x, pt.y);
          started = true;
        } else {
          ctx.lineTo(pt.x, pt.y);
        }
      });
      ctx.stroke();
    }

    // Titik iterasi
    riw.forEach((r, idx) => {
      const x = r[kunciTitik];
      if (typeof x !== "number" || !isFinite(x)) return;
      let z;
      try {
        z = fn(x);
      } catch {
        z = 0;
      }
      if (!isFinite(z)) z = 0;

      const pt = P(x, 0, z);
      const isHovered = hoveredIter === idx;
      const isActive = activeIter === idx + 1;
      const isLast = idx === riw.length - 1;

      // Proyeksi ke lantai (garis drop)
      const floorPt = P(x, 0, zMin);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(floorPt.x, floorPt.y);
      ctx.stroke();
      ctx.setLineDash([]);

      if (isHovered || isActive || isLast) {
        const radius = isHovered ? 8 : isLast ? 6 : 5;
        ctx.fillStyle = isLast ? "#34d399" : "#38bdf8";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#060910";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Akar x*
    if (typeof hasil?.akar === "number" && isFinite(hasil.akar)) {
      let zAkar;
      try {
        zAkar = fn(hasil.akar);
      } catch {
        zAkar = 0;
      }
      if (!isFinite(zAkar)) zAkar = 0;
      const pt = P(hasil.akar, 0, zAkar);
      const floorPt = P(hasil.akar, 0, zMin);

      // Tiang akar
      ctx.strokeStyle = "#34d399";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(floorPt.x, floorPt.y);
      ctx.stroke();

      ctx.fillStyle = "#34d399";
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#34d399";
      ctx.font = "bold 11px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`x* ≈ ${num6(hasil.akar)}`, pt.x + 8, pt.y - 8);
    }

    // Sumbu label
    ctx.fillStyle = "#64748b";
    ctx.font = "10px 'JetBrains Mono', monospace";
    const xEnd = P(xHi, yLo, zMin);
    ctx.textAlign = "right";
    ctx.fillText(`x →  [${xLo.toFixed(1)}, ${xHi.toFixed(1)}]`, xEnd.x - 4, xEnd.y + 16);
    const yEnd = P(xLo, yHi, zFloor);
    ctx.textAlign = "left";
    ctx.fillText("y (lebar)", yEnd.x + 6, yEnd.y + 4);
    const zTop = P(xLo, yLo, zMax);
    ctx.textAlign = "left";
    ctx.fillText("z = f(x,y)", zTop.x - 60, zTop.y - 8);
  }, [dimensions, surface, fn, hasil, kunci, riw, activeIter, hoveredIter, xLo, xHi, yLo, yHi]);

  const infoText = useMemo(() => {
    if (!riw.length) return null;
    const t = kunci === "secant" ? "x2" : kunci === "newtonraphson" ? "x0" : "c";
    const r = riw[Math.max(0, Math.min(riw.length - 1, (hoveredIter ?? activeIter - 1)))] || riw[0];
    return { x: r[t], iter: (hoveredIter ?? activeIter - 1) + 1 };
  }, [riw, kunci, activeIter, hoveredIter]);

  return (
    <div className="surface-canvas-wrapper" ref={containerRef}>
      <div className="surface-header">
        <div className="surface-title-wrap">
          <span className="surface-title font-mono">PERMUKAAN 3D z = f(x, y)</span>
          <span className="surface-sub font-mono">
            Akar = kontur z = 0 · Titik = jejak iterasi {kunci}
          </span>
        </div>
        {infoText && (
          <span className="surface-badge font-mono">
            Iterasi {infoText.iter} · x = {num6(infoText.x)}
          </span>
        )}
      </div>
      <canvas
        ref={canvasRef}
        className="surface-canvas-element"
        style={{ width: dimensions.width, height: dimensions.height }}
      />
      {riw.length === 0 && (
        <div className="surface-empty redup font-mono">
          Jalankan simulasi untuk melihat permukaan dan jejak iterasi 3D.
        </div>
      )}
    </div>
  );
}
