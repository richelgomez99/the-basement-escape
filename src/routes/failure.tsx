import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getTeamName, resetGame } from "@/game/state";

export const Route = createFileRoute("/failure")({
  head: () => ({ meta: [{ title: "Time's Up — The Basement Escape" }] }),
  component: Failure,
});

function Failure() {
  const [team, setTeam] = useState("");
  useEffect(() => setTeam(getTeamName()), []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
      <div className="font-display text-xs uppercase tracking-[0.4em] text-destructive">
        The hour has passed
      </div>
      <h1 className="mt-4 font-display text-5xl md:text-7xl text-destructive">Time's Up</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Team <span className="font-display text-foreground">{team}</span> remains in the basement…
      </p>

      <div className="stone-panel mt-10 max-w-xl rounded-xl p-8">
        <div className="font-display text-xs uppercase tracking-widest text-gold">Debrief</div>
        <p className="mt-3 italic">
          "Even when we run out of time, His mercy endures. What did your team learn together?"
        </p>
      </div>

      <Link to="/" className="mt-10">
        <Button
          onClick={() => resetGame()}
          className="bg-gold text-gold-foreground hover:bg-gold/90 font-display tracking-widest"
        >
          TRY AGAIN
        </Button>
      </Link>
    </div>
  );
}
