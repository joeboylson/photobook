import { parseEditorEmails } from "@/lib/auth/editor-emails";

const readRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}`);
  return value;
};

export type StorageEnv = {
  bucketName: string;
  region: string;
  /** Null locally, where the AWS SDK uses the `photobook` profile instead. */
  credentials: { accessKeyId: string; secretAccessKey: string } | null;
};

// Vercel reserves the usual AWS_* names, so the deployed site's key uses its own names.
export const readStorageEnv = (): StorageEnv => {
  const accessKeyId = process.env.PHOTOBOOK_AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.PHOTOBOOK_AWS_SECRET_ACCESS_KEY;
  const hasKeyPair = Boolean(accessKeyId && secretAccessKey);

  return {
    bucketName: readRequiredEnv("PHOTOBOOK_BUCKET"),
    region: readRequiredEnv("PHOTOBOOK_AWS_REGION"),
    credentials: hasKeyPair ? { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! } : null,
  };
};

// Swaps Google sign-in for a one-click sign-in as the first editor. Vercel runs
// every deploy, previews included, with NODE_ENV=production, so this can only
// ever be on for `next dev` on your own machine.
export const isEditorSignInSkipped = (): boolean =>
  process.env.NODE_ENV !== "production" && process.env.SKIP_EDITOR_SIGN_IN === "true";

export type AuthEnv = {
  sessionSecret: string;
  googleClientId: string;
  googleClientSecret: string;
  editorEmails: string[];
};

export const readAuthEnv = (): AuthEnv => ({
  sessionSecret: readRequiredEnv("SESSION_SECRET"),
  googleClientId: readRequiredEnv("GOOGLE_CLIENT_ID"),
  googleClientSecret: readRequiredEnv("GOOGLE_CLIENT_SECRET"),
  editorEmails: parseEditorEmails(readRequiredEnv("EDITOR_EMAILS")),
});
