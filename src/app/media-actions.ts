"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Generic "cache a chosen item then open its log form" action, used by every
// media type's search page. The media_type and source come from hidden fields.
export async function startLog(formData: FormData) {
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

  redirect(`/log/${media.id}`);
}
