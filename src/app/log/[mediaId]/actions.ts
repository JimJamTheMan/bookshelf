"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Save (create or update) the logged-in user's log for one media item.
export async function saveLog(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const media_id = String(formData.get("media_id") ?? "");
  const status = String(formData.get("status") ?? "completed");
  const ratingRaw = String(formData.get("rating") ?? "").trim();
  const rating = ratingRaw ? Number.parseInt(ratingRaw, 10) : null;
  const review = String(formData.get("review") ?? "").trim() || null;
  const contains_spoilers = formData.get("contains_spoilers") === "on";
  const consumedRaw = String(formData.get("consumed_on") ?? "").trim();
  const consumed_on = consumedRaw || null;

  const fields = {
    status,
    rating,
    review,
    contains_spoilers,
    consumed_on,
  };

  // Update the existing log if there is one, otherwise create it.
  const { data: existing } = await supabase
    .from("logs")
    .select("id")
    .eq("user_id", user.id)
    .eq("media_id", media_id)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("logs")
        .update(fields)
        .eq("user_id", user.id)
        .eq("media_id", media_id)
    : await supabase
        .from("logs")
        .insert({ user_id: user.id, media_id, ...fields });

  if (error) {
    redirect(`/log/${media_id}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/shelf");
  redirect("/shelf?message=" + encodeURIComponent("Saved to your shelf."));
}

// Remove the logged-in user's log for one media item ("unlog").
export async function deleteLog(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const media_id = String(formData.get("media_id") ?? "");

  const { error } = await supabase
    .from("logs")
    .delete()
    .eq("user_id", user.id)
    .eq("media_id", media_id);

  if (error) {
    redirect(`/log/${media_id}?error=` + encodeURIComponent(error.message));
  }

  revalidatePath("/shelf");
  revalidatePath("/");
  revalidatePath(`/media/${media_id}`);
  redirect("/shelf?message=" + encodeURIComponent("Removed from your shelf."));
}
