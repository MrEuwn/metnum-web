import React from "react";
import { Highlight, themes } from "prism-react-renderer";
import KODE from "./metode_numerik.py?raw";

// Blok fungsi tiap metode + baris f()/df()/mutlak() yang dibuktikan lewat "kilat"
const BLOK = {
  f: [5, 7],
  df: [11, 12],
  mutlak: [16, 17],
  biseksi: [52, 81],
  regulafalsi: [20, 49],
  newtonraphson: [84, 119],
  secant: [122, 166],
  main: [170, 194],
};

function diSorot(no, kejadian) {
  if (!kejadian) return false;
  const { line, stack, kilat } = kejadian;
  if (Array.isArray(kilat) && kilat.includes(no)) return true;
  for (const s of stack) {
    const r = BLOK[s];
    if (r && no >= r[0] && no <= r[1]) return true;
  }
  return false;
}

export default function CodePane({ kejadian, tampilSemua }) {
  // hanya baris yang sedang dieksekusi (+ baris "kilat" sub-fungsi) yang disorot
  const sorotan = new Set();
  if (kejadian) {
    sorotan.add(kejadian.line);
    if (Array.isArray(kejadian.kilat)) kejadian.kilat.forEach((n) => sorotan.add(n));
  }

  return (
    <Highlight theme={themes.vsDark} code={KODE.replace(/\n$/, "")} language="python">
      {({ tokens, getLineProps, getTokenProps }) => (
        <pre className="kode">
          <code>
            {tokens.map((line, i) => {
              const no = i + 1;
              const p = getLineProps({ line });
              const { key: _k, className: _c, ...rest } = p;
              const kelas = ["token-line", sorotan.has(no) ? "aktif" : ""].join(" ").trim();
              return (
                <div {...rest} key={no} className={kelas} data-no={no}>
                  <span className="gap">{String(no).padStart(3, " ")}</span>
                  <span className="isi">
                    {line.map((tk, j) => {
                      const tp = getTokenProps({ token: tk });
                      const { key: _k2, ...rest2 } = tp;
                      return tampilSemua ? (
                        <span {...rest2} key={j} />
                      ) : (
                        <span className="diredupkan" key={j}>
                          {tk.content.replace(/[^\s]/g, "·")}
                        </span>
                      );
                    })}
                  </span>
                </div>
              );
            })}
          </code>
        </pre>
      )}
    </Highlight>
  );
}