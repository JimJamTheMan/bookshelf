# Bookshelf — Full Project Overview

A plain-language summary of everything built so far and how it all works.

---

## 1. What Bookshelf is

A social cataloguing web app — "Letterboxd for everything." People log films,
TV, music, books, games and art into one unified, colour-coded timeline; rate
and review them; build lists; follow each other; get a feed and recommendations.
The whole point is the **cross-media** experience: a film, a half-read novel and
an album sitting side by side, colour-coded by medium.

**Status:** all 8 phases of the build are functionally complete and the app is
deployed live on Vercel. The visual design is intentionally minimal so far
(see ROADMAP.md for the "make it great" plan).

---

## 2. The big picture — how the pieces fit together

```
        You (browser)
             │
             ▼
   ┌───────────────────┐      reads/writes data       ┌──────────────────┐
   │  The Bookshelf app │ ───────────────────────────▶ │     Supabase     │
   │  (Next.js on Vercel)│ ◀─────────────────────────── │  database + auth │
   └───────────────────┘                                └──────────────────┘
             │
             │  fetches covers & details (server-side only)
             ▼
   Open Library · TMDb · IGDB(Twitch) · MusicBrainz/Cover Art · Wikimedia
```

- The **app** (Next.js) is what you see and click.
- **Supabase** stores everything (accounts, logs, reviews, lists, follows…) and
  handles login. The app talks to it for all user data.
- The **media services** (Open Library etc.) are only contacted by the app's
  *server* to fetch covers/titles, which then get saved into Supabase. Users'
  data is never sent to them.
- **Vercel** runs the app on the internet; **GitHub** stores the code Vercel
  builds from.

### Key rule we followed
Vendor data (covers, descriptions) is **display-only**. Recommendations read
**only your own activity** (ratings, follows, lists) via special database views —
never vendor metadata. This is both the better design and keeps us clear of the
vendors' AI/ML terms.

---

## 3. How a typical action works (example: logging a book)

1. You go to **Search books** and type a title.
2. The app's *server* calls **Open Library**, gets matching books, removes
   near-duplicates, and shows them with covers.
3. You click **Log this book**. The app saves that book into the catalogue
   (`media_items`) using a database function called `upsert_media_item` — the
   single official "add to catalogue" path.
4. You set a status (Read/Reading/…), a star rating, and a review. That's saved
   as a row in `logs`, tied to you and that book.
5. It now appears on your **Shelf**, **Timeline**, and (for followers) their
   **Feed**.

Every media type (films, TV, games, music, art) works the exact same way — just
a different data source and accent colour.

---

## 4. Feature-by-feature (what works and how)

**Accounts** — Sign up (email, username, display name, password) → confirm via
email → log in / out → reset password. Supabase Auth handles it; a database
trigger auto-creates your `profiles` row; we then apply your chosen
username/display-name after confirmation.

**Profiles** — Edit your display name, bio, avatar, **banner**, and **accent
colour**. Your public page (`/u/your-handle`) shows all that plus a **Featured**
row (items you pin) and your **Lists**. Visitors see only your public lists.

**Logging & media** — Six search pages (books/films/TV/games/music/art), each
fetching from its source server-side, caching chosen items, and letting you log
with status + half-star rating + review. Missing covers show a tasteful
colour-tinted tile instead of a broken image.

**Shelf & Timeline** — Shelf is a colour-coded grid of everything you've logged.
Timeline is the same data as a chronological feed with your ratings and reviews.

**Social** — Follow/unfollow people; your **Feed** shows what people you follow
have logged. Each review has its own page where others can **like** and
**comment**. **Notifications** tell you about follows/likes/comments.
*(This area is built but still needs end-to-end verification with two accounts.)*

**Lists** — Create lists (public/unlisted/private), add cross-media items to
them, view and manage them; public lists appear on your profile.

**Discover** — Search the catalogue (via the `search_media` function) and search
people by name; browse recent media and users when there's no search.

**Recommendations ("For you")** — Built only from your own ratings via the
`rec_*` database views: "more from creators you rate highly" and "people with
similar taste also rated these."

**Account & GDPR** — Settings page with change-password and a "delete my
account" that calls the database's `delete_my_account()` erase function.

---

## 5. The codebase map (where things live)

Everything is under `src/`:

- **`src/app/page.tsx`** — home / dashboard.
- **Auth pages** — `login/`, `signup/`, `forgot-password/`,
  `account/update-password/`, plus `auth/confirm/` and `auth/callback/` (handle
  the email-link click).
- **`account/`** — settings + GDPR delete.
- **`profile/`** — your editable profile. **`u/[handle]/`** — anyone's public profile.
- **Search pages** — `books/`, `films/`, `tv/`, `games/`, `music/`, `art/`.
- **`media-actions.ts`** — the shared "save chosen item then open its log" action.
- **`log/[mediaId]/`** — the log form (status, rating, review, feature toggle, add-to-list).
- **`shelf/`, `timeline/`, `feed/`** — your grid, your chronology, followed people's activity.
- **`review/[logId]/`** — public review page with likes + comments.
- **`notifications/`**, **`discover/`**, **`recommendations/`**, **`lists/`** (+ `lists/[id]/`).
- **`_components/Cover.tsx`** — the cover-image-with-fallback used everywhere.
- **`src/lib/supabase/`** — the code that connects to Supabase (browser, server, session-refresh).
- **`src/lib/`** vendor files — `openlibrary.ts`, `tmdb.ts`, `igdb.ts`,
  `musicbrainz.ts`, `wikimedia.ts` (each = "search this source").
- **`src/lib/`** helpers — `dedupe.ts` (remove duplicate results), `stars.ts`
  (rating display), `profile-metadata.ts` (apply sign-up choices).
- **`src/proxy.ts`** — runs on every request to keep you logged in.

Secrets live in **`.env.local`** (never committed to git; the live copies are set
in Vercel).

---

## 6. The database (already set up in Supabase)

Tables: `profiles`, `media_items`, `logs`, `review_likes`, `review_comments`,
`lists`, `list_items`, `list_likes`, `follows`, `activity`, `notifications`.

Functions we use: `upsert_media_item` (add to catalogue), `search_media`
(catalogue search), `delete_my_account` (GDPR erase). Recommendation views:
`rec_user_ratings`, `rec_creator_affinity`, `rec_list_cooccurrence`.

Security: "Row Level Security" means people can only read/write their own rows
(and others' public data) — enforced by the database itself, not just the app.

---

## 7. Tools & services used

- **Next.js / React / TypeScript / Tailwind CSS** — the app itself + styling.
- **Supabase** — database, login, security.
- **Vercel** — hosting (live at `bookshelf-two-gules.vercel.app`).
- **GitHub** (`JimJamTheMan/bookshelf`) + **Git** — code storage / history.
- **Media sources** — Open Library (free), TMDb (key), IGDB via Twitch (keys),
  MusicBrainz + Cover Art Archive (free), Wikimedia Commons (free).
- **Node.js / npm** — run & install everything. **VS Code** — the editor.

All services are on **free tiers**.

---

## 8. Known issues / not-yet-done

- **Social features are unverified** end-to-end (need a 2-account test);
  notifications may need a security-rule fix.
- **Emails are rate-limited** (Supabase's built-in) — plan to switch to Resend.
- **Two old ratings** display at half value (saved before the rating-scale fix).
- The **front-end is minimal** — no shared nav bar, landing page, or public
  media-detail page yet (all in ROADMAP.md).

---

## 9. How to work on it locally

1. Open the `bs` folder in VS Code.
2. In a terminal: `npm run dev`, then open `http://localhost:3000`.
3. Edits to files update the local site instantly.
4. To publish changes: commit and push to GitHub `main` → Vercel auto-deploys.

See **ROADMAP.md** for what to build next.
