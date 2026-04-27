import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getVictoryConfig, loadOverridesFromCloud } from "@/game/content";
import { getElapsedFormatted, getTeamName, resetGame } from "@/game/state";
import { NarrationPlayer } from "@/components/game/NarrationPlayer";
import { VICTORY_KEY, stripNarrationTags } from "@/game/narration";

export const Route = createFileRoute("/victory")({
  head: () => ({ meta: [{ title: "Victory — The Basement Escape" }] }),
  component: Victory,
});

function Victory() {
  const [team, setTeam] = useState("");
  const [time, setTime] = useState("00:00");
  const [cfg, setCfg] = useState(() => getVictoryConfig());
  useEffect(() => {
    setTeam(getTeamName());
    setTime(getElapsedFormatted());
    loadOverridesFromCloud().then(() => setCfg(getVictoryConfig()));
    const onChange = () => setCfg(getVictoryConfig());
    window.addEventListener("be_content", onChange);
    return () => window.removeEventListener("be_content", onChange);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10 text-center">
      <div className="font-display text-xs uppercase tracking-[0.4em] text-gold candle-flicker">
        {stripNarrationTags(cfg.eyebrow)}
      </div>
      <h1 className="mt-4 font-display text-5xl md:text-7xl text-gold">{stripNarrationTags(cfg.title)}</h1>
      <p className="mt-4 text-xl">
        <span className="text-muted-foreground">Team </span>
        <span className="font-display">{team}</span>
        <span className="text-muted-foreground"> escaped in </span>
        <span className="font-display text-gold">{time}</span>
      </p>

      <div className="stone-panel mt-10 max-w-xl rounded-xl p-8">
        <div className="font-display text-xs uppercase tracking-widest text-gold">{stripNarrationTags(cfg.bodyLabel)}</div>
        <p className="mt-3 font-display text-xl md:text-2xl whitespace-pre-line">{stripNarrationTags(cfg.body)}</p>
        <div className="mt-4 flex justify-center">
          <NarrationPlayer narrationKey={VICTORY_KEY} />
        </div>
      </div>

      <Link to="/" className="mt-10">
        <Button
          onClick={() => resetGame()}
          className="bg-gold text-gold-foreground hover:bg-gold/90 font-display tracking-widest"
        >
          {stripNarrationTags(cfg.buttonLabel)}
        </Button>
      </Link>
    </div>
  );
}
