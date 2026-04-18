import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useCountdown } from "@/game/state";

export function Timer({ redirectOnZero = true }: { redirectOnZero?: boolean }) {
  const { remaining, formatted } = useCountdown();
  const navigate = useNavigate();

  useEffect(() => {
    if (redirectOnZero && remaining === 0) {
      navigate({ to: "/failure" });
    }
  }, [remaining, redirectOnZero, navigate]);

  const danger = remaining <= 60;
  const warn = remaining <= 5 * 60;

  return (
    <div
      className={`font-display text-2xl tabular-nums tracking-widest ${
        danger ? "text-destructive" : warn ? "text-gold" : "text-foreground"
      }`}
      aria-label="Time remaining"
    >
      {formatted}
    </div>
  );
}
