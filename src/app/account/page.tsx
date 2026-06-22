import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteAccount } from "./actions";

export default async function AccountPage({
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

  return (
    <main className="min-h-screen bg-[#15130f] text-[#f5f3ee] p-8">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            Account settings
          </h1>
          <Link href="/" className="text-sm text-white/50 hover:text-white/80">
            ← Home
          </Link>
        </div>

        <p className="mt-2 text-sm text-white/50">
          Signed in as <span className="text-white/80">{user.email}</span>
        </p>

        {error && (
          <p className="mt-4 rounded bg-[#D94F4F]/15 border border-[#D94F4F]/30 p-3 text-sm text-[#eaa]">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/profile"
            className="rounded border border-white/15 bg-black/20 p-4 text-sm hover:border-white/30"
          >
            Edit profile (name, bio, avatar, banner, accent)
          </Link>
          <Link
            href="/account/update-password"
            className="rounded border border-white/15 bg-black/20 p-4 text-sm hover:border-white/30"
          >
            Change password
          </Link>
        </div>

        {/* Danger zone */}
        <div className="mt-10 rounded-lg border border-[#D94F4F]/40 bg-[#D94F4F]/5 p-4">
          <h2 className="text-sm font-semibold text-[#eaa]">Danger zone</h2>
          <p className="mt-1 text-sm text-white/60">
            Permanently delete your account and all your data (logs, reviews,
            lists, follows). This cannot be undone.
          </p>
          <form action={deleteAccount} className="mt-4 flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm text-white/80">
              <input type="checkbox" name="confirm" />
              I understand this is permanent.
            </label>
            <button className="self-start rounded bg-[#D94F4F] px-4 py-2 text-sm font-medium text-white hover:bg-[#c34444]">
              Delete my account
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
