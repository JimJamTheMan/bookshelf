"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Create a new list and go to it.
export async function createList(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const visibility = String(formData.get("visibility") ?? "public");

  if (!title) {
    redirect("/lists?error=" + encodeURIComponent("Give your list a title."));
  }

  const { data, error } = await supabase
    .from("lists")
    .insert({ user_id: user.id, title, description, visibility })
    .select("id")
    .single();

  if (error || !data) {
    redirect("/lists?error=" + encodeURIComponent(error?.message ?? "Could not create list."));
  }

  redirect(`/lists/${data.id}`);
}

export async function deleteList(formData: FormData) {
  const id = String(formData.get("list_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("lists").delete().eq("id", id).eq("user_id", user.id);
  redirect("/lists");
}

// Add a media item to one of the user's lists. Used from the log page.
export async function addToList(formData: FormData) {
  const listId = String(formData.get("list_id") ?? "");
  const mediaId = String(formData.get("media_id") ?? "");
  const redirectTo = String(formData.get("redirect_to") ?? `/lists/${listId}`);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Append to the end: position = current item count.
  const { count } = await supabase
    .from("list_items")
    .select("media_id", { count: "exact", head: true })
    .eq("list_id", listId);

  // Ignore duplicate (same media already in list).
  await supabase
    .from("list_items")
    .insert({ list_id: listId, media_id: mediaId, position: count ?? 0 });

  revalidatePath(`/lists/${listId}`);
  redirect(redirectTo);
}

export async function removeFromList(formData: FormData) {
  const listId = String(formData.get("list_id") ?? "");
  const mediaId = String(formData.get("media_id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("list_items")
    .delete()
    .eq("list_id", listId)
    .eq("media_id", mediaId);

  revalidatePath(`/lists/${listId}`);
}
