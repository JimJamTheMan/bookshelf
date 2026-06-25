import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-screen bg-[#200f0a] text-[#e8c58f] flex items-center justify-center p-8">
      <div className="w-full max-w-sm border border-white/10 rounded-lg p-8 bg-black/20">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-white/50">Join Bookshelf.</p>

        {error && (
          <p className="mt-4 rounded bg-[#D94F4F]/15 border border-[#D94F4F]/30 p-3 text-sm text-[#eaa]">
            {error}
          </p>
        )}

        <form className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Email</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Username</span>
            <input
              name="handle"
              required
              placeholder="3–30 chars: a–z, 0–9, _"
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Display name</span>
            <input
              name="display_name"
              placeholder="The name shown on your profile"
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Password</span>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              autoComplete="new-password"
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="text-white/70">Confirm password</span>
            <input
              type="password"
              name="confirm"
              required
              minLength={6}
              autoComplete="new-password"
              className="rounded border border-white/15 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/40"
            />
          </label>

          <button
            formAction={signup}
            className="mt-2 rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white"
          >
            Create account
          </button>
        </form>

        <p className="mt-4 text-sm text-white/50">
          Already have an account?{" "}
          <Link href="/login" className="text-white/80 underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
