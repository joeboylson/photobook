"use client";

import { useState } from "react";
import { ACCESS_DETAILS } from "@/components/albums/access-icon";
import { AlbumMonthField } from "./album-month-field";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isAlbumAccess } from "@/lib/albums/album-rules";
import type { AlbumAccess } from "@/lib/albums/album-types";
import { ALBUM_ACCESS_LEVELS } from "@/lib/constants";

const ACCESS_ITEMS = ALBUM_ACCESS_LEVELS.map((level) => ({ value: level, label: ACCESS_DETAILS[level].label }));

/** Name, who can see it, and the password when it needs one. Shared by the create and settings forms. */
export function AlbumSettingsFields({
  defaultTitle,
  defaultMonth,
  defaultAccess,
  hasExistingPassword,
}: {
  defaultTitle: string;
  defaultMonth: string | null;
  defaultAccess: AlbumAccess;
  hasExistingPassword: boolean;
}) {
  const [access, setAccess] = useState<AlbumAccess>(defaultAccess);

  return (
    <>
      <Field>
        <FieldLabel htmlFor="album-title">Name</FieldLabel>
        <Input id="album-title" name="title" defaultValue={defaultTitle} required />
      </Field>
      <AlbumMonthField defaultMonth={defaultMonth} />
      <Field>
        <FieldLabel htmlFor="album-access">Who can see it</FieldLabel>
        <input type="hidden" name="access" value={access} />
        <Select
          items={ACCESS_ITEMS}
          value={access}
          onValueChange={(value) => {
            if (isAlbumAccess(value)) setAccess(value);
          }}
        >
          <SelectTrigger id="album-access" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ACCESS_ITEMS.map((item) => {
              const Icon = ACCESS_DETAILS[item.value].icon;
              return (
                <SelectItem key={item.value} value={item.value}>
                  <Icon /> {item.label}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </Field>
      {access === "password" && (
        <Field>
          <FieldLabel htmlFor="album-password">Password</FieldLabel>
          <Input
            id="album-password"
            name="password"
            type="text"
            autoComplete="off"
            placeholder={hasExistingPassword ? "Unchanged" : undefined}
            required={!hasExistingPassword}
          />
        </Field>
      )}
    </>
  );
}
