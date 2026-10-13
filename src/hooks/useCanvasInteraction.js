import { useState, useCallback, useRef, useEffect } from "react";

export function useCanvasInteraction({
  baseDomain = [-5, 5],
  baseRange = [-5, 5],
  margins = { mL: 54, mR: 16, mT: 16, mB: 30 },
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 }); // offset in world units
  const [mouse, setMouse] = useState({ px: null, py: null, wx: null, wy: null, inside: false });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const isZoomedOrPanned = zoom !== 1 || pan.x !== 0 || pan.y !== 0;

  // Hitung domain & range efektif dengan pan dan zoom
  const spanX = (baseDomain[1] - baseDomain[0]) / zoom;
  const centerX = (baseDomain[0] + baseDomain[1]) / 2 + pan.x;
  const domain = [centerX - spanX / 2, centerX + spanX / 2];

  const spanY = (baseRange[1] - baseRange[0]) / zoom;
  const centerY = (baseRange[0] + baseRange[1]) / 2 + pan.y;
  const range = [centerY - spanY / 2, centerY + spanY / 2];

  // Helper konversi world <-> screen
  const getTransformers = useCallback(
    (W, H) => {
      const { mL, mR, mT, mB } = margins;
      const plotW = Math.max(10, W - mL - mR);
      const plotH = Math.max(10, H - mT - mB);

      const toScreenX = (wx) => mL + ((wx - domain[0]) / (domain[1] - domain[0])) * plotW;
      const toScreenY = (wy) => H - mB - ((wy - range[0]) / (range[1] - range[0])) * plotH;

      const toWorldX = (px) => domain[0] + ((px - mL) / plotW) * (domain[1] - domain[0]);
      const toWorldY = (py) => range[0] + ((H - mB - py) / plotH) * (range[1] - range[0]);

      return { toScreenX, toScreenY, toWorldX, toWorldY, plotW, plotH };
    },
    [domain, range, margins]
  );

  const handleWheel = useCallback(
    (e, W, H) => {
      e.preventDefault();
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;

      const { toWorldX, toWorldY } = getTransformers(W, H);
      const wxBefore = toWorldX(px);
      const wyBefore = toWorldY(py);

      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const nextZoom = Math.min(Math.max(0.1, zoom * factor), 100);

      // Sesuaikan pan agar titik kursor tetap diam di world
      const nextSpanX = (baseDomain[1] - baseDomain[0]) / nextZoom;
      const nextSpanY = (baseRange[1] - baseRange[0]) / nextZoom;

      const { mL, mR, mT, mB } = margins;
      const plotW = Math.max(10, W - mL - mR);
      const plotH = Math.max(10, H - mT - mB);

      const ratioX = (px - mL) / plotW;
      const nextDomain0 = wxBefore - ratioX * nextSpanX;
      const nextCenterX = nextDomain0 + nextSpanX / 2;
      const nextPanX = nextCenterX - (baseDomain[0] + baseDomain[1]) / 2;

      const ratioY = (H - mB - py) / plotH;
      const nextRange0 = wyBefore - ratioY * nextSpanY;
      const nextCenterY = nextRange0 + nextSpanY / 2;
      const nextPanY = nextCenterY - (baseRange[0] + baseRange[1]) / 2;

      setZoom(nextZoom);
      setPan({ x: nextPanX, y: nextPanY });
    },
    [zoom, baseDomain, baseRange, getTransformers, margins]
  );

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // Hanya klik kiri
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  }, [pan]);

  const handleMouseMove = useCallback(
    (e, W, H) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const { toWorldX, toWorldY } = getTransformers(W, H);

      setMouse({
        px,
        py,
        wx: toWorldX(px),
        wy: toWorldY(py),
        inside: true,
      });

      if (isDraggingRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        const { plotW, plotH } = getTransformers(W, H);

        const worldDeltaX = -(dx / plotW) * (domain[1] - domain[0]);
        const worldDeltaY = (dy / plotH) * (range[1] - range[0]);

        setPan({
          x: panStartRef.current.x + worldDeltaX,
          y: panStartRef.current.y + worldDeltaY,
        });
      }
    },
    [domain, range, getTransformers]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    setMouse((m) => ({ ...m, inside: false }));
  }, []);

  const handleDoubleClick = useCallback(() => {
    resetView();
  }, [resetView]);

  return {
    domain,
    range,
    zoom,
    pan,
    isZoomedOrPanned,
    mouse,
    resetView,
    getTransformers,
    eventHandlers: (W, H) => ({
      onWheel: (e) => handleWheel(e, W, H),
      onMouseDown: handleMouseDown,
      onMouseMove: (e) => handleMouseMove(e, W, H),
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onDoubleClick: handleDoubleClick,
    }),
  };
}