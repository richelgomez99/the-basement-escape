import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isClockPaused, isFinished, isGameStarted, useCountdown } from "@/game/state";

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

  useEffect(() => {
    if (
      redirectOnZero &&
      remaining === 0 &&
      isGameStarted() &&
      !isFinished()
    ) {
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
