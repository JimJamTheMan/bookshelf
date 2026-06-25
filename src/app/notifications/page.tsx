import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markAllRead } from "./actions";

const TYPE_TEXT: Record<string, string> = {
  follow: "started following you",
  like_review: "liked your review",
  comment_review: "commented on your review",
  reply_comment: "replied to your comment",
  list_like: "liked your list",
  mention: "mentioned you",
  system: "",
};

type Actor = {
  id: string;
  handle: string;
  display_name: string | null;
};

type Notification = {
  id: string;
  actor_id: string | null;
  type: string;
  subject_type: string | null;
  subject_id: string | null;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${d.getUTCDate()} ${m[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("notifications")
    .select(
      "id, actor_id, type, subject_type, subject_id, body, is_read, created_at",
    )
    .eq("recipient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  const notes = (data ?? []) as Notification[];

  const actorIds = [...new Set(notes.map((n) => n.actor_id).filter(Boolean))] as string[];
  const actors: Record<string, Actor> = {};
  if (actorIds.length > 0) {
    const { data: ap } = await supabase
      .from("profiles")
      .select("id, handle, display_name")
      .in("id", actorIds);
    for (const a of (ap ?? []) as Actor[]) actors[a.id] = a;
  }

  const hasUnread = notes.some((n) => !n.is_read);

  return (
    <main className="min-h-screen text-[#e8c58f] px-4 py-8 sm:p-8">
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Notifications
          </h1>
          <Link href="/" className="text-sm text-white/50 hover:text-white/80">
            ← Home
          </Link>
        </div>

        {hasUnread && (
          <form action={markAllRead} className="mt-4">
            <button className="rounded border border-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/5">
              Mark all read
            </button>
          </form>
        )}

        {notes.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/50">
            No notifications yet. When people follow you or interact with your
            reviews, you&apos;ll see it here.
          </p>
        ) : (
          <ul className="mt-6 flex flex-col gap-2">
            {notes.map((n) => {
              const actor = n.actor_id ? actors[n.actor_id] : null;
              const text = TYPE_TEXT[n.type] ?? n.type;
              const href =
                n.type === "follow" && actor
                  ? `/u/${actor.handle}`
                  : n.subject_id
                    ? `/review/${n.subject_id}`
                    : "#";
              return (
                <li key={n.id}>
                  <Link
                    href={href}
                    className={`block rounded-lg border p-3 text-sm ${
                      n.is_read
                        ? "border-white/10 bg-black/20 text-white/70"
                        : "border-white/20 bg-white/5 text-white/90"
                    }`}
                  >
                    {!n.is_read && (
                      <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#4F7ED9] align-middle" />
                    )}
                    <span className="font-medium">
                      {actor?.display_name || actor?.handle || "Someone"}
                    </span>{" "}
                    {n.body || text}
                    <span className="ml-2 text-xs text-white/40">
                      {formatDate(n.created_at)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
