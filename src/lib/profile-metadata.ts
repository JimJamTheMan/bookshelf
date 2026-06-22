import type { SupabaseClient } from "@supabase/supabase-js";

// After email confirmation, copy the username/display-name the user chose at
// sign-up (stashed in auth metadata) onto their profile row. Best-effort:
// a taken username is ignored and the user can change it later on /profile.
export async function applyProfileFromMetadata(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const md = user?.user_metadata as
    | { desired_handle?: string; display_name?: string }
    | undefined;

  if (!user || !md?.desired_handle) return;

  const updates: { handle?: string; display_name?: string } = {
    handle: md.desired_handle,
  };
  if (md.display_name) updates.display_name = md.display_name;

  await supabase.from("profiles").update(updates).eq("id", user.id);
}
