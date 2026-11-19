import { decodeIdToken } from "arctic";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { isEditorEmail } from "@/lib/auth/editor-emails";
import { createGoogleClient } from "@/lib/auth/google-client";
import { getSession } from "@/lib/auth/session";
import { OAUTH_STATE_COOKIE_NAME, OAUTH_VERIFIER_COOKIE_NAME } from "@/lib/constants";
import { readAuthEnv } from "@/lib/env";

type GoogleIdTokenClaims = { email?: string; email_verified?: boolean };

const HTTP_BAD_REQUEST = 400;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const returnedState = request.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
  const codeVerifier = cookieStore.get(OAUTH_VERIFIER_COOKIE_NAME)?.value;
  cookieStore.delete(OAUTH_STATE_COOKIE_NAME);
  cookieStore.delete(OAUTH_VERIFIER_COOKIE_NAME);

  const isValidReturn = Boolean(code && codeVerifier && returnedState && returnedState === expectedState);
  if (!isValidReturn) return new NextResponse("Sign-in expired. Try again.", { status: HTTP_BAD_REQUEST });

  const tokens = await createGoogleClient(request.nextUrl.origin).validateAuthorizationCode(code!, codeVerifier!);
  // The token came straight from Google over HTTPS, so its claims can be read without re-checking the signature.
  const claims = decodeIdToken(tokens.idToken()) as GoogleIdTokenClaims;
  const isAllowedEditor = claims.email_verified === true && isEditorEmail(claims.email, readAuthEnv().editorEmails);
  if (!isAllowedEditor) return NextResponse.redirect(new URL("/sign-in/denied", request.nextUrl.origin));

  const session = await getSession();
  session.editorEmail = claims.email;
  await session.save();

  return NextResponse.redirect(new URL("/edit", request.nextUrl.origin));
}
