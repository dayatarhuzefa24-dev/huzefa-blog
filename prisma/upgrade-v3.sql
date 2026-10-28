-- Huzefa Dayatar blog — upgrade v3 (comments, newsletter subscribers, media library names)
-- Run ONCE in Neon -> SQL Editor (branch: main). Safe to run again: nothing is deleted or duplicated.

ALTER TABLE "Image" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "Comment" (
  "id"        TEXT NOT NULL,
  "postId"    TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "email"     TEXT NOT NULL DEFAULT '',
  "body"      TEXT NOT NULL,
  "status"    TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Comment_postId_status_createdAt_idx" ON "Comment"("postId", "status", "createdAt");
CREATE INDEX IF NOT EXISTS "Comment_status_createdAt_idx" ON "Comment"("status", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Comment_postId_fkey') THEN
    ALTER TABLE "Comment"
      ADD CONSTRAINT "Comment_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "Subscriber" (
  "id"        TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "source"    TEXT NOT NULL DEFAULT 'site',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Subscriber_email_key" ON "Subscriber"("email");
