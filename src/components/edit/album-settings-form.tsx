"use client";

import { Save } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { type FormResult, updateAlbumSettingsAction } from "@/app/album-actions";
import { SAVE_BUTTON_CLASS } from "@/components/button-colors";
import { Button } from "@/components/ui/button";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import type { AlbumAccess } from "@/lib/albums/album-types";
import { cn } from "@/lib/utils";
import { AlbumSettingsFields } from "./album-settings-fields";

const INITIAL_RESULT: FormResult = { error: null, savedAt: null };

export function AlbumSettingsForm({
  slug,
  title,
  month,
  access,
  hasPassword,
}: {
  slug: string;
  title: string;
  month: string | null;
  access: AlbumAccess;
  hasPassword: boolean;
}) {
  const [result, submit, isPending] = useActionState(updateAlbumSettingsAction.bind(null, slug), INITIAL_RESULT);

  useEffect(() => {
    if (result.savedAt) toast.success("Saved");
  }, [result.savedAt]);

  return (
    <form action={submit}>
      <FieldGroup>
        <AlbumSettingsFields
          defaultTitle={title}
          defaultMonth={month}
          defaultAccess={access}
          hasExistingPassword={hasPassword}
        />
        {result.error && <FieldError>{result.error}</FieldError>}
        <Button type="submit" disabled={isPending} className={cn("w-full", SAVE_BUTTON_CLASS)}>
          {isPending ? <Spinner /> : <Save />} Save
        </Button>
      </FieldGroup>
    </form>
  );
}
