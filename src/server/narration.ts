import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import crypto from "crypto";

const PUZZLE_MASTER_VOICE_ID = "3e05zN2dtLwjhJY7rUhg";

function hashText(text: string): string {
  return crypto.createHash("sha256").update(text.trim()).digest("hex").slice(0, 16);
}

/**
 * Generate (or reuse cached) narration audio via ElevenLabs for a given key+text.
 * If the text hasn't changed since last generation, returns the existing URL.
 * Otherwise marks status=generating, calls ElevenLabs, uploads to storage, marks done.
 */
export const generateNarration = createServerFn({ method: "POST" })
  .inputValidator((input: { key: string; text: string }) => {
    if (!input?.key || typeof input.key !== "string") throw new Error("key required");
    if (!input?.text || typeof input.text !== "string") throw new Error("text required");
    if (input.text.length > 2000) throw new Error("text too long (max 2000 chars)");
    return input;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured");

    const { key, text } = data;
    const trimmed = text.trim();
    const newHash = hashText(trimmed);

    // Check existing row
    const { data: existing } = await supabaseAdmin
      .from("narrations")
      .select("text_hash, audio_url, status")
      .eq("key", key)
      .maybeSingle();

    if (existing && existing.text_hash === newHash && existing.audio_url && existing.status === "ready") {
      return { audioUrl: existing.audio_url, status: "ready" as const, cached: true };
    }

    // Mark as generating
    await supabaseAdmin.from("narrations").upsert({
      key,
      text_hash: newHash,
      text: trimmed,
      audio_url: existing?.audio_url ?? null,
      status: "generating",
      error: null,
      updated_at: new Date().toISOString(),
    });

    try {
      const ttsRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${PUZZLE_MASTER_VOICE_ID}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: trimmed,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.4,
              use_speaker_boost: true,
            },
          }),
        },
      );

      if (!ttsRes.ok) {
        const errBody = await ttsRes.text();
        throw new Error(`ElevenLabs TTS failed [${ttsRes.status}]: ${errBody.slice(0, 200)}`);
      }

      const audioBuffer = await ttsRes.arrayBuffer();
      const path = `${key}-${newHash}.mp3`;

      const { error: upErr } = await supabaseAdmin.storage
        .from("narrations")
        .upload(path, new Uint8Array(audioBuffer), {
          upsert: true,
          contentType: "audio/mpeg",
        });
      if (upErr) throw upErr;

      const { data: pub } = supabaseAdmin.storage.from("narrations").getPublicUrl(path);
      const audioUrl = pub.publicUrl;

      await supabaseAdmin.from("narrations").upsert({
        key,
        text_hash: newHash,
        text: trimmed,
        audio_url: audioUrl,
        status: "ready",
        error: null,
        updated_at: new Date().toISOString(),
      });

      return { audioUrl, status: "ready" as const, cached: false };
    } catch (err: any) {
      const message = err?.message ?? "Narration generation failed";
      await supabaseAdmin.from("narrations").upsert({
        key,
        text_hash: newHash,
        text: trimmed,
        audio_url: existing?.audio_url ?? null,
        status: "error",
        error: message,
        updated_at: new Date().toISOString(),
      });
      throw new Error(message);
    }
  });
