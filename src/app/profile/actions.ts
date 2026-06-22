"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Save changes to the logged-in user's own profile row (protected by RLS:
// users can only update their own row).
export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const handle = String(formData.get("handle") ?? "").trim().toLowerCase();
  const display_name = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const avatar_url = String(formData.get("avatar_url") ?? "").trim() || null;
  const banner_url = String(formData.get("banner_url") ?? "").trim() || null;
  let accent_color = String(formData.get("accent_color") ?? "").trim();

  // Basic handle validation: letters, numbers, underscores; 3-30 chars.
  if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
    redirect(
      "/profile?error=" +
        encodeURIComponent(
          "Username must be 3-30 characters: lowercase letters, numbers, or underscores only.",
        ),
    );
  }

  // Accent must be a hex colour; fall back to the films red if invalid.
  if (!/^#[0-9a-fA-F]{6}$/.test(accent_color)) {
    accent_color = "#D94F4F";
  }

  const { error } = await supabase
    .from("profiles")
    .update({ handle, display_name, bio, avatar_url, banner_url, accent_color })
    .eq("id", user.id);

  if (error) {
    // 23505 = unique violation (handle already taken).
    const msg =
      error.code === "23505"
        ? "That username is already taken — pick another."
        : error.message;
    redirect("/profile?error=" + encodeURIComponent(msg));
  }

  revalidatePath("/profile");
  redirect("/profile?message=" + encodeURIComponent("Profile saved."));
}

// Pin/unpin a media item to the user's profile "Featured" row (max 12).
export async function toggleFeatured(formData: FormData) {
  const mediaId = String(formData.get("media_id") ?? "");
  const redirectTo = String(formData.get("redirect_to") ?? "/profile");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("featured_media")
    .eq("id", user.id)
    .single();

  const current: string[] = (profile?.featured_media as string[]) ?? [];
  let next: string[];
  if (current.includes(mediaId)) {
    next = current.filter((id) => id !== mediaId);
  } else {
    next = [...current, mediaId].slice(0, 12);
  }

  await supabase
    .from("profiles")
    .update({ featured_media: next })
    .eq("id", user.id);

  revalidatePath(redirectTo);
  redirect(redirectTo);
}
