import { Grid2x2, Grid3x3, Square } from "lucide-react";

export type GridSize = "small" | "medium" | "large";

export const DEFAULT_GRID_SIZE: GridSize = "medium";

export const GRID_COLUMNS: Record<GridSize, string> = {
  small: "grid-cols-5 sm:grid-cols-8 md:grid-cols-10 xl:grid-cols-14",
  medium: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 xl:grid-cols-8",
  large: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4",
};

export const GRID_SIZE_OPTIONS = [
  { value: "small", label: "Small tiles", icon: Grid3x3 },
  { value: "medium", label: "Medium tiles", icon: Grid2x2 },
  { value: "large", label: "Large tiles", icon: Square },
] as const satisfies ReadonlyArray<{ value: GridSize; label: string; icon: typeof Square }>;

export const isGridSize = (value: unknown): value is GridSize =>
  GRID_SIZE_OPTIONS.some((option) => option.value === value);
