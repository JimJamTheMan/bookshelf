"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// GDPR erase: calls the database's delete_my_account() function, which removes
// the user's data, then signs them out.
export async function deleteAccount(formData: FormData) {
  const confirm = formData.get("confirm");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (confirm !== "on") {
    redirect(
      "/account?error=" +
        encodeURIComponent("Please tick the box to confirm deletion."),
    );
  }

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    redirect("/account?error=" + encodeURIComponent(error.message));
  }

  await supabase.auth.signOut();
  redirect(
    "/login?message=" +
      encodeURIComponent("Your account and data have been deleted."),
  );
}
