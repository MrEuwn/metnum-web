import React, { useMemo } from "react";
import katex from "katex";

const RUMUS_LATEX = {
  Biseksi: "c = \\frac{a + b}{2}",
  "Regula Falsi": "c = \\frac{a \\cdot f(b) - b \\cdot f(a)}{f(b) - f(a)}",
  "Newton-Raphson": "x_{n+1} = x_n - \\frac{f(x_n)}{f'(x_n)}",
  Secant: "x_{n+1} = x_n - f(x_n) \\cdot \\frac{x_n - x_{n-1}}{f(x_n) - f(x_{n-1})}",
};

function KaTeXMath({ tex }) {
  const rendered = useMemo(() => {
    try {
      return katex.renderToString(tex, {
        throwOnError: false,
        displayMode: true,
      });
    } catch {
      return tex;
    }
  }, [tex]);

  return <div className="katex-display-box" dangerouslySetInnerHTML={{ __html: rendered }} />;
}

export default function TheoryCard({ metode }) {
  if (!metode) return null;

  const latex = RUMUS_LATEX[metode.label] || metode.rumus;

  return (
    <div className="teori-container">
      <div className="teori-header">
        <div>
          <div className="teori-kicker">KARAKTERISTIK METODE</div>
          <h3 className="teori-title">{metode.label}</h3>
          <p className="teori-subtitle">{metode.deskripsi}</p>
        </div>
        <span className="teori-badge">{metode.tipe}</span>
      </div>

      <div className="teori-grid">
        <div className="teori-item">
          <span className="teori-label">ORDE KONVERGENSI</span>
          <span className="teori-val font-mono text-cyan">{metode.orde}</span>
        </div>
        <div className="teori-item">
          <span className="teori-label">SYARAT KEBERLAKUAN</span>
          <span className="teori-val font-mono text-white">{metode.syarat}</span>
        </div>

        <div className="teori-item col-span-2">
          <span className="teori-label">RUMUS ITERASI UTAMA (FORMULASI MATEMATIS)</span>
          <div className="rumus-katex-container">
            <KaTeXMath tex={latex} />
            <div className="rumus-raw-hint font-mono">{metode.rumus}</div>
          </div>
        </div>

        <div className="teori-item">
          <span className="teori-label">KEUNGGULAN UTAMA</span>
          <p className="teori-prose text-green">{metode.kelebihan}</p>
        </div>
        <div className="teori-item">
          <span className="teori-label">BATASAN &amp; RISIKO</span>
          <p className="teori-prose text-red">{metode.kekurangan}</p>
        </div>
      </div>
    </div>
  );
}