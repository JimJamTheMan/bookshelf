import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Cover } from "../../_components/Cover";
import { deleteList, removeFromList } from "../actions";

const MEDIA_COLOR: Record<string, string> = {
  book: "#4FBF7A", film: "#D94F4F", tv: "#4F7ED9",
  music: "#D94FB8", game: "#7A4FD9", art: "#BFA34F",
};

type Item = {
  media_id: string;
  position: number | null;
  note: string | null;
  media: {
    id: string;
    title: string;
    creator: string | null;
    cover_url: string | null;
    media_type: string;
  } | null;
};

export default async function ListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: list } = await supabase
    .from("lists")
    .select("id, user_id, title, description, visibility, item_count")
    .eq("id", id)
    .single();

  if (!list) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwner = user?.id === list.user_id;

  const { data: itemsRaw } = await supabase
    .from("list_items")
    .select(
      "media_id, position, note, media:media_items(id, title, creator, cover_url, media_type)",
    )
    .eq("list_id", id)
    .order("position", { ascending: true });
  const items = (itemsRaw ?? []) as unknown as Item[];

  return (
    <main className="min-h-screen bg-[#15130f] text-[#f5f3ee] p-8">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <Link
            href={isOwner ? "/lists" : "/"}
            className="text-sm text-white/50 hover:text-white/80"
          >
            ← {isOwner ? "My lists" : "Home"}
          </Link>
          {isOwner && (
            <form action={deleteList}>
              <input type="hidden" name="list_id" value={list.id} />
              <button className="rounded border border-white/15 px-3 py-1.5 text-xs font-medium text-white/60 hover:bg-white/5">
                Delete list
              </button>
            </form>
          )}
        </div>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight">
          {list.title}
        </h1>
        <p className="mt-1 text-xs text-white/40 capitalize">
          {list.visibility} · {items.length} items
        </p>
        {list.description && (
          <p className="mt-2 text-sm text-white/70">{list.description}</p>
        )}

        {items.length === 0 ? (
          <p className="mt-10 text-center text-sm text-white/50">
            This list is empty.
            {isOwner && " Add items from any item's page via “Add to list”."}
          </p>
        ) : (
          <ul className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {items.map((it) =>
              it.media ? (
                <li key={it.media_id}>
                  <Link href={`/media/${it.media.id}`}>
                    <div className="flex overflow-hidden rounded border border-white/10">
                      <div
                        className="w-1 shrink-0"
                        style={{
                          background: MEDIA_COLOR[it.media.media_type] ?? "#888",
                        }}
                      />
                      <div className="aspect-[2/3] flex-1 bg-black/30">
                        <Cover
                          src={it.media.cover_url}
                          title={it.media.title}
                          color={MEDIA_COLOR[it.media.media_type] ?? "#888"}
                        />
                      </div>
                    </div>
                  </Link>
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-tight">
                    {it.media.title}
                  </p>
                  <p className="text-xs text-white/50">{it.media.creator ?? ""}</p>
                  {isOwner && (
                    <form action={removeFromList} className="mt-1">
                      <input type="hidden" name="list_id" value={list.id} />
                      <input type="hidden" name="media_id" value={it.media_id} />
                      <button className="text-xs text-white/40 hover:text-[#D94F4F]">
                        Remove
                      </button>
                    </form>
                  )}
                </li>
              ) : null,
            )}
          </ul>
        )}
      </div>
    </main>
  );
}
