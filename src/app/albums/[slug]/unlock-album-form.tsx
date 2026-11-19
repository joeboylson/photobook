"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { unlockAlbum, type UnlockAlbumState } from "./actions";

const INITIAL_STATE: UnlockAlbumState = { isWrongPassword: false };

export function UnlockAlbumForm({ slug, title }: { slug: string; title: string }) {
  const [state, submit, isPending] = useActionState(unlockAlbum.bind(null, slug), INITIAL_STATE);

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submit} className="flex items-start gap-2">
            <Field data-invalid={state.isWrongPassword || undefined} className="flex-1">
              <Input
                name="password"
                type="password"
                aria-label="Password"
                placeholder="Password"
                autoFocus
                required
                aria-invalid={state.isWrongPassword || undefined}
              />
              {state.isWrongPassword && <FieldError>Wrong password</FieldError>}
            </Field>
            <Button type="submit" size="icon" aria-label="Open album" disabled={isPending}>
              {isPending ? <Spinner /> : <ArrowRight />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
