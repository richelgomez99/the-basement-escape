// Client-side narration helpers + default intro story.
import { supabase } from "@/integrations/supabase/client";

export const DEFAULT_INTRO_TEXT =
  "You wake in the basement of an old church. The door is sealed by nine sacred locks, and the clock above is already counting down. Each lock guards a letter. Solve every puzzle, gather every letter, and you will then unscramble them to form the word that sets you free. Trust the scriptures. Trust each other. The hour begins now.";

export const INTRO_KEY = "intro";
export const puzzleNarrationKey = (id: number) => `puzzle-${id}-flavor`;

/**
 * Remove ElevenLabs v3 inline audio direction tags like [whispers],
 * [mischievously], [sarcastic], [excited], etc. so they don't appear in
 * on-screen text. The raw text (with tags) is still sent to TTS.
 */
export function stripNarrationTags(text: string): string {
  if (!text) return text;
  return text
    .replace(/\[[^\]\n]{1,40}\]/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([.,!?;:])/g, "$1")
    .trim();
}

export type NarrationRow = {
  key: string;
  text_hash: string;
  text: string;
  audio_url: string | null;
  status: "pending" | "generating" | "ready" | "error";
  error: string | null;
  updated_at: string;
};

export async function fetchNarration(key: string): Promise<NarrationRow | null> {
  const { data } = await supabase
    .from("narrations")
    .select("*")
    .eq("key", key)
    .maybeSingle();
  return (data as NarrationRow | null) ?? null;
}

export async function fetchAllNarrations(): Promise<NarrationRow[]> {
  const { data } = await supabase.from("narrations").select("*");
  return (data as NarrationRow[] | null) ?? [];
}
