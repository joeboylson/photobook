"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isEditorSignInSkipped, readAuthEnv } from "@/lib/env";

// The local stand-in for Google sign-in, so it can't use requireEditor(). The
// server re-checks the setting itself: the button showing up proves nothing.
export async function signInLocallyAction(): Promise<void> {
  if (!isEditorSignInSkipped()) throw new Error("Local sign-in is off");

  const [firstEditorEmail] = readAuthEnv().editorEmails;
  if (!firstEditorEmail) throw new Error("EDITOR_EMAILS has no emails");

  const session = await getSession();
  session.editorEmail = firstEditorEmail;
  await session.save();
  revalidatePath("/", "layout");
}

export async function signOutAction(): Promise<void> {
  const session = await getSession();
  session.destroy();
  redirect("/");
}
