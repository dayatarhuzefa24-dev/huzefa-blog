-- Upgrade for the new admin panel (categories, image uploads, drafts, featured posts).
-- Run ONCE in Neon -> SQL Editor BEFORE uploading the new code. Safe to run again.

-- 1) New columns on existing posts (old posts stay published, SEO stays "ai")
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'published';
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Post" ADD COLUMN IF NOT EXISTS "seoSource" TEXT NOT NULL DEFAULT 'ai';
CREATE INDEX IF NOT EXISTS "Post_status_publishedAt_idx" ON "Post"("status", "publishedAt");

-- 2) Editable categories (your current 6 are added for you)
CREATE TABLE IF NOT EXISTS "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name");

INSERT INTO "Category" ("id", "name", "sortOrder") VALUES
  ('cat-tech', 'Tech', 1),
  ('cat-ai', 'AI', 2),
  ('cat-mumbai-real-estate', 'Mumbai Real Estate', 3),
  ('cat-bse-sensex', 'BSE Sensex', 4),
  ('cat-gaming', 'Gaming', 5),
  ('cat-bollywood', 'Bollywood', 6)
ON CONFLICT ("name") DO NOTHING;

-- 3) Images uploaded from your computer
CREATE TABLE IF NOT EXISTS "Image" (
  "id" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "contentType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);
