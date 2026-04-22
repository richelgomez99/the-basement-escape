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
  const [recallOpen, setRecallOpen] = useState(false);
  const [revealedId, setRevealedId] = useState<number | null>(null);
  const navigate = useNavigate();
  const puzzles = getPuzzles();

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
    if (code.trim().toUpperCase() === getVaultCode().toUpperCase()) {
      setFinished(true);
      navigate({ to: "/victory" });
    } else {
      setShake(true);
      setError("The vault holds firm. Check your artifacts.");
      setTimeout(() => setShake(false), 450);
    }
  }

  const revealedPuzzle = revealedId ? puzzles.find((p) => p.id === revealedId) : null;

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
          Combine your nine artifacts in the order they were earned.
        </p>

        <div className="stone-panel mt-8 rounded-xl p-6">
          <div className="grid grid-cols-9 gap-2">
            {puzzles.map((p) => (
              <div
                key={p.id}
                className="aspect-square rounded border border-gold/30 bg-background/40 flex items-center justify-center font-display text-lg text-muted-foreground/40"
              >
                {p.id}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            (Nine letters — one per lock, in order. Type them below.)
          </p>

          <form onSubmit={submit} className={`mt-6 space-y-3 ${shake ? "shake" : ""}`}>
            <Input
              autoFocus
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError("");
              }}
              maxLength={puzzles.length}
              placeholder={`${puzzles.length}-character code`}
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
              <strong className="text-destructive">−2 minutes</strong>. Or close this and head back to
              the Door to replay any solved lock for free.
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

      {revealedPuzzle && (
        <LetterUnlockedDialog
          open={revealedId !== null}
          onClose={() => setRevealedId(null)}
          puzzleId={revealedPuzzle.id}
          totalPuzzles={puzzles.length}
          letter={revealedPuzzle.artifact}
          variant="recall"
        />
      )}
    </div>
  );
}
