import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isClockPaused, isFinished, isGameStarted, setFinished, useCountdown } from "@/game/state";
import { startTicker, stopTicker } from "@/game/sfx";

export function Timer({ redirectOnZero = true }: { redirectOnZero?: boolean }) {
  const { remaining, formatted } = useCountdown();
  const navigate = useNavigate();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const refresh = () => setPaused(isClockPaused());
    refresh();
    const i = window.setInterval(refresh, 300);
    window.addEventListener("be_state", refresh);
    return () => {
      window.clearInterval(i);
      window.removeEventListener("be_state", refresh);
    };
  }, []);

  // Tick SFX in the final minute (paused = no ticking).
  useEffect(() => {
    if (paused) {
      stopTicker();
      return;
    }
    if (remaining > 0 && remaining <= 60 && isGameStarted() && !isFinished()) {
      startTicker();
    } else {
      stopTicker();
    }
    return () => stopTicker();
  }, [remaining, paused]);

  useEffect(() => {
    if (
      redirectOnZero &&
      remaining === 0 &&
      isGameStarted() &&
      !isFinished()
    ) {
      setFinished(true, "failure");
      navigate({ to: "/failure" });
    }
  }, [remaining, redirectOnZero, navigate]);


  const danger = remaining <= 60;
  const warn = remaining <= 5 * 60;

  return (
    <div className="flex flex-col items-end leading-tight">
      <div
        className={`font-display text-2xl tabular-nums tracking-widest ${
          paused
            ? "text-gold/70"
            : danger
              ? "text-destructive"
              : warn
                ? "text-gold"
                : "text-foreground"
        }`}
        aria-label="Time remaining"
      >
        {formatted}
      </div>
      {paused && (
        <div className="text-[10px] uppercase tracking-[0.2em] text-gold/70 animate-pulse">
          ◼ paused — narration
        </div>
      )}
    </div>
  );
}
