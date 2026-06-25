import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createList } from "./actions";
import { BackButton } from "@/app/_components/BackButton";

type ListRow = {
  id: string;
  title: string;
  description: string | null;
  visibility: string;
  item_count: number | null;
};

export default async function ListsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("lists")
    .select("id, title, description, visibility, item_count")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  const lists = (data ?? []) as ListRow[];

  return (
    <main className="min-h-screen text-[#e8c58f] px-4 py-8 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">My lists</h1>
          <BackButton className="text-sm text-white/50 hover:text-white/80" />
        </div>

        {error && (
          <p className="mt-4 rounded bg-[#D94F4F]/15 border border-[#D94F4F]/30 p-3 text-sm text-[#eaa]">
            {error}
          </p>
        )}

        {/* Create a new list */}
        <form
          action={createList}
          className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4 flex flex-col gap-3"
        >
          <h2 className="text-sm font-medium uppercase tracking-wide text-white/40">
            New list
          </h2>
          <input
            name="title"
            required
            placeholder="List title (e.g. Best of 2026)"
            className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Description (optional)"
            className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40 resize-y"
          />
          <div className="flex items-center gap-3">
            <select
              name="visibility"
              defaultValue="public"
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            >
              <option value="public">Public</option>
              <option value="unlisted">Unlisted (link only)</option>
              <option value="private">Private</option>
            </select>
            <button className="rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white">
              Create list
            </button>
          </div>
        </form>

        {lists.length === 0 ? (
          <p className="mt-8 text-center text-sm text-white/50">
            No lists yet. Create one above.
          </p>
        ) : (
          <ul className="mt-8 flex flex-col gap-2">
            {lists.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/lists/${l.id}`}
                  className="block rounded-lg border border-white/10 bg-black/20 p-4 hover:border-white/30"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{l.title}</span>
                    <span className="text-xs text-white/40 capitalize">
                      {l.visibility} · {l.item_count ?? 0} items
                    </span>
                  </div>
                  {l.description && (
                    <p className="mt-1 text-sm text-white/50">{l.description}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
