import React, { useEffect, useRef } from "react";
import { num6 } from "../engine.js";

const KOLOM = {
  biseksi: [["Iterasi", "no"], ["a", "a"], ["b", "b"], ["c", "c"], ["f(c)", "fc"]],
  regulafalsi: [["Iterasi", "no"], ["a", "a"], ["b", "b"], ["c", "c"], ["f(c)", "fc"]],
  newtonraphson: [["Iterasi", "no"], ["x_n", "x0"], ["f(x_n)", "fx", 6], ["f'(x_n)", "t"]],
  secant: [["Iterasi", "no"], ["x0", "x0"], ["x1", "x1"], ["x2", "x2"], ["f(x2)", "fx2"]],
};

export default function IterationTable({
  hasil,
  fn,
  kunci,
  activeIter,
  hoveredIter,
  onHoverIter,
  onSeekIter,
}) {
  const tableWrapRef = useRef(null);
  const kolom = KOLOM[kunci] || [];
  const riw = hasil?.riwayat || [];

  // Auto-scroll baris aktif saat playback timeline — HANYA internal scroll, TIDAK scroll window!
  useEffect(() => {
    if (!activeIter || !tableWrapRef.current) return;
    const targetIdx = Math.max(0, activeIter - 1);
    const container = tableWrapRef.current;
    const el = container.querySelector(`[data-iter-row="${targetIdx}"]`);
    if (el) {
      const cTop = container.scrollTop;
      const cHeight = container.clientHeight;
      const elTop = el.offsetTop;
      const elHeight = el.offsetHeight;
      if (elTop < cTop) {
        container.scrollTop = elTop;
      } else if (elTop + elHeight > cTop + cHeight) {
        container.scrollTop = elTop + elHeight - cHeight;
      }
    }
  }, [activeIter]);

  return (
    <div className="tabel-section">
      <div className="tabel-header-bar">
        <div className="tabel-title-group">
          <span className="tabel-title font-mono">REKAM KOMPUTASI ITERASI</span>
          <span className="tabel-count-badge font-mono">{riw.length} LANGKAH TERCATAT</span>
        </div>
        <span className="tabel-hint font-mono redup kecil">
          Hover baris untuk sorot grafik · Klik baris untuk lompat langkah
        </span>
      </div>

      {riw.length === 0 ? (
        <div className="tabel-empty-box redup font-mono">
          Belum ada riwayat komputasi yang dieksekusi.
        </div>
      ) : (
        <div className="tabel-wrap" ref={tableWrapRef}>
          <table className="tabel">
            <thead>
              <tr>
                {kolom.map(([jt]) => (
                  <th key={jt}>{jt}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riw.map((r, idx) => {
                const isHovered = hoveredIter === idx;
                const isActive = activeIter === idx + 1;
                const isLast = idx === riw.length - 1;

                const rowClass = [
                  isHovered ? "baris-hovered" : "",
                  isActive ? "baris-aktif" : "",
                  isLast ? "baris-terakhir" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <tr
                    key={idx}
                    data-iter-row={idx}
                    className={rowClass}
                    onMouseEnter={() => onHoverIter?.(idx)}
                    onMouseLeave={() => onHoverIter?.(null)}
                    onClick={() => onSeekIter?.(idx)}
                  >
                    {kolom.map(([jt, kk, des]) => {
                      let v = kk === "no" ? idx + 1 : r[kk];
                      if (kk === "fc") v = fn(r.c);
                      const sel =
                        typeof v === "number"
                          ? des === 6 && kk === "fx"
                            ? v.toFixed(6)
                            : num6(v)
                          : v;
                      return <td key={jt}>{sel}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
