import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updatePassword } from "./actions";

// Reached via the password-reset email link (the user is temporarily logged in
// through the recovery session). Lets them choose a new password.
export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Open the reset link from your email to set a new password.",
        ),
    );
  }

  return (
    <main className="min-h-screen text-[#e8c58f] flex items-center justify-center p-8">
      <div className="w-full max-w-sm border border-white/10 rounded-lg p-8 bg-black/20">
        <h1 className="text-2xl font-semibold tracking-tight">
          Set a new password
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Choose a new password for your account.
        </p>

        {error && (
          <p className="mt-4 rounded bg-[#D94F4F]/15 border border-[#D94F4F]/30 p-3 text-sm text-[#eaa]">
            {error}
          </p>
        )}

        <form action={updatePassword} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">New password</span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            />
          </label>

          <button className="rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white">
            Update password
          </button>
        </form>
      </div>
    </main>
  );
}
