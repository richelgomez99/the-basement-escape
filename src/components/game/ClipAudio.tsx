import { useEffect, useRef } from "react";

/**
 * Audio player that auto-pauses at `endSec` and seeks to `startSec`.
 * If neither is set it behaves like a normal <audio controls>.
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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = Math.max(0, startSec ?? 0);
    const end = endSec && endSec > start ? endSec : undefined;

    const onLoaded = () => {
      if (start > 0 && el.currentTime < start) el.currentTime = start;
    };
    const onTime = () => {
      if (end !== undefined && el.currentTime >= end) {
        el.pause();
        el.currentTime = end;
      }
      if (start > 0 && el.currentTime < start) el.currentTime = start;
    };
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("timeupdate", onTime);
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("timeupdate", onTime);
    };
  }, [src, startSec, endSec]);

  return <audio ref={ref} controls src={src} className={className} preload="metadata" />;
}
