"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Toggle a like on a review (log). user_id is the logged-in user (RLS-enforced).
export async function toggleLike(formData: FormData) {
  const logId = String(formData.get("log_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("review_likes")
    .select("log_id")
    .eq("user_id", user.id)
    .eq("log_id", logId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("review_likes")
      .delete()
      .eq("user_id", user.id)
      .eq("log_id", logId);
  } else {
    await supabase
      .from("review_likes")
      .insert({ user_id: user.id, log_id: logId });

    // Notify the review's author (unless liking your own).
    const { data: log } = await supabase
      .from("logs")
      .select("user_id")
      .eq("id", logId)
      .single();
    if (log && log.user_id !== user.id) {
      const { error: notifyError } = await supabase
        .from("notifications")
        .insert({
          recipient_id: log.user_id,
          actor_id: user.id,
          type: "like_review",
          subject_type: "log",
          subject_id: logId,
        });
      if (notifyError) {
        console.error("notification insert (like) failed:", notifyError);
      }
    }
  }

  revalidatePath(`/review/${logId}`);
}

// Add a comment to a review.
export async function addComment(formData: FormData) {
  const logId = String(formData.get("log_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (body) {
    await supabase
      .from("review_comments")
      .insert({ log_id: logId, user_id: user.id, body });

    // Notify the review's author (unless commenting on your own).
    const { data: log } = await supabase
      .from("logs")
      .select("user_id")
      .eq("id", logId)
      .single();
    if (log && log.user_id !== user.id) {
      const { error: notifyError } = await supabase
        .from("notifications")
        .insert({
          recipient_id: log.user_id,
          actor_id: user.id,
          type: "comment_review",
          subject_type: "log",
          subject_id: logId,
          body: body.slice(0, 140),
        });
      if (notifyError) {
        console.error("notification insert (comment) failed:", notifyError);
      }
    }
  }

  revalidatePath(`/review/${logId}`);
}
