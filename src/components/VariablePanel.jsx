import React, { useEffect, useRef, useState } from "react";

export default function VariablePanel({ kejadian }) {
  const prevVarsRef = useRef({});
  const [flashingKeys, setFlashingKeys] = useState({});

  useEffect(() => {
    if (!kejadian?.vars) return;
    const currentVars = kejadian.vars;
    const prevVars = prevVarsRef.current;
    const newlyChanged = {};

    Object.entries(currentVars).forEach(([k, v]) => {
      if (prevVars[k] !== undefined && prevVars[k] !== v) {
        newlyChanged[k] = true;
      }
    });

    if (Object.keys(newlyChanged).length > 0) {
      setFlashingKeys(newlyChanged);
      const timer = setTimeout(() => {
        setFlashingKeys({});
      }, 400);
      return () => clearTimeout(timer);
    }

    prevVarsRef.current = { ...currentVars };
  }, [kejadian?.vars]);

  return (
    <div className="state-summary-card">
      <div className="state-card-header">
        <span className="card-tag">Call Stack &amp; Context</span>
        <span className="state-line font-mono">
          {kejadian ? `Baris ${kejadian.line}` : "Idle"}
        </span>
      </div>

      <div className="stack-badge font-mono">
        def: {kejadian ? kejadian.stack.join(" › ") : "menunggu eksekusi..."}
      </div>

      {/* Local Variables Grid dengan Flash Animasi */}
      <div className="vars-container">
        <span className="vars-label">Variabel Lokal Terkini:</span>
        {kejadian?.vars && Object.keys(kejadian.vars).length > 0 ? (
          <div className="vars-grid">
            {Object.entries(kejadian.vars).map(([k, v]) => {
              const isFlashing = !!flashingKeys[k];
              return (
                <div
                  key={k}
                  className={`var-chip font-mono ${isFlashing ? "flash-var-update" : ""}`}
                >
                  <span className="var-key">{k}</span>
                  <span className="var-val">
                    {typeof v === "number" ? v.toFixed(6) : String(v)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="redup kecil pad-4">Variabel belum terisi.</p>
        )}
      </div>

      {/* Evaluasi Sub-Fungsi yang Dipanggil */}
      {kejadian?.panggil && (
        <div className="call-logs-container">
          <span className="vars-label">Evaluasi Sub-Fungsi:</span>
          <div className="call-chips-wrap">
            {kejadian.panggil.map((s, i) => (
              <span key={i} className="call-chip font-mono">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}