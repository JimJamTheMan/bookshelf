import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";
import { BackButton } from "@/app/_components/BackButton";

// The logged-in user's own profile — editable.
export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("handle, display_name, bio, avatar_url, banner_url, accent_color")
    .eq("id", user.id)
    .single();

  return (
    <main className="min-h-screen text-[#e8c58f] flex items-center justify-center p-8">
      <div className="w-full max-w-lg border border-white/10 rounded-lg p-8 bg-black/20">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Your profile</h1>
          <BackButton className="text-sm text-white/50 hover:text-white/80" />
        </div>

        {profile?.handle && (
          <p className="mt-1 text-sm text-white/50">
            Public page:{" "}
            <Link
              href={`/u/${profile.handle}`}
              className="text-white/80 underline underline-offset-2"
            >
              /u/{profile.handle}
            </Link>
          </p>
        )}

        {message && (
          <p className="mt-4 rounded bg-[#4FBF7A]/15 border border-[#4FBF7A]/30 p-3 text-sm text-[#9be3b8]">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-4 rounded bg-[#D94F4F]/15 border border-[#D94F4F]/30 p-3 text-sm text-[#eaa]">
            {error}
          </p>
        )}

        <form action={updateProfile} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Username (handle)</span>
            <input
              name="handle"
              defaultValue={profile?.handle ?? ""}
              required
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Display name</span>
            <input
              name="display_name"
              defaultValue={profile?.display_name ?? ""}
              placeholder="The name shown on your profile"
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Bio</span>
            <textarea
              name="bio"
              defaultValue={profile?.bio ?? ""}
              rows={3}
              placeholder="A few words about you"
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40 resize-y"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Avatar image URL</span>
            <input
              name="avatar_url"
              defaultValue={profile?.avatar_url ?? ""}
              placeholder="https://… (proper image upload comes later)"
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Banner image URL</span>
            <input
              name="banner_url"
              defaultValue={profile?.banner_url ?? ""}
              placeholder="https://… (wide image shown across the top of your profile)"
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Accent colour</span>
            <span className="text-xs text-white/40">
              Used to highlight your profile.
            </span>
            <input
              type="color"
              name="accent_color"
              defaultValue={profile?.accent_color ?? "#D94F4F"}
              className="h-10 w-20 rounded border border-white/15 bg-black/30"
            />
          </label>

          <button className="mt-2 self-start rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white">
            Save profile
          </button>
        </form>
      </div>
    </main>
  );
}
