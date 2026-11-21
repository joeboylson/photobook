import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { readStorageEnv } from "@/lib/env";
import {
  PHOTO_CONTENT_TYPE,
  SIGNED_URL_LIFETIME_SECONDS,
  SIGNED_URL_WINDOW_MS,
  UPLOAD_URL_LIFETIME_SECONDS,
} from "@/lib/constants";
import { chunkList } from "@/lib/utils/concurrency";

const JSON_CONTENT_TYPE = "application/json";
const MAX_KEYS_PER_DELETE = 1000;
const WRITE_CONFLICT_ERROR_NAMES = ["PreconditionFailed", "ConditionalRequestConflict"];

/** True when a conditional write lost to someone else's change. */
export const isWriteConflict = (error: unknown): boolean =>
  error instanceof Error && WRITE_CONFLICT_ERROR_NAMES.includes(error.name);

const createClient = () => {
  const env = readStorageEnv();
  const client = new S3Client({ region: env.region, credentials: env.credentials ?? undefined });
  return { client, bucketName: env.bucketName };
};

let storage: ReturnType<typeof createClient> | null = null;
const getStorage = () => (storage ??= createClient());

export type StoredJson<T> = { value: T; etag: string };

/**
 * `ifMatch` saves only if nobody changed the object since it was read;
 * `onlyIfNew` saves only if it doesn't exist yet. Either way a conflict throws
 * instead of silently overwriting someone else's edit.
 */
export type WriteCondition = { ifMatch: string } | { onlyIfNew: true };

export const readJsonObject = async <T>(key: string): Promise<StoredJson<T> | null> => {
  const { client, bucketName } = getStorage();
  try {
    const response = await client.send(new GetObjectCommand({ Bucket: bucketName, Key: key }));
    const body = await response.Body!.transformToString();
    return { value: JSON.parse(body) as T, etag: response.ETag! };
  } catch (error) {
    if (error instanceof NoSuchKey) return null;
    throw error;
  }
};

export const writeJsonObject = async (key: string, value: unknown, condition: WriteCondition): Promise<void> => {
  const { client, bucketName } = getStorage();
  const conditionHeaders = "ifMatch" in condition ? { IfMatch: condition.ifMatch } : { IfNoneMatch: "*" };
  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: JSON.stringify(value, null, 2),
      ContentType: JSON_CONTENT_TYPE,
      ...conditionHeaders,
    }),
  );
};

export const putPhotoObject = async (key: string, body: Uint8Array): Promise<void> => {
  const { client, bucketName } = getStorage();
  await client.send(new PutObjectCommand({ Bucket: bucketName, Key: key, Body: body, ContentType: PHOTO_CONTENT_TYPE }));
};

export const listObjectKeys = async (prefix: string): Promise<string[]> => {
  const { client, bucketName } = getStorage();
  const collectPages = async (continuationToken: string | undefined, keys: string[]): Promise<string[]> => {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix, ContinuationToken: continuationToken }),
    );
    const allKeys = [...keys, ...(page.Contents ?? []).map((object) => object.Key!)];
    return page.IsTruncated ? collectPages(page.NextContinuationToken, allKeys) : allKeys;
  };
  return collectPages(undefined, []);
};

export const deleteObjects = async (keys: string[]): Promise<void> => {
  const { client, bucketName } = getStorage();
  await Promise.all(
    chunkList(keys, MAX_KEYS_PER_DELETE).map((batch) =>
      client.send(
        new DeleteObjectsCommand({ Bucket: bucketName, Delete: { Objects: batch.map((Key) => ({ Key })) } }),
      ),
    ),
  );
};

export const getCurrentSigningDate = (nowMs: number): Date =>
  new Date(Math.floor(nowMs / SIGNED_URL_WINDOW_MS) * SIGNED_URL_WINDOW_MS);

/**
 * With `saveAsFileName`, the link tells the browser to save the file under that
 * name instead of showing it. A plain download link can't do this, because the
 * bucket is on another site.
 */
export const signDownloadUrl = (key: string, signingDate: Date, saveAsFileName?: string): Promise<string> => {
  const { client, bucketName } = getStorage();
  const contentDisposition = saveAsFileName ? `attachment; filename="${saveAsFileName}"` : undefined;
  const command = new GetObjectCommand({ Bucket: bucketName, Key: key, ResponseContentDisposition: contentDisposition });
  return getSignedUrl(client, command, {
    expiresIn: SIGNED_URL_LIFETIME_SECONDS,
    signingDate,
  });
};

export const signPhotoUploadUrl = (key: string): Promise<string> => {
  const { client, bucketName } = getStorage();
  return getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: bucketName, Key: key, ContentType: PHOTO_CONTENT_TYPE }),
    { expiresIn: UPLOAD_URL_LIFETIME_SECONDS },
  );
};
