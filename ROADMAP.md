# Bookshelf — v2 Roadmap

**Where we are:** v1 is functionally complete — all 8 phases from the master
brief are built (accounts, all 6 media types, timeline, social, lists, discovery,
profile customisation, recommendations) and deployed to Vercel. The look is
intentionally minimal. This roadmap is "make it solid, then make it great."

Effort key: 🟢 small (a session or less) · 🟡 medium · 🔴 large.

---

## Milestone 0 — Finish v1 (make it genuinely launch-ready)
*Do these before promoting the app to anyone — they're about trust & reliability.*

1. **Verify the social features** 🟢 — run the 2-account test (follow → feed →
   like → comment → notifications). Confirm notifications actually get created
   (we suspect the database security rules may block the app from writing them;
   fix if so). *Highest priority — it's the one unproven area.*
2. **Real email (Resend)** 🟡 — replace Supabase's built-in email (which rate-
   limits) so sign-up/reset emails are reliable. Needs a free Resend account.
3. **Confirm production works** 🟢 — sign up + log in on the live `.vercel.app`
   URL end-to-end.

---

## Milestone 1 — Make it feel like a real product (front-end)
*Biggest visual payoff. Right now every page is a lone card with "← Home".*

4. **App shell / navigation** 🟡 — a persistent top bar on every page: logo,
   links (Feed, Discover, Search, Shelf), a notifications bell with the unread
   count, and an avatar menu (Profile, Settings, Log out). This single change
   makes it feel finished.
5. **Logged-out landing page** 🟡 — a proper homepage for visitors explaining
   what Bookshelf is, with sign-up / log-in calls to action (instead of the bare
   "not logged in" card).
6. **Responsive & polish pass** 🟡 — make everything work nicely on a phone;
   add tasteful loading states, hover effects, and friendlier empty states.

---

## Milestone 2 — Fill the real feature gaps
*Things a user would reasonably expect that are currently thin or missing.*

7. **Public media detail page** 🔴 — one page per book/film/etc. showing its
   cover, details, **average rating**, and **everyone's reviews** — and a button
   to log/rate it yourself. (Today there's no shared page for an item; you only
   ever see your own log.) *The most valuable missing feature.*
8. **Edit & delete** 🟡 — remove a log from your shelf, delete a list, delete
   your own comment. (Currently you can mostly only create/update.)
9. **Richer profiles** 🟡 — show a user's recent activity / shelf on their
   profile, plus followers/following lists (and counts that are correct).
10. **Fuller feed** 🟡 — include follows and likes in the feed, not just new
    logs ("Alex started following Sam", "Alex liked a review").
11. **Image uploads** 🟡 — upload avatar/banner images (via Supabase Storage)
    instead of pasting a URL.

---

## Milestone 3 — Nice-to-have & future
*From the brief's "Future" list and natural follow-ons.*

- Onboarding flow for brand-new users (pick interests, find people to follow)
- Discover that also searches the live vendors, not just the cached catalogue
- Notification preferences & privacy settings
- Custom domain + Cloudflare
- Half-star UI niceties, sorting/filtering shelves, stats ("your year in media")
- (Brief's future) imports from Letterboxd/Goodreads, Spotify/Steam, achievements,
  "Media Passport", a mobile app

---

## Suggested order
Milestone 0 (finish v1) → 1 (front-end shell + landing) → 2 (media page, then
edit/delete, then profiles/feed) → 3 (as desired). Each item is independent
enough to do in its own session.
