"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Full sign-up: collects username + display name up front. We stash the chosen
// handle/display name in auth metadata and apply them to the profile once the
// email is confirmed (see the /auth/confirm and /auth/callback routes).
export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const handle = String(formData.get("handle") ?? "").trim().toLowerCase();
  const display_name = String(formData.get("display_name") ?? "").trim();

  const fail = (msg: string) =>
    redirect("/signup?error=" + encodeURIComponent(msg));

  if (password.length < 6) fail("Password must be at least 6 characters.");
  if (password !== confirm) fail("Passwords don't match.");
  if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
    fail("Username must be 3–30 chars: lowercase letters, numbers, underscores.");
  }

  const supabase = await createClient();

  // Username availability check (profiles are publicly readable).
  const { data: taken } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .maybeSingle();
  if (taken) fail("That username is already taken — pick another.");

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { desired_handle: handle, display_name } },
  });

  if (error) fail(error.message);

  redirect(
    "/login?message=" +
      encodeURIComponent(
        "Account created. Check your email and click the confirmation link, then log in.",
      ),
  );
}
