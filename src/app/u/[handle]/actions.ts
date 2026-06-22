"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Follow another user. follower_id is always the logged-in user (enforced by RLS).
export async function follow(formData: FormData) {
  const followee_id = String(formData.get("followee_id") ?? "");
  const handle = String(formData.get("handle") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (followee_id && followee_id !== user.id) {
    await supabase
      .from("follows")
      .insert({ follower_id: user.id, followee_id });

    // Notify the followed user.
    const { error: notifyError } = await supabase.from("notifications").insert({
      recipient_id: followee_id,
      actor_id: user.id,
      type: "follow",
      subject_type: "profile",
      subject_id: user.id,
    });
    if (notifyError) {
      console.error("notification insert (follow) failed:", notifyError);
    }
  }

  revalidatePath(`/u/${handle}`);
}

export async function unfollow(formData: FormData) {
  const followee_id = String(formData.get("followee_id") ?? "");
  const handle = String(formData.get("handle") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("followee_id", followee_id);

  revalidatePath(`/u/${handle}`);
}
