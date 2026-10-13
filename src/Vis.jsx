import React, { useEffect, useRef } from "react";
import { num6 } from "./engine.js";

const KOLOM = {
  biseksi: [["Iterasi", "no"], ["a", "a"], ["b", "b"], ["c", "c"], ["f(c)", "fc"]],
  regulafalsi: [["Iterasi", "no"], ["a", "a"], ["b", "b"], ["c", "c"], ["f(c)", "fc"]],
  newtonraphson: [["Iterasi", "no"], ["x_n", "x0"], ["f(x_n)", "fx", 6], ["f'(x_n)", "t"]],
  secant: [["Iterasi", "no"], ["x0", "x0"], ["x1", "x1"], ["x2", "x2"], ["f(x2)", "fx2"]],
};

export default function Vis({ fn, hasil, kunci }) {
  const ref = useRef(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !fn) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth;
    const H = 320;
    cv.width = W * dpr;
    cv.height = H * dpr;
    const g = cv.getContext("2d");
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);

    const fokus = hasil?.fokus?.length ? hasil.fokus : [-1, 1];
    let lo = Math.min(...fokus);
    let hi = Math.max(...fokus);
    if (!isFinite(lo) || !isFinite(hi)) {
      lo = -1;
      hi = 1;
    }
    if (hi - lo < 1) {
      const m = (lo + hi) / 2;
      lo = m - 0.5;
      hi = m + 0.5;
    }
    const pad = (hi - lo) * 0.15;
    lo -= pad;
    hi += pad;

    const N = 600;
    const titik = [];
    let ymin = Infinity;
    let ymax = -Infinity;
    for (let k = 0; k <= N; k++) {
      const x = lo + ((hi - lo) * k) / N;
      let y;
      try {
        y = fn(x);
      } catch {
        y = NaN;
      }
      if (typeof y === "number" && isFinite(y) && Math.abs(y) < 1e7) {
        titik.push([x, y]);
        if (y < ymin) ymin = y;
        if (y > ymax) ymax = y;
      }
    }
    if (!titik.length) {
      g.fillStyle = "#8b98a5";
      g.font = "13px ui-monospace, monospace";
      g.fillText("f(x) tidak dapat digambar pada rentang ini", 16, 30);
      return;
    }
    ymin = Math.min(ymin, 0);
    ymax = Math.max(ymax, 0);
    if (ymax - ymin < 1e-12) ymax = ymin + 1;
    const yPad = (ymax - ymin) * 0.2;
    ymin -= yPad;
    ymax += yPad;

    const mL = 54;
    const mR = 16;
    const mT = 16;
    const mB = 30;
    const X = (x) => mL + ((x - lo) / (hi - lo)) * (W - mL - mR);
    const Y = (y) => H - mB - ((y - ymin) / (ymax - ymin)) * (H - mT - mB);

    g.strokeStyle = "#1e2733";
    g.lineWidth = 1;
    for (let k = 0; k <= 5; k++) {
      const yy = mT + ((H - mT - mB) * k) / 5;
      const xx = mL + ((W - mL - mR) * k) / 5;
      g.beginPath();
      g.moveTo(mL, yy);
      g.lineTo(W - mR, yy);
      g.stroke();
      g.beginPath();
      g.moveTo(xx, mT);
      g.lineTo(xx, H - mB);
      g.stroke();
    }

    // sumbu y = 0
    g.strokeStyle = "#3b4a5a";
    g.beginPath();
    g.moveTo(mL, Y(0));
    g.lineTo(W - mR, Y(0));
    g.stroke();
    g.fillStyle = "#8b98a5";
    g.font = "11px ui-monospace, monospace";
    g.fillText("0", mL - 18, Y(0) + 4);
    g.fillText(lo.toFixed(2), mL, H - 10);
    g.fillText(hi.toFixed(2), W - mR - 34, H - 10);

    // kurva f(x)
    g.strokeStyle = "#7dd3fc";
    g.lineWidth = 2;
    g.beginPath();
    let mulai = true;
    for (const [x, y] of titik) {
      const px = X(x);
      const py = Y(Math.max(ymin, Math.min(ymax, y)));
      if (mulai) {
        g.moveTo(px, py);
        mulai = false;
      } else g.lineTo(px, py);
    }
    g.stroke();

    // sebaran titik iterasi
    const riw = hasil?.riwayat || [];
    const kunciTitik =
      kunci === "secant" ? "x2" : kunci === "newtonraphson" ? "x0" : "c";
    riw.forEach((r, idx) => {
      const x = r[kunciTitik];
      if (typeof x !== "number" || !isFinite(x)) return;
      const alpa = 0.25 + 0.75 * ((idx + 1) / riw.length);
      g.fillStyle = `rgba(134, 239, 172, ${alpa})`;
      g.beginPath();
      g.arc(X(x), Y(0), 3.5, 0, Math.PI * 2);
      g.fill();
    });

    // akar
    if (typeof hasil?.akar === "number" && isFinite(hasil.akar)) {
      const px = X(hasil.akar);
      g.strokeStyle = "#86efac";
      g.setLineDash([5, 4]);
      g.beginPath();
      g.moveTo(px, mT);
      g.lineTo(px, H - mB);
      g.stroke();
      g.setLineDash([]);
      g.fillStyle = "#86efac";
      g.font = "12px ui-monospace, monospace";
      const teks = `akar ≈ ${num6(hasil.akar)}`;
      const wTeks = g.measureText(teks).width;
      g.fillText(teks, Math.min(px + 6, W - mR - wTeks), mT + 12);
    }
  }, [fn, hasil, kunci]);

  const kolom = KOLOM[kunci] || [];
  const riw = hasil?.riwayat || [];

  return (
    <section className="panel">
      <h3>Grafik f(x) &amp; jejak iterasi</h3>
      <canvas ref={ref} className="kanvas" />
      {riw.length === 0 ? (
        <p className="redup">Belum ada iterasi{hasil?.gagal ? ` — ${hasil.pesan}` : ""}.</p>
      ) : (
        <div className="tabel-wrap">
          <table className="tabel">
            <thead>
              <tr>
                {kolom.map(([jt]) => (
                  <th key={jt}>{jt}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riw.map((r, idx) => (
                <tr key={idx}>
                  {kolom.map(([jt, kk, des]) => {
                    let v = kk === "no" ? idx + 1 : r[kk];
                    if (kk === "fc") v = fn(r.c);
                    const sel = typeof v === "number" ? (des === 6 && kk === "fx" ? v.toFixed(6) : num6(v)) : v;
                    return <td key={jt}>{sel}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}