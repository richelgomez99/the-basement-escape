import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { fetchNarration, type NarrationRow } from "@/game/narration";
import { supabase } from "@/integrations/supabase/client";

const MUTE_KEY = "be_narration_muted";

function getMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}
function setMuted(v: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUTE_KEY, v ? "1" : "0");
  window.dispatchEvent(new Event("be_mute"));
}

/**
 * Plays Puzzle Master narration for a given key. Polls the narrations table
 * until status="ready", then auto-plays (unless muted). Re-plays on key change.
 */
export function NarrationPlayer({
  narrationKey,
  autoplay = true,
  className = "",
}: {
  narrationKey: string;
  autoplay?: boolean;
  className?: string;
}) {
  const [row, setRow] = useState<NarrationRow | null>(null);
  const [muted, setMutedState] = useState(getMuted());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedRef = useRef<string>(""); // tracks which audio_url we've auto-played

  // Sync mute across components
  useEffect(() => {
    const h = () => setMutedState(getMuted());
    window.addEventListener("be_mute", h);
    return () => window.removeEventListener("be_mute", h);
  }, []);

  // Fetch + poll narration row
  useEffect(() => {
    let alive = true;
    let timer: number | undefined;

    async function tick() {
      const r = await fetchNarration(narrationKey);
      if (!alive) return;
      setRow(r);
      if (!r || r.status === "generating" || r.status === "pending") {
        timer = window.setTimeout(tick, 2000);
      }
    }
    tick();

    // Realtime subscription for instant update when admin regenerates
    const channel = supabase
      .channel(`narration-${narrationKey}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "narrations", filter: `key=eq.${narrationKey}` },
        (payload) => {
          if (alive && payload.new) setRow(payload.new as NarrationRow);
        },
      )
      .subscribe();

    return () => {
      alive = false;
      if (timer) window.clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [narrationKey]);

  // Auto-play when ready
  useEffect(() => {
    if (!autoplay || muted) return;
    if (row?.status !== "ready" || !row.audio_url) return;
    if (playedRef.current === row.audio_url) return;
    playedRef.current = row.audio_url;
    const a = audioRef.current;
    if (a) {
      a.currentTime = 0;
      // Browsers may block autoplay — silently fail.
      a.play().catch(() => {});
    }
  }, [row?.audio_url, row?.status, autoplay, muted]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (next && audioRef.current) audioRef.current.pause();
  }

  function replay() {
    const a = audioRef.current;
    if (a && row?.audio_url) {
      a.currentTime = 0;
      a.play().catch(() => {});
    }
  }

  const isLoading = !row || row.status === "generating" || row.status === "pending";
  const isError = row?.status === "error";

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {row?.audio_url && (
        <audio ref={audioRef} src={row.audio_url} preload="auto" />
      )}
      <button
        type="button"
        onClick={muted ? toggleMute : row?.audio_url ? replay : undefined}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-gold/40 bg-background/40 px-3 text-xs text-gold hover:bg-gold/10 disabled:opacity-50"
        disabled={isLoading || (!row?.audio_url && !muted)}
        title={
          muted
            ? "Unmute Puzzle Master"
            : isLoading
              ? "Generating narration…"
              : isError
                ? "Narration unavailable"
                : "Replay Puzzle Master"
        }
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Conjuring voice…</span>
          </>
        ) : muted ? (
          <>
            <VolumeX className="h-4 w-4" />
            <span>Muted</span>
          </>
        ) : (
          <>
            <Volume2 className="h-4 w-4" />
            <span>Puzzle Master</span>
          </>
        )}
      </button>
      {!isLoading && (
        <button
          type="button"
          onClick={toggleMute}
          className="text-xs text-muted-foreground hover:text-gold"
          title={muted ? "Unmute" : "Mute"}
        >
          {muted ? "unmute" : "mute"}
        </button>
      )}
    </div>
  );
}
