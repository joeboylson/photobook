import { Google } from "arctic";
import { GOOGLE_CALLBACK_PATH } from "@/lib/constants";
import { readAuthEnv } from "@/lib/env";

// The callback uses whatever address the visitor came in on, so sign-in works
// on localhost and on the live site. Google only accepts addresses listed on
// the OAuth client, so preview deployments can't sign in.
export const createGoogleClient = (origin: string): Google => {
  const env = readAuthEnv();
  return new Google(env.googleClientId, env.googleClientSecret, `${origin}${GOOGLE_CALLBACK_PATH}`);
};
