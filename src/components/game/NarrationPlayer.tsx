import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { fetchNarration, type NarrationRow } from "@/game/narration";
import { supabase } from "@/integrations/supabase/client";
import { pauseClock, resumeClock } from "@/game/state";

const MUTE_KEY = "be_narration_muted";
const PLAYED_KEY_PREFIX = "be_narration_played:";

function hasPlayedBefore(key: string): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PLAYED_KEY_PREFIX + key) === "1";
}
function markPlayed(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLAYED_KEY_PREFIX + key, "1");
}

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
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedRef = useRef<string>(""); // tracks which audio_url we've auto-played

  // Sync mute across components
  useEffect(() => {
    const h = () => setMutedState(getMuted());
    window.addEventListener("be_mute", h);
    return () => window.removeEventListener("be_mute", h);
  }, []);

  // Fetch + (only while actively generating) poll narration row.
  // We do NOT poll when the row is missing — admin pre-generates audio,
  // and realtime subscription will pick it up if/when it appears.
  useEffect(() => {
    let alive = true;
    let timer: number | undefined;

    async function tick() {
      const r = await fetchNarration(narrationKey);
      if (!alive) return;
      setRow(r);
      // Only keep polling while a generation is actively in progress.
      if (r && (r.status === "generating" || r.status === "pending")) {
        timer = window.setTimeout(tick, 2000);
      }
    }
    tick();

    // Realtime subscription so admin-triggered generation reaches players instantly.
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

  // Track whether the *current* playback was a clock-pausing first play.
  const pausingRef = useRef(false);

  function handleAudioEnded() {
    setPlaying(false);
    if (pausingRef.current) {
      pausingRef.current = false;
      resumeClock();
    }
  }

  function handleAudioPlay() {
    setPlaying(true);
    if (pausingRef.current) pauseClock();
  }

  function handleAudioPause() {
    setPlaying(false);
  }

  // Pause the clock during EVERY auto-play of narration (resume on end / mute / unmount).
  // Manual replays do NOT pause the clock.
  useEffect(() => {
    if (!autoplay || muted) return;
    if (row?.status !== "ready" || !row.audio_url) return;
    if (playedRef.current === row.audio_url) return;
    playedRef.current = row.audio_url;
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = 0;
    pauseClock();
    pausingRef.current = true;
    a.play()
      .then(() => {
        markPlayed(narrationKey);
      })
      .catch(() => {
        // Autoplay blocked — don't keep clock paused waiting for a play that never happens.
        if (pausingRef.current) {
          pausingRef.current = false;
          resumeClock();
        }
      });
  }, [row?.audio_url, row?.status, autoplay, muted, narrationKey]);

  // Safety: if component unmounts mid-first-play, resume clock.
  useEffect(() => {
    return () => {
      if (pausingRef.current) {
        pausingRef.current = false;
        resumeClock();
      }
    };
  }, []);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
    if (next && audioRef.current) audioRef.current.pause();
    if (next && pausingRef.current) {
      pausingRef.current = false;
      resumeClock();
    }
  }

  function togglePlay() {
    const a = audioRef.current;
    if (!a || !row?.audio_url) return;
    if (playing) {
      a.pause();
      // If first auto-play is interrupted by user pause, resume the clock.
      if (pausingRef.current) {
        pausingRef.current = false;
        resumeClock();
      }
    } else {
      // Manual play (resume or replay) — never pauses the clock.
      a.play().catch(() => {});
    }
  }

  function replay() {
    const a = audioRef.current;
    if (a && row?.audio_url) {
      a.currentTime = 0;
      a.play().catch(() => {});
    }
  }

  // Generation only happens admin-side. From the player's POV:
  //   - row missing → silently render nothing
  //   - row generating → show subtle loader
  //   - row ready → show play / mute controls
  const generating = row?.status === "generating" || row?.status === "pending";
  const isError = row?.status === "error";

  // Hide entirely until admin has generated something for this key.
  if (!row && !generating) return null;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {row?.audio_url && (
        <audio
          ref={audioRef}
          src={row.audio_url}
          preload="auto"
          onPlay={handleAudioPlay}
          onEnded={handleAudioEnded}
        />
      )}
      <button
        type="button"
        onClick={muted ? toggleMute : row?.audio_url ? replay : undefined}
        className="inline-flex h-9 items-center gap-2 rounded-md border border-gold/40 bg-background/40 px-3 text-xs text-gold hover:bg-gold/10 disabled:opacity-50"
        disabled={generating || (!row?.audio_url && !muted)}
        title={
          muted
            ? "Unmute Puzzle Master"
            : generating
              ? "Generating narration…"
              : isError
                ? "Narration unavailable"
                : "Replay Puzzle Master"
        }
      >
        {generating ? (
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
      {!generating && (
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
