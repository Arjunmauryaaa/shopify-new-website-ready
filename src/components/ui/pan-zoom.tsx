"use client";

import { useRef, useState, type ReactNode } from "react";

const MIN = 1;
const MAX = 4;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Pinch / wheel / double-tap zoom with drag-to-pan. Pointer Events handle mouse, touch and pen alike.
 * The zoom controls are real buttons, so it also works without a pointer or with a screen reader.
 */
export function PanZoom({ children, label = "Zoomable image" }: { children: ReactNode; label?: string }) {
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const box = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; scale: number } | null>(null);
  const lastTap = useRef(0);

  const bound = (scale: number, x: number, y: number) => {
    const w = box.current?.clientWidth ?? 0;
    const h = box.current?.clientHeight ?? 0;
    const maxX = (w * (scale - 1)) / 2;
    const maxY = (h * (scale - 1)) / 2;
    return { scale, x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  };

  const zoomTo = (next: number) => setView((v) => (next <= MIN ? { scale: 1, x: 0, y: 0 } : bound(clamp(next, MIN, MAX), v.x, v.y)));

  function onPointerDown(e: React.PointerEvent) {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
    }
    const now = Date.now();
    if (pointers.current.size === 1 && now - lastTap.current < 300) setView((v) => (v.scale > 1 ? { scale: 1, x: 0, y: 0 } : bound(2.5, 0, 0)));
    lastTap.current = now;
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const ratio = Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.dist;
      setView((v) => bound(clamp(pinch.current!.scale * ratio, MIN, MAX), v.x, v.y));
    } else if (pointers.current.size === 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      setView((v) => (v.scale > 1 ? bound(v.scale, v.x + dx, v.y + dy) : v));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
  }

  return (
    <div className="panzoom" role="group" aria-label={label}>
      <div
        ref={box}
        className="panzoom__stage"
        data-zoomed={view.scale > 1}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={(e) => zoomTo(view.scale - e.deltaY * 0.004)}
      >
        <div className="panzoom__content" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})` }}>
          {children}
        </div>
      </div>
      <div className="panzoom__controls">
        <button type="button" aria-label="Zoom out" disabled={view.scale <= MIN} onClick={() => zoomTo(view.scale - 0.75)}>−</button>
        <output aria-live="polite">{Math.round(view.scale * 100)}%</output>
        <button type="button" aria-label="Zoom in" disabled={view.scale >= MAX} onClick={() => zoomTo(view.scale + 0.75)}>+</button>
      </div>
    </div>
  );
}
