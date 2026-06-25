"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/login/actions";

const PRIMARY = [
  { href: "/feed", label: "Activity" },
  { href: "/discover", label: "Discover" },
  { href: "/lists", label: "Lists" },
];

// "+ Log" menu — start logging a given medium.
const ADD = [
  { href: "/books", label: "Book" },
  { href: "/films", label: "Film" },
  { href: "/tv", label: "TV show" },
  { href: "/games", label: "Game" },
  { href: "/music", label: "Album" },
  { href: "/art", label: "Artwork" },
];

// Account dropdown sections (Letterboxd-style).
const ACCOUNT = [
  { href: "/profile", label: "Edit profile" },
  { href: "/shelf", label: "Shelf" },
  { href: "/timeline", label: "Timeline" },
  { href: "/recommendations", label: "For you" },
  { href: "/lists", label: "Lists" },
  { href: "/account", label: "Settings" },
];

function Avatar({ name, url }: { name: string | null; url: string | null }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt=""
        className="h-8 w-8 rounded-full border border-white/15 object-cover"
      />
    );
  }
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f7a23b] text-sm font-bold text-[#15130f]">
      {initial}
    </span>
  );
}

export function SiteNav({
  signedIn,
  unread,
  handle,
  name,
  avatarUrl,
}: {
  signedIn: boolean;
  unread: number;
  handle: string | null;
  name: string | null;
  avatarUrl: string | null;
}) {
  const pathname = usePathname();
  const [mobile, setMobile] = useState(false);
  const [logMenu, setLogMenu] = useState(false);
  const [acct, setAcct] = useState(false);

  // Close every menu whenever the route changes.
  useEffect(() => {
    setMobile(false);
    setLogMenu(false);
    setAcct(false);
  }, [pathname]);

  if (["/login", "/signup", "/forgot-password"].includes(pathname)) return null;

  const active = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const navLink = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={`rounded-lg px-3 py-1.5 text-sm ${
        active(href)
          ? "bg-white/10 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  const badge = (
    <span className="rounded-full bg-[#D94F4F] px-1.5 py-0.5 text-[10px] font-semibold text-white">
      {unread}
    </span>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#15130f]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link
          href="/"
          className="mr-1 font-mono text-lg font-extrabold tracking-tight"
          style={{ color: "#f7a23b", textShadow: "0 0 18px rgba(247,162,59,0.5)" }}
        >
          Bookshelf
        </Link>

        {signedIn && (
          <nav className="hidden items-center gap-1 md:flex">
            {PRIMARY.map((l) => navLink(l.href, l.label))}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {/* Persistent search → Discover */}
          <form
            action="/discover"
            method="get"
            className="hidden items-center gap-2 rounded-lg border border-white/15 bg-black/30 px-3 py-1.5 focus-within:border-[#f7a23b]/70 sm:flex"
          >
            <span className="text-white/40">⌕</span>
            <input
              name="q"
              placeholder="Search…"
              className="w-28 bg-transparent text-sm outline-none placeholder:text-white/40 md:w-44"
            />
          </form>

          {signedIn ? (
            <>
              {/* + Log dropdown */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => {
                    setLogMenu((v) => !v);
                    setAcct(false);
                  }}
                  className="btn-primary !px-3 !py-1.5"
                  aria-expanded={logMenu}
                >
                  + Log
                </button>
                {logMenu && (
                  <div className="absolute right-0 z-50 mt-2 w-44 rounded-lg border border-white/10 bg-[#1c1812] p-1 shadow-xl">
                    <p className="px-3 py-1 text-[11px] uppercase tracking-wide text-white/35">
                      Log something
                    </p>
                    {ADD.map((a) => (
                      <Link
                        key={a.href}
                        href={a.href}
                        className="block rounded px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                      >
                        {a.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Avatar dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setAcct((v) => !v);
                    setLogMenu(false);
                  }}
                  className="relative flex items-center rounded-full"
                  aria-label="Account menu"
                  aria-expanded={acct}
                >
                  <Avatar name={name} url={avatarUrl} />
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#D94F4F]" />
                  )}
                </button>
                {acct && (
                  <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-white/10 bg-[#1c1812] p-1 shadow-xl">
                    <Link
                      href={handle ? `/u/${handle}` : "/profile"}
                      className="block rounded px-3 py-2 hover:bg-white/5"
                    >
                      <span className="block text-sm font-medium">
                        {name ?? "Your profile"}
                      </span>
                      {handle && (
                        <span className="block text-xs text-white/40">
                          @{handle}
                        </span>
                      )}
                    </Link>
                    <div className="my-1 h-px bg-white/10" />
                    {ACCOUNT.map((a) => (
                      <Link
                        key={a.href + a.label}
                        href={a.href}
                        className="block rounded px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                      >
                        {a.label}
                      </Link>
                    ))}
                    <Link
                      href="/notifications"
                      className="flex items-center justify-between rounded px-3 py-2 text-sm text-white/80 hover:bg-white/5"
                    >
                      Alerts {unread > 0 && badge}
                    </Link>
                    <div className="my-1 h-px bg-white/10" />
                    <form action={logout}>
                      <button className="block w-full rounded px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5">
                        Sign out
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Mobile toggle */}
              <button
                onClick={() => setMobile((v) => !v)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 md:hidden"
                aria-label="Menu"
                aria-expanded={mobile}
              >
                ☰
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary !px-4 !py-1.5">
              Sign in
            </Link>
          )}
        </div>
      </div>

      {/* Backdrop closes dropdowns */}
      {(logMenu || acct) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setLogMenu(false);
            setAcct(false);
          }}
        />
      )}

      {/* Mobile menu */}
      {signedIn && mobile && (
        <div className="border-t border-white/10 px-4 py-3 md:hidden">
          <form
            action="/discover"
            method="get"
            className="mb-3 flex items-center gap-2 rounded-lg border border-white/15 bg-black/30 px-3 py-2"
          >
            <span className="text-white/40">⌕</span>
            <input
              name="q"
              placeholder="Search…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
            />
          </form>
          <div className="grid grid-cols-2 gap-1">
            {[
              ...PRIMARY,
              ...ACCOUNT,
              { href: "/notifications", label: `Alerts${unread ? ` (${unread})` : ""}` },
            ].map((l) => (
              <Link
                key={l.href + l.label}
                href={l.href}
                className="rounded px-3 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                {l.label}
              </Link>
            ))}
          </div>
          <p className="mt-3 px-3 text-[11px] uppercase tracking-wide text-white/35">
            Log something
          </p>
          <div className="grid grid-cols-3 gap-1">
            {ADD.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="rounded px-3 py-2 text-sm text-white/80 hover:bg-white/5"
              >
                {a.label}
              </Link>
            ))}
          </div>
          <form action={logout} className="mt-3">
            <button className="w-full rounded px-3 py-2 text-left text-sm text-white/80 hover:bg-white/5">
              Sign out
            </button>
          </form>
        </div>
      )}
    </header>
  );
}
