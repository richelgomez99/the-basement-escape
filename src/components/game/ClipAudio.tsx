import { useEffect, useRef, useState } from "react";

/**
 * Audio player that auto-pauses at `endSec` and seeks to `startSec`.
 * Displays clip duration (end - start) instead of full file length, and
 * allows replay after reaching the clip end by rewinding to start.
 */
export function ClipAudio({
  src,
  startSec,
  endSec,
  className,
}: {
  src: string;
  startSec?: number;
  endSec?: number;
  className?: string;
}) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [fileDuration, setFileDuration] = useState<number | null>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);

  const start = Math.max(0, startSec ?? 0);
  const hasEnd = endSec !== undefined && endSec > start;
  const end = hasEnd ? (endSec as number) : fileDuration ?? 0;
  const clipDuration = Math.max(0, end - start);
  const clipPos = Math.max(0, Math.min(clipDuration, current - start));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onLoaded = () => {
      setFileDuration(el.duration || null);
      if (start > 0 && el.currentTime < start) el.currentTime = start;
    };
    const onTime = () => {
      if (hasEnd && el.currentTime >= (endSec as number)) {
        el.pause();
        // Rewind so the user can press play again to replay the clip.
        el.currentTime = start;
        setCurrent(start);
        setPlaying(false);
        return;
      }
      if (start > 0 && el.currentTime < start) el.currentTime = start;
      setCurrent(el.currentTime);
    };
    const onPlay = () => {
      // If we're past the clip window, rewind before playing.
      if (hasEnd && el.currentTime >= (endSec as number)) el.currentTime = start;
      if (el.currentTime < start) el.currentTime = start;
      setPlaying(true);
    };
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      el.currentTime = start;
      setCurrent(start);
      setPlaying(false);
    };

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnded);
    };
  }, [src, start, endSec, hasEnd]);

  function fmt(s: number) {
    if (!isFinite(s) || s < 0) s = 0;
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  function toggle() {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      if (hasEnd && el.currentTime >= (endSec as number)) el.currentTime = start;
      if (el.currentTime < start) el.currentTime = start;
      void el.play();
    } else {
      el.pause();
    }
  }

  function seek(e: React.ChangeEvent<HTMLInputElement>) {
    const el = ref.current;
    if (!el) return;
    const rel = Number(e.target.value);
    el.currentTime = start + rel;
    setCurrent(el.currentTime);
  }

  return (
    <div className={`flex items-center gap-2 rounded border border-border bg-background/60 p-2 ${className ?? ""}`}>
      <audio ref={ref} src={src} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={toggle}
        className="h-8 w-8 shrink-0 rounded-full bg-gold text-gold-foreground text-xs font-bold hover:bg-gold/90"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "❚❚" : "▶"}
      </button>
      <input
        type="range"
        min={0}
        max={clipDuration || 0}
        step={0.1}
        value={clipPos}
        onChange={seek}
        className="flex-1 accent-gold"
        disabled={clipDuration <= 0}
      />
      <span className="text-xs tabular-nums text-muted-foreground shrink-0">
        {fmt(clipPos)} / {fmt(clipDuration)}
      </span>
    </div>
  );
}
