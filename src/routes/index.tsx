import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startGame, resetGame } from "@/game/state";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Basement Escape — Glorious Church of God in Christ" },
      {
        name: "description",
        content:
          "A 60-minute virtual escape room experience hosted by Glorious Church of God in Christ.",
      },
      { property: "og:title", content: "The Basement Escape" },
      {
        property: "og:description",
        content: "Solve 9 sacred puzzles. Unlock the vault. Escape the basement.",
      },
    ],
  }),
  component: TitleScreen,
});

function TitleScreen() {
  const [team, setTeam] = useState("");
  const navigate = useNavigate();

  function begin(e: React.FormEvent) {
    e.preventDefault();
    if (!team.trim()) return;
    startGame(team.trim());
    navigate({ to: "/door" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="text-center">
        <div className="font-display text-xs uppercase tracking-[0.4em] text-gold candle-flicker">
          Glorious Church of God in Christ presents
        </div>
        <h1 className="mt-4 font-display text-5xl md:text-7xl text-foreground">
          The <span className="text-gold">Basement</span> Escape
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Nine locks bar the door. One hour on the clock. Solve every puzzle and find your way out.
        </p>
      </div>

      <form onSubmit={begin} className="stone-panel mt-12 w-full max-w-md rounded-xl p-6 space-y-4">
        <label className="font-display text-sm uppercase tracking-widest text-gold">
          Team Name
        </label>
        <Input
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          placeholder="The Lions of Judah"
          className="h-12 text-lg border-gold/40 bg-background/60"
          autoFocus
        />
        <Button
          type="submit"
          className="w-full h-12 text-lg bg-gold text-gold-foreground hover:bg-gold/90 font-display tracking-widest"
        >
          BEGIN
        </Button>
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset the game for a new team?")) resetGame();
          }}
          className="block w-full text-center text-xs text-muted-foreground hover:text-gold"
        >
          Reset game (host)
        </button>
      </form>

      <p className="mt-8 text-xs text-muted-foreground">
        Best played with one screen-share per team. The clock starts when you press BEGIN.
      </p>
    </div>
  );
}
