"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GRID_SIZE_OPTIONS, type GridSize, isGridSize } from "./grid-sizes";

export function GridSizeToggle({ gridSize, onChange }: { gridSize: GridSize; onChange: (size: GridSize) => void }) {
  return (
    <ToggleGroup
      variant="outline"
      size="sm"
      spacing={0}
      value={[gridSize]}
      onValueChange={(values) => {
        const [picked] = values;
        if (isGridSize(picked)) onChange(picked);
      }}
    >
      {GRID_SIZE_OPTIONS.map((option) => (
        <Tooltip key={option.value}>
          <TooltipTrigger render={<ToggleGroupItem value={option.value} aria-label={option.label} />}>
            <option.icon />
          </TooltipTrigger>
          <TooltipContent>{option.label}</TooltipContent>
        </Tooltip>
      ))}
    </ToggleGroup>
  );
}
