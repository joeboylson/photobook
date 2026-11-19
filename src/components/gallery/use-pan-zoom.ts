"use client";

import { useEffect, useRef, useState } from "react";

const MAX_SCALE = 8;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_WINDOW_MS = 300;
const TRACKPAD_PINCH_SPEED = 0.01;
const WHEEL_ZOOM_SPEED = 0.002;

type View = { scale: number; x: number; y: number };
const FITTED_VIEW: View = { scale: 1, x: 0, y: 0 };

/**
 * Pan and zoom for the lightbox: mouse wheel or trackpad pinch, two-finger
 * pinch, drag to pan, double-click or double-tap to zoom in or back out. The
 * photo starts fitted to the screen and can't be zoomed out past that or
 * dragged off it.
 */
export function usePanZoom(
  boxRef: React.RefObject<HTMLDivElement | null>,
  imageRef: React.RefObject<HTMLImageElement | null>,
  boxElement: HTMLDivElement | null,
) {
  const [view, setView] = useState<View>(FITTED_VIEW);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastTapAt = useRef(0);

  /** Keeps the photo covering the screen once it's bigger than it. */
  const clampView = (candidate: View): View => {
    const box = boxRef.current?.getBoundingClientRect();
    const image = imageRef.current;
    if (!box || !image) return candidate;

    const scale = Math.min(MAX_SCALE, Math.max(1, candidate.scale));
    const maxX = Math.max(0, (image.offsetWidth * scale - box.width) / 2);
    const maxY = Math.max(0, (image.offsetHeight * scale - box.height) / 2);
    return {
      scale,
      x: Math.min(maxX, Math.max(-maxX, candidate.x)),
      y: Math.min(maxY, Math.max(-maxY, candidate.y)),
    };
  };

  /** Zooms to `scale`, keeping the screen point (clientX, clientY) where it is. */
  const zoomAround = (current: View, scale: number, clientX: number, clientY: number): View => {
    const box = boxRef.current!.getBoundingClientRect();
    const pointX = clientX - (box.left + box.width / 2);
    const pointY = clientY - (box.top + box.height / 2);
    const nextScale = Math.min(MAX_SCALE, Math.max(1, scale));
    const ratio = nextScale / current.scale;
    return clampView({
      scale: nextScale,
      x: pointX - (pointX - current.x) * ratio,
      y: pointY - (pointY - current.y) * ratio,
    });
  };

  // React's onWheel is passive, so stopping the browser's own zoom needs a real
  // listener, attached once the dialog's portal has mounted the box.
  useEffect(() => {
    if (!boxElement) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      // Trackpad pinches arrive as ctrl+wheel with small deltas.
      const speed = event.ctrlKey ? TRACKPAD_PINCH_SPEED : WHEEL_ZOOM_SPEED;
      setView((current) =>
        zoomAround(current, current.scale * Math.exp(-event.deltaY * speed), event.clientX, event.clientY),
      );
    };
    boxElement.addEventListener("wheel", onWheel, { passive: false });
    return () => boxElement.removeEventListener("wheel", onWheel);
    // zoomAround only reads refs, so the listener never goes stale.
  }, [boxElement]);

  const handlers = {
    onPointerDown(event: React.PointerEvent) {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.current.size !== 1) return;

      const now = Date.now();
      const isDoubleTap = now - lastTapAt.current < DOUBLE_TAP_WINDOW_MS;
      if (!isDoubleTap) {
        lastTapAt.current = now;
        return;
      }
      lastTapAt.current = 0;
      setView((current) =>
        current.scale > 1 ? FITTED_VIEW : zoomAround(current, DOUBLE_TAP_SCALE, event.clientX, event.clientY),
      );
    },
    onPointerMove(event: React.PointerEvent) {
      const previous = pointers.current.get(event.pointerId);
      if (!previous) return;

      const otherPointers = [...pointers.current.entries()]
        .filter(([pointerId]) => pointerId !== event.pointerId)
        .map(([, point]) => point);
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (otherPointers.length === 0) {
        setView((current) =>
          clampView({ ...current, x: current.x + event.clientX - previous.x, y: current.y + event.clientY - previous.y }),
        );
        return;
      }
      if (otherPointers.length !== 1) return;

      // Pinch: scale by the change in finger distance around their midpoint, and pan with the midpoint.
      const [other] = otherPointers;
      const previousDistance = Math.hypot(previous.x - other.x, previous.y - other.y);
      const currentDistance = Math.hypot(event.clientX - other.x, event.clientY - other.y);
      if (!previousDistance) return;

      const midpoint = { x: (event.clientX + other.x) / 2, y: (event.clientY + other.y) / 2 };
      const panX = (event.clientX - previous.x) / 2;
      const panY = (event.clientY - previous.y) / 2;
      setView((current) => {
        const zoomed = zoomAround(current, current.scale * (currentDistance / previousDistance), midpoint.x, midpoint.y);
        return clampView({ ...zoomed, x: zoomed.x + panX, y: zoomed.y + panY });
      });
    },
    onPointerUp(event: React.PointerEvent) {
      pointers.current.delete(event.pointerId);
    },
    onPointerCancel(event: React.PointerEvent) {
      pointers.current.delete(event.pointerId);
    },
  };

  return { view, handlers, resetView: () => setView(FITTED_VIEW) };
}
