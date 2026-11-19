import { generateCodeVerifier, generateState } from "arctic";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createGoogleClient } from "@/lib/auth/google-client";
import {
  GOOGLE_OAUTH_SCOPES,
  OAUTH_COOKIE_LIFETIME_SECONDS,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_VERIFIER_COOKIE_NAME,
} from "@/lib/constants";

export async function GET(request: NextRequest) {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const authorizationUrl = createGoogleClient(request.nextUrl.origin).createAuthorizationURL(
    state,
    codeVerifier,
    GOOGLE_OAUTH_SCOPES,
  );

  const cookieStore = await cookies();
  const oauthCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: OAUTH_COOKIE_LIFETIME_SECONDS,
    path: "/",
  } as const;
  cookieStore.set(OAUTH_STATE_COOKIE_NAME, state, oauthCookieOptions);
  cookieStore.set(OAUTH_VERIFIER_COOKIE_NAME, codeVerifier, oauthCookieOptions);

  return NextResponse.redirect(authorizationUrl);
}
