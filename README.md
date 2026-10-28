# Huzefa Dayatar — Autonomous AI Blog

Next.js (App Router) + Tailwind + Vercel Postgres (Prisma) + Gemini.
Write a post in `/admin` → Gemini generates the meta title, meta description, keywords and
NewsArticle JSON-LD → everything is saved to Postgres → the post is live at `/blog/[slug]`.

## 1. Initialise from scratch (what this project was built with)

```bash
npx create-next-app@latest huzefa-blog --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
cd huzefa-blog
npm i @prisma/client@6 react-markdown remark-gfm remark-parse unified rehype-slug github-slugger @google/genai server-only
npm i -D prisma@6 @tailwindcss/typography @types/mdast @types/hast
npm pkg set scripts.postinstall="prisma generate" scripts.build="prisma generate && next build"
```

Then copy in the files from this project (`prisma/`, `lib/`, `components/`, `app/`, `next.config.ts`).

## 2. Database (Vercel Postgres)

```bash
npm i -g vercel
vercel login
vercel link                      # link/create the Vercel project
# In the Vercel dashboard: Storage → Create → Postgres (Neon) → connect to the project
vercel env pull .env             # pulls DATABASE_URL and DATABASE_URL_UNPOOLED
npx prisma db push               # creates the Post table (and adds views/likes columns on upgrade)
```

## 3. Other environment variables

Copy `.env.example` entries into `.env` (and into Vercel → Settings → Environment Variables):

- `GEMINI_API_KEY` — from https://aistudio.google.com/apikey
- `ADMIN_PASSWORD` — your admin login
- `AUTH_SECRET` — `openssl rand -hex 32`
- `NEXT_PUBLIC_SITE_URL` — e.g. `https://yourdomain.com`

## 4. Run & deploy

```bash
npm run dev          # http://localhost:3000  (admin at /admin)
vercel --prod        # deploy
```

## Version 3 (comments, newsletter, media, analytics, new design)

- **Check which version is live:** open `https://YOUR-SITE/api/version`. It must say `"version":"3.0"`. The admin menu also shows a yellow **v3.0** tag.
- **Comments:** readers comment under every story. They stay hidden until you approve them in **/admin/comments** (Approve, Mark as spam, Delete). Spam protection: hidden bot trap, 30-second gap, max 2 links.
- **Newsletter:** sign-up forms in the footer, homepage sidebar and under every story. See **/admin/subscribers** and download everyone as a CSV for a mailing tool (Brevo, MailerLite, Substack). The site collects addresses; it does not send emails itself.
- **Media library** (**/admin/media**): upload many pictures, copy links, see which are used, delete unused ones. The editor's **Insert image** has a new tab, "My uploaded images".
- **Bulk actions** on the posts table: move to drafts, change category, delete.
- **Analytics** (**/admin/analytics**): views and likes, views by category, most-read posts, new subscribers per day.
- **New design:** black and taxi-yellow, new homepage layout, new article typography, dark mode.

### Upgrading from version 2
1. Neon, SQL Editor, branch **main**: run `prisma/upgrade-v3.sql` (safe to run twice).
2. Upload the folders `app`, `components`, `lib`, `prisma` (plus `README.md`) to GitHub. Vercel redeploys.
3. Wait for the Vercel deployment to say **Ready**, then open `/api/version`.

## Admin panel (v2)

- **Posts dashboard** (`/admin`): every post with status (Published / Scheduled / Draft), search, filter tabs,
  Edit, View/Preview, Unpublish, Delete (with confirmation).
- **Categories** (`/admin/categories`): add, rename, reorder, describe, delete (blocked while posts use it).
  Renaming a category changes its web address.
- **Editor**: toolbar, live preview, **Insert image** (upload several files from your computer *or* paste a link,
  each with optional alt text and caption, placed at the cursor), cover image upload, drafts, scheduled
  publishing (India time), featured/lead story, optional custom web address.
- **SEO & tags**: meta title, meta description and tags are always visible. *Manual* = no AI, your values are used
  (blanks filled automatically). *AI* = Gemini fills the blanks; anything you type is kept, your tags are always
  kept and sent to the AI, which may add more. Editing a post keeps its SEO unless "Regenerate SEO with AI" is ticked.
- Uploaded images are stored in the database (`Image` table) and served from `/api/img/<id>`.

### Upgrading an existing site
1. Neon → SQL Editor → run `prisma/upgrade-admin-panel.sql` (safe to run twice).
2. Upload the new `app`, `components`, `lib`, `prisma` folders to GitHub. Vercel redeploys automatically.

## Reader features

- **Home:** lead story, top stories, latest grid, per-category strips, "Most read" sidebar
- **Article page:** breadcrumbs, standfirst, byline with published/updated time and reading time,
  **view counter**, **like button**, share bar (WhatsApp, X, Facebook, LinkedIn, Telegram, copy link),
  table of contents, reading-progress bar, tags, author box, previous/next story, "Also read",
  back-to-top, sticky "Most read" sidebar
- **Listing pages:** `/category/[slug]`, `/tag/[tag]` (paginated), `/search?q=`
- **SEO:** NewsArticle + BreadcrumbList JSON-LD, Open Graph/Twitter, canonical URLs,
  `max-image-preview:large`, sitemap, robots.txt, RSS

### How views and likes work

- `POST /api/posts/[slug]/view` — +1 per visitor per post per 24 h (httpOnly cookie, enforced on the
  server); crawlers are ignored.
- `POST /api/posts/[slug]/like` — one like per visitor per post (cookie `liked_<slug>`), can be undone.
- Counts live in `Post.views` / `Post.likes`. Clearing cookies lets a visitor count again — fine for a
  blog, but add IP-based rate limiting (e.g. Upstash) if you need stricter numbers.

## Where things live

| Requirement | File |
|---|---|
| Post table + AI metadata + views/likes | `prisma/schema.prisma` |
| Gemini call + JSON-LD builder | `lib/ai.ts` |
| Server Action (AI → DB insert) | `app/actions/posts.ts` |
| Admin login + editor form | `app/admin/*` |
| Article page + SEO tags | `app/blog/[slug]/page.tsx` |
| View / like endpoints | `app/api/posts/[slug]/view`, `.../like` |
| Home page | `app/page.tsx` |
| Header, footer, global robots tag | `app/layout.tsx` |
| Name, categories, social links | `lib/site.ts` |
| RSS (latest 20) | `app/feed.xml/route.ts` |
| AdSense slots | `components/AdSlot.tsx` |
| Privacy / Terms / Contact placeholders | `app/privacy-policy`, `app/terms-of-service`, `app/contact` |

## Before applying to AdSense / Google News

- Replace the three placeholder pages with real content and a real contact email.
- Put your real profile URLs in `SOCIAL_LINKS` in `lib/site.ts`.
- Submit `https://yourdomain.com/feed.xml` in Google Publisher Center and `/sitemap.xml` in Search Console.
- Add a 1200px+ wide cover image to every post for Discover.
