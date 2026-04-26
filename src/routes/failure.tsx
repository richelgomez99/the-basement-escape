import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getFailureConfig, loadOverridesFromCloud } from "@/game/content";
import { getTeamName, isFinished, resetGame, setFinished } from "@/game/state";
import { NarrationPlayer } from "@/components/game/NarrationPlayer";
import { FAILURE_KEY } from "@/game/narration";

export const Route = createFileRoute("/failure")({
  head: () => ({ meta: [{ title: "Time's Up — The Basement Escape" }] }),
  component: Failure,
});

function Failure() {
  const [team, setTeam] = useState("");
  const [cfg, setCfg] = useState(() => getFailureConfig());
  useEffect(() => {
    setTeam(getTeamName());
    // Backstop: if user landed here without the timer marking the session
    // as finished (e.g. fast nav, tab refresh), record the failure now.
    if (!isFinished()) setFinished(true, "failure");
    loadOverridesFromCloud().then(() => setCfg(getFailureConfig()));
    const onChange = () => setCfg(getFailureConfig());
    window.addEventListener("be_content", onChange);
    return () => window.removeEventListener("be_content", onChange);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
      <div className="font-display text-xs uppercase tracking-[0.4em] text-destructive">
        {cfg.eyebrow}
      </div>
      <h1 className="mt-4 font-display text-5xl md:text-7xl text-destructive">{cfg.title}</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Team <span className="font-display text-foreground">{team}</span> remains in the basement…
      </p>

      <div className="stone-panel mt-10 max-w-xl rounded-xl p-8">
        <div className="font-display text-xs uppercase tracking-widest text-gold">{cfg.bodyLabel}</div>
        <p className="mt-3 italic whitespace-pre-line">{cfg.body}</p>
        <div className="mt-4 flex justify-center">
          <NarrationPlayer narrationKey={FAILURE_KEY} />
        </div>
      </div>

      <Link to="/" className="mt-10">
        <Button
          onClick={() => resetGame()}
          className="bg-gold text-gold-foreground hover:bg-gold/90 font-display tracking-widest"
        >
          {cfg.buttonLabel}
        </Button>
      </Link>
    </div>
  );
}
