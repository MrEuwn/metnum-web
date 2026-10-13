import React, { useEffect, useState } from "react";
import PlotCanvas from "./components/PlotCanvas.jsx";
import ConvergenceCanvas from "./components/ConvergenceCanvas.jsx";
import SurfaceCanvas from "./components/SurfaceCanvas.jsx";
import IterationTable from "./components/IterationTable.jsx";
import { num6 } from "./engine.js";

function useCountUp(targetVal, duration = 350) {
  const [displayVal, setDisplayVal] = useState(targetVal);

  useEffect(() => {
    if (typeof targetVal !== "number" || !isFinite(targetVal)) {
      setDisplayVal(targetVal);
      return;
    }

    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayVal(targetVal);
      return;
    }

    let start = null;
    const startVal = displayVal && typeof displayVal === "number" ? displayVal : targetVal * 0.9;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (targetVal - startVal) * easeProgress;
      setDisplayVal(current);
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplayVal(targetVal);
      }
    };

    const frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [targetVal, duration]);

  return displayVal;
}

export default function Vis({
  fn,
  hasil,
  kunci,
  activeIter = 0,
  hoveredIter = null,
  onHoverIter,
  onSeekIter,
}) {
  const riw = hasil?.riwayat || [];
  const animatedRoot = useCountUp(hasil?.akar);
  const [modeView, setModeView] = useState("2d");

  const isConverged = hasil?.akar != null && !hasil?.gagal;

  return (
    <section className="panel visualizer-card">
      <div className="vis-header">
        <h3 className="vis-header-title">Visualisasi &amp; Analisis Konvergensi</h3>
        <div className="vis-legend">
          <span className="legend-item">
            <span className="legend-dot dot-cyan" /> Kurva f(x)
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-amber" /> Geometri Langkah
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-green" /> Titik Iterasi
          </span>
          <span className="legend-item">
            <span className="legend-dot dot-root" /> Akar x*
          </span>
        </div>
      </div>

      {/* Toggle Mode Visualisasi */}
      <div className="vis-mode-toggle">
        <button
          type="button"
          className={`vis-mode-btn font-mono ${modeView === "2d" ? "active" : ""}`}
          onClick={() => setModeView("2d")}
        >
          Bidang 2D
        </button>
        <button
          type="button"
          className={`vis-mode-btn font-mono ${modeView === "3d" ? "active" : ""}`}
          onClick={() => setModeView("3d")}
        >
          Permukaan 3D
        </button>
      </div>

      {modeView === "2d" ? (
        /* Dual Canvas Layout: Kartesius 2D + Konvergensi Logaritmik */
        <div className="canvas-dual-layout">
          <div className="canvas-plot-col">
            <PlotCanvas
              fn={fn}
              hasil={hasil}
              kunci={kunci}
              activeIter={activeIter}
              hoveredIter={hoveredIter}
              onHoverIter={onHoverIter}
              onSeekIter={onSeekIter}
            />
          </div>

          <div className="canvas-conv-col">
            <ConvergenceCanvas
              hasil={hasil}
              fn={fn}
              kunci={kunci}
              activeIter={activeIter}
              hoveredIter={hoveredIter}
              onHoverIter={onHoverIter}
              onSeekIter={onSeekIter}
            />
          </div>
        </div>
      ) : (
        <div className="canvas-surface-layout">
          <SurfaceCanvas
            fn={fn}
            hasil={hasil}
            kunci={kunci}
            activeIter={activeIter}
            hoveredIter={hoveredIter}
          />
          <div className="canvas-conv-col">
            <ConvergenceCanvas
              hasil={hasil}
              fn={fn}
              kunci={kunci}
              activeIter={activeIter}
              hoveredIter={hoveredIter}
              onHoverIter={onHoverIter}
              onSeekIter={onSeekIter}
            />
          </div>
        </div>
      )}

      {/* Hero Metric Readout Strip */}
      {riw.length > 0 && (
        <div className="metric-strip">
          <div className={`metric-chip metric-root-hero ${isConverged ? "converged-glow" : ""}`}>
            <span className="metric-label">Akar Konvergen (x*)</span>
            <span className="metric-val-hero font-mono text-emerald">
              {hasil?.akar != null
                ? typeof animatedRoot === "number"
                  ? num6(animatedRoot)
                  : num6(hasil.akar)
                : "—"}
            </span>
          </div>

          <div className="metric-chip">
            <span className="metric-label">Residu Nilai |f(x*)|</span>
            <span className="metric-val text-cyan font-mono">
              {hasil?.akar != null && fn ? Math.abs(fn(hasil.akar)).toExponential(4) : "—"}
            </span>
          </div>

          <div className="metric-chip">
            <span className="metric-label">Total Langkah Iterasi</span>
            <span className="metric-val text-white font-mono">{hasil?.iterasi ?? riw.length}</span>
          </div>

          <div className="metric-chip">
            <span className="metric-label">Status Akhir</span>
            <span
              className={`metric-val ${
                hasil?.gagal ? "text-red" : "text-emerald font-bold"
              }`}
            >
              {hasil?.gagal ? "Tidak Konvergen" : "Konvergen Terpenuhi"}
            </span>
          </div>
        </div>
      )}

      {/* Synchronized Iteration Table */}
      <IterationTable
        hasil={hasil}
        fn={fn}
        kunci={kunci}
        activeIter={activeIter}
        hoveredIter={hoveredIter}
        onHoverIter={onHoverIter}
        onSeekIter={onSeekIter}
      />
    </section>
  );
}
