"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/login/actions";

const LINKS = [
  { href: "/feed", label: "Feed" },
  { href: "/discover", label: "Discover" },
  { href: "/recommendations", label: "For you" },
  { href: "/timeline", label: "Timeline" },
  { href: "/shelf", label: "Shelf" },
  { href: "/lists", label: "Lists" },
];

export function SiteNav({
  signedIn,
  unread,
}: {
  signedIn: boolean;
  unread: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Hide the bar on auth screens — they're full-page and self-contained.
  if (["/login", "/signup", "/forgot-password"].includes(pathname)) return null;

  const active = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const linkClass = (href: string) =>
    `rounded-lg px-3 py-1.5 text-sm ${
      active(href)
        ? "bg-white/10 text-white"
        : "text-white/60 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#15130f]/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link
          href="/"
          className="font-mono text-lg font-extrabold tracking-tight"
          style={{ color: "#f7a23b", textShadow: "0 0 18px rgba(247,162,59,0.5)" }}
        >
          Bookshelf
        </Link>

        {signedIn && (
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={linkClass(l.href)}>
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {signedIn ? (
            <>
              <Link
                href="/notifications"
                className="relative hidden rounded-lg px-3 py-1.5 text-sm text-white/60 hover:bg-white/5 hover:text-white sm:block"
              >
                Alerts
                {unread > 0 && (
                  <span className="ml-1 rounded-full bg-[#D94F4F] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </Link>
              <Link
                href="/account"
                className="hidden rounded-lg px-3 py-1.5 text-sm text-white/60 hover:bg-white/5 hover:text-white sm:block"
              >
                Settings
              </Link>
              <form action={logout} className="hidden sm:block">
                <button className="rounded-lg px-3 py-1.5 text-sm text-white/60 hover:bg-white/5 hover:text-white">
                  Log out
                </button>
              </form>
              <button
                onClick={() => setOpen((o) => !o)}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-sm text-white/80 hover:bg-white/5 md:hidden"
                aria-label="Menu"
                aria-expanded={open}
              >
                ☰
              </button>
            </>
          ) : (
            <Link href="/login" className="btn-primary">
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {signedIn && open && (
        <nav className="flex flex-col gap-1 border-t border-white/10 px-5 py-3 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`rounded-lg px-3 py-2 text-sm ${
                active(l.href)
                  ? "bg-white/10 text-white"
                  : "text-white/70 hover:bg-white/5"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            Alerts{unread > 0 ? ` (${unread})` : ""}
          </Link>
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5"
          >
            Settings
          </Link>
          <form action={logout}>
            <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-white/70 hover:bg-white/5">
              Log out
            </button>
          </form>
        </nav>
      )}
    </header>
  );
}
