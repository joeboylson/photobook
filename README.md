# Photobook

Photo albums for family and friends. Each album is **public**, behind a short
**password**, or **private** (only the editors, signed in with Google).

- `/` lists the albums a visitor can see; `/albums/<slug>` shows one, view-only.
- Signed-in editors use the same pages: the sidebar's + creates an album, and
  the ⋯ menu on an album edits it, adds and removes photos, or deletes it.

## How it fits together

- **Vercel** runs the site (Next.js).
- **AWS S3** holds everything: web-size photo copies under `photos/<id>/` and one
  JSON file per album under `albums/<slug>.json`. There is no database. The
  bucket is private; the site hands browsers short-lived signed links, and only
  after checking the visitor may see that album.
- **Uploads** are resized in the browser (a 400px thumbnail and a 2000px copy,
  both WebP) and sent straight to S3. Originals never leave the device.
- **Sign-in** is Google, limited to the emails in `EDITOR_EMAILS`. Unlocked
  password albums and the editor sign-in live in one encrypted cookie.

AWS: project "Photobook" (account 537987987943), bucket
`photobook-537987987943` in us-east-2. The deployed site uses the IAM user
`photobook-vercel`, which can only read and write that bucket.

## Develop

```sh
aws login --profile photobook   # when the AWS session has expired
cp .env.example .env.local      # then fill it in
bun install
bun run dev
bun test
bun run typecheck
bun run seed                    # three test albums of solid colors (password: wedding)
```

Uploads from the browser only work from `http://localhost:3000` and
`https://*.vercel.app` (the bucket's CORS rules).

## Rules

See [docs/DEV_RULES.md](docs/DEV_RULES.md), [docs/UI_RULES.md](docs/UI_RULES.md)
and [docs/COMMITS.md](docs/COMMITS.md).
