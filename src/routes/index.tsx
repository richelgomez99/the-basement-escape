import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isGameStarted, resetGame, startGame } from "@/game/state";
import { getIntroText, loadOverridesFromCloud } from "@/game/content";
import { INTRO_KEY } from "@/game/narration";
import { NarrationPlayer } from "@/components/game/NarrationPlayer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [resetOpen, setResetOpen] = useState(false);
  const [confirmStartOpen, setConfirmStartOpen] = useState(false);
  const [inProgress, setInProgress] = useState(false);
  const [introText, setIntroText] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    setInProgress(isGameStarted());
    (async () => {
      await loadOverridesFromCloud();
      setIntroText(getIntroText());
    })();
  }, []);

  function begin(e: React.FormEvent) {
    e.preventDefault();
    if (!team.trim()) return;
    if (inProgress) {
      setConfirmStartOpen(true);
      return;
    }
    startGame(team.trim());
    navigate({ to: "/door" });
  }

  function confirmStart() {
    startGame(team.trim());
    setConfirmStartOpen(false);
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
        {introText && (
          <div className="mx-auto mt-6 max-w-2xl stone-panel rounded-xl p-5 text-left">
            <div className="font-display text-xs uppercase tracking-[0.3em] text-gold mb-2">
              The Puzzle Master speaks
            </div>
            <p className="text-sm md:text-base text-foreground/90 leading-relaxed italic">
              {stripNarrationTags(introText)}
            </p>
            <div className="mt-3">
              <NarrationPlayer narrationKey={INTRO_KEY} />
            </div>
          </div>
        )}
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
        {inProgress && (
          <Link
            to="/door"
            className="block text-center text-xs text-gold hover:underline"
          >
            ← Resume current game
          </Link>
        )}
      </form>

      <p className="mt-8 text-xs text-muted-foreground">
        Best played with one screen-share per team. The clock starts when you press BEGIN.
      </p>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset the game?</DialogTitle>
            <DialogDescription>
              This clears the current team's progress, timer, and solved locks. Puzzle content
              edits in /admin are not affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                resetGame();
                setInProgress(false);
                setResetOpen(false);
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmStartOpen} onOpenChange={setConfirmStartOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>A game is already in progress</DialogTitle>
            <DialogDescription>
              Starting a new game will erase the current team's progress and timer. Continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStartOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmStart}
            >
              Start new game
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
