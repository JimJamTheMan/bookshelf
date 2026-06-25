import { requestPasswordReset } from "./actions";
import { BackButton } from "@/app/_components/BackButton";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const { error, message } = await searchParams;

  return (
    <main className="min-h-screen text-[#e8c58f] flex items-center justify-center p-8">
      <div className="w-full max-w-sm border border-white/10 rounded-lg p-8 bg-black/20">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="mt-1 text-sm text-white/50">
          Enter your email and we&apos;ll send you a reset link.
        </p>

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

        <form action={requestPasswordReset} className="mt-6 flex flex-col gap-4">
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

          <button className="rounded bg-[#e8c58f] px-4 py-2 text-sm font-medium text-[#200f0a] hover:bg-white">
            Send reset link
          </button>
        </form>

        <BackButton className="mt-4 inline-block text-sm text-white/50 hover:text-white/80" />
      </div>
    </main>
  );
}
