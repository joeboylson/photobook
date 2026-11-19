"use client";

import { useRef, useState } from "react";

const SWIPE_MIN_PX = 50;
export const SWIPE_EXIT_MS = 200;
const EDGE_RESISTANCE = 4;

type Drag = { photoId: string; offsetPx: number; isLeaving?: boolean };

/**
 * Horizontal swipe on touch screens: the photo follows the finger, and letting
 * go past SWIPE_MIN_PX slides it the rest of the way off screen, then steps to
 * the neighbor. Mostly-vertical drags and two-finger pinches are left alone,
 * and a drag that falls short springs back to center.
 *
 * The drag belongs to the photo being dragged, so the new photo never inherits
 * the old one's offset.
 */
export function useSwipe(photoId: string | null, onPrevious: (() => void) | null, onNext: (() => void) | null) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const currentDrag = drag && drag.photoId === photoId ? drag : null;
  const offsetPx = currentDrag?.offsetPx ?? 0;
  const isLeaving = Boolean(currentDrag?.isLeaving);

  const cancelDrag = () => {
    touchStart.current = null;
    setDrag(null);
  };

  return {
    offsetPx,
    isLeaving,
    handlers: {
      onTouchStart(event: React.TouchEvent) {
        if (isLeaving) return;
        if (event.touches.length !== 1) return cancelDrag();
        touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      },
      onTouchMove(event: React.TouchEvent) {
        if (isLeaving) return;
        if (!photoId || !touchStart.current || event.touches.length !== 1) return cancelDrag();

        const deltaX = event.touches[0].clientX - touchStart.current.x;
        const deltaY = event.touches[0].clientY - touchStart.current.y;
        const isMostlyVertical = Math.abs(deltaX) < Math.abs(deltaY);
        if (isMostlyVertical) return setDrag(null);

        const isPastFirstOrLast = (deltaX > 0 && !onPrevious) || (deltaX < 0 && !onNext);
        setDrag({ photoId, offsetPx: isPastFirstOrLast ? deltaX / EDGE_RESISTANCE : deltaX });
      },
      onTouchEnd() {
        if (isLeaving) return;
        touchStart.current = null;

        const step = offsetPx > SWIPE_MIN_PX ? onPrevious : offsetPx < -SWIPE_MIN_PX ? onNext : null;
        if (!step || !currentDrag) return setDrag(null);

        setDrag({ ...currentDrag, offsetPx: Math.sign(offsetPx) * window.innerWidth, isLeaving: true });
        setTimeout(step, SWIPE_EXIT_MS);
      },
      onTouchCancel() {
        if (!isLeaving) cancelDrag();
      },
    },
  };
}
