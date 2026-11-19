"use client";

import { Plus } from "lucide-react";
import { useActionState } from "react";
import { createAlbumAction, type FormResult } from "@/app/edit/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldError, FieldGroup } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { AlbumSettingsFields } from "./album-settings-fields";

const INITIAL_RESULT: FormResult = { error: null, savedAt: null };

export function CreateAlbumForm() {
  const [result, submit, isPending] = useActionState(createAlbumAction, INITIAL_RESULT);

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>New album</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={submit}>
          <FieldGroup>
            <AlbumSettingsFields />
            {result.error && <FieldError>{result.error}</FieldError>}
            <Button type="submit" disabled={isPending} className="self-start">
              {isPending ? <Spinner /> : <Plus />} Create
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
