"use client";

import { Save, Trash2 } from "lucide-react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { deleteAlbumAction, type FormResult, updateAlbumSettingsAction } from "@/app/edit/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import type { AlbumAccess } from "@/lib/albums/album-types";
import { AlbumSettingsFields } from "./album-settings-fields";

const INITIAL_RESULT: FormResult = { error: null, savedAt: null };

export function AlbumSettingsForm({
  slug,
  title,
  access,
  hasPassword,
}: {
  slug: string;
  title: string;
  access: AlbumAccess;
  hasPassword: boolean;
}) {
  const [result, submit, isPending] = useActionState(updateAlbumSettingsAction.bind(null, slug), INITIAL_RESULT);

  useEffect(() => {
    if (result.savedAt) toast.success("Saved");
  }, [result.savedAt]);

  return (
    <Card className="max-w-md">
      <CardContent>
        <form action={submit}>
          <FieldGroup>
            <AlbumSettingsFields defaultTitle={title} defaultAccess={access} hasExistingPassword={hasPassword} />
            {result.error && <FieldError>{result.error}</FieldError>}
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? <Spinner /> : <Save />} Save
              </Button>
              <Button
                type="submit"
                variant="ghost"
                formAction={deleteAlbumAction.bind(null, slug)}
                formNoValidate
                className="ml-auto text-destructive"
                onClick={(event) => {
                  if (!confirm(`Delete “${title}” and all its photos?`)) event.preventDefault();
                }}
              >
                <Trash2 /> Delete album
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
