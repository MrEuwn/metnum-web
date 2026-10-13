import React, { useRef, useEffect, useState, useMemo } from "react";

export default function ConvergenceCanvas({
  hasil,
  fn,
  kunci,
  activeIter,
  hoveredIter,
  onHoverIter,
  onSeekIter,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 200 });

  const riw = hasil?.riwayat || [];

  // Hitung deret error per iterasi
  const errorSeries = useMemo(() => {
    if (!riw.length) return [];
    return riw.map((r, idx) => {
      let errVal = 1e-12;
      if (kunci === "newtonraphson") {
        errVal = Math.abs(r.fx ?? (fn ? fn(r.x0) : 1e-12));
      } else if (kunci === "secant") {
        errVal = Math.abs(r.fx2 ?? (fn ? fn(r.x2) : 1e-12));
      } else {
        errVal = Math.abs(fn ? fn(r.c) : 1e-12);
      }
      return Math.max(1e-16, errVal);
    });
  }, [riw, kunci, fn]);

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 50) {
          setDimensions({
            width: Math.floor(width),
            height: 200,
          });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const margins = useMemo(() => ({ mL: 52, mR: 16, mT: 16, mB: 28 }), []);

  // Hit-testing mouse hover
  const handleMouseMove = (e) => {
    if (!errorSeries.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const W = dimensions.width;
    const { mL, mR } = margins;
    const plotW = Math.max(10, W - mL - mR);
    const N = errorSeries.length;

    let closestIdx = null;
    let closestDist = Infinity;

    for (let i = 0; i < N; i++) {
      const sx = N === 1 ? mL + plotW / 2 : mL + (i / (N - 1)) * plotW;
      const d = Math.abs(px - sx);
      if (d < 20 && d < closestDist) {
        closestDist = d;
        closestIdx = i;
      }
    }

    if (closestIdx !== hoveredIter) {
      onHoverIter?.(closestIdx);
    }
  };

  const handleMouseLeave = () => {
    onHoverIter?.(null);
  };

  const handleClick = () => {
    if (hoveredIter != null) {
      onSeekIter?.(hoveredIter);
    }
  };

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

    const { mL, mR, mT, mB } = margins;
    const plotW = Math.max(10, W - mL - mR);
    const plotH = Math.max(10, H - mT - mB);

    if (!errorSeries.length) {
      ctx.fillStyle = "#475569";
      ctx.font = "11.5px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("Menunggu komputasi iterasi...", W / 2, H / 2);
      return;
    }

    // Skala Logaritmik Y: log10(error)
    const logValues = errorSeries.map((v) => Math.log10(v));
    const minLog = Math.floor(Math.min(-6, ...logValues));
    const maxLog = Math.ceil(Math.max(1, ...logValues));

    const toScreenX = (idx) =>
      errorSeries.length === 1
        ? mL + plotW / 2
        : mL + (idx / (errorSeries.length - 1)) * plotW;

    const toScreenY = (logVal) =>
      H - mB - ((logVal - minLog) / (maxLog - minLog)) * plotH;

    // 1. Grid Garis Logaritmik Y (10^0, 10^-2, 10^-4, 10^-6, dst)
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#10192c";
    ctx.font = "9.5px 'JetBrains Mono', monospace";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "right";

    for (let exp = minLog; exp <= maxLog; exp += 2) {
      const sy = toScreenY(exp);
      ctx.beginPath();
      ctx.moveTo(mL, sy);
      ctx.lineTo(W - mR, sy);
      ctx.stroke();

      ctx.fillText(`10^${exp}`, mL - 6, sy + 3.5);
    }

    // 2. Garis Horizontal Ambang Batas Toleransi ε = 10^-5
    const tolLog = Math.log10(0.00001); // -5
    if (tolLog >= minLog && tolLog <= maxLog) {
      const tolY = toScreenY(tolLog);
      ctx.strokeStyle = "rgba(251, 191, 36, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(mL, tolY);
      ctx.lineTo(W - mR, tolY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#fbbf24";
      ctx.textAlign = "left";
      ctx.fillText("Toleransi ε = 10⁻⁵", mL + 8, tolY - 5);
    }

    // 3. Garis Kurva Penurunan Error
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2;
    ctx.beginPath();

    errorSeries.forEach((_, idx) => {
      const sx = toScreenX(idx);
      const sy = toScreenY(logValues[idx]);
      if (idx === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    });
    ctx.stroke();

    // 4. Titik-Titik Error tiap Iterasi
    errorSeries.forEach((_, idx) => {
      const sx = toScreenX(idx);
      const sy = toScreenY(logValues[idx]);

      const isHovered = hoveredIter === idx;
      const isActive = activeIter === idx + 1;

      if (isHovered || isActive) {
        ctx.fillStyle = isHovered ? "#38bdf8" : "#34d399";
        ctx.beginPath();
        ctx.arc(sx, sy, 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // 5. Label Ticks Sumbu X (Nomor Iterasi)
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "center";
    errorSeries.forEach((_, idx) => {
      if (
        errorSeries.length <= 15 ||
        idx === 0 ||
        idx === errorSeries.length - 1 ||
        (idx + 1) % 5 === 0
      ) {
        const sx = toScreenX(idx);
        ctx.fillText(`i${idx + 1}`, sx, H - mB + 14);
      }
    });
  }, [dimensions, errorSeries, margins, hoveredIter, activeIter]);

  const activeHoverData = useMemo(() => {
    if (hoveredIter == null || !errorSeries[hoveredIter]) return null;
    return {
      iter: hoveredIter + 1,
      err: errorSeries[hoveredIter],
    };
  }, [hoveredIter, errorSeries]);

  return (
    <div className="convergence-canvas-wrapper" ref={containerRef}>
      <div className="convergence-header">
        <div className="conv-title-wrap">
          <span className="conv-title font-mono">LAJU KONVERGENSI LOGARITMIK</span>
          <span className="conv-sub font-mono">log₁₀ |f(x)| vs. Iterasi (i)</span>
        </div>
        {activeHoverData && (
          <div className="conv-badge-hover font-mono">
            Iterasi {activeHoverData.iter}: Error = {activeHoverData.err.toExponential(4)}
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className="convergence-canvas-element"
        style={{ width: dimensions.width, height: dimensions.height }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
    </div>
  );
}