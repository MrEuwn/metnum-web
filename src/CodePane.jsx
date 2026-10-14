import React, { useEffect, useRef } from "react";
import { Highlight, themes } from "prism-react-renderer";
import KODE from "./metode_numerik.py?raw";

function scrollChildIntoContainer(container, child, align = "nearest") {
  if (!container || !child) return;
  const cTop = container.scrollTop;
  const cHeight = container.clientHeight;
  const elTop = child.offsetTop;
  const elHeight = child.offsetHeight;

  if (align === "center") {
    container.scrollTop = elTop - (cHeight - elHeight) / 2;
  } else {
    // nearest: only scroll if outside view
    if (elTop < cTop) {
      container.scrollTop = elTop - 10;
    } else if (elTop + elHeight > cTop + cHeight) {
      container.scrollTop = elTop + elHeight - cHeight + 10;
    }
  }
}

export default function CodePane({ kejadian, onKlikBaris }) {
  const containerRef = useRef(null);

  // Auto-scroll internal container ONLY — NEVER scrolls the window or document!
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (kejadian?.line) {
      const el = container.querySelector(`[data-no="${kejadian.line}"]`);
      if (el) {
        scrollChildIntoContainer(container, el, "nearest");
      }
    }
  }, [kejadian?.line]);

  const barisEksekusi = kejadian?.line;
  const setKilat = new Set(kejadian?.kilat || []);

  return (
    <div className="kode-container-wrap" ref={containerRef}>
      <Highlight theme={themes.vsLight} code={KODE.replace(/\n$/, "")} language="python">
        {({ tokens, getLineProps, getTokenProps }) => (
          <pre className="kode">
            <code>
              {tokens.map((line, i) => {
                const no = i + 1;
                const p = getLineProps({ line });
                const { key: _k, className: _c, ...rest } = p;

                const isEksekusi = no === barisEksekusi;
                const isKilat = setKilat.has(no);

                const kelas = [
                  "token-line",
                  isEksekusi ? "aktif-eksekusi" : "",
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
