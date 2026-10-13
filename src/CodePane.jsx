import React, { useEffect, useRef } from "react";
import { Highlight, themes } from "prism-react-renderer";
import KODE from "./metode_numerik.py?raw";

export default function CodePane({ kejadian, sorotanRentang, onKlikBaris }) {
  const containerRef = useRef(null);

  // Auto-scroll saat baris eksekusi atau rentang bedah kode berubah
  useEffect(() => {
    if (sorotanRentang && sorotanRentang.length === 2) {
      const [start] = sorotanRentang;
      const el = containerRef.current?.querySelector(`[data-no="${start}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else if (kejadian?.line) {
      const el = containerRef.current?.querySelector(`[data-no="${kejadian.line}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [kejadian?.line, sorotanRentang]);

  const barisEksekusi = kejadian?.line;
  const setKilat = new Set(kejadian?.kilat || []);

  const [rentangAwal, rentangAkhir] =
    sorotanRentang && sorotanRentang.length === 2 ? sorotanRentang : [-1, -1];

  return (
    <div className="kode-container-wrap" ref={containerRef}>
      <Highlight theme={themes.vsDark} code={KODE.replace(/\n$/, "")} language="python">
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="kode">
            <code>
              {tokens.map((line, i) => {
                const no = i + 1;
                const p = getLineProps({ line });
                const { key: _k, className: _c, ...rest } = p;

                const isEksekusi = no === barisEksekusi;
                const isKilat = setKilat.has(no);
                const isRentang = no >= rentangAwal && no <= rentangAkhir;

                const kelas = [
                  "token-line",
                  isEksekusi ? "aktif-eksekusi" : "",
                  isRentang ? "aktif-rentang" : "",
                  isKilat ? "aktif-kilat" : "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div
                    {...rest}
                    key={no}
                    className={kelas}
                    data-no={no}
                    onClick={() => onKlikBaris?.(no)}
                  >
                    <span className="gap">
                      {isEksekusi && <span className="titik-eksekusi" title="Baris aktif" />}
                      {String(no).padStart(3, " ")}
                    </span>
                    <span className="isi">
                      {line.map((tk, j) => {
                        const tp = getTokenProps({ token: tk });
                        const { key: _k2, ...rest2 } = tp;
                        return <span {...rest2} key={j} />;
                      })}
                    </span>
                  </div>
                );
              })}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}