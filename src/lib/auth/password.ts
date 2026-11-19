import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_SCHEME = "scrypt";
const SALT_BYTES = 16;
const HASH_BYTES = 32;
const HASH_PART_SEPARATOR = "$";

export const hashPassword = (password: string): string => {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const hash = scryptSync(password, salt, HASH_BYTES).toString("hex");
  return [HASH_SCHEME, salt, hash].join(HASH_PART_SEPARATOR);
};

export const verifyPassword = (password: string, storedHash: string): boolean => {
  const [scheme, salt, expectedHex] = storedHash.split(HASH_PART_SEPARATOR);
  const isWellFormed = scheme === HASH_SCHEME && Boolean(salt) && Boolean(expectedHex);
  if (!isWellFormed) return false;

  const expected = Buffer.from(expectedHex, "hex");
  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
};
