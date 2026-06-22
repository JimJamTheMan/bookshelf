"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Step 2 of password reset (or any logged-in password change): set a new password.
export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) {
    redirect(
      "/account/update-password?error=" +
        encodeURIComponent("Password must be at least 6 characters."),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      "/account/update-password?error=" + encodeURIComponent(error.message),
    );
  }

  redirect("/?message=" + encodeURIComponent("Password updated."));
}
