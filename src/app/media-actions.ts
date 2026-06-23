"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Cache a chosen search result into the catalogue (via the official
// upsert_media_item path) and return its internal id. media_type/source and the
// display fields come from the search page's hidden form fields.
async function cacheChosenMedia(formData: FormData): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const media_type = String(formData.get("media_type") ?? "").trim();
  const source = String(formData.get("source") ?? "").trim();
  const source_id = String(formData.get("source_id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const creator = String(formData.get("creator") ?? "").trim() || null;
  const yearRaw = String(formData.get("release_year") ?? "").trim();
  const release_year = yearRaw ? Number.parseInt(yearRaw, 10) : null;
  const cover_url = String(formData.get("cover_url") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;

  const { error } = await supabase.rpc("upsert_media_item", {
    p_media_type: media_type,
    p_source: source,
    p_source_id: source_id,
    p_title: title,
    p_creator: creator,
    p_release_year: release_year,
    p_cover_url: cover_url,
    p_description: description,
  });

  if (error) {
    redirect("/?error=" + encodeURIComponent(error.message));
  }

  const { data: media } = await supabase
    .from("media_items")
    .select("id")
    .eq("source", source)
    .eq("source_id", source_id)
    .single();

  if (!media) {
    redirect("/?error=" + encodeURIComponent("Saved the item but couldn't open it."));
  }

  return media.id as string;
}

// Open a chosen item's detail page (the default click on a search result).
export async function openMedia(formData: FormData) {
  const id = await cacheChosenMedia(formData);
  redirect(`/media/${id}`);
}

// Cache a chosen item and go straight to its log form.
export async function startLog(formData: FormData) {
  const id = await cacheChosenMedia(formData);
  redirect(`/log/${id}`);
}
