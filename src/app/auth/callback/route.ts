import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyProfileFromMetadata } from "@/lib/profile-metadata";

// Handles the "code" style confirmation/login link (PKCE flow). Supabase's
// DEFAULT email template sends users here-style links; we exchange the code
// for a logged-in session, then send them home.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await applyProfileFromMetadata(supabase);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=` +
      encodeURIComponent(
        "Confirmation link was invalid or has expired. Try logging in, or sign up again.",
      ),
  );
}
