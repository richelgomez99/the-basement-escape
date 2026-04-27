import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Timer } from "@/components/game/Timer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPuzzles, getVaultCode, RECALL_PENALTY_SECONDS } from "@/game/content";
import { addPenalty, getSolved, isGameStarted, setFinished } from "@/game/state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LetterUnlockedDialog } from "@/components/game/LetterUnlockedDialog";

export const Route = createFileRoute("/vault")({
  head: () => ({ meta: [{ title: "The Final Vault — The Basement Escape" }] }),
  component: Vault,
});

function Vault() {
  const [code, setCode] = useState("");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");
  const [wrongPositions, setWrongPositions] = useState<Set<number>>(new Set());
  const [recallOpen, setRecallOpen] = useState(false);
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const navigate = useNavigate();
  const puzzles = getPuzzles();
  const wordLength = puzzles.length;

  useEffect(() => {
    if (!isGameStarted()) {
      navigate({ to: "/" });
      return;
    }
    if (getSolved().length < puzzles.length) {
      navigate({ to: "/door" });
    }
  }, [navigate, puzzles.length]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const guess = code.trim().toUpperCase();
    const answer = getVaultCode().toUpperCase();
    if (guess === answer) {
      setFinished(true, "victory");
      navigate({ to: "/victory" });
      return;
    }
    setShake(true);
    setError("The vault holds firm. Wrong letters glow red below.");
    const wrong = new Set<number>();
    for (let i = 0; i < wordLength; i++) {
      const ch = guess[i] || "";
      if (ch !== answer[i]) wrong.add(i);
    }
    setWrongPositions(wrong);
    setTimeout(() => setShake(false), 450);
  }

  const guess = code.trim().toUpperCase();

  return (
    <div className="min-h-screen px-4 py-6">
      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <Link to="/door">
          <Button variant="outline" size="sm" className="border-gold/40">
            ← Back to Door
          </Button>
        </Link>
        <Timer />
      </header>

      <main className="mx-auto mt-12 max-w-2xl text-center">
        <div className="font-display text-xs uppercase tracking-[0.3em] text-gold">
          Lock 10 of 10
        </div>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">The Final Vault</h1>
        <p className="mt-3 text-muted-foreground">
          Each lock you cracked gave you a single letter. Remember them all? Rearrange them in your
          head into one {wordLength}-letter word and type it below.
        </p>

        <div className="stone-panel mt-8 rounded-xl p-6">
          {/* Lock slots — letters are HIDDEN. Recall (with penalty) reveals them. */}
          <div>
            <div className="font-display text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
              The nine locks
            </div>
            <div className="grid grid-cols-9 gap-2">
              {puzzles.map((p) => (
                <div
                  key={p.id}
                  className="aspect-square rounded border border-gold/30 bg-background/40 flex flex-col items-center justify-center"
                >
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                    {p.id}
                  </div>
                  <div className="font-display text-xl text-gold/60">?</div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Letters are hidden — recall costs time, replays are free.
            </p>
          </div>

          {/* Per-position feedback after a wrong guess */}
          {wrongPositions.size > 0 && (
            <div className="mt-6">
              <div className="font-display text-[11px] uppercase tracking-widest text-muted-foreground mb-2">
                Your last guess
              </div>
              <div className="flex justify-center gap-2 flex-wrap">
                {Array.from({ length: wordLength }).map((_, i) => {
                  const ch = guess[i] || "";
                  const isWrong = wrongPositions.has(i);
                  return (
                    <div
                      key={i}
                      className={`h-12 w-10 rounded-md border-2 font-display text-xl flex items-center justify-center ${
                        ch
                          ? isWrong
                            ? "border-destructive bg-destructive/15 text-destructive"
                            : "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                          : "border-dashed border-gold/30 text-muted-foreground/40"
                      }`}
                    >
                      {ch || "_"}
                    </div>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Red = wrong letter in that slot. Green = correct so far.
              </p>
            </div>
          )}

          <form onSubmit={submit} className={`mt-6 space-y-3 ${shake ? "shake" : ""}`}>
            <Input
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
                setWrongPositions(new Set());
              }}
              maxLength={wordLength}
              placeholder={`The ${wordLength}-letter word`}
              className="h-14 text-center text-2xl font-display tracking-[0.4em] border-gold/40 bg-background/60"
            />
            {error && <div className="text-sm text-destructive">{error}</div>}
            <Button
              type="submit"
              className="w-full h-12 bg-gold text-gold-foreground hover:bg-gold/90 font-display tracking-widest"
            >
              UNLOCK THE VAULT
            </Button>
          </form>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => setRecallOpen(true)}
            >
              Forgot a letter? Recall (−2:00)
            </Button>
            <Link to="/door">
              <Button variant="outline" size="sm" className="border-gold/40">
                Replay a lock for free
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Dialog open={recallOpen} onOpenChange={setRecallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recall a letter</DialogTitle>
            <DialogDescription>
              Pick a lock — the Oracle reveals its letter for{" "}
              <strong className="text-destructive">−2 minutes</strong>. Or close this and head back
              to the Door to replay any solved lock for free.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2 py-2">
            {puzzles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  addPenalty(RECALL_PENALTY_SECONDS);
                  setRecallOpen(false);
                  setRevealedId(p.id);
                }}
                className="rounded border border-gold/50 bg-gold/5 p-3 text-center hover:bg-gold/15"
              >
                <div className="font-display text-xs uppercase tracking-widest text-muted-foreground">
                  Lock {p.id}
                </div>
                <div className="mt-1 font-display text-xl text-gold">?</div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecallOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(() => {
        const revealedPuzzle = revealedId ? puzzles.find((p) => p.id === revealedId) : null;
        if (!revealedPuzzle) return null;
        return (
          <LetterUnlockedDialog
            open={revealedId !== null}
            onClose={() => setRevealedId(null)}
            puzzleId={revealedPuzzle.id}
            totalPuzzles={puzzles.length}
            letter={revealedPuzzle.artifact}
            variant="recall"
          />
        );
      })()}
    </div>
  );
}
