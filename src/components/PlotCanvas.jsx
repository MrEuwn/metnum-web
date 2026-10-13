import React, { useRef, useEffect, useState, useMemo, useCallback } from "react";
import { useCanvasInteraction } from "../hooks/useCanvasInteraction.js";
import { num6 } from "../engine.js";

function getNiceTicks(min, max, maxTicks = 7) {
  const span = max - min;
  if (span <= 0 || !isFinite(span)) return { ticks: [0], niceStep: 1 };
  const rawStep = span / maxTicks;
  const power = Math.floor(Math.log10(rawStep));
  const base = Math.pow(10, power);
  const fraction = rawStep / base;

  let niceFraction = 1;
  if (fraction > 1.5 && fraction <= 3) niceFraction = 2;
  else if (fraction > 3 && fraction <= 7) niceFraction = 5;
  else if (fraction > 7) niceFraction = 10;

  const niceStep = niceFraction * base;
  const start = Math.ceil(min / niceStep) * niceStep;
  const ticks = [];
  for (let v = start; v <= max + 1e-9; v += niceStep) {
    ticks.push(Number(v.toFixed(Math.max(0, -power + 2))));
  }
  return { ticks, niceStep };
}

export default function PlotCanvas({
  fn,
  hasil,
  kunci,
  activeIter,
  hoveredIter,
  onHoverIter,
  onSeekIter,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 340 });
  const animFrameRef = useRef(null);
  const pulsePhaseRef = useRef(0);

  const riw = hasil?.riwayat || [];

  // Hitung domain & range dasar dari fokus data
  const { baseDomain, baseRange } = useMemo(() => {
    const fokus = hasil?.fokus?.length ? hasil.fokus : [-2, 2];
    let loX = Math.min(...fokus);
    let hiX = Math.max(...fokus);
    if (!isFinite(loX) || !isFinite(hiX)) {
      loX = -2;
      hiX = 2;
    }
    if (hiX - loX < 0.5) {
      const mid = (loX + hiX) / 2;
      loX = mid - 1;
      hiX = mid + 1;
    }
    const padX = (hiX - loX) * 0.2;
    loX -= padX;
    hiX += padX;

    // Evaluasi sampel y untuk perkiraan tinggi kurva
    let yMin = 0;
    let yMax = 0;
    if (fn) {
      const samples = 100;
      for (let i = 0; i <= samples; i++) {
        const x = loX + ((hiX - loX) * i) / samples;
        try {
          const y = fn(x);
          if (typeof y === "number" && isFinite(y) && Math.abs(y) < 1e5) {
            if (y < yMin) yMin = y;
            if (y > yMax) yMax = y;
          }
        } catch {}
      }
    }
    if (yMax - yMin < 0.5) {
      yMin -= 1;
      yMax += 1;
    }
    const padY = (yMax - yMin) * 0.25;
    return {
      baseDomain: [loX, hiX],
      baseRange: [yMin - padY, yMax + padY],
    };
  }, [hasil?.fokus, fn]);

  const margins = useMemo(() => ({ mL: 56, mR: 18, mT: 18, mB: 32 }), []);

  const interaction = useCanvasInteraction({
    baseDomain,
    baseRange,
    margins,
  });

  const { domain, range, zoom, isZoomedOrPanned, mouse, resetView, getTransformers } =
    interaction;

  // Responsive ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 50) {
          setDimensions((prev) => ({
            width: Math.floor(width),
            height: Math.max(300, Math.min(420, Math.floor(width * 0.42))),
          }));
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Hit-testing titik iterasi saat mouse bergerak
  useEffect(() => {
    if (!mouse.inside || mouse.px == null || mouse.py == null) {
      if (hoveredIter != null) onHoverIter?.(null);
      return;
    }
    const { toScreenX, toScreenY } = getTransformers(dimensions.width, dimensions.height);
    const kunciTitik = kunci === "secant" ? "x2" : kunci === "newtonraphson" ? "x0" : "c";

    let closestIdx = null;
    let closestDist = Infinity;

    riw.forEach((r, idx) => {
      const x = r[kunciTitik];
      if (typeof x !== "number" || !isFinite(x)) return;
      const px = toScreenX(x);
      const py = toScreenY(0);
      const d = Math.hypot(px - mouse.px, py - mouse.py);
      if (d < 16 && d < closestDist) {
        closestDist = d;
        closestIdx = idx;
      }
    });

    if (closestIdx !== hoveredIter) {
      onHoverIter?.(closestIdx);
    }
  }, [
    mouse,
    riw,
    kunci,
    dimensions,
    getTransformers,
    hoveredIter,
    onHoverIter,
  ]);

  // Click on point to seek timeline
  const handleCanvasClick = useCallback(() => {
    if (hoveredIter != null) {
      onSeekIter?.(hoveredIter);
    }
  }, [hoveredIter, onSeekIter]);

  // Main Render Loop dengan requestAnimationFrame untuk denyut halus
  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;
      pulsePhaseRef.current = (pulsePhaseRef.current + 0.04) % (Math.PI * 2);
      const pulse = Math.sin(pulsePhaseRef.current);

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

      const { toScreenX, toScreenY, plotW, plotH } = getTransformers(W, H);
      const { mL, mR, mT, mB } = margins;

      // 1. Gambar Grid & Sumbu "Nice"
      const { ticks: ticksX } = getNiceTicks(domain[0], domain[1], 8);
      const { ticks: ticksY } = getNiceTicks(range[0], range[1], 6);

      ctx.lineWidth = 1;
      ctx.strokeStyle = "#101a2c"; // Subtle instrument grid

      // Garis vertikal X
      ticksX.forEach((tx) => {
        const sx = toScreenX(tx);
        if (sx >= mL && sx <= W - mR) {
          ctx.beginPath();
          ctx.moveTo(sx, mT);
          ctx.lineTo(sx, H - mB);
          ctx.stroke();
        }
      });

      // Garis horizontal Y
      ticksY.forEach((ty) => {
        const sy = toScreenY(ty);
        if (sy >= mT && sy <= H - mB) {
          ctx.beginPath();
          ctx.moveTo(mL, sy);
          ctx.lineTo(W - mR, sy);
          ctx.stroke();
        }
      });

      // Sumbu X (y = 0) menonjol
      if (0 >= range[0] && 0 <= range[1]) {
        const y0 = toScreenY(0);
        ctx.strokeStyle = "#23395d";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(mL, y0);
        ctx.lineTo(W - mR, y0);
        ctx.stroke();
      }

      // Sumbu Y (x = 0)
      if (0 >= domain[0] && 0 <= domain[1]) {
        const x0 = toScreenX(0);
        ctx.strokeStyle = "#23395d";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x0, mT);
        ctx.lineTo(x0, H - mB);
        ctx.stroke();
      }

      // Label Angka Ticks Sumbu
      ctx.fillStyle = "#64748b";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ticksX.forEach((tx) => {
        const sx = toScreenX(tx);
        if (sx >= mL + 10 && sx <= W - mR - 10) {
          ctx.fillText(String(tx), sx, H - mB + 16);
        }
      });

      ctx.textAlign = "right";
      ticksY.forEach((ty) => {
        const sy = toScreenY(ty);
        if (sy >= mT + 6 && sy <= H - mB - 4) {
          ctx.fillText(String(ty), mL - 8, sy + 3.5);
        }
      });

      // 2. Plot Kurva f(x) dengan Deteksi Asimtot / Singularitas
      if (fn) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(mL, mT, plotW, plotH);
        ctx.clip();

        const samples = Math.max(400, Math.min(1200, Math.floor(plotW * 2)));
        const dx = (domain[1] - domain[0]) / samples;
        const rangeSpan = range[1] - range[0];

        ctx.strokeStyle = "#38bdf8"; // Electric cyan
        ctx.lineWidth = 2;
        ctx.beginPath();

        let inPath = false;
        let prevY = null;

        for (let i = 0; i <= samples; i++) {
          const x = domain[0] + i * dx;
          let y;
          try {
            y = fn(x);
          } catch {
            y = NaN;
          }

          const isValid = typeof y === "number" && isFinite(y) && !isNaN(y) && Math.abs(y) < 1e7;

          // Deteksi lonjakan diskontinuitas/asimtot vertikal
          const isJump = prevY != null && Math.abs(y - prevY) > rangeSpan * 2.5;

          if (isValid && !isJump) {
            const sx = toScreenX(x);
            const clampedY = Math.max(range[0] - rangeSpan * 0.5, Math.min(range[1] + rangeSpan * 0.5, y));
            const sy = toScreenY(clampedY);

            if (!inPath) {
              ctx.moveTo(sx, sy);
              inPath = true;
            } else {
              ctx.lineTo(sx, sy);
            }
            prevY = y;
          } else {
            if (inPath) {
              ctx.stroke();
              ctx.beginPath();
              inPath = false;
            }
            prevY = null;
          }
        }
        if (inPath) ctx.stroke();
        ctx.restore();
      }

      // 3. Render Geometri Khusus per Metode
      const targetIterIdx = hoveredIter != null ? hoveredIter : Math.max(0, activeIter - 1);
      const currRow = riw[targetIterIdx];

      ctx.save();
      ctx.beginPath();
      ctx.rect(mL, mT, plotW, plotH);
      ctx.clip();

      if (currRow) {
        // GEOMETRI BISEKSI: Pita Shaded Interval [a, b] + Garis Tengah c
        if (kunci === "biseksi" && typeof currRow.a === "number" && typeof currRow.b === "number") {
          const sA = toScreenX(currRow.a);
          const sB = toScreenX(currRow.b);
          const sC = toScreenX(currRow.c);

          // Arsiran interval [a, b]
          ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
          ctx.fillRect(Math.min(sA, sB), mT, Math.abs(sB - sA), plotH);

          // Garis batas a dan b
          ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(sA, mT);
          ctx.lineTo(sA, H - mB);
          ctx.moveTo(sB, mT);
          ctx.lineTo(sB, H - mB);
          ctx.stroke();

          // Garis tegak di c
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(sC, mT);
          ctx.lineTo(sC, H - mB);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // GEOMETRI REGULA FALSI: Tali Busur dari (a, f(a)) ke (b, f(b))
        if (kunci === "regulafalsi" && typeof currRow.a === "number" && typeof currRow.b === "number" && fn) {
          const fa = fn(currRow.a);
          const fb = fn(currRow.b);
          const pA = { x: toScreenX(currRow.a), y: toScreenY(fa) };
          const pB = { x: toScreenX(currRow.b), y: toScreenY(fb) };
          const pC = { x: toScreenX(currRow.c), y: toScreenY(0) };

          ctx.strokeStyle = "rgba(251, 191, 36, 0.85)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(pA.x, pA.y);
          ctx.lineTo(pB.x, pB.y);
          ctx.stroke();

          // Titik ujung tali busur
          ctx.fillStyle = "#fbbf24";
          [pA, pB].forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
            ctx.fill();
          });

          // Proyeksi titik potong c di y=0
          ctx.strokeStyle = "rgba(251, 191, 36, 0.5)";
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(pC.x, mT);
          ctx.lineTo(pC.x, H - mB);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // GEOMETRI NEWTON-RAPHSON: Tangen f'(x0) & Langkah Tangga
        if (kunci === "newtonraphson" && typeof currRow.x0 === "number" && typeof currRow.fx === "number" && typeof currRow.t === "number") {
          const x0 = currRow.x0;
          const fx = currRow.fx;
          const slope = currRow.t;
          const x1 = x0 - fx / slope;

          const p0 = { x: toScreenX(x0), y: toScreenY(fx) };
          const p1 = { x: toScreenX(x1), y: toScreenY(0) };

          // Garis singgung tangen memotong sumbu x di x1
          ctx.strokeStyle = "rgba(251, 191, 36, 0.9)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();

          // Garis vertikal putus-putus turun/naik ke kurva di x1
          if (fn) {
            try {
              const fx1 = fn(x1);
              const p1Curve = { x: toScreenX(x1), y: toScreenY(fx1) };
              ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p1Curve.x, p1Curve.y);
              ctx.stroke();
              ctx.setLineDash([]);
            } catch {}
          }
        }

        // GEOMETRI SECANT: Garis Potong 2 Titik (x0, f(x0)) dan (x1, f(x1))
        if (kunci === "secant" && typeof currRow.x0 === "number" && typeof currRow.x1 === "number" && typeof currRow.x2 === "number" && fn) {
          const fx0 = fn(currRow.x0);
          const fx1 = fn(currRow.x1);
          const p0 = { x: toScreenX(currRow.x0), y: toScreenY(fx0) };
          const p1 = { x: toScreenX(currRow.x1), y: toScreenY(fx1) };
          const p2 = { x: toScreenX(currRow.x2), y: toScreenY(0) };

          ctx.strokeStyle = "rgba(251, 191, 36, 0.85)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Tandai p0 dan p1
          ctx.fillStyle = "#fbbf24";
          [p0, p1].forEach((pt) => {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }

      // 4. Sebaran Titik Riwayat Iterasi dengan Gradasi Opasitas
      const kunciTitik = kunci === "secant" ? "x2" : kunci === "newtonraphson" ? "x0" : "c";
      riw.forEach((r, idx) => {
        const x = r[kunciTitik];
        if (typeof x !== "number" || !isFinite(x)) return;
        const px = toScreenX(x);
        const py = toScreenY(0);

        const isHovered = hoveredIter === idx;
        const isActive = activeIter === idx + 1;

        const baseAlpha = 0.25 + 0.65 * ((idx + 1) / riw.length);

        if (isHovered || isActive) {
          // Halo glow
          ctx.fillStyle = isHovered ? "rgba(56, 189, 248, 0.25)" : "rgba(52, 211, 153, 0.25)";
          ctx.beginPath();
          ctx.arc(px, py, 10 + pulse * 2, 0, Math.PI * 2);
          ctx.fill();

          // Ring berdenyut
          ctx.strokeStyle = isHovered ? "#38bdf8" : "#34d399";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(px, py, 6, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(52, 211, 153, ${baseAlpha})`;
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 5. Garis & Penanda Akar Konvergen x*
      if (typeof hasil?.akar === "number" && isFinite(hasil.akar)) {
        const px = toScreenX(hasil.akar);
        const py = toScreenY(0);

        // Garis vertikal putus-putus
        ctx.strokeStyle = "#34d399";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(px, mT);
        ctx.lineTo(px, H - mB);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated ring berdenyut pada akar x*
        const ringRadius = 7 + (pulse + 1) * 3;
        ctx.strokeStyle = "rgba(52, 211, 153, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(px, py, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#34d399";
        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Label teks akar di bagian atas
        ctx.fillStyle = "#34d399";
        ctx.font = "bold 11px 'JetBrains Mono', monospace";
        const labelText = `Akar x* ≈ ${num6(hasil.akar)}`;
        const wLabel = ctx.measureText(labelText).width;
        const posLabelX = Math.min(Math.max(px + 6, mL + 6), W - mR - wLabel - 6);
        ctx.fillText(labelText, posLabelX, mT + 14);
      }

      ctx.restore();

      // 6. Crosshair Mengikuti Mouse
      if (mouse.inside && mouse.px != null && mouse.py != null) {
        if (mouse.px >= mL && mouse.px <= W - mR && mouse.py >= mT && mouse.py <= H - mB) {
          ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);

          ctx.beginPath();
          ctx.moveTo(mouse.px, mT);
          ctx.lineTo(mouse.px, H - mB);
          ctx.moveTo(mL, mouse.py);
          ctx.lineTo(W - mR, mouse.py);
          ctx.stroke();
          ctx.setLineDash([]);

          // Badge koordinat real-time di sumbu
          ctx.fillStyle = "#0b1322";
          ctx.strokeStyle = "#23395d";
          ctx.lineWidth = 1;
          ctx.font = "10px 'JetBrains Mono', monospace";

          // Sumbu X
          const coordXText = mouse.wx?.toFixed(4) || "";
          const cwX = ctx.measureText(coordXText).width + 8;
          ctx.fillRect(mouse.px - cwX / 2, H - mB + 2, cwX, 16);
          ctx.strokeRect(mouse.px - cwX / 2, H - mB + 2, cwX, 16);
          ctx.fillStyle = "#38bdf8";
          ctx.textAlign = "center";
          ctx.fillText(coordXText, mouse.px, H - mB + 14);

          // Sumbu Y
          const coordYText = mouse.wy?.toFixed(4) || "";
          const cwY = ctx.measureText(coordYText).width + 8;
          ctx.fillStyle = "#0b1322";
          ctx.fillRect(mL - cwY - 2, mouse.py - 8, cwY, 16);
          ctx.strokeRect(mL - cwY - 2, mouse.py - 8, cwY, 16);
          ctx.fillStyle = "#38bdf8";
          ctx.textAlign = "right";
          ctx.fillText(coordYText, mL - 6, mouse.py + 4);
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    dimensions,
    domain,
    range,
    margins,
    fn,
    hasil,
    kunci,
    riw,
    activeIter,
    hoveredIter,
    mouse,
    getTransformers,
  ]);

  // Data tooltip jika ada titik yang sedang di-hover
  const tooltipData = useMemo(() => {
    if (hoveredIter == null || !riw[hoveredIter]) return null;
    const r = riw[hoveredIter];
    const { toScreenX, toScreenY } = getTransformers(dimensions.width, dimensions.height);
    const kunciTitik = kunci === "secant" ? "x2" : kunci === "newtonraphson" ? "x0" : "c";
    const xVal = r[kunciTitik];
    const px = toScreenX(xVal);
    const py = toScreenY(0);

    let fxVal = null;
    if (fn && typeof xVal === "number") {
      try {
        fxVal = fn(xVal);
      } catch {}
    }

    return {
      iterNo: hoveredIter + 1,
      xVal,
      fxVal,
      px,
      py,
      detail:
        kunci === "biseksi"
          ? `[a=${num6(r.a)}, b=${num6(r.b)}]`
          : kunci === "newtonraphson"
          ? `f'(x)=${typeof r.t === "number" ? r.t.toFixed(4) : "-"}`
          : kunci === "secant"
          ? `x0=${num6(r.x0)}, x1=${num6(r.x1)}`
          : `c=${num6(r.c)}`,
    };
  }, [hoveredIter, riw, kunci, fn, getTransformers, dimensions]);

  return (
    <div className="plot-canvas-wrapper" ref={containerRef}>
      <div className="canvas-header-bar">
        <div className="canvas-title-group">
          <span className="canvas-title-label font-mono">BIDANG KARTESIUS 2D</span>
          <span className="canvas-domain-pill font-mono">
            X: [{domain[0].toFixed(2)}, {domain[1].toFixed(2)}] · Y: [{range[0].toFixed(2)},{" "}
            {range[1].toFixed(2)}]
          </span>
        </div>

        <div className="canvas-actions">
          {isZoomedOrPanned && (
            <button
              type="button"
              className="btn-reset-view font-mono"
              onClick={resetView}
              title="Kembalikan domain dan skala awal"
            >
              Reset Zoom (1.0x)
            </button>
          )}
          <span className="canvas-hint-shortcut font-mono">
            Scroll: Zoom · Drag: Pan · Klik Titik: Lompat
          </span>
        </div>
      </div>

      <div className="canvas-inner-relative">
        <canvas
          ref={canvasRef}
          className="plot-canvas-element"
          style={{ width: dimensions.width, height: dimensions.height }}
          onClick={handleCanvasClick}
          {...interaction.eventHandlers(dimensions.width, dimensions.height)}
        />

        {/* Floating Custom HTML Tooltip */}
        {tooltipData && (
          <div
            className="canvas-floating-tooltip font-mono"
            style={{
              left: Math.min(Math.max(10, tooltipData.px - 90), dimensions.width - 200),
              top: Math.max(10, tooltipData.py - 90),
            }}
          >
            <div className="tooltip-badge">ITERASI {tooltipData.iterNo}</div>
            <div className="tooltip-row">
              <span className="tt-label">x =</span>
              <span className="tt-val text-cyan">{num6(tooltipData.xVal)}</span>
            </div>
            {tooltipData.fxVal != null && (
              <div className="tooltip-row">
                <span className="tt-label">f(x) =</span>
                <span className="tt-val text-emerald">{tooltipData.fxVal.toExponential(4)}</span>
              </div>
            )}
            <div className="tooltip-hint">{tooltipData.detail}</div>
          </div>
        )}
      </div>
    </div>
  );
}