const EDITOR_EMAIL_SEPARATOR = ",";

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const parseEditorEmails = (rawList: string): string[] =>
  rawList.split(EDITOR_EMAIL_SEPARATOR).map(normalizeEmail).filter(Boolean);

export const isEditorEmail = (email: string | null | undefined, editorEmails: string[]): boolean => {
  if (!email) return false;
  return editorEmails.includes(normalizeEmail(email));
};
