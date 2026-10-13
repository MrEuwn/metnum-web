import React, { useEffect, useRef } from "react";

export default function TerminalPanel({ keluaran }) {
  const konsolRef = useRef(null);

  useEffect(() => {
    if (konsolRef.current) {
      konsolRef.current.scrollTop = konsolRef.current.scrollHeight;
    }
  }, [keluaran.length]);

  return (
    <div className="terminal-card">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="tdot tdot-red" />
          <span className="tdot tdot-yellow" />
          <span className="tdot tdot-green" />
        </div>
        <span className="terminal-title font-mono">STDOUT Terminal Python</span>
        <span className="redup kecil font-mono">{keluaran.length} baris</span>
      </div>

      <div className="terminal-console font-mono" ref={konsolRef}>
        {keluaran.length === 0 ? (
          <div className="terminal-empty redup font-mono">
            &gt; Output stdout Python akan muncul di sini saat simulasi berjalan...
          </div>
        ) : (
          keluaran.map((k, i) => (
            <div key={i} className="terminal-row animate-terminal-line">
              <span className="term-line-no">{k.line}</span>
              <span className="term-text">{k.teks.replace(/^\n/, "")}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}