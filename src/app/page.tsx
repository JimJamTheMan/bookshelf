import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/login/actions";

const MEDIA = [
  { href: "/books", label: "Books", color: "#4FBF7A" },
  { href: "/films", label: "Films", color: "#D94F4F" },
  { href: "/tv", label: "TV", color: "#4F7ED9" },
  { href: "/games", label: "Games", color: "#7A4FD9" },
  { href: "/music", label: "Music", color: "#D94FB8" },
  { href: "/art", label: "Art", color: "#BFA34F" },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let unread = 0;
  if (user) {
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);
    unread = count ?? 0;
  }

  return (
    <main className="min-h-screen bg-[#15130f] text-[#f5f3ee] flex items-center justify-center p-8">
      <div className="w-full max-w-xl border border-white/10 rounded-lg p-8 bg-black/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Bookshelf</h1>
            <p className="mt-1 text-sm text-white/50">
              Your cultural ledger — everything you read, watch, play and hear.
            </p>
          </div>
          {user && (
            <form action={logout}>
              <button className="rounded border border-white/15 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/5">
                Log out
              </button>
            </form>
          )}
        </div>

        {user ? (
          <div className="mt-8">
            <h2 className="text-xs font-medium uppercase tracking-wide text-white/40">
              Log something
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MEDIA.map((m) => (
                <Link
                  key={m.href}
                  href={m.href}
                  className="flex items-center gap-2 rounded border border-white/10 bg-black/20 px-3 py-2.5 text-sm font-medium hover:border-white/30 hover:bg-white/5"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: m.color }}
                  />
                  {m.label}
                </Link>
              ))}
            </div>

            <h2 className="mt-8 text-xs font-medium uppercase tracking-wide text-white/40">
              Your library
            </h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                href="/feed"
                className="rounded bg-[#f5f3ee] px-4 py-2 text-sm font-medium text-[#15130f] hover:bg-white"
              >
                Feed
              </Link>
              <Link
                href="/discover"
                className="rounded bg-[#f5f3ee] px-4 py-2 text-sm font-medium text-[#15130f] hover:bg-white"
              >
                Discover
              </Link>
              <Link
                href="/recommendations"
                className="rounded bg-[#f5f3ee] px-4 py-2 text-sm font-medium text-[#15130f] hover:bg-white"
              >
                For you
              </Link>
              <Link
                href="/timeline"
                className="rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5"
              >
                Timeline
              </Link>
              <Link
                href="/shelf"
                className="rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5"
              >
                My shelf
              </Link>
              <Link
                href="/lists"
                className="rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5"
              >
                Lists
              </Link>
              <Link
                href="/notifications"
                className="relative rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5"
              >
                Notifications
                {unread > 0 && (
                  <span className="ml-1.5 rounded-full bg-[#D94F4F] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unread}
                  </span>
                )}
              </Link>
              <Link
                href="/profile"
                className="rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5"
              >
                My profile
              </Link>
              <Link
                href="/account"
                className="rounded border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/5"
              >
                Settings
              </Link>
            </div>

            <p className="mt-8 text-xs text-white/30">
              Signed in as {user.email}
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <div className="flex items-center gap-3">
              <span className="inline-block h-3 w-3 rounded-full bg-white/30" />
              <span className="text-sm text-white/70">Not logged in</span>
            </div>
            <Link
              href="/login"
              className="mt-6 inline-block rounded bg-[#f5f3ee] px-4 py-2 text-sm font-medium text-[#15130f] hover:bg-white"
            >
              Log in or sign up
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
