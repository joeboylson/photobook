"use client";

import { useState } from "react";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { buildAlbumMonth, MONTH_OPTIONS, readAlbumYear, readMonthNumber } from "@/lib/albums/album-month";

/**
 * Month and year, sent as one "month" form field like "2026-06". A dropdown and
 * a year box rather than the browser's month picker, which desktop Safari lacks.
 * Starts on the album's month, or this month for a new album.
 */
export function AlbumMonthField({ defaultMonth }: { defaultMonth: string | null }) {
  const today = new Date();
  const [monthNumber, setMonthNumber] = useState(defaultMonth ? readMonthNumber(defaultMonth) : today.getMonth() + 1);
  const [year, setYear] = useState(defaultMonth ? readAlbumYear(defaultMonth) : String(today.getFullYear()));

  return (
    <Field>
      <FieldLabel htmlFor="album-month">When</FieldLabel>
      <input type="hidden" name="month" value={buildAlbumMonth(Number(year), monthNumber)} />
      <div className="flex gap-2">
        <Select
          items={MONTH_OPTIONS}
          value={String(monthNumber)}
          onValueChange={(value) => {
            if (value) setMonthNumber(Number(value));
          }}
        >
          <SelectTrigger id="album-month" aria-label="Month" className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTH_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          aria-label="Year"
          inputMode="numeric"
          maxLength={4}
          value={year}
          onChange={(event) => setYear(event.target.value.replace(/\D/g, ""))}
          className="w-20 tabular-nums"
        />
      </div>
    </Field>
  );
}
