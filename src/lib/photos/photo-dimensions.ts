export type Dimensions = { width: number; height: number };

/** Shrinks to fit inside a square of `maxEdgePx`, keeping the shape. Never enlarges. */
export const fitWithinEdge = ({ width, height }: Dimensions, maxEdgePx: number): Dimensions => {
  const longestEdge = Math.max(width, height);
  if (longestEdge <= maxEdgePx) return { width, height };

  const scale = maxEdgePx / longestEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
};
