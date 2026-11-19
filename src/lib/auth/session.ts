import "server-only";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Viewer } from "@/lib/albums/album-types";
import { SESSION_COOKIE_NAME, SESSION_LIFETIME_SECONDS } from "@/lib/constants";
import { readAuthEnv } from "@/lib/env";
import { isEditorEmail } from "./editor-emails";

type SessionData = {
  editorEmail?: string;
  unlockedAlbumSlugs?: string[];
};

export const getSession = async () =>
  getIronSession<SessionData>(await cookies(), {
    cookieName: SESSION_COOKIE_NAME,
    password: readAuthEnv().sessionSecret,
    ttl: SESSION_LIFETIME_SECONDS,
    cookieOptions: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
  });

// The email is checked against the current list on every request, so taking
// someone off EDITOR_EMAILS locks them out right away.
export const getViewer = async (): Promise<Viewer> => {
  const session = await getSession();
  return {
    isEditor: isEditorEmail(session.editorEmail, readAuthEnv().editorEmails),
    unlockedAlbumSlugs: session.unlockedAlbumSlugs ?? [],
  };
};

export const requireEditor = async (): Promise<void> => {
  const viewer = await getViewer();
  if (!viewer.isEditor) redirect("/sign-in");
};
